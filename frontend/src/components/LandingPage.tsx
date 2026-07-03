import React from 'react';
import { Bug, Sparkles, Search, Network, Zap, Clock, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onLoginTrigger: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginTrigger }) => {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans selection:bg-teal-100 selection:text-teal-900 transition-colors duration-200">
      
      {/* Sticky Blur Navigation Header */}
      <header className="sticky top-0 z-30 w-full bg-white/70 dark:bg-neutral-950/70 backdrop-blur-md border-b border-neutral-200/60 dark:border-neutral-900/60 select-none">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-teal-800 to-cyan-500 flex items-center justify-center text-white text-xs font-sans font-black shadow-[0_4px_12px_rgba(20,184,166,0.12)] border border-white/10 shrink-0">
              B
            </div>
            <span className="font-sans font-semibold tracking-wide text-sm flex items-center gap-1.5">
              BUG MEMORY
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-[9px] font-medium text-emerald-700 dark:text-emerald-400">
                Live
              </span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            <a href="#features" className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">How It Works</a>
            <a href="#benefits" className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">Benefits</a>
            <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 text-[8px]">PRICING COMING SOON</span>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={onLoginTrigger}
              className="px-3.5 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={onLoginTrigger}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-accent hover:bg-accent-hover rounded-lg shadow-sm transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 max-w-6xl mx-auto text-center space-y-8 animate-fade-in">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/20 border border-teal-100/50 dark:border-teal-900/30 text-[10px] text-teal-700 dark:text-teal-400 font-semibold tracking-wide uppercase mx-auto">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            AI-POWERED COLLABORATIVE TRACEBACKS INDEX
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 max-w-3xl mx-auto leading-[1.15]">
            Never Solve the <span className="bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent">Same Bug Twice</span>.
          </h1>
          <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            BUG MEMORY is an AI-powered debugging knowledge platform that helps developers store, search, understand, and reuse solutions for every runtime exception they encounter.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={onLoginTrigger}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-accent hover:bg-accent-hover rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </button>
          <a 
            href="#features"
            className="px-5 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
          >
            Learn More
          </a>
        </div>

        {/* Interactive Hero Tech Graphic (Code / Memory Graph mock-up) */}
        <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 p-2 shadow-2xl max-w-4xl mx-auto overflow-hidden animate-fade-in pt-4">
          <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800 rounded-xl p-4 sm:p-6 font-mono text-left text-xs text-neutral-700 dark:text-neutral-300 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 ml-2">analyzer_terminal.py</span>
              </div>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping" />
                Indexed via Cognee Graph
              </span>
            </div>
            
            <div className="space-y-1">
              <p className="text-red-500 font-semibold">// TypeError: Cannot read properties of undefined (reading 'split')</p>
              <p className="text-neutral-400">// Root Cause Identified:</p>
              <p className="text-neutral-600 dark:text-neutral-400">  The user metadata state loaded asynchronously but was evaluated synchronously before fallback checks.</p>
              <p className="text-teal-600 dark:text-teal-400">// Confirmed Fix:</p>
              <p className="text-neutral-800 dark:text-neutral-200">  const cleanEmail = email?.trim().toLowerCase() || 'guest@domain.com';</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid Section */}
      <section id="features" className="py-20 px-4 bg-white dark:bg-neutral-900 border-y border-neutral-200/60 dark:border-neutral-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              Complete Traceback Context & Graph Recall
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
              Everything you need to index, recall, and prevent developer exception repetition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl space-y-3 bg-neutral-50/50 dark:bg-neutral-950/20">
              <Bug className="w-5 h-5 text-accent" />
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-250">Smart Bug Storage</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Store exceptions and traceback outputs with custom context variables, files, and category tags.
              </p>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl space-y-3 bg-neutral-50/50 dark:bg-neutral-950/20">
              <Sparkles className="w-5 h-5 text-accent animate-pulse" />
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-250">AI Root Cause Synthesis</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Receive instant predicted root cause reviews and synthesized fixes when error queries aren't found.
              </p>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl space-y-3 bg-neutral-50/50 dark:bg-neutral-950/20">
              <Search className="w-5 h-5 text-accent" />
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-250">Semantic Search</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Retrieve historical resolutions using natural language queries powered by semantic vector matching.
              </p>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl space-y-3 bg-neutral-50/50 dark:bg-neutral-950/20">
              <Network className="w-5 h-5 text-accent" />
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-250">Interactive Memory Graph</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Visualize connection pathways between tags, trace files, and bugs generated inside Cognee.
              </p>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl space-y-3 bg-neutral-50/50 dark:bg-neutral-950/20">
              <Zap className="w-5 h-5 text-accent" />
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-250">Instant AI Suggestions</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Centralized OpenAI/Gemini integration feeds instant fix schemas straight to your analyzer prompt.
              </p>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl space-y-3 bg-neutral-50/50 dark:bg-neutral-950/20">
              <Clock className="w-5 h-5 text-accent" />
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-250">Time Saved Analytics</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Check exactly how many developer hours were saved by reusing historical workspace memory assets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works timeline Section */}
      <section id="how-it-works" className="py-20 px-4 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            How It Works
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            A frictionless workflow for modern developers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
          <div className="space-y-2 text-center p-4">
            <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/30 border border-teal-200/50 flex items-center justify-center text-xs font-bold text-accent mx-auto mb-2">1</div>
            <h3 className="text-xs font-semibold text-neutral-800 dark:text-neutral-250">Capture Exception</h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Paste runtime outputs or tracebacks in the lookup console.</p>
          </div>
          <div className="space-y-2 text-center p-4">
            <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/30 border border-teal-200/50 flex items-center justify-center text-xs font-bold text-accent mx-auto mb-2">2</div>
            <h3 className="text-xs font-semibold text-neutral-800 dark:text-neutral-250">AI Analysis</h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Gemini/OpenAI evaluates root causes and structures fixes.</p>
          </div>
          <div className="space-y-2 text-center p-4">
            <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/30 border border-teal-200/50 flex items-center justify-center text-xs font-bold text-accent mx-auto mb-2">3</div>
            <h3 className="text-xs font-semibold text-neutral-800 dark:text-neutral-250">Save Solution</h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Record resolutions directly to the Cognee database.</p>
          </div>
          <div className="space-y-2 text-center p-4">
            <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/30 border border-teal-200/50 flex items-center justify-center text-xs font-bold text-accent mx-auto mb-2">4</div>
            <h3 className="text-xs font-semibold text-neutral-800 dark:text-neutral-250">Reuse Anytime</h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Query natural text next time to instantly recover fixes.</p>
          </div>
        </div>
      </section>

      {/* Benefits stats Section */}
      <section id="benefits" className="py-20 px-4 bg-teal-950 text-white border-y border-teal-900 text-center select-none">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-1">
            <p className="text-4xl font-extrabold tracking-tight text-teal-300">90%</p>
            <p className="text-xs text-teal-100/70 uppercase tracking-wider font-semibold">Faster Resolution</p>
          </div>
          <div className="space-y-1">
            <p className="text-4xl font-extrabold tracking-tight text-teal-300">1000+</p>
            <p className="text-xs text-teal-100/70 uppercase tracking-wider font-semibold">Bug Memories Solved</p>
          </div>
          <div className="space-y-1">
            <p className="text-4xl font-extrabold tracking-tight text-teal-300">100%</p>
            <p className="text-xs text-teal-100/70 uppercase tracking-wider font-semibold">Knowledge Retrieval</p>
          </div>
          <div className="space-y-1">
            <p className="text-4xl font-extrabold tracking-tight text-teal-300">Infinite</p>
            <p className="text-xs text-teal-100/70 uppercase tracking-wider font-semibold">Hours Saved</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Loved by Frontend & Core Systems Engineers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-6 rounded-xl space-y-4 shadow-sm">
            <p className="text-xs text-neutral-600 dark:text-neutral-400 italic leading-relaxed">
              "We used to waste hours digging through Slack logs for the same database query timeout fix we solved months ago. Bug Memory recalled it immediately based on a semantic lookup of the trace."
            </p>
            <div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Senior Staff Engineer</p>
              <p className="text-[10px] text-neutral-400">Vercel Deployment Systems</p>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-6 rounded-xl space-y-4 shadow-sm">
            <p className="text-xs text-neutral-600 dark:text-neutral-400 italic leading-relaxed">
              "The force graph showing traceback connection variables helps us visual-cluster our microservices' errors. A masterpiece in dev UX."
            </p>
            <div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Fullstack Engineer</p>
              <p className="text-[10px] text-neutral-400">Linear Core Product Team</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200/80 dark:border-neutral-900 py-12 text-center text-xs text-neutral-400 space-y-4">
        <div className="flex justify-center gap-6 text-[11px] font-medium">
          <a href="#features" className="hover:text-neutral-800 dark:hover:text-neutral-200">Privacy Policy</a>
          <a href="#features" className="hover:text-neutral-800 dark:hover:text-neutral-200">Terms of Use</a>
          <a href="#features" className="hover:text-neutral-800 dark:hover:text-neutral-200">GitHub Contact</a>
        </div>
        <p className="text-[10px]">&copy; 2026 BUG MEMORY Inc. All rights reserved. Built for senior product engineers.</p>
      </footer>
    </div>
  );
};
