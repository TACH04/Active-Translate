import React, { useState, useRef } from 'react';
import UploadProgress from './UploadProgress';

const UploadButton = ({ onUploadSuccess }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setProgress(0);
        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                setProgress(percentComplete);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                alert("Upload successful! Processing has started. It will appear in your library soon.");
                if (onUploadSuccess) onUploadSuccess();
            } else {
                let errorMessage = 'Upload failed';
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    errorMessage = `Upload failed: ${errorResponse.detail || xhr.responseText}`;
                } catch (e) {
                    errorMessage = `Upload failed: ${xhr.statusText || 'Unknown error'}`;
                }
                alert(errorMessage);
            }
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        };

        xhr.onerror = () => {
            console.error("Upload error");
            alert("Error connecting to server.");
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        };

        xhr.open('POST', 'http://localhost:8000/api/upload');
        xhr.send(formData);
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
                ref={fileInputRef}
            />
            <label
                htmlFor={isUploading ? undefined : "audio-upload"}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isUploading
                        ? 'bg-slate-800 border border-slate-700 shadow-inner'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-indigo-500/20 cursor-pointer'
                    }`}
            >
                {isUploading ? (
                    <UploadProgress progress={progress} />
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
