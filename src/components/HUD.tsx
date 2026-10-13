import React from 'react';
import { GameMode } from '../types';
import {
  RotateCcw,
  Lightbulb,
  Clock,
  Footprints,
  Flame,
  Shuffle,
  Star,
} from 'lucide-react';

interface HUDProps {
  mode: GameMode;
  timerSeconds: number;
  movesCount: number;
  benchmarkMoves: number;
  crossingsCount: number;
  totalRopes: number;
  untangledRopesCount: number;
  comboCount: number;
  endlessScore: number;
  hintsLeft: number;
  canUndo: boolean;
  onUndo: () => void;
  onHint: () => void;
  onRestart: () => void;
  onNewPuzzle: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  mode,
  timerSeconds,
  movesCount,
  benchmarkMoves,
  crossingsCount,
  totalRopes,
  untangledRopesCount,
  comboCount,
  endlessScore,
  hintsLeft,
  canUndo,
  onUndo,
  onHint,
  onRestart,
  onNewPuzzle,
}) => {
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Determine current star tier for moves
  let stars = 1;
  if (movesCount <= benchmarkMoves + 2) {
    stars = 3;
  } else if (movesCount <= benchmarkMoves + 6) {
    stars = 2;
  }

  return (
    <div
      id="game-hud"
      className="w-full flex flex-col gap-2 pointer-events-auto select-none"
    >
      {/* Top HUD Cards Bar */}
      <div className="w-full max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-1.5">
        {/* Left Stats: Time & Moves */}
        <div className="flex items-center gap-2">
          {/* Timer Card */}
          <div
            id="hud-timer"
            className="flex items-center gap-1.5 bg-[#241913]/90 border border-[#442c1e] px-3 py-1.5 rounded-xl text-xs font-semibold text-[#f0e2d3] shadow-md"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-sm tracking-wide">
              {formatTime(timerSeconds)}
            </span>
          </div>

          {/* Moves Card */}
          <div
            id="hud-moves"
            className="flex items-center gap-1.5 bg-[#241913]/90 border border-[#442c1e] px-3 py-1.5 rounded-xl text-xs font-semibold text-[#f0e2d3] shadow-md"
          >
            <Footprints className="w-3.5 h-3.5 text-amber-400" />
            <span>Moves: {movesCount}</span>
            {mode === 'puzzle' && (
              <div className="flex items-center gap-0.5 ml-1">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-3 h-3 ${
                      s <= stars
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-[#5a3f2f]'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Live Counters */}
        <div className="flex items-center gap-2">
          {/* Crossings Counter */}
          <div
            id="hud-crossings"
            className={`flex items-center gap-1.5 border px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all duration-300 ${
              crossingsCount === 0
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/70 border-rose-600/40 text-rose-300'
            }`}
          >
            <span className="text-sm">✕</span>
            <span>Crossings: {crossingsCount}</span>
          </div>

          {/* Ropes Solved Progress */}
          <div
            id="hud-ropes-count"
            className="flex items-center gap-1.5 bg-[#241913]/90 border border-[#442c1e] px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-200 shadow-md"
          >
            <span>🎯</span>
            <span>
              {mode === 'endless'
                ? `Ropes: ${untangledRopesCount}`
                : `Ropes: ${untangledRopesCount}/${totalRopes}`}
            </span>
          </div>

          {/* Endless Score Badge */}
          {mode === 'endless' && (
            <div className="bg-amber-600/30 border border-amber-500/40 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 shadow-md">
              Score: {endlessScore}
            </div>
          )}

          {/* Combo Indicator */}
          {comboCount > 1 && (
            <div
              id="hud-combo-badge"
              className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-rose-500 text-white px-2.5 py-1 rounded-xl text-xs font-black tracking-wider animate-bounce shadow-lg shadow-rose-900/50"
            >
              <Flame className="w-3.5 h-3.5 fill-white" />
              <span>{comboCount}x COMBO!</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="w-full max-w-md mx-auto flex items-center justify-center gap-3 px-4 pb-2">
        {/* Undo Button */}
        <button
          id="undo-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo Last Move"
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide border shadow-md transition-all duration-200 cursor-pointer ${
            canUndo
              ? 'bg-[#2b1e16] hover:bg-[#3d2a1f] active:scale-95 border-[#543827] text-amber-100'
              : 'bg-[#19110d] border-[#291b13] text-[#5c4334] cursor-not-allowed opacity-50'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Undo</span>
        </button>

        {/* Hint Button */}
        <button
          id="hint-btn"
          onClick={onHint}
          disabled={hintsLeft <= 0}
          title="Get a Move Hint"
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide border shadow-md transition-all duration-200 cursor-pointer ${
            hintsLeft > 0
              ? 'bg-amber-600/30 hover:bg-amber-600/45 active:scale-95 border-amber-500/50 text-amber-200'
              : 'bg-[#19110d] border-[#291b13] text-[#5c4334] cursor-not-allowed opacity-50'
          }`}
        >
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span>Hint ({hintsLeft})</span>
        </button>

        {/* Restart Button */}
        <button
          id="restart-btn"
          onClick={onRestart}
          title="Restart Current Puzzle"
          className="p-2.5 rounded-xl bg-[#2b1e16] hover:bg-[#3d2a1f] active:scale-95 border border-[#543827] text-amber-200 transition-all shadow-md cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-[#bf9b7a]" />
        </button>

        {/* Next/Shuffle Button */}
        <button
          id="new-puzzle-btn"
          onClick={onNewPuzzle}
          title="New Procedural Puzzle"
          className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 border border-amber-400/40 text-white transition-all shadow-md shadow-amber-900/40 cursor-pointer"
        >
          <Shuffle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
