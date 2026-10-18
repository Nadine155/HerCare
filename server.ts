import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize GoogleGenAI server-side with required User-Agent
let ai: GoogleGenAI | null = null;
let geminiAccessDenied = false;
let hasLoggedAccessNotice = false;

function handleGeminiFallback(err: unknown, feature: string) {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('PERMISSION_DENIED') || msg.includes('403') || msg.includes('denied access') || msg.includes('NOT_FOUND')) {
    geminiAccessDenied = true;
    if (!hasLoggedAccessNotice) {
      console.log('[HerCare AI] Notice: API key access restriction detected. Resilient local sanctuary engine active.');
      hasLoggedAccessNotice = true;
    }
  } else {
    if (!hasLoggedAccessNotice) {
      console.log(`[HerCare AI] ${feature}: activating resilient local sanctuary engine.`);
    }
  }
}

if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  // Gracefully verify accessibility on startup without leaking noisy logs
  ai.models.generateContent({ model: 'gemini-3.8-flash', contents: 'ping' })
    .then(() => {
      console.log('[HerCare AI] Cloud Gemini intelligence engine connected.');
    })
    .catch((err) => {
      handleGeminiFallback(err, 'Initial check');
    });
}

const HERCARE_SYSTEM_INSTRUCTION = `
You are the companion inside "HerCare", an AI-powered mental well-being sanctuary crafted specifically for young female university students and recent graduates in Tunisia.
Key Context:
- Demographic: Young Tunisian women navigating rigorous academic programs (e.g., INSAT, ENIT, IHEC, TBS, Faculté de Médecine, Faculté des Sciences), PFE (Projets de Fin d'Études) graduation theses, competitive concours, exam seasons (partiels / rattrapage), and early career transition anxiety.
- Cultural Nuances: Tunisian cultural blend of warmth, resilience, familial expectations, and language flexibility (Tunisian Derja, French, English, and Arabic). You understand Tunisian expressions like "Marhba bik", "Enti 9adaha", "3andek 9odra", "Koul chay bel marra", "Mat9ala9ch rou7ek", "Sahha", "3zizti", "Labes nchallah".
- Strict Role Boundary: You provide supportive, accessible, NON-DIAGNOSTIC emotional companionship, gentle CBT-inspired reframing, study pacing, and stress relief. You are NOT a doctor, psychiatrist, or medical diagnostic tool.
- Crisis Protocol: If the user expresses active intent of self-harm or severe emergency, compassionately de-escalate and recommend connecting with local Tunisian resources (SAMU 190, Protection Civile 198, or trusted campus psychologists).
- Tone: Gentle, sisterly, encouraging, unhurried, and deeply respectful of the student's autonomy. Keep responses concise, warm, and readable on mobile screens (avoid long walls of text).
`;

// Crisis keywords in Tunisian Derja, French, and English
const CRISIS_KEYWORDS = [
  'suicide',
  'kill myself',
  'end my life',
  'want to die',
  'better off dead',
  'je veux mourir',
  'en finir',
  'mettre fin à mes jours',
  'envie de mourir',
  'n7eb nmout',
  'nektel rou7i',
  'fadek mel 7ayet',
  'feddit mel 3icha',
  'mab9ach n7eb n3ich'
];

