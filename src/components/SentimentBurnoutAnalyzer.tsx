import React, { useState } from 'react';
import { UserState, VentingEntry, SentimentAnalysisResult, CognitiveDistortion } from '../types';
import { soundFx } from '../utils/audioPlayer';

interface Props {
  state: UserState;
  updateState: (fields: Partial<UserState>) => void;
  onClose?: () => void;
  onLaunchBreathing?: () => void;
  onLaunchMicroPacing?: (taskSnippet?: string) => void;
  onLaunchVenting?: () => void;
  onTalkToCompanion?: (prompt?: string) => void;
}

export const SentimentBurnoutAnalyzer: React.FC<Props> = ({
  state,
  updateState,
  onClose,
  onLaunchBreathing,
  onLaunchMicroPacing,
  onLaunchVenting,
  onTalkToCompanion
}) => {
  // Mode: select past entry, write custom, or cumulative trend
  const [sourceMode, setSourceMode] = useState<'entries' | 'custom' | 'trend'>('entries');
  const [selectedEntryId, setSelectedEntryId] = useState<string>(
    state.ventingEntries.length > 0 ? state.ventingEntries[0].id : ''
  );
  const [customText, setCustomText] = useState(
    'I have 40 pages of Machine Learning to revise before Saturday and my PFE bibliography is overdue. Every time I open my laptop, my chest tightens and I freeze.'
  );
  const [customTag, setCustomTag] = useState<'Exam Stress' | 'PFE Pressure' | 'Fatigue' | 'Imposter Doubt'>('PFE Pressure');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStepNote, setAnalysisStepNote] = useState('');
  const [activeAnalysis, setActiveAnalysis] = useState<SentimentAnalysisResult | null>(
    state.lastSentimentAnalysis || null
  );
  const [activeAxisTooltip, setActiveAxisTooltip] = useState<string | null>(null);

  // Selected entry from userState
  const currentSelectedEntry = state.ventingEntries.find((e) => e.id === selectedEntryId);

  // Helper to trigger API analysis
  const handleRunAnalysis = async (textToProcess?: string, entryIdToAttach?: string) => {
    let rawText = '';
    if (sourceMode === 'trend') {
      const combined = state.ventingEntries.map((e) => `[${e.tag}] ${e.content}`).join('\n');
      rawText = combined || customText;
    } else if (sourceMode === 'entries') {
      const entry = state.ventingEntries.find((e) => e.id === (entryIdToAttach || selectedEntryId));
      rawText = entry ? entry.content : customText;
    } else {
      rawText = textToProcess || customText;
    }

    if (!rawText.trim()) return;

    setIsAnalyzing(true);
    setAnalysisStepNote('Parsing cognitive distortions & emotional valence...');
    soundFx.playGentleChime(528);

    try {
      setTimeout(() => {
        setAnalysisStepNote('Mapping 4-axis somatic & academic radar...');
      }, 700);

      const response = await fetch('/api/sentiment-burnout-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText,
          context: {
            feeling: state.currentFeeling,
            name: state.name,
            language: state.language,
            campusOrField: state.campusOrField,
            studentStage: state.studentStage
          }
        })
      });

      const data: SentimentAnalysisResult = await response.json();
      setActiveAnalysis(data);
      updateState({ lastSentimentAnalysis: data });

      // If analyzing a specific saved entry, attach the analysis result to that entry
      if (sourceMode === 'entries' && (entryIdToAttach || selectedEntryId)) {
        const targetId = entryIdToAttach || selectedEntryId;
        const updatedEntries = state.ventingEntries.map((e) =>
          e.id === targetId ? { ...e, sentimentAnalysis: data } : e
        );
        updateState({ ventingEntries: updatedEntries });
      }

      soundFx.playSuccessFanfare();
    } catch (err) {
      console.error('Sentiment analyzer error:', err);
      // Fallback
      const fallbackData: SentimentAnalysisResult = {
        radarScores: {
          somaticTension: 76,
          academicOverwhelm: 88,
          emotionalEnergy: 32,
          cognitiveClarity: 44
        },
        burnoutRisk: 'Moderate',
        detectedDistortions: [
          {
            name: 'Catastrophizing (Tahwil)',
            description: 'Anticipating that a delayed chapter means failing the entire degree.',
            severity: 'moderate'
          },
          {
            name: 'Imposter Syndrome',
            description: 'Believing everyone else at university is effortless while doubting your own seat.',
            severity: 'prominent'
          }
        ],
        sisterlyInsight: `You are carrying intense academic pressure at ${state.campusOrField || 'university'}, ${state.name || 'Yasmine'}. Your fatigue is a natural biological response, not a personal flaw.`,
        recommendedSanctuaryAction: 'Take 3 minutes of Box Breathing, sip cold water, and break tasks into 15-minute micro-intervals.'
      };
      setActiveAnalysis(fallbackData);
      updateState({ lastSentimentAnalysis: fallbackData });
    } finally {
      setIsAnalyzing(false);
      setAnalysisStepNote('');
    }
  };

  // Radar chart polygon points calculation
  // Center (160, 130), Radius = 85
  const cx = 160;
  const cy = 130;
  const R = 85;

  const scores = activeAnalysis?.radarScores || {
    somaticTension: 65,
    academicOverwhelm: 75,
    emotionalEnergy: 40,
    cognitiveClarity: 50
  };

  // 4 Axes:
  // 0: Somatic Tension -> UP (angle = -pi/2)
  // 1: Academic Overwhelm -> RIGHT (angle = 0)
  // 2: Emotional Energy -> DOWN (angle = pi/2)
  // 3: Cognitive Clarity -> LEFT (angle = pi)
  const getPoint = (score: number, angle: number) => {
    const clampedScore = Math.max(10, Math.min(100, score));
    const dist = (clampedScore / 100) * R;
    const x = cx + dist * Math.cos(angle);
    const y = cy + dist * Math.sin(angle);
    return { x, y };
  };

  const ptSomatic = getPoint(scores.somaticTension, -Math.PI / 2);
  const ptOverwhelm = getPoint(scores.academicOverwhelm, 0);
  const ptEnergy = getPoint(scores.emotionalEnergy, Math.PI / 2);
  const ptClarity = getPoint(scores.cognitiveClarity, Math.PI);

  const polygonPointsStr = `${ptSomatic.x},${ptSomatic.y} ${ptOverwhelm.x},${ptOverwhelm.y} ${ptEnergy.x},${ptEnergy.y} ${ptClarity.x},${ptClarity.y}`;

  // Rings for 25%, 50%, 75%, 100%
  const getRingPoints = (percent: number) => {
    const r = (percent / 100) * R;
    return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
  };

  return (
    <div className="flex flex-col w-full bg-surface-container-lowest rounded-3xl p-5 shadow-xl border border-surface-container relative select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-primary shadow-xs">
            <span className="material-symbols-outlined text-[18px]">insights</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-on-surface leading-tight">
              AI Well-Being &amp; Burnout Radar
            </h2>
            <span className="text-[10px] text-primary font-semibold flex items-center gap-1">
              <span>Non-Diagnostic Cognitive Analyzer</span>
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={() => {
              soundFx.playGentleChime(480);
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      <p className="text-xs text-on-surface-variant mb-3 leading-relaxed">
        Deeply processes your private university venting reflections to quantify somatic load, academic overwhelm, and cognitive distortions before exams.
      </p>

      {/* Mode Selector Tabs */}
      <div className="flex items-center p-1 rounded-2xl bg-surface-container-low mb-3.5 border border-surface-container">
        <button
          type="button"
          onClick={() => {
            soundFx.playGentleChime(480);
            setSourceMode('entries');
          }}
          className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
            sourceMode === 'entries'
              ? 'bg-white text-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[13px]">book</span>
          <span>Venting Entries ({state.ventingEntries.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFx.playGentleChime(500);
            setSourceMode('custom');
          }}
          className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
            sourceMode === 'custom'
              ? 'bg-white text-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[13px]">edit_note</span>
          <span>Express New</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFx.playGentleChime(520);
            setSourceMode('trend');
          }}
          className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
            sourceMode === 'trend'
              ? 'bg-white text-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[13px]">trending_up</span>
          <span>7-Day Trend</span>
        </button>
      </div>

      {/* Mode 1: Select Existing Venting Entries */}
      {sourceMode === 'entries' && (
        <div className="flex flex-col gap-2 mb-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-on-surface uppercase tracking-wider">
              Select a Venting Reflection:
            </span>
            {onLaunchVenting && (
              <button
                type="button"
                onClick={onLaunchVenting}
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>Open Diary</span>
                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              </button>
            )}
          </div>

          {state.ventingEntries.length === 0 ? (
            <div className="p-3 rounded-2xl bg-surface-container-low text-center text-xs text-on-surface-variant">
              No entries saved yet. Switch to "Express New" to write a reflection!
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {state.ventingEntries.map((entry) => {
                const isSelected = selectedEntryId === entry.id;
                return (
                  <div
                    key={entry.id}
                    onClick={() => {
                      soundFx.playGentleChime(490);
                      setSelectedEntryId(entry.id);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer text-left flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-secondary-fixed/50 border-primary ring-1 ring-primary shadow-xs'
                        : 'bg-surface-container-low border-surface-container hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-primary shadow-2xs">
                        {entry.tag}
                      </span>
                      <span className="text-[10px] text-outline">{entry.timestamp}</span>
                    </div>
                    <p className="text-xs text-on-surface leading-snug line-clamp-2">
                      {entry.content}
                    </p>
                    {entry.sentimentAnalysis && (
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-secondary">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>
                          Analyzed: {entry.sentimentAnalysis.burnoutRisk} Risk · Somatic: {entry.sentimentAnalysis.radarScores.somaticTension}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Write Custom Venting Text */}
      {sourceMode === 'custom' && (
        <div className="flex flex-col gap-2 mb-3.5">
          {/* Quick Demo Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              {
                tag: 'PFE Pressure' as const,
                title: 'INSAT PFE Thesis Paralysis',
                text: 'My PFE supervisor criticized my Chapter 2 related works draft and asked for 20 more citations. My chest is tight and every time I open my laptop I freeze.'
              },
              {
                tag: 'Imposter Doubt' as const,
                title: 'Concours Imposter Syndrome',
                text: 'Everyone in my engineering cohort seems to finish their labs with ease, while I feel like an absolute fraud who got here by pure luck.'
              },
              {
                tag: 'Exam Stress' as const,
                title: '40 Pages Machine Learning Cram',
                text: 'I have 40 pages of Machine Learning to revise before Saturday. I have barely slept in 3 days and my neck is throbbing from stress.'
              }
            ].map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  soundFx.playGentleChime(480);
                  setCustomTag(p.tag);
                  setCustomText(p.text);
                }}
                className="shrink-0 px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-secondary-fixed text-[10px] font-semibold text-on-surface cursor-pointer border border-surface-container"
              >
                {p.title}
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Pour out your raw exam, PFE, or university thoughts here..."
            className="w-full p-3 rounded-2xl bg-surface-container-low text-xs text-on-surface outline-none border border-surface-container focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>
      )}

      {/* Mode 3: Cumulative 7-Day Trend */}
      {sourceMode === 'trend' && (
        <div className="p-3.5 rounded-2xl bg-secondary-fixed/30 border border-secondary-fixed/50 mb-3.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <span className="material-symbols-outlined text-[16px]">timeline</span>
            <span>Multi-Day Cumulative Pattern</span>
          </div>
          <p className="text-[11px] text-on-surface leading-snug">
            Aggregates your last {state.ventingEntries.length} diary entries to uncover recurring cognitive distortions and monitor nervous system recovery.
          </p>
        </div>
      )}

      {/* Run Analysis Action Button */}
      <button
        type="button"
        onClick={() => handleRunAnalysis()}
        disabled={isAnalyzing}
        className="w-full py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 mb-4 active:scale-98 transition-transform"
      >
        {isAnalyzing ? (
          <>
            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            <span>{analysisStepNote || 'Lumi is processing cognitive sentiment...'}</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[16px]">insights</span>
            <span>
              {sourceMode === 'trend'
                ? 'Generate 7-Day Burnout Trend Radar'
                : 'Analyze This Entry & Generate Radar ✨'}
            </span>
          </>
        )}
      </button>

      {/* ========================================================================= */}
      {/* Visual Well-Being Radar Spider Chart */}
      {/* ========================================================================= */}
      {activeAnalysis && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
          {/* Burnout Risk Barometer Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-secondary-fixed/50 via-surface-container-low to-secondary-fixed/30 border border-secondary-fixed flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${
                  activeAnalysis.burnoutRisk === 'High'
                    ? 'bg-error'
                    : activeAnalysis.burnoutRisk === 'Moderate'
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {activeAnalysis.burnoutRisk === 'High'
                    ? 'priority_high'
                    : activeAnalysis.burnoutRisk === 'Moderate'
                    ? 'warning'
                    : 'check'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
                  Academic Burnout Barometer
                </span>
                <span className="text-sm font-bold text-on-surface">
                  {activeAnalysis.burnoutRisk} Risk Level
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] font-semibold text-on-surface-variant">
                {activeAnalysis.burnoutRisk === 'High'
                  ? 'Urgent Rest Needed'
                  : activeAnalysis.burnoutRisk === 'Moderate'
                  ? 'Micro-Pacing Advised'
                  : 'Pace is Sustainable'}
              </span>
              <span className="text-[11px] font-bold text-primary mt-0.5">
                {scores.somaticTension > 70 ? 'High Physical Tension' : 'Somatic Stable'}
              </span>
            </div>
          </div>

          {/* SVG Radar Spider Web */}
          <div className="bg-surface-container-low p-3 rounded-3xl border border-surface-container flex flex-col items-center relative">
            <div className="flex items-center justify-between w-full px-2 mb-1">
              <span className="text-[11px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary">radar</span>
                <span>Well-Being Spider Radar</span>
              </span>
              <span className="text-[10px] text-outline font-medium">0–100 Scale</span>
            </div>

            <div className="relative w-full max-w-[300px] h-[250px] flex items-center justify-center">
              <svg viewBox="0 0 320 260" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="radarFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--theme-primary, #684fa7)" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="var(--theme-secondary, #a58be8)" stopOpacity="0.25" />
                  </linearGradient>
                  <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Concentric Guide Diamonds */}
                <polygon points={getRingPoints(25)} fill="none" stroke="#ddd9d6" strokeWidth="1" strokeDasharray="3 3" />
                <polygon points={getRingPoints(50)} fill="none" stroke="#ddd9d6" strokeWidth="1" strokeDasharray="3 3" />
                <polygon points={getRingPoints(75)} fill="none" stroke="#ddd9d6" strokeWidth="1" strokeDasharray="3 3" />
                <polygon points={getRingPoints(100)} fill="none" stroke="#cbc4d2" strokeWidth="1.5" />

                {/* Axes Lines */}
                <line x1={cx} y1={cy - R} x2={cx} y2={cy + R} stroke="#cbc4d2" strokeWidth="1" />
                <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke="#cbc4d2" strokeWidth="1" />

                {/* User Radar Polygon */}
                <polygon
                  points={polygonPointsStr}
                  fill="url(#radarFillGrad)"
                  stroke="var(--theme-primary, #684fa7)"
                  strokeWidth="2.5"
                  className="transition-all duration-700 ease-out"
                />

                {/* Vertices Dots */}
                {/* Somatic (Top) */}
                <circle
                  cx={ptSomatic.x}
                  cy={ptSomatic.y}
                  r="5"
                  fill="var(--theme-primary, #684fa7)"
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="url(#radarGlow)"
                  className="cursor-pointer"
                  onClick={() => setActiveAxisTooltip('Somatic Tension: Physical stiffness, chest tightness, sleep disruption')}
                />
                {/* Academic Overwhelm (Right) */}
                <circle
                  cx={ptOverwhelm.x}
                  cy={ptOverwhelm.y}
                  r="5"
                  fill="var(--theme-secondary, #685392)"
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="url(#radarGlow)"
                  className="cursor-pointer"
                  onClick={() => setActiveAxisTooltip('Academic Overwhelm: Course syllabus, PFE deliverables, concours exam pressure')}
                />
                {/* Emotional Energy (Bottom) */}
                <circle
                  cx={ptEnergy.x}
                  cy={ptEnergy.y}
                  r="5"
                  fill="#6b5a61"
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="url(#radarGlow)"
                  className="cursor-pointer"
                  onClick={() => setActiveAxisTooltip('Emotional Energy: Inner reserves, resilience, self-compassion battery')}
                />
                {/* Cognitive Clarity (Left) */}
                <circle
                  cx={ptClarity.x}
                  cy={ptClarity.y}
                  r="5"
                  fill="#7a7582"
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="url(#radarGlow)"
                  className="cursor-pointer"
                  onClick={() => setActiveAxisTooltip('Cognitive Clarity: Mental sharpness vs brain fog and task paralysis')}
                />

                {/* Axis Labels */}
                {/* North: Somatic Tension */}
                <text x={cx} y={cy - R - 14} textAnchor="middle" className="text-[11px] font-bold fill-on-surface">
                  Somatic Tension ({scores.somaticTension}%)
                </text>
                <text x={cx} y={cy - R - 3} textAnchor="middle" className="text-[9px] fill-outline">
                  Neck · Sleep · Chest
                </text>

                {/* East: Academic Overwhelm */}
                <text x={cx + R + 8} y={cy - 4} textAnchor="start" className="text-[11px] font-bold fill-on-surface">
                  Overwhelm ({scores.academicOverwhelm}%)
                </text>
                <text x={cx + R + 8} y={cy + 8} textAnchor="start" className="text-[9px] fill-outline">
                  PFE &amp; Exams
                </text>

                {/* South: Emotional Energy */}
                <text x={cx} y={cy + R + 16} textAnchor="middle" className="text-[11px] font-bold fill-on-surface">
                  Battery ({scores.emotionalEnergy}%)
                </text>
                <text x={cx} y={cy + R + 27} textAnchor="middle" className="text-[9px] fill-outline">
                  Emotional Reserve
                </text>

                {/* West: Cognitive Clarity */}
                <text x={cx - R - 8} y={cy - 4} textAnchor="end" className="text-[11px] font-bold fill-on-surface">
                  Clarity ({scores.cognitiveClarity}%)
                </text>
                <text x={cx - R - 8} y={cy + 8} textAnchor="end" className="text-[9px] fill-outline">
                  Focus vs Fog
                </text>
              </svg>
            </div>

            {/* Tooltip banner if clicked */}
            {activeAxisTooltip && (
              <div className="w-full mt-2 p-2 rounded-xl bg-surface-container text-[11px] text-on-surface font-medium flex items-center justify-between animate-in fade-in">
                <span>{activeAxisTooltip}</span>
                <button
                  type="button"
                  onClick={() => setActiveAxisTooltip(null)}
                  className="text-xs text-outline font-bold cursor-pointer hover:text-on-surface ml-2"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* 4-Axis Metric Cards Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-on-surface">Somatic Tension</span>
                <span className="text-xs font-bold text-primary">{scores.somaticTension}%</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mb-1">
                <div className="bg-primary h-full rounded-full" style={{ width: `${scores.somaticTension}%` }} />
              </div>
              <span className="text-[10px] text-on-surface-variant">
                {scores.somaticTension > 70 ? 'Tight jaw / heavy chest' : 'Relaxed nervous system'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-on-surface">Academic Overwhelm</span>
                <span className="text-xs font-bold text-secondary">{scores.academicOverwhelm}%</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mb-1">
                <div className="bg-secondary h-full rounded-full" style={{ width: `${scores.academicOverwhelm}%` }} />
              </div>
              <span className="text-[10px] text-on-surface-variant">
                {scores.academicOverwhelm > 70 ? 'Micro-pacing required' : 'Manageable workload'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-on-surface">Emotional Energy</span>
                <span className="text-xs font-bold text-tertiary">{scores.emotionalEnergy}%</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mb-1">
                <div className="bg-tertiary h-full rounded-full" style={{ width: `${scores.emotionalEnergy}%` }} />
              </div>
              <span className="text-[10px] text-on-surface-variant">
                {scores.emotionalEnergy < 40 ? 'Battery low — pause' : 'Reserves intact'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-on-surface">Cognitive Clarity</span>
                <span className="text-xs font-bold text-outline">{scores.cognitiveClarity}%</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mb-1">
                <div className="bg-outline h-full rounded-full" style={{ width: `${scores.cognitiveClarity}%` }} />
              </div>
              <span className="text-[10px] text-on-surface-variant">
                {scores.cognitiveClarity < 50 ? 'Task freeze / fog' : 'Sharp mental focus'}
              </span>
            </div>
          </div>

          {/* Cognitive Distortions Deep Dive */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-amber-600">psychology_alt</span>
                <span>Detected Cognitive Distortions</span>
              </span>
              <span className="text-[10px] text-outline font-medium">CBT Pattern Insights</span>
            </div>

            {activeAnalysis.detectedDistortions.length === 0 ? (
              <div className="p-3 rounded-2xl bg-surface-container-low text-xs text-on-surface-variant">
                No active distortions detected. Your thoughts appear grounded and balanced.
              </div>
            ) : (
              activeAnalysis.detectedDistortions.map((dist, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container flex flex-col gap-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      <span>⚠️</span>
                      <span>{dist.name}</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        dist.severity === 'prominent'
                          ? 'bg-error-container text-error'
                          : dist.severity === 'moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {dist.severity}
                    </span>
                  </div>

                  <p className="text-xs text-on-surface leading-snug">
                    <strong className="text-on-surface-variant">The Mental Trap:</strong> {dist.description}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Sisterly Insight & Tunisian Cultural Comfort */}
          <div className="p-3.5 rounded-2xl bg-secondary-fixed/50 border border-secondary-fixed flex flex-col gap-1.5 text-xs text-on-surface leading-relaxed">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">favorite</span>
              <span>Sisterly Grounding Truth</span>
            </span>
            <p>{activeAnalysis.sisterlyInsight}</p>
          </div>

          {/* Recommended Sanctuary Prescriptions */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container flex flex-col gap-2">
            <span className="text-xs font-bold text-on-surface flex items-center justify-between">
              <span>Sanctuary Prescriptions:</span>
              <span className="text-[10px] text-primary font-bold">1-Click Healing</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              {onLaunchBreathing && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playGentleChime(528);
                    onLaunchBreathing();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-secondary-fixed text-xs font-bold text-primary flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[15px]">air</span>
                  <span>3-Min Breathing</span>
                </button>
              )}

              {onLaunchMicroPacing && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playGentleChime(528);
                    onLaunchMicroPacing(currentSelectedEntry?.content || customText);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-transform hover:opacity-95"
                >
                  <span className="material-symbols-outlined text-[15px]">schedule</span>
                  <span>15m Micro-Pacing</span>
                </button>
              )}
            </div>

            {onTalkToCompanion && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playGentleChime(500);
                  onTalkToCompanion(
                    `Lumi, my well-being radar shows ${activeAnalysis.burnoutRisk} burnout risk and ${scores.somaticTension}% somatic tension. Can you talk me through this gently in Derja?`
                  );
                }}
                className="w-full py-2 px-3 rounded-xl bg-secondary-fixed text-on-secondary-fixed text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[15px]">chat_bubble</span>
                <span>Discuss with {state.companionName || 'Lumi'} in Derja</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
