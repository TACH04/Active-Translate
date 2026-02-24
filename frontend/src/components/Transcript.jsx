import React, { useEffect, useRef } from 'react';

const Transcript = ({ transcript, currentTime, onWordClick }) => {
    const scrollRef = useRef(null);
    const activeWordRef = useRef(null);

    // Sync logic: Find the index of the currently active chunk
    const activeIndex = transcript.findIndex(
        (chunk) => {
            const start = chunk.start_time !== undefined ? chunk.start_time : chunk.start;
            const end = chunk.end_time !== undefined ? chunk.end_time : chunk.end;
            return currentTime >= start && currentTime <= end;
        }
    );

    // Auto-scroll mechanism
    useEffect(() => {
        if (activeWordRef.current) {
            activeWordRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [activeIndex]);

    return (
        <div
            className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto px-6 py-12 scroll-smooth no-scrollbar"
            ref={scrollRef}
        >
            <div className="space-y-6 text-2xl leading-relaxed text-slate-300 font-medium">
                {/* We assume transcript is grouped into sentences or is just words. If word-level, we might want to wrap in paragraphs. For simplicity, we just list the chunks. */}
                <p className="flex flex-wrap gap-x-2 gap-y-3">
                    {transcript.map((chunk, index) => {
                        const isActive = index === activeIndex;
                        const start = chunk.start_time !== undefined ? chunk.start_time : chunk.start;
                        const end = chunk.end_time !== undefined ? chunk.end_time : chunk.end;
                        const isPast = currentTime > end;

                        return (
                            <span
                                key={index}
                                ref={isActive ? activeWordRef : null}
                                onClick={() => onWordClick(start)}
                                className={`
                  transition-all duration-300 cursor-pointer rounded-md px-2 py-1
                  ${isActive ? 'bg-indigo-500/20 text-indigo-300 scale-105 shadow-sm transform' : ''}
                  ${isPast && !isActive ? 'text-slate-400' : ''}
                  ${!isActive && !isPast ? 'hover:bg-slate-800' : ''}
                `}
                            >
                                {chunk.word || chunk.text}
                            </span>
                        );
                    })}
                </p>
            </div>
        </div>
    );
};

export default Transcript;
