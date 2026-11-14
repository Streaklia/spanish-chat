export type SpanishDialect = 'spain' | 'latam';

export type ConversationTone = 'casual' | 'friendly' | 'flirty' | 'formal';

export type AIEngine = 'gemini' | 'openrouter';

export type DetectedLanguage = 'es' | 'ar' | 'unknown';

export interface VocabItem {
  spanish: string;
  arabic: string;
  tip: string;
}

export interface AssistantResponsePayload {
  scenario: 'A' | 'B';
  detectedLanguage: 'es' | 'ar';
  incomingTranslationAr?: string; // Scenario A: What they said in Arabic
  spanishReply: string;          // Suggested reply or translation in Spanish
  replyMeaningAr: string;        // Exact meaning of the Spanish reply in Arabic
  vocabulary: VocabItem[];       // 1 to 3 key vocab breakdown items
  culturalTip?: string;          // Optional nuance or slang tip
  engineUsed: 'gemini' | 'openrouter' | 'smart-engine';
  isAlternative?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  timestamp: number;
  inputText: string;
  detectedLanguage: 'es' | 'ar';
  payload?: AssistantResponsePayload;
  alternativeOptions?: string[]; // Cached alternatives for quick cycling
}

export interface ContactThread {
  id: string;
  name: string;
  note?: string; // e.g., "Crush, female, lives in Madrid", "Coworker, male, polite"
  dialect: SpanishDialect;
  defaultTone: ConversationTone;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  engine: AIEngine;
  dialect: SpanishDialect;
  tone: ConversationTone;
  theme: 'dark' | 'light';
  customGeminiKey?: string;
  customOpenRouterKey?: string;
}
