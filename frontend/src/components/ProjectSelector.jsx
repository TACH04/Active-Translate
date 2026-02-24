import React from 'react';

const ProjectSelector = ({ projects, selectedProjectId, onSelectProject }) => {
    return (
        <div className="w-80 flex-shrink-0 flex flex-col transition-colors h-full">
            <div className="p-4 border-b transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Library</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {projects.length === 0 ? (
                    <div className="p-4 text-sm italic opacity-60" style={{ color: 'var(--text-secondary)' }}>
                        No projects yet. Upload an audio file to get started.
                    </div>
                ) : (
                    projects.map((project) => (
                        <button
                            key={project.id}
                            onClick={() => onSelectProject(project.id)}
                            className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${selectedProjectId === project.id
                                ? 'border'
                                : 'opacity-70 hover:opacity-100 hover:bg-black/5'
                                }`}
                            style={{
                                backgroundColor: selectedProjectId === project.id ? 'var(--accent-bg)' : 'transparent',
                                color: selectedProjectId === project.id ? 'var(--accent-text)' : 'var(--text-secondary)',
                                borderColor: selectedProjectId === project.id ? 'var(--accent-color)' : 'transparent'
                            }}
                        >
                            <div className="font-medium truncate">{project.name}</div>
                            <div className="text-xs opacity-60">Status: {project.status}</div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProjectSelector;
