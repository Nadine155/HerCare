import React, { useState } from 'react';
import { ScreenId } from '../types';
import { PALETTE_THEMES, PaletteThemeKey } from '../utils/sanctuaryLogic';
import { soundFx } from '../utils/audioPlayer';

interface Props {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  currentTheme?: PaletteThemeKey;
  themeMode?: 'day' | 'night';
  onSelectTheme?: (theme: PaletteThemeKey) => void;
  onToggleThemeMode?: () => void;
}

export const ScreenSwitcher: React.FC<Props> = ({
  currentScreen,
  onSelectScreen,
  currentTheme = 'lavender',
  themeMode = 'day',
  onSelectTheme,
  onToggleThemeMode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);

  const screens: Array<{ id: ScreenId; label: string; step: string }> = [
    { id: 'welcome', label: 'Welcome / Sanctuary Intro', step: 'Cover' },
    { id: 'step1_journey', label: '1. Journey: Student vs Graduate', step: 'Step 1' },
    { id: 'step2_get_to_know', label: '2. Get to Know You', step: 'Step 2' },
    { id: 'step3_academic_context', label: '3. Academic & Life Context', step: 'Step 3' },
    { id: 'step4_gentle_support', label: '4. Gentle Support Needs', step: 'Step 4' },
    { id: 'step4_companion_pick', label: '5. Find Your Companion', step: 'Mascot' },
    { id: 'step5_companion_name', label: '6. Name Your Friend (Lumi)', step: 'Step 5' },
    { id: 'step6_color_world', label: '7. Color Sanctuary Palette', step: 'Step 6' },
    { id: 'step7_companion_spirit', label: '8. Companion Spirit Archetype', step: 'Step 7' },
    { id: 'tone_and_language', label: '9. Tone & Language Live Fit', step: 'Tone' },
    { id: 'personal_focus', label: '10. Personal Focus Goals', step: 'Focus' },
    { id: 'safety_and_control', label: '11. Safety, Privacy & Control', step: 'Privacy' },
    { id: 'meet_companion', label: '12. Meet Lumi! Ready Showcase', step: 'Ready' },
    { id: 'first_moment_checkin', label: '13. First Moment Check-in', step: 'Check-in' },
    { id: 'dashboard', label: '14. Home Sanctuary Dashboard', step: 'Home' }
  ];

  const themeList = Object.values(PALETTE_THEMES);
  const activeThemeObj = PALETTE_THEMES[currentTheme] || PALETTE_THEMES.lavender;

  const handlePickTheme = (themeId: PaletteThemeKey) => {
    soundFx.playGentleChime(540);
    if (onSelectTheme) onSelectTheme(themeId);
  };

  const handleToggleMode = () => {
    soundFx.playGentleChime(themeMode === 'night' ? 600 : 400);
    if (onToggleThemeMode) onToggleThemeMode();
  };

  return (
    <div className="relative z-50">
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface-container/85 backdrop-blur-md border-b border-surface-container-high text-xs transition-colors duration-300">
        {/* Left: Screen Jumper Button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setIsThemePickerOpen(false);
          }}
          className="flex items-center gap-1.5 font-semibold text-secondary hover:text-primary transition-colors cursor-pointer py-1 px-2.5 rounded-lg bg-surface-container-lowest shadow-xs active:scale-95"
          type="button"
          aria-expanded={isOpen}
          aria-label="Toggle screen navigation selector"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">devices</span>
          <span>Screen ({screens.findIndex((s) => s.id === currentScreen) + 1}/15)</span>
          <span className="material-symbols-outlined text-[14px]">
            {isOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {/* Right: Live Theme & Mode Switcher Bar */}
        <div className="flex items-center gap-1.5">
          {/* Day / Night Sanctuary Toggle Button */}
          <button
            onClick={handleToggleMode}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest hover:bg-surface-container border border-surface-container-high text-on-surface text-[11px] font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
            type="button"
            title={themeMode === 'night' ? 'Switch to Day Sanctuary' : 'Switch to Night Sanctuary'}
          >
            <span className="text-[12px]">{themeMode === 'night' ? '🌙' : '☀️'}</span>
            <span className="hidden xs:inline">{themeMode === 'night' ? 'Night' : 'Day'}</span>
          </button>

          {/* Color Palettes Dots (Desktop & Tablet) */}
          <div className="hidden sm:flex items-center gap-1 bg-surface-container-lowest/80 px-2 py-0.5 rounded-full border border-surface-container-high">
            <span className="text-[10px] text-on-surface-variant font-bold mr-0.5">Colors:</span>
            {themeList.map((t) => {
              const isSelected = t.id === currentTheme;
              return (
                <button
                  key={t.id}
                  onClick={() => handlePickTheme(t.id)}
                  title={`${t.name} (${t.tagline})`}
                  className={`w-5 h-5 rounded-full transition-transform active:scale-90 flex items-center justify-center cursor-pointer ${
                    isSelected ? 'ring-2 ring-primary ring-offset-1 scale-110 shadow-xs' : 'opacity-75 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{ backgroundColor: t.primary }}
                  type="button"
                >
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </button>
              );
            })}
          </div>

          {/* Mobile Theme Toggle Button */}
          <button
            onClick={() => {
              setIsThemePickerOpen(!isThemePickerOpen);
              setIsOpen(false);
            }}
            className="sm:hidden flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container-lowest text-xs font-semibold text-on-surface shadow-xs active:scale-95 cursor-pointer"
            type="button"
            title="Switch Theme"
          >
            <span className="w-3 h-3 rounded-full shadow-2xs" style={{ backgroundColor: activeThemeObj.primary }} />
            <span className="text-[11px] font-bold">{activeThemeObj.name.split(' ')[0]}</span>
            <span className="material-symbols-outlined text-[13px]">palette</span>
          </button>
        </div>
      </div>

      {/* Screen Selection Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-surface-container-lowest/98 backdrop-blur-md shadow-2xl border-b border-surface-container-high p-3 max-h-80 overflow-y-auto max-w-md mx-auto rounded-b-2xl animate-in fade-in duration-150">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">All 15 Screens</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-outline hover:text-on-surface cursor-pointer font-semibold"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {screens.map((s, idx) => {
              const isCurrent = s.id === currentScreen;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    onSelectScreen(s.id);
                    setIsOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-secondary-fixed text-on-secondary-fixed font-bold shadow-xs'
                      : 'hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center text-[10px] font-bold text-secondary">
                      {idx + 1}
                    </span>
                    <span>{s.label}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-outline">
                    {s.step}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Theme Picker Dropdown */}
      {isThemePickerOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-surface-container-lowest/98 backdrop-blur-md shadow-2xl border-b border-surface-container-high p-3 max-w-md mx-auto rounded-b-2xl animate-in fade-in duration-150">
          <div className="flex justify-between items-center mb-2.5 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">palette</span>
              Sanctuary Color Palette
            </span>
            <button
              onClick={() => setIsThemePickerOpen(false)}
              className="text-xs text-outline hover:text-on-surface cursor-pointer font-semibold"
            >
              Done
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {themeList.map((t) => {
              const isSelected = t.id === currentTheme;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    handlePickTheme(t.id);
                    setIsThemePickerOpen(false);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected ? 'ring-2 ring-primary shadow-sm' : 'bg-surface-container-low hover:bg-surface-container'
                  }`}
                  style={{ backgroundColor: isSelected ? t.lightCard : undefined }}
                >
                  <div className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full shadow-2xs" style={{ backgroundColor: t.primary }} />
                    <span className="w-3 h-3 rounded-full shadow-2xs" style={{ backgroundColor: t.secondaryContainer }} />
                  </div>
                  <span className="text-[11px] text-on-surface font-semibold truncate w-full text-center">
                    {t.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
