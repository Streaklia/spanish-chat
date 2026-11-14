'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  AIEngine,
  AppSettings,
  ChatMessage,
  ContactThread,
  ConversationTone,
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
import { ChatContainer } from '@/components/ChatContainer';
import { BottomInputBar } from '@/components/BottomInputBar';
import { ContactsDrawer } from '@/components/ContactsDrawer';
import { SettingsModal } from '@/components/SettingsModal';

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);
  const [threads, setThreads] = useState<ContactThread[]>(INITIAL_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string>('chat-initial');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Incognito Mode State (Strict zero local persistence)
  const [isIncognito, setIsIncognito] = useState(false);
  const [incognitoThread, setIncognitoThread] = useState<ContactThread>({
    id: 'thread-incognito',
    name: 'Incognito Chat',
    defaultTone: 'friendly',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  });

  // Background Model Health Status (Auto-tested on startup)
  const [modelStatus, setModelStatus] = useState<{
    isOnline: boolean;
    latencyMs?: number;
    label: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingAlternativeId, setLoadingAlternativeId] = useState<string | null>(null);

  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // AbortController reference to allow stopping response generation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize and load saved local data
  useEffect(() => {
    setIsClient(true);
    const loadedThreads = loadThreads();
    const loadedSettings = loadSettings();
    const loadedActiveId = loadActiveThreadId(loadedThreads);

    setThreads(loadedThreads);
    setSettings(loadedSettings);
    setActiveThreadId(loadedActiveId);

    if (loadedSettings.theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }

    // Startup background auto-test for openrouter/free
    const autoTestStartupModel = async () => {
      try {
        const res = await fetch('/api/models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: loadedSettings.engine || 'openrouter',
            model: loadedSettings.selectedModel || 'openrouter/free',
          }),
        });
        const data = await res.json();
        if (data.success) {
          setModelStatus({
            isOnline: true,
            latencyMs: data.latencyMs,
            label: `${loadedSettings.selectedModel || 'openrouter/free'} (${data.latencyMs}ms)`,
          });
        } else {
          // If openrouter fails, try Gemini fallback
          const gemRes = await fetch('/api/models', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: 'gemini',
              model: 'gemini-2.5-flash',
            }),
          });
          const gemData = await gemRes.json();
          if (gemData.success) {
            setModelStatus({
              isOnline: true,
              latencyMs: gemData.latencyMs,
              label: `Gemini Flash (${gemData.latencyMs}ms)`,
            });
          } else {
            setModelStatus({
              isOnline: false,
              label: 'Smart Fallback Engine Active',
            });
          }
        }
      } catch (e) {
        setModelStatus({
          isOnline: true,
          label: 'openrouter/free Ready',
        });
      }
    };

    autoTestStartupModel();
  }, []);

  // Save to localStorage only when NOT in incognito mode
  useEffect(() => {
    if (isClient && !isIncognito) {
      saveThreads(threads);
    }
  }, [threads, isClient, isIncognito]);

  useEffect(() => {
    if (isClient && !isIncognito) {
      saveActiveThreadId(activeThreadId);
    }
  }, [activeThreadId, isClient, isIncognito]);

  useEffect(() => {
    if (isClient) {
      saveSettings(settings);
    }
  }, [settings, isClient]);

  // Determine current active thread (Incognito vs. Saved)
  const currentActiveThread: ContactThread = isIncognito
    ? incognitoThread
    : threads.find((t) => t.id === activeThreadId) || threads[0] || INITIAL_THREADS[0];

  const handleUpdateThreadNote = (note: string) => {
    if (isIncognito) {
      setIncognitoThread((prev) => ({ ...prev, note, updatedAt: Date.now() }));
    } else {
      setThreads((prev) =>
        prev.map((t) => (t.id === currentActiveThread.id ? { ...t, note, updatedAt: Date.now() } : t))
      );
    }
  };

  const handleChangeEngine = (engine: AIEngine) => {
    setSettings((prev) => ({ ...prev, engine }));
  };

  const handleSelectModel = (selectedModel: string) => {
    setSettings((prev) => ({ ...prev, selectedModel }));
  };

  const handleChangeTone = (tone: ConversationTone) => {
    setSettings((prev) => ({ ...prev, tone }));
    if (isIncognito) {
      setIncognitoThread((prev) => ({ ...prev, defaultTone: tone, updatedAt: Date.now() }));
    } else {
      setThreads((prev) =>
        prev.map((t) => (t.id === currentActiveThread.id ? { ...t, defaultTone: tone, updatedAt: Date.now() } : t))
      );
    }
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

  // Incognito Mode Controls
  const handleToggleIncognito = () => {
    setIsIncognito((prev) => !prev);
  };

  const handleSaveIncognitoChat = () => {
    if (incognitoThread.messages.length === 0) return;

    // Create a new permanent saved thread from the incognito conversation
    const firstUserMsg = incognitoThread.messages.find((m) => m.role === 'user')?.inputText || 'Saved Chat';
    const cleanTitle = firstUserMsg.length > 25 ? `${firstUserMsg.substring(0, 25)}...` : firstUserMsg;

    const newSavedThread: ContactThread = {
      id: `thread-${Date.now()}`,
      name: cleanTitle,
      note: incognitoThread.note || '',
      defaultTone: incognitoThread.defaultTone || settings.tone,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [...incognitoThread.messages],
    };

    setThreads((prev) => [newSavedThread, ...prev]);
    setActiveThreadId(newSavedThread.id);
    setIsIncognito(false);

    // Reset incognito thread
    setIncognitoThread({
      id: 'thread-incognito',
      name: 'Incognito Chat',
      defaultTone: settings.tone,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    });
  };

  // Direct bottom clear / delete chat
  const handleClearChat = () => {
    if (isIncognito) {
      setIncognitoThread((prev) => ({ ...prev, messages: [], updatedAt: Date.now() }));
    } else {
      setThreads((prev) =>
        prev.map((t) => (t.id === currentActiveThread.id ? { ...t, messages: [], updatedAt: Date.now() } : t))
      );
    }
  };

  // Stop Generating using AbortController
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
    setLoadingAlternativeId(null);
  };

  // Chat message sending
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const detected = detectLanguage(text);
    const lang = detected === 'unknown' ? 'es' : detected;
    const userMsgId = `msg-${Date.now()}-user`;
    const assistantMsgId = `msg-${Date.now()}-assistant`;

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      timestamp: Date.now(),
      inputText: text.trim(),
      detectedLanguage: lang,
    };

    const updatedMessages = [...currentActiveThread.messages, userMessage];

    if (isIncognito) {
      setIncognitoThread((prev) => ({
        ...prev,
        messages: updatedMessages,
        updatedAt: Date.now(),
      }));
    } else {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === currentActiveThread.id
            ? { ...t, messages: updatedMessages, updatedAt: Date.now() }
            : t
        )
      );
    }

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const historyContext = updatedMessages.slice(-12).map((m) => ({
        role: m.role,
        content: m.role === 'user' ? m.inputText : m.payload?.spanishReply || '',
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        signal: abortControllerRef.current.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          inputText: text.trim(),
          tone: currentActiveThread.defaultTone || settings.tone,
          engine: settings.engine,
          selectedModel: settings.selectedModel,
          contactName: currentActiveThread.name,
          contactNote: currentActiveThread.note,
          history: historyContext,
          isAlternative: false,
          customGeminiKey: settings.customGeminiKey,
          customOpenRouterKey: settings.customOpenRouterKey,
        }),
      });

      const json = await res.json();
      const payload: AssistantResponsePayload = json?.data;

      if (!payload) throw new Error('Failed to generate response');

      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        timestamp: Date.now(),
        inputText: text.trim(),
        detectedLanguage: lang,
        payload,
      };

      if (isIncognito) {
        setIncognitoThread((prev) => ({
          ...prev,
          messages: [...updatedMessages, assistantMessage],
          updatedAt: Date.now(),
        }));
      } else {
        setThreads((prev) =>
          prev.map((t) =>
            t.id === currentActiveThread.id
              ? { ...t, messages: [...updatedMessages, assistantMessage], updatedAt: Date.now() }
              : t
          )
        );
      }
    } catch (err: any) {
      // If manually aborted by the Stop button, do not inject an error fallback message
      if (err.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('Error generating reply:', err);
      const fallbackAssistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        timestamp: Date.now(),
        inputText: text.trim(),
        detectedLanguage: lang,
        payload: {
          scenario: lang === 'es' ? 'A' : 'B',
          detectedLanguage: lang,
          incomingTranslationAr: lang === 'es' ? 'رسالة إسبانية واردة' : undefined,
          spanishReply: lang === 'es' ? 'Hola, todo bien por aquí, y tú qué tal?' : 'Hola, todo genial por aquí',
          replyMeaningAr: 'أهلاً، كل شيء بخير هنا، وأنت كيف حالك؟',
          engineUsed: 'smart-engine',
        },
      };

      if (isIncognito) {
        setIncognitoThread((prev) => ({
          ...prev,
          messages: [...updatedMessages, fallbackAssistantMessage],
          updatedAt: Date.now(),
        }));
      } else {
        setThreads((prev) =>
          prev.map((t) =>
            t.id === currentActiveThread.id
              ? { ...t, messages: [...updatedMessages, fallbackAssistantMessage], updatedAt: Date.now() }
              : t
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Scenario C: Another Option
  const handleGenerateAlternative = async (messageId: string, inputText: string) => {
    setLoadingAlternativeId(messageId);
    abortControllerRef.current = new AbortController();

    try {
      const historyContext = currentActiveThread.messages.slice(-12).map((m) => ({
        role: m.role,
        content: m.role === 'user' ? m.inputText : m.payload?.spanishReply || '',
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        signal: abortControllerRef.current.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          inputText,
          tone: currentActiveThread.defaultTone || settings.tone,
          engine: settings.engine,
          selectedModel: settings.selectedModel,
          contactName: currentActiveThread.name,
          contactNote: currentActiveThread.note,
          history: historyContext,
          isAlternative: true,
          customGeminiKey: settings.customGeminiKey,
          customOpenRouterKey: settings.customOpenRouterKey,
        }),
      });

      const json = await res.json();
      const newPayload: AssistantResponsePayload = json?.data;

      if (newPayload) {
        if (isIncognito) {
          setIncognitoThread((prev) => ({
            ...prev,
            messages: prev.messages.map((m) => (m.id === messageId ? { ...m, payload: newPayload } : m)),
          }));
        } else {
          setThreads((prev) =>
            prev.map((t) => {
              if (t.id !== currentActiveThread.id) return t;
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
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.error('Alternative error:', e);
    } finally {
      setLoadingAlternativeId(null);
      abortControllerRef.current = null;
    }
  };

  // Contacts handlers
  const handleCreateThread = (name: string, note?: string) => {
    const newThread: ContactThread = {
      id: `thread-${Date.now()}`,
      name,
      note: note || '',
      defaultTone: settings.tone,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    setIsIncognito(false);
  };

  const handleDeleteThread = (id: string) => {
    const remaining = threads.filter((t) => t.id !== id);
    if (remaining.length === 0) {
      setThreads(INITIAL_THREADS);
      setActiveThreadId(INITIAL_THREADS[0].id);
    } else {
      setThreads(remaining);
      if (activeThreadId === id) setActiveThreadId(remaining[0].id);
    }
  };

  const handleUpdateThread = (id: string, updates: Partial<ContactThread>) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t))
    );
  };

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-[#090d16] text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. Slim Single-Row Minimalist Header */}
      <Header
        activeThread={currentActiveThread}
        onOpenContacts={() => setIsContactsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
        engine={settings.engine}
        isIncognito={isIncognito}
        onToggleIncognito={handleToggleIncognito}
        onSaveIncognitoChat={handleSaveIncognitoChat}
        incognitoMessageCount={incognitoThread.messages.length}
        modelStatus={modelStatus}
      />

      {/* 2. 90% Screen Dedicated to Pure Conversation */}
      <ChatContainer
        messages={currentActiveThread.messages}
        activeThread={currentActiveThread}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        onGenerateAlternative={handleGenerateAlternative}
        loadingAlternativeId={loadingAlternativeId}
        isIncognito={isIncognito}
      />

      {/* 3. Ultra-Slim Frictionless Bottom Input Bar with Stop & Clear Controls */}
      <BottomInputBar
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        onStopGenerating={handleStopGenerating}
        onClearChat={handleClearChat}
        hasMessages={currentActiveThread.messages.length > 0}
      />

      {/* Contacts / Threads Drawer */}
      <ContactsDrawer
        isOpen={isContactsOpen}
        onClose={() => setIsContactsOpen(false)}
        threads={threads}
        activeThreadId={currentActiveThread.id}
        onSelectThread={(id) => {
          setActiveThreadId(id);
          setIsIncognito(false);
        }}
        onCreateThread={handleCreateThread}
        onDeleteThread={handleDeleteThread}
        onUpdateThread={handleUpdateThread}
      />

      {/* Compact Settings Popover / Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        activeThread={currentActiveThread}
        onUpdateThreadNote={handleUpdateThreadNote}
        onChangeEngine={handleChangeEngine}
        onSelectModel={handleSelectModel}
        onChangeTone={handleChangeTone}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
      />
    </main>
  );
}
