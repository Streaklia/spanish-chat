import { AssistantResponsePayload, ConversationTone, VocabItem } from '@/types';

interface GenerationContext {
  inputText: string;
  tone: ConversationTone;
  contactNote?: string;
  isAlternative?: boolean;
  history?: Array<{ role: string; content: string }>;
}

export function generateSmartResponse(
  ctx: GenerationContext,
  detectedLanguage: 'es' | 'ar' | 'en'
): AssistantResponsePayload {
  const { inputText, tone, isAlternative = false } = ctx;
  const clean = inputText.trim().toLowerCase();

  // 1. Spanish Input (Scenario A: Received message)
  if (detectedLanguage === 'es') {
    let incomingAr = 'رسالة باللغة الإسبانية';
    let spanishReply = '¡Hola! Todo bien por aquí, ¿y tú qué tal?';
    let replyMeaningAr = 'أهلاً! كل شيء على ما يرام هنا، وأنت كيف حالك؟';

    if (clean.includes('día') || clean.includes('dia') || clean.includes('estuvo') || clean.includes('tal')) {
      incomingAr = clean.includes('estuvo bien') ? 'كان يومي جيداً.' : 'كيف كان يومك؟';
      if (isAlternative) {
        spanishReply = '¡Me alegro mucho! El mío ha estado tranquilo, descansando un poco ya.';
        replyMeaningAr = 'يسعدني ذلك كثيراً! يومي كان هادئاً، وأنا الآن أستريح قليلاً.';
      } else {
        spanishReply = tone === 'flirty'
          ? '¡Qué bien! El mío un poco ajetreado, pero hablar contigo me alegra el día 😊'
          : '¡Qué bien! El mío también estuvo bueno, ¿tienes algún plan para hoy?';
        replyMeaningAr = tone === 'flirty'
          ? 'رائع جداً! كان يومي مشغولاً قليلاً، لكن الحديث معك يُبهج يومي 😊'
          : 'رائع جداً! ويومي كان جيداً أيضاً، هل لديك أي خطط لليوم؟';
      }
    } else if (clean.includes('hola') || clean.includes('buenas')) {
      incomingAr = 'مرحباً / أهلاً بك.';
      spanishReply = isAlternative
        ? '¡Ey! ¿Qué tal todo? Me alegro de saludarte.'
        : '¡Hola! ¿Cómo estás? Justo me estaba acordando de ti ✨';
      replyMeaningAr = isAlternative
        ? 'أهلاً! كيف هي أحوالك؟ يسعدني أن أتحدث معك.'
        : 'مرحباً! كيف حالك؟ كنت أفكر بك للتو ✨';
    } else if (clean.includes('plan') || clean.includes('haces') || clean.includes('salir')) {
      incomingAr = 'ماذا تفعل الآن؟ هل نخرج معاً؟';
      spanishReply = 'Ahora mismo terminando un par de cosas, luego libre. ¿Qué plan tienes?';
      replyMeaningAr = 'أنهي الآن بعض الأمور وسأكون متفرغاً بعد ذلك. ما هي خطتك؟';
    }

    return {
      scenario: 'A',
      detectedLanguage: 'es',
      incomingTranslationAr: incomingAr,
      spanishReply,
      replyMeaningAr,
      engineUsed: 'smart-engine',
      isAlternative,
    };
  }

  // 2. Arabic Input (Scenario B: User writes what they want to say)
  if (detectedLanguage === 'ar') {
    let spanishReply = '¡Hola! Todo genial por aquí, ¿cómo estás?';
    let replyMeaningAr = 'مرحباً! كل شيء رائع هنا، كيف حالك؟';

    if (clean.includes('اشتقت') || clean.includes('أفتقد') || clean.includes('افتقد')) {
      spanishReply = isAlternative
        ? '¡Te echo un montón de menos! Ojalá nos veamos prontito 🥰'
        : 'Te echo mucho de menos... Me encantaría verte pronto ❤️';
      replyMeaningAr = isAlternative
        ? 'أشتاق إليكِ كثيراً! أتمنى لو نلتقي قريباً 🥰'
        : 'أفتقدكِ كثيراً... يسعدني جداً أن أراكِ قريباً ❤️';
    } else if (clean.includes('أعتذر') || clean.includes('اعتذر') || clean.includes('متأخر') || clean.includes('آسف')) {
      spanishReply = isAlternative
        ? '¡Perdona de verdad! Había atasco, pero llego en 10 minutos 🙏'
        : '¡Siento la tardanza! Se me complicó una cosa, voy para allá corriendo 🏃‍♂️';
      replyMeaningAr = isAlternative
        ? 'عذراً بصدق! كان هناك ازدحام، لكني أصل خلال 10 دقائق 🙏'
        : 'أعتذر عن التأخير! تعقد معي أمر، أنا قادم إليك مسرعاً 🏃‍♂️';
    } else if (clean.includes('أحبك') || clean.includes('معجب') || clean.includes('جميلة')) {
      spanishReply = 'La verdad es que cada día me gustas más... Eres muy especial para mí ✨';
      replyMeaningAr = 'الحقيقة هي أنكِ تعجبينني أكثر مع كل يوم... أنتِ شخص مميز جداً بالنسبة لي ✨';
    }

    return {
      scenario: 'B',
      detectedLanguage: 'ar',
      spanishReply,
      replyMeaningAr,
      engineUsed: 'smart-engine',
      isAlternative,
    };
  }

  // 3. English Input (Scenario Q: Question or English instructions to say something)
  const isQuestion = /^(what|how|why|is\s|does|who|can\syou\sexplain|what\sdoes)/i.test(clean);

  if (isQuestion) {
    return {
      scenario: 'Q',
      detectedLanguage: 'en',
      answerNote: 'She is asking about your day and suggesting to catch up.',
      spanishReply: '¡Hola! Mi día ha ido genial. ¿Y el tuyo qué tal va?',
      replyMeaningAr: 'أهلاً! كان يومي رائعاً، وأنتِ كيف يسير يومك؟',
      replyMeaningEn: 'Hi! My day went great. And how is yours going?',
      engineUsed: 'smart-engine',
      isAlternative,
    };
  }

  // English statement / prompt (e.g. "Tell her I live in Madrid too and ask where she is from")
  let spanishReply = '¡Yo también vivo en Madrid! ¿De qué parte eres tú?';
  let replyMeaningAr = 'أنا أيضاً أعيش في مدريد! من أي منطقة أنتِ؟';
  let replyMeaningEn = 'I live in Madrid too! Which part are you from?';

  if (clean.includes('busy') || clean.includes('call you later')) {
    spanishReply = 'Ahora estoy un poco liado, te escribo en cuanto me desocupe 👍';
    replyMeaningAr = 'أنا منشغل قليلاً الآن، سأراسلك فور انتهائي 👍';
    replyMeaningEn = 'I am a bit busy right now, I will text you as soon as I am free 👍';
  } else if (clean.includes('miss') || clean.includes('miss you')) {
    spanishReply = '¡Te echo de menos! Ojalá podamos vernos pronto ❤️';
    replyMeaningAr = 'أفتقدكِ! أتمنى لو نلتقي قريباً ❤️';
    replyMeaningEn = 'I miss you! Hopefully we can see each other soon ❤️';
  }

  return {
    scenario: 'B',
    detectedLanguage: 'en',
    spanishReply,
    replyMeaningAr,
    replyMeaningEn,
    engineUsed: 'smart-engine',
    isAlternative,
  };
}

