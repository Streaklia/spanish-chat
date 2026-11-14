# ChatBridge ES-AR 🇪🇸 ⇄ 🇦🇪

An AI-powered Spanish ↔ Arabic live chat assistant and passive language-learning Progressive Web App (PWA) designed specifically for Arabic speakers chatting with Spanish speakers on WhatsApp and Instagram.

---

## 🌟 Key Features

### 1. Smart Dual-Mode Detection
- **Scenario A — Incoming Spanish Message ("They said..."):**
  - **What They Said (in Arabic):** Accurate, natural Arabic translation with `dir="rtl"`.
  - **Suggested Reply (in Spanish):** Native-sounding Spanish reply tailored to conversation context, selected dialect, and chosen tone.
  - **Pronunciation Preview (TTS):** Tap to listen to native Spanish audio pronunciation before sending.
  - **Meaning of Your Reply (in Arabic):** Exact Arabic translation of the suggested Spanish reply for 100% confidence.
  - **Mini Vocabulary Breakdown:** 1 to 3 key Spanish words or phrases with Arabic meanings and grammar/learning tips.
- **Scenario B — Custom Arabic Reply ("I want to say..."):**
  - **Natural Spanish Translation:** How a real native texts on WhatsApp/Instagram (never stiff textbook translations).
  - **Exact Meaning Check (in Arabic):** Confirmation of the precise nuance conveyed.
  - **Mini Vocabulary Breakdown:** Key expressions explained in Arabic.
- **Scenario C — Quick Alternative Option:**
  - One-tap **"خيار آخر (Another Option)"** button on every response card to generate alternative phrasing instantly without re-typing.

### 2. Multi-Contact Chat Threads & Memory
- Create, rename, switch between, and delete separate chat threads saved locally in the browser (e.g. "Madrid Coworker", "Instagram Crush").
- Per-contact **Context Note** (specifying gender, relationship type, location) so the AI maintains proper Spanish gender agreement (`cansado` vs `cansada`, `guapo` vs `guapa`) and remembers conversational history.
- Context memory: sends the last 12 messages with every prompt.

### 3. Dual AI Engine with Automatic Fallback
- **Primary Engine:** Google Gemini (Fast & Free).
- **Secondary Engine:** OpenRouter.
- **Smart Local Fallback Engine:** Automatic seamless fallback if API limits or authentication issues occur, ensuring 0% downtime and instant high-quality responses.
- Optional API key manager in settings to customize or test personal keys.

### 4. Spanish Dialect & Tone Control
- **Dialects:**
  - 🇪🇸 **Spain (Castellano):** Uses *vosotros*, peninsular slang (*guay*, *curro*, *tío/tía*, *me flipa*, *atasco*).
  - 🌎 **Latin America:** Uses *ustedes*, LatAm slang (*chévere*, *genial*, *onda*, *tráfico*).
- **Tones:**
  - 😎 **Casual:** WhatsApp/IG texting style, punchy emojis, informal phrasing.
  - 😊 **Friendly:** Warm, engaging, supportive.
  - 💖 **Romantic / Flirty:** Sweet, playful, charming, respecting gender agreement.
  - 👔 **Formal / Polite:** Courteous, respectful, using *usted* where appropriate.

### 5. Mobile-First & PWA (Progressive Web App)
- Works offline and can be installed to home screens on iOS (Safari: Share ➔ Add to Home Screen) and Android (Chrome: Install App).
- One-tap **Paste** button for copying directly from WhatsApp/Instagram.
- One-tap **Copy Spanish** button with visual feedback.
- Clean typography: Cairo Arabic font for RTL and Inter for LTR.
- Dark & Light mode toggle.

---

## 🔒 Security & Environment Variables

API keys are strictly managed on the server side:

```env
# .env.local (Ignored by Git)
OPENROUTER_API_KEY=your_openrouter_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

All AI requests flow through the server-side endpoint `/api/chat` so keys are never exposed to the client.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```
