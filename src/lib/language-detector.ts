import { DetectedLanguage } from '@/types';

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const SPANISH_SPECIAL_CHARS = /[áéíóúüñ¿¡ÁÉÍÓÚÜÑ]/i;

const SPANISH_WORDS = new Set([
  'hola', 'que', 'qué', 'como', 'cómo', 'estas', 'estás', 'bien', 'gracias', 'y', 'tu', 'tú',
  'dia', 'día', 'mi', 'mí', 'amigo', 'amiga', 'bueno', 'buena', 'si', 'sí', 'no', 'por', 'favor',
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'con', 'para', 'estoy', 'tengo', 'hacer', 'voy',
  'donde', 'dónde', 'cuando', 'cuándo', 'guapa', 'guapo', 'te', 'me', 'se', 'nos', 'quiero', 'mucho',
  'vale', 'guay', 'curro', 'tío', 'tía', 'quedamos', 'pasa', 'nada', 'luego', 'tarde', 'noche',
  'estuvo', 'fue', 'genial', 'claro', 'buenos', 'buenas', 'días', 'noches', 'tardes', 'besos'
]);

const ENGLISH_WORDS = new Set([
  'the', 'is', 'are', 'was', 'were', 'tell', 'ask', 'her', 'him', 'she', 'he', 'it', 'what', 'how',
  'where', 'when', 'why', 'can', 'you', 'about', 'say', 'saying', 'talking', 'meet', 'live', 'from',
  'also', 'too', 'good', 'day', 'yes', 'no', 'please', 'thanks', 'want', 'would', 'like', 'should',
  'i', 'me', 'my', 'we', 'they', 'them', 'this', 'that', 'with', 'for', 'have', 'had', 'been',
  'answer', 'reply', 'meaning', 'translate', 'does', 'did', 'love', 'see', 'today', 'tonight'
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

  // If there are Arabic characters
  if (arabicCharCount > 0 && arabicCharCount >= latinCharCount * 0.25) {
    return 'ar';
  }

  // If there are Spanish specific characters (¿, ¡, ñ, etc.)
  if (SPANISH_SPECIAL_CHARS.test(cleaned)) {
    return 'es';
  }

  // Tokenize words
  const words = cleaned.toLowerCase().split(/[^a-zA-Záéíóúüñ]+/);
  let esScore = 0;
  let enScore = 0;

  for (const word of words) {
    if (!word) continue;
    if (SPANISH_WORDS.has(word)) esScore += 2;
    if (ENGLISH_WORDS.has(word)) enScore += 2;
  }

  if (esScore > enScore) return 'es';
  if (enScore > esScore) return 'en';

  // Fallback heuristics: If user wrote in Latin alphabet
  // Many questions like "What does this mean?" or "Tell her..." will match English
  if (/^(tell|ask|what|how|why|i\s|can\s|does|is\s)/i.test(cleaned)) {
    return 'en';
  }

  if (/^(hola|buenas|que\s|cómo\s|estoy|mi\s)/i.test(cleaned)) {
    return 'es';
  }

  return enScore > 0 ? 'en' : 'es';
}

export function isRTL(text: string): boolean {
  return ARABIC_REGEX.test(text);
}
