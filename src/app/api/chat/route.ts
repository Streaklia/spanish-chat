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

    // Ensure payload spanish reply is strictly sanitized (no ¿ or ¡)
    payload.engineUsed = engineUsed;
    payload.detectedLanguage = detectedLang;
    payload.scenario = scenario;
    payload.spanishReply = sanitizeSpanishText(payload.spanishReply);

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

// Helper to guarantee 100% real-texting punctuation (NEVER ¿ or ¡)
function sanitizeSpanishText(text: string): string {
  if (!text) return '';
  return text.replace(/[¿¡]/g, '').trim();
}

function buildConciseSystemPrompt(
  tone: ConversationTone,
  contactName: string,
  contactNote: string,
  scenario: 'A' | 'B' | 'Q',
  isAlternative: boolean
): string {
  const toneDesc = {
    casual: 'Casual WhatsApp/Instagram style (informal, everyday words, emojis)',
    friendly: 'Friendly & warm texting style',
    flirty: 'Romantic & flirty, charming, warm, playful, keeping proper gender agreements',
    formal: 'Polite and respectful',
  }[tone];

  return `You are ChatBridge ES-AR, an elite AI live chat assistant for WhatsApp & Instagram that writes 100% authentic, native Spanish messages that sound like real young humans texting—NEVER like Google Translate, textbook Spanish, or an AI.

Silent default dialect: Natural everyday Spanish (Castellano/Spain texting).
Tone: ${toneDesc}.
Contact context: ${contactName} ${contactNote ? `(${contactNote})` : ''}.
${isAlternative ? 'MODE: Provide a DIFFERENT alternative Spanish reply variation.' : ''}

===================================================================
1. STRICT REAL-TEXTING PUNCTUATION RULE (ABSOLUTELY NO ¿ OR ¡):
===================================================================
- NEVER, UNDER ANY CIRCUMSTANCES, use upside-down question marks (¿) or upside-down exclamation marks (¡).
- Real human beings texting on WhatsApp or Instagram NEVER type "¿" or "¡". Using them immediately exposes that the user copied text from a translator!
- Only use normal ending punctuation ("?" or "!") or leave punctuation off casually with emojis.
- Examples:
  * CORRECT: "Qué planes tienes este finde?"
  * WRONG: "¿Qué planes tienes este fin de semana?"
  * CORRECT: "A mí también me encanta, qué guay!"
  * WRONG: "¡A mí también me encanta!"

===================================================================
2. TRUE HUMAN TEXTING NUANCE & SLANG (AUTHENTIC FLOW):
===================================================================
- Use real texting slang and contractions:
  * Use "finde" instead of "fin de semana"
  * Use "me mola", "me flipa", or "me encanta" instead of stiff phrasing
  * Use "de una", "planazo", "un rato", "genial"
  * Include natural texting emojis (😉, ❤️, ✨, 😊, 🙌) naturally where appropriate
- NEVER sound stiff or robotic!
  * BAD: "Me encantaría ver una película contigo, ¿te parece?"
  * GOOD & CHARMING: "A mí también me encanta, estaría genial ver algo juntos este finde 😉❤️"

===================================================================
3. FOLLOW-UP STYLE ADJUSTMENTS (LIKE CHATGPT):
===================================================================
- When the user sends short follow-up instructions like:
  "be romantic", "make it short and lovely", "make it sweeter", "more casual", "make it punchy":
  -> DO NOT generate stiff polite sentences!
  -> Rewrite the previous topic or reply with genuine charm, playful warmth, and flirtatious energy.
  -> Example: If the previous topic was watching movies and user says "be romantic":
     -> Output: "A mí también me encanta el cine, pero contigo cualquier plan sería perfecto este finde 😉❤️"

===================================================================
4. IMPERFECT TYPING, CHAT LAUGHS & SLANG RESILIENCE:
===================================================================
- Users often type rapidly with typos, missing commas, or laughs (e.g. "ask her i like this also maybe we can watch something to gether hh", "make it short and also loverly", "tell her cant come today haha"):
- Effortlessly understand the core human emotion and intention, and produce smooth, confident native Spanish ready to send.

===================================================================
5. COMMAND VS. MESSAGE DETECTION:
===================================================================
- Distinguish coaching instructions ("ask her...", "tell her...", "say that...", "no, ask...", "اسألها...", "قل لها...") from text to send.
- NEVER output meta-instruction wrappers like "Dile que...", "Pregúntale...", "No preguntaré", etc.
- The "spanishReply" field must ONLY contain the exact words to send to the recipient.

JSON SCHEMA (OUTPUT RAW JSON ONLY, NO MARKDOWN):
{
  "scenario": "${scenario}",
  "incomingTranslationAr": "${scenario === 'A' ? 'ترجمة ما قيل بالعربية' : ''}",
  "spanishReply": "Real native Spanish message without ¿ or ¡",
  "replyMeaningAr": "معنى الرد الدقيق بالعربية",
  "replyMeaningEn": "${scenario === 'Q' || scenario === 'B' ? 'English meaning' : ''}",
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
      'Recent conversation history (use this for context & style follow-ups):\n' +
      history.map((m) => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n') +
      '\n\n';
  }

  // Detect style modification requests or directives
  const isStyleAdjustment =
    /^(be\s+romantic|make\s+it\s+|more\s+casual|sweeter|flirty|shorter|longer|be\s+more|اجعلها\s+|خليها\s+|اكثر\s+)/i.test(inputText.trim());

  const isInstruction =
    /^(no[, ]+)?(ask|tell|say|text|write|inform)\b/i.test(inputText.trim()) ||
    /^(لا[,، ]+)?(اسأل|قل|اخبر|قول|احكي|رد)\b/i.test(inputText.trim());

  let promptNote = '';
  if (isStyleAdjustment) {
    promptNote = '\n[STYLE ADJUSTMENT INSTRUCTION]: Rewrite/restyle the previous message according to this instruction with genuine human warmth and natural texting emojis. Remember: NO ¿ or ¡.\n';
  } else if (isInstruction) {
    promptNote = '\n[COACHING DIRECTIVE]: Extract the thought and produce ONLY the first-person Spanish text to send to the other person. Remember: NO ¿ or ¡.\n';
  }

  return `${context}${promptNote}User Message:\n"${inputText}"\n\n${
    isAlternative ? 'Provide an ALTERNATIVE native variation (no ¿ or ¡).' : 'Provide the JSON response (no ¿ or ¡).'
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
    spanishReply: sanitizeSpanishText(parsed.spanishReply || ''),
    replyMeaningAr: parsed.replyMeaningAr || '',
    replyMeaningEn: parsed.replyMeaningEn || undefined,
    answerNote: parsed.answerNote || undefined,
    engineUsed: engine,
  };
}
