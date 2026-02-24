import os
import glob
import json
import wave
import mlx_whisper

def get_wav_duration(filepath):
    """Returns the duration of a WAV file in seconds."""
    with wave.open(filepath, 'rb') as wav_file:
        frames = wav_file.getnframes()
        rate = wav_file.getframerate()
        duration = frames / float(rate)
        return duration

def transcribe_chunks(staging_dir, output_filepath, progress_callback=None):
    """
    Transcribes all WAV chunks in the staging directory and outputs a combined
    JSON transcript with word-level timestamps.
    """
    # Find all .wav files and sort them alphabetically
    chunk_files = sorted(glob.glob(os.path.join(staging_dir, "*.wav")))
    
    if not chunk_files:
        print(f"No .wav files found in {staging_dir}")
        return

    combined_transcript = []
    current_time_offset = 0.0
    total_chunks = len(chunk_files)

    print("Loading mlx-whisper model...")
    # Using mlx-community/whisper-large-v3-mlx for best transcription fidelity
    model_repo = "mlx-community/whisper-large-v3-mlx"

    for idx, chunk_file in enumerate(chunk_files):
        print(f"\nProcessing chunk: {os.path.basename(chunk_file)}")
        print(f"Current timeline offset: {current_time_offset:.3f}s")
        
        if progress_callback:
            # Map chunk progress to 15% -> 95% overall progress
            # 80% of total progress is dedicated to transcription
            percent_auth = 15 + ((idx / total_chunks) * 80)
            progress_callback(percent_auth, f"Transcribing chunk {idx + 1}/{total_chunks}...")
        
        # Transcribe the chunk with mlx_whisper
        # Using word_timestamps=True and language="es" as required
        result = mlx_whisper.transcribe(
            chunk_file,
            path_or_hf_repo=model_repo,
            language="es",
            word_timestamps=True
        )

        # Extract and adjust word timestamps
        if 'segments' in result:
            for segment in result['segments']:
                if 'words' in segment:
                    for word_info in segment['words']:
                        adjusted_start = word_info['start'] + current_time_offset
                        adjusted_end = word_info['end'] + current_time_offset
                        
                        combined_transcript.append({
                            "text": word_info['word'].strip(),
                            "start": round(adjusted_start, 3),
                            "end": round(adjusted_end, 3)
                        })

        # Update the running time offset using the exact duration of the WAV file
        chunk_duration = get_wav_duration(chunk_file)
        current_time_offset += chunk_duration

    # Export to JSON
    with open(output_filepath, 'w', encoding='utf-8') as f:
        json.dump(combined_transcript, f, ensure_ascii=False, indent=2)
    
    print(f"\nSuccessfully saved synchronized combined transcript to {output_filepath}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Transcribe audio chunks natively on Apple Silicon using mlx-whisper.")
    parser.add_argument("--staging-dir", default="staging", help="Directory containing the .wav chunks.")
    parser.add_argument("--output", default="transcript.json", help="Output JSON file path.")
    args = parser.parse_args()
    
    # Ensure staging dir exists
    if not os.path.isdir(args.staging_dir):
        print(f"Creating staging directory: {args.staging_dir}")
        os.makedirs(args.staging_dir, exist_ok=True)
        
    transcribe_chunks(args.staging_dir, args.output)
