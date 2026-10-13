import React, { useState } from 'react';
import { Difficulty, GameMode } from '../types';
import {
  Volume2,
  VolumeX,
  Settings,
  Share2,
  Calendar,
  Sparkles,
  Infinity,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';

interface HeaderProps {
  mode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  difficulty: Difficulty;
  onSelectDifficulty: (diff: Difficulty) => void;
  seed: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onSelectMode,
  difficulty,
  onSelectDifficulty,
  seed,
  isMuted,
  onToggleMute,
  onOpenSettings,
  onOpenHelp,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopySeed = () => {
    const url = `${window.location.origin}${window.location.pathname}?seed=${seed}&diff=${difficulty}&mode=${mode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <header
      id="app-header"
      className="w-full bg-[#1c1511]/90 backdrop-blur-md border-b border-[#3b271b] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none z-20 shadow-lg"
    >
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 flex items-center justify-center shadow-md shadow-amber-900/40 border border-amber-300/30">
          <span className="text-xl">🪢</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#fdf8f0] font-sans">
              Rope Tangle
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
              Puzzle
            </span>
          </div>
          <p className="text-[11px] text-[#a89280] hidden sm:block">
            Untangle the physical chords with real tension
          </p>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center bg-[#140e0b] p-1 rounded-xl border border-[#3b271b]">
        <button
          id="mode-puzzle-btn"
          onClick={() => onSelectMode('puzzle')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
            mode === 'puzzle'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
              : 'text-[#9c8473] hover:text-[#e8d7c9] hover:bg-[#231812]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Puzzle</span>
        </button>

        <button
          id="mode-daily-btn"
          onClick={() => onSelectMode('daily')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
            mode === 'daily'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
              : 'text-[#9c8473] hover:text-[#e8d7c9] hover:bg-[#231812]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Daily</span>
        </button>

        <button
          id="mode-endless-btn"
          onClick={() => onSelectMode('endless')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
            mode === 'endless'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
              : 'text-[#9c8473] hover:text-[#e8d7c9] hover:bg-[#231812]'
          }`}
        >
          <Infinity className="w-3.5 h-3.5" />
          <span>Endless</span>
        </button>
      </div>

      {/* Difficulty Selector (when in Puzzle mode) */}
      {mode === 'puzzle' && (
        <div className="flex items-center bg-[#140e0b] p-1 rounded-xl border border-[#3b271b]">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
            <button
              key={diff}
              id={`diff-${diff}-btn`}
              onClick={() => onSelectDifficulty(diff)}
              className={`capitalize px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                difficulty === diff
                  ? 'bg-[#3b271b] text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-[#8c7463] hover:text-[#e8d7c9]'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      )}

      {/* Action Buttons & Seed Chip */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Share/Seed Button */}
        <button
          id="copy-seed-btn"
          onClick={handleCopySeed}
          title="Share Seed Link"
          className="flex items-center gap-1.5 bg-[#251b14] hover:bg-[#34241b] border border-[#4a3324] text-[#cfbeaf] text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline text-[11px] font-mono text-amber-200/80">
                #{seed.slice(0, 8)}
              </span>
            </>
          )}
        </button>

        {/* Audio Mute Toggle */}
        <button
          id="audio-toggle-btn"
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-2 rounded-lg bg-[#251b14] hover:bg-[#34241b] border border-[#4a3324] text-[#cfbeaf] transition-colors cursor-pointer"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* Help Button */}
        <button
          id="help-btn"
          onClick={onOpenHelp}
          title="How to Play"
          className="p-2 rounded-lg bg-[#251b14] hover:bg-[#34241b] border border-[#4a3324] text-[#cfbeaf] hover:text-white transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-[#9c8473]" />
        </button>

        {/* Settings Button */}
        <button
          id="settings-btn"
          onClick={onOpenSettings}
          title="Game Settings & Themes"
          className="p-2 rounded-lg bg-[#251b14] hover:bg-[#34241b] border border-[#4a3324] text-[#cfbeaf] hover:text-white transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4 text-[#9c8473]" />
        </button>
      </div>
    </header>
  );
};
