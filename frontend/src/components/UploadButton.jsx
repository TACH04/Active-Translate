import React, { useState, useRef, useEffect } from 'react';
import UploadProgress from './UploadProgress';

const UploadButton = ({ onUploadSuccess }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("Uploading...");
    const [activeProjectId, setActiveProjectId] = useState(null);
    const fileInputRef = useRef(null);
    const isReadyTriggeredRef = useRef(false);

    // Poll the backend for processing progress
    useEffect(() => {
        if (!activeProjectId) return;

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/progress?project_id=${activeProjectId}`);
                if (response.ok) {
                    const data = await response.json();

                    if (data.status === "processing") {
                        setProgress(data.progress);
                        setStatusText(data.message || "Processing...");

                        // Phase 4 Translation starts at 85%. At this point it's ready to read!
                        if (data.progress >= 85 && !isReadyTriggeredRef.current) {
                            isReadyTriggeredRef.current = true;
                            if (onUploadSuccess) onUploadSuccess();
                            // Don't set isUploading to false yet, keep showing progress circle
                        }
                    } else if (data.status === "done") {
                        clearInterval(interval);
                        setProgress(100);
                        setStatusText("Done!");

                        setTimeout(() => {
                            setIsUploading(false);
                            setActiveProjectId(null);
                            // Avoid double-calling if it was already triggered
                            if (!isReadyTriggeredRef.current && onUploadSuccess) onUploadSuccess();
                            if (fileInputRef.current) fileInputRef.current.value = '';
                        }, 600);
                    } else if (data.status === "error") {
                        clearInterval(interval);
                        setIsUploading(false);
                        setActiveProjectId(null);
                        alert(`Processing failed: ${data.message}`);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                }
            } catch (error) {
                console.error("Error polling progress", error);
            }
        }, 2000); // poll every 2 seconds

        return () => clearInterval(interval);
    }, [activeProjectId, onUploadSuccess]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setProgress(0);
        setStatusText("Uploading...");
        setActiveProjectId(null);
        isReadyTriggeredRef.current = false;

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
                try {
                    const data = JSON.parse(xhr.responseText);
                    // Upload is done, now wait for processing
                    setProgress(0); // Reset progress for processing phase
                    setStatusText("Uploaded. Waiting in queue...");
                    setActiveProjectId(data.project_id);
                } catch {
                    // Fallback if parsing fails
                    setIsUploading(false);
                    alert("Upload successful but failed to track processing schedule.");
                }
            } else {
                let errorMessage = 'Upload failed';
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    errorMessage = `Upload failed: ${errorResponse.detail || xhr.responseText}`;
                } catch {
                    errorMessage = `Upload failed: ${xhr.statusText || 'Unknown error'}`;
                }
                alert(errorMessage);
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
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
                    <UploadProgress progress={progress} statusText={statusText} />
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
