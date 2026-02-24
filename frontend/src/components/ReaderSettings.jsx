import React, { useState, useEffect, useRef } from 'react';

const ReaderSettings = ({ settings, setSettings }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-800/50 text-slate-300 transition-colors border border-transparent hover:border-slate-700"
                style={{
                    backgroundColor: isOpen ? 'var(--bg-secondary)' : 'transparent',
                    color: 'var(--text-primary)',
                    borderColor: isOpen ? 'var(--border-color)' : 'transparent'
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <span className="text-sm font-medium">Appearance</span>
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-80 rounded-lg shadow-xl border z-50 p-4 space-y-6"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)'
                    }}
                >
                    {/* Theme */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider opacity-70">Theme</label>
                        <div className="flex bg-black/10 rounded-md p-1 border" style={{ borderColor: 'var(--border-color)' }}>
                            {['light', 'dark', 'sepia'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => updateSetting('theme', t)}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded capitalize transition-all ${settings.theme === t ? 'shadow-sm' : 'opacity-70 hover:opacity-100'}`}
                                    style={{
                                        backgroundColor: settings.theme === t ? 'var(--bg-primary)' : 'transparent',
                                        color: settings.theme === t ? 'var(--text-primary)' : 'inherit'
                                    }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Typography - Font Family */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider opacity-70">Font</label>
                        <select
                            value={settings.fontFamily}
                            onChange={(e) => updateSetting('fontFamily', e.target.value)}
                            className="w-full bg-transparent border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent transition-all"
                            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        >
                            <option value="sans" className="text-slate-900">Sans Serif (Inter)</option>
                            <option value="serif" className="text-slate-900">Serif (Merriweather)</option>
                            <option value="dyslexic" className="text-slate-900">OpenDyslexic</option>
                        </select>
                    </div>

                    {/* Typography - Size & Spacing */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider opacity-70">Text Size</label>
                            <div className="flex items-center justify-between border rounded-md p-1" style={{ borderColor: 'var(--border-color)' }}>
                                <button
                                    onClick={() => updateSetting('fontSize', Math.max(16, settings.fontSize - 2))}
                                    className="p-1 px-3 hover:bg-black/10 rounded font-medium"
                                >
                                    A-
                                </button>
                                <span className="text-sm">{settings.fontSize}px</span>
                                <button
                                    onClick={() => updateSetting('fontSize', Math.min(48, settings.fontSize + 2))}
                                    className="p-1 px-3 hover:bg-black/10 rounded font-medium text-lg"
                                >
                                    A+
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider opacity-70">Spacing</label>
                            <select
                                value={settings.lineHeight}
                                onChange={(e) => updateSetting('lineHeight', e.target.value)}
                                className="w-full bg-transparent border rounded-md px-2 py-2 text-sm outline-none"
                                style={{ borderColor: 'var(--border-color)' }}
                            >
                                <option value="tight" className="text-slate-900">Compact</option>
                                <option value="relaxed" className="text-slate-900">Normal</option>
                                <option value="loose" className="text-slate-900">Loose</option>
                            </select>
                        </div>
                    </div>

                    {/* Highlight Style */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider opacity-70">Highlight Style</label>
                        <select
                            value={settings.highlightStyle}
                            onChange={(e) => updateSetting('highlightStyle', e.target.value)}
                            className="w-full bg-transparent border rounded-md px-3 py-2 text-sm outline-none"
                            style={{ borderColor: 'var(--border-color)' }}
                        >
                            <option value="background" className="text-slate-900">Soft Background</option>
                            <option value="underline" className="text-slate-900">Underline</option>
                            <option value="high-contrast" className="text-slate-900">High Contrast (Yellow)</option>
                        </select>
                    </div>

                    {/* Layout Controls */}
                    <div className="space-y-4 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Show Library Sidebar</label>
                            <button
                                onClick={() => updateSetting('showSidebar', !settings.showSidebar)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.showSidebar ? 'bg-indigo-500' : 'bg-slate-500'}`}
                            >
                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settings.showSidebar ? 'translate-x-5' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-xs font-semibold uppercase tracking-wider opacity-70">Reading Width</label>
                                <span className="text-xs opacity-70">{settings.readingWidth.replace('max-w-', '')}</span>
                            </div>
                            <input
                                type="range"
                                min="1" max="4"
                                step="1"
                                className="w-full accent-indigo-500"
                                value={
                                    settings.readingWidth === 'max-w-2xl' ? 1 :
                                        settings.readingWidth === 'max-w-3xl' ? 2 :
                                            settings.readingWidth === 'max-w-4xl' ? 3 : 4
                                }
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    const widthList = ['max-w-2xl', 'max-w-3xl', 'max-w-4xl', 'max-w-5xl'];
                                    updateSetting('readingWidth', widthList[val - 1]);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReaderSettings;
