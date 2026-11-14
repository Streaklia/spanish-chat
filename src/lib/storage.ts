import { AppSettings, ContactThread } from '@/types';

const THREADS_KEY = 'chatbridge_threads_v2';
const ACTIVE_THREAD_KEY = 'chatbridge_active_thread_id_v2';
const SETTINGS_KEY = 'chatbridge_settings_v2';

export const DEFAULT_SETTINGS: AppSettings = {
  engine: 'openrouter',
  tone: 'friendly',
  theme: 'dark',
};

export const INITIAL_THREADS: ContactThread[] = [
  {
    id: 'thread-madrid-coworker',
    name: 'Madrid Coworker',
    note: 'Coworker from Madrid, male, friendly professional',
    defaultTone: 'friendly',
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000,
    messages: [
      {
        id: 'msg-seed-1-user',
        role: 'user',
        timestamp: Date.now() - 1800000,
        inputText: 'Hola! Mi día estuvo bien, ¿y el tuyo qué tal?',
        detectedLanguage: 'es',
      },
      {
        id: 'msg-seed-1-assistant',
        role: 'assistant',
        timestamp: Date.now() - 1795000,
        inputText: 'Hola! Mi día estuvo bien, ¿y el tuyo qué tal?',
        detectedLanguage: 'es',
        payload: {
          scenario: 'A',
          detectedLanguage: 'es',
          incomingTranslationAr: 'أهلاً! كان يومي جيداً، وأنت كيف كان يومك؟',
          spanishReply: '¡Qué bien! El mío también estuvo tranquilo, ya descansando en casa.',
          replyMeaningAr: 'رائع جداً! ويومي كان هادئاً أيضاً، والآن أستريح في المنزل.',
          engineUsed: 'openrouter',
        }
      }
    ]
  },
  {
    id: 'thread-insta-friend',
    name: 'Instagram Friend',
    note: 'Female, casual & friendly',
    defaultTone: 'casual',
    createdAt: Date.now() - 3600000 * 48,
    updatedAt: Date.now() - 7200000,
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
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_THREADS;
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
    if (savedId && threads.some(t => t.id === savedId)) return savedId;
    return threads[0]?.id || 'default-thread';
  } catch (e) {
    return threads[0]?.id || 'default-thread';
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
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
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
