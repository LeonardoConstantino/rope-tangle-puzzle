import React, { useState } from 'react';
import { GameMode } from '../types';
import {
  Trophy,
  Star,
  Play,
  Share2,
  ArrowRight,
  RotateCcw,
  Check,
} from 'lucide-react';

interface VictoryModalProps {
  isOpen: boolean;
  mode: GameMode;
  seed: string;
  timeSeconds: number;
  movesCount: number;
  benchmarkMoves: number;
  maxCombo: number;
  onNextPuzzle: () => void;
  onRestart: () => void;
  onWatchReplay: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  mode,
  seed,
  timeSeconds,
  movesCount,
  benchmarkMoves,
  maxCombo,
  onNextPuzzle,
  onRestart,
  onWatchReplay,
}) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const mins = Math.floor(timeSeconds / 60);
  const secs = timeSeconds % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  let stars = 1;
  if (movesCount <= benchmarkMoves + 2) {
    stars = 3;
  } else if (movesCount <= benchmarkMoves + 6) {
    stars = 2;
  }

  const handleShare = () => {
    const starEmoji = '⭐'.repeat(stars);
    const text = `🪢 Rope Tangle Puzzle Solved! ${starEmoji}\n⏱ Time: ${timeStr} | 👣 Moves: ${movesCount}\n🔥 Max Combo: ${maxCombo}x\nPlay this seed: ${window.location.origin}${window.location.pathname}?seed=${seed}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      id="victory-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
    >
      <div
        id="victory-modal-content"
        className="w-full max-w-md bg-[#241812] border-2 border-amber-500/40 rounded-3xl p-6 text-center shadow-2xl shadow-amber-950/80 transform scale-100 transition-transform"
      >
        {/* Trophy Icon */}
        <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-900/60 border border-amber-200/40 animate-bounce">
          <Trophy className="w-8 h-8 text-[#241812] stroke-[2.5]" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-black text-[#fff7ed] tracking-tight mb-1">
          Puzzle Solved!
        </h2>
        <p className="text-xs text-amber-200/80 mb-5">
          All knots unraveled with complete clarity
        </p>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`p-2 rounded-2xl transition-all duration-300 ${
                s <= stars
                  ? 'bg-amber-500/20 border border-amber-400/40 scale-110'
                  : 'bg-black/20 border border-white/5 opacity-40'
              }`}
            >
              <Star
                className={`w-7 h-7 ${
                  s <= stars
                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                    : 'text-[#6e5341]'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Performance Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <div className="bg-[#19100b] border border-[#3b271b] p-3 rounded-2xl">
            <span className="text-[11px] text-[#9c8473] uppercase font-bold block mb-1">
              Time
            </span>
            <span className="text-base font-black text-amber-100 font-mono">
              {timeStr}
            </span>
          </div>

          <div className="bg-[#19100b] border border-[#3b271b] p-3 rounded-2xl">
            <span className="text-[11px] text-[#9c8473] uppercase font-bold block mb-1">
              Moves
            </span>
            <span className="text-base font-black text-amber-100">
              {movesCount}
            </span>
          </div>

          <div className="bg-[#19100b] border border-[#3b271b] p-3 rounded-2xl">
            <span className="text-[11px] text-[#9c8473] uppercase font-bold block mb-1">
              Max Combo
            </span>
            <span className="text-base font-black text-amber-400">
              {maxCombo}x
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            id="victory-next-btn"
            onClick={onNextPuzzle}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-98 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-900/50 border border-amber-300/30 transition-all cursor-pointer"
          >
            <span>Next Puzzle</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <button
              id="victory-replay-btn"
              onClick={onWatchReplay}
              className="flex-1 py-2.5 px-3 bg-[#2f1e14] hover:bg-[#3d271b] border border-[#523522] rounded-xl text-amber-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-amber-400" />
              <span>Watch Replay</span>
            </button>

            <button
              id="victory-share-btn"
              onClick={handleShare}
              className="flex-1 py-2.5 px-3 bg-[#2f1e14] hover:bg-[#3d271b] border border-[#523522] rounded-xl text-amber-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Share Score</span>
                </>
              )}
            </button>

            <button
              id="victory-restart-btn"
              onClick={onRestart}
              title="Play Again"
              className="p-2.5 bg-[#2f1e14] hover:bg-[#3d271b] border border-[#523522] rounded-xl text-amber-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#9c8473]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
