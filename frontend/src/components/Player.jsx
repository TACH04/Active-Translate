import React, { useRef, useEffect } from 'react';

const Player = ({ audioUrl, currentTime, onTimeUpdate, isPlaying, setIsPlaying }) => {
    const audioRef = useRef(null);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            onTimeUpdate(audioRef.current.currentTime);
        }
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    useEffect(() => {
        if (audioRef.current) {
            if (Math.abs(audioRef.current.currentTime - currentTime) > 0.5 && !isPlaying) {
                audioRef.current.currentTime = currentTime;
            }
        }
    }, [currentTime, isPlaying]);

    return (
        <div className="fixed bottom-0 left-0 w-full backdrop-blur-md border-t p-4 z-50 transition-colors shadow-2xl" style={{ backgroundColor: 'var(--player-bg)', borderColor: 'var(--border-color)' }}>
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

                {/* Play/Pause Button */}
                <button
                    onClick={togglePlay}
                    className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all transform hover:scale-105 active:scale-95"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? (
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 fill-current ml-1" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </button>

                {/* Audio Element (Hidden default UI, we use it for logic and a customized minimal timeline) */}
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full h-10 filter-none opacity-80"
                    controls
                />
            </div>
        </div>
    );
};

export default Player;
