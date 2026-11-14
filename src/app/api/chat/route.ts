import { NextRequest, NextResponse } from 'next/server';
import { AssistantResponsePayload, ConversationTone, SpanishDialect } from '@/types';
import { detectLanguage } from '@/lib/language-detector';
import { generateSmartResponse } from '@/lib/smart-fallback-engine';

interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  inputText: string;
  dialect: SpanishDialect;
  tone: ConversationTone;
  engine: 'gemini' | 'openrouter';
  contactName?: string;
  contactNote?: string;
  history?: ChatHistoryItem[];
  isAlternative?: boolean;
  customGeminiKey?: string;
  customOpenRouterKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json();
    const {
      inputText,
      dialect = 'spain',
      tone = 'friendly',
      engine = 'gemini',
      contactName = 'Contact',
      contactNote = '',
      history = [],
      isAlternative = false,
      customGeminiKey,
      customOpenRouterKey,
    } = body;

    if (!inputText || !inputText.trim()) {
      return NextResponse.json({ error: 'inputText is required' }, { status: 400 });
    }

    // 1. Detect language (Spanish or Arabic)
    const rawDetected = detectLanguage(inputText);
    const detectedLang: 'es' | 'ar' = rawDetected === 'ar' ? 'ar' : 'es';
    const scenario: 'A' | 'B' = detectedLang === 'es' ? 'A' : 'B';

    // 2. Prepare context prompt with last 12 messages, dialect, tone, note
    const recentHistory = (history || []).slice(-12);
    const systemPrompt = buildSystemPrompt(dialect, tone, contactName, contactNote, scenario, isAlternative);
    const userPromptContent = buildUserPrompt(inputText, scenario, recentHistory, isAlternative);

    // 3. Resolve API keys securely on server
    const geminiKey = (customGeminiKey && customGeminiKey.trim()) || process.env.GEMINI_API_KEY || '';
    const openRouterKey = (customOpenRouterKey && customOpenRouterKey.trim()) || process.env.OPENROUTER_API_KEY || '';

    let payload: AssistantResponsePayload | null = null;
    let engineUsed: 'gemini' | 'openrouter' | 'smart-engine' = 'smart-engine';
    let fallbackTriggered = false;
    let fallbackReason = '';

    // Primary & secondary order
    const primaryEngine = engine;
    const secondaryEngine = engine === 'gemini' ? 'openrouter' : 'gemini';

    // Attempt Primary
    if (primaryEngine === 'gemini') {
      try {
        payload = await callGemini(geminiKey, systemPrompt, userPromptContent, scenario, detectedLang);
        if (payload) engineUsed = 'gemini';
      } catch (err: any) {
        fallbackReason = `Gemini primary error: ${err.message || 'Call failed'}`;
        fallbackTriggered = true;
      }
    } else {
      try {
        payload = await callOpenRouter(openRouterKey, systemPrompt, userPromptContent, scenario, detectedLang);
        if (payload) engineUsed = 'openrouter';
      } catch (err: any) {
        fallbackReason = `OpenRouter primary error: ${err.message || 'Call failed'}`;
        fallbackTriggered = true;
      }
    }

    // Attempt Secondary if primary failed
    if (!payload) {
      if (secondaryEngine === 'gemini') {
        try {
          payload = await callGemini(geminiKey, systemPrompt, userPromptContent, scenario, detectedLang);
          if (payload) engineUsed = 'gemini';
        } catch (err: any) {
          fallbackReason += ` | Secondary Gemini error: ${err.message || 'Call failed'}`;
        }
      } else {
        try {
          payload = await callOpenRouter(openRouterKey, systemPrompt, userPromptContent, scenario, detectedLang);
          if (payload) engineUsed = 'openrouter';
        } catch (err: any) {
          fallbackReason += ` | Secondary OpenRouter error: ${err.message || 'Call failed'}`;
        }
      }
    }

    // If both AI providers failed or are unauthenticated, use Smart Local Engine
    if (!payload) {
      engineUsed = 'smart-engine';
      payload = generateSmartResponse(
        {
          inputText,
          dialect,
          tone,
          contactNote,
          isAlternative,
          history: recentHistory,
        },
        detectedLang
      );
    }

    // Ensure metadata
    payload.engineUsed = engineUsed;
    payload.detectedLanguage = detectedLang;
    payload.scenario = scenario;

    return NextResponse.json({
      success: true,
      data: payload,
      engineUsed,
      fallbackTriggered,
      fallbackReason: fallbackTriggered ? fallbackReason : undefined,
    });
  } catch (error: any) {
    console.error('Chat API Fatal Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(
  dialect: SpanishDialect,
  tone: ConversationTone,
  contactName: string,
  contactNote: string,
  scenario: 'A' | 'B',
  isAlternative: boolean
): string {
  const dialectInfo =
    dialect === 'spain'
      ? 'Spain Spanish (Peninsular). Use vosotros/vosotras for plural you, authentic Peninsular slang (guay, molar, qué va, tío/tía, me flipa, pasta, curro) when casual/friendly.'
      : 'Latin American Spanish. Use ustedes for plural you, authentic Latin American slang (chévere, genial, onda, re bien, qué padre, bacán, lindo/linda) when casual/friendly.';

  const toneInfo = {
    casual: 'Casual & Relaxed: WhatsApp/Instagram texting style, abbreviations, punchy emojis, informal phrasing.',
    friendly: 'Friendly & Warm: Kind, positive, supportive, engaging, conversational.',
    flirty: 'Romantic & Flirty: Sweet, playful, charming, affectionate, respecting proper Spanish gender agreements.',
    formal: 'Formal & Polite: Professional, courteous, respectful, utilizing polite forms (usted when appropriate).',
  }[tone];

  return `You are ChatBridge ES-AR, an elite AI Spanish ↔ Arabic live chat assistant and passive language-learning tool designed for Arabic speakers chatting with Spanish speakers on WhatsApp and Instagram.

YOUR PERSONALITY & MISSION:
- Help Arabic speakers send authentic, native-sounding Spanish messages on WhatsApp and Instagram.
- Never produce stiff, literal, machine-translated Spanish or textbook robotic phrasing.
- Provide crystal-clear Arabic explanations so the user understands 100% of what they are sending.
- Provide a mini vocabulary breakdown (1 to 3 key words/phrases) with Arabic meaning and learning tips to facilitate passive learning.

ACTIVE CONTACT CONTEXT:
- Contact Name: ${contactName}
- Contact Profile & Relationship Note: ${contactNote || 'Friend / acquaintance'}
- Target Spanish Dialect: ${dialectInfo}
- Target Conversation Tone: ${toneInfo}
${isAlternative ? '- MODE: Generate a DIFFERENT alternative variation of the Spanish reply (Scenario C).' : ''}

CURRENT WORKFLOW:
${
  scenario === 'A'
    ? `SCENARIO A — INCOMING SPANISH MESSAGE ("They said..."):
The user received a Spanish message from someone else. You must return:
1. incomingTranslationAr: An accurate, natural Arabic translation of what they said.
2. spanishReply: A natural, native-sounding Spanish reply tailored to conversation flow, selected dialect, and chosen tone.
3. replyMeaningAr: The exact Arabic translation of the suggested Spanish reply so the user knows 100% what it means before sending.
4. vocabulary: 1 to 3 key Spanish words or expressions from this exchange, with Arabic meaning and short learning tip.`
    : `SCENARIO B — CUSTOM ARABIC REPLY ("I want to say..."):
The user wrote what they want to say in Arabic. You must return:
1. spanishReply: A natural Spanish translation/adaptation—how a real native speaker texts on WhatsApp/IG, never a stiff dictionary translation.
2. replyMeaningAr: Confirmation in Arabic of the exact nuance and tone conveyed by the generated Spanish reply.
3. vocabulary: 1 to 3 key Spanish words or expressions used in the Spanish reply explained in Arabic with learning tips.`
}

RESPONSE FORMAT:
You MUST output ONLY valid, parseable JSON with NO markdown formatting around it (do NOT include \`\`\`json or \`\`\`).
JSON Schema:
{
  "scenario": "${scenario}",
  "incomingTranslationAr": "${scenario === 'A' ? 'Arabic translation of incoming Spanish text' : ''}",
  "spanishReply": "Native Spanish reply or translation here",
  "replyMeaningAr": "Exact Arabic translation/meaning of the Spanish reply here",
  "vocabulary": [
    {
      "spanish": "word or phrase",
      "arabic": "معنى الكلمة بالعربية",
      "tip": "نصيحة تعليمية سريعة بالعربية عن استخدام هذه الكلمة"
    }
  ],
  "culturalTip": "A short, 1-sentence cultural or texting nuance in Arabic"
}`;
}

function buildUserPrompt(
  inputText: string,
  scenario: 'A' | 'B',
  history: ChatHistoryItem[],
  isAlternative: boolean
): string {
  let contextStr = '';
  if (history && history.length > 0) {
    contextStr = `Recent Conversation Context (Last ${history.length} messages):\n` +
      history.map((m, idx) => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n') + '\n\n';
  }

  return `${contextStr}User Input (${scenario === 'A' ? 'Incoming Spanish message received' : 'Arabic message user wants to say'}):\n"${inputText}"\n\n${
    isAlternative ? 'Please provide an ALTERNATIVE natural variation for the Spanish reply.' : 'Please provide the structured response.'
  }`;
}

async function callGemini(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  scenario: 'A' | 'B',
  detectedLang: 'es' | 'ar'
): Promise<AssistantResponsePayload> {
  if (!apiKey) throw new Error('No Gemini API key available');

  const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
  let lastError: Error | null = null;

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        signal: AbortSignal.timeout(6000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 120)}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini');

      return parseJsonResponse(rawText, scenario, detectedLang, 'gemini');
    } catch (err: any) {
      lastError = err;
      // Try next model if available
    }
  }

  throw lastError || new Error('All Gemini candidate models failed');
}

