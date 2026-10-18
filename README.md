# HerCare 🌸💜
> **AI-Powered Mental Well-Being Sanctuary & Career / PFE Hub for Young Women in STEM & Higher Education (Tunisia)**

HerCare is a production-ready web and mobile application crafted specifically for female university students and recent graduates in Tunisia (navigating INSAT, ENIT, IHEC, TBS, Faculté de Médecine, and other rigorous academic tracks). It addresses academic pressure, PFE (Projet de Fin d'Études) thesis paralysis, exam panic, and career transition anxiety through zero-guilt wellbeing tools, localized AI companionship, and bilingual support (Tunisian Derja, French, English, and Modern Standard Arabic).

---

## 🌟 Key Features

### 1. Dual Journey Modes
- **University Student Mode**: Tailored for under-graduates and Master/Engineering/PhD students. Focuses on exam revision sprints, PFE milestone tracking, study rhythm, and the Tunis Student Circle.
- **Recent Graduate Mode**: Tailored for young women actively job hunting, preparing for technical interviews, and navigating junior role transition and imposter feelings.

### 2. Gemini Live AI Companion & Safety Shield
- **Multilingual & Derja-Native**: Speaks fluently in Tunisian Derja, French, and English, weaving authentic cultural warmth ("Marhba bik", "Enti 9adaha", "3zizti").
- **Companion Spirit Archetypes**: Choose between *Calming Breeze*, *Cheerful Sun*, *Quiet Stream*, and *Bright Dawn Motivator*, with voice speech synthesis (`speechSynthesis`) dynamically adapting pitch and tone.
- **Direct Voice Input**: Real-time microphone audio recording (`MediaRecorder`) allowing users to speak their heart out directly or select one-tap quick voice prompts.
- **Crisis Safety Net**: Built-in guardrail detecting severe distress and instantly offering confidential Tunisian resources (SAMU 190, Protection Civile 198, SOS Écoute).

### 3. Sanctuary & Wellbeing Tools
- **3-Minute Box Breathing**: Guided visual breathing circle with soothing chime sound effects.
- **CBT Venting Diary**: Unload heavy worries, unpack cognitive distortions, and receive gentle sisterly reframes.
- **Ambient Soundscapes**: Synthesized Mediterranean ocean waves (Sidi Bou Said), Jasmine rain, and warm lo-fi chords.

### 4. Career & PFE Hub
- **Identity Bridge**: Converts rigorous academic coursework and PFE thesis chapters into recruiter-ready CV bullet points without exaggeration.
- **Job Application Tracker**: Organizes job search fatigue into manageable steps.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS (v4), Material Symbols.
- **Backend**: Node.js, Express (`server.ts`).
- **AI Integration**: Google GenAI TypeScript SDK (`@google/genai`) powered by `gemini-3.8-flash`.
- **Audio & Speech**: Web Audio API (synthesized ambient soundscapes and chimes) + Web Speech API & MediaRecorder.

---

## 📁 Project Structure

```text
├── src/
│   ├── components/       # Modular UI screens and modals (Home, Companion, Plan, Sanctuary, Garden)
│   ├── constants/        # Companion options, assets, and themes
│   ├── utils/            # Audio synthesizer, sanctuary logic, pacing calculations
│   ├── App.tsx           # Main application router and state container
│   └── main.tsx          # Application entry point
├── server.ts             # Express backend with Gemini AI & crisis safety guardrails
├── package.json          # Dependencies and scripts
└── README.md             # Project documentation
```

---

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables** (optional for Gemini AI cloud intelligence):
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *(Note: HerCare also features a fully functional offline intelligent sanctuary fallback engine when running without an API key).*

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```
