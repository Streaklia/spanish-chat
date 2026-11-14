export type ConversationTone = 'casual' | 'friendly' | 'flirty' | 'formal';

export type AIEngine = 'gemini' | 'openrouter';

export type DetectedLanguage = 'es' | 'ar' | 'en' | 'unknown';

export interface VocabItem {
  spanish: string;
  arabic: string;
  tip?: string;
}

export interface AssistantResponsePayload {
  scenario: 'A' | 'B' | 'Q';
  detectedLanguage: 'es' | 'ar' | 'en';
  incomingTranslationAr?: string;
  spanishReply: string;
  replyMeaningAr: string;
  replyMeaningEn?: string;
  answerNote?: string;
  vocabulary?: VocabItem[];
  engineUsed: 'gemini' | 'openrouter' | 'smart-engine';
  modelUsed?: string; // Exact free model that answered (e.g. "nemotron-3.5-lightning:free")
  isAlternative?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  timestamp: number;
  inputText: string;
  detectedLanguage: 'es' | 'ar' | 'en';
  payload?: AssistantResponsePayload;
}

export interface ContactThread {
  id: string;
  name: string;
  note?: string;
  defaultTone: ConversationTone;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  engine: AIEngine;
  selectedModel?: string;
  tone: ConversationTone;
  theme: 'dark' | 'light';
  customGeminiKey?: string;
  customOpenRouterKey?: string;
}

export interface FreeModelOption {
  id: string;
  name: string;
  provider: 'openrouter' | 'gemini';
}
