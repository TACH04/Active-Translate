import React, { useState, useEffect } from 'react';
import Player from './components/Player';
import Transcript from './components/Transcript';
import ProjectSelector from './components/ProjectSelector';
import UploadButton from './components/UploadButton';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [transcriptData, setTranscriptData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch project list
  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);

      // If no project is selected and we have projects, select the first one (latest)
      if (!selectedProjectId && data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch transcript when selected project changes
  useEffect(() => {
    const fetchTranscript = async () => {
      setIsLoading(true);
      try {
        const url = selectedProjectId
          ? `${API_BASE_URL}/api/transcript?project_id=${selectedProjectId}`
          : `${API_BASE_URL}/api/transcript`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch transcript');
        const data = await response.json();

        const parsedChunks = Array.isArray(data) ? data : data.chunks || data.segments || [];
        setTranscriptData(parsedChunks);
        setError(null);
      } catch (err) {
        console.warn("Backend not accessible or error fetching transcript.", err);
        if (projects.length === 0) {
          setTranscriptData([
            { text: "Welcome to Dad's Reader.", start: 0.0, end: 3.5 },
            { text: "Upload an audio file in the top right to get started.", start: 3.5, end: 7.2 },
          ]);
        } else {
          setError("Could not load transcript for this project.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranscript();
  }, [selectedProjectId]);

  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  const handleSeek = (time) => {
    setCurrentTime(time);
  };

  const audioUrl = selectedProjectId
    ? `${API_BASE_URL}/api/media?project_id=${selectedProjectId}`
    : `${API_BASE_URL}/api/media`;

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      <header className="py-4 px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-10 flex-shrink-0 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          Dad's Reader
        </h1>
        <UploadButton onUploadSuccess={fetchProjects} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <ProjectSelector
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
        />

        <main className="flex-1 flex flex-col relative pb-32 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center flex-1 text-red-400 p-8 text-center">
              {error}
            </div>
          ) : (
            <Transcript
              transcript={transcriptData}
              currentTime={currentTime}
              onWordClick={handleSeek}
            />
          )}
        </main>
      </div>

      <Player
        audioUrl={audioUrl}
        currentTime={currentTime}
        onTimeUpdate={handleTimeUpdate}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />
    </div>
  );
}

export default App;
