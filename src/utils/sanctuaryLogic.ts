/**
 * Pure application logic for HerCare sanctuary, pacing calculations,
 * and companion adaptation algorithms.
 */

export type LanguageCode = 'en' | 'tn' | 'fr' | 'msa' | 'blend';
export type SpiritType = 'gentle' | 'playful' | 'calm' | 'motivator' | 'dynamic';
export type MessageFormat = 'warm' | 'short' | 'practical';
export type PaletteThemeKey = 'lavender' | 'pink' | 'blue' | 'mint' | 'peach' | 'yellow';

export interface ThemeDefinition {
  id: PaletteThemeKey;
  name: string;
  tagline: string;
  primary: string;
  primaryContainer: string;
  primaryFixed: string;
  onPrimaryFixed: string;
  onPrimaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  secondaryFixed: string;
  onSecondaryFixed: string;
  onSecondaryContainer: string;
  accent: string;
  bg: string;
  surface: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerLowest: string;
  lightCard: string;
  onSurface?: string;
  onSurfaceVariant?: string;
  isDark?: boolean;
}

export const PALETTE_THEMES: Record<PaletteThemeKey, ThemeDefinition> = {
  lavender: {
    id: 'lavender',
    name: 'Lavender Dream',
    tagline: 'Calming & Intuitive',
    primary: '#684fa7',
    primaryContainer: '#8a6fd4',
    primaryFixed: '#ede4ff',
    onPrimaryFixed: '#23005c',
    onPrimaryContainer: '#ffffff',
    secondary: '#6c5696',
    secondaryContainer: '#d5c2fe',
    secondaryFixed: '#efe5ff',
    onSecondaryFixed: '#230c4a',
    onSecondaryContainer: '#ffffff',
    accent: '#684fa7',
    bg: '#f6f1fc',
    surface: '#f6f1fc',
    surfaceContainerLow: '#efe8f9',
    surfaceContainer: '#e5daf4',
    surfaceContainerHigh: '#d8c7ed',
    surfaceContainerLowest: '#ffffff',
    lightCard: '#faf6fe',
    onSurface: '#1f1a29',
    onSurfaceVariant: '#4d4659'
  },
  pink: {
    id: 'pink',
    name: 'Soft Pink',
    tagline: 'Warm & Nurturing',
    primary: '#c92a6b',
    primaryContainer: '#e6498a',
    primaryFixed: '#ffe3ee',
    onPrimaryFixed: '#3e001f',
    onPrimaryContainer: '#ffffff',
    secondary: '#ad3368',
    secondaryContainer: '#fcc2d7',
    secondaryFixed: '#ffedf4',
    onSecondaryFixed: '#3d001e',
    onSecondaryContainer: '#ffffff',
    accent: '#c92a6b',
    bg: '#fdf0f6',
    surface: '#fdf0f6',
    surfaceContainerLow: '#fae2ee',
    surfaceContainer: '#f6d1e4',
    surfaceContainerHigh: '#f0bcd6',
    surfaceContainerLowest: '#ffffff',
    lightCard: '#fef5f9',
    onSurface: '#2b1622',
    onSurfaceVariant: '#56424e'
  },
  blue: {
    id: 'blue',
    name: 'Sky Blue',
    tagline: 'Peaceful & Clear',
    primary: '#1d63d6',
    primaryContainer: '#3b82f6',
    primaryFixed: '#dbeafe',
    onPrimaryFixed: '#172554',
    onPrimaryContainer: '#ffffff',
    secondary: '#2563eb',
    secondaryContainer: '#bfdbfe',
    secondaryFixed: '#e0f2fe',
    onSecondaryFixed: '#082f49',
    onSecondaryContainer: '#ffffff',
    accent: '#1d63d6',
    bg: '#eef5ff',
    surface: '#eef5ff',
    surfaceContainerLow: '#e0edfe',
    surfaceContainer: '#d0e3fc',
    surfaceContainerHigh: '#bdd6fa',
    surfaceContainerLowest: '#ffffff',
    lightCard: '#f4f8ff',
    onSurface: '#122038',
    onSurfaceVariant: '#3e4c63'
  },
  mint: {
    id: 'mint',
    name: 'Mint Garden',
    tagline: 'Fresh & Restorative',
    primary: '#0d8a5b',
    primaryContainer: '#10b981',
    primaryFixed: '#d1fae5',
    onPrimaryFixed: '#064e3b',
    onPrimaryContainer: '#ffffff',
    secondary: '#167a57',
    secondaryContainer: '#a7f3d0',
    secondaryFixed: '#dcfce7',
    onSecondaryFixed: '#022c22',
    onSecondaryContainer: '#ffffff',
    accent: '#0d8a5b',
    bg: '#ecf9f2',
    surface: '#ecf9f2',
    surfaceContainerLow: '#def5e7',
    surfaceContainer: '#caeed8',
    surfaceContainerHigh: '#b2e5c6',
    surfaceContainerLowest: '#ffffff',
    lightCard: '#f4fcf7',
    onSurface: '#10261c',
    onSurfaceVariant: '#395245'
  },
  peach: {
    id: 'peach',
    name: 'Peach Bloom',
    tagline: 'Cozy & Cheerful',
    primary: '#d44e1c',
    primaryContainer: '#ea580c',
    primaryFixed: '#ffedd5',
    onPrimaryFixed: '#451a03',
    onPrimaryContainer: '#ffffff',
    secondary: '#c24617',
    secondaryContainer: '#fed7aa',
    secondaryFixed: '#ffedd5',
    onSecondaryFixed: '#431407',
    onSecondaryContainer: '#ffffff',
    accent: '#d44e1c',
    bg: '#fff1e8',
    surface: '#fff1e8',
    surfaceContainerLow: '#ffe4d4',
    surfaceContainer: '#ffd4be',
    surfaceContainerHigh: '#ffc1a3',
    surfaceContainerLowest: '#ffffff',
    lightCard: '#fff7f2',
    onSurface: '#2d180f',
    onSurfaceVariant: '#563f35'
  },
  yellow: {
    id: 'yellow',
    name: 'Butter Yellow',
    tagline: 'Gentle & Radiant',
    primary: '#b47806',
    primaryContainer: '#ca8a04',
    primaryFixed: '#fef08a',
    onPrimaryFixed: '#422006',
    onPrimaryContainer: '#ffffff',
    secondary: '#9a6405',
    secondaryContainer: '#fef08a',
    secondaryFixed: '#fef9c3',
    onSecondaryFixed: '#451a03',
    onSecondaryContainer: '#ffffff',
    accent: '#b47806',
    bg: '#fdf9e2',
    surface: '#fdf9e2',
    surfaceContainerLow: '#faf2ce',
    surfaceContainer: '#f5e8b0',
    surfaceContainerHigh: '#eedc8f',
    surfaceContainerLowest: '#ffffff',
    lightCard: '#fefbee',
    onSurface: '#2b2308',
    onSurfaceVariant: '#534a2e'
  }
};

