import React, { useEffect, useState, useRef } from 'react';
import { Search, Terminal, LayoutDashboard, Bug, Network, Folder, CornerDownRight } from 'lucide-react';
import type { ProjectListItem } from '../lib/api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
  projects: ProjectListItem[];
  selectedProject: string;
  setSelectedProject: (project: string) => void;
  bugs: any[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  projects,
  selectedProject,
  setSelectedProject,
  bugs,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Toggle open on Ctrl+K / Cmd+K
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, search, selectedIndex]);

  // Categories of commands
  const navigationCommands = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, category: 'Navigation', action: () => setActiveTab('dashboard') },
    { id: 'find-bug', label: 'Go to Find a Bug', icon: Bug, category: 'Navigation', action: () => setActiveTab('find-bug') },
    { id: 'graph', label: 'Go to Memory Graph', icon: Network, category: 'Navigation', action: () => setActiveTab('graph') },
    { id: 'projects', label: 'Go to Projects', icon: Folder, category: 'Navigation', action: () => setActiveTab('projects') },
  ];

  const projectCommands = projects.map((p) => ({
    id: `project-${p.name}`,
    label: `Switch to project "${p.name}"`,
    icon: Folder,
    category: 'Workspaces',
    action: () => {
      setSelectedProject(p.name);
      showToastNotification(`Switched to workspace: ${p.name}`);
    },
  }));

  const bugCommands = bugs.map((b) => ({
    id: `bug-${b.id}`,
    label: `${b.file || 'Unknown file'} · ${b.error.substring(0, 45)}...`,
    icon: Terminal,
    category: 'Solved Resolutions',
    action: () => {
      setActiveTab('find-bug');
      // Scroll or trigger selection (handled via local state if possible)
    },
  }));

  const allItems = [...navigationCommands, ...projectCommands, ...bugCommands];

  const filteredItems = allItems.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (item: any) => {
    item.action();
    onClose();
  };

  const showToastNotification = (msg: string) => {
    // Custom trigger (or dispatch custom event)
    const event = new CustomEvent('show-toast', { detail: { message: msg, type: 'success' } });
    window.dispatchEvent(event);
  };

  // Adjust scroll when navigating via keyboard
  useEffect(() => {
    const listEl = listRef.current;
    if (listEl) {
      const activeEl = listEl.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-neutral-900/30 dark:bg-neutral-950/60 backdrop-blur-[2px] flex items-start justify-center pt-24 px-4 z-50 animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[400px] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-2 px-4 border-b border-neutral-200 dark:border-neutral-800 h-12 shrink-0 bg-white dark:bg-neutral-900">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search commands, resolutions, or workspaces..."
            className="flex-1 bg-transparent text-xs text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none h-full"
          />
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-1.5 font-mono text-[9px] font-medium text-neutral-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-3 bg-neutral-50/50 dark:bg-neutral-900/40">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400 font-sans">
              No matching commands or resolutions found.
            </div>
          ) : (
            // Group items by category
            Object.entries(
              filteredItems.reduce((groups: any, item) => {
                const cat = item.category;
                if (!groups[cat]) groups[cat] = [];
                groups[cat].push(item);
                return groups;
              }, {})
            ).map(([category, items]: any) => (
              <div key={category} className="space-y-1">
                <h4 className="px-3 py-1 text-[9px] font-bold text-neutral-400 uppercase tracking-wider font-sans">
                  {category}
                </h4>
                <div className="space-y-0.5">
                  {items.map((item: any) => {
                    const globalIndex = filteredItems.findIndex((x) => x.id === item.id);
                    const isActive = selectedIndex === globalIndex;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        data-active={isActive}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-all ${
                          isActive
                            ? 'bg-accent text-white font-medium shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                        <span className="truncate flex-1">{item.label}</span>
                        {isActive && (
                          <span className="text-[10px] text-teal-100 font-mono flex items-center gap-0.5 shrink-0">
                            Select <CornerDownRight className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Palette Status */}
        <div className="h-9 px-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between text-[9px] text-neutral-400 font-sans select-none shrink-0">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <div>
            Active Workspace: <strong className="text-neutral-600 dark:text-neutral-300">{selectedProject || 'None'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