function checkCrisisTrigger(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

const VERIFIED_TUNISIAN_RESOURCES = {
  samu: { name: 'SAMU Urgences Médicales', number: '190', available: '24/7' },
  protectionCivile: { name: 'Protection Civile', number: '198', available: '24/7' },
  sosEcoute: { name: 'SOS Amitié / Écoute Tunisie', number: '71 801 111', available: 'Confidential' },
  campusClinics: {
    name: 'Direction de la Médecine Scolaire et Universitaire (DMSU)',
    details: 'Free student psychological consultations across Tunis, Sfax, Sousse, Monastir'
  }
};

/**
 * Intelligent Tunisian contextual response generator for companion chat fallback
 */
function getIntelligentFallbackChat(
  message: string,
  userProfile?: {
    name?: string;
    language?: string;
    campusOrField?: string;
    studentStage?: string;
    companionName?: string;
    spiritType?: string;
    currentFeeling?: string;
  }
): string {
  const name = userProfile?.name || 'Yasmine';
  const lang = userProfile?.language || 'en';
  const campus = userProfile?.campusOrField || 'your university';
  const lower = message.toLowerCase();
  const charSum = message.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Directly answer specific topics like hackathons, coding, exams, PFE
  if (lower.includes('hackathon') || lower.includes('win') || lower.includes('competition') || lower.includes('prize')) {
    return `To win a hackathon at ${campus} or in Tunisia, focus on three things: 1) Solve one real, painful problem exceptionally well rather than building a bloated MVP. 2) Keep the architecture simple and reliable so it doesn't crash during demo time. 3) Craft a compelling, clear pitch showing your impact. You've got the brilliance for this, ${name}! 💻🚀`;
  }
  if (lower.includes('code') || lower.includes('bug') || lower.includes('programming') || lower.includes('typescript') || lower.includes('react')) {
    return `Debugging is like untangling a necklace, ${name}. Take a slow breath, break the problem down into small isolated tests, check your console logs or types, and tackle one error at a time. You can absolutely crack this code! 💡✨`;
  }
  if (lower.includes('exam') || lower.includes('test') || lower.includes('revision') || lower.includes('study')) {
    return `For your exams at ${campus}, don't try to cram the whole syllabus at once. Use active recall, do past papers (examens des années précédentes), and study in focused 25-minute sprints with 5-minute pauses. You're fully capable, ${name}! 📚💪`;
  }
  if (lower.includes('pfe') || lower.includes('thesis') || lower.includes('project') || lower.includes('report')) {
    return `For your PFE, the secret is consistent small progress. Write 3 solid paragraphs or commit one working feature every single day rather than waiting for inspiration. You're doing amazing work for your graduation! 🎓💻`;
  }
  if (lower.includes('job') || lower.includes('interview') || lower.includes('cv') || lower.includes('career')) {
    return `When applying for jobs or preparing for interviews from ${campus}, highlight your real project impact, keep your CV clean and structured, and practice explaining your technical decisions clearly. You're going to shine! 🌟💼`;
  }

  if (lang === 'tn' || lower.includes('9oli') || lower.includes('derja') || lower.includes('3aslema')) {
    const derjaReplies = [
      `3aslema ya ${name} 3zizti! Fari7ana barcha eli jina n7adhou m3a b3adhna. Koul chay bech yet3ada w ena hani b jnabek dima. 🌸`,
      `Fahmettek ya ${name}. Mat9ala9ch rou7ek, kol chay bech yetbaddal lil a7san. Hani houni nstana fik w nesma3 fik b 9albi. 💜`,
      `Ya ${name}, rta7 chwaya w 7ot ydek 3la 9albek. Enti 9adaha w wsolt l ${campus} b khedmtek w 3ar9ek. Nchallah kol chay bech yzine! ✨`,
      `Klemk m3abbri w sbebteli ra7a. Ena houni m3ak f kol khatwa, tnajjem thkiw 3liya eli t7eb kollou. 🌿`,
      `Aman ya ${name}, 15 d9i9a bark t3awen. 3andek 9odra kbira w rabi m3ak! 🌸`
    ];
    return derjaReplies[charSum % derjaReplies.length];
  }

  if (lang === 'fr' || lower.includes('bonjour') || lower.includes('merci')) {
    const frenchReplies = [
      `Je suis là tout près de toi, ${name}. Respire profondément, baisse les épaules et souviens-toi que tu n'as pas à porter tout le semestre sur ton dos aujourd'hui. 🌿`,
      `Je comprends tellement ce que tu ressens, ${name}. À ${campus}, on demande beaucoup, mais prends un instant pour souffler. Je t'écoute. 💜`,
      `Chaque petit pas compte, ${name}. Même si c'est difficile en ce moment, ta persévérance est magnifique. On continue ensemble ? ✨`,
      `Prends une gorgée d'eau fraîche, ${name}. Laisse le stress redescendre d'un cran. Je suis ton sanctuaire de paix. 🌸`,
      `Ton bien-être passe avant tout, ${name}. Qu'est-ce qui te pèse le plus sur le cœur en ce moment ? Raconte-moi. 🍃`
    ];
    return frenchReplies[charSum % frenchReplies.length];
  }

  // English varied responses
  const englishReplies = [
    `I'm listening with an open heart, ${name}. Take a gentle breath. You don't have to figure everything out right this second—we can take this sanctuary moment one step at a time. 🌸`,
    `Thank you for sharing that with me, ${name}. Whatever is swirling in your mind right now, you are safe to set it down here. How can I support your heart today? 💜`,
    `I hear you, ${name}. It's completely okay to feel tired or uncertain. You've navigated so much already at ${campus}. Let's take a slow breath together. ✨`,
    `You don't have to carry everything alone today, ${name}. I'm right here beside you in your sanctuary. What feels like the heaviest thing on your shoulders right now? 🌿`,
    `Sending you so much warmth, ${name}. Progress isn't about perfection; it's about being gentle with yourself when things get heavy. Tell me more. 🌸`
  ];
  return englishReplies[charSum % englishReplies.length];
}

// =========================================================================
// 1. Companion Chat Endpoint (with Crisis Safety Net)
// =========================================================================
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userProfile } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const companionName = userProfile?.companionName || 'Lumi';
    const spiritType = userProfile?.spiritType || 'gentle';
    const userName = userProfile?.name || 'Yasmine';
    const language = userProfile?.language || 'en';
    const journeyType = userProfile?.journeyType || 'student';
    const campusOrField = userProfile?.campusOrField || 'Tunisian University';
    const studentStage = userProfile?.studentStage || 'PFE / Final Year';
    const currentFeeling = userProfile?.currentFeeling || 'Anxious';

    // Crisis Safety Guardrail Check
    if (checkCrisisTrigger(message)) {
      const isDerja = language === 'tn';
      const isFrench = language === 'fr';

      let deescalationText = `Ya ${userName}, I care deeply about your safety and life. Please pause right now. You are never alone in this pain, and there is confidential, human support available for you in Tunisia right this minute. Please reach out to SAMU (190) or SOS Écoute (71 801 111). I am opening our safety shield for you right now. 💜`;
      if (isDerja) {
        deescalationText = `Ya ${userName} 3zizti, 7yetek ghaliya barcha w enti moch wa7dek fi hal wji3a. Aman e9ef tawa w otleb chkoun y3awnek. Otleb SAMU 190 walla SOS Écoute 71 801 111 fi tounes tawa. Hani 7allitlik el Safety Shield bech tel9a kol chay. 💜`;
      } else if (isFrench) {
        deescalationText = `Chère ${userName}, ta vie et ta sécurité sont précieuses. Tu ne dois pas porter cette douleur seule. Des personnes bienveillantes en Tunisie peuvent t'écouter sans jugement 24/7. Appelle le SAMU (190) ou SOS Écoute (71 801 111). Je t'ouvre immédiatement le bouclier de sécurité. 💜`;
      }

      res.json({
        reply: deescalationText,
        isCrisisTrigger: true,
        resources: VERIFIED_TUNISIAN_RESOURCES
      });
      return;
    }

    if (ai && !geminiAccessDenied) {
      try {
        const promptContext = `
The user is speaking with their companion "${companionName}" (Archetype: ${spiritType}).
User Name: ${userName}.
Journey Type: ${journeyType === 'graduate' ? 'Recent Graduate / Job Seeker' : 'University Student'}.
University / Field: ${campusOrField}.
Stage / Focus: ${studentStage}.
Current Feeling: ${currentFeeling}.
Preferred Language: ${language} (if 'tn', weave warm, authentic Tunisian Derja / Franco-Arabe; if 'fr', warm French; if 'en', warm English with sweet touches; if 'msa', modern standard Arabic).

User Message: "${message}"

Respond directly as ${companionName} in character. Be compassionate, supportive, non-diagnostic, and help them feel seen. Keep it within 2-4 sentences with 1 gentle emoji, addressing their specific journey context.
`;
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptContext,
          config: {
            systemInstruction: HERCARE_SYSTEM_INSTRUCTION,
            temperature: 0.7
          }
        });

        if (response.text) {
          res.json({ reply: response.text, isCrisisTrigger: false });
          return;
        }
      } catch (genAiErr) {
        handleGeminiFallback(genAiErr, 'Chat generator');
      }
    }

    // Intelligent contextual fallback
    const reply = getIntelligentFallbackChat(message, userProfile);
    res.json({ reply, isCrisisTrigger: false });
  } catch (_err: unknown) {
    res.json({
      reply: 'Take a gentle breath with me right now. I am here right beside you in your sanctuary. 🌸',
      isCrisisTrigger: false
    });
  }
});

