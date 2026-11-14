'use client';

import React, { useEffect, useRef } from 'react';
import { Sparkles, MessageCircle, Bot, User } from 'lucide-react';
import { ChatMessage, ContactThread } from '@/types';
import { ResponseCard } from './ResponseCard';

interface ChatContainerProps {
  messages: ChatMessage[];
  activeThread: ContactThread;
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onGenerateAlternative: (messageId: string, inputText: string) => void;
  loadingAlternativeId?: string | null;
}

const QUICK_STARTERS = [
  { text: 'Hola! Mi día estuvo bien, y el tuyo qué tal?', label: '🇪🇸 ما قالوه (رسالة إسبانية)' },
  { text: 'أريد أن أقول لها إنني أفتقدكِ وسعيد بالتحدث معكِ', label: '🇦🇪 فكرة بالعربية' },
  { text: 'be romantic and ask her out for the weekend', label: '💖 توجيه رومانسي بالإنجليزية' },
  { text: 'no ask her where she live', label: '💬 أمر توجيهي مباشر' }
];

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  activeThread,
  isLoading,
  onSendMessage,
  onGenerateAlternative,
  loadingAlternativeId,
}) => {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Minimalist Empty State */}
        {messages.length === 0 && (
          <div className="py-10 px-4 text-center space-y-4 animate-fade-in">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-emerald-500 shadow-md shadow-emerald-950/30">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>

            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-bold text-slate-100">
                ChatBridge ES-AR • {activeThread.name}
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                الصق رسالة إسبانية وصلتك، أو اكتب ما تريد قوله بالعربية أو الإنجليزية للرد الفوري بأسلوب دردشة حقيقي وبدون تكلف.
              </p>
            </div>

            {/* Quick Starters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto pt-2 text-right">
              {QUICK_STARTERS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(s.text)}
                  className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-2.5 text-xs text-slate-300 hover:border-emerald-500/50 hover:bg-slate-850 hover:text-white transition active:scale-[0.98] shadow-sm text-right"
                >
                  <span className="block text-[10px] text-emerald-400 font-semibold mb-0.5">
                    {s.label}
                  </span>
                  <span className="line-clamp-1 italic text-slate-300 text-[11px]">&quot;{s.text}&quot;</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Thread */}
        {messages.map((message) => {
          if (message.role === 'user') {
            const isAr = message.detectedLanguage === 'ar';
            return (
              <div
                key={message.id}
                className="flex flex-col items-end space-y-1 animate-slide-up"
              >
                {/* User Message Bubble (WhatsApp style) */}
                <div
                  dir={isAr ? 'rtl' : 'ltr'}
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm shadow-md transition-all ${
                    isAr
                      ? 'rounded-tl-xs bg-emerald-600 text-white font-arabic text-right shadow-emerald-950/20'
                      : 'rounded-tr-xs bg-slate-800 text-slate-100 font-sans text-left shadow-slate-950/20'
                  }`}
                >
                  <p className="leading-relaxed break-words whitespace-pre-wrap">
                    {message.inputText}
                  </p>
                </div>
              </div>
            );
          }

          // Assistant Response Card
          if (message.role === 'assistant' && message.payload) {
            return (
              <div key={message.id} className="flex justify-start animate-slide-up">
                <ResponseCard
                  payload={message.payload}
                  isGeneratingAlternative={loadingAlternativeId === message.id}
                  onGenerateAlternative={() =>
                    onGenerateAlternative(message.id, message.inputText)
                  }
                />
              </div>
            );
          }

          return null;
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs text-emerald-400 shadow-sm animate-pulse">
              <Sparkles className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              <span>جاري صياغة الرد الإسباني العفوي...</span>
            </div>
          </div>
        )}

        <div ref={scrollEndRef} className="h-1" />
      </div>
    </div>
  );
};
