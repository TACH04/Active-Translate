import os
import json
from fastapi import Request, Response, HTTPException
from fastapi.responses import StreamingResponse

def get_transcript_data(file_path: str):
    """
    Reads and returns the transcript JSON data.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading transcript: {str(e)}")

async def stream_media_file(file_path: str, range_header: str | None) -> Response:
    """
    Handles streaming of physical media files with rigorous Range request support (Status 206).
    This allows frontend audio players to correctly scrub through the file.
    """
    file_size = os.path.getsize(file_path)

    if not range_header:
        # If no Range header, serve the whole file
        def file_iterator():
            with open(file_path, "rb") as f:
                yield from f
        
        content_type = _get_content_type(file_path)
        return StreamingResponse(file_iterator(), media_type=content_type)
    
    # Process Range request
    # Expected format: "bytes=0-1024" or "bytes=500-"
    try:
        range_str = range_header.replace("bytes=", "").split("-")
        start = int(range_str[0])
        
        # End byte might not be provided
        end = int(range_str[1]) if len(range_str) > 1 and range_str[1] else file_size - 1
        
        # Ensure bounds
        if start >= file_size or end >= file_size or start > end:
            raise HTTPException(
                status_code=416, 
                detail="Requested Range Not Satisfiable",
                headers={"Content-Range": f"bytes */{file_size}"}
            )
            
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Range header")

    chunk_size = end - start + 1

    def chunk_generator(start_byte: int, end_byte: int):
        with open(file_path, "rb") as f:
            f.seek(start_byte)
            # Yield in smaller pieces, e.g. 1MB at a time
            bytes_to_read = end_byte - start_byte + 1
            buffer_size = 1024 * 1024
            while bytes_to_read > 0:
                read_size = min(buffer_size, bytes_to_read)
                data = f.read(read_size)
                if not data:
                    break
                yield data
                bytes_to_read -= len(data)

    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(chunk_size),
    }

    content_type = _get_content_type(file_path)
    return StreamingResponse(
        chunk_generator(start, end),
        status_code=206,
        media_type=content_type,
        headers=headers
    )

def _get_content_type(file_path: str) -> str:
    """Utility to determine appropriate MIME type."""
    if file_path.endswith(".mp3"):
        return "audio/mpeg"
    elif file_path.endswith(".m4b") or file_path.endswith(".m4a") or file_path.endswith(".mp4"):
        return "audio/mp4"
    return "application/octet-stream"