/**
 * Night Sanctuary palette definitions — deep velvet soothing midnight mode
 * for late night PFE / exam preparation with zero eye fatigue.
 */
export const NIGHT_PALETTE_THEMES: Record<PaletteThemeKey, ThemeDefinition> = {
  lavender: {
    id: 'lavender',
    name: 'Lavender Midnight',
    tagline: 'Deep velvet calming focus',
    primary: '#b799ff',
    primaryContainer: '#8a6fd4',
    primaryFixed: '#33274d',
    onPrimaryFixed: '#ede4ff',
    onPrimaryContainer: '#ffffff',
    secondary: '#a795cf',
    secondaryContainer: '#403060',
    secondaryFixed: '#3b2f54',
    onSecondaryFixed: '#efe5ff',
    onSecondaryContainer: '#ffffff',
    accent: '#c8b2ff',
    bg: '#120f1b',
    surface: '#120f1b',
    surfaceContainerLow: '#191524',
    surfaceContainer: '#231d33',
    surfaceContainerHigh: '#2e2642',
    surfaceContainerLowest: '#161221',
    lightCard: '#1d172b',
    onSurface: '#f5f2fc',
    onSurfaceVariant: '#c8bed6',
    isDark: true
  },
  pink: {
    id: 'pink',
    name: 'Rose Midnight',
    tagline: 'Gentle night-light warmth',
    primary: '#ff75a0',
    primaryContainer: '#d83a72',
    primaryFixed: '#4a1d2f',
    onPrimaryFixed: '#ffe3ee',
    onPrimaryContainer: '#ffffff',
    secondary: '#e88ba9',
    secondaryContainer: '#542236',
    secondaryFixed: '#421a2a',
    onSecondaryFixed: '#ffedf4',
    onSecondaryContainer: '#ffffff',
    accent: '#ffa1bf',
    bg: '#170c13',
    surface: '#170c13',
    surfaceContainerLow: '#20111a',
    surfaceContainer: '#2c1824',
    surfaceContainerHigh: '#3b2031',
    surfaceContainerLowest: '#1b0e16',
    lightCard: '#24131e',
    onSurface: '#fdf0f5',
    onSurfaceVariant: '#d9bfcc',
    isDark: true
  },
  blue: {
    id: 'blue',
    name: 'Ocean Midnight',
    tagline: 'Deep quiet coastal serenity',
    primary: '#60a5fa',
    primaryContainer: '#2563eb',
    primaryFixed: '#1e3a6a',
    onPrimaryFixed: '#dbeafe',
    onPrimaryContainer: '#ffffff',
    secondary: '#93c5fd',
    secondaryContainer: '#1e40af',
    secondaryFixed: '#1c355e',
    onSecondaryFixed: '#e0f2fe',
    onSecondaryContainer: '#ffffff',
    accent: '#93c5fd',
    bg: '#0c1421',
    surface: '#0c1421',
    surfaceContainerLow: '#121c2d',
    surfaceContainer: '#19273f',
    surfaceContainerHigh: '#223554',
    surfaceContainerLowest: '#0f1726',
    lightCard: '#152136',
    onSurface: '#f0f6ff',
    onSurfaceVariant: '#bed0e6',
    isDark: true
  },
  mint: {
    id: 'mint',
    name: 'Forest Midnight',
    tagline: 'Quiet pine & herbal stillness',
    primary: '#34d399',
    primaryContainer: '#059669',
    primaryFixed: '#114431',
    onPrimaryFixed: '#d1fae5',
    onPrimaryContainer: '#ffffff',
    secondary: '#6ee7b7',
    secondaryContainer: '#065f46',
    secondaryFixed: '#144d37',
    onSecondaryFixed: '#dcfce7',
    onSecondaryContainer: '#ffffff',
    accent: '#6ee7b7',
    bg: '#091711',
    surface: '#091711',
    surfaceContainerLow: '#0e2018',
    surfaceContainer: '#152f23',
    surfaceContainerHigh: '#1c3e2f',
    surfaceContainerLowest: '#0c1c14',
    lightCard: '#11271d',
    onSurface: '#effbf4',
    onSurfaceVariant: '#bde0ce',
    isDark: true
  },
  peach: {
    id: 'peach',
    name: 'Sunset Twilight',
    tagline: 'Warm ember peace after dusk',
    primary: '#fb923c',
    primaryContainer: '#ea580c',
    primaryFixed: '#4f2410',
    onPrimaryFixed: '#ffedd5',
    onPrimaryContainer: '#ffffff',
    secondary: '#fdba74',
    secondaryContainer: '#5e2a12',
    secondaryFixed: '#451f0e',
    onSecondaryFixed: '#ffedd5',
    onSecondaryContainer: '#ffffff',
    accent: '#fdba74',
    bg: '#180e08',
    surface: '#180e08',
    surfaceContainerLow: '#22140c',
    surfaceContainer: '#301c11',
    surfaceContainerHigh: '#402617',
    surfaceContainerLowest: '#1c1009',
    lightCard: '#27170e',
    onSurface: '#fef3ec',
    onSurfaceVariant: '#ddc2b4',
    isDark: true
  },
  yellow: {
    id: 'yellow',
    name: 'Amber Lantern',
    tagline: 'Gentle candle-glow study light',
    primary: '#facc15',
    primaryContainer: '#ca8a04',
    primaryFixed: '#453809',
    onPrimaryFixed: '#fef08a',
    onPrimaryContainer: '#ffffff',
    secondary: '#fde047',
    secondaryContainer: '#54440b',
    secondaryFixed: '#423508',
    onSecondaryFixed: '#fef9c3',
    onSecondaryContainer: '#ffffff',
    accent: '#fde047',
    bg: '#161307',
    surface: '#161307',
    surfaceContainerLow: '#1f1a0a',
    surfaceContainer: '#2c250e',
    surfaceContainerHigh: '#3c3214',
    surfaceContainerLowest: '#1a1608',
    lightCard: '#231d0b',
    onSurface: '#fdfce9',
    onSurfaceVariant: '#d9d2b2',
    isDark: true
  }
};

