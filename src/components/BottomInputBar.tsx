'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  ClipboardPaste,
  Sparkles,
  X
} from 'lucide-react';
import { detectLanguage } from '@/lib/language-detector';

interface BottomInputBarProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const BottomInputBar: React.FC<BottomInputBarProps> = ({
  onSendMessage,
  isLoading,
}) => {
  const [text, setText] = useState('');
  const [pasteFeedback, setPasteFeedback] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const detectedLang = detectLanguage(text);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clip = await navigator.clipboard.readText();
        if (clip) {
          setText(clip);
          setPasteFeedback(true);
          setTimeout(() => setPasteFeedback(false), 1400);
          textareaRef.current?.focus();
        }
      }
    } catch (e) {
      textareaRef.current?.focus();
    }
  };

  const handleClear = () => {
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleSend = () => {
    if (!text.trim() || isLoading) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="sticky bottom-0 z-20 w-full border-t border-slate-800/80 bg-slate-950/90 pb-safe backdrop-blur-xl">
      <div className="mx-auto max-w-2xl px-3 py-2 sm:py-2.5">
        {/* Subtle Paste notification */}
        {pasteFeedback && (
          <div className="text-[11px] text-emerald-400 font-semibold pb-1.5 text-center animate-pulse flex items-center justify-center gap-1">
            <span>تم لصق الرسالة من الحافظة! ✓</span>
          </div>
        )}

        {/* Input Pill Container (WhatsApp / ChatGPT floating dock) */}
        <div className="relative flex items-end gap-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-1.5 shadow-xl transition-all focus-within:border-emerald-500/70 focus-within:ring-2 focus-within:ring-emerald-500/20">
          {/* One-Tap Paste Button inside the bar */}
          <button
            type="button"
            onClick={handlePaste}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800/80 text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition active:scale-95"
            title="لصق الرسالة من الحافظة (Paste)"
            aria-label="Paste"
          >
            <ClipboardPaste className="h-4 w-4" />
          </button>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            dir={detectedLang === 'ar' ? 'rtl' : 'ltr'}
            placeholder="Paste Spanish, or write in Arabic or English..."
            className={`max-h-28 min-h-[38px] flex-1 resize-none bg-transparent py-2 px-1 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none leading-relaxed ${
              detectedLang === 'ar' ? 'font-arabic text-right' : 'font-sans text-left'
            }`}
          />

          {/* Clear button if text present */}
          {text.trim().length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:text-white transition"
              title="مسح النص"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Send Button */}
          <button
            type="button"
            disabled={!text.trim() || isLoading}
            onClick={handleSend}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all active:scale-95 ${
              text.trim() && !isLoading
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 hover:brightness-110 text-white shadow-md shadow-emerald-950/40'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
            title="إرسال"
            aria-label="Send"
          >
            {isLoading ? (
              <Sparkles className="h-4 w-4 animate-spin text-emerald-400" />
            ) : (
              <ArrowUp className="h-4 w-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
