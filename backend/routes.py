from fastapi import APIRouter, Request, HTTPException, status, UploadFile, File, BackgroundTasks
from services import stream_media_file, get_transcript_data
from processing_service import process_audio_file
import os
import glob
import shutil

router = APIRouter()

# Setup a base data directory relative to the current file
# We want to point to the `staging` directory at the project root.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STAGING_DIR = os.path.join(BASE_DIR, "staging")
TEMP_DIR = os.path.join(BASE_DIR, "temp")

os.makedirs(TEMP_DIR, exist_ok=True)

def get_latest_project_dir():
    if not os.path.exists(STAGING_DIR):
        return None
    # Get all subdirectories
    subdirs = [os.path.join(STAGING_DIR, d) for d in os.listdir(STAGING_DIR) if os.path.isdir(os.path.join(STAGING_DIR, d))]
    if not subdirs:
        return None
    # Sort by modification time to get the latest
    latest_subdir = max(subdirs, key=os.path.getmtime)
    return latest_subdir

@router.get("/projects")
async def list_projects():
    """
    List all processed projects in the staging directory.
    """
    if not os.path.exists(STAGING_DIR):
        return []
    
    projects = []
    for d in os.listdir(STAGING_DIR):
        dir_path = os.path.join(STAGING_DIR, d)
        if os.path.isdir(dir_path):
            # Check if it has a transcript
            if os.path.exists(os.path.join(dir_path, "transcript.json")):
                projects.append({
                    "id": d,
                    "name": d.replace("_", " "),
                    "status": "ready"
                })
    return projects

from progress_store import update_progress, get_progress

@router.get("/progress")
async def check_progress(project_id: str):
    """
    Get the processing progress for a given project_id.
    """
    return get_progress(project_id)

@router.post("/upload")
async def upload_audio(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Upload an audio file and start processing in the background.
    """
    if not file.filename.lower().endswith(('.mp3', '.m4b')):
        raise HTTPException(status_code=400, detail="Only .mp3 and .m4b files are supported")

    temp_path = os.path.join(TEMP_DIR, file.filename)
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Determine project ID earlier to start tracking immediately
    base_name = os.path.splitext(file.filename)[0]

    # Initialize progress store
    update_progress(base_name, "processing", 0, "Uploaded. Waiting in queue...")

    # Start processing in background
    def run_processing():
        try:
            # We will add a progress_callback parameter to process_audio_file soon
            from progress_store import update_progress
            def callback(progress: float, message: str):
                update_progress(base_name, "processing", progress, message)
            
            process_audio_file(temp_path, STAGING_DIR, progress_callback=callback)
            update_progress(base_name, "done", 100, "Processing complete")
        except Exception as e:
            update_progress(base_name, "error", 0, str(e))
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    background_tasks.add_task(run_processing)
    
    return {
        "message": "Upload successful. Processing started.",
        "filename": file.filename,
        "project_id": base_name
    }

@router.get("/transcript")
async def serve_latest_transcript(project_id: str | None = None):
    """
    Serve transcript JSON data. If project_id is provided, serve that specific one.
    Otherwise serve the latest.
    """
    if project_id:
        target_dir = os.path.join(STAGING_DIR, project_id)
    else:
        target_dir = get_latest_project_dir()

    if not target_dir or not os.path.exists(target_dir):
        raise HTTPException(status_code=404, detail="Project not found")
        
    file_path = os.path.join(target_dir, "transcript.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Transcript not found")
    
    return get_transcript_data(file_path)

@router.get("/media")
async def serve_media(request: Request, project_id: str | None = None):
    """
    Serve the media file. If project_id is provided, serve that specific one.
    Otherwise serve the latest.
    """
    if project_id:
        target_dir = os.path.join(STAGING_DIR, project_id)
    else:
        target_dir = get_latest_project_dir()

    if not target_dir or not os.path.exists(target_dir):
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Look for the original audio file
    audio_files = glob.glob(os.path.join(target_dir, "original_audio.*"))
    if not audio_files:
        raise HTTPException(status_code=404, detail="Media not found")
        
    file_path = audio_files[0]
    range_header = request.headers.get("range")
    return await stream_media_file(file_path, range_header)
