'use client';

import React, { useEffect, useRef } from 'react';
import {
  Sparkles,
  MessageSquare,
  ArrowDown,
  Languages,
  Zap,
  Heart,
  Briefcase,
  Smile
} from 'lucide-react';
import { ChatMessage, ContactThread, SpanishDialect } from '@/types';
import { ResponseCard } from './ResponseCard';

interface ChatContainerProps {
  messages: ChatMessage[];
  activeThread: ContactThread;
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onGenerateAlternative: (messageId: string, inputText: string) => void;
  loadingAlternativeId?: string | null;
}

const STARTER_PROMPTS = [
  {
    type: 'es',
    label: '🇪🇸 ما قالوه (رسالة إسبانية واردة)',
    text: 'Mi día estuvo bien, ¿y el tuyo qué tal?',
    sub: 'سؤال عن اليوم والرد المناسب'
  },
  {
    type: 'es',
    label: '🇪🇸 ما قالوه (غزل / ودود)',
    text: '¡Hola guapa! ¿Tienes algún plan para esta tarde? 😊',
    sub: 'اقتراح خروج وسياق ودود'
  },
  {
    type: 'ar',
    label: '🇦🇪 أردت قوله (اشتياق وعاطفة)',
    text: 'أريد أن أقول لها إنني أفتقدكِ كثيراً وأتمنى رؤيتكِ قريباً ❤️',
    sub: 'ترجمة عفوية لطيفة للواتساب'
  },
  {
    type: 'ar',
    label: '🇦🇪 أردت قوله (اعتذار عن تأخير)',
    text: 'أعتذر عن التأخير، كنت عالقاً في زحمة السير وسأصل خلال 10 دقائق 🙏',
    sub: 'اعتذار طبيعي كأهل البلد'
  }
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

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    scrollEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 space-y-5">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Empty State / Welcome Guide */}
        {messages.length === 0 && (
          <div className="rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/80 to-slate-950 p-5 text-center shadow-xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-emerald-500 shadow-lg shadow-emerald-500/20">
              <Languages className="h-6 w-6 text-white" />
            </div>

            <h2 className="text-lg font-bold text-slate-100">
              مرحباً بك في ChatBridge ES-AR!
            </h2>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-400 leading-relaxed">
              مساعدك الذكي للتحدث بالإسبانية على واتساب وإنستغرام كأنك من أهل البلد، مع تعلم المفردات تلقائياً.
            </p>

            {/* Quick explanation of 2 modes */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-right">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <span className="text-xs font-bold text-amber-300 block mb-1">
                  1️⃣ السيناريو (أ): وصلتك رسالة إسبانية
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  الصق رسالتهم ⬅️ سيفهم الذكاء الاصطناعي ما قالوه، ويترجمه للعربية، ويقترح رداً إسبانياً طبيعياً مع معناه ومفرداته.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <span className="text-xs font-bold text-emerald-300 block mb-1">
                  2️⃣ السيناريو (ب): تريد كتابة رد بالعربية
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  اكتب ما يدور في بالك بالعربية ⬅️ سيعطيك صياغة إسبانية عفوية غير حرفية تناسب واتساب تماماً، مع شرح المفردات.
                </p>
              </div>
            </div>

            {/* Starter Prompt Chips */}
            <div className="mt-5 text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-1">
                جرب الآن بضغطة واحدة (Starter Prompts):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(prompt.text)}
                    className="flex flex-col items-start rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 text-right transition hover:border-emerald-500/50 hover:bg-slate-850 active:scale-[0.98]"
                  >
                    <span className="text-[10px] font-bold text-emerald-400 mb-0.5">
                      {prompt.label}
                    </span>
                    <span className="text-xs text-slate-200 font-medium">
                      &quot;{prompt.text}&quot;
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {prompt.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Thread */}
        {messages.map((message) => {
          if (message.role === 'user') {
            const isEs = message.detectedLanguage === 'es';
            return (
              <div
                key={message.id}
                className="flex flex-col items-end space-y-1 animate-slide-up"
              >
                {/* User Bubble Label */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                  <span
                    className={`rounded-full px-1.5 py-0.2 font-semibold ${
                      isEs
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {isEs ? '🇪🇸 رسالة إسبانية واردة (They said)' : '🇦🇪 أردت قوله (You want to say)'}
                  </span>
                  <span>
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* User Message Bubble */}
                <div
                  dir={isEs ? 'ltr' : 'rtl'}
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-2.5 shadow-md ${
                    isEs
                      ? 'rounded-tr-sm bg-gradient-to-tr from-amber-600/30 to-amber-700/20 border border-amber-500/30 text-amber-50 font-sans'
                      : 'rounded-tl-sm bg-gradient-to-tr from-emerald-600/40 to-teal-700/30 border border-emerald-500/30 text-emerald-50 font-arabic'
                  }`}
                >
                  <p className="text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap">
                    {message.inputText}
                  </p>
                </div>
              </div>
            );
          }

          // Assistant Response Card
          if (message.role === 'assistant' && message.payload) {
            return (
              <div key={message.id} className="animate-slide-up">
                <ResponseCard
                  payload={message.payload}
                  dialect={activeThread.dialect}
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
          <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl backdrop-blur-md animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-emerald-400 animate-spin" />
              <span className="text-xs font-semibold text-emerald-400">
                جاري تحليل السياق واللهجة وتجهيز الرد... (Analyzing context & tone)
              </span>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-3/4 rounded bg-slate-800" />
              <div className="h-10 w-full rounded-xl bg-slate-800/80" />
              <div className="h-4 w-1/2 rounded bg-slate-800" />
            </div>
          </div>
        )}

        {/* Auto Scroll Anchor */}
        <div ref={scrollEndRef} className="h-2" />
      </div>
    </div>
  );
};
