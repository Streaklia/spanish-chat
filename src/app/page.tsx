'use client';

import React, { useState, useEffect } from 'react';
import {
  AIEngine,
  AppSettings,
  ChatMessage,
  ContactThread,
  ConversationTone,
  SpanishDialect,
  AssistantResponsePayload
} from '@/types';
import {
  DEFAULT_SETTINGS,
  INITIAL_THREADS,
  loadActiveThreadId,
  loadSettings,
  loadThreads,
  saveActiveThreadId,
  saveSettings,
  saveThreads,
} from '@/lib/storage';
import { detectLanguage } from '@/lib/language-detector';
import { Header } from '@/components/Header';
import { TopControlBar } from '@/components/TopControlBar';
import { ChatContainer } from '@/components/ChatContainer';
import { BottomInputBar } from '@/components/BottomInputBar';
import { ContactsDrawer } from '@/components/ContactsDrawer';
import { SettingsModal } from '@/components/SettingsModal';

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);
  const [threads, setThreads] = useState<ContactThread[]>(INITIAL_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string>('thread-madrid-coworker');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingAlternativeId, setLoadingAlternativeId] = useState<string | null>(null);

  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    const loadedThreads = loadThreads();
    const loadedSettings = loadSettings();
    const loadedActiveId = loadActiveThreadId(loadedThreads);

    setThreads(loadedThreads);
    setSettings(loadedSettings);
    setActiveThreadId(loadedActiveId);

    // Apply theme
    if (loadedSettings.theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Save changes
  useEffect(() => {
    if (isClient) {
      saveThreads(threads);
    }
  }, [threads, isClient]);

  useEffect(() => {
    if (isClient) {
      saveActiveThreadId(activeThreadId);
    }
  }, [activeThreadId, isClient]);

  useEffect(() => {
    if (isClient) {
      saveSettings(settings);
    }
  }, [settings, isClient]);

  // Current active thread
  const activeThread =
    threads.find((t) => t.id === activeThreadId) ||
    threads[0] ||
    INITIAL_THREADS[0];

  // Handlers for Top Control Bar
  const handleUpdateThreadNote = (note: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread.id ? { ...t, note, updatedAt: Date.now() } : t))
    );
  };

  const handleChangeDialect = (dialect: SpanishDialect) => {
    setSettings((prev) => ({ ...prev, dialect }));
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread.id ? { ...t, dialect, updatedAt: Date.now() } : t))
    );
  };

  const handleChangeEngine = (engine: AIEngine) => {
    setSettings((prev) => ({ ...prev, engine }));
  };

  const handleChangeTone = (tone: ConversationTone) => {
    setSettings((prev) => ({ ...prev, tone }));
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread.id ? { ...t, defaultTone: tone, updatedAt: Date.now() } : t))
    );
  };

  const handleToggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    setSettings((prev) => ({ ...prev, theme: nextTheme }));
    if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  };

  // Chat Actions: Send Message (Scenario A or Scenario B)
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const detected = detectLanguage(text);
    const userMsgId = `msg-${Date.now()}-user`;
    const assistantMsgId = `msg-${Date.now()}-assistant`;

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      timestamp: Date.now(),
      inputText: text.trim(),
      detectedLanguage: detected === 'ar' ? 'ar' : 'es',
    };

    // Add user message to state immediately
    const updatedMessages = [...activeThread.messages, userMessage];
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? { ...t, messages: updatedMessages, updatedAt: Date.now() }
          : t
      )
    );

    setIsLoading(true);

    try {
      // Build history for context (last 12 messages)
      const historyContext = updatedMessages.slice(-12).map((m) => ({
        role: m.role,
        content: m.role === 'user' ? m.inputText : m.payload?.spanishReply || '',
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputText: text.trim(),
          dialect: activeThread.dialect || settings.dialect,
          tone: activeThread.defaultTone || settings.tone,
          engine: settings.engine,
          contactName: activeThread.name,
          contactNote: activeThread.note,
          history: historyContext,
          isAlternative: false,
          customGeminiKey: settings.customGeminiKey,
          customOpenRouterKey: settings.customOpenRouterKey,
        }),
      });

      const json = await res.json();
      const payload: AssistantResponsePayload = json?.data;

      if (!payload) {
        throw new Error(json?.error || 'Failed to generate response');
      }

      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        timestamp: Date.now(),
        inputText: text.trim(),
        detectedLanguage: detected === 'ar' ? 'ar' : 'es',
        payload,
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? { ...t, messages: [...updatedMessages, assistantMessage], updatedAt: Date.now() }
            : t
        )
      );
    } catch (err: any) {
      console.error('Error generating reply:', err);
      // Fallback assistant error card
      const fallbackAssistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        timestamp: Date.now(),
        inputText: text.trim(),
        detectedLanguage: detected === 'ar' ? 'ar' : 'es',
        payload: {
          scenario: detected === 'es' ? 'A' : 'B',
          detectedLanguage: detected === 'ar' ? 'ar' : 'es',
          incomingTranslationAr:
            detected === 'es' ? 'حدث تأخير في الخادم، يرجى المحاولة ثانية.' : undefined,
          spanishReply:
            detected === 'es'
              ? '¡Hola! Todo bien por aquí, ¿y contigo?'
              : '¡Hola! Todo genial por aquí, ¿cómo estás?',
          replyMeaningAr: 'مرحباً! كل شيء على ما يرام هنا، وأنت كيف حالك؟',
          vocabulary: [
            {
              spanish: 'todo bien',
              arabic: 'كل شيء على ما يرام',
              tip: 'رد كلاسيكي ودود يناسب جميع المحادثات',
            },
          ],
          engineUsed: 'smart-engine',
        },
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? { ...t, messages: [...updatedMessages, fallbackAssistantMessage], updatedAt: Date.now() }
            : t
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Scenario C: Another Option Generator
  const handleGenerateAlternative = async (messageId: string, inputText: string) => {
    setLoadingAlternativeId(messageId);

    try {
      const historyContext = activeThread.messages.slice(-12).map((m) => ({
        role: m.role,
        content: m.role === 'user' ? m.inputText : m.payload?.spanishReply || '',
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputText,
          dialect: activeThread.dialect || settings.dialect,
          tone: activeThread.defaultTone || settings.tone,
          engine: settings.engine,
          contactName: activeThread.name,
          contactNote: activeThread.note,
          history: historyContext,
          isAlternative: true, // Trigger Scenario C
          customGeminiKey: settings.customGeminiKey,
          customOpenRouterKey: settings.customOpenRouterKey,
        }),
      });

      const json = await res.json();
      const newPayload: AssistantResponsePayload = json?.data;

      if (newPayload) {
        setThreads((prev) =>
          prev.map((t) => {
            if (t.id !== activeThread.id) return t;
            return {
              ...t,
              messages: t.messages.map((m) => {
                if (m.id === messageId) {
                  return { ...m, payload: newPayload };
                }
                return m;
              }),
            };
          })
        );
      }
    } catch (err) {
      console.error('Failed to generate alternative option', err);
    } finally {
      setLoadingAlternativeId(null);
    }
  };

  // Contacts Management Handlers
  const handleCreateThread = (name: string, note?: string, dialect?: SpanishDialect) => {
    const newThread: ContactThread = {
      id: `thread-${Date.now()}`,
      name,
      note: note || '',
      dialect: dialect || settings.dialect,
      defaultTone: settings.tone,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
  };

  const handleDeleteThread = (id: string) => {
    const remaining = threads.filter((t) => t.id !== id);
    if (remaining.length === 0) {
      setThreads(INITIAL_THREADS);
      setActiveThreadId(INITIAL_THREADS[0].id);
    } else {
      setThreads(remaining);
      if (activeThreadId === id) {
        setActiveThreadId(remaining[0].id);
      }
    }
  };

  const handleUpdateThread = (id: string, updates: Partial<ContactThread>) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t))
    );
  };

  const handleClearAllData = () => {
    localStorage.clear();
    setThreads(INITIAL_THREADS);
    setActiveThreadId(INITIAL_THREADS[0].id);
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-[#090d16] text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. Header with brand, switcher trigger, theme, settings */}
      <Header
        activeThread={activeThread}
        onOpenContacts={() => setIsContactsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
        engine={settings.engine}
      />

      {/* 2. Top Control & Context Bar (Collapsible, dialect, tone, engine, notes) */}
      <TopControlBar
        activeThread={activeThread}
        onUpdateThreadNote={handleUpdateThreadNote}
        dialect={activeThread.dialect || settings.dialect}
        onChangeDialect={handleChangeDialect}
        engine={settings.engine}
        onChangeEngine={handleChangeEngine}
        tone={activeThread.defaultTone || settings.tone}
        onChangeTone={handleChangeTone}
      />

      {/* 3. Main Chat Container (Messages, Response Cards, Auto-scroll) */}
      <ChatContainer
        messages={activeThread.messages}
        activeThread={activeThread}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        onGenerateAlternative={handleGenerateAlternative}
        loadingAlternativeId={loadingAlternativeId}
      />

      {/* 4. Frictionless Bottom Input Bar (Paste button, auto-expand, clear, send) */}
      <BottomInputBar
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />

      {/* Contacts / Threads Drawer */}
      <ContactsDrawer
        isOpen={isContactsOpen}
        onClose={() => setIsContactsOpen(false)}
        threads={threads}
        activeThreadId={activeThread.id}
        onSelectThread={(id) => setActiveThreadId(id)}
        onCreateThread={handleCreateThread}
        onDeleteThread={handleDeleteThread}
        onUpdateThread={handleUpdateThread}
      />

      {/* Settings Modal (API Keys, PWA Instructions, Fallback status) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
        onClearAllData={handleClearAllData}
      />
    </main>
  );
}