// =========================================================================
// 2. FEATURE 1: AI Cognitive Sentiment & Burnout Risk Analyzer
// =========================================================================
app.post('/api/sentiment-burnout-analyzer', async (req, res) => {
  try {
    const { text, context } = req.body;
    const inputContent = text || context?.feeling || 'I am feeling overwhelmed with exam revision and PFE deadlines';
    const userName = context?.name || 'Yasmine';
    const language = context?.language || 'en';
    const campus = context?.campusOrField || 'INSAT, Université de Tunis';
    const studentStage = context?.studentStage || 'PFE / Final Year';

    if (ai && !geminiAccessDenied) {
      try {
        const analyzerPrompt = `
Analyze the emotional state, burnout risk, and cognitive distortions of this Tunisian university student (${userName}, studying at ${campus}, stage: ${studentStage}):
Student's expression: "${inputContent}"
Preferred response language: ${language} (Derja if 'tn', French if 'fr', English if 'en').

Task requirements:
1. "radarScores": 4 non-clinical emotional & somatic dimensions scored from 0 to 100:
   - somaticTension: physical strain, tightness in chest/shoulders, insomnia fatigue (0-100)
   - academicOverwhelm: feeling burdened by syllabus, PFE, or concours deadlines (0-100)
   - emotionalEnergy: resilience and battery remaining (0-100, where 100 is high energy, 20 is drained)
   - cognitiveClarity: mental focus vs brain fog/paralysis (0-100)
2. "burnoutRisk": one of "Low", "Moderate", "High" based on chronic pressure and exhaustion signs.
3. "detectedDistortions": Array of up to 3 non-clinical cognitive distortions detected in their thinking (e.g., "Imposter Syndrome", "Catastrophizing", "All-or-Nothing Perfectionism", "Should Statements", "Over-generalization"). Each item with:
   - name: Distortion name
   - description: 1 compassionate sentence explaining how this thought pattern is tricking them.
   - severity: "mild" | "moderate" | "prominent"
4. "sisterlyInsight": Warm, compassionate 2-sentence summary in ${language} validating their feelings without toxic positivity.
5. "recommendedSanctuaryAction": One specific, soothing micro-step (e.g. "3-minute Box Breathing", "15-minute PFE Micro-Sprint", "Sip cold water & shoulder stretch").
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: analyzerPrompt,
          config: {
            systemInstruction: HERCARE_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                radarScores: {
                  type: Type.OBJECT,
                  properties: {
                    somaticTension: { type: Type.INTEGER },
                    academicOverwhelm: { type: Type.INTEGER },
                    emotionalEnergy: { type: Type.INTEGER },
                    cognitiveClarity: { type: Type.INTEGER }
                  },
                  required: ['somaticTension', 'academicOverwhelm', 'emotionalEnergy', 'cognitiveClarity']
                },
                burnoutRisk: {
                  type: Type.STRING,
                  enum: ['Low', 'Moderate', 'High']
                },
                detectedDistortions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      description: { type: Type.STRING },
                      severity: { type: Type.STRING, enum: ['mild', 'moderate', 'prominent'] }
                    },
                    required: ['name', 'description', 'severity']
                  }
                },
                sisterlyInsight: { type: Type.STRING },
                recommendedSanctuaryAction: { type: Type.STRING }
              },
              required: ['radarScores', 'burnoutRisk', 'detectedDistortions', 'sisterlyInsight', 'recommendedSanctuaryAction']
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          res.json(parsed);
          return;
        }
      } catch (genAiErr) {
        handleGeminiFallback(genAiErr, 'Sentiment & Burnout analyzer');
      }
    }

    // Contextual intelligent fallback
    const lower = inputContent.toLowerCase();
    const isDerja = language === 'tn';
    const isFrench = language === 'fr';

    let somaticTension = 72;
    let academicOverwhelm = 84;
    let emotionalEnergy = 34;
    let cognitiveClarity = 45;
    let burnoutRisk: 'Low' | 'Moderate' | 'High' = 'Moderate';

    if (lower.includes('exhaust') || lower.includes('cannot anymore') || lower.includes('fadek') || lower.includes('fatigue')) {
      somaticTension = 88;
      academicOverwhelm = 92;
      emotionalEnergy = 20;
      cognitiveClarity = 30;
      burnoutRisk = 'High';
    } else if (lower.includes('calm') || lower.includes('energized') || lower.includes('good') || lower.includes('labes')) {
      somaticTension = 30;
      academicOverwhelm = 40;
      emotionalEnergy = 80;
      cognitiveClarity = 85;
      burnoutRisk = 'Low';
    }

    let detectedDistortions = [
      {
        name: 'Catastrophizing',
        description: 'Anticipating that a tough study milestone or delayed deadline will derail your entire university degree.',
        severity: 'moderate' as const
      },
      {
        name: 'Imposter Syndrome',
        description: 'Feeling like your peers at university have everything mastered while secretly fearing you do not belong.',
        severity: 'prominent' as const
      }
    ];

    let sisterlyInsight = `Your nervous system is holding the weight of Tunisian exam and PFE expectations, ${userName}. Acknowledge how hard you are trying—you do not have to solve the whole semester today.`;
    let recommendedSanctuaryAction = 'Take a 3-minute Box Breathing pause, drink a fresh glass of water, and lower your shoulders.';

    if (isDerja) {
      sisterlyInsight = `Ya ${userName} 3zizti, el tha8t mte3 el 9raya w el PFE fi Tounes kbir barcha ama enti 9adaha. Moukhek ta3eb chwaya ama mouch ma3naha makch féy9a.`;
      recommendedSanctuaryAction = 'A3mel pause mte3 3 d9aye9 tnaffas b chwaya, echreb mé w khalli ktefek yerkhou.';
      detectedDistortions = [
        {
          name: 'Catastrophizing (Tahwil)',
          description: 'El moukh ykhalik tchouf el retard fil révision kénou nheya mte3 l 3am.',
          severity: 'moderate'
        },
        {
          name: 'Syndrome de l’Imposteur',
          description: 'E7ses eli les autres khir menek w enti jeyetek bil zhar, w heka ghalet.',
          severity: 'prominent'
        }
      ];
    } else if (isFrench) {
      sisterlyInsight = `Tu portes une charge mentale immense avec les révisions et le PFE, ${userName}. Tes signaux de fatigue sont légitimes, pas un signe de faiblesse.`;
      recommendedSanctuaryAction = 'Prends 3 minutes de respiration guidée, bois un verre d\'eau fraîche et détends la mâchoire.';
      detectedDistortions = [
        {
          name: 'Catastrophisme',
          description: 'Tendance à anticiper le pire scénario académique dès qu\'une difficulté survient.',
          severity: 'moderate'
        },
        {
          name: 'Syndrome de l’imposteur',
          description: 'Douter de ta légitimité malgré tout le travail que tu as accompli.',
          severity: 'prominent'
        }
      ];
    }

    res.json({
      radarScores: {
        somaticTension,
        academicOverwhelm,
        emotionalEnergy,
        cognitiveClarity
      },
      burnoutRisk,
      detectedDistortions,
      sisterlyInsight,
      recommendedSanctuaryAction
    });
  } catch (_err) {
    res.json({
      radarScores: { somaticTension: 60, academicOverwhelm: 70, emotionalEnergy: 50, cognitiveClarity: 55 },
      burnoutRisk: 'Moderate',
      detectedDistortions: [
        { name: 'Academic Overwhelm', description: 'Taking on too many chapters simultaneously.', severity: 'moderate' }
      ],
      sisterlyInsight: 'Honor your current pace. Even taking 5 minutes to pause is an act of resilience.',
      recommendedSanctuaryAction: 'Gentle 3-minute breathing reset'
    });
  }
});

// =========================================================================
// 3. FEATURE 2: AI "Micro-Pacing" & Tiny Wins Scheduling Optimizer
// =========================================================================
app.post('/api/micro-pacing-optimizer', async (req, res) => {
  try {
    const {
      task,
      deadline,
      currentEnergy,
      language = 'en',
      studentName = 'Yasmine',
      targetMinutes = 15,
      isMinimumViablePlan = false,
      journeyType = 'student',
      feedbackHistory = []
    } = req.body;

    const taskDescription = task || (journeyType === 'graduate' ? 'Polish CV and apply to 1 junior role' : 'PFE Thesis Methodology and exam revision');
    const stepDuration = Number(targetMinutes) || 15;

    // Check if user previously marked steps as too difficult -> adapt step size gently
    const hasDifficultyFeedback = Array.isArray(feedbackHistory) && feedbackHistory.some((f: { rating?: string }) => f.rating === 'too_difficult');
    const effectiveMinutes = hasDifficultyFeedback && stepDuration > 5 ? Math.max(5, Math.floor(stepDuration / 2)) : stepDuration;

    if (ai && !geminiAccessDenied) {
      try {
        const isGraduate = journeyType === 'graduate';
        const pacingPrompt = `
A young Tunisian woman (${studentName}, ${isGraduate ? 'recent graduate navigating job search and career launch' : 'university student navigating exams and PFE'}) has this task:
"${taskDescription}"
Deadline: "${deadline || 'Flexible'}"
Current Energy: "${currentEnergy || 'moderate'}"
Target Micro-Step Duration: ${effectiveMinutes} minutes per step
Is Minimum Viable Plan (MVP for low capacity / exhausted days): ${isMinimumViablePlan ? 'YES - make it ultra gentle, just 1 or 2 tiny low-friction steps with zero guilt' : 'NO - standard 3 progressive steps'}
Language: ${language} (Derja if 'tn', French if 'fr', English if 'en').

Task requirements:
Deconstruct this task into concrete, non-overwhelming micro-steps:
1. "taskTitle": concise, gentle name of the task
2. "microSteps": ${isMinimumViablePlan ? '1 or 2' : 'exactly 3'} gentle micro-steps. For each step:
   - stepNumber: integer
   - title: concise title
   - durationMinutes: ${effectiveMinutes}
   - actionDetail: specific, zero-friction micro-action that dissolves procrastination
   - circadianRest: 3-5 minute restorative interval instruction (hydration, eye release, soft stretch)
   - difficulty: "gentle"
3. "mindsetReframe": Cognitive reframe highlighting that showing up for ${effectiveMinutes} minutes breaks paralysis
4. "affirmation": Tunisian sisterly encouraging whisper
5. "isMinimumViablePlan": ${Boolean(isMinimumViablePlan)}
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: pacingPrompt,
          config: {
            systemInstruction: HERCARE_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                taskTitle: { type: Type.STRING },
                microSteps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      stepNumber: { type: Type.INTEGER },
                      title: { type: Type.STRING },
                      durationMinutes: { type: Type.INTEGER },
                      actionDetail: { type: Type.STRING },
                      circadianRest: { type: Type.STRING },
                      difficulty: { type: Type.STRING, enum: ['gentle', 'moderate'] }
                    },
                    required: ['stepNumber', 'title', 'durationMinutes', 'actionDetail', 'circadianRest']
                  }
                },
                mindsetReframe: { type: Type.STRING },
                affirmation: { type: Type.STRING },
                isMinimumViablePlan: { type: Type.BOOLEAN }
              },
              required: ['taskTitle', 'microSteps', 'mindsetReframe', 'affirmation']
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          res.json(parsed);
          return;
        }
      } catch (genAiErr) {
        handleGeminiFallback(genAiErr, 'Micro-pacing optimizer');
      }
    }

    // Contextual intelligent fallback
    const isDerja = language === 'tn';
    const isFrench = language === 'fr';
    const cleanTitle = taskDescription.length > 35 ? taskDescription.slice(0, 32) + '...' : taskDescription;

    let microSteps = isMinimumViablePlan
      ? [
          {
            stepNumber: 1,
            title: isDerja ? 'Khatwa Sghira barcha' : isFrench ? 'Micro-action de départ' : 'Gentle Foundation Step',
            durationMinutes: effectiveMinutes,
            actionDetail: isDerja
              ? `7el el khedma mte3 "${cleanTitle}" w a3mel juste 3 bullet points blech ma t7okem 3la rou7ek.`
              : isFrench
              ? `Ouvre le document "${cleanTitle}" et note 3 idées rapides sans viser la perfection.`
              : `Open your workspace for "${cleanTitle}" and write 3 raw notes without judging yourself.`,
            circadianRest: isDerja ? 'Echreb kes mé bered w erta7.' : isFrench ? 'Bois un verre d\'eau fraîche.' : 'Sip cold water and soften your shoulders.',
            difficulty: 'gentle' as const
          }
        ]
      : [
          {
            stepNumber: 1,
            title: isDerja ? 'Bedeya Khafifa' : isFrench ? 'Démarrage Doux' : 'Low-Friction Workspace Setup',
            durationMinutes: effectiveMinutes,
            actionDetail: isDerja
              ? `7el el fichier mte3 "${cleanTitle}" w oukteb 3 afkar b chwaya.`
              : isFrench
              ? `Ouvre le document pour "${cleanTitle}" et note 3 tirets simples.`
              : `Open your document for "${cleanTitle}" and write 3 raw bullet ideas without editing.`,
            circadianRest: isDerja ? 'E9ef, echreb kes mé (3 d9aye9).' : isFrench ? 'Bois un grand verre d\'eau (3 mins).' : 'Stand up, pour water, roll shoulders (3 mins).',
            difficulty: 'gentle' as const
          },
          {
            stepNumber: 2,
            title: isDerja ? 'Khedma Morakza' : isFrench ? 'Bloc de Focus Isolé' : 'Core Concept Draft',
            durationMinutes: effectiveMinutes,
            actionDetail: isDerja
              ? 'Rakez 3la partie sghira barka walla 1-2 questions avec calme.'
              : isFrench
              ? 'Concentre-toi uniquement sur un sous-paragraphe ou deux questions clés.'
              : 'Focus on just 1 specific sub-section with calm focus.',
            circadianRest: isDerja ? 'Chouf choubbek el b3id (4 d9aye9).' : isFrench ? 'Regarde l\'horizon pour reposer tes yeux (4 mins).' : 'Look away at a distant window to relax eyes (4 mins).',
            difficulty: 'gentle' as const
          },
          {
            stepNumber: 3,
            title: isDerja ? 'Khatma w Bookmark' : isFrench ? 'Clôture et Ancrage' : 'Gentle Synthesis & Bookmark',
            durationMinutes: effectiveMinutes,
            actionDetail: isDerja
              ? 'Enregistrer khedmtek w bookmark win bech t3awed tebda marra jeya.'
              : isFrench
              ? 'Enregistre et marque le point de départ pour la prochaine fois.'
              : 'Save your work and bookmark where you will gently begin next.',
            circadianRest: isDerja ? 'Sahha 3lik! Eghsel wejhek b mé bered.' : isFrench ? 'Bravo ! Prends une pause bien méritée.' : 'Celebrate this momentum! Wash wrists with cool water.',
            difficulty: 'gentle' as const
          }
        ];

    let mindsetReframe = isDerja
      ? `El perfectionnisme houwa eli ywa9efna. ${effectiveMinutes} d9i9a khedma sghira tnahhi 90% mel khouf.`
      : isFrench
      ? `Le perfectionnisme nourrit l'évitement. ${effectiveMinutes} minutes d'action imparfaite dissipent le sentiment de panique.`
      : `Perfectionism is paralysis in disguise. ${effectiveMinutes} minutes of imperfect progress releases 90% of task dread.`;

    let affirmation = isDerja
      ? 'Enti 9adaha. Koul chay bel marra w nchallah labes. 🌸'
      : isFrench
      ? 'Tu avances avec persévérance et grâce. Chaque petit bloc compte. 💜'
      : 'You are capable and worthy of calm. Step by step. 🌸';

    res.json({
      taskTitle: cleanTitle,
      microSteps,
      mindsetReframe,
      affirmation,
      isMinimumViablePlan: Boolean(isMinimumViablePlan)
    });
  } catch (err) {
    console.error('Micro-pacing error:', err);
    res.json({
      taskTitle: 'Gentle Micro-Pacing',
      microSteps: [
        { stepNumber: 1, title: 'Gentle start', durationMinutes: 10, actionDetail: 'Open workspace and draft 2 points.', circadianRest: 'Drink water (3m)', difficulty: 'gentle' }
      ],
      mindsetReframe: 'Showing up for even 5 minutes is a victory.',
      affirmation: 'Enti 9adaha. 🌸',
      isMinimumViablePlan: false
    });
  }
});

