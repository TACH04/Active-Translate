import React, { useState, useEffect, useCallback } from 'react';
import Player from './components/Player';
import Transcript from './components/Transcript';
import ProjectSelector from './components/ProjectSelector';
import UploadButton from './components/UploadButton';
import ReaderSettings from './components/ReaderSettings';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [transcriptData, setTranscriptData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Settings state
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('reader_settings');
    return saved ? JSON.parse(saved) : {
      fontSize: 24,
      fontFamily: 'sans',
      lineHeight: 'relaxed',
      theme: 'dark',
      highlightStyle: 'background',
      showSidebar: true,
      readingWidth: 'max-w-4xl'
    };
  });

  useEffect(() => {
    localStorage.setItem('reader_settings', JSON.stringify(settings));
    document.body.className = `theme-${settings.theme}`;
  }, [settings]);

  // Fetch project list
  const fetchProjects = useCallback(async () => {
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
  }, [selectedProjectId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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
  }, [selectedProjectId, projects.length]);

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
    <div className="flex flex-col h-screen overflow-hidden transition-colors" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <header className="py-4 px-6 border-b z-10 flex-shrink-0 flex items-center justify-between transition-colors" style={{ backgroundColor: 'var(--player-bg)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSettings(prev => ({ ...prev, showSidebar: !prev.showSidebar }))}
            className="p-2 rounded-md hover:bg-black/10 transition-colors"
            title={settings.showSidebar ? "Hide Library" : "Show Library"}
            style={{ color: 'var(--text-primary)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </button>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            Dad's Reader
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <ReaderSettings settings={settings} setSettings={setSettings} />
          <UploadButton onUploadSuccess={fetchProjects} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden transition-all duration-300">
        <div
          className="transition-all duration-300 flex overflow-hidden border-r"
          style={{
            width: settings.showSidebar ? '320px' : '0px',
            opacity: settings.showSidebar ? 1 : 0,
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          <ProjectSelector
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
          />
        </div>

        <main className="flex-1 flex flex-col relative pb-32 overflow-hidden transition-all duration-300">
          {isLoading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center flex-1 text-red-500 p-8 text-center">
              {error}
            </div>
          ) : (
            <div className="w-full flex-1 flex justify-center h-full">
              <Transcript
                transcript={transcriptData}
                currentTime={currentTime}
                onWordClick={handleSeek}
                settings={settings}
              />
            </div>
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
