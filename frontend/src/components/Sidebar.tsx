import React from 'react';
import { LayoutDashboard, Bug, Network, Folder, Menu, X, ChevronDown, LogOut, User } from 'lucide-react';
import type { ProjectListItem } from '../lib/api';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  projects: ProjectListItem[];
  selectedProject: string;
  setSelectedProject: (project: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onNewProjectClick: () => void;
  user: { email: string; name: string } | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  projects,
  selectedProject,
  setSelectedProject,
  mobileOpen,
  setMobileOpen,
  onNewProjectClick,
  user,
  onLogout,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'find-bug', label: 'Find a Bug', icon: Bug },
    { id: 'graph', label: 'Memory Graph', icon: Network },
    { id: 'projects', label: 'Projects', icon: Folder },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950 border-r border-neutral-200/80 dark:border-neutral-800/80">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-950">
        <div className="flex items-center gap-3 select-none">
          {/* Premium App Icon */}
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-teal-800 to-cyan-500 flex items-center justify-center text-white text-sm font-sans font-black shadow-[0_4px_12px_rgba(20,184,166,0.12)] border border-white/10 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 shrink-0">
            B
          </div>
          {/* Premium Typography */}
          <span className="font-sans font-semibold tracking-wide text-neutral-900 dark:text-neutral-50 text-sm flex items-center gap-2">
            BUG MEMORY
            {/* Status Beacon Capsule */}
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[9px] font-medium text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 select-none shrink-0">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Synced
            </span>
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Global Project Context Selector */}
      <div className="p-4 border-b border-neutral-200/80 dark:border-neutral-800/80">
        <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">
          Active Project
        </label>
        <div className="relative">
          <select
            value={selectedProject}
            onChange={(e) => {
              if (e.target.value === '__new__') {
                onNewProjectClick();
              } else {
                setSelectedProject(e.target.value);
              }
            }}
            className="w-full pl-3 pr-8 py-2 text-xs font-medium bg-neutral-50 border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-100 appearance-none focus:outline-none focus:border-accent cursor-pointer"
          >
            {projects.length === 0 ? (
              <option value="" disabled>No projects found</option>
            ) : (
              projects.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.bug_count} {p.bug_count === 1 ? 'bug' : 'bugs'})
                </option>
              ))
            )}
            <option value="__new__" className="text-accent font-semibold">+ Create Project...</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Nav Menu Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg transition-all ${
                isActive
                  ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50 font-medium'
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 hover:text-neutral-900 dark:hover:text-neutral-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-neutral-400'}`} />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1 h-3 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Session Profile Panel */}
      {user && (
        <div className="p-4 border-t border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-900/20">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 truncate leading-snug">{user.name}</p>
              <p className="text-[9px] text-neutral-400 dark:text-neutral-500 truncate leading-none">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-1 text-neutral-400 hover:text-red-600 rounded transition-colors shrink-0"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Footer Details */}
      <div className="p-3 border-t border-neutral-200/80 dark:border-neutral-800/80 text-[10px] text-neutral-400 dark:text-neutral-500 font-mono text-center bg-white dark:bg-neutral-950">
        v1.0.0 · {import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).hostname : 'localhost:8000'}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden md:block fixed top-0 bottom-0 left-0 w-[260px] z-20">
        {navContent}
      </aside>

      {/* Mobile Header (Top bar) */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-neutral-950 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-3 select-none">
          {/* Mobile Icon */}
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-teal-800 to-cyan-500 flex items-center justify-center text-white text-xs font-sans font-black shadow-[0_4px_12px_rgba(20,184,166,0.12)] border border-white/10 shrink-0">
            B
          </div>
          {/* Mobile Text */}
          <span className="font-sans font-semibold tracking-wide text-neutral-900 dark:text-neutral-50 text-sm flex items-center gap-2">
            BUG MEMORY
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[9px] font-medium text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 select-none shrink-0">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Synced
            </span>
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1 rounded-md text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-50 hover:bg-neutral-50 dark:hover:bg-neutral-900"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-neutral-900/20 dark:bg-neutral-950/40 backdrop-blur-sm z-30 transition-opacity"
        />
      )}

      {/* Mobile Sidebar Slide-out Drawer */}
      <div
        className={`md:hidden fixed top-0 bottom-0 left-0 w-[260px] bg-white dark:bg-neutral-950 z-40 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </div>
    </>
  );
};