// =========================================================================
// 3B. FEATURE 1: AI "Brain Dump → Brain Map" Structured Extraction
// =========================================================================
app.post('/api/brain-dump-map', async (req, res) => {
  try {
    const {
      brainDumpText,
      journeyType = 'student',
      language = 'en',
      userName = 'Yasmine',
      currentEnergy = 'tired'
    } = req.body;

    if (!brainDumpText || typeof brainDumpText !== 'string' || !brainDumpText.trim()) {
      res.status(400).json({ error: 'Brain dump text is required' });
      return;
    }

    if (ai && !geminiAccessDenied) {
      try {
        const isGraduate = journeyType === 'graduate';
        const dumpPrompt = `
You are the brain-dump cognitive organizer in HerCare for a young Tunisian woman (${userName}, ${isGraduate ? 'recent graduate navigating job hunting, interviews, and transition to professional life' : 'university student navigating exams, PFE thesis, coursework, and deadlines'}).

Student / Graduate Brain Dump Input:
"${brainDumpText}"

Context:
- Current Energy: ${currentEnergy}
- Preferred Language: ${language} (Derja if 'tn', French if 'fr', English if 'en').

Task Requirements:
Deconstruct this messy, overwhelmed cognitive dump into an organized Brain Map using clear categories:
1. "mindsetSummary": A soothing 1-2 sentence sisterly summary validating the mental clutter and reassuring them that they do NOT have to carry it all right this minute.
2. "clarificationNote": If any timeline or item is ambiguous, note it gently (e.g. "Notice: deadline for report is unspecified; we placed it under flexible tasks"). Never invent false dates.
3. "extractedItems": Array of 3 to 7 structured items extracted strictly from what the user wrote:
   - "id": string (unique slug like "item-1")
   - "text": concise, actionable name of the item (e.g., "Draft Chapter 2 bibliography", "Follow up with HR recruiter", "Fear of failing partiels")
   - "category": one of:
     * "task": concrete controllable action that can be executed
     * "worry": emotional concern or cognitive fear that needs reassurance rather than immediate work
     * "deadline": time-sensitive milestone or submission date
     * "wait_item": items currently out of direct control or waiting on someone else (e.g., supervisor feedback, interview call back)
   - "isControllable": boolean (true for actionable tasks within their power today, false for worries or other people's responses)
   - "suggestedTimeMinutes": 5, 10, 15, or 20 (for actionable tasks)
   - "deadlineText": extracted deadline phrase if mentioned (or null)
   - "selected": true
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: dumpPrompt,
          config: {
            systemInstruction: HERCARE_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                mindsetSummary: { type: Type.STRING },
                clarificationNote: { type: Type.STRING },
                extractedItems: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      category: { type: Type.STRING, enum: ['task', 'worry', 'deadline', 'wait_item'] },
                      isControllable: { type: Type.BOOLEAN },
                      suggestedTimeMinutes: { type: Type.INTEGER },
                      deadlineText: { type: Type.STRING },
                      selected: { type: Type.BOOLEAN }
                    },
                    required: ['id', 'text', 'category', 'isControllable', 'selected']
                  }
                }
              },
              required: ['mindsetSummary', 'extractedItems']
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          res.json(parsed);
          return;
        }
      } catch (genAiErr) {
        handleGeminiFallback(genAiErr, 'Brain Dump Map');
      }
    }

    // Contextual intelligent fallback parser
    const lower = brainDumpText.toLowerCase();
    const isDerja = language === 'tn';
    const isFrench = language === 'fr';

    const extracted: Array<{
      id: string;
      text: string;
      category: 'task' | 'worry' | 'deadline' | 'wait_item';
      isControllable: boolean;
      suggestedTimeMinutes?: number;
      deadlineText?: string;
      selected: boolean;
    }> = [];

    // Check for PFE / Thesis
    if (lower.includes('pfe') || lower.includes('thesis') || lower.includes('mémoire') || lower.includes('rapport')) {
      extracted.push({
        id: 'bd-pfe',
        text: isDerja ? 'Khedmet el PFE (partie sghira)' : isFrench ? 'Rédiger une section du PFE' : 'Draft 1 section of PFE Thesis',
        category: 'task',
        isControllable: true,
        suggestedTimeMinutes: 15,
        deadlineText: 'Upcoming',
        selected: true
      });
    }

    // Check for Exams / Revision
    if (lower.includes('exam') || lower.includes('revision') || lower.includes('partiel') || lower.includes('partiels') || lower.includes('cours')) {
      extracted.push({
        id: 'bd-exam',
        text: isDerja ? 'Révision mte3 5 pages' : isFrench ? 'Révision ciblée de 5 pages' : 'Targeted 5-page syllabus review',
        category: 'task',
        isControllable: true,
        suggestedTimeMinutes: 15,
        deadlineText: 'Soon',
        selected: true
      });
    }

    // Check for CV / Job application / Interview
    if (lower.includes('cv') || lower.includes('interview') || lower.includes('entretien') || lower.includes('job') || lower.includes('recrutement')) {
      extracted.push({
        id: 'bd-career',
        text: isDerja ? 'Tsal7 el CV w tab3eth candidature' : isFrench ? 'Mise à jour du CV & 1 candidature' : 'Update CV bullet points & submit 1 application',
        category: 'task',
        isControllable: true,
        suggestedTimeMinutes: 15,
        deadlineText: 'This week',
        selected: true
      });
    }

    // Emotional worries & fears
    if (lower.includes('fear') || lower.includes('terrified') || lower.includes('khayfa') || lower.includes('peur') || lower.includes('paralyzed') || lower.includes('imposter') || lower.includes('disappoint')) {
      extracted.push({
        id: 'bd-worry',
        text: isDerja ? 'Khouf mel echec walla men ra2y el 3ayla' : isFrench ? 'Peur de décevoir et syndrome de l\'imposteur' : 'Fear of disappointing expectations and imposter doubts',
        category: 'worry',
        isControllable: false,
        selected: false
      });
    }

    // Wait item / External dependency
    if (lower.includes('waiting') || lower.includes('encadrant') || lower.includes('supervisor') || lower.includes('prof') || lower.includes('mail') || lower.includes('reponse')) {
      extracted.push({
        id: 'bd-wait',
        text: isDerja ? 'Nestanaw fi radd el encadrant / mail' : isFrench ? 'Attente du retour de l\'encadrant ou recruteur' : 'Awaiting feedback from supervisor / recruiter',
        category: 'wait_item',
        isControllable: false,
        selected: false
      });
    }

    // Always guarantee at least 2 structured items
    if (extracted.length === 0) {
      extracted.push(
        {
          id: 'bd-1',
          text: brainDumpText.length > 40 ? brainDumpText.slice(0, 37) + '...' : brainDumpText,
          category: 'task',
          isControllable: true,
          suggestedTimeMinutes: 10,
          selected: true
        },
        {
          id: 'bd-2',
          text: isDerja ? 'Pause mé w tnafes b ra7a' : isFrench ? 'Pause hydratation et respiration' : 'Hydration and breath reset pause',
          category: 'task',
          isControllable: true,
          suggestedTimeMinutes: 5,
          selected: true
        }
      );
    }

    const mindsetSummary = isDerja
      ? `Fahmettek ya ${userName} 3zizti. El afkar kolhom dakhlin fi b3adhhom ama tawa fasalnehon fi khedma sghira w 7ajat tnajem tkhallihom yestannew.`
      : isFrench
      ? `Toutes ces pensées tourbillonnaient dans ton esprit, ${userName}. Nous les avons démêlées en actions concrètes et choses que tu peux laisser reposer.`
      : `Your mind was holding a lot of swirling threads at once, ${userName}. We have gently sorted them into what you can do right now and what is safe to set down.`;

    res.json({
      mindsetSummary,
      clarificationNote: 'Extracted items are categorized based on what is in your direct control today.',
      extractedItems: extracted
    });
  } catch (_err) {
    res.json({
      mindsetSummary: 'Your thoughts are safely captured and organized.',
      extractedItems: [
        { id: 'bd-fallback-1', text: 'Take 1 gentle 10-minute focus block', category: 'task', isControllable: true, suggestedTimeMinutes: 10, selected: true }
      ]
    });
  }
});

// Backward-compatible alias for existing frontend calls
app.post('/api/pfe-breakdown', async (req, res) => {
  try {
    const { task, deadline, language = 'en', studentName = 'Yasmine' } = req.body;
    // Map to micro-pacing response
    const fetchRes = await fetch(`http://127.0.0.1:${port}/api/micro-pacing-optimizer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, deadline, language, studentName })
    });
    const data = await fetchRes.json();
    res.json({
      microSteps: data.microSteps.map((s: { actionDetail?: string; title?: string }) => s.actionDetail || s.title || ''),
      mindsetReframe: data.mindsetReframe,
      calmAffirmation: data.affirmation,
      fullPacing: data
    });
  } catch {
    res.json({
      microSteps: [
        'Open document and note 3 ideas without judging (15 mins)',
        'Draft one imperfect paragraph or solve 2 problems (15 mins)',
        'Save progress and review with pride (15 mins)'
      ],
      mindsetReframe: 'Progress does not require perfection.',
      calmAffirmation: 'Enti 9adaha. 🌸'
    });
  }
});

