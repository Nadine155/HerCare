import { PaletteThemeKey, SpiritType, MessageFormat, LanguageCode } from './utils/sanctuaryLogic';

export interface CognitiveDistortion {
  name: string;
  description: string;
  severity: 'mild' | 'moderate' | 'prominent';
}

export interface SentimentAnalysisResult {
  radarScores: {
    somaticTension: number;     // 0-100
    academicOverwhelm: number;  // 0-100
    emotionalEnergy: number;    // 0-100
    cognitiveClarity: number;   // 0-100
  };
  burnoutRisk: 'Low' | 'Moderate' | 'High';
  detectedDistortions: CognitiveDistortion[];
  sisterlyInsight: string;
  recommendedSanctuaryAction: string;
}

export interface MicroPacingStep {
  stepNumber: number;
  title: string;
  durationMinutes: number;
  actionDetail: string;
  circadianRest: string;
  difficulty?: 'gentle' | 'moderate';
}

export interface MicroPacingResult {
  taskTitle: string;
  microSteps: MicroPacingStep[];
  mindsetReframe: string;
  affirmation: string;
  isMinimumViablePlan?: boolean;
}

export interface BrainDumpItem {
  id: string;
  text: string;
  category: 'task' | 'worry' | 'deadline' | 'wait_item';
  isControllable: boolean;
  suggestedTimeMinutes?: number;
  deadlineText?: string;
  selected: boolean;
}

export interface BrainDumpResult {
  mindsetSummary: string;
  clarificationNote?: string;
  extractedItems: BrainDumpItem[];
}

export interface ActionFeedback {
  actionId: string;
  actionTitle: string;
  rating: 'helpful' | 'too_difficult' | 'irrelevant';
  timestamp: string;
  preferredSize?: number;
}

export interface GardenPlant {
  id: string;
  name: string;
  type: 'jasmine' | 'lavender' | 'olive_sprout' | 'orange_blossom' | 'mint' | 'sunflower';
  stage: 'sprout' | 'bud' | 'blooming';
  earnedBy: string;
  date: string;
}

export interface PlannerTask {
  id: string;
  title: string;
  durationMinutes: number;
  category: 'study' | 'career' | 'self_care' | 'pfe';
  done: boolean;
  source: 'manual' | 'brain_dump' | 'tiny_wins' | 'onboarding';
  deadline?: string;
}

export interface VentingEntry {
  id: string;
  timestamp: string;
  content: string;
  tag: string;
  aiReframe?: {
    validation: string;
    distortionInsight?: string;
    gentleReframe: string;
    microAction: string;
    derjaWhisper?: string;
  };
  sentimentAnalysis?: SentimentAnalysisResult;
}

export interface UserState {
  journeyType: 'student' | 'graduate';
  name: string;
  ageBracket: string;
  campusOrField: string;
  language: LanguageCode;
  studentStage: 'undergrad' | 'master' | 'phd' | 'pfe';
  academicStage: string;
  energyConsumingTopic: string;
  importantDeadline: string;
  workloadScore: number;
  dailySelfCareMinutes: string;
  helpTopics: string[];
  recentEnergy: string;
  careStyle: 'listen' | 'plan' | 'exercise';
  companionType: 'Bunny-Cat' | 'Cat' | 'Fox' | 'Bear' | 'Panda' | 'Baby Dragon';
  companionName: string;
  paletteTheme: PaletteThemeKey;
  themeMode: 'day' | 'night';
  spiritType: SpiritType;
  nicknameType: string;
  messageFormat: MessageFormat;
  focusGoals: string[];
  allowReflectionContinuity: boolean;
  allowDailyCheckin: boolean;
  arrivalEmotion: 'Great' | 'Okay' | 'Stressed' | 'Overwhelmed';
  // Dashboard & Sanctuary states
  studySprintMilestone: number;
  totalStudyMilestones: number;
  currentFeeling: string;
  ventingEntries: VentingEntry[];
  companionBondLevel: number;
  soundscape?: 'lofi' | 'ocean' | 'rain';
  lastSentimentAnalysis?: SentimentAnalysisResult;
  // P1 Feature states
  plannerTasks?: PlannerTask[];
  gardenPlants?: GardenPlant[];
  actionFeedback?: ActionFeedback[];
  graduateStage?: 'job_hunting' | 'first_job' | 'career_switch' | 'freelancing';
  graduateFocus?: string;
}

export type ScreenId =
  | 'welcome'               // Screen 0
  | 'step1_journey'         // Screen 1: Where are you in your journey?
  | 'step2_get_to_know'     // Screen 2: Let's get to know you
  | 'step3_academic_context'// Screen 3: Academic & life context
  | 'step4_gentle_support'  // Screen 4: What would you like help with?
  | 'step4_companion_pick'  // Screen 5: Let's find your little companion
  | 'step5_companion_name'  // Screen 6: Name your new friend
  | 'step6_color_world'     // Screen 7: Pick colors of your world
  | 'step7_companion_spirit'// Screen 8: What kind of friend do you need?
  | 'tone_and_language'     // Screen 9: Let's make this feel like you
  | 'personal_focus'        // Screen 10: What would you like to work toward?
  | 'safety_and_control'    // Screen 11: Your space, your choices
  | 'meet_companion'        // Screen 12: Meet Lumi! Your sanctuary is ready
  | 'first_moment_checkin'  // Screen 13: How are you arriving today?
  | 'dashboard';            // Screen 14: Sanctuary Home Dashboard

