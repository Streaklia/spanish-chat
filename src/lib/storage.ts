import { AppSettings, ContactThread } from '@/types';

const THREADS_KEY = 'chatbridge_threads_v3';
const ACTIVE_THREAD_KEY = 'chatbridge_active_thread_id_v3';
const SETTINGS_KEY = 'chatbridge_settings_v3';

export const DEFAULT_SETTINGS: AppSettings = {
  engine: 'openrouter',
  selectedModel: 'openrouter/free',
  tone: 'friendly',
  theme: 'dark',
};

// Clean slate: Zero pre-filled fake chats
export const INITIAL_THREADS: ContactThread[] = [
  {
    id: 'chat-initial',
    name: 'New Chat',
    defaultTone: 'friendly',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: []
  }
];

export function loadThreads(): ContactThread[] {
  if (typeof window === 'undefined') return INITIAL_THREADS;
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    if (!raw) {
      localStorage.setItem(THREADS_KEY, JSON.stringify(INITIAL_THREADS));
      return INITIAL_THREADS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Filter out any legacy pre-filled demo threads from older versions
      const cleaned = parsed.filter(
        (t) =>
          t.id !== 'thread-madrid-coworker' &&
          t.id !== 'thread-instagram-friend' &&
          t.name !== 'Madrid Coworker' &&
          t.name !== 'Instagram Friend'
      );
      return cleaned.length > 0 ? cleaned : INITIAL_THREADS;
    }
    return INITIAL_THREADS;
  } catch (e) {
    return INITIAL_THREADS;
  }
}

export function saveThreads(threads: ContactThread[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  } catch (e) {}
}

export function loadActiveThreadId(threads: ContactThread[]): string {
  if (typeof window === 'undefined') return INITIAL_THREADS[0].id;
  try {
    const savedId = localStorage.getItem(ACTIVE_THREAD_KEY);
    if (
      savedId &&
      savedId !== 'thread-madrid-coworker' &&
      savedId !== 'thread-instagram-friend' &&
      threads.some((t) => t.id === savedId)
    ) {
      return savedId;
    }
    return threads[0]?.id || INITIAL_THREADS[0].id;
  } catch (e) {
    return threads[0]?.id || INITIAL_THREADS[0].id;
  }
}

export function saveActiveThreadId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_THREAD_KEY, id);
  } catch (e) {}
}

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      // Ensure openrouter/free is the default
      selectedModel: parsed.selectedModel || 'openrouter/free',
    };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}
}
