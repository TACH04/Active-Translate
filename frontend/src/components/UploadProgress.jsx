import React from 'react';

const UploadProgress = ({ progress }) => {
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
                {/* Background track */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                    <circle
                        cx="20"
                        cy="20"
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-slate-700"
                    />
                    {/* Progress track */}
                    <circle
                        cx="20"
                        cy="20"
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="text-indigo-400 transition-all duration-300 ease-out"
                    />
                </svg>
            </div>
            <div className="flex flex-col items-start leading-tight">
                <span className="text-sm font-semibold text-slate-200">Uploading...</span>
                <span className="text-xs text-indigo-300 font-medium">{Math.round(progress)}%</span>
            </div>
        </div>
    );
};

export default UploadProgress;
