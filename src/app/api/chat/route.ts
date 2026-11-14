import { NextRequest, NextResponse } from 'next/server';
import { AssistantResponsePayload, ConversationTone, VocabItem } from '@/types';
import { detectLanguage } from '@/lib/language-detector';
import { generateSmartResponse, generateSmartVocabulary } from '@/lib/smart-fallback-engine';

interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  action?: 'chat' | 'explain';
  inputText?: string;
  spanishText?: string;
  tone?: ConversationTone;
  engine?: 'gemini' | 'openrouter';
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
      action = 'chat',
      inputText = '',
      spanishText = '',
      tone = 'friendly',
      engine = 'openrouter',
      contactName = 'Chat',
      contactNote = '',
      history = [],
      isAlternative = false,
      customGeminiKey,
      customOpenRouterKey,
    } = body;

    const geminiKey = (customGeminiKey && customGeminiKey.trim()) || process.env.GEMINI_API_KEY || '';
    const openRouterKey = (customOpenRouterKey && customOpenRouterKey.trim()) || process.env.OPENROUTER_API_KEY || '';

    // ==========================================
    // ACTION: EXPLAIN WORDS (ON-DEMAND)
    // ==========================================
    if (action === 'explain') {
      const targetSpanish = spanishText || inputText;
      if (!targetSpanish) {
        return NextResponse.json({ success: true, data: { vocabulary: [] } });
      }

      // Fast AI prompt for 1 to 3 words
      try {
        const vocabPrompt = `Extract 1 to 3 key Spanish words or idioms from: "${targetSpanish}".
Provide concise Arabic meaning and short tip.
Output ONLY JSON array with NO markdown:
[{"spanish": "word", "arabic": "معنى", "tip": "نصيحة سريعة"}]`;

        const vocabRes = await callOpenRouterVocab(openRouterKey, vocabPrompt);
        return NextResponse.json({ success: true, data: { vocabulary: vocabRes } });
      } catch (err) {
        // Fallback
        const fallbackVocab = generateSmartVocabulary(targetSpanish);
        return NextResponse.json({ success: true, data: { vocabulary: fallbackVocab } });
      }
    }

    // ==========================================
    // ACTION: CHAT MESSAGE
    // ==========================================
    if (!inputText || !inputText.trim()) {
      return NextResponse.json({ error: 'inputText is required' }, { status: 400 });
    }

    // 1. Detect language (Spanish, Arabic, or English)
    const rawDetected = detectLanguage(inputText);
    const detectedLang: 'es' | 'ar' | 'en' = rawDetected === 'unknown' ? 'es' : rawDetected;

    // Detect if user is asking a question (in English or Arabic) about the conversation
    const isQuestion =
      detectedLang === 'en'
        ? /^(what|how|why|is\s|does|who|can\syou|what\sdoes|meaning)/i.test(inputText.trim())
        : detectedLang === 'ar'
        ? /^(ماذا|شو|كيف|ايش|عن\sشو|شو\sقصد|بماذا|ما\sمعنى)/i.test(inputText.trim())
        : false;

    let scenario: 'A' | 'B' | 'Q' = 'B';
    if (detectedLang === 'es') scenario = 'A';
    else if (isQuestion) scenario = 'Q';

    const recentHistory = (history || []).slice(-12);
    const systemPrompt = buildConciseSystemPrompt(tone, contactName, contactNote, scenario, isAlternative);
    const userPromptContent = buildConciseUserPrompt(inputText, scenario, recentHistory, isAlternative);

    let payload: AssistantResponsePayload | null = null;
    let engineUsed: 'gemini' | 'openrouter' | 'smart-engine' = 'smart-engine';

    // Primary & secondary execution
    const primaryEngine = engine;
    const secondaryEngine = engine === 'gemini' ? 'openrouter' : 'gemini';

    if (primaryEngine === 'openrouter') {
      try {
        payload = await callOpenRouter(openRouterKey, systemPrompt, userPromptContent, scenario, detectedLang);
        if (payload) engineUsed = 'openrouter';
      } catch (e) {
        // Fallback to Gemini
        try {
          payload = await callGemini(geminiKey, systemPrompt, userPromptContent, scenario, detectedLang);
          if (payload) engineUsed = 'gemini';
        } catch (e2) {}
      }
    } else {
      try {
        payload = await callGemini(geminiKey, systemPrompt, userPromptContent, scenario, detectedLang);
        if (payload) engineUsed = 'gemini';
      } catch (e) {
        // Fallback to OpenRouter
        try {
          payload = await callOpenRouter(openRouterKey, systemPrompt, userPromptContent, scenario, detectedLang);
          if (payload) engineUsed = 'openrouter';
        } catch (e2) {}
      }
    }

    // Smart fallback if external APIs fail
    if (!payload) {
      engineUsed = 'smart-engine';
      payload = generateSmartResponse(
        {
          inputText,
          tone,
          contactNote,
          isAlternative,
          history: recentHistory,
        },
        detectedLang
      );
    }

    payload.engineUsed = engineUsed;
    payload.detectedLanguage = detectedLang;
    payload.scenario = scenario;

    return NextResponse.json({
      success: true,
      data: payload,
      engineUsed,
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
  }
}

