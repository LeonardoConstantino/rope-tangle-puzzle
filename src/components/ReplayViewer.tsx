import React from 'react';
import { Play, Pause, SkipBack, SkipForward, X } from 'lucide-react';

interface ReplayViewerProps {
  isReplaying: boolean;
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onExitReplay: () => void;
}

export const ReplayViewer: React.FC<ReplayViewerProps> = ({
  isReplaying,
  currentStep,
  totalSteps,
  isPlaying,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onExitReplay,
}) => {
  if (!isReplaying) return null;

  return (
    <div
      id="replay-control-bar"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#241812]/95 border-2 border-amber-500/50 rounded-2xl px-5 py-3 shadow-2xl shadow-black flex items-center gap-4 select-none backdrop-blur-md"
    >
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
        <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
          Replay ({currentStep}/{totalSteps})
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onStepBackward}
          disabled={currentStep <= 0}
          className="p-2 rounded-xl bg-[#1a110c] hover:bg-[#34241b] text-amber-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePlay}
          className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md cursor-pointer"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={onStepForward}
          disabled={currentStep >= totalSteps}
          className="p-2 rounded-xl bg-[#1a110c] hover:bg-[#34241b] text-amber-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={onExitReplay}
        className="p-2 rounded-xl bg-[#1a110c] hover:bg-[#34241b] text-[#9c8473] hover:text-white cursor-pointer ml-2"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
