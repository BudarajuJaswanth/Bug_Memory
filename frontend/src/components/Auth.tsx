import React, { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { showToast } from '../lib/toast';

interface AuthProps {
  onLoginSuccess: (user: { email: string; name: string }) => void;
  onBackToHome: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onBackToHome }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const getRegisteredUsers = (): string[] => {
    try {
      const stored = localStorage.getItem('bug_memory_registered_users');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const registerUser = (userEmail: string) => {
    const users = getRegisteredUsers();
    const cleanEmail = userEmail.trim().toLowerCase();
    if (!users.includes(cleanEmail)) {
      users.push(cleanEmail);
      localStorage.setItem('bug_memory_registered_users', JSON.stringify(users));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail || !password.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    if (isSignUp && !name.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const registered = getRegisteredUsers();

      if (!isSignUp) {
        if (!registered.includes(cleanEmail)) {
          showToast('User does not exist. Please create an account to login.', 'error');
          return;
        }
      } else {
        registerUser(cleanEmail);
      }

      const user = {
        email: cleanEmail,
        name: isSignUp ? name.trim() : cleanEmail.split('@')[0],
      };
      
      onLoginSuccess(user);
      showToast(isSignUp ? 'Account created successfully!' : 'Signed in successfully!', 'success');
    }, 800);
  };

  const handleSocialLogin = (provider: 'Google' | 'GitHub') => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const socialEmail = `developer@${provider.toLowerCase()}.com`;
      registerUser(socialEmail);

      const user = {
        email: socialEmail,
        name: `Demo ${provider} Developer`,
      };
      
      onLoginSuccess(user);
      showToast(`Connected via ${provider} successfully!`, 'success');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col md:flex-row relative">
      
      {/* LEFT COLUMN: BRAND GRAPHICS PANEL */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-tr from-neutral-950 via-neutral-900 to-teal-950 p-12 flex-col justify-between text-white relative overflow-hidden select-none border-r border-neutral-800">
        {/* Subtle background nodes glow */}
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top brand heading */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-tr from-teal-800 to-cyan-500 flex items-center justify-center text-white text-sm font-sans font-black shadow-[0_4px_12px_rgba(20,184,166,0.12)] border border-white/10 shrink-0">
            B
          </div>
          <span className="font-sans font-semibold tracking-wide text-sm flex items-center gap-1.5">
            BUG MEMORY
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-medium text-emerald-400">
              Live
            </span>
          </span>
        </div>

        {/* Dynamic feature highlights stack */}
        <div className="space-y-8 my-auto max-w-md">
          <h2 className="text-3xl font-bold tracking-tight leading-tight">
            Build your team's collective debugging index.
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Index tracebacks inside Cognee Cloud and automatically resolve them semantic-first before wasting time digging Slack or stack traces.
          </p>

          <div className="space-y-4 pt-4 border-t border-neutral-800/80">
            <div className="flex items-start gap-3 text-xs">
              <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>Semantic lookup structures matching similar traces in &lt;150ms.</span>
            </div>
            <div className="flex items-start gap-3 text-xs">
              <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>Gemini Rate-Limit Fallback synthesis for predicted fixes.</span>
            </div>
            <div className="flex items-start gap-3 text-xs">
              <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>D3 network topology graphs mapping exceptions to project files.</span>
            </div>
          </div>
        </div>

        {/* Footer brand details */}
        <div className="text-[10px] text-neutral-500 font-mono">
          v1.0.0 · Cognee Graph API Online
        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN CREDENTIALS FORM */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-neutral-50 dark:bg-neutral-950 relative">
        
        {/* Floating Back to Home button */}
        <button
          onClick={onBackToHome}
          className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <div className="mx-auto w-full max-w-sm lg:w-96 space-y-6">
          
          {/* Brand logo for mobile screens */}
          <div className="md:hidden text-center space-y-2 mb-6 select-none">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-[14px] bg-gradient-to-tr from-teal-800 to-cyan-500 text-white font-sans font-black text-xl shadow-[0_4px_16px_rgba(20,184,166,0.12)] border border-white/10 mx-auto">
              B
            </div>
            <h2 className="text-sm font-semibold tracking-wide text-neutral-900 dark:text-neutral-50 font-sans uppercase">
              BUG MEMORY
            </h2>
          </div>

          {/* Core card header info */}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
              {isSignUp ? 'Create a new account' : 'Welcome back'}
            </h3>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              {isSignUp ? 'Get started with a free developer workspace.' : 'Enter your details or continue with an identity provider.'}
            </p>
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialLogin('Google')}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 focus:outline-none transition-all disabled:opacity-50"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              onClick={() => handleSocialLogin('GitHub')}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 focus:outline-none transition-all disabled:opacity-50"
            >
              <svg className="h-4 w-4 fill-neutral-850 dark:fill-neutral-300 shrink-0" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                />
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
            <span className="flex-shrink mx-3 text-[9px] text-neutral-400 font-bold tracking-wider uppercase font-sans">
              or continue with email
            </span>
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-850 dark:text-neutral-100 placeholder-neutral-450 focus:outline-none focus:bg-white dark:focus:bg-neutral-900 focus:border-accent"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-850 dark:text-neutral-100 placeholder-neutral-450 focus:outline-none focus:bg-white dark:focus:bg-neutral-900 focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-850 dark:text-neutral-100 placeholder-neutral-450 focus:outline-none focus:bg-white dark:focus:bg-neutral-900 focus:border-accent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 text-xs font-semibold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all text-center"
            >
              {loading ? 'Processing...' : isSignUp ? 'Sign up' : 'Login'}
            </button>
          </form>

          {/* Form Switch Link */}
          <div className="text-center pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setIsSignUp(!isSignUp);
                setEmail('');
                setPassword('');
                setName('');
              }}
              className="text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-accent transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
