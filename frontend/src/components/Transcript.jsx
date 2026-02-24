import React, { useEffect, useRef } from 'react';

const Transcript = ({ transcript, currentTime, onWordClick, settings }) => {
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
            className={`flex-1 overflow-y-auto w-full px-6 py-12 scroll-smooth no-scrollbar transition-all duration-300 ${settings?.readingWidth || 'max-w-4xl'}`}
            ref={scrollRef}
        >
            <div
                className="space-y-6 font-medium transition-all duration-300"
                style={{
                    fontSize: settings?.fontSize ? `${settings.fontSize}px` : '24px',
                    fontFamily: settings?.fontFamily === 'dyslexic' ? 'OpenDyslexic, sans-serif' : settings?.fontFamily === 'serif' ? 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' : 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    lineHeight: settings?.lineHeight === 'tight' ? '1.25' : settings?.lineHeight === 'loose' ? '2' : '1.625'
                }}
            >
                {/* We assume transcript is grouped into sentences or is just words. If word-level, we might want to wrap in paragraphs. For simplicity, we just list the chunks. */}
                <p className="flex flex-wrap gap-x-2 gap-y-3">
                    {transcript.map((chunk, index) => {
                        const isActive = index === activeIndex;
                        const start = chunk.start_time !== undefined ? chunk.start_time : chunk.start;
                        const end = chunk.end_time !== undefined ? chunk.end_time : chunk.end;
                        const isPast = currentTime > end;

                        let activeStyleClass = '';
                        if (isActive) {
                            if (settings?.highlightStyle === 'underline') activeStyleClass = 'highlight-underline scale-105 transform';
                            else if (settings?.highlightStyle === 'high-contrast') activeStyleClass = 'highlight-high-contrast scale-105 shadow-sm transform';
                            else activeStyleClass = 'highlight-background scale-105 shadow-sm transform';
                        }

                        return (
                            <span
                                key={index}
                                ref={isActive ? activeWordRef : null}
                                onClick={() => onWordClick(start)}
                                className={`
                                  transition-all duration-300 cursor-pointer rounded-md px-1 py-1
                                  ${isActive ? activeStyleClass : ''}
                                  ${isPast && !isActive ? 'opacity-60' : ''}
                                  ${!isActive && !isPast ? 'hover:bg-black/10' : ''}
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
