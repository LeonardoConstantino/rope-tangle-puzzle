import React from 'react';
import { BiomeTheme, BoardShape, GameStats } from '../types';
import { THEMES } from '../core/themeData';
import {
  X,
  Palette,
  Volume2,
  Trophy,
  HelpCircle,
  Shapes,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: BiomeTheme;
  onSelectTheme: (theme: BiomeTheme) => void;
  currentShape: BoardShape;
  onSelectShape: (shape: BoardShape) => void;
  sfxVolume: number;
  onSetSfxVolume: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  stats: GameStats;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  currentShape,
  onSelectShape,
  sfxVolume,
  onSetSfxVolume,
  isMuted,
  onToggleMute,
  stats,
}) => {
  const [tab, setTab] = React.useState<'theme' | 'audio' | 'stats' | 'help'>('theme');
  if (!isOpen) return null;

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none animate-fade-in"
    >
      <div
        id="settings-modal-content"
        className="w-full max-w-lg bg-[#221711] border border-[#442c1e] rounded-3xl p-6 shadow-2xl shadow-black/80 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#3b271b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-[#fcf6ee]">Game Settings</h2>
          </div>

          <button
            id="settings-close-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#19110d] hover:bg-[#2e1f17] text-[#9c8473] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 py-3 border-b border-[#3b271b] overflow-x-auto">
          {[
            { id: 'theme' as const, label: 'Theme & Shape', icon: Palette },
            { id: 'audio' as const, label: 'Audio', icon: Volume2 },
            { id: 'stats' as const, label: 'Statistics', icon: Trophy },
            { id: 'help' as const, label: 'How to Play', icon: HelpCircle },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                tab === id
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-[#8c7564] hover:text-[#e8d7c9] hover:bg-[#2d1e16]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="py-4 overflow-y-auto flex-1 space-y-5 pr-1">
          {tab === 'theme' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs uppercase font-bold text-[#a89280] tracking-wider mb-2.5">
                  Board Biome / Wood Theme
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {Object.values(THEMES).map((th) => (
                    <button
                      key={th.id}
                      onClick={() => onSelectTheme(th.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                        currentTheme === th.id
                          ? 'border-amber-400 bg-amber-500/10 shadow-md'
                          : 'border-[#3b271b] bg-[#1a110c] hover:border-[#5a3f2f]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#fcf6ee]">
                          {th.name}
                        </span>
                        {currentTheme === th.id && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 ring-4 ring-amber-400/20" />
                        )}
                      </div>
                      {/* Theme Preview Swatches */}
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-md border border-white/20"
                          style={{ backgroundColor: th.boardBase }}
                        />
                        <div
                          className="w-5 h-5 rounded-md border border-white/20"
                          style={{ backgroundColor: th.holeRim }}
                        />
                        <div
                          className="w-5 h-5 rounded-md border border-white/20"
                          style={{ backgroundColor: th.ropePalettes[0].primary }}
                        />
                        <div
                          className="w-5 h-5 rounded-md border border-white/20"
                          style={{ backgroundColor: th.ropePalettes[2].primary }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs uppercase font-bold text-[#a89280] tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Shapes className="w-3.5 h-3.5" />
                  <span>Board Rim Shape</span>
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['circle', 'octagon', 'star'] as BoardShape[]).map((sh) => (
                    <button
                      key={sh}
                      onClick={() => onSelectShape(sh)}
                      className={`capitalize py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        currentShape === sh
                          ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                          : 'border-[#3b271b] bg-[#1a110c] text-[#8c7564] hover:text-[#e8d7c9]'
                      }`}
                    >
                      {sh}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'audio' && (
            <div className="space-y-4 bg-[#1a110c] border border-[#3b271b] p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-[#fcf6ee] block">
                    Sound Effects & Haptics
                  </span>
                  <span className="text-xs text-[#8c7564]">
                    Tactile clicks, cord notes & victory chords
                  </span>
                </div>
                <button
                  onClick={onToggleMute}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isMuted
                      ? 'bg-rose-950/60 border border-rose-600/40 text-rose-300'
                      : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                  }`}
                >
                  {isMuted ? 'Muted' : 'Active'}
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-[#9c8473] font-semibold mb-1.5">
                  <span>SFX Volume</span>
                  <span>{Math.round(sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sfxVolume}
                  onChange={(e) => onSetSfxVolume(parseFloat(e.target.value))}
                  disabled={isMuted}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {tab === 'stats' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1a110c] border border-[#3b271b] p-3.5 rounded-2xl">
                <span className="text-[11px] uppercase font-bold text-[#8c7564] block mb-1">
                  Puzzles Solved
                </span>
                <span className="text-xl font-black text-amber-300">
                  {stats.puzzlesCompleted}
                </span>
              </div>

              <div className="bg-[#1a110c] border border-[#3b271b] p-3.5 rounded-2xl">
                <span className="text-[11px] uppercase font-bold text-[#8c7564] block mb-1">
                  Ropes Untangled
                </span>
                <span className="text-xl font-black text-emerald-300">
                  {stats.totalRopesUntangled}
                </span>
              </div>

              <div className="bg-[#1a110c] border border-[#3b271b] p-3.5 rounded-2xl">
                <span className="text-[11px] uppercase font-bold text-[#8c7564] block mb-1">
                  Daily Streak
                </span>
                <span className="text-xl font-black text-amber-400">
                  {stats.dailyStreak} 🔥
                </span>
              </div>

              <div className="bg-[#1a110c] border border-[#3b271b] p-3.5 rounded-2xl">
                <span className="text-[11px] uppercase font-bold text-[#8c7564] block mb-1">
                  Best Endless Score
                </span>
                <span className="text-xl font-black text-amber-200">
                  {stats.bestEndlessScore}
                </span>
              </div>
            </div>
          )}

          {tab === 'help' && (
            <div className="space-y-3 text-xs text-[#cfbeaf] leading-relaxed">
              <div className="bg-[#1a110c] border border-[#3b271b] p-3.5 rounded-2xl">
                <h4 className="font-bold text-amber-300 text-sm mb-1">
                  🎯 The Goal
                </h4>
                <p>
                  Untangle every physical rope on the wooden board. Eliminate all
                  intersections (marked by red <span className="font-bold text-rose-400">✕</span> badges)
                  to clear the cords!
                </p>
              </div>

              <div className="bg-[#1a110c] border border-[#3b271b] p-3.5 rounded-2xl">
                <h4 className="font-bold text-amber-300 text-sm mb-1">
                  🪢 How to Play
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-[#bfaea0]">
                  <li>
                    <strong className="text-white">Click or drag</strong> any peg endpoint to pick it up.
                  </li>
                  <li>
                    <strong className="text-white">Click an empty peg hole</strong> on the board to move the rope endpoint there.
                  </li>
                  <li>
                    Watch the rope flex and adjust with real-time Verlet physics!
                  </li>
                  <li>
                    When a rope has <strong className="text-emerald-400">0 crossings</strong>, it will chime, glow, and untangle!
                  </li>
                </ol>
              </div>

              <div className="bg-[#1a110c] border border-[#3b271b] p-3.5 rounded-2xl">
                <h4 className="font-bold text-amber-300 text-sm mb-1">
                  ⚡ Cascades & Combos
                </h4>
                <p>
                  Solving one cord might free others at the same time. Rapid
                  resolutions trigger high musical combos and extra points!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