/**
 * Resolves the active theme tokens taking into account both palette and Day/Night sanctuary mode.
 */
export function getEffectiveTheme(
  paletteKey: PaletteThemeKey = 'lavender',
  mode: 'day' | 'night' = 'day'
): ThemeDefinition {
  if (mode === 'night') {
    return NIGHT_PALETTE_THEMES[paletteKey] || NIGHT_PALETTE_THEMES.lavender;
  }
  return PALETTE_THEMES[paletteKey] || PALETTE_THEMES.lavender;
}

/**
 * Calculates step progress percentage accurately based on 7-step onboarding flow.
 */
export function getStepProgress(stepIndex: number, totalSteps = 7): { percent: number; label: string } {
  if (stepIndex <= 0) return { percent: 0, label: 'Start' };
  if (stepIndex >= totalSteps) return { percent: 100, label: 'Complete' };
  const percent = Math.round((stepIndex / totalSteps) * 100);
  return { percent, label: `Step ${stepIndex} of ${totalSteps}` };
}

/**
 * Generates companion dialogue based on language, tone archetype, and user name.
 */
export function getCompanionDialogue(params: {
  name?: string;
  language?: LanguageCode | string;
  format?: MessageFormat | string;
  spirit?: SpiritType | string;
  context?: 'welcome' | 'arrival' | 'daily' | 'pfe';
}): string {
  const name = params.name?.trim() || 'Yasmine';
  const lang = params.language || 'en';
  const format = params.format || 'warm';
  const spirit = params.spirit || 'gentle';

  // Tunisian Arabic (Derja)
  if (lang === 'tn') {
    if (format === 'short') {
      return `✨ 3aslema ${name}!\n• Houni m3ak bech tetnaffes\n• Pause sghira bin les révisions\n• Koul 7aja fi wa9tha 🌸`;
    }
    if (format === 'practical') {
      return `🌟 3aslema ${name}. Khoudh nafas 3mi9. 1 objectif sghir lel youm w nkammlouh m3a b3adhna. Hani m3ak.`;
    }
    if (spirit === 'playful') {
      return `3aslema ya a7la ${name}! Ready bech nkhalliw el youm a9al stress w akthar da7ka? Khalina nebdeou! ✨`;
    }
    if (spirit === 'motivator') {
      return `3aslema ${name}! 3andek l'énergie wel 9owa. B khatwa sghira tnajjem toussel lkol chay. Yalla! 🚀`;
    }
    return `Marhba ${name}! Ena Lumi. Houni m3ak bech n3awnek f les révisions, wela juste nbadlou l jaw wa9t el 9la9. Chnowa t7eb na3mlou el youm? 💜`;
  }

  // French
  if (lang === 'fr') {
    if (format === 'short') {
      return `✨ Coucou ${name} !\n• Espace doux pour respirer\n• Objectif réaliste pour aujourd'hui\n• On avance pas à pas 🌸`;
    }
    if (format === 'practical') {
      return `🌟 Bonjour ${name}. Une respiration de 3 minutes + 1 micro-étape sur ton projet. On commence doucement ?`;
    }
    if (spirit === 'playful') {
      return `Coucou ${name} ! Allez hop, on dédramatise cette journée et on se fait un bon thé chaud ! ☕✨`;
    }
    return `Coucou ${name} ! Je suis Lumi. Je suis là pour t'écouter, t'aider à traverser la période des examens ou simplement t'accompagner sans pression. Qu'est-ce qui te ferait du bien aujourd'hui ? 💜`;
  }

  // Natural Blend (Franglais & Derja)
  if (lang === 'blend') {
    if (format === 'short') {
      return `✨ Coucou Marhba ${name}!\n• Safe space pour décompresser\n• Petite session focus sans panique\n• Ready quand tu veux 🌸`;
    }
    return `Coucou Marhba ${name}! I'm Lumi. Houni m3ak pour décompresser fel exam season ou just keep you company. Ready pour une pause douceur? ✨`;
  }

  // English (Standard)
  if (format === 'short') {
    return `✨ Hi ${name}!\n• Safe space to breathe\n• 1 gentle priority for today\n• Hydrate and take care 🌸`;
  }
  if (format === 'practical') {
    return `🌟 Hello ${name}. Lumi here. Today's gentle focus: 1 quick grounding pause + 1 small syllabus milestone. Ready when you are.`;
  }
  if (spirit === 'playful') {
    return `Hey bestie ${name}! Okay, let’s make today feel a little lighter and way less chaotic. You’ve got this! 💜✨`;
  }
  if (spirit === 'calm') {
    return `Welcome back, ${name}. Take a slow breath with me. Let's pause for a quiet moment and see what matters most today. 🌿`;
  }
  if (spirit === 'motivator') {
    return `Marhba ${name}! You have a starting point today. Let's turn it into one small, beautiful win. 🚀`;
  }

  // Default gentle warm conversation
  return `Marhba ${name}! I'm Lumi. I'm here to listen, help you navigate exam season, or just keep you company when things feel heavy. What would feel good today? 💜`;
}

