export type ConversationTone = 'casual' | 'friendly' | 'flirty' | 'formal';

export type AIEngine = 'gemini' | 'openrouter';

export type DetectedLanguage = 'es' | 'ar' | 'en' | 'unknown';

export interface VocabItem {
  spanish: string;
  arabic: string;
  tip?: string;
}

export interface AssistantResponsePayload {
  scenario: 'A' | 'B' | 'Q'; // A = Spanish received, B = User wanting to send in AR/EN, Q = Question asked
  detectedLanguage: 'es' | 'ar' | 'en';
  incomingTranslationAr?: string; // Scenario A: What they said in Arabic
  spanishReply: string;          // Suggested or translated Spanish reply
  replyMeaningAr: string;        // Meaning of the Spanish reply in Arabic
  replyMeaningEn?: string;       // Meaning in English if user typed in English
  answerNote?: string;           // Concise answer if user asked a question (e.g. "She is asking if you want to meet up")
  vocabulary?: VocabItem[];      // On-demand vocab list (empty by default to save tokens)
  engineUsed: 'gemini' | 'openrouter' | 'smart-engine';
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
  note?: string; // e.g., "Crush, female, lives in Madrid", "Coworker, male"
  defaultTone: ConversationTone;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  engine: AIEngine;
  tone: ConversationTone;
  theme: 'dark' | 'light';
  customGeminiKey?: string;
  customOpenRouterKey?: string;
}
