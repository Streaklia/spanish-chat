'use client';

import React, { useState } from 'react';
import {
  X,
  Shield,
  Key,
  Smartphone,
  Info,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Download,
  Trash2,
  Lock
} from 'lucide-react';
import { AppSettings } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onClearAllData,
}) => {
  const [customGemini, setCustomGemini] = useState(settings.customGeminiKey || '');
  const [customOpenRouter, setCustomOpenRouter] = useState(settings.customOpenRouterKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      customGeminiKey: customGemini.trim() || undefined,
      customOpenRouterKey: customOpenRouter.trim() || undefined,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl animate-fade-in overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">
              إعدادات الأمان ومحركات الذكاء الاصطناعي
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Security Guarantee Banner */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-300">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <Lock className="h-4 w-4" />
              <span>حماية المفاتيح وسرية البيانات (Server-Side Protected)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-200/90">
              مفاتيح الـ API مخزنة حصرياً في خادم الباك إند (.env.local) ولا تظهر إطلاقاً في متصفح المستخدم أو كود الواجهة. يتم معالجة جميع طلبات الدردشة عبر مسار آمن.
            </p>
          </div>

          {/* Engine Status & Keys Configuration */}
          <form onSubmit={handleSaveKeys} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Key className="h-4 w-4 text-amber-400" />
                تخصيص مفاتيح الـ API (اختياري)
              </span>
              {savedSuccess && (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                  <CheckCircle className="h-3 w-3" /> تم الحفظ
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              يستخدم التطبيق افتراضياً المفاتيح الرسمية المكونة على السيرفر (مع التبديل التلقائي الذكي Fallback لمنع أي انقطاع). إذا أردت استخدام مفاتيحك الخاصة، يمكنك إدخالها أدناه:
            </p>

            <div>
              <label className="block text-[11px] text-slate-300 font-medium mb-1">
                Gemini API Key (Primary Fast Engine)
              </label>
              <input
                type="password"
                placeholder="AQ.Ab8RN6K... أو AIzaSy..."
                value={customGemini}
                onChange={(e) => setCustomGemini(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 font-medium mb-1">
                OpenRouter API Key (Secondary Engine)
              </label>
              <input
                type="password"
                placeholder="sk-or-v1-f1d3eeeb..."
                value={customOpenRouterKeyDisplay(customOpenRouter)}
                onChange={(e) => setCustomOpenRouter(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2 text-xs font-semibold text-slate-100 transition"
            >
              حفظ التفضيلات
            </button>
          </form>

          {/* PWA Installation Instructions */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Smartphone className="h-4 w-4 text-cyan-400" />
              <span>تثبيت التطبيق على الشاشة الرئيسية (PWA)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              يمكنك استخدام ChatBridge كتطبيق هاتف أصلي بدون متجر تطبيقات لسهولة التبديل بين واتساب وإنستغرام:
            </p>
            <div className="space-y-1.5 text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <p>
                🍏 <strong>آيفون (Safari):</strong> اضغط زر المشاركة (Share) في أسفل الشاشة، ثم اختر <span className="text-cyan-300 font-medium">&quot;Add to Home Screen&quot; (إضافة إلى الشاشة الرئيسية)</span>.
              </p>
              <p>
                🤖 <strong>أندرويد (Chrome):</strong> اضغط على قائمة الثلاث نقاط (⋮) ثم اختر <span className="text-emerald-300 font-medium">&quot;Install App&quot; أو &quot;Add to Home screen&quot;</span>.
              </p>
            </div>
          </div>

          {/* Reset / Clear Data */}
          <div className="rounded-xl border border-rose-950/40 bg-rose-950/10 p-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-rose-300 block text-xs">إعادة ضبط المحادثات</span>
              <span className="text-[10px] text-slate-400">حذف الرسائل واستعادة الإعدادات الافتراضية</span>
            </div>
            <button
              onClick={() => {
                if (confirm('هل تريد مسح جميع المحادثات وإعادة التطبيق للحالة الابتدائية؟')) {
                  onClearAllData();
                  onClose();
                }
              }}
              className="flex items-center gap-1 rounded-lg border border-rose-900/60 bg-rose-950/40 px-2.5 py-1.5 text-xs text-rose-300 hover:bg-rose-900/40 transition"
            >
              <Trash2 className="h-3 w-3" />
              مسح البيانات
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 p-3 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

function customOpenRouterKeyDisplay(val: string): string {
  return val;
}