function buildConciseSystemPrompt(
  tone: ConversationTone,
  contactName: string,
  contactNote: string,
  scenario: 'A' | 'B' | 'Q',
  isAlternative: boolean
): string {
  const toneDesc = {
    casual: 'Casual WhatsApp style (informal, short, emojis)',
    friendly: 'Friendly & warm WhatsApp/Instagram texting style',
    flirty: 'Romantic & flirty, charming, keeping proper gender agreements',
    formal: 'Polite and respectful',
  }[tone];

  return `You are ChatBridge ES-AR, an ultra-fast, minimalist Spanish ↔ Arabic messaging assistant for WhatsApp & Instagram.
Silent default dialect: Natural everyday Spanish (Castellano).
Tone: ${toneDesc}.
Contact context: ${contactName} ${contactNote ? `(${contactNote})` : ''}.
${isAlternative ? 'MODE: Provide a DIFFERENT alternative Spanish reply variation.' : ''}

TOKEN-SAVING & BREVITY RULES:
- Keep all responses ultra-compact, concise, and direct like real WhatsApp text messages.
- Do NOT output long grammar essays, tips, or unsolicited vocabulary lists.
- Output ONLY valid raw JSON with NO markdown formatting (no \`\`\`json).

INPUT SCENARIOS:
1. Scenario A (Input was Spanish received from other person):
   - "incomingTranslationAr": 1 short clean line in Arabic translating what they said.
   - "spanishReply": Natural, native Spanish reply ready to copy & send.
   - "replyMeaningAr": 1 short clean line in Arabic translating your Spanish reply.

2. Scenario B (Input was Arabic or English indicating what user wants to say):
   - "spanishReply": Natural Spanish translation/reply to send.
   - "replyMeaningAr": 1 clean line in Arabic back-checking the exact meaning.
   - "replyMeaningEn": 1 clean line in English (if user wrote in English).

3. Scenario Q (Input was a question in English/Arabic about the conversation, e.g. "What is she talking about?"):
   - "answerNote": 1 concise sentence answering the user's question directly.
   - "spanishReply": Recommended ready-to-copy Spanish response.
   - "replyMeaningAr": 1 clean line in Arabic translating the Spanish reply.

JSON SCHEMA:
{
  "scenario": "${scenario}",
  "incomingTranslationAr": "${scenario === 'A' ? 'ترجمة ما قيل بالعربية' : ''}",
  "spanishReply": "Spanish text here",
  "replyMeaningAr": "معنى الرد بالعربية",
  "replyMeaningEn": "${scenario === 'Q' || scenario === 'B' ? 'English meaning if helpful' : ''}",
  "answerNote": "${scenario === 'Q' ? 'Brief answer note' : ''}"
}`;
}

function buildConciseUserPrompt(
  inputText: string,
  scenario: 'A' | 'B' | 'Q',
  history: ChatHistoryItem[],
  isAlternative: boolean
): string {
  let context = '';
  if (history.length > 0) {
    context =
      'Recent conversation:\n' +
      history.map((m) => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n') +
      '\n\n';
  }

  return `${context}User Message (${scenario}):\n"${inputText}"\n\n${
    isAlternative ? 'Give an ALTERNATIVE natural variation.' : 'Provide the compact JSON response.'
  }`;
}

async function callOpenRouter(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  scenario: 'A' | 'B' | 'Q',
  detectedLang: 'es' | 'ar' | 'en'
): Promise<AssistantResponsePayload> {
  if (!apiKey) throw new Error('No OpenRouter API key');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(10000),
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
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty OpenRouter response');

  return parseJson(raw, scenario, detectedLang, 'openrouter');
}

async function callGemini(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  scenario: 'A' | 'B' | 'Q',
  detectedLang: 'es' | 'ar' | 'en'
): Promise<AssistantResponsePayload> {
  if (!apiKey) throw new Error('No Gemini API key');

  const models = ['gemini-3.8-flash', 'gemini-flash-latest'];
  for (const m of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        signal: AbortSignal.timeout(6000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
        }),
      });

      if (!res.ok) continue;
      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (raw) return parseJson(raw, scenario, detectedLang, 'gemini');
    } catch (e) {}
  }

  throw new Error('Gemini failed');
}

async function callOpenRouterVocab(apiKey: string, prompt: string): Promise<VocabItem[]> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(8000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    }),
  });

  const data = await res.json();
  let raw = data?.choices?.[0]?.message?.content || '[]';
  const match = raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (match) raw = match[0];
  return JSON.parse(raw);
}

function parseJson(
  rawText: string,
  scenario: 'A' | 'B' | 'Q',
  detectedLang: 'es' | 'ar' | 'en',
  engine: 'gemini' | 'openrouter'
): AssistantResponsePayload {
  let cleaned = rawText.trim();
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
    scenario: parsed.scenario || scenario,
    detectedLanguage: detectedLang,
    incomingTranslationAr: parsed.incomingTranslationAr || undefined,
    spanishReply: parsed.spanishReply || '',
    replyMeaningAr: parsed.replyMeaningAr || '',
    replyMeaningEn: parsed.replyMeaningEn || undefined,
    answerNote: parsed.answerNote || undefined,
    engineUsed: engine,
  };
}
