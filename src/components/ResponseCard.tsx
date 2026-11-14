'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  Volume2,
  RefreshCw,
  BookOpen,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import { AssistantResponsePayload, SpanishDialect } from '@/types';
import { speakSpanish } from '@/lib/tts';

interface ResponseCardProps {
  payload: AssistantResponsePayload;
  onGenerateAlternative: () => void;
  isGeneratingAlternative?: boolean;
  dialect?: SpanishDialect;
}

export const ResponseCard: React.FC<ResponseCardProps> = ({
  payload,
  onGenerateAlternative,
  isGeneratingAlternative = false,
  dialect = 'spain',
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const {
    scenario,
    incomingTranslationAr,
    spanishReply,
    replyMeaningAr,
    vocabulary = [],
    culturalTip,
    engineUsed,
  } = payload;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(spanishReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handlePlayAudio = () => {
    setIsPlayingAudio(true);
    speakSpanish(spanishReply, dialect);
    setTimeout(() => setIsPlayingAudio(false), 1800);
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-3.5 sm:p-4 shadow-xl backdrop-blur-md transition-all hover:border-slate-750">
      {/* 1. TOP PART: Incoming Arabic Translation (When input was Spanish - Scenario A) */}
      {scenario === 'A' && incomingTranslationAr && (
        <div className="mb-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-right">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
              <MessageCircle className="h-3 w-3" />
              ما قالوه (الترجمة للعربية)
            </span>
            <span className="text-[10px] text-slate-400">They said</span>
          </div>
          <p
            dir="rtl"
            className="font-arabic text-sm sm:text-base font-medium leading-relaxed text-slate-100"
          >
            {incomingTranslationAr}
          </p>
        </div>
      )}

      {/* 2. MAIN HIGHLIGHT BOX: Suggested Spanish Reply */}
      <div className="relative mb-3 overflow-hidden rounded-xl border-2 border-emerald-500/50 bg-slate-900/95 p-3.5 sm:p-4 shadow-lg shadow-emerald-950/20">
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

        {/* Box Header: Label & Audio TTS */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              {scenario === 'A' ? 'الرد المقترح بالإسبانية (Suggested Reply)' : 'الترجمة الإسبانية الطبيعية (Spanish)'}
            </span>
          </div>

          {/* Pronounce / Audio Button */}
          <button
            onClick={handlePlayAudio}
            className={`flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-1 text-[11px] font-medium transition ${
              isPlayingAudio ? 'text-emerald-400 border-emerald-500' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="Listen to native Spanish pronunciation"
          >
            <Volume2 className={`h-3.5 w-3.5 ${isPlayingAudio ? 'animate-bounce text-emerald-400' : ''}`} />
            <span className="hidden xs:inline">نطق</span>
          </button>
        </div>

        {/* Spanish text */}
        <p
          dir="ltr"
          className="text-base sm:text-lg font-semibold tracking-wide text-white leading-relaxed select-all"
        >
          {spanishReply}
        </p>

        {/* Big Tap-Friendly "Copy Spanish" Button */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <button
            onClick={handleCopy}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.98] ${
              copied
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white hover:brightness-110 shadow-emerald-950/40'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                <span>تم النسخ بنجاح! جاهز للصق في واتساب (¡Copiado!)</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>نسخ الرسالة الإسبانية (Copy Spanish)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. DIRECTLY BELOW: Meaning of Your Reply (in Arabic) */}
      <div className="mb-3.5 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-right">
        <div className="flex items-center justify-between mb-1">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
            {scenario === 'A' ? 'معنى ردك باللغة العربية (100% شفافية)' : 'تأكيد المعنى الدقيق للرد بالعربية'}
          </span>
          <span className="text-[10px] text-slate-400">Exact Meaning</span>
        </div>
        <p
          dir="rtl"
          className="font-arabic text-sm sm:text-base font-normal leading-relaxed text-slate-200"
        >
          {replyMeaningAr}
        </p>
      </div>

      {/* 4. MINI VOCABULARY BREAKDOWN (Passive Language Learning) */}
      {vocabulary && vocabulary.length > 0 && (
        <div className="mb-3 rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-[11px] font-bold text-indigo-300">
              مفردات وتراكيب للتعلم السريع (Vocabulary Breakdown)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {vocabulary.map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-800/90 bg-slate-900/90 p-2 text-xs transition hover:border-indigo-500/30"
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  {/* Spanish Word */}
                  <span
                    dir="ltr"
                    className="font-bold text-indigo-300 font-mono tracking-wide"
                  >
                    {item.spanish}
                  </span>
                  {/* Arabic Translation */}
                  <span
                    dir="rtl"
                    className="font-arabic font-medium text-slate-200"
                  >
                    {item.arabic}
                  </span>
                </div>
                {/* Learning Tip */}
                {item.tip && (
                  <p
                    dir="rtl"
                    className="font-arabic text-[11px] text-slate-400 border-t border-slate-800/60 pt-1 mt-1"
                  >
                    💡 {item.tip}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cultural Nuance Tip (if present) */}
      {culturalTip && (
        <div className="mb-3 rounded-lg border border-cyan-500/20 bg-cyan-950/15 p-2.5 text-right">
          <p dir="rtl" className="font-arabic text-[11px] leading-relaxed text-cyan-200 flex items-start justify-end gap-1.5">
            <span>{culturalTip}</span>
            <Lightbulb className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
          </p>
        </div>
      )}

      {/* 5. FOOTER: Scenario C "Another Option" + Engine Tag */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
        {/* Scenario C: Quick Alternative Option Button */}
        <button
          onClick={onGenerateAlternative}
          disabled={isGeneratingAlternative}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-600 hover:bg-slate-750 transition active:scale-[0.98] disabled:opacity-50"
          title="Generate a different natural way to say this in Spanish"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${isGeneratingAlternative ? 'animate-spin' : ''}`} />
          <span>خيار آخر (Another Option)</span>
        </button>

        {/* Engine watermark */}
        <span className="text-[10px] text-slate-400">
          Powered by {engineUsed === 'gemini' ? 'Gemini 2.0' : engineUsed === 'openrouter' ? 'OpenRouter' : 'Smart Engine'}
        </span>
      </div>
    </div>
  );
};
