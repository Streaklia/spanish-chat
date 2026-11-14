import { AssistantResponsePayload, ConversationTone, SpanishDialect, VocabItem } from '@/types';

interface GenerationContext {
  inputText: string;
  dialect: SpanishDialect;
  tone: ConversationTone;
  contactNote?: string;
  isAlternative?: boolean;
  history?: Array<{ role: string; content: string }>;
}

export function generateSmartResponse(ctx: GenerationContext, detectedLanguage: 'es' | 'ar'): AssistantResponsePayload {
  const { inputText, dialect, tone, contactNote = '', isAlternative = false } = ctx;
  const isSpain = dialect === 'spain';
  const cleanInput = inputText.trim().toLowerCase();

  // If input is Spanish (Scenario A: "They said...")
  if (detectedLanguage === 'es') {
    return handleSpanishInput(inputText, cleanInput, isSpain, tone, contactNote, isAlternative);
  } else {
    // Input is Arabic (Scenario B: "I want to say...")
    return handleArabicInput(inputText, cleanInput, isSpain, tone, contactNote, isAlternative);
  }
}

function handleSpanishInput(
  rawInput: string,
  input: string,
  isSpain: boolean,
  tone: ConversationTone,
  note: string,
  isAlternative: boolean
): AssistantResponsePayload {
  // 1. Day / How are you
  if (input.includes('día') || input.includes('dia') || input.includes('tal') || input.includes('cómo estás') || input.includes('como estas')) {
    let incomingAr = 'كان يومي جيداً، وأنت كيف كان يومك؟';
    if (input.includes('estuvo bien') || input.includes('ha ido bien')) {
      incomingAr = 'كان يومي جيداً.';
    } else if (input.includes('cansado') || input.includes('cansada')) {
      incomingAr = 'كان يوماً متعباً / أنا متعب اليوم.';
    } else if (input.includes('qué tal') || input.includes('que tal') || input.includes('cómo estás')) {
      incomingAr = 'كيف حالك؟ / كيف تسير أمورك؟';
    }

    let spanishReply = '';
    let replyMeaningAr = '';
    const vocab: VocabItem[] = [];

    if (tone === 'flirty') {
      if (isAlternative) {
        spanishReply = isSpain
          ? '¡Me alegro un montón! El mío ha mejorado bastante al leerte, la verdad 🥰'
          : '¡Qué bueno me alegra! El mío se puso mucho mejor ahorita que te leí 🥰';
        replyMeaningAr = 'يسعدني ذلك كثيراً! ويومي تحسن كثيراً بمجرد أن قرأت رسالتك في الحقيقة 🥰';
      } else {
        spanishReply = isSpain
          ? '¡Qué bien! El mío un poco ajetreado, pero hablar contigo me alegra el día guapa 😊✨'
          : '¡Qué lindo! El mío algo ocupado, pero hablar contigo siempre me alegra el día hermosa 😊✨';
        replyMeaningAr = 'يا له من أمر رائع! كان يومي مشغولاً قليلاً، لكن الحديث معك يُبهج يومي يا جميلة 😊✨';
      }
      vocab.push(
        { spanish: isSpain ? 'ajetreado' : 'ocupado', arabic: 'مزدحم أو حافل بالانشغالات', tip: 'تعبير طبيعي لوصف اليوم المليء بالعمل' },
        { spanish: isSpain ? 'guapa' : 'hermosa', arabic: 'جميلة / حلوة', tip: 'لفظ محبب شائع في الرسائل الودية والغزلية' }
      );
    } else if (tone === 'casual') {
      if (isAlternative) {
        spanishReply = isSpain
          ? '¡Genial tío! Yo aquí liado con unas cosas, pero todo en orden 👍'
          : '¡Buenísimo amigo! Yo aquí ocupado con unas cosas, pero todo tranquilo 👍';
        replyMeaningAr = 'رائع يا صاحبي! أنا هنا منشغل ببعض الأمور، لكن كل شيء على ما يرام 👍';
      } else {
        spanishReply = isSpain
          ? '¡Me alegro! El mío bastante tranquilo, descansando un poco ya en casa.'
          : '¡Qué bueno! El mío bien relajado, descansando un rato ya en casa.';
        replyMeaningAr = 'يسعدني ذلك! يومي كان هادئاً تماماً، وأنا الآن أستريح قليلاً في المنزل.';
      }
      vocab.push(
        { spanish: isSpain ? 'liado' : 'ocupado', arabic: 'منشغل / مرتبط بأشغال', tip: 'كلمة عامية إسبانية شهيرة (estar liado)' },
        { spanish: 'descansando', arabic: 'أستريح / مسترخٍ', tip: 'صيغة الاستمرار (Gerundio) من فعل descansar' }
      );
    } else if (tone === 'formal') {
      spanishReply = 'Me alegro mucho de saberlo. Por mi parte, el día ha sido muy productivo. Espero que tenga una excelente tarde.';
      replyMeaningAr = 'يسعدني كثيراً سماع ذلك. من ناحيتي، كان اليوم مثمراً للغاية. أتمنى لك أمسية ممتازة.';
      vocab.push(
        { spanish: 'productivo', arabic: 'مُثمر / إنتاجي', tip: 'تُستعمل في سياق العمل والرسائل المهنية' },
        { spanish: 'por mi parte', arabic: 'من جهتي / من ناحيتي', tip: 'عبارة رسمية أنيقة للانتقال في الحديث' }
      );
    } else {
      // Friendly default
      if (isAlternative) {
        spanishReply = isSpain
          ? '¡Qué buena noticia! Yo también he tenido un buen día. ¿Tienes algún plan para esta noche?'
          : '¡Qué chévere saberlo! Yo también tuve un lindo día. ¿Tienes planes para esta noche?';
        replyMeaningAr = 'يا لها من أخبار جميلة! أنا أيضاً حظيت بيوم جيد. هل لديك أي خطط لهذه الليلة؟';
      } else {
        spanishReply = isSpain
          ? '¡Qué guay! Me alegro mucho por ti. El mío ha estado bien, deseando desconectar un poco.'
          : '¡Qué lindo! Me alegro un montón por ti. El mío estuvo bien, con ganas de descansar un rato.';
        replyMeaningAr = 'رائع جداً! أنا سعيد جداً لأجلك. يومي كان جيداً، وأتطلع لأخذ قسط من الراحة.';
      }
      vocab.push(
        { spanish: isSpain ? 'desconectar' : 'descansar', arabic: 'فصل التفكير عن العمل والاسترخاء', tip: 'تعبير شبابي شائع يعني أخذ راحة تامة' },
        { spanish: isSpain ? 'qué guay' : 'qué chévere', arabic: 'كم هذا رائع / جميل', tip: 'كلمة عامية أساسية تختلف بين إسبانيا وأمريكا اللاتينية' }
      );
    }

    return {
      scenario: 'A',
      detectedLanguage: 'es',
      incomingTranslationAr: incomingAr,
      spanishReply,
      replyMeaningAr,
      vocabulary: vocab,
      culturalTip: isSpain
        ? 'في إسبانيا يُستعمل زمن الماضي المركب (ha ido / ha estado) لأحداث نفس اليوم، وتُعتبر "guay" الكلمة الأوسع انتشاراً للتعبير عن الإعجاب.'
        : 'في أمريكا اللاتينية يُفضل استخدام الماضي البسيط (estuvo / fue) بدلاً من المركب، وتُستعمل "chévere" أو "genial" كبديل لـ guay.',
      engineUsed: 'smart-engine',
      isAlternative
    };
  }

  // 2. Greetings (Hola, buenas, qué pasa)
  if (input.includes('hola') || input.includes('buenas') || input.includes('buenos días') || input.includes('buenas tardes') || input.includes('buenas noches')) {
    let incomingAr = 'مرحباً / أهلاً بك.';
    if (input.includes('noches')) incomingAr = 'مساء الخير / ليلة سعيدة.';
    else if (input.includes('tardes')) incomingAr = 'طاب مساؤك / مساء الخير.';
    else if (input.includes('días') || input.includes('dias')) incomingAr = 'صباح الخير.';

    let spanishReply = '';
    let replyMeaningAr = '';
    const vocab: VocabItem[] = [];

    if (tone === 'flirty') {
      spanishReply = isSpain
        ? (isAlternative ? '¡Hola! Qué ilusión saber de ti, ¿cómo va tu tarde? 😉' : '¡Hola guapa! Justo me estaba acordando de ti hace un rato ✨ ¿Qué tal todo?')
        : (isAlternative ? '¡Hola linda! Me alegra mucho saludarte, ¿cómo va tu tarde? 😉' : '¡Hola hermosa! Casualmente me estaba acordando de ti hace un ratico ✨ ¿Cómo vas?');
      replyMeaningAr = isAlternative
        ? 'أهلاً! يا لها من فرحة أن أسمع أخبارك، كيف تسير أمسيتك؟ 😉'
        : 'أهلاً يا جميلة! كنت أفكر بك للتو قبل قليل ✨ كيف هي أحوالك؟';
      vocab.push(
        { spanish: 'acordarse de', arabic: 'تذكر فلان / التفكير فيه', tip: 'فعل انعكاسي يعبر عن الاهتمام الودود: me estaba acordando de ti' },
        { spanish: isSpain ? 'hace un rato' : 'hace un ratico', arabic: 'منذ وقت قصير / قبل قليل', tip: 'في كولومبيا وباقي اللاتام يكثر التصغير بـ -ico' }
      );
    } else if (tone === 'formal') {
      spanishReply = '¡Buenos días! Es un gusto saludarle. Espero que se encuentre muy bien. ¿En qué puedo colaborarle hoy?';
      replyMeaningAr = 'صباح الخير! يسعدني جداً تحيتك. أتمنى أن تكون في أتم الصحة والعافية. كيف يمكنني مساعدتك اليوم؟';
      vocab.push(
        { spanish: 'es un gusto', arabic: 'إنه لمن دواعي سروري', tip: 'صيغة رسمية راقية لبدء المحادثة' },
        { spanish: 'saludarle', arabic: 'تحيتك (بصيغة الاحترام usted)', tip: 'اللاحقة -le تدل على مخاطبة شخص باحترام' }
      );
    } else {
      // Casual / Friendly
      spanishReply = isSpain
        ? (isAlternative ? '¡Ey! ¿Qué pasa? ¿Todo bien por ahí?' : '¡Hola! ¿Qué tal estás? Me alegro de saludarte.')
        : (isAlternative ? '¡Hola! ¿Qué onda? ¿Cómo va todo por allá?' : '¡Hola! ¿Cómo estás? Qué gusto saludarte.');
      replyMeaningAr = isAlternative
        ? 'أهلاً! ما الأخبار؟ هل كل شيء بخير لديك؟'
        : 'مرحباً! كيف حالك؟ يسعدني أن أتحدث معك.';
      vocab.push(
        { spanish: isSpain ? '¿qué pasa?' : '¿qué onda?', arabic: 'ما الأخبار؟ / شو في ما في؟', tip: 'تحية عامية شائعة جداً بين الأصدقاء الشباب' },
        { spanish: 'me alegro de', arabic: 'يسعدني / يسرني أن...', tip: 'يأتي بعدها دائماً مصدر الفعل (Infinitivo)' }
      );
    }

    return {
      scenario: 'A',
      detectedLanguage: 'es',
      incomingTranslationAr: incomingAr,
      spanishReply,
      replyMeaningAr,
      vocabulary: vocab,
      culturalTip: 'في الرسائل النصية الإسبانية، غالباً ما يتجاهل المتحدثون علامات الاستفهام المقلوبة (¿)، لكن استخدامها يعطي انطباعاً أنيقاً ومتقناً.',
      engineUsed: 'smart-engine',
      isAlternative
    };
  }

  // 3. Plans / What are you doing (¿Qué haces?, planes, salir, etc.)
  if (input.includes('haces') || input.includes('plan') || input.includes('salir') || input.includes('quedamos') || input.includes('tomar algo')) {
    const incomingAr = 'ماذا تفعل الآن؟ / ما هي خططك؟ هل نخرج معاً؟';
    let spanishReply = '';
    let replyMeaningAr = '';

    if (tone === 'flirty') {
      spanishReply = isSpain
        ? 'Pues la verdad es que estaba libre esperando tu mensaje 😉 ¿Te apetece tomar un café o picar algo luego?'
        : 'Pues la verdad estaba desocupado esperando tu mensaje 😉 ¿Te provoca tomar un cafecito o salir un rato luego?';
      replyMeaningAr = 'في الحقيقة كنت متفرغاً وأنتظر رسالتك 😉 هل ترغبين في تناول القهوة أو شيء خفيف لاحقاً؟';
    } else {
      spanishReply = isSpain
        ? 'Ahora mismo terminando un par de cosas, pero luego tengo la tarde libre. ¿Qué plan tienes en mente?'
        : 'Ahorita terminando unas cositas, pero al rato tengo tiempo libre. ¿Qué tienes planeado?';
      replyMeaningAr = 'أنهي الآن بعض الأشياء البسيطة، لكن بعد ذلك سيكون وقتي فارغاً. ما هي الخطة التي في بالك؟';
    }

    return {
      scenario: 'A',
      detectedLanguage: 'es',
      incomingTranslationAr: incomingAr,
      spanishReply,
      replyMeaningAr,
      vocabulary: [
        { spanish: isSpain ? '¿te apetece?' : '¿te provoca?', arabic: 'هل تشتهي / هل ترغب في...؟', tip: 'سؤال عفوي ودود لتقديم اقتراح للخروج' },
        { spanish: isSpain ? 'picar algo' : 'comer algo', arabic: 'تناول مقبلات سريعة / أكل خفيف', tip: 'مأخوذة من ثقافة التاباس (Tapas) الإسبانية' }
      ],
      culturalTip: isSpain
        ? 'فعل "apetecer" (me apetece / ¿te apetece?) هو الأكثر استخداماً في إسبانيا للاقتراحات.'
        : 'في أمريكا اللاتينية (خصوصاً كولومبيا وفنزويلا) يُستعمل "provocar" أو ببساطة "quieres ir a...".',
      engineUsed: 'smart-engine',
      isAlternative
    };
  }

  // General fallback for other Spanish input
  const generalSpanishReply = isSpain
    ? (tone === 'flirty'
      ? '¡Totalmente de acuerdo contigo! Además me encanta cómo piensas guapa 😊'
      : '¡Entendido perfectamente! Muchas gracias por decírmelo, lo tengo en cuenta.')
    : (tone === 'flirty'
      ? '¡Totalmente de acuerdo contigo! Me encanta cómo piensas hermosa 😊'
      : '¡Claro que sí, entendido! Muchas gracias por avisarme, lo tendré súper presente.');

  return {
    scenario: 'A',
    detectedLanguage: 'es',
    incomingTranslationAr: `رسالتهم: "${rawInput}" (رسالة باللغة الإسبانية تعبر عن التفاعل والتواصل).`,
    spanishReply: generalSpanishReply,
    replyMeaningAr: tone === 'flirty'
      ? 'أتفق معكِ تماماً! وعلاوة على ذلك يعجبني جداً أسلوب تفكيركِ يا جميلة 😊'
      : 'مفهوم تماماً! شكراً جزيلاً لإخباري، سأضع ذلك في الحسبان.',
    vocabulary: [
      { spanish: 'totalmente de acuerdo', arabic: 'متفق تماماً / أوافقك الرأي كلياً', tip: 'تعبير قوي وواثق للموافقة على كلام الطرف الآخر' },
      { spanish: isSpain ? 'lo tengo en cuenta' : 'lo tendré presente', arabic: 'سأضعه في الحسبان / سآخذه بعين الاعتبار', tip: 'تعبير لبق يُظهر الاهتمام بما قيل' }
    ],
    culturalTip: 'الردود المختصرة الدافئة مع رموز تعبيرية (emojis) هي النمط الأكثر شيوعاً وعفوية في محادثات إنستغرام وواتساب الإسبانية.',
    engineUsed: 'smart-engine',
    isAlternative
  };
}