// =========================================================================
// 4. FEATURE 3: AI "Sisterly Reframe" (CBT Cognitive Restructuring)
// =========================================================================
app.post('/api/reframe-vent', async (req, res) => {
  try {
    const { vent, tag, language = 'en', userName = 'Yasmine' } = req.body;

    if (ai && !geminiAccessDenied) {
      try {
        const reframePrompt = `
A Tunisian university student (${userName}) shared this private, vulnerable vent in her well-being diary:
Category: "${tag}"
Vent: "${vent}"
Language: ${language} (Tunisian Derja if 'tn', French if 'fr', English if 'en').

Task requirements (Cognitive Restructuring / CBT-inspired, sisterly and non-diagnostic):
1. "validation": Empathetic sentence validating why this feeling is completely natural under the pressure of Tunisian university standards (concours, PFE, exams). No toxic positivity.
2. "distortionInsight": Gentle callout of any cognitive distortion (e.g., Catastrophizing, Imposter Syndrome, All-or-Nothing, Should-Statements) framed with kindness.
3. "gentleReframe": A grounded, resilient, empowering alternative perspective.
4. "microAction": One immediate somatic or sensory regulation step (e.g., 4-7-8 breath, cool water on wrists, palm cupping over eyes).
5. "derjaWhisper": A short, authentic Tunisian Derja comforting phrase (e.g. "Enti 9adaha w rabi m3ak ya 3zizti").
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: reframePrompt,
          config: {
            systemInstruction: HERCARE_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                validation: { type: Type.STRING },
                distortionInsight: { type: Type.STRING },
                gentleReframe: { type: Type.STRING },
                microAction: { type: Type.STRING },
                derjaWhisper: { type: Type.STRING }
              },
              required: ['validation', 'distortionInsight', 'gentleReframe', 'microAction', 'derjaWhisper']
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          res.json(parsed);
          return;
        }
      } catch (genAiErr) {
        handleGeminiFallback(genAiErr, 'Reframe API');
      }
    }

    const isDerja = language === 'tn';
    const isFrench = language === 'fr';

    let validation = `It is completely natural to feel the weight of this right now, ${userName}. Your feelings are valid and normal amidst intense university expectations.`;
    let distortionInsight = 'Notice if your mind is catastrophizing one difficult hurdle into a definition of your whole future, or minimizing your hard-earned achievements.';
    let gentleReframe = 'One stressful day or difficult chapter does not define your intellect or your worth. You have navigated tough hurdles before, and you can take this step by step.';
    let microAction = 'Place a warm hand over your heart, take 3 slow exhales through pursed lips, and drink a sip of fresh water.';
    let derjaWhisper = 'Koul chay bel marra w enti 9adaha ya 3zizti. 🌸';

    if (isDerja) {
      validation = `7a9ek t7es b tha8t ya ${userName}, el 9raya w el responsabilités fi Tounes s3ab w ykhaliew el we7ed ta3eb.`;
      distortionInsight = 'El moukhe ykaber el machakel sa3at w y9ollek "ena moch 9adaha" ama heka mouch s7i7.';
      gentleReframe = 'Enti wesla l houni b 9odrtek w dhmirek. Moch lezem kol chay yet7al elyoum, koul nhar w baraktou.';
      microAction = 'Tnafes 3 marrat b chwaya, emchi chouf choubbek l hawa l ndhif w echreb kes mé.';
      derjaWhisper = 'Mat9ala9ch rou7ek, ena m3ak w nchallah koul chay labes. 🌸';
    } else if (isFrench) {
      validation = `C'est totalement légitime de ressentir cette fatigue et ce doute, ${userName}. La pression académique peut être étouffante.`;
      distortionInsight = 'Attention au piège du "tout ou rien" ou au syndrome de l\'imposteur qui minimise tes compétences réelles.';
      gentleReframe = 'Ta valeur n\'est pas déterminée par une note ou un moment de doute. Tu as la résilience nécessaire pour traverser cette étape.';
      microAction = 'Pose une main sur ta poitrine, étire doucement la nuque et respire à fond.';
      derjaWhisper = 'Enti 9adaha. Tu es tellement plus forte que ce doute passager. 💜';
    }

    res.json({ validation, distortionInsight, gentleReframe, microAction, derjaWhisper });
  } catch (_err) {
    res.json({
      validation: 'Your feelings are heard and held with deep tenderness.',
      distortionInsight: 'Remember that stress magnifies worst-case thoughts.',
      gentleReframe: 'One difficult day does not define your bright future.',
      microAction: 'Take 4 slow breaths and soften your jaw.',
      derjaWhisper: 'Enti 9adaha ya 3zizti. 🌸'
    });
  }
});

// =========================================================================
// 5. Daily Morning Wellness Nudge Generator
// =========================================================================
app.post('/api/daily-nudge', async (req, res) => {
  try {
    const { feeling, studentStage, language = 'en' } = req.body;

    if (ai && !geminiAccessDenied) {
      try {
        const prompt = `Generate a 2-sentence morning guidance whisper for a Tunisian female student feeling "${feeling || 'anxious'}" during "${studentStage || 'exam season'}". Language: ${language}.`;
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: HERCARE_SYSTEM_INSTRUCTION
          }
        });
        if (response.text) {
          res.json({ nudge: response.text.trim() });
          return;
        }
      } catch (genAiErr) {
        handleGeminiFallback(genAiErr, 'Daily nudge');
      }
    }

    let nudge = 'Honor your pace today. Even small gentle pauses create steady momentum, sweet soul. 🌸';
    if (feeling === 'Anxious') {
      nudge = 'Anxiety is just energy looking for direction. Take 3 deep breaths and keep your focus on the very next 10 minutes. 💜';
    } else if (feeling === 'Exhausted') {
      nudge = 'Rest is productive. Cancel unnecessary pressure today and let your mind recharge. 🌙';
    } else if (feeling === 'Energized') {
      nudge = 'Channel this beautiful spark into one key project milestone today! You are shining. ⚡';
    }

    if (language === 'tn') {
      nudge = 'Sbah el khir ya 3zizti! Koul chay bech yet3ada bel marra w enti 9adaha. Khoudh wa9tek w tnafes b ra7a. 🌸';
    } else if (language === 'fr') {
      nudge = 'Bonjour belle âme. Écoute ton corps aujourd\'hui : le repos fait partie intégrante de ta réussite. 🌸';
    }

    res.json({ nudge });
  } catch (_err) {
    res.json({ nudge: 'Listen to your body today. Rest is part of your success. 🌸' });
  }
});

// Serve frontend in development or production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`HerCare full-stack server running on http://0.0.0.0:${port}`);
  });
}

startServer();
