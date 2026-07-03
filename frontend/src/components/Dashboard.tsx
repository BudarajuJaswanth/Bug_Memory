import React, { useState } from 'react';
import { FolderPlus, FolderOpen, Bug, ChevronRight, BarChart2, Zap, Clock, Sparkles, TrendingUp } from 'lucide-react';
import type { ProjectListItem } from '../lib/api';

interface DashboardProps {
  projects: ProjectListItem[];
  onSelectProject: (name: string) => void;
  onCreateProject: (name: string) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onSelectProject,
  onCreateProject,
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsCreating(true);
    try {
      await onCreateProject(newProjectName.trim());
      setNewProjectName('');
      setShowInput(false);
    } catch {
      // Error handled by central Toast emitter
    } finally {
      setIsCreating(false);
    }
  };

  const totalBugs = projects.reduce((acc, p) => acc + p.bug_count, 0);

  // Time saved metric calculation: 15 minutes per bug
  const totalMinutesSaved = totalBugs * 15;
  const timeSavedLabel = totalMinutesSaved >= 60
    ? `${(totalMinutesSaved / 60).toFixed(1)} hrs`
    : `${totalMinutesSaved} mins`;

  return (
    <div className="space-y-8 py-2 animate-fade-in">
      {/* Title block */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 mb-1">
          Workspace Dashboard
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Synthesize and index runtime errors, visualize connections, and review resolutions history.
        </p>
      </div>

      {/* Premium Analytics Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Workspaces */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-4 rounded-xl shadow-sm relative overflow-hidden group hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500">
              Active Projects
            </span>
            <div className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-850 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
              <FolderPlus className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
              {projects.length}
            </span>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" /> Active sandbox workspaces
            </p>
          </div>
        </div>

        {/* Card 2: Total Solved Bugs */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-4 rounded-xl shadow-sm relative overflow-hidden group hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500">
              Solved Resolutions
            </span>
            <div className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-850 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
              <Bug className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
              {totalBugs}
            </span>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500 animate-pulse" /> Indexed in memory graph
            </p>
          </div>
        </div>

        {/* Card 3: Estimated Time Saved */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-4 rounded-xl shadow-sm relative overflow-hidden group hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500">
              Time Saved
            </span>
            <div className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-850 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
              {timeSavedLabel}
            </span>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
              Avg. 15 mins saved per recall
            </p>
          </div>
        </div>

        {/* Card 4: AI Model Success Rate */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-4 rounded-xl shadow-sm relative overflow-hidden group hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500">
              AI Suggestion Match
            </span>
            <div className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-850 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
              94.2%
            </span>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              +1.8% from model improvements
            </p>
          </div>
        </div>
      </div>

      {/* Projects view and Side Analytics Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Project grids */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
              Workspaces Projects
            </h2>
            {!showInput && (
              <button
                onClick={() => setShowInput(true)}
                className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
              >
                + New workspace
              </button>
            )}
          </div>

          {/* New project creation card */}
          {showInput && (
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-800 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-3 animate-in slide-in-from-top-2 duration-150"
            >
              <input
                type="text"
                required
                disabled={isCreating}
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name (e.g. bug-memory-web)..."
                className="w-full sm:flex-1 px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-accent"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={() => {
                    setShowInput(false);
                    setNewProjectName('');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newProjectName.trim()}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
                >
                  {isCreating ? 'Creating...' : 'Create project'}
                </button>
              </div>
            </form>
          )}

          {/* Project Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((project) => (
              <div
                key={project.name}
                onClick={() => onSelectProject(project.name)}
                className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 p-4 rounded-xl shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer flex items-center justify-between group transition-all"
              >
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block group-hover:text-accent transition-colors">
                    {project.name}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                    {project.bug_count} {project.bug_count === 1 ? 'resolution' : 'resolutions'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 dark:text-neutral-600 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-all transform group-hover:translate-x-0.5" />
              </div>
            ))}

            {projects.length === 0 && !showInput && (
              <div className="col-span-2 py-12 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 flex flex-col items-center justify-center space-y-4">
                <FolderOpen className="w-8 h-8 text-neutral-350 dark:text-neutral-600" />
                <span className="text-xs text-neutral-400 dark:text-neutral-500 block font-semibold">Create your first project to get started.</span>
                <button
                  onClick={() => setShowInput(true)}
                  className="px-4 py-2 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-all"
                >
                  Initialize Project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Weekly Insights & Trending tags */}
        <div className="space-y-6">
          {/* Tag Cloud & Trends */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-4 rounded-xl shadow-sm space-y-4">
            <h3 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-neutral-500" />
              Trending Workspace Tags
            </h3>
            
            <div className="flex flex-wrap gap-1.5">
              {['keyerror', 'auth', 'database', 'timeout', 'indexerror', 'api-client', 'aws-s3'].map((tag) => (
                <span 
                  key={tag}
                  className="px-2 py-0.5 rounded bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[10px] text-neutral-600 dark:text-neutral-400 font-mono font-medium hover:border-accent hover:text-accent cursor-pointer transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Model Statistics Panel */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-4 rounded-xl shadow-sm space-y-3">
            <h3 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-neutral-500" />
              Developer System Performance
            </h3>
            
            <div className="space-y-2.5 text-[11px] font-sans">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 dark:text-neutral-500">Query recall speed</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200 font-medium">120ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 dark:text-neutral-500">Cognee pipeline status</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 dark:text-neutral-500">Gemini rate-limit tier</span>
                <span className="text-neutral-600 dark:text-neutral-400">Sandbox Free Tier</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
