# A simple global dictionary to track background processing states
progress_store = {}

def update_progress(project_id: str, status: str, progress: float, message: str):
    progress_store[project_id] = {
        "status": status,
        "progress": progress,
        "message": message
    }

def get_progress(project_id: str):
    return progress_store.get(project_id, {"status": "unknown", "progress": 0, "message": "Not found"})

def remove_progress(project_id: str):
    if project_id in progress_store:
        del progress_store[project_id]
