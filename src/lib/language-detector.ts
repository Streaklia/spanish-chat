import { DetectedLanguage } from '@/types';

// Arabic Unicode ranges including Arabic, Arabic Supplement, Presentation Forms
const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

// Spanish specific diacritics and inverted punctuation
const SPANISH_CHARS = /[áéíóúüñ¿¡ÁÉÍÓÚÜÑ]/i;

// Common Spanish words
const SPANISH_COMMON_WORDS = new Set([
  'hola', 'que', 'qué', 'como', 'cómo', 'estas', 'estás', 'bien', 'gracias', 'y', 'tu', 'tú',
  'dia', 'día', 'mi', 'mi', 'amigo', 'amiga', 'bueno', 'buena', 'si', 'sí', 'no', 'por', 'favor',
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'con', 'para', 'estoy', 'tengo', 'hacer', 'voy',
  'donde', 'dónde', 'cuando', 'cuándo', 'guapa', 'guapo', 'te', 'me', 'se', 'nos', 'quiero', 'mucho'
]);

export function detectLanguage(text: string): DetectedLanguage {
  if (!text || !text.trim()) return 'unknown';

  const cleaned = text.trim();
  let arabicCharCount = 0;
  let latinCharCount = 0;

  for (const char of cleaned) {
    if (ARABIC_REGEX.test(char)) {
      arabicCharCount++;
    } else if (/[a-zA-Záéíóúüñ¿¡ÁÉÍÓÚÜÑ]/.test(char)) {
      latinCharCount++;
    }
  }

  // If there are Arabic characters and they constitute a significant portion
  if (arabicCharCount > 0 && arabicCharCount >= latinCharCount * 0.3) {
    return 'ar';
  }

  // Check for Spanish diacritics
  if (SPANISH_CHARS.test(cleaned)) {
    return 'es';
  }

  // Check common Spanish words
  const words = cleaned.toLowerCase().split(/[\s,?.!¡¿]+/);
  let spanishWordHits = 0;
  for (const word of words) {
    if (SPANISH_COMMON_WORDS.has(word)) {
      spanishWordHits++;
    }
  }

  if (spanishWordHits > 0 || latinCharCount > 0) {
    return 'es';
  }

  return arabicCharCount > 0 ? 'ar' : 'es';
}

export function isRTL(text: string): boolean {
  return ARABIC_REGEX.test(text);
}
