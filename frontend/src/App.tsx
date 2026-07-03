import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Search, Bell, Sparkles } from 'lucide-react';
import { api } from './lib/api';
import type { ProjectListItem } from './lib/api';
import { subscribeToToasts, showToast } from './lib/toast';
import type { Toast } from './lib/toast';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { FindABug } from './components/FindABug';
import { MemoryGraph } from './components/MemoryGraph';
import { Projects } from './components/Projects';
import { Auth } from './components/Auth';
import { LandingPage } from './components/LandingPage';
import { CommandPalette } from './components/CommandPalette';

export default function App() {
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const graphRetireAnimationRef = useRef<(() => Promise<void>) | null>(null);

  // Gating landing vs auth page
  const [showAuthForm, setShowAuthForm] = useState(false);

  // Command palette state
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [bugs, setBugs] = useState<any[]>([]);
  
  // Custom dialog state for new project
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  // Toast stack state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Load session from session storage on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('bug_memory_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        sessionStorage.removeItem('bug_memory_user');
      }
    }
  }, []);

  // Fetch list of projects from API
  const fetchProjects = async () => {
    try {
      const res = await api.getProjects();
      setProjects(res.projects);
      
      // Auto-select first project if nothing is selected yet
      if (res.projects.length > 0 && !selectedProject) {
        setSelectedProject(res.projects[0].name);
      }
    } catch {
      // Error handled by Toast listener
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  // Load bugs for command palette searches
  useEffect(() => {
    if (user && selectedProject) {
      api.getProjectBugs(selectedProject)
        .then((res) => setBugs(res.bugs || []))
        .catch(() => {});
    } else {
      setBugs([]);
    }
  }, [selectedProject, activeTab, user]);

  // Subscribe to central toast notifications
  useEffect(() => {
    const unsubscribe = subscribeToToasts((toast) => {
      setToasts((prev) => [...prev, toast]);
      
      // Auto dismiss after 5s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 5000);
    });
    return () => unsubscribe();
  }, []);

  // Keyboard shortcut listener for Command Palette (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoginSuccess = (loggedInUser: { email: string; name: string }) => {
    setUser(loggedInUser);
    sessionStorage.setItem('bug_memory_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('bug_memory_user');
    setShowAuthForm(false);
    showToast('Logged out successfully.', 'success');
  };

  const handleCreateProject = async (name: string) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      showToast('Project name can only contain letters, numbers, hyphens, and underscores (no spaces or dots).', 'error');
      throw new Error('Invalid project name');
    }
    try {
      await api.createProject(name);
      showToast(`Project "${name}" created successfully.`, 'success');
      await fetchProjects();
      setSelectedProject(name);
    } catch {
      // API client handles failed request alerts
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newProjectName.trim();
    if (!cleanName) return;
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanName)) {
      showToast('Project name can only contain letters, numbers, hyphens, and underscores (no spaces or dots).', 'error');
      return;
    }
    setCreatingProject(true);
    try {
      await handleCreateProject(cleanName);
      setNewProjectName('');
      setShowNewProjectModal(false);
    } finally {
      setCreatingProject(false);
    }
  };

  // Switch tabs
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            projects={projects}
            onSelectProject={(name) => {
              setSelectedProject(name);
              setActiveTab('find-bug');
            }}
            onCreateProject={handleCreateProject}
          />
        );
      case 'find-bug':
        return <FindABug selectedProject={selectedProject} />;
      case 'graph':
        return <MemoryGraph selectedProject={selectedProject} retireAnimationRef={graphRetireAnimationRef} setActiveTab={setActiveTab} />;
      case 'projects':
        return (
          <Projects
            projects={projects}
            fetchProjects={fetchProjects}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            retireAnimationRef={graphRetireAnimationRef}
          />
        );
      default:
        return null;
    }
  };

  // RENDER AUTH OR LANDING SCREEN GATED
  if (!user) {
    if (showAuthForm) {
      return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 relative">
          <Auth 
            onLoginSuccess={handleLoginSuccess} 
            onBackToHome={() => setShowAuthForm(false)}
          />
          
          {/* Floating Toast notifications on auth screen */}
          <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            <AnimatePresence>
              {toasts.map((toast) => (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className={`pointer-events-auto bg-white dark:bg-neutral-900 border shadow-lg rounded-xl p-4 flex items-start gap-3 w-full ${
                    toast.type === 'memory'
                      ? 'border-teal-200 dark:border-teal-800/60'
                      : 'border-neutral-200/80 dark:border-neutral-800'
                  }`}
                >
                  {toast.type === 'memory' ? (
                    <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  ) : toast.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-neutral-800 dark:text-neutral-200 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 leading-snug">
                      {toast.message}
                    </p>
                  </div>
                  <button
                    onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      );
    }

    return (
      <LandingPage onLoginTrigger={() => setShowAuthForm(true)} />
    );
  }

  // RENDER APP MAIN SHELL
  return (
    <div className="min-h-screen bg-neutral-50 flex dark:bg-neutral-950">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projects={projects}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onNewProjectClick={() => setShowNewProjectModal(true)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col md:pl-[260px] min-w-0">
        {/* Sticky SaaS-quality Workspace Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 md:px-8 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 select-none">
          {/* Breadcrumb Info */}
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-400 dark:text-neutral-500">
            <span>Workspaces</span>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{selectedProject || 'Select Project'}</span>
          </div>

          {/* Desktop Search trigger */}
          <div 
            onClick={() => setShowCommandPalette(true)}
            className="hidden sm:flex items-center justify-between w-64 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-900/60 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-800/80 rounded-lg text-neutral-400 dark:text-neutral-500 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
              <span className="text-[11px]">Search commands...</span>
            </div>
            <kbd className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-950 text-neutral-400 dark:text-neutral-500 shadow-sm shrink-0">⌘K</kbd>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {/* AI Assistant Ready Beacon */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-950/20 border border-teal-100/60 dark:border-teal-900/30 text-[10px] text-teal-700 dark:text-teal-400 font-medium">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500"></span>
              </span>
              AI Ready
            </div>

            {/* Notification trigger */}
            <button 
              onClick={() => showToast('No new notifications.', 'success')}
              className="relative p-1.5 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            </button>
          </div>
        </header>

        {/* Main Route Content Viewport */}
        <main className="flex-1 px-4 py-8 md:px-8 overflow-y-auto">
          <div className="max-w-[960px] mx-auto w-full">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Global Command Palette search engine overlay */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        setActiveTab={setActiveTab}
        projects={projects}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        bugs={bugs}
      />

      {/* Toast Notification Container */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto bg-white dark:bg-neutral-900 border shadow-lg rounded-xl p-4 flex items-start gap-3 w-full ${
                toast.type === 'memory'
                  ? 'border-teal-200 dark:border-teal-800/60'
                  : 'border-neutral-200/80 dark:border-neutral-800'
              }`}
            >
              {toast.type === 'memory' ? (
                <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              ) : toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-neutral-800 dark:text-neutral-200 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-xs font-medium text-neutral-800 leading-snug">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-neutral-400 hover:text-neutral-600 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Global Create Project Dialog Overlay */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-neutral-900/40 dark:bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div 
            className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 w-full max-w-sm p-6 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                Create Workspace Project
              </h3>
              <button
                disabled={creatingProject}
                onClick={() => setShowNewProjectModal(false)}
                className="text-neutral-400 hover:text-neutral-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  disabled={creatingProject}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. bug-memory-web"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800 rounded-lg text-neutral-850 dark:text-neutral-100 placeholder-neutral-455 focus:outline-none focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-4">
                <button
                  type="button"
                  disabled={creatingProject}
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProject || !newProjectName.trim()}
                  className="px-3.5 py-2 text-xs font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
                >
                  {creatingProject ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
