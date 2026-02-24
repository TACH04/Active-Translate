import os
import subprocess
from pathlib import Path
from audio_processor import AudioProcessor

def create_dummy_audio(filename="dummy_test.mp3", duration=15):
    """Create a dummy sine wave audio file using ffmpeg."""
    print(f"Creating dummy audio file: {filename}")
    try:
        subprocess.run([
            "ffmpeg", "-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=15",
            # Add some dummy metadata
            "-metadata", "title=Dummy Test",
            "-metadata", "artist=Test Artist",
            filename
        ], check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error creating dummy audio: {e.stderr.decode()}")
        return False

def test_pipeline():
    test_file = "dummy_test.mp3"
    staging_dir = "staging"
    
    # 1. Create a dummy file
    if not create_dummy_audio(test_file):
        print("Failed to setup test. Exiting.")
        return
        
    print(f"Dummy file created: {test_file}")
    
    # 2. Run processor
    print("Running AudioProcessor pipeline...")
    processor = AudioProcessor(output_dir=staging_dir)
    processor.process(test_file)
    
    # 3. Verify output
    base_name = Path(test_file).stem
    out_dir = Path(staging_dir) / base_name
    
    if not out_dir.exists():
        print(f"FAILED: Output directory {out_dir} was not created.")
        return
        
    files = list(out_dir.glob("*"))
    print(f"\nFiles generated in {out_dir}:")
    for f in files:
        print(f" - {f.name} ({f.stat().st_size} bytes)")
        
    metadata_file = out_dir / "metadata.json"
    if metadata_file.exists():
        print("\nMetadata content:")
        with open(metadata_file) as m:
            print(m.read())
    else:
        print("FAILED: metadata.json missing.")
        
    # Clean up test file
    os.remove(test_file)
    print("\nTest completed successfully.")

if __name__ == "__main__":
    test_pipeline()
