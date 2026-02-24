import React, { useState } from 'react';

const UploadButton = ({ onUploadSuccess }) => {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                alert(`Upload failed: ${error.detail}`);
            } else {
                alert("Upload successful! Processing has started. It will appear in your library soon.");
                if (onUploadSuccess) onUploadSuccess();
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Error connecting to server.");
        } finally {
            setIsUploading(false);
            // Reset the input
            event.target.value = '';
        }
    };

    return (
        <div className="relative">
            <input
                type="file"
                accept=".mp3,.m4b"
                onChange={handleFileChange}
                className="hidden"
                id="audio-upload"
                disabled={isUploading}
            />
            <label
                htmlFor="audio-upload"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${isUploading
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-indigo-500/20'
                    }`}
            >
                {isUploading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                        Uploading...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Upload Audio
                    </>
                )}
            </label>
        </div>
    );
};

export default UploadButton;
