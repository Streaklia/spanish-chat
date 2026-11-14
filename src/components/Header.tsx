'use client';

import React from 'react';
import {
  Settings,
  Sun,
  Moon,
  ChevronDown,
  Users,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ContactThread } from '@/types';

interface HeaderProps {
  activeThread: ContactThread;
  onOpenContacts: () => void;
  onOpenSettings: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  engine: 'gemini' | 'openrouter';
  isIncognito: boolean;
  onToggleIncognito: () => void;
  onSaveIncognitoChat?: () => void;
  incognitoMessageCount?: number;
  modelStatus?: { isOnline: boolean; latencyMs?: number; label: string } | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeThread,
  onOpenContacts,
  onOpenSettings,
  theme,
  onToggleTheme,
  engine,
  isIncognito,
  onToggleIncognito,
  onSaveIncognitoChat,
  incognitoMessageCount = 0,
  modelStatus,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-12 max-w-2xl items-center justify-between px-3">
        {/* Left Side: Brand, Active Thread / Incognito Switcher, Settings Gear */}
        <div className="flex items-center gap-2">
          {/* Minimalist Logo Badge */}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-emerald-500 shadow-sm shrink-0">
            <span className="text-[10px] font-black text-white tracking-tighter">ES/AR</span>
          </div>

          {/* Active Thread / Incognito Indicator */}
          {isIncognito ? (
            <div className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-950/60 px-2 py-1 text-left">
              <EyeOff className="h-3 w-3 text-purple-400 shrink-0" />
              <span className="max-w-[120px] truncate text-xs font-semibold text-purple-200 sm:max-w-[160px]">
                Incognito Chat
              </span>
            </div>
          ) : (
            <button
              onClick={onOpenContacts}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1 text-left transition hover:bg-slate-850 active:scale-[0.98]"
              title="Switch contact / chat thread"
            >
              <span className="max-w-[120px] truncate text-xs font-semibold text-slate-100 sm:max-w-[160px]">
                {activeThread.name}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
          )}

          {/* Small Settings Gear Icon + Model Status Dot */}
          <div className="relative">
            <button
              onClick={onOpenSettings}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title={`Chat Settings • ${modelStatus ? modelStatus.label : 'Free Models'}`}
              aria-label="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
            {modelStatus && (
              <span
                className={`absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full border border-slate-950 ${
                  modelStatus.isOnline ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                title={modelStatus.label}
              />
            )}
          </div>
        </div>

        {/* Center / Save Incognito Chat (Appears when Incognito has messages) */}
        {isIncognito && incognitoMessageCount > 0 && onSaveIncognitoChat && (
          <button
            onClick={onSaveIncognitoChat}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-semibold px-2 py-1 shadow-sm transition active:scale-95 animate-fade-in"
            title="Save this incognito conversation to your local saved threads"
          >
            <Save className="h-3 w-3" />
            <span>Save Chat</span>
          </button>
        )}

        {/* Right Side: Incognito Toggle, Contacts, Theme Toggle */}
        <div className="flex items-center gap-1.5">
          {/* Incognito Mode Toggle Button */}
          <button
            onClick={onToggleIncognito}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition active:scale-95 ${
              isIncognito
                ? 'border border-purple-500/60 bg-purple-950/70 text-purple-200 hover:bg-purple-900 font-medium'
                : 'border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={
              isIncognito
                ? 'Incognito Mode is ON: Nothing is saved locally. Click to return to saved chats.'
                : 'Incognito Mode: Chat privately without saving anything to device storage.'
            }
            aria-label="Toggle Incognito Mode"
          >
            <EyeOff className={`h-3.5 w-3.5 ${isIncognito ? 'text-purple-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">
              {isIncognito ? 'Incognito' : 'Incognito'}
            </span>
          </button>

          {!isIncognito && (
            <button
              onClick={onOpenContacts}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 transition"
              title="Contacts & Threads"
              aria-label="Contacts list"
            >
              <Users className="h-3.5 w-3.5" />
            </button>
          )}

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
