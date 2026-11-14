'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  Volume2,
  RefreshCw,
  BookOpen,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp
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

    // If vocab not yet fetched, fetch on-demand
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
    <div className="w-full max-w-[94%] sm:max-w-[85%] rounded-2xl border border-slate-800/90 bg-slate-900/80 p-3 shadow-md backdrop-blur-sm transition-all text-xs">
      {/* 0. Optional Question Answer Note (When user asked a question in English/Arabic) */}
      {answerNote && (
        <div className="mb-2 rounded-lg bg-indigo-950/30 border border-indigo-500/20 px-2.5 py-1.5 text-indigo-200">
          <div className="flex items-center gap-1 font-semibold text-[11px] mb-0.5 text-indigo-300">
            <HelpCircle className="h-3 w-3" />
            <span>Answer to your question:</span>
          </div>
          <p className="leading-relaxed text-slate-200">{answerNote}</p>
        </div>
      )}

      {/* 1. Incoming Translation (ONLY when input was Spanish received from other person) */}
      {scenario === 'A' && incomingTranslationAr && (
        <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-800/60 pb-1.5 text-right">
          <span className="text-[10px] text-slate-400 font-medium shrink-0">
            They said (ما قالوه):
          </span>
          <p dir="rtl" className="font-arabic font-medium text-slate-200 truncate">
            {incomingTranslationAr}
          </p>
        </div>
      )}

      {/* 2. Main Focus: Spanish Reply Box & 1-Tap Copy */}
      <div className="relative rounded-xl border border-emerald-500/40 bg-slate-950/70 p-2.5 sm:p-3 shadow-inner">
        <div className="flex items-start justify-between gap-2">
          {/* Spanish Text */}
          <p
            dir="ltr"
            className="flex-1 text-sm sm:text-base font-semibold text-white leading-relaxed select-all"
          >
            {spanishReply}
          </p>

          {/* Quick Actions: Audio & Copy */}
          <div className="flex items-center gap-1 shrink-0 pt-0.5">
            <button
              onClick={handlePlayAudio}
              className={`rounded-lg p-1.5 transition ${
                isPlayingAudio
                  ? 'text-emerald-400 bg-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Listen to pronunciation"
            >
              <Volume2 className="h-4 w-4" />
            </button>

            <button
              onClick={handleCopy}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition active:scale-95 ${
                copied
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
              }`}
              title="Copy to send on WhatsApp/Instagram"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>Copiado!</span>
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

        {/* 3. Reply Meaning in Arabic (directly below Spanish box) */}
        <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-baseline justify-between gap-2 text-right">
          <span className="text-[10px] text-slate-400 shrink-0">معناه:</span>
          <p dir="rtl" className="font-arabic text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
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

      {/* 4. On-Demand "Explain Words" Section (Token & Space Saving) */}
      {showVocab && (
        <div className="mt-2.5 rounded-lg border border-slate-800 bg-slate-950/80 p-2 space-y-1.5 animate-slide-up">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
            <span className="flex items-center gap-1 text-emerald-400">
              <BookOpen className="h-3 w-3" />
              شرح الكلمات (Vocabulary)
            </span>
            <span className="text-[10px] text-slate-400">On-demand</span>
          </div>

          {isLoadingVocab ? (
            <div className="text-[11px] text-slate-400 py-1">جاري استخراج الكلمات...</div>
          ) : vocabList.length > 0 ? (
            vocabList.map((item, idx) => (
              <div key={idx} className="flex items-baseline justify-between gap-2 border-b border-slate-800/40 pb-1 last:border-none last:pb-0">
                <span dir="ltr" className="font-mono text-emerald-300 font-medium text-[11px]">
                  {item.spanish}
                </span>
                <span dir="rtl" className="font-arabic text-slate-300 text-[11px]">
                  {item.arabic} {item.tip ? `(${item.tip})` : ''}
                </span>
              </div>
            ))
          ) : (
            <div className="text-[11px] text-slate-400">جملة بسيطة ومباشرة للاستخدام اليومي.</div>
          )}
        </div>
      )}

      {/* 5. Bottom Action Bar: "Another Option" and "Explain Words" Buttons */}
      <div className="mt-2.5 flex items-center justify-between pt-1 text-[11px]">
        {/* On-Demand Explain Words Button */}
        <button
          onClick={handleToggleExplainWords}
          className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition"
        >
          <BookOpen className="h-3 w-3" />
          <span>{showVocab ? 'إخفاء الشرح' : 'Explain Words (شرح الكلمات)'}</span>
          {showVocab ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {/* Another Option Button */}
        <button
          onClick={onGenerateAlternative}
          disabled={isGeneratingAlternative}
          className="flex items-center gap-1 text-slate-400 hover:text-amber-400 transition disabled:opacity-50"
          title="Different way to say this"
        >
          <RefreshCw className={`h-3 w-3 ${isGeneratingAlternative ? 'animate-spin text-amber-400' : ''}`} />
          <span>Another Option (خيار آخر)</span>
        </button>
      </div>
    </div>
  );
};