async function callOpenRouter(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  scenario: 'A' | 'B',
  detectedLang: 'es' | 'ar'
): Promise<AssistantResponsePayload> {
  if (!apiKey) throw new Error('No OpenRouter API key available');

  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    signal: AbortSignal.timeout(12000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://chatbridge.app',
      'X-Title': 'ChatBridge ES-AR',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter HTTP ${response.status}: ${errorText.substring(0, 150)}`);
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content;
  if (!rawText) throw new Error('Empty response from OpenRouter');

  return parseJsonResponse(rawText, scenario, detectedLang, 'openrouter');
}

function parseJsonResponse(
  rawText: string,
  scenario: 'A' | 'B',
  detectedLang: 'es' | 'ar',
  engine: 'gemini' | 'openrouter'
): AssistantResponsePayload {
  let cleaned = rawText.trim();
  // Strip markdown code fences if model enclosed JSON in ```json
  const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    cleaned = match[1].trim();
  } else {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  }

  const parsed = JSON.parse(cleaned);

  return {
    scenario,
    detectedLanguage: detectedLang,
    incomingTranslationAr: parsed.incomingTranslationAr || undefined,
    spanishReply: parsed.spanishReply || '',
    replyMeaningAr: parsed.replyMeaningAr || '',
    vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
    culturalTip: parsed.culturalTip || undefined,
    engineUsed: engine,
  };
}
