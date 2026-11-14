'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Smile,
  Heart,
  Briefcase,
  Coffee,
  Info,
  Key,
  ShieldCheck,
  Check
} from 'lucide-react';
import { AIEngine, AppSettings, ContactThread, ConversationTone } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  activeThread: ContactThread;
  onUpdateThreadNote: (note: string) => void;
  onChangeEngine: (engine: AIEngine) => void;
  onChangeTone: (tone: ConversationTone) => void;
  onSaveSettings: (settings: AppSettings) => void;
}

const TONES: { id: ConversationTone; label: string; icon: React.ReactNode }[] = [
  { id: 'casual', label: 'Casual', icon: <Coffee className="h-3 w-3" /> },
  { id: 'friendly', label: 'Friendly', icon: <Smile className="h-3 w-3" /> },
  { id: 'flirty', label: 'Romantic', icon: <Heart className="h-3 w-3 text-rose-400" /> },
  { id: 'formal', label: 'Formal', icon: <Briefcase className="h-3 w-3" /> },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  activeThread,
  onUpdateThreadNote,
  onChangeEngine,
  onChangeTone,
  onSaveSettings,
}) => {
  const [noteValue, setNoteValue] = useState(activeThread.note || '');
  const [isSaved, setIsSaved] = useState(false);

  // Sync note value when thread changes
  React.useEffect(() => {
    setNoteValue(activeThread.note || '');
  }, [activeThread.id, activeThread.note]);

  if (!isOpen) return null;

  const handleSaveNote = () => {
    onUpdateThreadNote(noteValue.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="flex w-full max-w-sm flex-col rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">
              إعدادات المحادثة (Chat Settings)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="py-3 space-y-3.5 text-xs">
          {/* 1. Tone Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              نبرة الرد المقترح (Tone):
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {TONES.map((t) => {
                const isActive = (activeThread.defaultTone || settings.tone) === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onChangeTone(t.id)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 px-2 text-[11px] font-medium transition ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
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

          {/* 2. AI Engine Switcher */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-300">
                محرك الذكاء الاصطناعي (AI Engine):
              </label>
              <span className="text-[10px] text-emerald-400">تحويل تلقائي Fallback</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-slate-900 p-1 border border-slate-800">
              <button
                onClick={() => onChangeEngine('openrouter')}
                className={`rounded-md py-1.5 text-[11px] font-semibold transition ${
                  settings.engine === 'openrouter'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                OpenRouter (Fast)
              </button>
              <button
                onClick={() => onChangeEngine('gemini')}
                className={`rounded-md py-1.5 text-[11px] font-semibold transition ${
                  settings.engine === 'gemini'
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Gemini 3.8
              </button>
            </div>
          </div>

          {/* 3. Contact Context Note */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-300">
                ملاحظة سياق وجنس {activeThread.name}:
              </label>
              {isSaved && (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                  <Check className="h-3 w-3" /> تم الحفظ
                </span>
              )}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                placeholder="e.g. Female, Madrid, crush / romantic"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <button
                onClick={handleSaveNote}
                className="rounded-lg bg-slate-800 hover:bg-slate-750 px-3 py-1 text-xs font-semibold text-slate-200 transition"
              >
                حفظ
              </button>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              تساعد الذكاء الاصطناعي على ضبط التذكير والتأنيث بدقة (مثل cansada vs cansado).
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-bold text-white transition"
          >
            تم (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
