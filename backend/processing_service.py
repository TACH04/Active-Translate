import os
import shutil
import logging
import sys

# Add the project root to sys.path so we can import modules from the parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from audio_processor import AudioProcessor
from transcriber import transcribe_chunks

logger = logging.getLogger(__name__)

def process_audio_file(input_file: str, staging_dir: str = "staging", progress_callback=None):
    """
    Unified pipeline to process an audio file: chunking, transcribing, and setting up for playback.
    """
    if not os.path.exists(input_file):
        raise FileNotFoundError(f"Input file {input_file} does not exist.")

    def report_progress(progress: float, message: str):
        if progress_callback:
            progress_callback(progress, message)

    # 1. Chunk audio
    logger.info("Starting Phase 1: Audio Processing")
    report_progress(5, "Extracting audio chunks...")
    processor = AudioProcessor(output_dir=staging_dir)
    processor.process(input_file)

    # Note: AudioProcessor creates a subdirectory named after the file stem.
    base_name = os.path.splitext(os.path.basename(input_file))[0]
    project_staging_dir = os.path.join(staging_dir, base_name)
    
    if not os.path.exists(project_staging_dir):
        raise RuntimeError(f"Processing failed: Directory {project_staging_dir} not created.")

    # 2. Transcribe
    logger.info("Starting Phase 2: Transcription")
    report_progress(15, "Starting transcription...")
    output_transcript = os.path.join(project_staging_dir, "transcript.json")
    transcribe_chunks(project_staging_dir, output_transcript, progress_callback=report_progress)
    
    # 3. Save a copy of the original audio file for easy playback
    logger.info("Starting Phase 3: Preparing Playback Media")
    report_progress(95, "Finalizing playback media...")
    file_ext = os.path.splitext(input_file)[1]
    project_audio_path = os.path.join(project_staging_dir, f"original_audio{file_ext}")
    
    if not os.path.exists(project_audio_path):
        shutil.copy2(os.path.abspath(input_file), os.path.abspath(project_audio_path))
        logger.info(f"Copied original media to {project_audio_path}")

    report_progress(100, "Processing complete")
    return {
        "project_id": base_name,
        "staging_dir": project_staging_dir,
        "transcript_path": output_transcript,
        "audio_path": project_audio_path
    }
