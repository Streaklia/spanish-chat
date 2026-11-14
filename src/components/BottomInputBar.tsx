'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  ClipboardPaste,
  X,
  Sparkles,
  ArrowUp,
  Languages
} from 'lucide-react';
import { detectLanguage } from '@/lib/language-detector';

interface BottomInputBarProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const BottomInputBar: React.FC<BottomInputBarProps> = ({
  onSendMessage,
  isLoading
}) => {
  const [text, setText] = useState('');
  const [pasteNotice, setPasteNotice] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const detectedLang = detectLanguage(text);

  // Auto-resize textarea height up to max
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          setText(clipText);
          setPasteNotice(true);
          setTimeout(() => setPasteNotice(false), 1500);
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed or permission denied:', err);
      // Fallback: prompt or focus textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
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
    // On desktop, Enter sends (Shift+Enter makes newline). On mobile, regular Enter can be handled.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="sticky bottom-0 z-20 w-full border-t border-slate-800/90 bg-slate-950/95 pb-safe backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto max-w-2xl px-3 py-2 sm:px-4">
        {/* Dynamic Context Header: Detection Pill & Quick Hints */}
        <div className="flex items-center justify-between mb-1.5 px-1 text-[11px]">
          {/* Detected Language Pill */}
          <div className="flex items-center gap-1.5">
            {text.trim() ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold transition ${
                  detectedLang === 'es'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <span>{detectedLang === 'es' ? '🇪🇸 Spanish Message (They said)' : '🇦🇪 Arabic Message (You want to say)'}</span>
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1">
                <Languages className="h-3 w-3" />
                الصق رسالة إسبانية أو اكتب ما تريد قوله بالعربية
              </span>
            )}
          </div>

          {/* Paste confirmation flash */}
          {pasteNotice && (
            <span className="text-emerald-400 text-[10px] font-bold animate-pulse">
              تم لصق الرسالة! ✓
            </span>
          )}
        </div>

        {/* Input Container */}
        <div className="relative flex items-end gap-1.5 rounded-2xl border border-slate-700/80 bg-slate-900/90 p-1.5 shadow-xl focus-within:border-emerald-500/80 focus-within:ring-1 focus-within:ring-emerald-500/30">
          {/* One-Tap Paste Button */}
          <button
            type="button"
            onClick={handlePaste}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white active:scale-95 sm:h-11 sm:w-11"
            title="Paste from WhatsApp / Instagram clipboard"
            aria-label="Paste message"
          >
            <ClipboardPaste className="h-5 w-5 text-amber-400" />
          </button>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            dir={detectedLang === 'ar' ? 'rtl' : 'ltr'}
            placeholder="Paste Spanish or write in Arabic..."
            className={`max-h-32 min-h-[40px] flex-1 resize-none bg-transparent py-2 px-1 text-sm text-slate-100 placeholder-slate-400 focus:outline-none leading-relaxed ${
              detectedLang === 'ar' ? 'font-arabic text-right' : 'font-sans text-left'
            }`}
          />

          {/* Clear Button (only when text exists) */}
          {text.trim().length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
              title="Clear text"
              aria-label="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Send Button */}
          <button
            type="button"
            disabled={!text.trim() || isLoading}
            onClick={handleSend}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all sm:h-11 sm:w-11 ${
              text.trim() && !isLoading
                ? 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
            title="Send to AI Assistant"
            aria-label="Send message"
          >
            {isLoading ? (
              <Sparkles className="h-5 w-5 animate-spin text-emerald-400" />
            ) : (
              <ArrowUp className="h-5 w-5 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
