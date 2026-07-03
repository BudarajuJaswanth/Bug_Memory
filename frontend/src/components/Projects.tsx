import React, { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { api } from '../lib/api';
import type { ProjectListItem } from '../lib/api';
import { showToast } from '../lib/toast';

interface ProjectsProps {
  projects: ProjectListItem[];
  fetchProjects: () => Promise<void>;
  selectedProject: string;
  setSelectedProject: (project: string) => void;
  retireAnimationRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

export const Projects: React.FC<ProjectsProps> = ({
  projects,
  fetchProjects,
  selectedProject,
  setSelectedProject,
  retireAnimationRef,
}) => {
  const [projectToRetire, setProjectToRetire] = useState<string | null>(null);
  const [retiring, setRetiring] = useState(false);

  const handleRetire = async () => {
    if (!projectToRetire) return;
    setRetiring(true);
    try {
      if (selectedProject === projectToRetire && retireAnimationRef?.current) {
        await retireAnimationRef.current();
      }
      await api.deleteProject(projectToRetire);
      showToast(`Retired project "${projectToRetire}" and forgotten Cognee memories.`, 'success');
      
      // If we deleted the active project, clear it or pick another
      if (selectedProject === projectToRetire) {
        const remaining = projects.filter((p) => p.name !== projectToRetire);
        if (remaining.length > 0) {
          setSelectedProject(remaining[0].name);
        } else {
          setSelectedProject('');
        }
      }
      
      setProjectToRetire(null);
      await fetchProjects();
    } catch {
      // Handled globally
    } finally {
      setRetiring(false);
    }
  };

  return (
    <div className="space-y-8 py-2 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 mb-1">
          Projects Management
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Manage workspace settings, review bug indexes, and retire inactive workspaces.
        </p>
      </div>

      {/* Grid of Projects */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold tracking-tight text-neutral-850 dark:text-neutral-250">
          Active Workspaces
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {projects.map((project) => (
            <div
              key={project.name}
              className="bg-white dark:bg-gradient-to-r dark:from-neutral-900 dark:to-neutral-950 border border-neutral-200/80 dark:border-neutral-800 p-4 rounded-xl shadow-sm flex items-center justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {project.name}
                  </span>
                  {selectedProject === project.name && (
                    <span className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-[9px] font-medium text-accent">
                      Active Selection
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                  Contains {project.bug_count} recorded {project.bug_count === 1 ? 'bug resolution' : 'bug resolutions'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedProject !== project.name && (
                  <button
                    onClick={() => setSelectedProject(project.name)}
                    className="px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850 rounded-lg transition-all"
                  >
                    Select
                  </button>
                )}
                <button
                  onClick={() => setProjectToRetire(project.name)}
                  className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                  title="Retire project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="text-center py-12 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900">
              <span className="text-xs text-neutral-400 dark:text-neutral-500">No workspaces initialized yet. Create one on the dashboard.</span>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog Overlay */}
      {projectToRetire && (
        <div className="fixed inset-0 bg-neutral-900/40 dark:bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div 
            className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 w-full max-w-md p-6 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200">
                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold tracking-tight">Retire Project</h3>
              </div>
              <button
                disabled={retiring}
                onClick={() => setProjectToRetire(null)}
                className="text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="space-y-2">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Are you sure you want to retire <strong className="text-neutral-800 dark:text-neutral-200">"{projectToRetire}"</strong>?
              </p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-relaxed">
                This action is irreversible. All stored traceback nodes, connection vectors, and AI-learned associations inside Cognee Cloud will be forgotten permanently.
              </p>
            </div>

            {/* Dialog Footer Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-4">
              <button
                type="button"
                disabled={retiring}
                onClick={() => setProjectToRetire(null)}
                className="px-3.5 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={retiring}
                onClick={handleRetire}
                className="px-3.5 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
              >
                {retiring ? 'Forgetting memory...' : 'Confirm Retire'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
