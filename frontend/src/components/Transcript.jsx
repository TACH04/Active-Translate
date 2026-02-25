import React, { useEffect, useRef, useState, useMemo } from 'react';

const Transcript = ({ transcript, currentTime, onWordClick, settings, isPlaying, setIsPlaying }) => {
    const scrollRef = useRef(null);
    const activeWordRef = useRef(null);

    // Translation state
    const [showTranslation, setShowTranslation] = useState(false);
    const [translationText, setTranslationText] = useState("");
    const [isTranslating, setIsTranslating] = useState(false);

    // Flatten transcript to support both old format (array of words) and new (segments -> words)
    const flatWords = useMemo(() => {
        const words = [];
        const items = Array.isArray(transcript) ? transcript : transcript?.chunks || transcript?.segments || [];

        items.forEach((item, itemIndex) => {
            if (item.words && item.words.length > 0) {
                // New segment format
                item.words.forEach((w) => {
                    words.push({ ...w, segmentText: item.text, translation: item.translation, segmentIndex: itemIndex });
                });
            } else {
                // Old format fallback
                words.push({ ...item, segmentText: item.word || item.text, segmentIndex: itemIndex });
            }
        });
        return words;
    }, [transcript]);

    // Sync logic: Find the index of the currently active word
    const activeIndex = useMemo(() => {
        // Add a 50ms forward buffer. If we jump exactly to a word's start time,
        // the audio player might round to 1ms before it. This precise buffer fixes jumping getting stuck.
        const searchTime = currentTime + 0.05;

        const idx = flatWords.findIndex(
            (chunk) => {
                const start = chunk.start_time !== undefined ? chunk.start_time : chunk.start;
                const end = chunk.end_time !== undefined ? chunk.end_time : chunk.end;
                return searchTime >= start && searchTime <= end;
            }
        );
        // If not found, try to find the closest word that we just passed
        if (idx === -1 && flatWords.length > 0) {
            for (let i = flatWords.length - 1; i >= 0; i--) {
                const end = flatWords[i].end_time !== undefined ? flatWords[i].end_time : flatWords[i].end;
                if (searchTime >= end) return i;
            }
        }
        return idx;
    }, [currentTime, flatWords]);

    const activeWord = activeIndex !== -1 ? flatWords[activeIndex] : null;

    // Auto-scroll mechanism
    useEffect(() => {
        if (activeWordRef.current) {
            activeWordRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [activeIndex]);

    // Refs for stable access inside the key listener without re-attaching
    const currentTimeRef = useRef(currentTime);
    const activeIndexRef = useRef(activeIndex);
    const lastJumpTimeRef = useRef(0);

    useEffect(() => {
        currentTimeRef.current = currentTime;
    }, [currentTime]);

    useEffect(() => {
        activeIndexRef.current = activeIndex;
    }, [activeIndex]);

    // Keyboard Listener
    useEffect(() => {
        const handleKeyDown = async (e) => {
            // Ignore keypresses inside inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const now = Date.now();
            const curIdx = activeIndexRef.current;
            const curTime = currentTimeRef.current;

            // Space to toggle play/pause
            if (e.code === 'Space') {
                e.preventDefault();
                setIsPlaying(prev => !prev);
                return;
            }

            // Word Navigation: Left/Right Arrows
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (now - lastJumpTimeRef.current < 150) return;
                lastJumpTimeRef.current = now;

                setIsPlaying(false);

                // Next Word: If we have an active index, go to next.
                let targetWord = null;
                if (curIdx !== -1 && curIdx < flatWords.length - 1) {
                    targetWord = flatWords[curIdx + 1];
                } else {
                    targetWord = flatWords.find(w => (w.start_time ?? w.start) > curTime + 0.01);
                }
                if (targetWord) onWordClick(targetWord.start_time ?? targetWord.start);
                return;
            }

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (now - lastJumpTimeRef.current < 150) return;
                lastJumpTimeRef.current = now;

                setIsPlaying(false);

                // Previous Word: If we are deep into the current word, go to its start.
                let targetTime = 0;
                if (curIdx !== -1) {
                    const curWord = flatWords[curIdx];
                    const wordStart = curWord.start_time ?? curWord.start;
                    if (curTime > wordStart + 0.5) {
                        targetTime = wordStart;
                    } else if (curIdx > 0) {
                        targetTime = flatWords[curIdx - 1].start_time ?? flatWords[curIdx - 1].start;
                    }
                } else {
                    const prevWord = [...flatWords].reverse().find(w => (w.start_time ?? w.start) < curTime - 0.1);
                    targetTime = prevWord ? (prevWord.start_time ?? prevWord.start) : 0;
                }
                onWordClick(targetTime);
                return;
            }

            // Sentence Navigation: Up/Down Arrows
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (now - lastJumpTimeRef.current < 250) return;
                lastJumpTimeRef.current = now;

                setIsPlaying(false);

                const activeWord = curIdx !== -1 ? flatWords[curIdx] : null;
                const curSegmentIdx = activeWord ? activeWord.segmentIndex : -1;
                const nextWord = flatWords.find(w => w.segmentIndex > curSegmentIdx);
                if (nextWord) onWordClick(nextWord.start_time ?? nextWord.start);
                return;
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (now - lastJumpTimeRef.current < 250) return;
                lastJumpTimeRef.current = now;

                setIsPlaying(false);

                const activeWord = curIdx !== -1 ? flatWords[curIdx] : null;
                const curSegmentIdx = activeWord ? activeWord.segmentIndex : 0;

                const curSegmentFirstWord = flatWords.find(w => w.segmentIndex === curSegmentIdx);
                const curSegmentStart = curSegmentFirstWord ? (curSegmentFirstWord.start_time ?? curSegmentFirstWord.start) : 0;

                if (currentTimeRef.current > curSegmentStart + 1.0) {
                    onWordClick(curSegmentStart);
                } else {
                    const prevWord = [...flatWords].reverse().find(w => w.segmentIndex < curSegmentIdx);
                    if (prevWord) {
                        const firstOfPrev = flatWords.find(w => w.segmentIndex === prevWord.segmentIndex);
                        onWordClick(firstOfPrev.start_time ?? firstOfPrev.start);
                    } else {
                        onWordClick(0);
                    }
                }
                return;
            }

            // Translation hotkeys
            if (e.key.toLowerCase() === 't' || e.key.toLowerCase() === 'w') {
                const activeWord = curIdx !== -1 ? flatWords[curIdx] : null;
                if (!activeWord) return;

                const isWordMode = e.key.toLowerCase() === 'w';
                const textToTranslate = isWordMode ? (activeWord.word || activeWord.text) : activeWord.segmentText;

                setIsPlaying(false);
                setShowTranslation(true);

                if (!isWordMode && activeWord.translation) {
                    setTranslationText(activeWord.translation);
                    return;
                }

                setIsTranslating(true);
                setTranslationText("");
                try {
                    const response = await fetch('http://localhost:8000/api/translate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: textToTranslate })
                    });
                    const data = await response.json();
                    setTranslationText(data.translation);
                } catch (error) {
                    console.error("Translation error", error);
                    setTranslationText("Translation failed.");
                } finally {
                    setIsTranslating(false);
                }
            } else if (e.key === 'Escape') {
                setShowTranslation(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [flatWords, onWordClick, setIsPlaying]);

    return (
        <div className="relative w-full h-full flex overflow-hidden">
            {/* Translation Side Panel */}
            <div
                className={`absolute top-0 right-0 h-full w-[22rem] z-40 transition-transform duration-300 ease-out transform ${showTranslation ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div
                    className="h-full w-full p-8 flex flex-col border-l backdrop-blur-xl bg-black/40 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.5)]"
                    style={{
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)'
                    }}
                >
                    <div className="flex justify-between items-center mb-8">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">
                            English Translation
                        </span>
                        <button
                            onClick={() => setShowTranslation(false)}
                            className="p-1.5 rounded-md hover:bg-white/10 transition-colors opacity-50 hover:opacity-100"
                            title="Close (Esc)"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar pb-12 pr-2">
                        {isTranslating ? (
                            <div className="flex mt-8 items-center h-12 w-full opacity-60 gap-3">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span className="text-sm font-medium">Translating...</span>
                            </div>
                        ) : (
                            <p className="text-xl font-serif leading-loose tracking-wide opacity-90 drop-shadow-md" style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>
                                {translationText || "No translation available."}
                            </p>
                        )}
                    </div>
                </div>
            </div>


            <div
                className={`flex-1 overflow-y-auto w-full px-6 py-12 scroll-smooth no-scrollbar transition-all duration-300 ${settings?.readingWidth || 'max-w-4xl'}`}
                ref={scrollRef}
                onClick={() => setShowTranslation(false)}
            >
                <div
                    className="space-y-6 font-medium transition-all duration-300"
                    style={{
                        fontSize: settings?.fontSize ? `${settings.fontSize}px` : '24px',
                        fontFamily: settings?.fontFamily === 'dyslexic' ? 'OpenDyslexic, sans-serif' : settings?.fontFamily === 'serif' ? 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' : 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        lineHeight: settings?.lineHeight === 'tight' ? '1.25' : settings?.lineHeight === 'loose' ? '2' : '1.625'
                    }}
                >
                    <p className="flex flex-wrap gap-x-2 gap-y-3 relative">
                        {flatWords.map((chunk, index) => {
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onWordClick(start);
                                        setShowTranslation(false);
                                    }}
                                    className={`
                                      transition-all duration-150 cursor-pointer rounded-md px-1 py-1
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
        </div>
    );
};

export default Transcript;
