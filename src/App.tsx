/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserState, ScreenId } from './types';
import { PALETTE_THEMES, PaletteThemeKey, getEffectiveTheme } from './utils/sanctuaryLogic';
import { ScreenSwitcher } from './components/ScreenSwitcher';
import { Screen0Welcome } from './components/Screen0Welcome';
import { Screen1Journey } from './components/Screen1Journey';
import { Screen2GetToKnow } from './components/Screen2GetToKnow';
import { Screen3AcademicContext } from './components/Screen3AcademicContext';
import { Screen4GentleSupport } from './components/Screen4GentleSupport';
import { Screen5CompanionPick } from './components/Screen5CompanionPick';
import { Screen6CompanionName } from './components/Screen6CompanionName';
import { Screen7ColorSanctuary } from './components/Screen7ColorSanctuary';
import { Screen8CompanionSpirit } from './components/Screen8CompanionSpirit';
import { Screen9ToneAndLanguage } from './components/Screen9ToneAndLanguage';
import { Screen10PersonalFocus } from './components/Screen10PersonalFocus';
import { Screen11SafetyAndControl } from './components/Screen11SafetyAndControl';
import { Screen12MeetCompanion } from './components/Screen12MeetCompanion';
import { Screen13FirstMomentCheckin } from './components/Screen13FirstMomentCheckin';
import { Screen14HomeDashboard } from './components/Screen14HomeDashboard';

const INITIAL_STATE: UserState = {
  journeyType: 'student',
  name: 'Yasmine',
  ageBracket: '21–24',
  campusOrField: 'INSAT, Université de Tunis',
  language: 'en',
  studentStage: 'master',
  academicStage: 'final',
  energyConsumingTopic: 'exams',
  importantDeadline: '7days',
  workloadScore: 4,
  dailySelfCareMinutes: '10–15 mins',
  helpTopics: ['exam_stress', 'procrastination', 'routine'],
  recentEnergy: 'drained',
  careStyle: 'listen',
  companionType: 'Bunny-Cat',
  companionName: 'Lumi',
  paletteTheme: 'lavender',
  themeMode: 'day',
  spiritType: 'gentle',
  nicknameType: 'Yasmine',
  messageFormat: 'warm',
  focusGoals: ['overwhelmed', 'routine'],
  allowReflectionContinuity: false,
  allowDailyCheckin: false,
  arrivalEmotion: 'Overwhelmed',
  studySprintMilestone: 1,
  totalStudyMilestones: 3,
  currentFeeling: 'Anxious',
  ventingEntries: [
    {
      id: 'vent-1',
      timestamp: 'Yesterday · 9:15 PM',
      tag: 'PFE Pressure',
      content:
        'My PFE supervisor at INSAT criticized my Chapter 2 related works draft and asked for 20 more academic citations by Saturday. Every time I open my thesis file, my chest tightens and my mind freezes. I feel like everyone in engineering is miles ahead of me.',
      aiReframe: {
        validation:
          'PFE supervisory feedback in Tunisian engineering schools can feel sharp, but it is an iterative draft dialogue, not a final verdict on your intellect.',
        distortionInsight:
          'Notice the Imposter Syndrome and Catastrophizing: demanding revisions are being translated into "I do not belong in tech".',
        gentleReframe:
          'You earned your seat through your own hard work. Gathering just 3 citations today is an authentic step forward that breaks the paralysis.',
        microAction:
          'Take 3 slow box breaths, wash wrists with cool water, and bookmark 3 papers without reading all 40 pages.',
        derjaWhisper: 'Enti 9adaha ya 3zizti, koul chay bel marra w nchallah labes. 🌸'
      }
    },
    {
      id: 'vent-2',
      timestamp: '3 days ago · 11:30 PM',
      tag: 'Exam Stress',
      content:
        'I have 40 pages of Machine Learning and Distributed Systems to revise for partiels. My sleep has been broken, my shoulders hurt, and I feel terrified of letting my parents down.',
      aiReframe: {
        validation:
          'Familial love and high expectations in Tunisia carry real weight, but your well-being matters far more than an impossible 40-page cram night.',
        distortionInsight:
          'All-or-Nothing thinking is telling you that you must master every slide overnight or face total failure.',
        gentleReframe:
          'Pacing yourself with 15-minute gentle blocs will protect your memory retention far better than panic-induced all-nighters.',
        microAction:
          'Place a hand on your heart, lower your shoulders, and drink a glass of fresh water before closing your laptop for sleep.',
        derjaWhisper: 'Rabi m3ak ya 3zizti, khedmtek behiya w enti féy9a. 💜'
      }
    }
  ],
  companionBondLevel: 4
};

