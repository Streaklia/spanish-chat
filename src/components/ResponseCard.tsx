'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  Volume2,
  RefreshCw,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';
import { AssistantResponsePayload, VocabItem } from '@/types';
import { speakSpanish } from '@/lib/tts';

interface ResponseCardProps {
  payload: AssistantResponsePayload;
  onGenerateAlternative: () => void;
  isGeneratingAlternative?: boolean;
}

export const ResponseCard: React.FC<ResponseCardProps> = ({
  payload,
  onGenerateAlternative,
  isGeneratingAlternative = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showVocab, setShowVocab] = useState(false);
  const [vocabList, setVocabList] = useState<VocabItem[]>(payload.vocabulary || []);
  const [isLoadingVocab, setIsLoadingVocab] = useState(false);

  const {
    scenario,
    incomingTranslationAr,
    spanishReply,
    replyMeaningAr,
    replyMeaningEn,
    answerNote,
  } = payload;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(spanishReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handlePlayAudio = () => {
    setIsPlayingAudio(true);
    speakSpanish(spanishReply);
    setTimeout(() => setIsPlayingAudio(false), 1800);
  };

  const handleToggleExplainWords = async () => {
    if (showVocab) {
      setShowVocab(false);
      return;
    }

    setShowVocab(true);

    if (vocabList.length === 0) {
      setIsLoadingVocab(true);
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'explain',
            spanishText: spanishReply,
          }),
        });
        const json = await res.json();
        if (json?.data?.vocabulary && json.data.vocabulary.length > 0) {
          setVocabList(json.data.vocabulary);
        }
      } catch (e) {
        console.error('Error fetching on-demand vocab:', e);
      } finally {
        setIsLoadingVocab(false);
      }
    }
  };

  return (
    <div className="w-full max-w-[95%] sm:max-w-[85%] rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 p-3 sm:p-3.5 shadow-lg backdrop-blur-md transition-all hover:border-slate-700/80">
      {/* 0. Optional Question Answer Note */}
      {answerNote && (
        <div className="mb-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/25 px-3 py-2 text-indigo-200">
          <div className="flex items-center gap-1.5 font-semibold text-[11px] mb-1 text-indigo-300">
            <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
            <span>Answer (إجابة استفسارك):</span>
          </div>
          <p className="leading-relaxed text-xs text-slate-200">{answerNote}</p>
        </div>
      )}

      {/* 1. Incoming Translation Header (When user received a Spanish message) */}
      {scenario === 'A' && incomingTranslationAr && (
        <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 text-right">
          <span className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider shrink-0">
            ما قالوه:
          </span>
          <p dir="rtl" className="font-arabic text-xs sm:text-sm font-medium text-slate-200 leading-snug">
            {incomingTranslationAr}
          </p>
        </div>
      )}

      {/* 2. Main Focus: Spanish Reply Card */}
      <div className="group relative overflow-hidden rounded-xl border border-emerald-500/40 bg-slate-950/80 p-3 shadow-inner transition-all hover:border-emerald-500/60">
        <div className="flex items-start justify-between gap-2">
          {/* Spanish text ready to send (No ¿ or ¡) */}
          <p
            dir="ltr"
            className="flex-1 text-sm sm:text-base font-semibold text-white leading-relaxed select-all tracking-wide"
          >
            {spanishReply}
          </p>

          {/* Action buttons (Listen & Copy) */}
          <div className="flex items-center gap-1 shrink-0 pt-0.5">
            <button
              onClick={handlePlayAudio}
              className={`rounded-lg p-1.5 transition active:scale-90 ${
                isPlayingAudio
                  ? 'text-emerald-400 bg-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="استمع للنطق الإسباني الطبيعي"
            >
              <Volume2 className={`h-4 w-4 ${isPlayingAudio ? 'animate-bounce text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all shadow-sm active:scale-95 ${
                copied
                  ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/30'
              }`}
              title="نسخ الرسالة لواتساب أو إنستغرام"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>Copiado! ✓</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. Meaning in Arabic (Directly below Spanish box) */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-baseline justify-between gap-2 text-right">
          <span className="text-[10px] font-semibold text-slate-400 shrink-0">المعنى:</span>
          <p dir="rtl" className="font-arabic text-xs sm:text-sm text-slate-200 font-normal leading-relaxed">
            {replyMeaningAr}
          </p>
        </div>

        {/* Optional English check if user typed in English */}
        {replyMeaningEn && (
          <p dir="ltr" className="text-[11px] text-slate-400 mt-1 italic text-left">
            EN: {replyMeaningEn}
          </p>
        )}
      </div>

      {/* 4. On-Demand "Explain Words" Drawer */}
      {showVocab && (
        <div className="mt-2.5 rounded-xl border border-slate-800/90 bg-slate-950/90 p-2.5 space-y-2 animate-slide-up">
          <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold pb-1 border-b border-slate-800/60">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <BookOpen className="h-3.5 w-3.5" />
              شرح الكلمات والمصطلحات (Vocabulary)
            </span>
            <span className="text-[10px] text-slate-400">سياق المحادثة</span>
          </div>

          {isLoadingVocab ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-1.5">
              <Sparkles className="h-3 w-3 animate-spin text-emerald-400" />
              <span>جاري استخراج الكلمات بدقة...</span>
            </div>
          ) : vocabList.length > 0 ? (
            <div className="space-y-1.5">
              {vocabList.map((item, idx) => (
                <div key={idx} className="flex items-baseline justify-between gap-2 border-b border-slate-800/40 pb-1.5 last:border-none last:pb-0">
                  <span dir="ltr" className="font-mono text-emerald-300 font-semibold text-xs">
                    {item.spanish}
                  </span>
                  <span dir="rtl" className="font-arabic text-slate-200 text-xs">
                    {item.arabic} {item.tip ? <span className="text-slate-400 text-[10px] mr-1 font-normal">({item.tip})</span> : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-1">جملة بسيطة ومباشرة للاستخدام اليومي.</div>
          )}
        </div>
      )}

      {/* 5. Bottom Action Bar */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[11px]">
        {/* Left: On-Demand Explain Words Button */}
        <button
          onClick={handleToggleExplainWords}
          className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition"
        >
          <BookOpen className="h-3.5 w-3.5 text-emerald-400/80" />
          <span className="font-medium">{showVocab ? 'إخفاء الشرح' : 'Explain Words (شرح الكلمات)'}</span>
          {showVocab ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {/* Right: Model badge + Another Option Button */}
        <div className="flex items-center gap-2">
          {/* Subtle Model Badge */}
          {payload.modelUsed && (
            <span
              className="text-[10px] text-slate-400 font-mono flex items-center gap-1 bg-slate-950/70 border border-slate-800 px-1.5 py-0.5 rounded-md"
              title={`Answered by free model: ${payload.modelUsed}`}
            >
              <Sparkles className="h-2.5 w-2.5 text-emerald-400" />
              <span>{payload.modelUsed.split('/').pop() || payload.modelUsed}</span>
            </span>
          )}

          {/* Another Option Button */}
          <button
            onClick={onGenerateAlternative}
            disabled={isGeneratingAlternative}
            className="flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition disabled:opacity-50"
            title="توليد خيار إسباني آخر بنفس المعنى"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${isGeneratingAlternative ? 'animate-spin' : ''}`} />
            <span className="font-medium">Another Option</span>
          </button>
        </div>
      </div>
    </div>
  );
};
