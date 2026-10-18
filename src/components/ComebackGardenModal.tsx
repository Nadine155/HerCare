import React from 'react';
import { UserState, GardenPlant } from '../types';
import { soundFx } from '../utils/audioPlayer';
import { IMAGES } from '../constants/assets';

interface Props {
  state: UserState;
  updateState: (fields: Partial<UserState>) => void;
  onClose: () => void;
}

const PLANT_SPECIES: Record<
  GardenPlant['type'],
  { name: string; localName: string; icon: string; color: string; desc: string }
> = {
  jasmine: {
    name: 'Tunisian Jasmine',
    localName: 'Yasmine',
    icon: '🌸',
    color: '#f472b6',
    desc: 'Symbol of delicate resilience and gentle beauty in Tunisia.'
  },
  lavender: {
    name: 'Wild Lavender',
    localName: 'Khzama',
    icon: '🪻',
    color: '#8b5cf6',
    desc: 'Brings deep nervous system tranquility during exam nights.'
  },
  olive_sprout: {
    name: 'Olive Branch',
    localName: 'Zaytouna',
    icon: '🌿',
    color: '#10b981',
    desc: 'Ancient grounding, steady patience, and peaceful endurance.'
  },
  orange_blossom: {
    name: 'Orange Blossom',
    localName: 'Zahr',
    icon: '🌼',
    color: '#f59e0b',
    desc: 'Fragrant renewal, refreshing tired senses after long study sprints.'
  },
  mint: {
    name: 'Fresh Spearmint',
    localName: 'Na3na3',
    icon: '🌱',
    color: '#059669',
    desc: 'Crisp mental clarity and companion tea rituals.'
  },
  sunflower: {
    name: 'Morning Sunflower',
    localName: 'Chams',
    icon: '🌻',
    color: '#eab308',
    desc: 'Radiant warmth, cheering you on toward your degree.'
  }
};

export const ComebackGardenModal: React.FC<Props> = ({
  state,
  updateState,
  onClose
}) => {
  const plants = state.gardenPlants && state.gardenPlants.length > 0
    ? state.gardenPlants
    : [
        {
          id: 'gp-1',
          name: 'First Sanctuary Sprout',
          type: 'jasmine' as const,
          stage: 'blooming' as const,
          earnedBy: 'Stepping into HerCare sanctuary',
          date: 'Day 1'
        },
        {
          id: 'gp-2',
          name: 'Gentle Pacing Sprout',
          type: 'olive_sprout' as const,
          stage: 'blooming' as const,
          earnedBy: 'Completed 15-min focus block',
          date: 'Yesterday'
        },
        {
          id: 'gp-3',
          name: 'Lavender Calm Bloom',
          type: 'lavender' as const,
          stage: 'bud' as const,
          earnedBy: 'Venting private journal reflection',
          date: 'Today'
        }
      ];

  const handlePlantNewSeed = () => {
    soundFx.playSparkle();
    const speciesKeys: Array<GardenPlant['type']> = [
      'jasmine',
      'lavender',
      'olive_sprout',
      'orange_blossom',
      'mint',
      'sunflower'
    ];
    const picked = speciesKeys[plants.length % speciesKeys.length];
    const newPlant: GardenPlant = {
      id: `plant-${Date.now()}`,
      name: `${PLANT_SPECIES[picked].localName} Bloom`,
      type: picked,
      stage: 'sprout',
      earnedBy: 'Honoring your well-being today',
      date: 'Today'
    };

    const nextList = [...plants, newPlant];
    updateState({
      gardenPlants: nextList,
      companionBondLevel: (state.companionBondLevel || 1) + 1
    });
  };

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
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">yard</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-on-surface">The Comeback Garden</h2>
              <p className="text-[10px] text-on-surface-variant">Where every micro-win gently takes root</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close comeback garden"
            className="w-8 h-8 rounded-full bg-surface-container text-on-surface flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Scrollable Garden Bed */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-0.5">
          {/* Anti-guilt guarantee banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-secondary-fixed/30 to-primary-fixed/20 border border-emerald-500/20 flex items-start gap-2.5">
            <span className="text-xl">🌸</span>
            <div className="flex-1 text-xs leading-relaxed text-on-surface">
              <span className="font-bold text-emerald-800 dark:text-emerald-300">Sanctuary Garden Law: </span>
              Your flowers never wilt or lose progress if you take days off or need deep sleep. Life in university and early career has natural seasons.
            </div>
          </div>

          {/* Interactive Garden Bed Visual */}
          <div className="relative rounded-3xl bg-gradient-to-b from-surface-container-low via-surface-container to-surface-container-high p-4 border border-surface-container overflow-hidden min-h-[220px] flex flex-col justify-between">
            {/* Ambient sun/moon glow */}
            <div className="absolute top-2 right-3 w-16 h-16 rounded-full bg-amber-300/30 blur-xl pointer-events-none" />

            {/* Top Companion Greeting in Garden */}
            <div className="flex items-center gap-2 z-10 bg-surface-container-lowest/80 backdrop-blur-xs px-3 py-1.5 rounded-full w-fit shadow-2xs border border-white/40">
              <div className="w-5 h-5 rounded-full overflow-hidden bg-primary-fixed">
                <img src={IMAGES.bunnyMascot} alt={state.companionName} className="w-full h-full object-cover" />
              </div>
              <span className="text-[11px] font-bold text-on-surface">
                {state.companionName || 'Lumi'} is watering your blooms
              </span>
            </div>

            {/* Plants Grid */}
            <div className="grid grid-cols-3 gap-3 my-4 z-10">
              {plants.map((plant) => {
                const info = PLANT_SPECIES[plant.type] || PLANT_SPECIES.jasmine;
                return (
                  <div
                    key={plant.id}
                    onClick={() => soundFx.playGentleChime(528)}
                    className="flex flex-col items-center p-2.5 rounded-2xl bg-surface-container-lowest/90 backdrop-blur-xs border border-surface-container shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer text-center"
                    title={`${info.name} (${info.localName}): ${plant.earnedBy}`}
                  >
                    <span className="text-2xl animate-bounce-short mb-1">{info.icon}</span>
                    <span className="text-[11px] font-bold text-on-surface truncate w-full">{info.localName}</span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                      {plant.stage}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Soil Grass Baseline */}
            <div className="w-full pt-2 border-t border-emerald-600/20 flex items-center justify-between text-[11px] text-on-surface-variant font-medium z-10">
              <span>🌱 Total Blooms: {plants.length}</span>
              <span className="text-primary font-bold">Bond: Level {state.companionBondLevel || 1}</span>
            </div>
          </div>

          {/* Plant a Seed CTA */}
          <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-on-surface">Celebrate a gentle step</h3>
              <p className="text-[10px] text-on-surface-variant">Add a flower for finishing a micro-focus or deep breath</p>
            </div>
            <button
              onClick={handlePlantNewSeed}
              className="px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-emerald-700 active:scale-95 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Plant Bloom</span>
            </button>
          </div>

          {/* Garden History / Meaning */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-on-surface">Your Native Tunisian Flora</h3>
            <div className="space-y-1.5">
              {Object.entries(PLANT_SPECIES).slice(0, 3).map(([key, spec]) => (
                <div key={key} className="p-2 rounded-xl bg-surface-container-low text-xs flex items-center gap-2">
                  <span className="text-base">{spec.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-on-surface mr-1">{spec.localName} ({spec.name})</span>
                    <p className="text-[10px] text-on-surface-variant line-clamp-1">{spec.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
