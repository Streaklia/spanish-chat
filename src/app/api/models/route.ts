import { NextRequest, NextResponse } from 'next/server';
import { FreeModelOption } from '@/types';

const GEMINI_FREE_MODELS: FreeModelOption[] = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Free Tier)', provider: 'gemini' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Free Tier)', provider: 'gemini' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest (Free Tier)', provider: 'gemini' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (Free Tier)', provider: 'gemini' },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider') || 'openrouter';

    if (provider === 'gemini') {
      return NextResponse.json({ success: true, models: GEMINI_FREE_MODELS });
    }

    // OpenRouter (Free Only)
    const openRouterKey = process.env.OPENROUTER_API_KEY || '';
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        'HTTP-Referer': 'https://chatbridge.app',
        'X-Title': 'ChatBridge ES-AR',
      },
    });

    const defaultRouterModel: FreeModelOption = {
      id: 'openrouter/free',
      name: 'Free Models Router (OpenRouter)',
      provider: 'openrouter',
    };

    if (!res.ok) {
      return NextResponse.json({
        success: true,
        models: [
          defaultRouterModel,
          { id: 'nvidia/nemotron-3.5-lightning:free', name: 'NVIDIA: Nemotron 3.5 Lightning (free)', provider: 'openrouter' },
          { id: 'inclusionai/ling-3.2-flash:free', name: 'inclusionAI: Ling 3.2 Flash (free)', provider: 'openrouter' },
          { id: 'google/gemma-4-31b-it:free', name: 'Google: Gemma 4 31B (free)', provider: 'openrouter' },
        ],
      });
    }

    const json = await res.json();
    const rawList: any[] = json.data || [];

    // Filter strictly for 100% free models
    const freeModels: FreeModelOption[] = rawList
      .filter((m) => {
        const isFreeId = typeof m.id === 'string' && (m.id.endsWith(':free') || m.id === 'openrouter/free');
        const isZeroPrice =
          m.pricing &&
          (m.pricing.prompt === '0' || m.pricing.prompt === 0) &&
          (m.pricing.completion === '0' || m.pricing.completion === 0);
        const isNotMusic = !m.id.includes('lyria') && !m.id.includes('music');
        return (isFreeId || isZeroPrice) && isNotMusic;
      })
      .map((m) => ({
        id: m.id,
        name: m.id === 'openrouter/free' ? 'Free Models Router (OpenRouter)' : (m.name || m.id),
        provider: 'openrouter' as const,
      }));

    // Ensure openrouter/free is at the top of the list
    const hasRouter = freeModels.some((m) => m.id === 'openrouter/free');
    const sortedModels = hasRouter
      ? [defaultRouterModel, ...freeModels.filter((m) => m.id !== 'openrouter/free')]
      : [defaultRouterModel, ...freeModels];

    return NextResponse.json({ success: true, models: sortedModels });
  } catch (error: any) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      {
        success: true,
        models: [
          { id: 'openrouter/free', name: 'Free Models Router (OpenRouter)', provider: 'openrouter' },
          { id: 'nvidia/nemotron-3.5-lightning:free', name: 'NVIDIA: Nemotron 3.5 Lightning (free)', provider: 'openrouter' },
        ],
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const body = await req.json();
    const { provider = 'openrouter', model = 'openrouter/free' } = body;

    if (provider === 'gemini') {
      const geminiKey = process.env.GEMINI_API_KEY || '';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        signal: AbortSignal.timeout(10000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'OK' }] }] }),
      });
      const latencyMs = Date.now() - start;

      if (res.ok) {
        return NextResponse.json({
          success: true,
          latencyMs,
          message: `Working ✓ (${latencyMs}ms)`,
        });
      } else {
        const errText = await res.text();
        return NextResponse.json({
          success: false,
          latencyMs,
          error: `Failed (HTTP ${res.status}): ${errText.substring(0, 80)}`,
        });
      }
    }

    // Test OpenRouter (Free model / openrouter/free)
    const openRouterKey = process.env.OPENROUTER_API_KEY || '';
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chatbridge.app',
        'X-Title': 'ChatBridge ES-AR',
      },
      body: JSON.stringify({
        model: model || 'openrouter/free',
        messages: [{ role: 'user', content: 'Say OK' }],
      }),
    });
    const latencyMs = Date.now() - start;

    if (res.ok) {
      return NextResponse.json({
        success: true,
        latencyMs,
        message: `Working ✓ (${latencyMs}ms)`,
      });
    } else {
      let statusDesc = `HTTP ${res.status}`;
      if (res.status === 429) statusDesc = 'Rate Limited (429)';
      else if (res.status === 503) statusDesc = 'Provider Busy (503)';
      else if (res.status === 404) statusDesc = 'Model Unavailable (404)';
      return NextResponse.json({
        success: false,
        latencyMs,
        error: `Failed ✗ (${statusDesc})`,
      });
    }
  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      latencyMs: Date.now() - start,
      error: `Error: ${error?.message || 'Unknown error'}`,
    });
  }
}
