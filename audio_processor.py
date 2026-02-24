import os
import json
import logging
from pathlib import Path
import ffmpeg

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AudioProcessor:
    """
    A robust pipeline to ingest, standardize, and chunk audiobook files
    (.mp3, .m4b) for downstream machine learning processing.
    """
    
    ALLOWED_EXTENSIONS = {'.mp3', '.m4b'}
    
    def __init__(self, output_dir: str = "staging"):
        """
        Initialize the processor with a designated staging directory.
        
        Args:
            output_dir: The directory where processed chunks and metadata will be saved.
        """
        self.output_dir = Path(output_dir)
        # Create staging directory if it doesn't exist
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def _validate_file(self, file_path: Path) -> bool:
        """Check if the file is valid and has an allowed extension."""
        if not file_path.exists() or not file_path.is_file():
            logger.error(f"File not found: {file_path}")
            return False
            
        if file_path.suffix.lower() not in self.ALLOWED_EXTENSIONS:
            logger.error(f"Unsupported file extension: {file_path.suffix}. Allowed: {self.ALLOWED_EXTENSIONS}")
            return False
            
        return True

    def _extract_metadata(self, file_path: Path) -> dict:
        """
        Extract structural metadata (including chapters) using ffprobe.
        """
        logger.info(f"Extracting metadata from {file_path.name}")
        try:
            probe = ffmpeg.probe(str(file_path))
            
            # Extract basic format info
            format_info = probe.get('format', {})
            duration = format_info.get('duration')
            
            # Extract chapter info
            chapters = probe.get('chapters', [])
            
            metadata = {
                'original_filename': file_path.name,
                'duration_seconds': float(duration) if duration else None,
                'format': format_info.get('format_name'),
                'chapters': chapters
            }
            return metadata
            
        except ffmpeg.Error as e:
            logger.error(f"ffprobe error extracting metadata from {file_path.name}")
            if e.stderr:
                logger.error(f"stderr: {e.stderr.decode('utf8')}")
            raise RuntimeError(f"Failed to extract metadata: Corrupted or invalid file.") from e

    def _save_metadata(self, metadata: dict, output_path: Path):
        """Save metadata as a JSON file."""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=4)
        logger.info(f"Saved metadata to {output_path.name}")

    def _process_and_chunk(self, file_path: Path, output_subdir: Path):
        """
        Convert to 16kHz mono .wav and split into 10-minute (600s) chunks.
        """
        logger.info(f"Converting and chunking {file_path.name}")
        
        # Output pattern for the chunks: chunk_000.wav, chunk_001.wav, etc.
        output_pattern = str(output_subdir / 'chunk_%03d.wav')
        
        try:
            # -ac 1: mono
            # -ar 16000: 16kHz sample rate
            # -f segment: chunk output
            # -segment_time 600: 10 minutes (600 seconds)
            # -c:a pcm_s16le: standard wav format
            (
                ffmpeg
                .input(str(file_path))
                .output(
                    output_pattern,
                    format='segment',
                    segment_time=600,
                    acodec='pcm_s16le',
                    ac=1,
                    ar=16000
                )
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            logger.info("Successfully converted and chunked audio.")
        except ffmpeg.Error as e:
            logger.error(f"ffmpeg error processing {file_path.name}")
            if e.stderr:
                logger.error(f"stderr: {e.stderr.decode('utf8')}")
            raise RuntimeError(f"Failed to process and chunk audio: Corrupted or invalid file.") from e


    def process(self, file_path_str: str):
        """
        Main entry point to process a single audio file.
        
        Args:
            file_path_str: Path to the input audio file (.mp3, .m4b).
        """
        file_path = Path(file_path_str)
        
        if not self._validate_file(file_path):
            return
            
        # Create a dedicated subdirectory for this file's outputs within the staging dir
        base_name = file_path.stem
        file_out_dir = self.output_dir / base_name
        file_out_dir.mkdir(exist_ok=True)
        
        try:
            # 1. Extract and save metadata
            metadata = self._extract_metadata(file_path)
            metadata_path = file_out_dir / 'metadata.json'
            self._save_metadata(metadata, metadata_path)
            
            # 2. Convert and chunk audio
            self._process_and_chunk(file_path, file_out_dir)
            
            logger.info(f"Completed processing for {file_path.name}. Outputs at: {file_out_dir}")
            
        except Exception as e:
            logger.error(f"Processing failed for {file_path.name}: {e}")

if __name__ == "__main__":
    # Provides a simple CLI to process a file 
    import sys
    
    if len(sys.argv) > 1:
        test_file = sys.argv[1]
        processor = AudioProcessor(output_dir="staging")
        processor.process(test_file)
    else:
        print("Usage: python audio_processor.py <path_to_audio_file>")