export function generateSmartVocabulary(spanishText: string): VocabItem[] {
  const clean = spanishText.toLowerCase();
  const list: VocabItem[] = [];

  if (clean.includes('echo de menos') || clean.includes('extraño')) {
    list.push({ spanish: 'echar de menos', arabic: 'الاشتياق / الافتقاد', tip: 'تعبير إسباني شائع جداً' });
  }
  if (clean.includes('curro')) {
    list.push({ spanish: 'curro', arabic: 'العمل / الشغل', tip: 'عامية دارجة في إسبانيا' });
  }
  if (clean.includes('guay') || clean.includes('genial')) {
    list.push({ spanish: 'guay', arabic: 'رائع / جميل', tip: 'كلمة شبابية شائعة' });
  }
  if (clean.includes('liado') || clean.includes('ajetreado')) {
    list.push({ spanish: 'liado', arabic: 'منشغل بأمور كثيرة', tip: 'estar liado' });
  }
  if (clean.includes('tardanza') || clean.includes('atasco')) {
    list.push({ spanish: 'atasco', arabic: 'ازدحام مروري', tip: 'اختناق حركة السير' });
  }
  if (clean.includes('ojalá')) {
    list.push({ spanish: 'ojalá', arabic: 'يا ليت / إن شاء الله', tip: 'أصلها عربي من (لو شاء الله)' });
  }

  if (list.length === 0) {
    // Pick 2 main words from the text
    const words = spanishText.split(/\s+/).filter(w => w.length > 4).slice(0, 2);
    for (const w of words) {
      list.push({
        spanish: w.replace(/[.,!?¡¿]/g, ''),
        arabic: 'مفردة في سياق الجملة',
        tip: 'مفردة إسبانية دارجة'
      });
    }
  }

  return list;
}
