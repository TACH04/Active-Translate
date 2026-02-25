#!/bin/bash

# Configuration
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
VENV_DIR="$PROJECT_ROOT/.venv"

echo "🚀 Starting Active Translate..."

# 1. Update from Git (if in a git repo)
if [ -d "$PROJECT_ROOT/.git" ]; then
    echo "Checking for updates..."
    git pull
else
    echo "No git repository found, skipping update."
fi

# 2. Setup Python environment
echo "Checking Python environment..."
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"
echo "Installing/Updating Python dependencies..."
pip install -r "$PROJECT_ROOT/requirements.txt"

# 3. Setup Frontend environment
echo "Checking Node.js dependencies..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# 4. Clean up old processes
echo "Cleaning up old processes..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# 5. Start Backend and Frontend
echo "Starting Backend and Frontend..."

# Function to handle cleanup on exit
cleanup() {
    echo "Stopping services..."
    kill $(jobs -p)
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend
cd "$BACKEND_DIR"
uvicorn main:app --port 8000 &
BACKEND_PID=$!

# Start frontend
cd "$FRONTEND_DIR"
npm run dev -- --port 5173 &
FRONTEND_PID=$!

echo "✅ App is running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "Opening browser..."
sleep 2 # Give Vite a moment to start
open http://localhost:5173
echo "Press Ctrl+C to stop."

# Wait for processes
wait
