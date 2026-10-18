import React, { useState } from 'react';
import { UserState, BrainDumpItem, BrainDumpResult, PlannerTask } from '../types';
import { soundFx } from '../utils/audioPlayer';

interface Props {
  state: UserState;
  updateState: (fields: Partial<UserState>) => void;
  onClose: () => void;
  onTasksAddedToPlan: (tasks: PlannerTask[]) => void;
}

export const BrainDumpModal: React.FC<Props> = ({
  state,
  updateState,
  onClose,
  onTasksAddedToPlan
}) => {
  const [inputText, setInputText] = useState(
    state.journeyType === 'graduate'
      ? "I need to update my CV for junior tech roles in Tunis, but I feel like an imposter compared to other engineers. A recruiter messaged me on LinkedIn 2 days ago and I still haven't replied because of anxiety. Also I need to prepare for an HR screening on Friday."
      : "My PFE supervisor asked for 15 more academic citations for Chapter 2 by Saturday. I have 30 slides of Machine Learning to revise for partiels, my sleep is completely broken, and I feel terrified of letting my parents down."
  );
  const [isLoading, setIsLoading] = useState(false);
  const [brainMapResult, setBrainMapResult] = useState<BrainDumpResult | null>(null);
  const [items, setItems] = useState<BrainDumpItem[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleDeconstruct = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    soundFx.playGentleChime(528);

    try {
      const res = await fetch('/api/brain-dump-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brainDumpText: inputText.trim(),
          journeyType: state.journeyType,
          language: state.language,
          userName: state.name,
          currentEnergy: state.currentFeeling || 'tired'
        })
      });

      const data: BrainDumpResult = await res.json();
      setBrainMapResult(data);
      setItems(data.extractedItems || []);
      soundFx.playSparkle();
    } catch (err) {
      console.error('Brain dump error:', err);
      soundFx.playGentleChime(400);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleItem = (id: string) => {
    soundFx.playGentleChime(480);
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, selected: !it.selected } : it))
    );
  };

  const handleUpdateItemText = (id: string, newText: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, text: newText } : it))
    );
  };

  const handleConfirmToPlan = () => {
    const selectedTasks = items.filter((it) => it.selected && it.category === 'task');
    if (selectedTasks.length === 0) return;

    soundFx.playSuccessFanfare();
    const newPlannerTasks: PlannerTask[] = selectedTasks.map((t) => ({
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: t.text,
      durationMinutes: t.suggestedTimeMinutes || 15,
      category: state.journeyType === 'graduate' ? 'career' : 'study',
      done: false,
      source: 'brain_dump',
      deadline: t.deadlineText || undefined
    }));

    onTasksAddedToPlan(newPlannerTasks);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const actionableTasks = items.filter((it) => it.category === 'task');
  const waitItems = items.filter((it) => it.category === 'wait_item');
  const emotionalWorries = items.filter((it) => it.category === 'worry');
  const deadlines = items.filter((it) => it.category === 'deadline');

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/45 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-surface-container-lowest border border-surface-container rounded-3xl w-full max-w-md p-4 sm:p-5 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">psychology</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-on-surface">Brain Dump → Brain Map</h2>
              <p className="text-[10px] text-on-surface-variant">Untangle mental clutter into gentle clarity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close brain dump modal"
            className="w-8 h-8 rounded-full bg-surface-container text-on-surface flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-0.5">
          {/* Intro sisterly hint */}
          <div className="p-3 rounded-2xl bg-secondary-fixed/40 border border-primary/10 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">tips_and_updates</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Pour out everything weighing on your mind—unfinished chapters, recruiter emails, impending deadlines, or family expectations. We will sort out what you can control and what can wait.
            </p>
          </div>

          {/* Textarea input */}
          <div className="space-y-1.5">
            <label htmlFor="brain-dump-textarea" className="text-xs font-bold text-on-surface flex items-center justify-between">
              <span>What's swirling in your mind right now?</span>
              <span className="text-[10px] text-outline font-normal">Private &amp; Non-judgmental</span>
            </label>
            <textarea
              id="brain-dump-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={4}
              placeholder="Write freely in Derja, French, or English... without worrying about grammar or structure."
              className="w-full p-3 rounded-2xl bg-surface-container-low border border-surface-container text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none leading-relaxed"
            />
          </div>

          {/* Deconstruct Action Button */}
          <button
            onClick={handleDeconstruct}
            disabled={isLoading || !inputText.trim()}
            className="w-full py-2.5 px-4 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                <span>Companion is untangling your thoughts...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                <span>Deconstruct into Brain Map ✨</span>
              </>
            )}
          </button>

          {/* Brain Map Results Display */}
          {brainMapResult && (
            <div className="space-y-3 pt-2 animate-fade-in">
              {/* Sisterly Mindset Summary */}
              <div className="p-3 rounded-2xl bg-surface-container-low border border-secondary/20">
                <div className="flex items-center gap-1.5 mb-1 text-primary text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">favorite</span>
                  <span>{state.companionName || 'Lumi'}'s Gentle Take</span>
                </div>
                <p className="text-xs text-on-surface leading-relaxed">
                  {brainMapResult.mindsetSummary}
                </p>
                {brainMapResult.clarificationNote && (
                  <p className="text-[10px] text-on-surface-variant italic mt-1.5 border-t border-surface-container pt-1">
                    ℹ️ {brainMapResult.clarificationNote}
                  </p>
                )}
              </div>

              {/* Group 1: Actionable Tasks */}
              {actionableTasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Actionable Micro-Tasks (Directly Controllable)</span>
                    </span>
                    <span className="text-[10px] text-outline font-semibold">Select to add to Plan</span>
                  </div>

                  <div className="space-y-1.5">
                    {actionableTasks.map((t) => (
                      <div
                        key={t.id}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-colors ${
                          t.selected
                            ? 'bg-secondary-fixed/30 border-primary/30'
                            : 'bg-surface-container-low border-surface-container'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={t.selected}
                          onChange={() => handleToggleItem(t.id)}
                          className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={t.text}
                            onChange={(e) => handleUpdateItemText(t.id, e.target.value)}
                            className="w-full bg-transparent text-xs text-on-surface font-medium focus:outline-none"
                          />
                        </div>
                        {t.suggestedTimeMinutes && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-secondary shrink-0">
                            ⏱️ {t.suggestedTimeMinutes}m
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Group 2: Deadlines & Milestones */}
              {deadlines.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Fixed Deadlines &amp; Milestones</span>
                  </span>
                  {deadlines.map((d) => (
                    <div key={d.id} className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between text-on-surface">
                      <span>{d.text}</span>
                      {d.deadlineText && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          {d.deadlineText}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Group 3: Items to Put on Hold / Wait */}
              {waitItems.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>Things on Hold (Waiting / Out of Control)</span>
                  </span>
                  {waitItems.map((w) => (
                    <div key={w.id} className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-blue-500">hourglass_top</span>
                      <span className="flex-1">{w.text}</span>
                      <span className="text-[9px] uppercase tracking-wider text-outline">Let it rest</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Group 4: Emotional Worries */}
              {emotionalWorries.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>Emotional Worries (Held with Care)</span>
                  </span>
                  {emotionalWorries.map((w) => (
                    <div key={w.id} className="p-2.5 rounded-xl bg-surface-container-low border border-secondary/15 text-xs text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-secondary">favorite_border</span>
                      <span className="flex-1 leading-snug">{w.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Confirmation CTA */}
              {actionableTasks.some((t) => t.selected) && (
                <div className="pt-2">
                  <button
                    onClick={handleConfirmToPlan}
                    disabled={savedSuccess}
                    className="w-full py-2.5 rounded-full bg-secondary text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:opacity-95 active:scale-98 transition-all cursor-pointer"
                  >
                    {savedSuccess ? (
                      <>
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>Saved to My Plan!</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">playlist_add_check</span>
                        <span>Confirm Selected Tasks &amp; Send to My Plan</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-outline mt-1.5">
                    Nothing is scheduled without your direct review and approval.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
