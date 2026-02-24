import React from 'react';

const ProjectSelector = ({ projects, selectedProjectId, onSelectProject }) => {
    return (
        <div className="w-80 bg-slate-800/50 border-r border-slate-700 flex flex-col hidden lg:flex">
            <div className="p-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-slate-200">Library</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {projects.length === 0 ? (
                    <div className="p-4 text-slate-500 text-sm italic">
                        No projects yet. Upload an audio file to get started.
                    </div>
                ) : (
                    projects.map((project) => (
                        <button
                            key={project.id}
                            onClick={() => onSelectProject(project.id)}
                            className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${selectedProjectId === project.id
                                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                                }`}
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
