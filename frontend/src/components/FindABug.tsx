import React, { useState, useEffect } from 'react';
import { Sparkles, Check, ArrowRight, ChevronDown, ChevronUp, Search, Calendar, FolderOpen } from 'lucide-react';
import { api } from '../lib/api';
import type { RecallResponse, RecallResultItem } from '../lib/api';
import { showToast } from '../lib/toast';

interface FindABugProps {
  selectedProject: string;
}

export const FindABug: React.FC<FindABugProps> = ({ selectedProject }) => {
  const [errorText, setErrorText] = useState('');
  const [loading, setLoading] = useState(false);
  const [recallResponse, setRecallResponse] = useState<RecallResponse | null>(null);
  
  // Solved bugs history
  const [solvedBugs, setSolvedBugs] = useState<any[]>([]);
  const [loadingBugs, setLoadingBugs] = useState(false);
  const [expandedBugId, setExpandedBugId] = useState<number | null>(null);
  const [bugFilter, setBugFilter] = useState('');

  // Editable states for AI suggestions
  const [aiRootCause, setAiRootCause] = useState('');
  const [aiFix, setAiFix] = useState('');
  const [aiFile, setAiFile] = useState('');
  const [aiTags, setAiTags] = useState('');

  // Manual bug record mode states
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualRootCause, setManualRootCause] = useState('');
  const [manualFix, setManualFix] = useState('');
  const [manualFile, setManualFile] = useState('');
  const [manualTags, setManualTags] = useState('');

  const fetchSolvedBugs = async () => {
    if (!selectedProject) {
      setSolvedBugs([]);
      return;
    }
    setLoadingBugs(true);
    try {
      const res = await api.getProjectBugs(selectedProject);
      setSolvedBugs(res.bugs || []);
    } catch {
      // Handled globally
    } finally {
      setLoadingBugs(false);
    }
  };

  useEffect(() => {
    fetchSolvedBugs();
    setRecallResponse(null);
    setErrorText('');
    setExpandedBugId(null);
  }, [selectedProject]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      showToast('Please select or create a project first', 'error');
      return;
    }
    if (!errorText.trim()) return;

    setLoading(true);
    setRecallResponse(null);
    
    // Generate UUID session_id
    const sessionId = window.crypto.randomUUID 
      ? window.crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    try {
      const response = await api.recallBug(selectedProject, errorText.trim(), sessionId);
      setRecallResponse(response);

      // Pre-fill editable states if suggestion is returned
      if (response.source === 'ai_suggested' && response.results.length > 0) {
        const item = response.results[0];
        setAiRootCause(item.root_cause || '');
        setAiFix(item.fix || '');
        setAiFile('');
        setAiTags('ai-suggested');
      }
    } catch {
      // Error handled by API client interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMemory = async (resultItem: RecallResultItem) => {
    if (!recallResponse) return;
    setLoading(true);
    try {
      await api.confirmFix({
        session_id: recallResponse.session_id,
        source: 'memory',
        project: selectedProject,
        error: errorText.trim(),
        root_cause: resultItem.root_cause || '',
        fix: resultItem.fix || '',
        file: '',
        tags: [],
      });
      showToast('Memory reinforced', 'memory');
      setRecallResponse(null);
      setErrorText('');
      fetchSolvedBugs(); // Refresh list
    } catch {
      // Error handled globally
    } finally {
      setLoading(false);
    }
  };

  const handleRejectMemory = async () => {
    if (!recallResponse) return;
    setLoading(true);
    try {
      await api.submitFeedback({
        session_id: recallResponse.session_id,
        helpful: false,
        note: 'Not quite - user rejected this solution memory',
      });
      showToast('Memory reinforced', 'memory');
      setRecallResponse(null);
    } catch {
      // Error handled globally
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAiSuggestion = async () => {
    if (!recallResponse) return;
    setLoading(true);
    
    const parsedTags = aiTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      await api.confirmFix({
        session_id: recallResponse.session_id,
        source: 'ai_suggested',
        project: selectedProject,
        error: errorText.trim(),
        root_cause: aiRootCause,
        fix: aiFix,
        file: aiFile.trim(),
        tags: parsedTags,
      });
      showToast('Saved to memory', 'memory');
      setRecallResponse(null);
      setErrorText('');
      fetchSolvedBugs(); // Refresh list
    } catch {
      // Error handled globally
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      showToast('Please select or create a project first', 'error');
      return;
    }
    if (!errorText.trim() || !manualRootCause.trim() || !manualFix.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    const parsedTags = manualTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      await api.createBug({
        project: selectedProject,
        error: errorText.trim(),
        root_cause: manualRootCause.trim(),
        fix: manualFix.trim(),
        file: manualFile.trim(),
        tags: parsedTags,
      });
      showToast('Saved to memory', 'memory');
      setErrorText('');
      setManualRootCause('');
      setManualFix('');
      setManualFile('');
      setManualTags('');
      setIsManualMode(false);
      fetchSolvedBugs(); // Refresh list
    } catch {
      // Handled globally
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandBug = (id: number) => {
    setExpandedBugId(expandedBugId === id ? null : id);
  };

  // Filter bugs based on keyword search
  const filteredBugs = solvedBugs.filter((bug) => {
    const q = bugFilter.toLowerCase();
    return (
      bug.error.toLowerCase().includes(q) ||
      bug.root_cause.toLowerCase().includes(q) ||
      bug.file.toLowerCase().includes(q) ||
      bug.tags.some((tag: string) => tag.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 py-2">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 mb-1">
          Find a Bug
        </h1>
        <p className="text-xs text-neutral-500">
          {isManualMode 
            ? 'Manually record a known bug and its verified resolution directly into project memory.'
            : 'Enter your traceback or error message to recall verified fixes or analyze solutions.'}
        </p>
      </div>

      {isManualMode ? (
        /* Manual registration form */
        <form onSubmit={handleManualSubmit} className="card-premium space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1.5">
              Error Traceback / Output *
            </label>
            <textarea
              required
              rows={4}
              disabled={loading}
              value={errorText}
              onChange={(e) => setErrorText(e.target.value)}
              placeholder="Paste raw error message (e.g. KeyError: 'user_profile_data')..."
              className="w-full px-4 py-3 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 font-mono focus:outline-none focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all resize-y"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1.5">
              Root Cause *
            </label>
            <textarea
              required
              rows={2}
              disabled={loading}
              value={manualRootCause}
              onChange={(e) => setManualRootCause(e.target.value)}
              placeholder="Explain why this happened..."
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all resize-y"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1.5">
              Actioned Fix *
            </label>
            <textarea
              required
              rows={4}
              disabled={loading}
              value={manualFix}
              onChange={(e) => setManualFix(e.target.value)}
              placeholder="Paste the resolved code or instructions..."
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 font-mono focus:outline-none focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1.5">
                Impacted File *
              </label>
              <input
                type="text"
                required
                disabled={loading}
                value={manualFile}
                onChange={(e) => setManualFile(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                placeholder="e.g. api/auth.py"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1.5">
                Tags (comma separated)
              </label>
              <input
                type="text"
                disabled={loading}
                value={manualTags}
                onChange={(e) => setManualTags(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                placeholder="e.g. keyerror, auth, auth-check"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-100 flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setIsManualMode(false);
                setErrorText('');
              }}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors disabled:opacity-50"
            >
              ← Back to traceback analyzer
            </button>

            <div className="flex items-center gap-3">
              {!errorText.trim() || !manualRootCause.trim() || !manualFix.trim() || !manualFile.trim() ? (
                <span className="text-[10px] text-neutral-405 italic text-neutral-400">Please fill in all required fields (*).</span>
              ) : null}

              <button
                type="submit"
                disabled={loading || !errorText.trim() || !manualRootCause.trim() || !manualFix.trim() || !manualFile.trim() || !selectedProject}
                className="px-4 py-2 text-xs font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
              >
                {loading ? 'Saving...' : 'Save directly to memory'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Traceback lookup search form */
        <form onSubmit={handleSearch} className="card-premium space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-2">
              Error Stack Trace / Output
            </label>
            <textarea
              required
              rows={5}
              disabled={loading}
              value={errorText}
              onChange={(e) => setErrorText(e.target.value)}
              placeholder="Paste raw error message (e.g. ValueError: Cannot convert non-finite values (NA or inf) to integer)..."
              className="w-full px-4 py-3 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 font-mono focus:outline-none focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all resize-y"
            />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="text-[10px] font-mono text-neutral-400">
              {selectedProject ? (
                <span>Target project: <strong className="text-neutral-600">{selectedProject}</strong></span>
              ) : (
                <span className="text-red-500 font-semibold">No active project selected</span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsManualMode(true);
                  setRecallResponse(null);
                }}
                className="text-xs font-medium text-neutral-500 hover:text-accent transition-colors"
              >
                Or, record a fix manually
              </button>

              <button
                type="submit"
                disabled={loading || !errorText.trim() || !selectedProject}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
              >
                {loading ? 'Searching...' : 'Analyze Stack'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Calm skeleton loader */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="h-4 bg-neutral-200 rounded-md w-1/4" />
            <span className="text-[10px] text-neutral-400 font-mono italic animate-pulse">Checking memory database & synthesizing fallback fixes...</span>
          </div>
          <div className="card-premium space-y-3 bg-neutral-100/50 border-neutral-100">
            <div className="h-3 bg-neutral-200 rounded-md w-3/4" />
            <div className="h-3 bg-neutral-200 rounded-md w-1/2" />
            <div className="h-8 bg-neutral-200 rounded-md w-24 mt-4" />
          </div>
        </div>
      )}

      {/* Search results render */}
      {recallResponse && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
            <span className="text-xs font-semibold text-neutral-800">
              Results for {selectedProject}
            </span>
          </div>

          {/* MEMORY SOURCE VIEW */}
          {recallResponse.source === 'memory' && (
            <div className="space-y-4">
              {recallResponse.results.map((result, idx) => (
                <div key={idx} className="card-premium space-y-4 relative">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200">
                    <Check className="w-3 h-3 text-neutral-600" />
                    <span className="text-[10px] font-medium text-neutral-600">Verified Memory</span>
                  </div>

                  <div className="space-y-3 pr-28">
                    <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-2.5 mb-2">
                      <p className="text-[10px] text-neutral-500 font-sans leading-normal">
                        ℹ️ <strong>Direct Memory Match</strong>: This resolution was successfully semantically retrieved from your project's Cognee database. It represents a past confirmed bug fix.
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                        Summary
                      </span>
                      <p className="text-xs text-neutral-700 leading-relaxed font-mono whitespace-pre-wrap">
                        {result.text}
                      </p>
                    </div>

                    {result.root_cause && (
                      <div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                          Root Cause
                        </span>
                        <p className="text-xs text-neutral-700 leading-relaxed">
                          {result.root_cause}
                        </p>
                      </div>
                    )}

                    {result.fix && (
                      <div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                          Actioned Fix
                        </span>
                        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono text-xs text-neutral-800 overflow-x-auto whitespace-pre-wrap">
                          {result.fix}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-neutral-100">
                    <button
                      onClick={() => handleConfirmMemory(result)}
                      disabled={loading}
                      className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      This solved it
                    </button>
                    <button
                      onClick={handleRejectMemory}
                      disabled={loading}
                      className="px-3.5 py-1.5 text-xs font-medium text-neutral-500 bg-white hover:text-neutral-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Not quite
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI SUGGESTED VIEW */}
          {recallResponse.source === 'ai_suggested' && recallResponse.results.length > 0 && (
            <div className="space-y-4">
              <div className="card-premium space-y-5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-neutral-500 animate-pulse" />
                  <span className="text-xs italic text-neutral-500 font-medium">
                    Suggested — not yet confirmed
                  </span>
                </div>

                <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-2.5">
                  <p className="text-[10px] text-amber-800 font-sans leading-normal">
                    ⚠️ <strong>AI Fallback Suggestion</strong>: No matching traceback was found in the memory database. A resolution has been synthesized dynamically. Please review the root cause and fix below, edit them if needed, and confirm to store it in memory for future queries.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1.5">
                      Suggested Root Cause
                    </label>
                    <textarea
                      rows={2}
                      value={aiRootCause}
                      onChange={(e) => setAiRootCause(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all resize-y"
                      placeholder="Verify or edit the suggested root cause..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1.5">
                      Actioned Fix
                    </label>
                    <textarea
                      rows={4}
                      value={aiFix}
                      onChange={(e) => setAiFix(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 font-mono focus:outline-none focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all resize-y"
                      placeholder="Define the code fix block..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1.5">
                        Impacted File *
                      </label>
                      <input
                        type="text"
                        required
                        value={aiFile}
                        onChange={(e) => setAiFile(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                        placeholder="e.g. services/openai_service.py"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1.5">
                        Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        value={aiTags}
                        onChange={(e) => setAiTags(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                        placeholder="e.g. indexerror, list-length, fix"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-end gap-3 flex-wrap">
                  {!aiRootCause.trim() || !aiFix.trim() || !aiFile.trim() ? (
                    <span className="text-[10px] text-neutral-405 italic text-neutral-400">Suggested root cause, fix, and impacted file (*) are required.</span>
                  ) : null}
                  <button
                    onClick={handleConfirmAiSuggestion}
                    disabled={loading || !aiRootCause.trim() || !aiFix.trim() || !aiFile.trim()}
                    className="px-4 py-2 text-xs font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
                  >
                    Confirm and save to memory
                  </button>
                </div>
              </div>
            </div>
          )}

          {recallResponse.source === 'error' && (
            <div className="card-premium border-red-200 bg-red-50/20 p-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-red-500 block mb-1">
                Execution Error
              </span>
              <p className="text-xs text-red-700 leading-relaxed font-mono">
                {recallResponse.results[0]?.text || 'Failed to complete query. Please retry.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 🚀 Solved Bugs History List Gated under selected project */}
      {selectedProject && !recallResponse && (
        <div className="space-y-4 pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-neutral-800">
                Solved Resolutions History
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-[9px] font-bold text-neutral-500 font-mono">
                {solvedBugs.length}
              </span>
            </div>
            
            {solvedBugs.length > 0 && (
              <div className="relative w-48 sm:w-64">
                <input
                  type="text"
                  value={bugFilter}
                  onChange={(e) => setBugFilter(e.target.value)}
                  placeholder="Filter resolutions..."
                  className="w-full pl-7 pr-3 py-1 text-[11px] bg-white border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:border-accent"
                />
                <Search className="w-3 h-3 text-neutral-400 absolute left-2.5 top-2" />
              </div>
            )}
          </div>

          {loadingBugs ? (
            <div className="py-8 text-center text-xs text-neutral-400 font-sans">
              Loading workspace history...
            </div>
          ) : filteredBugs.length === 0 ? (
            <div className="card-premium py-10 text-center border-dashed bg-neutral-50/20 flex flex-col items-center justify-center space-y-3">
              <FolderOpen className="w-6 h-6 text-neutral-300" />
              <span className="text-xs text-neutral-400 font-sans max-w-sm">
                {bugFilter ? 'No resolutions match your search terms.' : 'No bug resolutions have been logged to this project\'s database yet.'}
              </span>
              {!bugFilter && (
                <button
                  onClick={() => setIsManualMode(true)}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-all shadow-sm"
                >
                  Record a Fix Manually
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBugs.map((bug) => {
                const isExpanded = expandedBugId === bug.id;
                return (
                  <div 
                    key={bug.id} 
                    className="card-premium p-4 border border-neutral-200 hover:border-neutral-300 transition-all cursor-pointer space-y-2 bg-white"
                    onClick={() => toggleExpandBug(bug.id)}
                  >
                    {/* Bug header preview */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                            {bug.file || 'General File'}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {bug.created_at ? new Date(bug.created_at).toLocaleDateString() : 'Recorded'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-neutral-800 truncate mt-1.5 font-mono">
                          {bug.error}
                        </p>
                      </div>
                      
                      <div className="shrink-0 text-neutral-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Expaned details view */}
                    {isExpanded && (
                      <div className="space-y-3 pt-3 border-t border-neutral-100 mt-2 animate-in fade-in slide-in-from-top-1 duration-150" onClick={(e) => e.stopPropagation()}>
                        <div>
                          <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-400 block mb-1">Full Traceback</span>
                          <p className="text-xs font-mono bg-neutral-50/50 p-2.5 rounded border border-neutral-100 text-neutral-700 whitespace-pre-wrap select-text max-h-40 overflow-y-auto">
                            {bug.error}
                          </p>
                        </div>
                        
                        <div>
                          <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-400 block mb-1">Root Cause</span>
                          <p className="text-xs text-neutral-700 leading-relaxed font-sans select-text">
                            {bug.root_cause}
                          </p>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-400 block mb-1">Confirmed Fix</span>
                          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono text-xs text-neutral-800 overflow-x-auto whitespace-pre-wrap select-text">
                            {bug.fix}
                          </div>
                        </div>

                        {bug.tags && bug.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {bug.tags.map((tag: string) => (
                              <span key={tag} className="px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-[10px] text-neutral-600 font-mono">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
