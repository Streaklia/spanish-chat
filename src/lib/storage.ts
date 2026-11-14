import { AppSettings, ContactThread, SpanishDialect, ConversationTone } from '@/types';

const THREADS_KEY = 'chatbridge_threads_v1';
const ACTIVE_THREAD_KEY = 'chatbridge_active_thread_id_v1';
const SETTINGS_KEY = 'chatbridge_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  engine: 'gemini',
  dialect: 'spain',
  tone: 'friendly',
  theme: 'dark',
};

export const INITIAL_THREADS: ContactThread[] = [
  {
    id: 'thread-madrid-coworker',
    name: 'Madrid Coworker',
    note: 'Coworker from Madrid, male, professional but friendly context.',
    dialect: 'spain',
    defaultTone: 'friendly',
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000,
    messages: [
      {
        id: 'msg-seed-1-user',
        role: 'user',
        timestamp: Date.now() - 1800000,
        inputText: 'Hola! Mi día estuvo bien, gracias por preguntar. ¿Qué tal el curro hoy?',
        detectedLanguage: 'es',
      },
      {
        id: 'msg-seed-1-assistant',
        role: 'assistant',
        timestamp: Date.now() - 1795000,
        inputText: 'Hola! Mi día estuvo bien, gracias por preguntar. ¿Qué tal el curro hoy?',
        detectedLanguage: 'es',
        payload: {
          scenario: 'A',
          detectedLanguage: 'es',
          incomingTranslationAr: 'أهلاً! كان يومي جيداً، شكراً على سؤالك. كيف كان العمل اليوم؟',
          spanishReply: '¡Qué bueno! Por aquí el curro bastante bien, ya cerrando unos temas para descansar.',
          replyMeaningAr: 'جميل جداً! هنا العمل يسير بشكل جيد تماماً، وأنا الآن أنهي بعض المهام لأرتاح.',
          vocabulary: [
            { spanish: 'curro', arabic: 'العمل / الشغل', tip: 'كلمة عامية دارجة جداً في إسبانيا مرادفة لـ trabajo' },
            { spanish: 'bastante bien', arabic: 'جيد تماماً / على ما يرام', tip: 'تعبير متكرر في الإجابات الودية' },
            { spanish: 'cerrando unos temas', arabic: 'إنهاء بعض الملفات أو المواضيع', tip: 'تعبير مجازي شائع في بيئة العمل الإسبانية' }
          ],
          culturalTip: 'في إسبانيا كلمة "curro" شائعة ومقبولة جداً بين الزملاء المقربين في العمل بدلاً من "trabajo".',
          engineUsed: 'smart-engine'
        }
      }
    ]
  },
  {
    id: 'thread-insta-friend',
    name: 'Instagram Crush',
    note: 'Crush from Colombia / LatAm, female, romantic & warm context.',
    dialect: 'latam',
    defaultTone: 'flirty',
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
    console.error('Error loading threads from localStorage', e);
    return INITIAL_THREADS;
  }
}

export function saveThreads(threads: ContactThread[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  } catch (e) {
    console.error('Error saving threads to localStorage', e);
  }
}

export function loadActiveThreadId(threads: ContactThread[]): string {
  if (typeof window === 'undefined') return INITIAL_THREADS[0].id;
  try {
    const savedId = localStorage.getItem(ACTIVE_THREAD_KEY);
    if (savedId && threads.some(t => t.id === savedId)) {
      return savedId;
    }
    return threads[0]?.id || 'default-thread';
  } catch (e) {
    return threads[0]?.id || 'default-thread';
  }
}

export function saveActiveThreadId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_THREAD_KEY, id);
  } catch (e) {
    console.error('Error saving active thread id', e);
  }
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
  } catch (e) {
    console.error('Error saving settings to localStorage', e);
  }
}
