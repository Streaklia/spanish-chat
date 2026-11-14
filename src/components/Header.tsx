'use client';

import React from 'react';
import {
  Settings,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
  Users
} from 'lucide-react';
import { ContactThread } from '@/types';

interface HeaderProps {
  activeThread: ContactThread;
  onOpenContacts: () => void;
  onOpenSettings: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  engine: 'gemini' | 'openrouter';
}

export const Header: React.FC<HeaderProps> = ({
  activeThread,
  onOpenContacts,
  onOpenSettings,
  theme,
  onToggleTheme,
  engine
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-12 max-w-2xl items-center justify-between px-3">
        {/* Left Side: Brand, Active Thread Selector, Settings Gear */}
        <div className="flex items-center gap-2">
          {/* Minimalist Logo Badge */}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-emerald-500 shadow-sm">
            <span className="text-[10px] font-black text-white tracking-tighter">ES/AR</span>
          </div>

          {/* Active Thread Switcher Button */}
          <button
            onClick={onOpenContacts}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1 text-left transition hover:bg-slate-850 active:scale-[0.98]"
            title="Switch contact / chat thread"
          >
            <span className="max-w-[130px] truncate text-xs font-semibold text-slate-100 sm:max-w-[180px]">
              {activeThread.name}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {/* Small Settings Gear Icon */}
          <button
            onClick={onOpenSettings}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Chat Settings (Tone, Engine, Context Note)"
            aria-label="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Right Side: Theme Toggle & All Contacts Trigger */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenContacts}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 transition"
            title="Contacts list"
            aria-label="Contacts list"
          >
            <Users className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={onToggleTheme}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 transition"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-indigo-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
