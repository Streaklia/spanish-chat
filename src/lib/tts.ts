export function speakSpanish(text: string, dialect: 'spain' | 'latam' = 'spain') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95; // Slightly slower for clear language learning comprehension
  utterance.pitch = 1.0;
  utterance.lang = dialect === 'spain' ? 'es-ES' : 'es-MX';

  // Try to find a matching voice
  const voices = window.speechSynthesis.getVoices();
  const targetPrefix = dialect === 'spain' ? 'es-ES' : 'es';
  const matchedVoice = voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(targetPrefix.toLowerCase())) ||
                       voices.find(v => v.lang.toLowerCase().startsWith('es'));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  window.speechSynthesis.speak(utterance);
  return true;
}