/**
 * Generates prompt suggestions based on arrival emotional state.
 */
export function getArrivalGuidance(
  state: 'Great' | 'Okay' | 'Stressed' | 'Overwhelmed',
  name = 'Yasmine',
  isGraduate = false
): {
  speech: string;
  recommendedTag: string;
} {
  if (isGraduate) {
    switch (state) {
      case 'Overwhelmed':
        return {
          speech: `That sounds like a lot to carry, ${name}. Job applications, ghosting, and post-grad transition can feel heavy. Take a slow breath with me. Which of these sounds most comforting right now?`,
          recommendedTag: 'Career Pacing: Slow & Gentle'
        };
      case 'Stressed':
        return {
          speech: `I hear you, ${name}. Interviews, CV tuning, and feeling behind can cause intense stress. Let's take just 3 minutes to reset your nervous system together.`,
          recommendedTag: 'Career Pacing: Mindful Release'
        };
      case 'Okay':
        return {
          speech: `Glad you checked in, ${name}. A steady day is a great canvas. Would you like to do a 15-minute gentle application sprint or just unwind?`,
          recommendedTag: 'Career Pacing: Balanced Flow'
        };
      case 'Great':
      default:
        return {
          speech: `It's wonderful to see your confidence glowing today, ${name}! Let's celebrate this positive spark and take one gentle step toward your career path.`,
          recommendedTag: 'Career Pacing: Radiant Momentum'
        };
    }
  }

  switch (state) {
    case 'Overwhelmed':
      return {
        speech: `That sounds like a lot to carry, ${name}. Take a slow breath with me. Which of these sounds most comforting right now?`,
        recommendedTag: 'Pacing: Slow & Gentle'
      };
    case 'Stressed':
      return {
        speech: `I hear you, ${name}. Deadlines and expectations can feel heavy. Let's take just 3 minutes to reset your nervous system together.`,
        recommendedTag: 'Pacing: Mindful Release'
      };
    case 'Okay':
      return {
        speech: `Glad you checked in, ${name}. A steady day is a great canvas. Would you like to do a calm study sprint or just unwind?`,
        recommendedTag: 'Pacing: Balanced Flow'
      };
    case 'Great':
    default:
      return {
        speech: `It's wonderful to see you glowing today, ${name}! Let's celebrate this high energy and channel it gently into something meaningful.`,
        recommendedTag: 'Pacing: Radiant Energy'
      };
  }
}

/**
 * Format timer seconds into mm:ss display
 */
export function formatTimerSeconds(seconds: number): string {
  const safeSec = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safeSec / 60);
  const s = safeSec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Calculates milestone completion ratio
 */
export function calculateMilestonesRatio(completed: number, total: number): { percent: number; text: string } {
  if (total <= 0) return { percent: 0, text: '0 of 0 milestones' };
  const safeComp = Math.min(Math.max(0, completed), total);
  const percent = Math.round((safeComp / total) * 100);
  return { percent, text: `${safeComp} of ${total} small milestones (${percent}%)` };
}
