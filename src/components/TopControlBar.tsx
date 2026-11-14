'use client';

import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Sparkles,
  Globe2,
  Smile,
  Heart,
  Briefcase,
  Coffee,
  Info,
  Edit3,
  Bot
} from 'lucide-react';
import { AIEngine, ConversationTone, SpanishDialect, ContactThread } from '@/types';

interface TopControlBarProps {
  activeThread: ContactThread;
  onUpdateThreadNote: (note: string) => void;
  dialect: SpanishDialect;
  onChangeDialect: (dialect: SpanishDialect) => void;
  engine: AIEngine;
  onChangeEngine: (engine: AIEngine) => void;
  tone: ConversationTone;
  onChangeTone: (tone: ConversationTone) => void;
}

const TONES: { id: ConversationTone; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'casual', label: 'Casual', icon: <Coffee className="h-3 w-3" />, color: 'hover:border-amber-500/50 hover:text-amber-400' },
  { id: 'friendly', label: 'Friendly', icon: <Smile className="h-3 w-3" />, color: 'hover:border-emerald-500/50 hover:text-emerald-400' },
  { id: 'flirty', label: 'Flirty / Romantic', icon: <Heart className="h-3 w-3 text-rose-400" />, color: 'hover:border-rose-500/50 hover:text-rose-400' },
  { id: 'formal', label: 'Formal / Polite', icon: <Briefcase className="h-3 w-3" />, color: 'hover:border-blue-500/50 hover:text-blue-400' },
];

export const TopControlBar: React.FC<TopControlBarProps> = ({
  activeThread,
  onUpdateThreadNote,
  dialect,
  onChangeDialect,
  engine,
  onChangeEngine,
  tone,
  onChangeTone,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);
  const [noteValue, setNoteValue] = useState<string>(activeThread.note || '');

  // Synchronize note value when active thread changes
  React.useEffect(() => {
    setNoteValue(activeThread.note || '');
    setIsEditingNote(false);
  }, [activeThread.id, activeThread.note]);

  const handleSaveNote = () => {
    onUpdateThreadNote(noteValue);
    setIsEditingNote(false);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-3 pt-2 pb-1">
      <div className="overflow-hidden rounded-xl border border-slate-800/90 bg-slate-900/90 shadow-lg backdrop-blur-sm transition-all dark:border-slate-800 dark:bg-slate-900/90">
        {/* Compact Bar Header (Always Visible) */}
        <div className="flex items-center justify-between px-3 py-2">
          {/* Left summary tags */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px]">
            {/* Contact quick pill */}
            <span className="font-semibold text-slate-200">
              {activeThread.name}
            </span>

            {/* Dialect tag */}
            <button
              onClick={() => onChangeDialect(dialect === 'spain' ? 'latam' : 'spain')}
              className="flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-750 transition"
              title="Click to quickly switch dialect"
            >
              <span>{dialect === 'spain' ? '🇪🇸 Spain' : '🌎 LatAm'}</span>
            </button>

            {/* Tone tag */}
            <span className="flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-0.5 text-slate-300">
              {tone === 'casual' && '😎 Casual'}
              {tone === 'friendly' && '😊 Friendly'}
              {tone === 'flirty' && '💖 Flirty'}
              {tone === 'formal' && '👔 Formal'}
            </span>

            {/* Engine tag */}
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
              • {engine === 'gemini' ? 'Gemini 2.0 Flash' : 'OpenRouter'}
            </span>
          </div>

          {/* Right Collapse/Expand Trigger */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
            aria-label={isExpanded ? 'Collapse controls' : 'Expand controls'}
          >
            <span className="hidden xs:inline">{isExpanded ? 'Hide' : 'Controls'}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Expandable Controls Panel */}
        {isExpanded && (
          <div className="border-t border-slate-800/70 p-2.5 sm:p-3 space-y-2.5 bg-slate-950/40 animate-fade-in text-xs">
            {/* Row 1: Engine Switcher & Dialect Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* AI Engine Switcher */}
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 p-1.5">
                <span className="flex items-center gap-1.5 text-slate-300 text-[11px] font-medium pl-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  AI Engine
                </span>
                <div className="flex rounded-md bg-slate-950 p-0.5 border border-slate-800/80">
                  <button
                    onClick={() => onChangeEngine('gemini')}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium transition ${
                      engine === 'gemini'
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Gemini (Fast)
                  </button>
                  <button
                    onClick={() => onChangeEngine('openrouter')}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium transition ${
                      engine === 'openrouter'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    OpenRouter
                  </button>
                </div>
              </div>

              {/* Spanish Dialect Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 p-1.5">
                <span className="flex items-center gap-1.5 text-slate-300 text-[11px] font-medium pl-1">
                  <Globe2 className="h-3.5 w-3.5 text-emerald-400" />
                  Dialect
                </span>
                <div className="flex rounded-md bg-slate-950 p-0.5 border border-slate-800/80">
                  <button
                    onClick={() => onChangeDialect('spain')}
                    className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium transition ${
                      dialect === 'spain'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🇪🇸</span> Spain (Castellano)
                  </button>
                  <button
                    onClick={() => onChangeDialect('latam')}
                    className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium transition ${
                      dialect === 'latam'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🌎</span> LatAm
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Tone Selector Chips */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Conversation Tone:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {TONES.map((t) => {
                  const isActive = tone === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onChangeTone(t.id)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border py-1.5 px-2 text-[11px] font-medium transition ${
                        isActive
                          ? 'border-emerald-500/70 bg-emerald-500/15 text-emerald-300 shadow-sm'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                      }`}
                    >
                      {t.icon}
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 3: Contact Context Note (Crucial for Gender & Relationship Dynamics) */}
            <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <Info className="h-3 w-3 text-cyan-400" />
                  Context Memory for {activeThread.name}:
                </span>
                {!isEditingNote ? (
                  <button
                    onClick={() => setIsEditingNote(true)}
                    className="flex items-center gap-1 text-[10px] text-cyan-400 hover:underline"
                  >
                    <Edit3 className="h-2.5 w-2.5" /> Edit Note
                  </button>
                ) : (
                  <div className="flex gap-2 text-[10px]">
                    <button
                      onClick={handleSaveNote}
                      className="font-semibold text-emerald-400 hover:underline"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setNoteValue(activeThread.note || '');
                        setIsEditingNote(false);
                      }}
                      className="text-slate-400 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {isEditingNote ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={noteValue}
                    onChange={(e) => setNoteValue(e.target.value)}
                    placeholder="e.g. Female crush from Madrid, met on Instagram, friendly & romantic vibe"
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveNote();
                    }}
                  />
                  <p className="text-[10px] text-slate-400">
                    💡 Tip: Specifying gender (e.g. &quot;female&quot; or &quot;male&quot;) ensures 100% correct Spanish adjective agreements (e.g. cansada vs cansado, linda vs lindo).
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-300 italic">
                  {activeThread.note || (
                    <span className="text-slate-500">
                      No context note yet. Click &quot;Edit Note&quot; to specify gender, relationship, or city.
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