function handleArabicInput(
  rawInput: string,
  input: string,
  isSpain: boolean,
  tone: ConversationTone,
  note: string,
  isAlternative: boolean
): AssistantResponsePayload {
  // 1. Missing you / thinking of you (أفتقدك / اشتقت لك)
  if (input.includes('اشتقت') || input.includes('أفتقدك') || input.includes('افتقدك') || input.includes('مشتاق') || input.includes('بالي')) {
    let spanishReply = '';
    let replyMeaningAr = '';

    if (isSpain) {
      if (isAlternative) {
        spanishReply = '¡Te echo un montón de menos! A ver si nos vemos prontito que ya toca 🥰';
        replyMeaningAr = 'أشتاق إليكِ كثيراً! لنرى متى نلتقي قريباً فقد حان الوقت لذلك 🥰';
      } else {
        spanishReply = 'Te echo mucho de menos... Ojalá podamos vernos pronto y ponernos al día ❤️';
        replyMeaningAr = 'أفتقدكِ كثيراً... أتمنى لو نلتقي قريباً ونتبادل كل أخبارنا ❤️';
      }
    } else {
      if (isAlternative) {
        spanishReply = '¡Te extraño muchísimo! Ojalá nos veamos muy pronto para darnos un abrazo 🥰';
        replyMeaningAr = 'أشتاق إليكِ كثيراً جداً! أتمنى أن نلتقي قريباً لنتبادل العناق 🥰';
      } else {
        spanishReply = 'Te extraño mucho... Me encantaría verte pronto y hablar de todo un poco ❤️';
        replyMeaningAr = 'أفتقدكِ كثيراً... يسعدني جداً أن أراكِ قريباً ونتحدث في كل شيء ❤️';
      }
    }

    return {
      scenario: 'B',
      detectedLanguage: 'ar',
      spanishReply,
      replyMeaningAr,
      vocabulary: [
        { spanish: isSpain ? 'echar de menos' : 'extrañar', arabic: 'الاشتياق / الافتقاد', tip: 'في إسبانيا يقال دائماً "Te echo de menos"، بينما في أمريكا اللاتينية "Te extraño"' },
        { spanish: 'ponernos al día', arabic: 'تبادل المستجدات والأخبار الأخيرة', tip: 'تعبير مجازي شهير يعني معرفة ما فات الطرفين من أحداث' },
        { spanish: 'ojalá', arabic: 'إن شاء الله / يا ليت / أتمنى', tip: 'كلمة إسبانية أصلها عربي مباشر مأخوذة من كلمة "لو شاء الله"' }
      ],
      culturalTip: 'كلمة "Ojalá" في الإسبانية تنحدر تاريخياً من العربية وتأتي دائماً متبوعة بصيغة المنصوب (Subjuntivo مثل podamos).',
      engineUsed: 'smart-engine',
      isAlternative
    };
  }

  // 2. Apology / running late (أعتذر / متأخر / عذراً)
  if (input.includes('أعتذر') || input.includes('اعتذر') || input.includes('متأخر') || input.includes('آسف') || input.includes('اسف') || input.includes('سامحني')) {
    let spanishReply = '';
    let replyMeaningAr = '';

    if (tone === 'formal') {
      spanishReply = 'Le ofrezco mis más sinceras disculpas por el retraso. Tuve un imprevisto, pero ya me encuentro en camino.';
      replyMeaningAr = 'أقدم أصدق اعتذاري عن هذا التأخير. طرأ لي ظرف طارئ، لكني في طريقي إليكم الآن.';
    } else {
      if (isSpain) {
        spanishReply = isAlternative
          ? '¡Perdona de verdad! Había un atasco tremendo, pero ya llego en 10 minutos 🙏'
          : '¡Siento mucho la tardanza! Se me ha complicado una cosa de última hora, voy para allá corriendo 🏃‍♂️';
        replyMeaningAr = isAlternative
          ? 'عذراً حقاً! كان هناك ازدحام مروري خانق، لكنني سأصل خلال 10 دقائق 🙏'
          : 'أعتذر بشدة عن التأخير! تعقد معي أمر في اللحظة الأخيرة، أنا قادم إليك مسرعاً 🏃‍♂️';
      } else {
        spanishReply = isAlternative
          ? '¡Disculpa de verdad! Había mucho tráfico, pero llego en 10 minutitos 🙏'
          : '¡Perdón por la demora! Se me presentó un inconveniente de última hora, ya voy en camino volando 🏃‍♂️';
        replyMeaningAr = isAlternative
          ? 'عذراً بصدق! كان هناك ازدحام سير شديد، لكني سأصل في 10 دقائق فقط 🙏'
          : 'سامحني على التأخير! طرأ لي ظرف غير متوقع في آخر لحظة، أنا في طريقي سريعاً 🏃‍♂️';
      }
    }

    return {
      scenario: 'B',
      detectedLanguage: 'ar',
      spanishReply,
      replyMeaningAr,
      vocabulary: [
        { spanish: isSpain ? 'atasco' : 'tráfico', arabic: 'ازدحام مروري / اختناق سير', tip: 'في مدريد وبرشلونة يقال atasco، وفي باقي الدول tráfico أو trancón' },
        { spanish: isSpain ? 'tardanza' : 'demora', arabic: 'تأخير', tip: 'كلمات طبيعية جداً في الاعتذار العفوي' }
      ],
      culturalTip: 'في الثقافة الإسبانية واللاتينية، إظهار أنك بالفعل في الطريق (voy para allá / ya voy en camino) يخفف جداً من وطأة التأخير.',
      engineUsed: 'smart-engine',
      isAlternative
    };
  }

  // 3. Love / Compliments / Flirting (أحبك / معجب / جميلة / عيونك)
  if (input.includes('أحبك') || input.includes('احبك') || input.includes('معجب') || input.includes('حلوة') || input.includes('جميلة') || input.includes('روعة') || input.includes('قمر')) {
    let spanishReply = '';
    let replyMeaningAr = '';

    if (isAlternative) {
      spanishReply = isSpain
        ? 'No te imaginas lo increíble que me pareces, tienes una sonrisa que enamora ✨'
        : 'No te imaginas lo hermosa que me pareces, tienes una vibra tan linda y especial ✨';
      replyMeaningAr = 'لا تتخيلين كم تبدين مذهلة بالنسبة لي، ابتسامتك تأسر القلوب حقاً ✨';
    } else {
      spanishReply = isSpain
        ? 'La verdad es que cada día me gustas más... Eres una persona muy especial para mí ❤️'
        : 'La neta es que cada día me gustas más... Eres alguien súper especial para mí ❤️';
      replyMeaningAr = 'الحقيقة هي أنكِ تعجبينني أكثر مع كل يوم يمر... أنتِ شخص مميز جداً بالنسبة لي ❤️';
    }

    return {
      scenario: 'B',
      detectedLanguage: 'ar',
      spanishReply,
      replyMeaningAr,
      vocabulary: [
        { spanish: 'me gustas', arabic: 'تعجبني / منجذب إليك', tip: 'تُستعمل للإعجاب الرومانسي، بينما "te quiero" تعني أحبك ومرحلتها أعمق' },
        { spanish: isSpain ? 'la verdad es que' : 'la neta', arabic: 'الحقيقة هي / بصراحة تامة', tip: 'la neta عبارة مكسيكية دارجة للغاية في المحادثات العفوية' }
      ],
      culturalTip: 'التمييز بين "gustar" (إعجاب) و"querer" (حب ودود/عاطفي) و"amar" (حب عميق جداً) ضروري لعدم التسرع في التعبير العاطفي بالإسبانية.',
      engineUsed: 'smart-engine',
      isAlternative
    };
  }

  // 4. Agreement / Good / Glad (جيد / سعيد / اتفق / بالتأكيد)
  if (input.includes('جيد') || input.includes('سعيد') || input.includes('ممتاز') || input.includes('موافق') || input.includes('أكيد') || input.includes('ان شاء الله')) {
    let spanishReply = isSpain
      ? (isAlternative ? '¡Me parece un planazo! Cuenta conmigo sin dudarlo 🙌' : '¡De acuerdo! Me alegro muchísimo, estamos en contacto 🙌')
      : (isAlternative ? '¡Me parece una súper idea! Cuenta conmigo de una 🙌' : '¡Súper bien! Me alegro un montón, seguimos hablando 🙌');
    let replyMeaningAr = isAlternative
      ? 'تبدو لي خطة رائعة جداً! اعتمد عليّ دون تردد 🙌'
      : 'متفقون! يسعدني ذلك كثيراً، سنبقى على تواصل 🙌';

    return {
      scenario: 'B',
      detectedLanguage: 'ar',
      spanishReply,
      replyMeaningAr,
      vocabulary: [
        { spanish: isSpain ? 'planazo' : 'súper idea', arabic: 'خطة رهيبة / فكرة ممتازة', tip: 'اللاحقة -azo في إسبانيا تُضاف للكلمات لتكبير قيمتها وحماسها' },
        { spanish: 'cuenta conmigo', arabic: 'اعتمد عليّ / أنا معك في الأمر', tip: 'تعبير شائع جداً لتأكيد المشاركة في نشاط أو لقاء' }
      ],
      culturalTip: 'استخدام عبارة "Cuenta conmigo" يعطي انطباعاً بالمصداقية والحماس الإيجابي بين الأصدقاء.',
      engineUsed: 'smart-engine',
      isAlternative
    };
  }

  // General Arabic input fallback (Smart contextual translation)
  let generalSpanish = isSpain
    ? '¡Hola! Quería comentarte que todo va genial por aquí. ¿Tú cómo estás?'
    : '¡Hola! Te quería decir que todo va muy bien por acá. ¿Cómo vas tú?';
  let generalMeaning = 'مرحباً! أردت إخبارك أن كل شيء يسير على نحو رائع هنا. كيف حالك أنت؟';

  if (tone === 'flirty') {
    generalSpanish = isSpain
      ? 'Tenía muchas ganas de escribirte y saber cómo estás... Espero que estés teniendo un día precioso ✨'
      : 'Tenía muchas ganas de saludarte y saber de ti... Ojalá estés teniendo un día muy bonito ✨';
    generalMeaning = 'كان لدي شوق كبير لمراسلتك ومعرفة كيف هي أحوالك... أتمنى أن يمر يومك بجمال ولطف ✨';
  } else if (tone === 'formal') {
    generalSpanish = 'Espero que se encuentre muy bien. Me pongo en contacto para darle seguimiento a nuestra conversación.';
    generalMeaning = 'أتمنى أن تكون في أتم الصحة والعافية. أتواصل معك لمتابعة محادثتنا السابقة.';
  }

  return {
    scenario: 'B',
    detectedLanguage: 'ar',
    spanishReply: generalSpanish,
    replyMeaningAr: generalMeaning,
    vocabulary: [
      { spanish: 'tenía ganas de', arabic: 'كان لدي رغبة / اشتياق لـ...', tip: 'تعبير ناعم وودود للتعبير عن الرغبة في القيام بشيء' },
      { spanish: isSpain ? 'precioso' : 'bonito', arabic: 'جميل / رائع', tip: 'صفات شائعة لوصف الأيام والأشياء اللطيفة' }
    ],
    culturalTip: 'في الدردشات الإسبانية واللاتينية، بدء الرسالة بمجاملة دافئة يخلق فوراً جواً من القرب والألفة.',
    engineUsed: 'smart-engine',
    isAlternative
  };
}
