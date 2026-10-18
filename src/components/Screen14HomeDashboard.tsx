import React, { useState, useEffect } from 'react';
import {
  UserState,
  SentimentAnalysisResult,
  MicroPacingResult,
  MicroPacingStep,
  PlannerTask,
  ActionFeedback,
  GardenPlant
} from '../types';
import { COMPANION_OPTIONS } from '../constants/assets';
import { formatTimerSeconds, calculateMilestonesRatio, PALETTE_THEMES } from '../utils/sanctuaryLogic';
import { soundFx } from '../utils/audioPlayer';
import { SentimentBurnoutAnalyzer } from './SentimentBurnoutAnalyzer';
import { BrainDumpModal } from './BrainDumpModal';
import { ComebackGardenModal } from './ComebackGardenModal';

interface Props {
  state: UserState;
  updateState: (fields: Partial<UserState>) => void;
  onOpenSettings: () => void;
  onRevisitOnboarding: () => void;
}

export const Screen14HomeDashboard: React.FC<Props> = ({
  state,
  updateState,
  onOpenSettings,
  onRevisitOnboarding
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'home' | 'companion' | 'plan' | 'sanctuary' | 'profile'>('home');

  // Modals & Drawers
  const [activeModal, setActiveModal] = useState<
    | 'breathe'
    | 'venting'
    | 'affirmation'
    | 'timer'
    | 'circle'
    | 'stretches'
    | 'notifications'
    | 'pfe_breaker'
    | 'crisis_shield'
    | 'soundscapes'
    | 'burnout_radar'
    | 'theme_palette'
    | 'brain_dump'
    | 'garden'
    | 'identity_bridge'
    | null
  >(null);

  // Focus Timer state (15 min default micro-step)
  const [timerDuration, setTimerDuration] = useState(900); // 15 mins default
  const [timerSeconds, setTimerSeconds] = useState(900);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isLofiOn, setIsLofiOn] = useState(false);
  const [ambientType, setAmbientType] = useState<'lofi' | 'ocean' | 'rain'>('lofi');

  // Morning feeling
  const [loggedFeeling, setLoggedFeeling] = useState<string | null>(state.currentFeeling || 'Anxious');
  const [feelingSuccessMsg, setFeelingSuccessMsg] = useState('');

  // Daily goals state
  const [dailyMilestones, setDailyMilestones] = useState([
    { id: '1', title: 'Morning breathing & tea ritual', done: true },
    { id: '2', title: 'PFE Thesis Micro-Step: Chapter 2 outline', done: false },
    { id: '3', title: 'Review 5 past exam problems', done: false },
    { id: '4', title: 'Evening reflection in Venting Space', done: false }
  ]);
  const [newMilestoneText, setNewMilestoneText] = useState('');

  // Exam Countdown Deadlines
  const [deadlines, setDeadlines] = useState([
    { id: 'd1', name: 'Software Engineering Final Exam', date: 'In 5 days', badge: 'High priority' },
    { id: 'd2', name: 'PFE Progress Report 2 Submission', date: 'In 14 days', badge: 'Milestone' }
  ]);
  const [newDeadlineName, setNewDeadlineName] = useState('');

  // =========================================================================
  // FEATURE 1: AI Cognitive Sentiment & Burnout Risk Analyzer
  // =========================================================================
  const [sentimentResult, setSentimentResult] = useState<SentimentAnalysisResult | null>(
    state.lastSentimentAnalysis || null
  );
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);
  const [sentimentInputNote, setSentimentInputNote] = useState(
    "I have 40 pages of Machine Learning to revise before Saturday and my PFE bibliography is overdue. I feel completely paralyzed and terrified of disappointing everyone."
  );

  const handleAnalyzeSentiment = async (customText?: string) => {
    const textToAnalyze = customText || sentimentInputNote || loggedFeeling || 'I feel overwhelmed with university and PFE';
    setIsAnalyzingSentiment(true);
    soundFx.playGentleChime(528);

    try {
      const response = await fetch('/api/sentiment-burnout-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToAnalyze,
          context: {
            feeling: loggedFeeling,
            name: state.name,
            language: state.language,
            campusOrField: state.campusOrField,
            studentStage: state.studentStage
          }
        })
      });

      const data: SentimentAnalysisResult = await response.json();
      setSentimentResult(data);
      updateState({ lastSentimentAnalysis: data });
      soundFx.playSparkle();
    } catch (err) {
      console.error('Sentiment analyzer error:', err);
      const fallbackResult: SentimentAnalysisResult = {
        radarScores: {
          somaticTension: 74,
          academicOverwhelm: 86,
          emotionalEnergy: 28,
          cognitiveClarity: 42
        },
        burnoutRisk: 'Moderate',
        detectedDistortions: [
          {
            name: 'Catastrophizing',
            description: 'Anticipating that a delayed chapter means failing the entire degree.',
            severity: 'moderate'
          },
          {
            name: 'Imposter Syndrome',
            description: 'Minimizing your achievements and assuming everyone else is managing effortlessly.',
            severity: 'prominent'
          }
        ],
        sisterlyInsight: `You are carrying intense academic pressure at ${state.campusOrField || 'university'}, ${state.name || 'Yasmine'}. Your fatigue is a natural biological response, not a personal flaw.`,
        recommendedSanctuaryAction: 'Take 3 minutes of Box Breathing, sip cold water, and break work into 15-minute micro-intervals.'
      };
      setSentimentResult(fallbackResult);
      updateState({ lastSentimentAnalysis: fallbackResult });
    } finally {
      setIsAnalyzingSentiment(false);
    }
  };

  // =========================================================================
  // FEATURE 2: AI "Micro-Pacing" & Tiny Wins Engine
  // =========================================================================
  const defaultTask = state.journeyType === 'graduate'
    ? 'Polish CV for junior software / engineering roles and apply to 1 company'
    : '40 pages Machine Learning revision & overdue PFE bibliography';

  const [pfeTaskInput, setPfeTaskInput] = useState(defaultTask);
  const [pfeDeadlineInput, setPfeDeadlineInput] = useState('This Saturday (3 days left)');
  const [pfeEnergyInput, setPfeEnergyInput] = useState('Low / Exhausted');
  const [selectedDuration, setSelectedDuration] = useState<number>(15);
  const [isMinimumViablePlan, setIsMinimumViablePlan] = useState(false);
  const [isGeneratingMicroPacing, setIsGeneratingMicroPacing] = useState(false);
  const [microPacingResult, setMicroPacingResult] = useState<MicroPacingResult | null>(null);
  const [actionFeedbackMap, setActionFeedbackMap] = useState<Record<string, 'helpful' | 'too_difficult' | 'irrelevant'>>({});

  const handleGenerateMicroPacing = async (
    customTask?: string,
    customDeadline?: string,
    overrideMinutes?: number,
    forceMvp?: boolean
  ) => {
    const taskToSend = customTask || pfeTaskInput;
    const deadlineToSend = customDeadline || pfeDeadlineInput;
    const targetMins = overrideMinutes !== undefined ? overrideMinutes : selectedDuration;
    const isMvp = forceMvp !== undefined ? forceMvp : isMinimumViablePlan;

    if (!taskToSend.trim()) return;

    setIsGeneratingMicroPacing(true);
    soundFx.playGentleChime(528);

    try {
      const res = await fetch('/api/micro-pacing-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: taskToSend.trim(),
          deadline: deadlineToSend,
          currentEnergy: pfeEnergyInput,
          language: state.language,
          studentName: state.name,
          targetMinutes: targetMins,
          isMinimumViablePlan: isMvp,
          journeyType: state.journeyType,
          feedbackHistory: state.actionFeedback || []
        })
      });

      const data: MicroPacingResult = await res.json();
      setMicroPacingResult(data);
      soundFx.playSuccessFanfare();
    } catch (err) {
      console.error('Micro-pacing error:', err);
      setMicroPacingResult({
        taskTitle: 'Gentle Micro-Pacing',
        microSteps: [
          {
            stepNumber: 1,
            title: 'Low-Friction Workspace Setup',
            durationMinutes: targetMins,
            actionDetail: `Open document for "${taskToSend.slice(0, 30)}" and write 3 raw bullet ideas without editing.`,
            circadianRest: 'Stand up, pour a glass of water, and do two shoulder rolls (3 mins).'
          },
          {
            stepNumber: 2,
            title: 'Core Concept Draft',
            durationMinutes: targetMins,
            actionDetail: 'Focus on just 1 specific sub-section or solve 2 past exam exercises with calm focus.',
            circadianRest: 'Look away from your screen at a distant window to relax your eye muscles (4 mins).'
          },
          {
            stepNumber: 3,
            title: 'Gentle Synthesis & Bookmark',
            durationMinutes: targetMins,
            actionDetail: 'Draft 5 summary sentences, save your work, and bookmark where you will gently begin next.',
            circadianRest: 'Celebrate this momentum! Wash wrists with cool water and take a nourishing break.'
          }
        ],
        mindsetReframe: 'Perfectionism is paralysis in disguise. 15 minutes of imperfect progress releases 90% of task dread.',
        affirmation: 'Enti 9adaha. Koul chay bel marra w nchallah labes. 🌸',
        isMinimumViablePlan: isMvp
      });
    } finally {
      setIsGeneratingMicroPacing(false);
    }
  };

  const handleStartMicroStepTimer = (step: MicroPacingStep) => {
    soundFx.playGentleChime(528);
    const secs = step.durationMinutes * 60;
    setTimerDuration(secs);
    setTimerSeconds(secs);
    setIsTimerRunning(true);
    setActiveModal('timer');
  };

  const handleAddStepToMilestones = (step: MicroPacingStep) => {
    soundFx.playSparkle();
    const newMilestone = {
      id: Date.now().toString(),
      title: `${step.title}: ${step.actionDetail.slice(0, 48)}...`,
      done: false
    };
    setDailyMilestones((prev) => [...prev, newMilestone]);

    const newPlannerTask: PlannerTask = {
      id: `task-${Date.now()}`,
      title: `${step.title}: ${step.actionDetail}`,
      durationMinutes: step.durationMinutes,
      category: state.journeyType === 'graduate' ? 'career' : 'study',
      done: false,
      source: 'tiny_wins'
    };
    updateState({
      plannerTasks: [...(state.plannerTasks || []), newPlannerTask]
    });
  };

  const handleRecordFeedback = (
    stepIdx: number,
    step: MicroPacingStep,
    rating: 'helpful' | 'too_difficult' | 'irrelevant'
  ) => {
    soundFx.playGentleChime(rating === 'helpful' ? 528 : 440);
    const stepKey = `step-${stepIdx}`;
    setActionFeedbackMap((prev) => ({ ...prev, [stepKey]: rating }));

    const feedbackEntry: ActionFeedback = {
      actionId: `action-${Date.now()}`,
      actionTitle: step.title,
      rating,
      timestamp: new Date().toISOString(),
      preferredSize: rating === 'too_difficult' ? Math.max(2, Math.floor(step.durationMinutes / 2)) : step.durationMinutes
    };

    updateState({
      actionFeedback: [...(state.actionFeedback || []), feedbackEntry]
    });

    if (rating === 'too_difficult') {
      // Auto resize to half duration or 5 mins
      const smallerMins = step.durationMinutes > 5 ? 5 : 2;
      setSelectedDuration(smallerMins);
      handleGenerateMicroPacing(step.actionDetail, undefined, smallerMins, true);
    }
  };

  const handleTasksAddedFromBrainDump = (newTasks: PlannerTask[]) => {
    const updatedPlanner = [...(state.plannerTasks || []), ...newTasks];
    updateState({ plannerTasks: updatedPlanner });

    // Also sync to daily milestones for immediate dashboard visibility
    const newMilestones = newTasks.map((t) => ({
      id: t.id,
      title: `${t.title} (${t.durationMinutes}m)`,
      done: false
    }));
    setDailyMilestones((prev) => [...prev, ...newMilestones]);
  };

  const handleTogglePlannerTask = (taskId: string) => {
    soundFx.playSparkle();
    const currentTasks = state.plannerTasks || [];
    let justCompleted = false;

    const updated = currentTasks.map((t) => {
      if (t.id === taskId) {
        const nextDone = !t.done;
        if (nextDone) justCompleted = true;
        return { ...t, done: nextDone };
      }
      return t;
    });

    // If just completed, deterministically nurture a bloom in the Comeback Garden!
    if (justCompleted) {
      soundFx.playSuccessFanfare();
      const plantTypes: GardenPlant['type'][] = ['jasmine', 'lavender', 'olive_sprout', 'orange_blossom', 'mint', 'sunflower'];
      const picked = plantTypes[(state.gardenPlants?.length || 0) % plantTypes.length];
      const newPlant: GardenPlant = {
        id: `plant-${Date.now()}`,
        name: `Bloom of accomplishment`,
        type: picked,
        stage: 'blooming',
        earnedBy: 'Completed a planned task',
        date: 'Today'
      };
      updateState({
        plannerTasks: updated,
        gardenPlants: [...(state.gardenPlants || []), newPlant],
        companionBondLevel: (state.companionBondLevel || 1) + 1
      });
    } else {
      updateState({ plannerTasks: updated });
    }
  };

  // =========================================================================
  // FEATURE 3: AI "Sisterly Reframe" (CBT Cognitive Restructuring)
  // =========================================================================
  const [ventText, setVentText] = useState('');
  const [ventTag, setVentTag] = useState<'Exam Stress' | 'PFE Pressure' | 'Fatigue' | 'Gratitude'>('Exam Stress');
  const [isReframingVent, setIsReframingVent] = useState(false);
  const [activeReframingResult, setActiveReframingResult] = useState<{
    validation: string;
    distortionInsight?: string;
    gentleReframe: string;
    microAction: string;
    derjaWhisper?: string;
  } | null>(null);

  const handleReframeVent = async () => {
    if (!ventText.trim()) return;
    setIsReframingVent(true);
    soundFx.playGentleChime(500);

    try {
      const res = await fetch('/api/reframe-vent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vent: ventText.trim(),
          tag: ventTag,
          language: state.language,
          userName: state.name
        })
      });
      const data = await res.json();
      setActiveReframingResult(data);
      soundFx.playSparkle();
    } catch (err) {
      console.error('Reframe error:', err);
      setActiveReframingResult({
        validation: 'Your feelings are heard and held with deep tenderness.',
        distortionInsight: 'Remember that stress magnifies worst-case thoughts.',
        gentleReframe: 'One difficult day does not define your bright future.',
        microAction: 'Take 4 slow breaths and soften your jaw.',
        derjaWhisper: 'Enti 9adaha ya 3zizti. 🌸'
      });
    } finally {
      setIsReframingVent(false);
    }
  };

  const handleSaveVenting = () => {
    if (!ventText.trim()) return;
    soundFx.playGentleChime(528);
    const newEntry = {
      id: Date.now().toString(),
      timestamp: 'Today · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: ventText.trim(),
      tag: ventTag,
      aiReframe: activeReframingResult || undefined
    };
    updateState({
      ventingEntries: [newEntry, ...state.ventingEntries]
    });
    setVentText('');
    setActiveReframingResult(null);
    soundFx.playSparkle();
  };

  // =========================================================================
  // FEATURE 4: Real Gemini Live Companion with Crisis Safety Net
  // =========================================================================
  const [chatInput, setChatInput] = useState('');
  const [isCompanionTyping, setIsCompanionTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [micErrorNotice, setMicErrorNotice] = useState<string | null>(null);

  const startRealMicrophone = async () => {
    soundFx.playGentleChime(528);
    setAudioChunks([]);
    setMicErrorNotice(null);
    setActiveModal('voice_input');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      let chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const voiceText = state.language === 'tn' ? '🎤 [Voice Note in Tunisian Derja]' : state.language === 'fr' ? '🎤 [Note vocale]' : '🎤 [Voice Note]';
        setChatMessages((prev) => [
          ...prev,
          { sender: 'user', text: voiceText, time: 'Just now', audioUrl }
        ]);
        triggerLumiVoiceResponse();
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
      setIsRecording(false);
      setMicErrorNotice('Microphone access restricted in this preview. Tap any quick voice prompt below to send your voice message instantly!');
    }
  };

  const stopRealMicrophone = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    setActiveModal(null);
    soundFx.playSparkle();
  };

  const triggerLumiVoiceResponse = () => {
    setIsCompanionTyping(true);
    setTimeout(() => {
      setIsCompanionTyping(false);
      soundFx.playSparkle();
      let reply = `I heard your voice note, ${state.name || 'habibi'}. Your feelings are completely valid and I am holding space for you. 💜`;
      if (state.language === 'tn') {
        reply = `Sma3t soutk ya ${state.name || '3zizti'}. 9olbi m3ak w rta7, kol chay bech yet3ada b khir. 🌸`;
      } else if (state.language === 'fr') {
        reply = `J'ai bien reçu ton message vocal, ${state.name}. Respire profondément, je suis là près de toi. 💜`;
      }
      setChatMessages((prev) => [...prev, { sender: 'lumi', text: reply, time: 'Just now' }]);
    }, 1500);
  };

  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'lumi'; text: string; time: string; audioUrl?: string }>>([
    {
      sender: 'lumi',
      text: `Sbah el khir ${state.name || 'Yasmine'}! 🌸 I'm here right by your side in your sanctuary. You don't have to carry the whole semester at once. How is your heart feeling today?`,
      time: '9:00 AM'
    }
  ]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim()) return;

    soundFx.playGentleChime(500);
    const newChat = [...chatMessages, { sender: 'user' as const, text: textToSend.trim(), time: 'Just now' }];
    setChatMessages(newChat);
    if (!customText) setChatInput('');
    setIsCompanionTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          userProfile: {
            name: state.name,
            language: state.language,
            journeyType: state.journeyType,
            campusOrField: state.campusOrField,
            studentStage: state.studentStage,
            companionName: state.companionName,
            spiritType: state.spiritType,
            currentFeeling: loggedFeeling || state.currentFeeling
          }
        })
      });

      const data = await response.json();
      setIsCompanionTyping(false);
      soundFx.playSparkle();

      const reply = data.reply || `I'm right here with you, ${state.name || 'habibi'}. Take a slow breath. 💜`;
      setChatMessages((prev) => [...prev, { sender: 'lumi' as const, text: reply, time: 'Just now' }]);

      // Safety Net Trigger: if crisis keywords detected, open crisis shield
      if (data.isCrisisTrigger) {
        soundFx.playGentleChime(400);
        setTimeout(() => {
          setActiveModal('crisis_shield');
        }, 1200);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setIsCompanionTyping(false);
      soundFx.playSparkle();

      let reply = `I'm right here with you, ${state.name || 'habibi'}. Take a slow breath. We can take this one gentle step at a time. 💜`;
      if (state.language === 'tn') {
        reply = `Fahmettek ya ${state.name || '3zizti'}. Mat9ala9ch rou7ek, kol chay bech yet3ada w ena hani m3ak. 🌸`;
      }
      setChatMessages((prev) => [...prev, { sender: 'lumi' as const, text: reply, time: 'Just now' }]);
    }
  };

  // Focus timer countdown loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            soundFx.playSuccessFanfare();
            setDailyMilestones((prevMilestones) =>
              prevMilestones.map((m, idx) => (idx === 1 ? { ...m, done: true } : m))
            );
            updateState({
              studySprintMilestone: Math.min(state.studySprintMilestone + 1, state.totalStudyMilestones),
              companionBondLevel: state.companionBondLevel + 1
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds, state.studySprintMilestone, state.totalStudyMilestones, state.companionBondLevel, updateState]);

  const toggleFocusTimer = () => {
    soundFx.playGentleChime(isTimerRunning ? 440 : 528);
    setIsTimerRunning(!isTimerRunning);
  };

  const handleToggleLofi = () => {
    const nextState = soundFx.toggleLofiBeats();
    setIsLofiOn(nextState);
  };

  const handleSelectSoundscape = (type: 'lofi' | 'ocean' | 'rain') => {
    soundFx.playGentleChime(528);
    setAmbientType(type);
    soundFx.setAmbientType(type);
    if (!isLofiOn) {
      soundFx.startLofiBeats();
      setIsLofiOn(true);
    }
  };

  const handleLogFeeling = async () => {
    if (!loggedFeeling) return;
    soundFx.playSparkle();
    updateState({ currentFeeling: loggedFeeling });

    try {
      const res = await fetch('/api/daily-nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeling: loggedFeeling,
          studentStage: state.studentStage,
          language: state.language
        })
      });
      const data = await res.json();
      setFeelingSuccessMsg(data.nudge || 'Thank you for honoring your body and heart today.');
    } catch {
      let advice = 'Thank you for honoring your body and heart today.';
      if (loggedFeeling === 'Anxious') {
        advice = 'Anxiety noted gently. Let’s keep tasks down to 15 minutes each today. 💜';
      } else if (loggedFeeling === 'Exhausted') {
        advice = 'Rest is productive. Cancel non-urgent stress and take a cozy break. 🌙';
      } else if (loggedFeeling === 'Energized') {
        advice = 'Channel this beautiful spark into one key project step! ⚡';
      }
      setFeelingSuccessMsg(advice);
    }

    setTimeout(() => setFeelingSuccessMsg(''), 6000);
  };

  // Breathing exercise state
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathCount, setBreathCount] = useState(4);
  const [completedBreathCycles, setCompletedBreathCycles] = useState(0);

  useEffect(() => {
    if (activeModal !== 'breathe') return;
    const interval = setInterval(() => {
      setBreathCount((prev) => {
        if (prev <= 1) {
          if (breathPhase === 'Inhale') {
            setBreathPhase('Hold');
            soundFx.playGentleChime(480);
            return 4;
          } else if (breathPhase === 'Hold') {
            setBreathPhase('Exhale');
            soundFx.playGentleChime(400);
            return 6;
          } else {
            setBreathPhase('Inhale');
            soundFx.playGentleChime(528);
            setCompletedBreathCycles((c) => c + 1);
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeModal, breathPhase]);

  // Daily Affirmations
  const affirmations = [
    'You don’t have to finish everything today to be worthy of rest. One small breath at a time.',
    'Your intelligence, warmth, and resilience are far greater than any exam stress. You are doing enough, sweet soul. 🌸',
    '3andek 9odra kbira w 9alb tayeb. Koul 7aja bech tji fi wa9tha.',
    'Progress is not always linear. Sometimes taking a slow, deep breath is the most productive thing you can do.',
    'You are writing your own future with patience and grace. Proud of how gently you keep going.'
  ];
  const [affirmationIdx, setAffirmationIdx] = useState(0);

  // Tunis Student Circle
  const [circleStudents, setCircleStudents] = useState([
    { id: '1', name: 'Nour M.', uni: 'INSAT', goal: 'Software Engineering review', state: 'Focusing 25m', cheers: 6 },
    { id: '2', name: 'Meriem B.', uni: 'Faculté de Médecine de Tunis', goal: 'Pediatrics clinical case notes', state: 'Focusing 12m', cheers: 8 },
    { id: '3', name: 'Amira K.', uni: 'ENIT', goal: 'PFE Signal Processing', state: 'Resting 3m', cheers: 4 },
    { id: '4', name: 'Sarra T.', uni: 'IHEC Carthage', goal: 'Corporate Finance case', state: 'Focusing 18m', cheers: 5 },
    { id: '5', name: 'Ines D.', uni: 'TBS (Tunis Business School)', goal: 'Data Analytics Capstone', state: 'Focusing 10m', cheers: 7 }
  ]);
  const [isUserInCircle, setIsUserInCircle] = useState(false);
  const [cheerNoteInput, setCheerNoteInput] = useState('');

  const handleJoinCircle = () => {
    soundFx.playSparkle();
    if (!isUserInCircle) {
      setCircleStudents([
        {
          id: 'user',
          name: `${state.name || 'Yasmine'} (You)`,
          uni: state.campusOrField || 'INSAT',
          goal: 'PFE & Exam Calm Focus',
          state: 'Focusing 15m',
          cheers: 1
        },
        ...circleStudents
      ]);
      setIsUserInCircle(true);
    } else {
      setCircleStudents(circleStudents.filter((s) => s.id !== 'user'));
      setIsUserInCircle(false);
    }
  };

  const handleCheerStudent = (id: string) => {
    soundFx.playSparkle();
    setCircleStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, cheers: (s.cheers || 0) + 1 } : s))
    );
  };

  const handleToggleMilestone = (id: string) => {
    soundFx.playGentleChime(490);
    setDailyMilestones((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextDone = !m.done;
          if (nextDone) soundFx.playSparkle();
          return { ...m, done: nextDone };
        }
        return m;
      })
    );
  };

  const handleAddMilestone = () => {
    if (!newMilestoneText.trim()) return;
    soundFx.playSparkle();
    setDailyMilestones([
      ...dailyMilestones,
      { id: Date.now().toString(), title: newMilestoneText.trim(), done: false }
    ]);
    setNewMilestoneText('');
  };

  const currentCompanionAsset =
    COMPANION_OPTIONS.find((c) => c.type === state.companionType) || COMPANION_OPTIONS[0];

  const currentThemeObj = PALETTE_THEMES[state.paletteTheme] || PALETTE_THEMES.lavender;

  const completedMilestonesCount = dailyMilestones.filter((m) => m.done).length;
  const milestoneRatio = calculateMilestonesRatio(completedMilestonesCount, dailyMilestones.length);

  return (
    <div className="flex flex-col w-full min-h-screen bg-surface max-w-md mx-auto relative select-none transition-colors duration-300">
      {/* Scrollable Sanctuary Content */}
      <div className="flex-1 flex flex-col px-margin pb-24 pt-2">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between py-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-primary shadow-xs">
              <span className="material-symbols-outlined text-[18px]">spa</span>
            </div>
            <span className="text-xl font-bold text-on-surface leading-tight">HerCare</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Theme Switcher Button */}
            <button
              aria-label="Color Sanctuary Palette"
              onClick={() => {
                soundFx.playGentleChime(540);
                setActiveModal('theme_palette');
              }}
              className="px-2 py-1 rounded-full bg-surface-container text-on-surface flex items-center gap-1.5 hover:bg-surface-container-high transition-colors cursor-pointer text-[11px] font-bold shadow-2xs active:scale-95"
              type="button"
              title="Change sanctuary color theme"
            >
              <span className="w-3 h-3 rounded-full shadow-2xs border border-black/10" style={{ backgroundColor: currentThemeObj.primary }} />
              <span className="text-[10px] font-bold">{currentThemeObj.name.split(' ')[0]}</span>
              <span className="material-symbols-outlined text-[13px] text-outline">palette</span>
            </button>

            {/* Safety Helpline Button */}
            <button
              aria-label="Safety Helplines"
              onClick={() => {
                soundFx.playGentleChime(500);
                setActiveModal('crisis_shield');
              }}
              className="w-8 h-8 rounded-full bg-surface-container text-primary flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer"
              type="button"
              title="24/7 Tunisian Helplines (SAMU 190, SOS Écoute)"
            >
              <span className="material-symbols-outlined text-[17px]">verified_user</span>
            </button>

            {/* Profile Avatar */}
            <button
              aria-label="Profile and Settings"
              onClick={() => {
                soundFx.playGentleChime(500);
                setActiveTab('profile');
              }}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-sm hover:opacity-95 transition-opacity cursor-pointer font-bold text-xs"
              type="button"
            >
              {state.name ? state.name.slice(0, 1).toUpperCase() : 'Y'}
            </button>
          </div>
        </header>

        {/* Role Persona Header Badge */}
        <div className="mb-3 px-3 py-2 rounded-2xl bg-secondary-fixed/50 border border-primary/20 flex items-center justify-between text-xs shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-primary">
            <span className="material-symbols-outlined text-[18px]">
              {state.journeyType === 'graduate' ? 'work' : 'school'}
            </span>
            <span>
              {state.journeyType === 'graduate' ? 'Graduate Launchpad · Career & Job Search' : 'Student Sanctuary · Exam & PFE Support'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFx.playGentleChime(480);
              updateState({ journeyType: state.journeyType === 'graduate' ? 'student' : 'graduate' });
            }}
            className="text-[10px] text-secondary font-bold hover:underline cursor-pointer bg-white/70 px-2.5 py-1 rounded-full shadow-2xs"
            title="Switch journey mode"
          >
            Switch to {state.journeyType === 'graduate' ? 'Student' : 'Graduate'}
          </button>
        </div>

        {/* Tab 1: Home Sanctuary Screen */}
        {activeTab === 'home' && (
          <div className="flex flex-col w-full gap-3.5">
            {/* Greeting & Location */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-on-surface">
                  Sbah el khir, <span className="text-primary">{state.name || 'Yasmine'}</span> 🌸
                </h1>
                <p className="text-xs text-on-surface-variant">
                  {state.journeyType === 'graduate'
                    ? `${state.campusOrField || 'Graduate'} · Career Launch & Job Search`
                    : `${state.campusOrField || 'INSAT'} · Exam & PFE Season`}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed">
                21°C Tunis
              </span>
            </div>

            {/* Living Companion Mascot Card */}
            <div className="relative bg-gradient-to-r from-secondary-fixed/60 via-surface-container-lowest to-surface-container-lowest rounded-3xl p-3.5 shadow-sm border border-surface-container">
              <div className="flex items-center gap-3">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    soundFx.playSparkle();
                    updateState({ companionBondLevel: state.companionBondLevel + 1 });
                  }}
                  className="relative shrink-0 cursor-pointer active:scale-90 transition-transform"
                  title="Tap your companion to cheer!"
                >
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm bg-secondary-fixed p-0.5 ring-2 ring-primary/30">
                    <img alt={state.companionName} className="w-full h-full object-cover rounded-2xl" src={currentCompanionAsset.image} />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-[10px] shadow-xs">
                    ★
                  </span>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-on-surface">{state.companionName || 'Lumi'}</span>
                    <span className="text-[10px] text-secondary font-semibold">Bond: Level {state.companionBondLevel}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-snug truncate">
                    {state.journeyType === 'graduate'
                      ? '"Your worth is not defined by recruiter replies. Step by step! 🌸"'
                      : '"Take it step by step today. You’re doing great! 🌸"'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => {
                        soundFx.playGentleChime(500);
                        setActiveTab('companion');
                      }}
                      className="px-3.5 py-1 rounded-full bg-primary text-white text-[11px] font-semibold flex items-center gap-1 shadow-2xs active:scale-95 transition-transform cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[13px]">chat_bubble</span>
                      <span>Chat in Derja</span>
                    </button>
                    <button
                      onClick={handleToggleLofi}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                        isLofiOn
                          ? 'bg-secondary text-white shadow-2xs'
                          : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                      }`}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isLofiOn ? 'volume_up' : 'headphones'}
                      </span>
                      <span>{isLofiOn ? 'Playing ♫' : 'Soundscape'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Emotional Battery Check-in */}
            <div className="p-3.5 rounded-3xl bg-surface-container-lowest shadow-sm border border-surface-container">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-on-surface">How is your emotional battery right now?</span>
                <span className="text-[10px] text-secondary font-semibold">Tap to check in</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'Energized', icon: '⚡', label: 'High' },
                  { id: 'Neutral', icon: '🌿', label: 'Calm' },
                  { id: 'Anxious', icon: '💭', label: 'Tense' },
                  { id: 'Exhausted', icon: '🌙', label: 'Drained' }
                ].map((feel) => {
                  const isSelected = loggedFeeling === feel.id;
                  return (
                    <button
                      key={feel.id}
                      type="button"
                      onClick={() => {
                        soundFx.playGentleChime(480);
                        setLoggedFeeling(feel.id);
                        handleLogFeeling();
                      }}
                      className={`flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'bg-secondary-fixed ring-2 ring-primary text-on-secondary-fixed font-bold shadow-xs'
                          : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <span className="text-lg mb-0.5">{feel.icon}</span>
                      <span className="text-[11px] font-medium">{feel.label}</span>
                    </button>
                  );
                })}
              </div>

              {feelingSuccessMsg && (
                <div className="mt-2.5 p-2 rounded-xl bg-secondary-fixed/50 text-[11px] font-semibold text-primary text-center">
                  🌸 {feelingSuccessMsg}
                </div>
              )}
            </div>

            {/* Persona-Differentiated Core Features */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  {state.journeyType === 'graduate' ? 'Career Launchpad Tools' : 'Core Study Tools'}
                </span>
                <button
                  onClick={() => {
                    soundFx.playGentleChime(520);
                    setActiveTab('plan');
                  }}
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>View All</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>

              {state.journeyType === 'graduate' ? (
                /* Graduate Core Feature Cards */
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playGentleChime(528);
                      setActiveModal('identity_bridge');
                    }}
                    className="p-3.5 rounded-3xl bg-surface-container-lowest hover:bg-surface-container-low shadow-sm border border-primary/20 flex flex-col justify-between text-left active:scale-98 transition-all cursor-pointer min-h-[110px]"
                  >
                    <div className="w-9 h-9 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary mb-2 shadow-2xs">
                      <span className="material-symbols-outlined text-[20px]">work_history</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-on-surface">Identity Bridge</h3>
                      <p className="text-[10px] text-on-surface-variant line-clamp-2 mt-0.5">
                        Turn PFE &amp; university projects into verified CV bullets
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playGentleChime(540);
                      setActiveModal('brain_dump');
                    }}
                    className="p-3.5 rounded-3xl bg-surface-container-lowest hover:bg-surface-container-low shadow-sm border border-secondary/20 flex flex-col justify-between text-left active:scale-98 transition-all cursor-pointer min-h-[110px]"
                  >
                    <div className="w-9 h-9 rounded-2xl bg-secondary-fixed flex items-center justify-center text-primary mb-2 shadow-2xs">
                      <span className="material-symbols-outlined text-[20px]">psychology</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-on-surface">Career Brain Dump</h3>
                      <p className="text-[10px] text-on-surface-variant line-clamp-2 mt-0.5">
                        Untangle applications, interviews &amp; career anxiety
                      </p>
                    </div>
                  </button>
                </div>
              ) : (
                /* Student Core Feature Cards */
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playGentleChime(540);
                      setActiveModal('pfe_breaker');
                    }}
                    className="p-3.5 rounded-3xl bg-surface-container-lowest hover:bg-surface-container-low shadow-sm border border-primary/20 flex flex-col justify-between text-left active:scale-98 transition-all cursor-pointer min-h-[110px]"
                  >
                    <div className="w-9 h-9 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary mb-2 shadow-2xs">
                      <span className="material-symbols-outlined text-[20px]">timer</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-on-surface">Tiny Wins Engine</h3>
                      <p className="text-[10px] text-on-surface-variant line-clamp-2 mt-0.5">
                        Break PFE thesis &amp; exam chapters into 2–15m steps
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playGentleChime(528);
                      setActiveModal('brain_dump');
                    }}
                    className="p-3.5 rounded-3xl bg-surface-container-lowest hover:bg-surface-container-low shadow-sm border border-secondary/20 flex flex-col justify-between text-left active:scale-98 transition-all cursor-pointer min-h-[110px]"
                  >
                    <div className="w-9 h-9 rounded-2xl bg-secondary-fixed flex items-center justify-center text-primary mb-2 shadow-2xs">
                      <span className="material-symbols-outlined text-[20px]">psychology</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-on-surface">Brain Dump → Map</h3>
                      <p className="text-[10px] text-on-surface-variant line-clamp-2 mt-0.5">
                        Untangle syllabus clutter into controllable micro-tasks
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Relaxation Bar */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundFx.playGentleChime(528);
                  setActiveModal('breathe');
                }}
                className="p-3 rounded-2xl bg-surface-container-lowest hover:bg-surface-container-low border border-surface-container shadow-2xs flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
              >
                <div className="w-8 h-8 rounded-xl bg-secondary-fixed flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[18px]">air</span>
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-on-surface">Box Breathing</div>
                  <div className="text-[10px] text-on-surface-variant">3m nervous reset</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playSparkle();
                  setActiveModal('garden');
                }}
                className="p-3 rounded-2xl bg-surface-container-lowest hover:bg-surface-container-low border border-surface-container shadow-2xs flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                  <span className="material-symbols-outlined text-[18px]">yard</span>
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-on-surface">Comeback Garden</div>
                  <div className="text-[10px] text-on-surface-variant">Zero-guilt blooms</div>
                </div>
              </button>
            </div>

            {/* Today's Core Focus / Milestones */}
            <div className="bg-surface-container-lowest p-4 rounded-3xl shadow-sm border border-surface-container flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">
                  {state.journeyType === 'graduate' ? "Today's Career Focus" : "Today's Study Intentions"}
                </span>
                <span className="text-[11px] font-bold text-primary">{milestoneRatio.percent}% Completed</span>
              </div>

              <div className="flex flex-col gap-2">
                {dailyMilestones.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low">
                    <span className={`text-xs ${item.done ? 'line-through text-outline' : 'text-on-surface font-medium'}`}>
                      {item.title}
                    </span>
                    <button
                      onClick={() => handleToggleMilestone(item.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs cursor-pointer transition-all ${
                        item.done ? 'bg-primary' : 'border border-outline hover:bg-surface-container'
                      }`}
                    >
                      {item.done && '✓'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* Tab 2: Companion Chat with Real Gemini AI & Safety Net */}
        {activeTab === 'companion' && (
          <div className="flex flex-col flex-1 h-[72vh]">
            <div className="p-3.5 rounded-2xl bg-secondary-fixed flex items-center justify-between mb-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-white ring-2 ring-primary">
                  <img alt={state.companionName} className="w-full h-full object-cover" src={currentCompanionAsset.image} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-bold text-on-secondary-fixed">{state.companionName || 'Lumi'}</h2>
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  </div>
                  <span className="text-[11px] text-on-secondary-fixed-variant">
                    Gemini Live Sister Companion · Authentic Derja &amp; Safety Shield
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    soundFx.speakText(
                      `Marhba bik ${state.name}! I am listening with an open heart. Whatever is stressing you out today, you don't have to carry it alone.`,
                      state.language,
                      state.spiritType
                    );
                  }}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-primary shadow-xs cursor-pointer"
                  title="Speak greeting"
                >
                  <span className="material-symbols-outlined text-[18px]">volume_up</span>
                </button>
              </div>
            </div>

            {/* Quick prompt pills tailored for Tunisian student challenges */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar mb-2">
              {[
                'Exam Panic: 3 days left',
                'PFE Thesis paralysis at INSAT',
                'Derja cheer: 9oli klem yfarhedni 🌸',
                'Feeling like an imposter',
                '⚠️ Safety Net Test (I feel hopeless and want to end it)'
              ].map((promptText, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(promptText)}
                  className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                    promptText.includes('Safety Net')
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {promptText}
                </button>
              ))}
            </div>

            {/* Chat message stream */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-surface-container-lowest rounded-3xl mb-3 shadow-inner">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed relative ${
                      msg.sender === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-secondary-fixed text-on-secondary-fixed rounded-tl-none shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    {msg.audioUrl && (
                      <audio controls src={msg.audioUrl} className="mt-2 w-full h-8 rounded-lg" />
                    )}
                    {msg.sender === 'lumi' && (
                      <button
                        onClick={() => soundFx.speakText(msg.text, state.language)}
                        className="mt-1 text-primary hover:opacity-80 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[13px]">volume_up</span>
                        <span>Listen</span>
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-outline mt-1 px-1">{msg.time}</span>
                </div>
              ))}
              {isCompanionTyping && (
                <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-secondary-fixed text-primary text-xs w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-150" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-300" />
                  <span className="text-[11px] font-medium ml-1">{state.companionName || 'Lumi'} is thinking gently...</span>
                </div>
              )}
            </div>

            {/* Input bar */}
            <div className="flex items-center gap-2 bg-surface-container-low p-2 rounded-full shadow-sm">
              <button
                type="button"
                onClick={startRealMicrophone}
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-colors ${
                  isRecording ? 'bg-error text-white animate-pulse' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
                title="Talk directly (Voice Input)"
              >
                <span className="material-symbols-outlined text-[18px]">{isRecording ? 'mic' : 'mic_none'}</span>
              </button>
              <input
                type="text"
                placeholder={isRecording ? 'Recording voice note...' : `Talk with ${state.companionName || 'Lumi'} in Derja, French, or English...`}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                className="flex-1 bg-transparent px-3 text-xs text-on-surface outline-none"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-sm cursor-pointer hover:opacity-95"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Study & PFE (Student) / Career Hub (Graduate) */}
        {activeTab === 'plan' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-on-surface">
                {state.journeyType === 'graduate' ? 'Career & Job Search Hub' : 'Study & PFE Sanctuary'}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {state.journeyType === 'graduate'
                  ? 'Turn university achievements into recruiter bullets, pace job applications, and prepare for interviews.'
                  : `Paced thesis milestones, exam revision sprints, and study rhythm for ${state.campusOrField || 'your university in Tunisia'}.`}
              </p>
            </div>

            {state.journeyType === 'graduate' ? (
              /* Graduate Three Key Tools */
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playGentleChime(520);
                    setActiveModal('identity_bridge');
                  }}
                  className="p-4 rounded-3xl bg-surface-container-lowest hover:bg-surface-container-low border border-primary/25 shadow-xs flex items-center justify-between text-left active:scale-98 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary shrink-0 shadow-2xs">
                      <span className="material-symbols-outlined text-[24px]">work_history</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-on-surface">Identity Bridge: Academic to CV Bullets</h3>
                      <p className="text-[11px] text-on-surface-variant">
                        Transform university course projects &amp; PFE into verified recruiter evidence
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary flex items-center gap-0.5 shrink-0 pl-2">
                    <span>Open</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playGentleChime(540);
                      setActiveModal('pfe_breaker');
                    }}
                    className="p-3.5 rounded-2xl bg-surface-container-lowest hover:bg-surface-container-low border border-surface-container shadow-2xs text-left flex flex-col justify-between active:scale-98 transition-all cursor-pointer min-h-[95px]"
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary-fixed text-primary flex items-center justify-center mb-1">
                      <span className="material-symbols-outlined text-[18px]">timer</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-on-surface">Application Sprints</h3>
                      <p className="text-[10px] text-on-surface-variant">10–15m low-friction pacing</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playGentleChime(528);
                      setActiveModal('brain_dump');
                    }}
                    className="p-3.5 rounded-2xl bg-surface-container-lowest hover:bg-surface-container-low border border-surface-container shadow-2xs text-left flex flex-col justify-between active:scale-98 transition-all cursor-pointer min-h-[95px]"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center mb-1">
                      <span className="material-symbols-outlined text-[18px]">psychology</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-on-surface">Career Brain Dump</h3>
                      <p className="text-[10px] text-on-surface-variant">Untangle search doubts</p>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              /* Student Dual Actions: Brain Dump & Tiny Wins */
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playGentleChime(540);
                    setActiveModal('pfe_breaker');
                  }}
                  className="p-3.5 rounded-2xl bg-gradient-to-br from-primary-fixed to-secondary-fixed/50 border border-primary/20 text-left flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all active:scale-98 cursor-pointer min-h-[100px]"
                >
                  <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center mb-1 shadow-xs">
                    <span className="material-symbols-outlined text-[18px]">timer</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-on-surface">Tiny Wins (2–15m)</h3>
                    <p className="text-[10px] text-on-surface-variant line-clamp-1">PFE &amp; exam micro-steps</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playGentleChime(528);
                    setActiveModal('brain_dump');
                  }}
                  className="p-3.5 rounded-2xl bg-gradient-to-br from-secondary-fixed/80 to-surface-container-lowest border border-secondary/20 text-left flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all active:scale-98 cursor-pointer min-h-[100px]"
                >
                  <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center mb-1 shadow-xs">
                    <span className="material-symbols-outlined text-[18px]">psychology</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-on-surface">Brain Dump → Map</h3>
                    <p className="text-[10px] text-on-surface-variant line-clamp-1">Untangle syllabus clutter</p>
                  </div>
                </button>
              </div>
            )}

            {/* Confirmed Planner Tasks (from Brain Dump & Tiny Wins) */}
            {state.plannerTasks && state.plannerTasks.length > 0 && (
              <div className="bg-surface-container-lowest p-4 rounded-3xl shadow-sm border border-surface-container flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">task_alt</span>
                    <span>Confirmed Action Plan ({state.plannerTasks.filter((t) => t.done).length}/{state.plannerTasks.length})</span>
                  </span>
                  <button
                    onClick={() => {
                      soundFx.playSparkle();
                      setActiveModal('garden');
                    }}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>🌸 Garden Blooms</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {state.plannerTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 rounded-2xl flex items-center justify-between transition-all ${
                        task.done
                          ? 'bg-surface-container-low/60 border border-transparent opacity-70'
                          : 'bg-surface-container-low border border-surface-container shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => handleTogglePlannerTask(task.id)}
                          className="w-4 h-4 rounded text-primary accent-primary cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs block truncate ${task.done ? 'line-through text-outline' : 'text-on-surface font-medium'}`}>
                            {task.title}
                          </span>
                          <span className="text-[10px] text-secondary font-semibold">
                            ⏱️ {task.durationMinutes}m · {task.source.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleStartMicroStepTimer({
                            stepNumber: 1,
                            title: task.title,
                            durationMinutes: task.durationMinutes,
                            actionDetail: task.title,
                            circadianRest: 'Drink fresh water and soften your jaw.'
                          });
                        }}
                        className="px-2 py-1 rounded-full bg-surface-container hover:bg-secondary-fixed text-primary text-[10px] font-bold shrink-0 cursor-pointer"
                      >
                        Timer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Milestones */}
            <div className="bg-surface-container-lowest p-4 rounded-3xl shadow-sm border border-surface-container flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary">Daily Sanctuary Milestones</span>
                <span className="text-xs font-bold text-secondary">{milestoneRatio.percent}% Completed</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${milestoneRatio.percent}%` }} />
              </div>

              <div className="flex flex-col gap-2 mt-1">
                {dailyMilestones.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low">
                    <span className={`text-xs ${item.done ? 'line-through text-outline' : 'text-on-surface font-medium'}`}>
                      {item.title}
                    </span>
                    <button
                      onClick={() => handleToggleMilestone(item.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs cursor-pointer transition-all ${
                        item.done ? 'bg-primary' : 'border border-outline hover:bg-surface-container'
                      }`}
                    >
                      {item.done && '✓'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add milestone */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-surface-container">
                <input
                  type="text"
                  placeholder="Add a gentle micro-milestone..."
                  value={newMilestoneText}
                  onChange={(e) => setNewMilestoneText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddMilestone();
                  }}
                  className="flex-1 text-xs bg-surface-container-low px-3 py-2 rounded-xl outline-none text-on-surface"
                />
                <button
                  onClick={handleAddMilestone}
                  className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer hover:opacity-95"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Exam & Defense Timeline */}
            <div className="bg-surface-container-lowest p-4 rounded-3xl shadow-sm border border-surface-container flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Upcoming Checkpoints</span>
                <span className="material-symbols-outlined text-primary text-[18px]">event_upcoming</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {deadlines.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-on-surface">{d.name}</span>
                      <span className="text-[11px] text-primary font-semibold">{d.date}</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed">
                      {d.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Sanctuary Hub */}
        {activeTab === 'sanctuary' && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold text-on-surface">Sanctuary Vault</h2>
              <p className="text-xs text-on-surface-variant">
                Confidential, stigma-free AI tools adapted for female student &amp; graduate well-being in Tunisia.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Space 0: Comeback Garden */}
              <div className="p-4 rounded-3xl bg-surface-container-lowest shadow-sm flex items-center justify-between border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                    <span className="material-symbols-outlined text-[20px]">yard</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-on-surface">The Comeback Garden</h3>
                    <p className="text-[11px] text-on-surface-variant">Zero-guilt blooms celebrating every micro-step</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundFx.playSparkle();
                    setActiveModal('garden');
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold cursor-pointer shadow-xs active:scale-95"
                >
                  Garden 🌸
                </button>
              </div>

              {/* Space 0B: Brain Dump */}
              <div className="p-4 rounded-3xl bg-surface-container-lowest shadow-sm flex items-center justify-between border border-surface-container">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-secondary-fixed flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">psychology</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-on-surface">Brain Dump → Brain Map</h3>
                    <p className="text-[11px] text-on-surface-variant">Untangle mental clutter into controllable tasks</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundFx.playGentleChime(528);
                    setActiveModal('brain_dump');
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-primary text-white text-xs font-bold cursor-pointer shadow-xs active:scale-95"
                >
                  Dump
                </button>
              </div>
              {/* Space 1: AI Sentiment & Burnout Radar */}
              <div className="p-4 rounded-3xl bg-surface-container-lowest shadow-sm flex items-center justify-between border border-surface-container">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-secondary-fixed flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">insights</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-on-surface">AI Burnout &amp; Distortion Radar</h3>
                    <p className="text-[11px] text-on-surface-variant">4-axis somatic metrics &amp; cognitive insights</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundFx.playGentleChime(528);
                    setActiveModal('burnout_radar');
                    if (!sentimentResult) handleAnalyzeSentiment();
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-primary text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Analyze
                </button>
              </div>

              {/* Space 2: AI Micro-Pacing Optimizer */}
              <div className="p-4 rounded-3xl bg-surface-container-lowest shadow-sm flex items-center justify-between border border-surface-container">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-secondary-fixed flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">schedule</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-on-surface">AI Micro-Pacing Optimizer</h3>
                    <p className="text-[11px] text-on-surface-variant">Three 15-min micro-steps with circadian rest</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundFx.playGentleChime(528);
                    setActiveModal('pfe_breaker');
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-primary text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Pacing
                </button>
              </div>

              {/* Space 3: Private AI Venting Diary */}
              <div className="p-4 rounded-3xl bg-surface-container-lowest shadow-sm flex items-center justify-between border border-surface-container">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">psychology_alt</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-on-surface">Sisterly CBT Reframe Diary</h3>
                    <p className="text-[11px] text-on-surface-variant">Cognitive restructuring in Derja &amp; French</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundFx.playGentleChime(500);
                    setActiveModal('venting');
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-primary text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Reflect
                </button>
              </div>

              {/* Space 4: Box Breathing */}
              <div className="p-4 rounded-3xl bg-surface-container-lowest shadow-sm flex items-center justify-between border border-surface-container">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-secondary-fixed flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">air</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-on-surface">3-Minute Box Breathing</h3>
                    <p className="text-[11px] text-on-surface-variant">Calms vagus nerve &amp; reduces exam panic</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundFx.playGentleChime(528);
                    setActiveModal('breathe');
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-primary text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Breathe
                </button>
              </div>

              {/* Space 5: Soundscapes */}
              <div className="p-4 rounded-3xl bg-surface-container-lowest shadow-sm flex items-center justify-between border border-surface-container">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-container">
                    <span className="material-symbols-outlined text-[20px]">waves</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-on-surface">Tunisian Soundscapes</h3>
                    <p className="text-[11px] text-on-surface-variant">Sidi Bou Said waves &amp; Jasmine rain</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundFx.playGentleChime(480);
                    setActiveModal('soundscapes');
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-secondary text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Listen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Garden & You (Profile, Comeback Garden, Themes & Safety) */}
        {activeTab === 'profile' && (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-3xl bg-secondary-fixed shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl shadow-sm">
                  {state.name ? state.name.slice(0, 1).toUpperCase() : 'Y'}
                </div>
                <div className="flex flex-col">
                  <h2 className="text-base font-bold text-on-secondary-fixed">{state.name || 'Yasmine'}</h2>
                  <span className="text-xs text-on-secondary-fixed-variant">
                    {state.campusOrField || 'INSAT, Université de Tunis'}
                  </span>
                  <span className="text-[11px] font-semibold text-primary mt-0.5">
                    Companion: {state.companionName || 'Lumi'} ({state.companionType})
                  </span>
                </div>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/80 text-primary shadow-2xs font-mono">
                {state.journeyType === 'graduate' ? 'Graduate' : 'Student'}
              </span>
            </div>

            {/* The Comeback Garden Feature Card */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-surface-container-lowest to-surface-container-lowest border border-emerald-500/30 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-2xl shadow-2xs">
                  🌸
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">The Comeback Garden</h3>
                  <p className="text-[11px] text-on-surface-variant">
                    {state.gardenPlants && state.gardenPlants.length > 0
                      ? `${state.gardenPlants.length} blooms flourishing in your sanctuary`
                      : 'Zero-guilt blooms for every gentle step'}
                  </p>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block mt-0.5">
                    Never withers when you pause or take days off
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFx.playSparkle();
                  setActiveModal('garden');
                }}
                className="px-3.5 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold cursor-pointer hover:bg-emerald-700 active:scale-95 transition-all shadow-xs shrink-0"
              >
                Open Garden
              </button>
            </div>

            {/* Journey Mode Selection */}
            <div className="bg-surface-container-lowest p-4 rounded-3xl shadow-sm border border-surface-container flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">Journey Mode</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed">
                  {state.journeyType === 'graduate' ? 'Recent Graduate' : 'University Student'}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {state.journeyType === 'graduate'
                  ? 'Your app is tuned for job search organization, CV translation, interview calming & career launch.'
                  : 'Your app is tuned for university exams, PFE thesis pacing, semester courses & study calm.'}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playGentleChime(480);
                    updateState({ journeyType: 'student' });
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    state.journeyType === 'student'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">school</span>
                  <span>Student Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playGentleChime(480);
                    updateState({ journeyType: 'graduate' });
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    state.journeyType === 'graduate'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">work</span>
                  <span>Graduate Mode</span>
                </button>
              </div>
            </div>

            {/* Safety & Non-Diagnostic Guarantee Card */}
            <div className="bg-surface-container-lowest p-4 rounded-3xl shadow-sm border border-surface-container flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-secondary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[22px]">verified_user</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-on-surface">Verified Safety Shield</h3>
                  <p className="text-[11px] text-on-surface-variant">SAMU 190, Protection Civile 198, SOS Écoute</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal('crisis_shield')}
                className="px-3.5 py-1.5 rounded-full bg-primary text-white text-xs font-bold cursor-pointer"
              >
                View
              </button>
            </div>

            {/* Quick Palette Picker */}
            <div className="bg-surface-container-lowest p-4 rounded-3xl shadow-sm border border-surface-container flex flex-col gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">Live Theme Palette</span>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(PALETTE_THEMES).map((theme) => {
                  const isSelected = state.paletteTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        soundFx.playGentleChime(540);
                        updateState({ paletteTheme: theme.id });
                      }}
                      className={`p-2.5 rounded-2xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer border ${
                        isSelected
                          ? 'ring-2 ring-primary shadow-sm bg-surface-container-low border-primary/40'
                          : 'border-surface-container bg-surface-container-low/60 hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full shadow-2xs border border-black/5" style={{ backgroundColor: theme.primary }} />
                        <span className="w-3 h-3 rounded-full shadow-2xs border border-black/5" style={{ backgroundColor: theme.secondaryContainer }} />
                      </div>
                      <span className="truncate w-full text-center text-[11px] font-bold text-on-surface">
                        {theme.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Companion Changer */}
            <div className="bg-surface-container-lowest p-4 rounded-3xl shadow-sm border border-surface-container flex flex-col gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">Switch Companion</span>
              <div className="grid grid-cols-3 gap-2">
                {COMPANION_OPTIONS.map((c) => {
                  const isSelected = state.companionType === c.type;
                  return (
                    <button
                      key={c.type}
                      onClick={() => {
                        soundFx.playSparkle();
                        updateState({ companionType: c.type });
                      }}
                      className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        isSelected ? 'bg-secondary-fixed ring-2 ring-primary' : 'bg-surface-container-low'
                      }`}
                    >
                      <img alt={c.name} className="w-10 h-10 rounded-full object-cover" src={c.image} />
                      <span className="text-[11px]">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation options */}
            <div className="bg-surface-container-lowest p-4 rounded-3xl shadow-sm border border-surface-container flex flex-col gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary mb-1">Sanctuary Setup</h3>
              <button
                onClick={onRevisitOnboarding}
                className="w-full py-2.5 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center justify-between cursor-pointer"
              >
                <span>Revisit Onboarding Screens (15 Screens)</span>
                <span className="material-symbols-outlined text-[16px]">tune</span>
              </button>
              <button
                onClick={onOpenSettings}
                className="w-full py-2.5 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center justify-between cursor-pointer"
              >
                <span>Color Sanctuary Studio</span>
                <span className="material-symbols-outlined text-[16px]">palette</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* Interactive Modals */}
      {/* ========================================================================= */}

      {/* MODAL 1: AI Cognitive Sentiment & Burnout Risk Radar Modal */}
      {activeModal === 'burnout_radar' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm max-h-[88vh] overflow-y-auto">
            <SentimentBurnoutAnalyzer
              state={state}
              updateState={updateState}
              onClose={() => setActiveModal(null)}
              onLaunchBreathing={() => {
                soundFx.playGentleChime(528);
                setActiveModal('breathe');
              }}
              onLaunchMicroPacing={(taskSnippet) => {
                soundFx.playGentleChime(528);
                if (taskSnippet) setPfeTaskInput(taskSnippet.slice(0, 80));
                setActiveModal('pfe_breaker');
              }}
              onLaunchVenting={() => {
                soundFx.playGentleChime(500);
                setActiveModal('venting');
              }}
              onTalkToCompanion={(prompt) => {
                setActiveModal(null);
                setActiveTab('companion');
                if (prompt) handleSendMessage(prompt);
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL 2: AI Micro-Pacing Scheduling Optimizer Modal */}
      {activeModal === 'pfe_breaker' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl p-5 shadow-xl flex flex-col relative max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">timer</span>
                Tiny Wins Engine · Circadian Pacing
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <h2 className="text-lg font-bold text-on-surface mb-1">
              {isMinimumViablePlan ? '🌱 Minimum Viable Plan (Low-Battery Mode)' : 'Circadian Tiny Wins Deconstruction'}
            </h2>
            <p className="text-xs text-on-surface-variant mb-3">
              {isMinimumViablePlan
                ? 'When you are completely exhausted, 1 tiny micro-action and deep rest is 100% enough. Zero guilt.'
                : 'Overcome paralysis by breaking overwhelming goals into bite-sized, low-friction micro-sprints.'}
            </p>

            {/* Time Sizing Tiers */}
            <div className="mb-3 p-2.5 rounded-2xl bg-surface-container-low border border-surface-container">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-on-surface">Choose your step size:</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextMvp = !isMinimumViablePlan;
                    setIsMinimumViablePlan(nextMvp);
                    if (nextMvp) setSelectedDuration(2);
                    else setSelectedDuration(15);
                  }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                    isMinimumViablePlan
                      ? 'bg-primary text-white'
                      : 'bg-surface-container text-secondary hover:bg-surface-container-high'
                  }`}
                >
                  {isMinimumViablePlan ? '⚡ Low Battery Active' : '🔋 Low Battery? Try MVP'}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[2, 5, 10, 15].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      soundFx.playGentleChime(480);
                      setSelectedDuration(mins);
                    }}
                    className={`py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedDuration === mins
                        ? 'bg-primary text-white shadow-2xs'
                        : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Presets for Students & Graduates */}
            <div className="flex flex-col gap-1 mb-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                {state.journeyType === 'graduate' ? 'Graduate Presets:' : 'Student Presets:'}
              </span>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {(state.journeyType === 'graduate'
                  ? [
                      {
                        title: 'CV Bullet Polish',
                        task: 'Refine 3 technical bullets on CV for junior software engineer role',
                        deadline: 'Tomorrow'
                      },
                      {
                        title: 'Recruiter Follow-up',
                        task: 'Draft polite LinkedIn reply to recruiter screening request',
                        deadline: 'Today'
                      },
                      {
                        title: 'Interview Prep',
                        task: 'Practice 2 common behavioral interview questions with structured STAR method',
                        deadline: 'This week'
                      }
                    ]
                  : [
                      {
                        title: '40p ML & PFE Bibliography',
                        task: '40 pages Machine Learning revision & overdue PFE bibliography',
                        deadline: 'Saturday (3 days left)'
                      },
                      {
                        title: 'Signal Processing Concours',
                        task: '5 chapters of Signal Processing & exam problem sets',
                        deadline: 'Next Monday'
                      },
                      {
                        title: 'PFE Conclusion & Slides',
                        task: 'Draft PFE conclusion, future works, and 10 defense slides',
                        deadline: 'End of week'
                      }
                    ]
                ).map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setPfeTaskInput(p.task);
                      setPfeDeadlineInput(p.deadline);
                      handleGenerateMicroPacing(p.task, p.deadline);
                    }}
                    className="shrink-0 px-2.5 py-1 rounded-full bg-surface-container hover:bg-secondary-fixed text-[10px] font-semibold text-on-surface cursor-pointer"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-3">
              <label className="text-[11px] font-bold text-on-surface">Goal or Task to Deconstruct:</label>
              <input
                type="text"
                value={pfeTaskInput}
                onChange={(e) => setPfeTaskInput(e.target.value)}
                placeholder="e.g. 40 pages Machine Learning or PFE Chapter 2"
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low text-on-surface outline-none border border-surface-container"
              />
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-on-surface-variant shrink-0">Due:</label>
                <input
                  type="text"
                  value={pfeDeadlineInput}
                  onChange={(e) => setPfeDeadlineInput(e.target.value)}
                  placeholder="e.g. Next Monday"
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-surface-container-low text-on-surface outline-none border border-surface-container"
                />
              </div>
            </div>

            <button
              onClick={() => handleGenerateMicroPacing()}
              disabled={isGeneratingMicroPacing || !pfeTaskInput.trim()}
              className="w-full py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 mb-2 active:scale-98 transition-transform"
            >
              {isGeneratingMicroPacing ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>Companion is calculating tiny wins...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  <span>Generate {selectedDuration}-Min Tiny Wins</span>
                </>
              )}
            </button>

            {microPacingResult && (
              <div className="mt-3 pt-3 border-t border-surface-container flex flex-col gap-3 animate-fade-in">
                <div className="p-3 rounded-2xl bg-secondary-fixed/50 border border-secondary-fixed">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Mindset Reframe</span>
                  <p className="text-xs text-on-secondary-fixed font-medium mt-1 leading-snug">
                    {microPacingResult.mindsetReframe}
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-on-surface">
                    {isMinimumViablePlan ? 'Your Minimum Viable Step:' : `Your ${selectedDuration}-Minute Sprints:`}
                  </span>
                  {microPacingResult.microSteps.map((step, idx) => {
                    const stepFeedback = actionFeedbackMap[`step-${idx}`];
                    return (
                      <div key={idx} className="p-3 rounded-2xl bg-surface-container-low flex flex-col gap-1.5 border border-surface-container">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                              {step.stepNumber}
                            </span>
                            <span className="text-xs font-bold text-on-surface">{step.title}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-primary">
                            {step.durationMinutes} mins
                          </span>
                        </div>

                        <p className="text-xs text-on-surface leading-snug pl-7">{step.actionDetail}</p>

                        <div className="pl-7 text-[11px] font-semibold text-secondary flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[13px]">eco</span>
                          <span>Circadian Pause: {step.circadianRest}</span>
                        </div>

                        {/* Micro-Step Actions */}
                        <div className="flex items-center justify-between pl-7 pt-1 flex-wrap gap-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartMicroStepTimer(step)}
                              className="px-2.5 py-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:opacity-90 active:scale-95"
                            >
                              <span className="material-symbols-outlined text-[12px]">play_arrow</span>
                              <span>Start {step.durationMinutes}m</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddStepToMilestones(step)}
                              className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-secondary-fixed text-[10px] font-semibold text-on-surface flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[12px]">add</span>
                              <span>Add to Plan</span>
                            </button>
                          </div>

                          {/* Adaptive Feedback Buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              title="This step size feels right"
                              onClick={() => handleRecordFeedback(idx, step, 'helpful')}
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                                stepFeedback === 'helpful'
                                  ? 'bg-emerald-500 text-white font-bold'
                                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                              }`}
                            >
                              👍 Good
                            </button>
                            <button
                              type="button"
                              title="Step feels too heavy - make smaller"
                              onClick={() => handleRecordFeedback(idx, step, 'too_difficult')}
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                                stepFeedback === 'too_difficult'
                                  ? 'bg-amber-500 text-white font-bold'
                                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                              }`}
                            >
                              ⚡ Too heavy
                            </button>
                            <button
                              type="button"
                              title="Not relevant right now"
                              onClick={() => handleRecordFeedback(idx, step, 'irrelevant')}
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                                stepFeedback === 'irrelevant'
                                  ? 'bg-slate-400 text-white font-bold'
                                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                              }`}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-2 rounded-xl bg-tertiary-fixed/40 text-center text-[11px] font-semibold text-on-tertiary-container italic">
                  "{microPacingResult.affirmation}"
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Venting Space Modal with AI Cognitive Reframing */}
      {activeModal === 'venting' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl p-5 shadow-xl flex flex-col relative max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">lock</span>
                Private &amp; Confidential
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <h2 className="text-lg font-bold text-on-surface mb-1">AI Venting &amp; CBT Sanctuary</h2>
            <p className="text-xs text-on-surface-variant mb-2">
              Pour out raw thoughts without self-censorship. Lumi provides compassionate cognitive restructuring.
            </p>

            {/* Quick Demo Vent Presets */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-2">
              {[
                { label: 'INSAT Imposter', text: "Everyone in my class seems to finish their projects so quickly, and I feel like an absolute fraud who shouldn't be here." },
                { label: 'PFE Feedback Panic', text: "My supervisor criticized my Chapter 2 draft today and I feel sick to my stomach. I can't write a single word now." },
                { label: 'Family Expectation', text: "My family sacrificed so much for my engineering studies in Tunis. If I don't pass this semester, I will let everyone down." }
              ].map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setVentText(p.text)}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-surface-container hover:bg-secondary-fixed text-[10px] font-semibold text-on-surface cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5 mb-2 overflow-x-auto no-scrollbar">
              {(['Exam Stress', 'PFE Pressure', 'Fatigue', 'Gratitude'] as const).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setVentTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer ${
                    ventTag === tag ? 'bg-primary text-white' : 'bg-surface-container text-on-surface'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              value={ventText}
              onChange={(e) => setVentText(e.target.value)}
              placeholder="Write freely... zero judgment safe space."
              className="w-full p-3 rounded-2xl bg-surface-container-low text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary/40 resize-none mb-2.5"
            />

            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={handleReframeVent}
                disabled={isReframingVent || !ventText.trim()}
                className="flex-1 py-2 px-3 rounded-xl bg-secondary-fixed text-on-secondary-fixed text-xs font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isReframingVent ? (
                  <>
                    <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                    <span>Reframing...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    <span>Sisterly CBT Reframe ✨</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSaveVenting}
                disabled={!ventText.trim()}
                className="py-2 px-4 rounded-xl bg-primary text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                Save
              </button>
            </div>

            {/* AI Reframing Card */}
            {activeReframingResult && (
              <div className="p-3.5 rounded-2xl bg-secondary-fixed/40 border border-secondary-fixed mb-3 flex flex-col gap-2 text-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">lightbulb</span>
                    Gentle Cognitive Shift
                  </span>
                  <span className="text-[10px] text-outline">Non-diagnostic</span>
                </div>
                <p className="text-on-surface leading-snug">
                  <strong className="text-primary">Validation:</strong> {activeReframingResult.validation}
                </p>
                {activeReframingResult.distortionInsight && (
                  <p className="text-on-surface-variant text-[11px] italic">
                    💡 {activeReframingResult.distortionInsight}
                  </p>
                )}
                <p className="text-on-surface leading-snug font-medium">
                  🌿 <strong>Grounded Reframe:</strong> {activeReframingResult.gentleReframe}
                </p>
                <div className="p-2 rounded-xl bg-white/70 text-[11px] font-semibold text-secondary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">self_improvement</span>
                  <span>Somatic Anchor: {activeReframingResult.microAction}</span>
                </div>
                {activeReframingResult.derjaWhisper && (
                  <div className="p-2 rounded-xl bg-primary/10 text-[11px] font-bold text-primary flex items-center gap-1">
                    <span>🌸</span>
                    <span>"{activeReframingResult.derjaWhisper}"</span>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                soundFx.playGentleChime(528);
                setActiveModal('burnout_radar');
              }}
              className="w-full py-2 px-3 rounded-xl bg-surface-container hover:bg-secondary-fixed text-primary text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs mb-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">radar</span>
              <span>Open in AI Well-Being &amp; Burnout Radar ✨</span>
            </button>

            {/* Previous reflections */}
            {state.ventingEntries.length > 0 && (
              <div className="mt-2 pt-3 border-t border-surface-container flex flex-col gap-2">
                <span className="text-[11px] font-bold text-outline uppercase tracking-wider">Past Encrypted Reflections</span>
                {state.ventingEntries.slice(0, 3).map((e) => (
                  <div key={e.id} className="p-3 rounded-xl bg-surface-container-low text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-primary font-bold">{e.tag}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-outline">{e.timestamp}</span>
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playGentleChime(528);
                            setActiveModal('burnout_radar');
                          }}
                          className="text-[10px] text-primary font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <span>Radar</span>
                          <span className="material-symbols-outlined text-[11px]">insights</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-on-surface leading-snug">{e.content}</p>
                    {e.aiReframe && (
                      <div className="mt-1.5 p-2 rounded-lg bg-secondary-fixed/30 text-[11px] text-on-secondary-fixed">
                        🌿 {e.aiReframe.gentleReframe}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: Non-Diagnostic Safety & Verified Tunisian Crisis Shield */}
      {activeModal === 'crisis_shield' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl p-5 shadow-xl flex flex-col relative max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                Verified Safety Sanctuary
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <h2 className="text-lg font-bold text-on-surface mb-1">Safety &amp; Crisis Protocol</h2>
            <div className="p-3 rounded-2xl bg-secondary-fixed/50 border border-secondary-fixed mb-3 text-xs leading-relaxed text-on-secondary-fixed">
              <strong>HerCare Commitment:</strong> This sanctuary provides supportive emotional companionship and task pacing. It is strictly non-diagnostic and not a medical clinic. If you or a loved one is in immediate crisis, confidential human support is available across Tunisia 24/7.
            </div>

            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
              Verified 24/7 Tunisian Helplines:
            </h3>

            <div className="space-y-2.5 mb-4">
              <div className="p-3 rounded-2xl bg-surface-container-low flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-on-surface">SAMU Urgences Médicales</h4>
                  <p className="text-[11px] text-on-surface-variant">Immediate medical &amp; acute crisis dispatch</p>
                </div>
                <a
                  href="tel:190"
                  className="px-3.5 py-1.5 rounded-full bg-primary text-white text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">call</span>
                  <span>190</span>
                </a>
              </div>

              <div className="p-3 rounded-2xl bg-surface-container-low flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-on-surface">Protection Civile Tunisie</h4>
                  <p className="text-[11px] text-on-surface-variant">Emergency safety assistance</p>
                </div>
                <a
                  href="tel:198"
                  className="px-3.5 py-1.5 rounded-full bg-secondary text-white text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">call</span>
                  <span>198</span>
                </a>
              </div>

              <div className="p-3 rounded-2xl bg-surface-container-low flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-on-surface">SOS Amitié / Écoute Tunisie</h4>
                  <p className="text-[11px] text-on-surface-variant">Confidential listening &amp; psychological support</p>
                </div>
                <a
                  href="tel:71801111"
                  className="px-3.5 py-1.5 rounded-full bg-surface-container text-on-surface text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">call</span>
                  <span>71 801 111</span>
                </a>
              </div>

              <div className="p-3 rounded-2xl bg-surface-container-low">
                <h4 className="text-xs font-bold text-on-surface">Campus Student Psychological Clinics</h4>
                <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                  Direction de la Médecine Scolaire et Universitaire (DMSU) provides confidential consultations across university campuses in Tunis, Sfax, Sousse, and Monastir.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Return to Sanctuary
            </button>
          </div>
        </div>
      )}

      {/* Modal 5: Breathe Modal */}
      {activeModal === 'breathe' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl p-6 shadow-xl flex flex-col items-center text-center relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
            <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2">3-Minute Grounding</span>
            <h2 className="text-xl font-bold text-on-surface mb-4">Gentle Box Breathing</h2>

            {/* Animated breathing circle */}
            <div
              className={`w-44 h-44 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform duration-1000 ${
                breathPhase === 'Inhale'
                  ? 'scale-110 bg-secondary-fixed ring-4 ring-primary-container'
                  : breathPhase === 'Hold'
                  ? 'scale-105 bg-tertiary-fixed ring-4 ring-secondary'
                  : 'scale-90 bg-surface-container ring-2 ring-outline'
              }`}
            >
              <span className="text-lg font-bold text-on-surface">{breathPhase}</span>
              <span className="text-3xl font-bold text-primary mt-1">{breathCount}</span>
            </div>

            <p className="text-xs text-on-surface-variant mt-5 leading-relaxed">
              Inhale peace, hold gently, and exhale all academic tension.
            </p>
            <span className="text-[11px] font-semibold text-secondary mt-1">
              Completed cycles: {completedBreathCycles}
            </span>
          </div>
        </div>
      )}

      {/* Modal 6: Tunisian Ambient Soundscapes */}
      {activeModal === 'soundscapes' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl p-5 shadow-xl flex flex-col relative max-h-[85vh]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">Acoustic Sanctuary</span>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <h2 className="text-lg font-bold text-on-surface mb-1">Tunisian Ambient Soundscapes</h2>
            <p className="text-xs text-on-surface-variant mb-4">
              Ground your nervous system during studying with synthesized nature tones.
            </p>

            <div className="space-y-2.5 mb-4">
              {[
                { id: 'lofi', name: 'Tunis Café Mint Tea Lo-Fi', desc: 'Warm acoustic chords inspired by study cafés', icon: 'local_cafe' },
                { id: 'ocean', name: 'Sidi Bou Said Mediterranean Waves', desc: 'Rhythmic coastal breeze & gentle wave wash', icon: 'water' },
                { id: 'rain', name: 'Jasmine Rain in Carthage', desc: 'Calming soft rain over green garden leaves', icon: 'rainy' }
              ].map((s) => {
                const isSelected = ambientType === s.id && isLofiOn;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSoundscape(s.id as 'lofi' | 'ocean' | 'rain')}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-left cursor-pointer transition-all ${
                      isSelected ? 'bg-secondary-fixed ring-2 ring-primary text-on-secondary-fixed' : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center text-primary shadow-xs">
                        <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold">{s.name}</h4>
                        <p className="text-[11px] text-on-surface-variant">{s.desc}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleLofi}
                className={`flex-1 py-2.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                  isLofiOn ? 'bg-error-container text-error' : 'bg-primary text-white shadow-md'
                }`}
              >
                {isLofiOn ? 'Turn Off Sound' : 'Play Soundscape'}
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2.5 rounded-full bg-surface-container text-xs font-bold text-on-surface cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 7: Affirmation Modal */}
      {activeModal === 'affirmation' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl p-6 shadow-xl flex flex-col items-center text-center relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
            <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-primary mb-3">
              <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
            </div>
            <span className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Sisterly Voice</span>
            <p className="text-sm font-semibold text-on-surface leading-relaxed mb-6 italic">
              "{affirmations[affirmationIdx]}"
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => soundFx.speakText(affirmations[affirmationIdx], state.language)}
                className="px-4 py-2 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">volume_up</span>
                <span>Listen</span>
              </button>
              <button
                onClick={() => {
                  soundFx.playSparkle();
                  setAffirmationIdx((prev) => (prev + 1) % affirmations.length);
                }}
                className="px-4 py-2 rounded-full bg-primary text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Next Whisper ✨
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 8: Timer Modal */}
      {activeModal === 'timer' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl p-6 shadow-xl flex flex-col items-center text-center relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
            <span className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Study Sprint</span>
            <h2 className="text-xl font-bold text-on-surface mb-3">Micro-Pacing Interval</h2>

            <div className="flex items-center gap-1.5 mb-4">
              {[
                { min: 15, sec: 900 },
                { min: 25, sec: 1500 },
                { min: 45, sec: 2700 }
              ].map((p) => (
                <button
                  key={p.min}
                  onClick={() => {
                    soundFx.playGentleChime(480);
                    setIsTimerRunning(false);
                    setTimerDuration(p.sec);
                    setTimerSeconds(p.sec);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                    timerDuration === p.sec ? 'bg-primary text-white' : 'bg-surface-container text-on-surface'
                  }`}
                >
                  {p.min} min
                </button>
              ))}
            </div>

            <div className="text-5xl font-bold text-primary mb-6 font-mono">
              {formatTimerSeconds(timerSeconds)}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleFocusTimer}
                className="px-6 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-md cursor-pointer hover:opacity-95"
              >
                {isTimerRunning ? 'Pause' : 'Start Sprint'}
              </button>
              <button
                onClick={() => {
                  soundFx.playGentleChime(440);
                  setIsTimerRunning(false);
                  setTimerSeconds(timerDuration);
                }}
                className="px-4 py-2.5 rounded-full bg-surface-container text-on-surface text-xs font-bold cursor-pointer hover:bg-surface-container-high"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 9: Tunis Circle Modal */}
      {activeModal === 'circle' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl p-5 shadow-xl flex flex-col relative max-h-[85vh]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Quiet Study Room</span>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <h2 className="text-lg font-bold text-on-surface mb-1">Tunis Student Sisterhood Circle</h2>
            <p className="text-xs text-on-surface-variant mb-3">
              Students across INSAT, ENIT, IHEC, and Faculté de Médecine studying silently together in mutual support.
            </p>

            <button
              onClick={handleJoinCircle}
              className={`w-full py-2.5 rounded-full text-xs font-bold mb-3 shadow-sm cursor-pointer transition-colors ${
                isUserInCircle
                  ? 'bg-error-container text-error'
                  : 'bg-primary text-white hover:opacity-95'
              }`}
            >
              {isUserInCircle ? 'Leave Study Circle' : 'Join Quiet Focus Circle 🌸'}
            </button>

            {/* Quick Cheer Post */}
            <div className="flex items-center gap-1.5 mb-2">
              <input
                type="text"
                placeholder="Whisper anonymous encouragement (e.g. 3andek da3m!)..."
                value={cheerNoteInput}
                onChange={(e) => setCheerNoteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && cheerNoteInput.trim()) {
                    soundFx.playSparkle();
                    setFeelingSuccessMsg(`✨ Your whisper "${cheerNoteInput.trim()}" was shared with the sisterhood.`);
                    setTimeout(() => setFeelingSuccessMsg(''), 4000);
                    setCheerNoteInput('');
                  }
                }}
                className="flex-1 text-xs bg-surface-container-low px-3 py-1.5 rounded-xl outline-none text-on-surface"
              />
              <button
                onClick={() => {
                  if (cheerNoteInput.trim()) {
                    soundFx.playSparkle();
                    setFeelingSuccessMsg(`✨ Your whisper "${cheerNoteInput.trim()}" was shared with the sisterhood.`);
                    setTimeout(() => setFeelingSuccessMsg(''), 4000);
                    setCheerNoteInput('');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-secondary text-white text-xs font-bold cursor-pointer"
              >
                Cheer
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto">
              {circleStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low text-xs">
                  <div>
                    <span className="font-bold text-on-surface">{student.name}</span>{' '}
                    <span className="text-outline text-[11px]">({student.uni})</span>
                    <p className="text-[11px] text-on-surface-variant">{student.goal}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCheerStudent(student.id)}
                      className="px-2 py-0.5 rounded-full bg-white hover:bg-secondary-fixed text-[11px] font-bold text-primary flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Cheer up sister"
                    >
                      <span>❤️</span>
                      <span>{student.cheers || 0}</span>
                    </button>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed">
                      {student.state}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal 10: Desk Stretches Modal */}
      {activeModal === 'stretches' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl p-5 shadow-xl flex flex-col relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">Somatic Reset</span>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <h2 className="text-lg font-bold text-on-surface mb-1">Desk Tension Release</h2>
            <p className="text-xs text-on-surface-variant mb-4">
              Take 2 minutes to unhook your shoulders and soften your brow.
            </p>
            <div className="space-y-3">
              {[
                { title: 'Gentle Neck Rolls', desc: 'Roll chin to chest, hold for 5s, gently tilt right, then left.', icon: 'self_improvement' },
                { title: 'Shoulder Blades Hug', desc: 'Wrap your arms around yourself like a warm embrace, rounding the upper back.', icon: 'favorite' },
                { title: 'Palming for Tired Eyes', desc: 'Rub palms together until warm, gently cup over closed eyes for 30s.', icon: 'visibility' },
                { title: 'Seated Torso Twist', desc: 'Hold chair arm and gently gaze over your shoulder with an open ribcage.', icon: 'accessibility_new' }
              ].map((s, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-surface-container-low flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">{s.title}</h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal 11: Notifications Drawer Modal */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl p-5 shadow-xl flex flex-col relative max-h-[85vh]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Sanctuary Reminders</span>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <h2 className="text-lg font-bold text-on-surface mb-3">Today's Kind Notes</h2>

            <div className="space-y-2.5 overflow-y-auto">
              {[
                { title: 'Hydration Pause', time: '10 mins ago', desc: 'Have you had a glass of water recently? Your brain needs fluids to think clearly! 💧' },
                { title: 'Quiet Study Circle', time: '1 hour ago', desc: '22 students are currently studying peacefully across Tunis in the sisterhood circle.' },
                { title: 'Evening Check-in Scheduled', time: 'Tonight at 9:00 PM', desc: 'Lumi will check in with you for a gentle bedtime reflection.' }
              ].map((n, i) => (
                <div key={i} className="p-3 rounded-2xl bg-surface-container-low text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-on-surface">{n.title}</span>
                    <span className="text-[10px] text-outline">{n.time}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-snug">{n.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal 12: Color Sanctuary Theme Palette Modal */}
      {activeModal === 'theme_palette' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col relative max-h-[85vh] border border-surface-container">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">palette</span>
                Color Sanctuary
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <h2 className="text-lg font-bold text-on-surface mb-1">Pick Your Sanctuary Theme</h2>
            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
              Choose a color world that feels safe and comfortable for your study sessions.
            </p>

            <div className="grid grid-cols-2 gap-2.5 overflow-y-auto mb-4">
              {Object.values(PALETTE_THEMES).map((theme) => {
                const isSelected = state.paletteTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      soundFx.playGentleChime(540);
                      updateState({ paletteTheme: theme.id });
                    }}
                    className={`p-3 rounded-2xl text-left flex flex-col gap-2 transition-all cursor-pointer relative overflow-hidden border ${
                      isSelected
                        ? 'ring-2 ring-primary shadow-sm bg-surface-container-low border-primary/40'
                        : 'border-surface-container bg-surface-container-low/50 hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full shadow-inner border border-black/5" style={{ backgroundColor: theme.primary }} />
                        <span className="w-4 h-4 rounded-full shadow-inner border border-black/5" style={{ backgroundColor: theme.secondaryContainer }} />
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                          ✓
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-on-surface">{theme.name}</div>
                      <div className="text-[10px] text-on-surface-variant">{theme.tagline}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-full bg-primary text-white text-xs font-bold hover:opacity-95 cursor-pointer shadow-sm active:scale-98 transition-transform"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Brain Dump → Brain Map */}
      {activeModal === 'brain_dump' && (
        <BrainDumpModal
          state={state}
          updateState={updateState}
          onClose={() => setActiveModal(null)}
          onTasksAddedToPlan={(newTasks) => handleTasksAddedFromBrainDump(newTasks)}
        />
      )}

      {/* MODAL: Comeback Garden */}
      {activeModal === 'garden' && (
        <ComebackGardenModal
          state={state}
          updateState={updateState}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* MODAL: Voice Input Sanctuary */}
      {activeModal === 'voice_input' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl p-6 shadow-xl flex flex-col items-center relative text-center">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-3 shadow-sm animate-bounce">
              <span className="material-symbols-outlined text-[32px]">mic</span>
            </div>

            <h2 className="text-lg font-bold text-on-surface mb-1">Talk Directly with {state.companionName || 'Lumi'}</h2>
            <p className="text-xs text-on-surface-variant mb-4">
              Speak your heart out in Derja, French, or English. Tap any quick voice prompt below or speak into your microphone.
            </p>

            {micErrorNotice && (
              <div className="w-full p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/40 border border-amber-300 text-amber-900 dark:text-amber-200 text-xs mb-4 font-medium">
                {micErrorNotice}
              </div>
            )}

            {/* Animated Audio Waveform */}
            <div className="flex items-center gap-1.5 h-12 mb-6">
              {[40, 75, 25, 90, 60, 85, 30, 95, 50, 70, 40].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-primary rounded-full animate-pulse"
                  style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>

            {/* Quick voice choices */}
            <div className="w-full space-y-2 mb-5 text-left">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1">Common Voice Prompts:</span>
              {[
                'Exam Panic: 3 days left & I am overwhelmed 🌸',
                'PFE Thesis paralysis at INSAT / ENIT',
                'Derja: 9oli klem yfarhedni w yhedeni',
                'Job interview tomorrow & feeling nervous'
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    soundFx.playSparkle();
                    setActiveModal(null);
                    handleSendMessage(prompt);
                  }}
                  className="w-full text-left p-2.5 rounded-2xl bg-surface-container-low hover:bg-surface-container text-xs text-on-surface font-medium transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>"{prompt}"</span>
                  <span className="material-symbols-outlined text-[15px] text-primary">arrow_forward</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                soundFx.playSparkle();
                stopRealMicrophone();
              }}
              className="w-full py-2.5 rounded-full bg-error text-white text-xs font-bold hover:opacity-95 shadow-sm active:scale-98 transition-transform cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">stop</span>
              <span>Stop Recording & Send Voice Note</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Identity Bridge (PFE & Academic Projects to Career Evidence) */}
      {activeModal === 'identity_bridge' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl p-5 shadow-xl flex flex-col relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">work_history</span>
                Identity Bridge
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <h2 className="text-lg font-bold text-on-surface mb-1">Academic to Career Bridge</h2>
            <p className="text-xs text-on-surface-variant mb-3">
              Transform your Tunisian university coursework, PFE thesis, or student projects into confident, recruiter-ready CV bullet points without exaggeration.
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Example 1: PFE Thesis</span>
                <p className="text-xs text-on-surface font-medium mt-1">
                  "Architected and deployed an end-to-end full-stack data pipeline, benchmarking distributed inference latency and improving response times by 32% under production simulation."
                </p>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-secondary font-bold">
                  <span>🎯 Skill verified: System Design &amp; Optimization</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Example 2: Team Course Project</span>
                <p className="text-xs text-on-surface font-medium mt-1">
                  "Collaborated with a 4-person engineering cohort to develop modular microservices in TypeScript, adhering to Git branching hygiene and agile sprint milestones."
                </p>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-secondary font-bold">
                  <span>🎯 Skill verified: Agile Collaboration &amp; Code Quality</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-on-surface">
                <span className="font-bold text-emerald-800 dark:text-emerald-300">Sisterly Grounding: </span>
                You do not have to fake 5 years of experience. Your real academic rigor at {state.campusOrField || 'university'} is valuable evidence.
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playSparkle();
                setActiveModal(null);
                setActiveTab('plan');
              }}
              className="mt-4 w-full py-2.5 rounded-full bg-primary text-white text-xs font-bold hover:opacity-95 shadow-sm active:scale-98 transition-transform cursor-pointer"
            >
              Back to My Plan
            </button>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav aria-label="Bottom Navigation" className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface-container-lowest/95 backdrop-blur-md border-t border-surface-container-high py-2 px-2 flex items-center justify-around z-40">
        <button
          onClick={() => {
            soundFx.playGentleChime(480);
            setActiveTab('home');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl cursor-pointer transition-all active:scale-95 ${
            activeTab === 'home' ? 'text-primary font-bold' : 'text-outline font-medium hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]" style={activeTab === 'home' ? { fontVariationSettings: "'FILL' 1" } : undefined}>
            home
          </span>
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        <button
          onClick={() => {
            soundFx.playGentleChime(500);
            setActiveTab('companion');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl cursor-pointer transition-all active:scale-95 ${
            activeTab === 'companion' ? 'text-primary font-bold' : 'text-outline font-medium hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]" style={activeTab === 'companion' ? { fontVariationSettings: "'FILL' 1" } : undefined}>
            auto_awesome
          </span>
          <span className="text-[10px] tracking-tight">Companion</span>
        </button>

        <button
          onClick={() => {
            soundFx.playGentleChime(520);
            setActiveTab('plan');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl cursor-pointer transition-all active:scale-95 ${
            activeTab === 'plan' ? 'text-primary font-bold' : 'text-outline font-medium hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]" style={activeTab === 'plan' ? { fontVariationSettings: "'FILL' 1" } : undefined}>
            {state.journeyType === 'graduate' ? 'work' : 'school'}
          </span>
          <span className="text-[10px] tracking-tight whitespace-nowrap">
            {state.journeyType === 'graduate' ? 'Career Hub' : 'Study & PFE'}
          </span>
        </button>

        <button
          onClick={() => {
            soundFx.playGentleChime(540);
            setActiveTab('sanctuary');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl cursor-pointer transition-all active:scale-95 ${
            activeTab === 'sanctuary' ? 'text-primary font-bold' : 'text-outline font-medium hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]" style={activeTab === 'sanctuary' ? { fontVariationSettings: "'FILL' 1" } : undefined}>
            spa
          </span>
          <span className="text-[10px] tracking-tight">Sanctuary</span>
        </button>

        <button
          onClick={() => {
            soundFx.playGentleChime(560);
            setActiveTab('profile');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl cursor-pointer transition-all active:scale-95 ${
            activeTab === 'profile' ? 'text-primary font-bold' : 'text-outline font-medium hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]" style={activeTab === 'profile' ? { fontVariationSettings: "'FILL' 1" } : undefined}>
            local_florist
          </span>
          <span className="text-[10px] tracking-tight whitespace-nowrap">Garden &amp; You</span>
        </button>
      </nav>
    </div>
  );
};
