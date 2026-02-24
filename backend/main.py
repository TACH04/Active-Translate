from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router as api_router

app = FastAPI(title="Local Media and Transcript Server")

# Configure CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to specific frontend local domains like http://localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    # Optional logic to run if invoked directly with python main.py
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
