import os
import argparse
import sys
import logging
from backend.processing_service import process_audio_file

# Setup logging for CLI usage
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def main():
    parser = argparse.ArgumentParser(description="End-to-End processing for Dad's Reader")
    parser.add_argument("input_file", help="Path to the input audio file (.mp3, .m4b)")
    parser.add_argument("--staging-dir", default="staging", help="Base staging directory")
    args = parser.parse_args()

    try:
        result = process_audio_file(args.input_file, args.staging_dir)
        print(f"\n--- Done! Project ready at {result['staging_dir']} ---")
        print(f"Transcript: {result['transcript_path']}")
        print(f"Audio file: {result['audio_path']}")
        print("\nRun the backend and frontend to view!")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
