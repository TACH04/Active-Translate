# Backend API Server

A fast, lightweight local server to stream media and serve transcript data to the frontend application.

## Prerequisites
- Python 3.9+

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Prepare data:
   Create a `data` directory inside `backend` and place your `.mp3`/`.m4b` and `.json` files there. For instance:
   - `backend/data/sample.mp3`
   - `backend/data/sample.json`

## Running

Run the Uvicorn development server:

```bash
uvicorn main:app --reload
```

Server will be accessible at: `http://localhost:8000`

### Endpoints
- `GET /api/transcript/{transcript_id}`: Returns the JSON data parsed from `transcript_id.json`.
- `GET /api/media/{media_id}`: Streams the physical audio file corresponding to `media_id` (e.g. `sample.mp3` or just `sample`). It accurately supports Status 206 Partial Content, allowing the browser's `<audio>` tag to scrub efficiently.