export default function App() {
  const [userState, setUserState] = useState<UserState>(() => {
    try {
      const saved = localStorage.getItem('hercare_user_state');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_STATE;
  });

  const [currentScreen, setCurrentScreen] = useState<ScreenId>(() => {
    // Check URL parameters (e.g. ?autostart=1 or ?screen=dashboard)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1' || params.get('screen') === 'dashboard') {
        return 'dashboard';
      }
      const requestedScreen = params.get('screen') as ScreenId;
      if (requestedScreen) return requestedScreen;
    }
    return 'welcome';
  });

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem('hercare_user_state', JSON.stringify(userState));
    } catch {
      // ignore
    }
  }, [userState]);

  const updateState = (fields: Partial<UserState>) => {
    setUserState((prev) => ({ ...prev, ...fields }));
  };

  const themeObj = getEffectiveTheme(userState.paletteTheme, userState.themeMode || 'day');

  // Apply theme variables directly to document.documentElement and body so that
  // the entire document, body, modals, portals, and Tailwind utility classes reflect the live theme!
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;

    if (themeObj.isDark) {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }

    const themeVars: Record<string, string> = {
      // Custom theme tokens
      '--theme-primary': themeObj.primary,
      '--theme-primary-container': themeObj.primaryContainer,
      '--theme-primary-fixed': themeObj.primaryFixed,
      '--theme-on-primary-fixed': themeObj.onPrimaryFixed,
      '--theme-on-primary-container': themeObj.onPrimaryContainer,

      '--theme-secondary': themeObj.secondary,
      '--theme-secondary-container': themeObj.secondaryContainer,
      '--theme-secondary-fixed': themeObj.secondaryFixed,
      '--theme-on-secondary-fixed': themeObj.onSecondaryFixed,
      '--theme-on-secondary-container': themeObj.onSecondaryContainer,

      '--theme-bg': themeObj.bg,
      '--theme-surface': themeObj.surface,
      '--theme-surface-container-low': themeObj.surfaceContainerLow,
      '--theme-surface-container': themeObj.surfaceContainer,
      '--theme-surface-container-high': themeObj.surfaceContainerHigh,
      '--theme-surface-container-lowest': themeObj.surfaceContainerLowest,
      '--theme-light-card': themeObj.lightCard,
      '--theme-accent': themeObj.accent,
      '--theme-on-surface': themeObj.onSurface || '#1c1c19',
      '--theme-on-surface-variant': themeObj.onSurfaceVariant || '#494551',

      // Direct Tailwind v4 utility variables to ensure instantaneous cascade
      '--color-primary': themeObj.primary,
      '--color-primary-container': themeObj.primaryContainer,
      '--color-primary-fixed': themeObj.primaryFixed,
      '--color-primary-fixed-dim': themeObj.primaryFixed,
      '--color-on-primary-fixed': themeObj.onPrimaryFixed,
      '--color-on-primary-fixed-variant': themeObj.onPrimaryFixed,
      '--color-on-primary-container': themeObj.onPrimaryContainer,

      '--color-secondary': themeObj.secondary,
      '--color-secondary-container': themeObj.secondaryContainer,
      '--color-secondary-fixed': themeObj.secondaryFixed,
      '--color-secondary-fixed-dim': themeObj.secondaryFixed,
      '--color-on-secondary-fixed': themeObj.onSecondaryFixed,
      '--color-on-secondary-fixed-variant': themeObj.onSecondaryFixed,
      '--color-on-secondary-container': themeObj.onSecondaryContainer,

      '--color-tertiary': themeObj.secondary,
      '--color-tertiary-container': themeObj.secondaryContainer,
      '--color-tertiary-fixed': themeObj.secondaryFixed,
      '--color-tertiary-fixed-dim': themeObj.secondaryFixed,
      '--color-on-tertiary-fixed': themeObj.onSecondaryFixed,

      '--color-background': themeObj.bg,
      '--color-surface': themeObj.surface,
      '--color-surface-bright': themeObj.surface,
      '--color-surface-container-low': themeObj.surfaceContainerLow,
      '--color-surface-container': themeObj.surfaceContainer,
      '--color-surface-container-high': themeObj.surfaceContainerHigh,
      '--color-surface-container-highest': themeObj.surfaceContainerHigh,
      '--color-surface-container-lowest': themeObj.surfaceContainerLowest,
      '--color-on-surface': themeObj.onSurface || (themeObj.isDark ? '#f5f2fc' : '#1c1c19'),
      '--color-on-surface-variant': themeObj.onSurfaceVariant || (themeObj.isDark ? '#c8bed6' : '#494551'),
      '--color-accent': themeObj.accent
    };

    for (const [key, value] of Object.entries(themeVars)) {
      root.style.setProperty(key, value);
      body.style.setProperty(key, value);
    }

    body.style.backgroundColor = themeObj.bg;
    root.style.backgroundColor = themeObj.bg;
    body.style.color = themeObj.onSurface || (themeObj.isDark ? '#f5f2fc' : '#1c1c19');
    root.style.color = themeObj.onSurface || (themeObj.isDark ? '#f5f2fc' : '#1c1c19');
  }, [themeObj]);

  // Apply CSS color variables dynamically on the wrapper as well
  const dynamicThemeStyles = {
    '--theme-primary': themeObj.primary,
    '--theme-primary-container': themeObj.primaryContainer,
    '--theme-primary-fixed': themeObj.primaryFixed,
    '--theme-on-primary-fixed': themeObj.onPrimaryFixed,
    '--theme-on-primary-container': themeObj.onPrimaryContainer,
    '--theme-secondary': themeObj.secondary,
    '--theme-secondary-container': themeObj.secondaryContainer,
    '--theme-secondary-fixed': themeObj.secondaryFixed,
    '--theme-on-secondary-fixed': themeObj.onSecondaryFixed,
    '--theme-on-secondary-container': themeObj.onSecondaryContainer,
    '--theme-bg': themeObj.bg,
    '--theme-surface': themeObj.surface,
    '--theme-surface-container-low': themeObj.surfaceContainerLow,
    '--theme-surface-container': themeObj.surfaceContainer,
    '--theme-surface-container-high': themeObj.surfaceContainerHigh,
    '--theme-surface-container-lowest': themeObj.surfaceContainerLowest,
    '--theme-light-card': themeObj.lightCard,
    '--theme-accent': themeObj.accent,

    '--color-primary': themeObj.primary,
    '--color-primary-container': themeObj.primaryContainer,
    '--color-primary-fixed': themeObj.primaryFixed,
    '--color-primary-fixed-dim': themeObj.primaryFixed,
    '--color-on-primary-fixed': themeObj.onPrimaryFixed,
    '--color-on-primary-fixed-variant': themeObj.onPrimaryFixed,
    '--color-on-primary-container': themeObj.onPrimaryContainer,
    '--color-secondary': themeObj.secondary,
    '--color-secondary-container': themeObj.secondaryContainer,
    '--color-secondary-fixed': themeObj.secondaryFixed,
    '--color-secondary-fixed-dim': themeObj.secondaryFixed,
    '--color-on-secondary-fixed': themeObj.onSecondaryFixed,
    '--color-on-secondary-fixed-variant': themeObj.onSecondaryFixed,
    '--color-on-secondary-container': themeObj.onSecondaryContainer,
    '--color-tertiary': themeObj.secondary,
    '--color-tertiary-container': themeObj.secondaryContainer,
    '--color-tertiary-fixed': themeObj.secondaryFixed,
    '--color-tertiary-fixed-dim': themeObj.secondaryFixed,
    '--color-on-tertiary-fixed': themeObj.onSecondaryFixed,
    '--color-background': themeObj.bg,
    '--color-surface': themeObj.surface,
    '--color-surface-bright': themeObj.surface,
    '--color-surface-container-low': themeObj.surfaceContainerLow,
    '--color-surface-container': themeObj.surfaceContainer,
    '--color-surface-container-high': themeObj.surfaceContainerHigh,
    '--color-surface-container-highest': themeObj.surfaceContainerHigh,
    '--color-surface-container-lowest': themeObj.surfaceContainerLowest,
    '--color-on-surface': themeObj.onSurface || (themeObj.isDark ? '#f5f2fc' : '#1c1c19'),
    '--color-on-surface-variant': themeObj.onSurfaceVariant || (themeObj.isDark ? '#c8bed6' : '#494551'),
    '--color-accent': themeObj.accent,

    backgroundColor: themeObj.surface,
    color: themeObj.onSurface || (themeObj.isDark ? '#f5f2fc' : '#1c1c19'),
    transition: 'background-color 0.3s ease, color 0.3s ease'
  } as React.CSSProperties;

  return (
    <div
      style={dynamicThemeStyles}
      className={`min-h-screen bg-surface font-body text-on-surface antialiased flex flex-col pt-safe pb-safe transition-colors duration-300 ${
        themeObj.isDark ? 'dark' : ''
      }`}
    >
      {/* Screen Router */}
      <main className="flex-1 flex flex-col relative w-full">
        {currentScreen === 'welcome' && (
          <Screen0Welcome
            onBegin={() => setCurrentScreen('step1_journey')}
            onAlreadyAccount={() => setCurrentScreen('dashboard')}
          />
        )}

        {currentScreen === 'step1_journey' && (
          <Screen1Journey
            journeyType={userState.journeyType}
            onSelectJourney={(type) => updateState({ journeyType: type })}
            onBack={() => setCurrentScreen('welcome')}
            onContinue={() => setCurrentScreen('step2_get_to_know')}
          />
        )}

        {currentScreen === 'step2_get_to_know' && (
          <Screen2GetToKnow
            state={userState}
            updateState={updateState}
            onBack={() => setCurrentScreen('step1_journey')}
            onNext={() => setCurrentScreen('step3_academic_context')}
          />
        )}

        {currentScreen === 'step3_academic_context' && (
          <Screen3AcademicContext
            state={userState}
            updateState={updateState}
            onBack={() => setCurrentScreen('step2_get_to_know')}
            onNext={() => setCurrentScreen('step4_gentle_support')}
          />
        )}

        {currentScreen === 'step4_gentle_support' && (
          <Screen4GentleSupport
            state={userState}
            updateState={updateState}
            onBack={() => setCurrentScreen('step3_academic_context')}
            onNext={() => setCurrentScreen('step4_companion_pick')}
          />
        )}

        {currentScreen === 'step4_companion_pick' && (
          <Screen5CompanionPick
            state={userState}
            updateState={updateState}
            onBack={() => setCurrentScreen('step4_gentle_support')}
            onContinue={() => setCurrentScreen('step5_companion_name')}
          />
        )}

        {currentScreen === 'step5_companion_name' && (
          <Screen6CompanionName
            state={userState}
            updateState={updateState}
            onBack={() => setCurrentScreen('step4_companion_pick')}
            onNext={() => setCurrentScreen('step6_color_world')}
          />
        )}

        {currentScreen === 'step6_color_world' && (
          <Screen7ColorSanctuary
            state={userState}
            updateState={updateState}
            onBack={() => setCurrentScreen('step5_companion_name')}
            onContinue={() => setCurrentScreen('step7_companion_spirit')}
          />
        )}

        {currentScreen === 'step7_companion_spirit' && (
          <Screen8CompanionSpirit
            state={userState}
            updateState={updateState}
            onBack={() => setCurrentScreen('step6_color_world')}
            onContinue={() => setCurrentScreen('tone_and_language')}
          />
        )}

        {currentScreen === 'tone_and_language' && (
          <Screen9ToneAndLanguage
            state={userState}
            updateState={updateState}
            onBack={() => setCurrentScreen('step7_companion_spirit')}
            onContinue={() => setCurrentScreen('personal_focus')}
          />
        )}

        {currentScreen === 'personal_focus' && (
          <Screen10PersonalFocus
            state={userState}
            updateState={updateState}
            onBack={() => setCurrentScreen('tone_and_language')}
            onContinue={() => setCurrentScreen('safety_and_control')}
          />
        )}

        {currentScreen === 'safety_and_control' && (
          <Screen11SafetyAndControl
            state={userState}
            updateState={updateState}
            onBack={() => setCurrentScreen('personal_focus')}
            onEnterWorld={() => setCurrentScreen('meet_companion')}
          />
        )}

        {currentScreen === 'meet_companion' && (
          <Screen12MeetCompanion
            state={userState}
            onMeetProperly={() => setCurrentScreen('first_moment_checkin')}
            onChangeChoices={() => setCurrentScreen('step6_color_world')}
          />
        )}

        {currentScreen === 'first_moment_checkin' && (
          <Screen13FirstMomentCheckin
            state={userState}
            updateState={updateState}
            onBack={() => setCurrentScreen('meet_companion')}
            onSelectNextStep={(type) => {
              if (type === 'talk') setCurrentScreen('dashboard');
              else if (type === 'plan') setCurrentScreen('dashboard');
              else setCurrentScreen('dashboard');
            }}
            onEnterSanctuary={() => setCurrentScreen('dashboard')}
          />
        )}

        {currentScreen === 'dashboard' && (
          <Screen14HomeDashboard
            state={userState}
            updateState={updateState}
            onOpenSettings={() => setCurrentScreen('step6_color_world')}
            onRevisitOnboarding={() => setCurrentScreen('welcome')}
          />
        )}
      </main>
    </div>
  );
}
