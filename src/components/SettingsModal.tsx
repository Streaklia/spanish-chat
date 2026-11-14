'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Smile,
  Heart,
  Briefcase,
  Coffee,
  Check,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AIEngine, AppSettings, ContactThread, ConversationTone, FreeModelOption } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  activeThread: ContactThread;
  onUpdateThreadNote: (note: string) => void;
  onChangeEngine: (engine: AIEngine) => void;
  onSelectModel: (model: string) => void;
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
  onSelectModel,
  onChangeTone,
}) => {
  const [noteValue, setNoteValue] = useState(activeThread.note || '');
  const [isSaved, setIsSaved] = useState(false);

  // Free models state
  const [modelsList, setModelsList] = useState<FreeModelOption[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(settings.selectedModel || '');

  // One-click test state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  // Sync note
  useEffect(() => {
    setNoteValue(activeThread.note || '');
  }, [activeThread.id, activeThread.note]);

  // Fetch free models when modal opens or engine changes
  const fetchFreeModels = async (provider: AIEngine) => {
    setIsLoadingModels(true);
    setTestResult({ status: 'idle', message: '' });
    try {
      const res = await fetch(`/api/models?provider=${provider}`);
      const data = await res.json();
      if (data.models && Array.isArray(data.models)) {
        setModelsList(data.models);
        // Default to first model or keep current if valid
        if (!selectedModel || !data.models.some((m: FreeModelOption) => m.id === selectedModel)) {
          const first = data.models[0]?.id || '';
          setSelectedModel(first);
          onSelectModel(first);
        }
      }
    } catch (e) {
      console.error('Failed to load free models:', e);
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFreeModels(settings.engine);
    }
  }, [isOpen, settings.engine]);

  if (!isOpen) return null;

  const handleSaveNote = () => {
    onUpdateThreadNote(noteValue.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  const handleEngineSwitch = (engine: AIEngine) => {
    onChangeEngine(engine);
    setSelectedModel('');
    fetchFreeModels(engine);
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    onSelectModel(modelId);
    setTestResult({ status: 'idle', message: '' });
  };

  // One-Click Model Test
  const handleTestModel = async () => {
    if (!selectedModel) return;
    setIsTesting(true);
    setTestResult({ status: 'idle', message: '' });

    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: settings.engine,
          model: selectedModel,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          status: 'success',
          message: data.message || `Working ✓ (${data.latencyMs}ms)`,
        });
      } else {
        setTestResult({
          status: 'error',
          message: data.error || 'Failed / Rate Limited ✗',
        });
      }
    } catch (e) {
      setTestResult({
        status: 'error',
        message: 'Timeout / Network Error ✗',
      });
    } finally {
      setIsTesting(false);
    }
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

          {/* 2. Provider Switcher (Free Only) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-300">
                المزود المجاني (Free Provider):
              </label>
              <span className="text-[10px] text-emerald-400 font-medium">100% Free Only</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-slate-900 p-1 border border-slate-800">
              <button
                onClick={() => handleEngineSwitch('openrouter')}
                className={`rounded-md py-1.5 text-[11px] font-semibold transition ${
                  settings.engine === 'openrouter'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                OpenRouter (Free)
              </button>
              <button
                onClick={() => handleEngineSwitch('gemini')}
                className={`rounded-md py-1.5 text-[11px] font-semibold transition ${
                  settings.engine === 'gemini'
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Gemini (Free Tier)
              </button>
            </div>
          </div>

          {/* 3. Compact Free Model Dropdown + Refresh + One-Click "Test" Button */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                النموذج المجاني النشط:
              </label>
              {/* Refresh list icon */}
              <button
                onClick={() => fetchFreeModels(settings.engine)}
                disabled={isLoadingModels}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-400 transition disabled:opacity-50"
                title="تحديث قائمة النماذج المجانية"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingModels ? 'animate-spin text-emerald-400' : ''}`} />
                <span>تحديث</span>
              </button>
            </div>

            {/* Dropdown + Test button row */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={isLoadingModels || modelsList.length === 0}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none truncate"
              >
                {isLoadingModels ? (
                  <option>جاري جلب النماذج المجانية...</option>
                ) : modelsList.length > 0 ? (
                  modelsList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))
                ) : (
                  <option>لا توجد نماذج</option>
                )}
              </select>

              {/* One-Click "Test Model" Button */}
              <button
                onClick={handleTestModel}
                disabled={isTesting || !selectedModel}
                className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition active:scale-95 disabled:opacity-50 shrink-0"
                title="فحص استجابة النموذج الآن"
              >
                <Play className={`h-3 w-3 text-amber-400 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'فحص...' : 'Test'}</span>
              </button>
            </div>

            {/* Test result badge */}
            {testResult.status !== 'idle' && (
              <div
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold animate-fade-in ${
                  testResult.status === 'success'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                }`}
              >
                {testResult.status === 'success' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="truncate">{testResult.message}</span>
              </div>
            )}

            <p className="text-[10px] text-slate-400">
              ⚡ تحويل تلقائي صامت: إذا واجه هذا النموذج ضغطاً أو تأخيراً، يتم الانتقال تلقائياً لأسرع نموذج مجاني بديل.
            </p>
          </div>

          {/* 4. Contact Context Note */}
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
