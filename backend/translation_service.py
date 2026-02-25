import json
import logging
import asyncio
import os
from concurrent.futures import ThreadPoolExecutor
import torch
from transformers import MarianMTModel, MarianTokenizer

logger = logging.getLogger(__name__)

# Model config
def get_translation_model():
    model_name = "Helsinki-NLP/opus-mt-es-en"
    config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
                model_name = config.get("translation", {}).get("model", model_name)
        except Exception as e:
            logger.warning(f"Could not read config.json, defaulting to {model_name}. Error: {e}")
    return model_name

MODEL_NAME = get_translation_model()

class LocalTranslator:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"
        self._is_loaded = False

    def load_model(self):
        if not self._is_loaded:
            logger.info(f"Loading local translation model {MODEL_NAME} on {self.device}...")
            self.tokenizer = MarianTokenizer.from_pretrained(MODEL_NAME)
            self.model = MarianMTModel.from_pretrained(MODEL_NAME).to(self.device)
            self._is_loaded = True
            logger.info("Translation model loaded successfully.")

    def translate(self, text: str) -> str:
        """
        Translates a single sentence using the local Hugging Face model.
        The user explicitly requested translating one sentence at a time for best results.
        """
        if not text or not text.strip():
            return ""
            
        self.load_model()
        
        try:
            # Tokenize and translate
            inputs = self.tokenizer(text, return_tensors="pt", padding=True).to(self.device)
            translated = self.model.generate(**inputs)
            result = self.tokenizer.batch_decode(translated, skip_special_tokens=True)[0]
            return result
        except Exception as e:
            logger.error(f"Translation error for text '{text[:20]}...': {e}")
            return "*** Translation failed ***"

# Singleton instance
_translator = LocalTranslator()
# Use a thread pool to avoid blocking the main event loop
_executor = ThreadPoolExecutor(max_workers=2) # Keep max workers low for local ML models to prevent memory overload

def translate_text_sync(text: str) -> str:
    """Synchronous translation of a single string."""
    return _translator.translate(text)

async def translate_text_async(text: str) -> str:
    """Asynchronous translation of a single string."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(_executor, translate_text_sync, text)

def translate_transcript_sync(file_path: str, progress_callback=None):
    """
    Translates all segments in a transcript JSON file synchronously.
    Updates the file in place by adding a 'translation' field to each segment.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        total_segments = len(data)
        if total_segments == 0:
            return

        # Pre-load the model before starting the loop so the time isn't counted against the first progress tick
        _translator.load_model()

        for idx, segment in enumerate(data):
            # Only translate if there's text and it hasn't been translated yet
            if 'text' in segment and 'translation' not in segment:
                # The model performs best on single sentences, and since our `text`
                # field correlates to sentences coming out of mlx-whisper segments,
                # this meets the requirement perfectly.
                segment['translation'] = translate_text_sync(segment['text'])
                
            if progress_callback:
                # Map segment progress to 85% -> 100% overall progress
                percent_auth = 85 + ((idx / total_segments) * 15)
                progress_callback(percent_auth, f"Translating piece {idx + 1}/{total_segments}...")
                
        # Save back the translated file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
    except Exception as e:
        logger.error(f"Failed to translate transcript {file_path}: {e}")
        if progress_callback:
            progress_callback(85, "Translation failed, continuing...")
