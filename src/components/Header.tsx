'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  Settings,
  Sun,
  Moon,
  Sparkles,
  Download,
  ShieldCheck,
  ChevronDown
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md transition-colors dark:border-slate-800/80 dark:bg-slate-950/85">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-3 sm:px-4">
        {/* Left: Brand & Thread Selector Trigger */}
        <div className="flex items-center gap-2">
          {/* Logo Icon */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-emerald-500 shadow-md shadow-rose-500/10">
            <span className="text-sm font-black text-white tracking-tighter">ES/AR</span>
          </div>

          {/* Contact Thread Quick Switcher Button */}
          <button
            onClick={onOpenContacts}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-left transition hover:border-slate-700 hover:bg-slate-850 active:scale-[0.98]"
            title="Switch or manage contact threads"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="max-w-[120px] truncate text-xs font-semibold text-slate-100 sm:max-w-[170px]">
                  {activeThread.name}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </div>
              <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                {activeThread.dialect === 'spain' ? '🇪🇸 Spain' : '🌎 LatAm'} • {activeThread.messages.length} msgs
              </span>
            </div>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* PWA Install Button (if available) */}
          {canInstall && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1 rounded-lg bg-emerald-600/20 px-2 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition animate-pulse"
              title="Install ChatBridge App"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          {/* Engine indicator pill */}
          <div className="hidden xs:flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-300">
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>{engine === 'gemini' ? 'Gemini' : 'OpenRouter'}</span>
          </div>

          {/* Contacts Drawer button */}
          <button
            onClick={onOpenContacts}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 transition hover:bg-slate-800 hover:text-white"
            title="Manage Contacts & Threads"
            aria-label="Contacts"
          >
            <Users className="h-4 w-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 transition hover:bg-slate-800 hover:text-white"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Theme Toggle"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-300" />}
          </button>

          {/* Settings Modal */}
          <button
            onClick={onOpenSettings}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 transition hover:bg-slate-800 hover:text-white"
            title="Settings & AI Engines"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
