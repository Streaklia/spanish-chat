'use client';

import React, { useEffect, useRef } from 'react';
import { Sparkles, MessageCircle, EyeOff } from 'lucide-react';
import { ChatMessage, ContactThread } from '@/types';
import { ResponseCard } from './ResponseCard';

interface ChatContainerProps {
  messages: ChatMessage[];
  activeThread: ContactThread;
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onGenerateAlternative: (messageId: string, inputText: string) => void;
  loadingAlternativeId?: string | null;
  isIncognito?: boolean;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  activeThread,
  isLoading,
  onSendMessage,
  onGenerateAlternative,
  loadingAlternativeId,
  isIncognito = false,
}) => {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Minimal Clean Empty State (Clean slate like WhatsApp / ChatGPT) */}
        {messages.length === 0 && (
          <div className="py-16 sm:py-24 px-4 text-center space-y-3 animate-fade-in flex flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-emerald-500/40 shadow-lg shadow-emerald-950/40 bg-emerald-950/40">
              <img
                src="/logo.png"
                alt="ChatBridge ES-AR"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-100">
                {isIncognito ? 'Incognito Chat' : activeThread.name}
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                الصق رسالة إسبانية وصلتك، أو اكتب ما تريد قوله بالعربية أو الإنجليزية للرد الفوري بأسلوب دردشة حقيقي وبدون تكلف.
              </p>
            </div>

            {/* Incognito Notice */}
            {isIncognito && (
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3.5 py-1.5 text-xs text-purple-300 font-medium">
                <EyeOff className="h-3.5 w-3.5 text-purple-400" />
                <span>وضع التصفح الخفي: المحادثة في الذاكرة فقط ولن تُحفظ على جهازك</span>
              </div>
            )}
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
