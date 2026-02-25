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

    # Determine backend
    backend = "mlx"
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
                backend = config.get("transcription", {}).get("backend", "mlx").lower()
        except Exception as e:
            print(f"Warning: Could not read config.json, defaulting to mlx. Error: {e}")
    else:
        # Fallback to env var if config doesn't exist for backwards compatibility during transition
        backend = os.environ.get("WHISPER_BACKEND", "mlx").lower()

    print(f"Using Whisper backend: {backend}")

    if backend == "mlx":
        import mlx_whisper
        model_repo = "mlx-community/whisper-large-v3-mlx"
        print(f"Loading mlx-whisper model: {model_repo}...")
    elif backend == "faster":
        from faster_whisper import WhisperModel
        model_size = "large-v3"
        print(f"Loading faster-whisper model: {model_size}...")
        # device="cpu" is safer/more common for faster-whisper on Mac unless specifically set up for MPS
        # compute_type="float32" is recommended for CPU
        model = WhisperModel(model_size, device="cpu", compute_type="float32")
    else:
        raise ValueError(f"Unsupported Whisper backend: {backend}")

    for idx, chunk_file in enumerate(chunk_files):
        print(f"\nProcessing chunk: {os.path.basename(chunk_file)}")
        print(f"Current timeline offset: {current_time_offset:.3f}s")
        
        if progress_callback:
            percent_auth = 15 + ((idx / total_chunks) * 80)
            progress_callback(percent_auth, f"Transcribing chunk {idx + 1}/{total_chunks}...")
        
        if backend == "mlx":
            result = mlx_whisper.transcribe(
                chunk_file,
                path_or_hf_repo=model_repo,
                language="es",
                word_timestamps=True
            )
            
            if 'segments' in result:
                for segment in result['segments']:
                    segment_data = {
                        "text": segment.get('text', '').strip(),
                        "start": round(segment.get('start', 0.0) + current_time_offset, 3),
                        "end": round(segment.get('end', 0.0) + current_time_offset, 3),
                        "words": []
                    }
                    if 'words' in segment:
                        for word_info in segment['words']:
                            segment_data["words"].append({
                                "text": word_info['word'].strip(),
                                "start": round(word_info['start'] + current_time_offset, 3),
                                "end": round(word_info['end'] + current_time_offset, 3)
                            })
                    if segment_data["text"] or segment_data["words"]:
                        combined_transcript.append(segment_data)
        
        elif backend == "faster":
            # faster-whisper returns a generator of segments
            segments, info = model.transcribe(chunk_file, language="es", word_timestamps=True)
            
            for segment in segments:
                segment_data = {
                    "text": segment.text.strip(),
                    "start": round(segment.start + current_time_offset, 3),
                    "end": round(segment.end + current_time_offset, 3),
                    "words": []
                }
                if segment.words:
                    for word in segment.words:
                        segment_data["words"].append({
                            "text": word.word.strip(),
                            "start": round(word.start + current_time_offset, 3),
                            "end": round(word.end + current_time_offset, 3)
                        })
                if segment_data["text"] or segment_data["words"]:
                    combined_transcript.append(segment_data)

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
