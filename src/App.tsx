import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  BiomeTheme,
  BoardShape,
  Difficulty,
  GameMode,
  GameStats,
  Hole,
  IntersectionPoint,
  MoveStep,
  ParticleEffect,
  Rope,
} from './types';
import { THEMES } from './core/themeData';
import { createPuzzle, getDailySeedString, generateHoles } from './generation/ShuffleEngine';
import { computeIntersections, calculateBestHint } from './core/IntersectionEngine';
import { physicsSystem } from './core/RopePhysics';
import { audio } from './audio/AudioEngine';
import { Header } from './components/Header';
import { HUD } from './components/HUD';
import { GameCanvas } from './components/GameCanvas';
import { VictoryModal } from './components/VictoryModal';
import { SettingsModal } from './components/SettingsModal';
import { ReplayViewer } from './components/ReplayViewer';

export default function App() {
  // Local storage keys
  const STATS_KEY = 'rope_tangle_stats_v1';
  const PREFS_KEY = 'rope_tangle_prefs_v1';

  // Game Mode & Config
  const [mode, setMode] = useState<GameMode>('puzzle');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [themeId, setThemeId] = useState<BiomeTheme>('classic_wood');
  const [shape, setShape] = useState<BoardShape>('circle');
  const [seed, setSeed] = useState<string>('');

  // Puzzle State
  const [holes, setHoles] = useState<Hole[]>([]);
  const [ropes, setRopes] = useState<Rope[]>([]);
  const [initialRopesState, setInitialRopesState] = useState<Rope[]>([]);
  const [initialHolesState, setInitialHolesState] = useState<Hole[]>([]);
  const [intersections, setIntersections] = useState<IntersectionPoint[]>([]);
  const [benchmarkMoves, setBenchmarkMoves] = useState<number>(5);

  // Interaction State
  const [selectedRopeId, setSelectedRopeId] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<'start' | 'end' | null>(null);
  const [hintHighlight, setHintHighlight] = useState<{
    ropeId: string;
    end: 'start' | 'end';
    targetHoleId: number;
  } | null>(null);
  const [hintsLeft, setHintsLeft] = useState<number>(3);

  // Stats & Progress
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [moveHistory, setMoveHistory] = useState<MoveStep[]>([]);
  const [recordedMoves, setRecordedMoves] = useState<MoveStep[]>([]);
  const [comboCount, setComboCount] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(1);
  const [endlessScore, setEndlessScore] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);

  // Visual Effects & Particles
  const [particles, setParticles] = useState<ParticleEffect[]>([]);
  const [boardShake, setBoardShake] = useState<{ x: number; y: number; trauma: number }>({
    x: 0,
    y: 0,
    trauma: 0,
  });

  // Audio & Modals
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [sfxVolume, setSfxVolume] = useState<number>(0.8);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replayStep, setReplayStep] = useState<number>(0);
  const [isReplayPlaying, setIsReplayPlaying] = useState<boolean>(false);

  // Meta Stats
  const [stats, setStats] = useState<GameStats>({
    puzzlesCompleted: 0,
    totalRopesUntangled: 0,
    dailyStreak: 0,
    lastDailyDate: '',
    bestEndlessScore: 0,
    unlockedThemes: ['classic_wood', 'enchanted_forest', 'cyber_neon', 'royal_rosewood'],
  });

  // Load saved preferences and stats
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem(STATS_KEY);
      if (savedStats) setStats(JSON.parse(savedStats));

      const savedPrefs = localStorage.getItem(PREFS_KEY);
      if (savedPrefs) {
        const p = JSON.parse(savedPrefs);
        if (p.themeId) setThemeId(p.themeId);
        if (p.shape) setShape(p.shape);
        if (p.sfxVolume !== undefined) {
          setSfxVolume(p.sfxVolume);
          audio.setSfxVolume(p.sfxVolume);
        }
        if (p.isMuted !== undefined) {
          setIsMuted(p.isMuted);
          audio.setMuted(p.isMuted);
        }
      }
    } catch {
      // Ignore local storage parse error
    }
  }, []);

  // Save preferences
  useEffect(() => {
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ themeId, shape, sfxVolume, isMuted })
      );
    } catch {}
  }, [themeId, shape, sfxVolume, isMuted]);

  // Save stats
  const updateStats = useCallback((updater: (prev: GameStats) => GameStats) => {
    setStats((prev) => {
      const updated = updater(prev);
      try {
        localStorage.setItem(STATS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Initialize a new puzzle
  const initPuzzle = useCallback(
    (customSeed?: string, customDiff?: Difficulty, customMode?: GameMode) => {
      const activeMode = customMode || mode;
      const activeDiff = customDiff || difficulty;
      const currentTheme = THEMES[themeId] || THEMES.classic_wood;

      let seedToUse = customSeed;
      if (!seedToUse) {
        if (activeMode === 'daily') {
          seedToUse = getDailySeedString();
        } else {
          seedToUse = `${activeDiff.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        }
      }

      const generated = createPuzzle(
        activeDiff,
        seedToUse,
        currentTheme,
        shape,
        400,
        400,
        260
      );

      setSeed(seedToUse);
      setHoles(generated.holes);
      setRopes(generated.ropes);
      setInitialHolesState(JSON.parse(JSON.stringify(generated.holes)));
      setInitialRopesState(JSON.parse(JSON.stringify(generated.ropes)));
      setBenchmarkMoves(generated.benchmarkMoves);

      const check = computeIntersections(generated.ropes, generated.holes);
      setIntersections(check.intersections);

      setSelectedRopeId(null);
      setSelectedEnd(null);
      setHintHighlight(null);
      setHintsLeft(3);
      setMovesCount(0);
      setMoveHistory([]);
      setRecordedMoves([]);
      setTimerSeconds(0);
      setIsTimerRunning(true);
      setIsWon(false);
      setComboCount(0);
      setMaxCombo(1);
      if (activeMode === 'endless') {
        setEndlessScore(0);
      }
      setIsReplaying(false);
    },
    [mode, difficulty, themeId, shape]
  );

  // Initialize on first mount or URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSeed = params.get('seed');
    const urlDiff = params.get('diff') as Difficulty;
    const urlMode = params.get('mode') as GameMode;

    if (urlDiff && ['easy', 'medium', 'hard'].includes(urlDiff)) {
      setDifficulty(urlDiff);
    }
    if (urlMode && ['puzzle', 'daily', 'endless'].includes(urlMode)) {
      setMode(urlMode);
    }

    initPuzzle(urlSeed || undefined, urlDiff || undefined, urlMode || undefined);
  }, []);

  // Timer Tick
  useEffect(() => {
    if (!isTimerRunning || isWon || isReplaying) return;
    const timer = setInterval(() => {
      setTimerSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerRunning, isWon, isReplaying]);

  // Combo decay timer (decays if no untangle in 4 seconds)
  useEffect(() => {
    if (comboCount === 0) return;
    const timer = setTimeout(() => {
      setComboCount(0);
    }, 4000);
    return () => clearInterval(timer);
  }, [comboCount]);

  // Handle Peg Selection
  const handleSelectPeg = useCallback(
    (ropeId: string | null, end: 'start' | 'end' | null) => {
      setSelectedRopeId(ropeId);
      setSelectedEnd(end);
      setHintHighlight(null);
    },
    []
  );

  // Move Peg from current Hole to Target Hole
  const handleMovePeg = useCallback(
    (ropeId: string, end: 'start' | 'end', targetHoleId: number) => {
      audio.unlock();

      setRopes((prevRopes) => {
        const rope = prevRopes.find((r) => r.id === ropeId);
        if (!rope || rope.isUntangled) return prevRopes;

        const fromHoleId = end === 'start' ? rope.startHoleId : rope.endHoleId;
        if (fromHoleId === targetHoleId) return prevRopes;

        // Record history step
        const step: MoveStep = {
          ropeId,
          endMoved: end,
          fromHoleId,
          toHoleId: targetHoleId,
          timestamp: Date.now(),
        };

        setMoveHistory((h) => [...h, step]);
        setRecordedMoves((r) => [...r, step]);
        setMovesCount((m) => m + 1);

        // Update Holes
        setHoles((prevHoles) =>
          prevHoles.map((h) => {
            if (h.id === fromHoleId) {
              return { ...h, isOccupied: false, occupiedByRopeId: undefined, occupiedEnd: undefined };
            }
            if (h.id === targetHoleId) {
              return { ...h, isOccupied: true, occupiedByRopeId: ropeId, occupiedEnd: end };
            }
            return h;
          })
        );

        // Update Rope
        const updatedRopes = prevRopes.map((r) => {
          if (r.id !== ropeId) return r;
          const updated = {
            ...r,
            startHoleId: end === 'start' ? targetHoleId : r.startHoleId,
            endHoleId: end === 'end' ? targetHoleId : r.endHoleId,
            wearCount: r.wearCount + 1,
          };
          physicsSystem.applySnapImpulse(updated, end);
          return updated;
        });

        // Audio & Visual Juice
        audio.playWoodSnap();
        setBoardShake({ x: 0, y: 0, trauma: 0.45 });

        // Check intersections
        const updatedHoles = holes.map((h) => {
          if (h.id === fromHoleId) return { ...h, isOccupied: false };
          if (h.id === targetHoleId) return { ...h, isOccupied: true };
          return h;
        });

        const check = computeIntersections(updatedRopes, updatedHoles, intersections);
        setIntersections(check.intersections);

        // Check for newly untangled ropes (0 crossings)
        const newlyFreedRopeIds = check.freeRopeIds.filter(
          (id) => !prevRopes.find((r) => r.id === id)?.isUntangled
        );

        if (newlyFreedRopeIds.length > 0) {
          const newCombo = comboCount + newlyFreedRopeIds.length;
          setComboCount(newCombo);
          setMaxCombo((mc) => Math.max(mc, newCombo));

          newlyFreedRopeIds.forEach((freedId, idx) => {
            const freedRope = updatedRopes.find((r) => r.id === freedId);
            if (freedRope) {
              freedRope.isUntangled = true;
              audio.playRopeFreed(freedRope.noteIndex, newCombo + idx);

              // Spawn celebration stardust particles along the rope
              freedRope.particles.forEach((p) => {
                setParticles((part) => [
                  ...part,
                  {
                    x: p.x,
                    y: p.y,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3 - 1,
                    color: freedRope.color.highlight,
                    size: 3.5,
                    alpha: 1,
                    life: 25,
                    maxLife: 25,
                    type: 'spark',
                  },
                ]);
              });
            }
          });

          // Animate untangle disappearance
          setTimeout(() => {
            setRopes((currentRopes) =>
              currentRopes.map((r) =>
                newlyFreedRopeIds.includes(r.id) ? { ...r, untangleProgress: 1 } : r
              )
            );

            // Free the holes of the untangled ropes
            setHoles((currHoles) =>
              currHoles.map((h) => {
                if (newlyFreedRopeIds.includes(h.occupiedByRopeId || '')) {
                  return { ...h, isOccupied: false, occupiedByRopeId: undefined, occupiedEnd: undefined };
                }
                return h;
              })
            );

            // Check Victory or Endless continuation
            const remainingActive = updatedRopes.filter(
              (r) => !r.isUntangled && !newlyFreedRopeIds.includes(r.id)
            );

            if (mode === 'endless') {
              setEndlessScore((s) => s + newlyFreedRopeIds.length * 100 * newCombo);
              updateStats((st) => ({
                ...st,
                totalRopesUntangled: st.totalRopesUntangled + newlyFreedRopeIds.length,
                bestEndlessScore: Math.max(
                  st.bestEndlessScore,
                  endlessScore + newlyFreedRopeIds.length * 100 * newCombo
                ),
              }));

              // In Endless mode, if ropes <= 2, add fresh chords to keep puzzle flowing!
              if (remainingActive.length <= 2) {
                // Add a new rope to free holes
                setTimeout(() => {
                  addNewEndlessRope();
                }, 400);
              }
            } else {
              // Puzzle / Daily Mode
              updateStats((st) => ({
                ...st,
                totalRopesUntangled: st.totalRopesUntangled + newlyFreedRopeIds.length,
              }));

              if (remainingActive.length === 0) {
                // VICTORY!
                handleVictory();
              }
            }
          }, 450);
        } else if (check.intersections.length < intersections.length) {
          audio.playCrossResolved(rope.noteIndex);
        }

        return updatedRopes;
      });
    },
    [holes, intersections, comboCount, mode, endlessScore, updateStats]
  );

  // Adds a new random rope in Endless mode
  const addNewEndlessRope = useCallback(() => {
    setHoles((currHoles) => {
      const freeHoles = currHoles.filter((h) => !h.isOccupied);
      if (freeHoles.length < 2) return currHoles;

      const h1 = freeHoles[Math.floor(Math.random() * freeHoles.length)];
      const otherFree = freeHoles.filter((h) => h.id !== h1.id);
      const h2 = otherFree[Math.floor(Math.random() * otherFree.length)];

      const currentTheme = THEMES[themeId] || THEMES.classic_wood;
      const color = currentTheme.ropePalettes[Math.floor(Math.random() * currentTheme.ropePalettes.length)];

      const numParticles = 10;
      const particles = [];
      for (let p = 0; p < numParticles; p++) {
        const t = p / (numParticles - 1);
        const px = h1.x + (h2.x - h1.x) * t;
        const py = h1.y + (h2.y - h1.y) * t;
        particles.push({ x: px, y: py, oldX: px, oldY: py, pinned: p === 0 || p === numParticles - 1 });
      }

      const newRope: Rope = {
        id: `rope_endless_${Date.now()}`,
        color,
        startHoleId: h1.id,
        endHoleId: h2.id,
        particles,
        noteIndex: Math.floor(Math.random() * 5),
        isUntangled: false,
        untangleProgress: 0,
        wearCount: 0,
        wobblePhase: Math.random() * Math.PI * 2,
        createdAt: Date.now(),
      };

      setRopes((r) => [...r, newRope]);

      return currHoles.map((h) => {
        if (h.id === h1.id) return { ...h, isOccupied: true, occupiedByRopeId: newRope.id, occupiedEnd: 'start' };
        if (h.id === h2.id) return { ...h, isOccupied: true, occupiedByRopeId: newRope.id, occupiedEnd: 'end' };
        return h;
      });
    });
  }, [themeId]);

  // Victory Handler
  const handleVictory = useCallback(() => {
    setIsWon(true);
    setIsTimerRunning(false);
    audio.playVictoryFanfare();

    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#0ea5e9', '#ec4899', '#fde68a'],
    });

    // Update Daily Streak if in daily mode
    const todayStr = getDailySeedString();
    updateStats((st) => {
      let streak = st.dailyStreak;
      if (mode === 'daily') {
        if (st.lastDailyDate !== todayStr) {
          streak = st.dailyStreak + 1;
        }
      }
      return {
        ...st,
        puzzlesCompleted: st.puzzlesCompleted + 1,
        dailyStreak: streak,
        lastDailyDate: mode === 'daily' ? todayStr : st.lastDailyDate,
      };
    });
  }, [mode, updateStats]);

  // Undo Last Move
  const handleUndo = useCallback(() => {
    if (moveHistory.length === 0 || isWon) return;

    audio.playTapeRewind();
    const lastStep = moveHistory[moveHistory.length - 1];
    setMoveHistory((h) => h.slice(0, -1));
    setMovesCount((m) => Math.max(0, m - 1));

    // Restore hole state
    setHoles((prevHoles) =>
      prevHoles.map((h) => {
        if (h.id === lastStep.toHoleId) {
          return { ...h, isOccupied: false, occupiedByRopeId: undefined, occupiedEnd: undefined };
        }
        if (h.id === lastStep.fromHoleId) {
          return {
            ...h,
            isOccupied: true,
            occupiedByRopeId: lastStep.ropeId,
            occupiedEnd: lastStep.endMoved,
          };
        }
        return h;
      })
    );

    // Restore rope endpoint
    setRopes((prevRopes) => {
      const updatedRopes = prevRopes.map((r) => {
        if (r.id !== lastStep.ropeId) return r;
        return {
          ...r,
          startHoleId: lastStep.endMoved === 'start' ? lastStep.fromHoleId : r.startHoleId,
          endHoleId: lastStep.endMoved === 'end' ? lastStep.fromHoleId : r.endHoleId,
        };
      });

      // Recalculate intersections
      const updatedHoles = holes.map((h) => {
        if (h.id === lastStep.toHoleId) return { ...h, isOccupied: false };
        if (h.id === lastStep.fromHoleId) return { ...h, isOccupied: true };
        return h;
      });

      const check = computeIntersections(updatedRopes, updatedHoles);
      setIntersections(check.intersections);

      return updatedRopes;
    });

    // Particle rewind burst
    const targetHole = holes.find((h) => h.id === lastStep.fromHoleId);
    if (targetHole) {
      setParticles((p) => [
        ...p,
        {
          x: targetHole.x,
          y: targetHole.y,
          vx: 0,
          vy: 0,
          color: '#fbbf24',
          size: 16,
          alpha: 1,
          life: 14,
          maxLife: 14,
          type: 'ring',
        },
      ]);
    }
  }, [moveHistory, isWon, holes]);

  // Hint Request
  const handleHint = useCallback(() => {
    if (hintsLeft <= 0 || isWon) return;

    const best = calculateBestHint(ropes, holes);
    if (best) {
      setHintsLeft((h) => h - 1);
      setHintHighlight({
        ropeId: best.ropeId,
        end: best.endToMove,
        targetHoleId: best.toHoleId,
      });
      setSelectedRopeId(best.ropeId);
      setSelectedEnd(best.endToMove);

      audio.playCascadeStep(1);

      const targetHole = holes.find((h) => h.id === best.toHoleId);
      if (targetHole) {
        setParticles((p) => [
          ...p,
          {
            x: targetHole.x,
            y: targetHole.y,
            vx: 0,
            vy: 0,
            color: '#34d399',
            size: 20,
            alpha: 1,
            life: 20,
            maxLife: 20,
            type: 'ring',
          },
        ]);
      }
    }
  }, [hintsLeft, isWon, ropes, holes]);

  // Restart Current Puzzle
  const handleRestart = useCallback(() => {
    setHoles(JSON.parse(JSON.stringify(initialHolesState)));
    setRopes(JSON.parse(JSON.stringify(initialRopesState)));
    const check = computeIntersections(initialRopesState, initialHolesState);
    setIntersections(check.intersections);

    setSelectedRopeId(null);
    setSelectedEnd(null);
    setHintHighlight(null);
    setMoveHistory([]);
    setMovesCount(0);
    setTimerSeconds(0);
    setIsWon(false);
    setComboCount(0);
    setIsTimerRunning(true);
    setIsReplaying(false);
    audio.playTapeRewind();
  }, [initialHolesState, initialRopesState]);

  // Replay Execution Step
  const stepReplay = useCallback(
    (stepIndex: number) => {
      if (stepIndex < 0 || stepIndex > recordedMoves.length) return;

      // Start from initial state and replay up to stepIndex
      const simHoles: Hole[] = JSON.parse(JSON.stringify(initialHolesState));
      const simRopes: Rope[] = JSON.parse(JSON.stringify(initialRopesState));

      for (let i = 0; i < stepIndex; i++) {
        const move = recordedMoves[i];
        const rope = simRopes.find((r) => r.id === move.ropeId);
        if (!rope) continue;

        simHoles[move.fromHoleId].isOccupied = false;
        simHoles[move.toHoleId].isOccupied = true;

        if (move.endMoved === 'start') {
          rope.startHoleId = move.toHoleId;
        } else {
          rope.endHoleId = move.toHoleId;
        }
      }

      setHoles(simHoles);
      setRopes(simRopes);
      const check = computeIntersections(simRopes, simHoles);
      setIntersections(check.intersections);
      setReplayStep(stepIndex);
      audio.playWoodSnap();
    },
    [initialHolesState, initialRopesState, recordedMoves]
  );

  // Replay Playback interval
  useEffect(() => {
    if (!isReplaying || !isReplayPlaying) return;

    const interval = setInterval(() => {
      setReplayStep((step) => {
        if (step >= recordedMoves.length) {
          setIsReplayPlaying(false);
          return step;
        }
        const next = step + 1;
        stepReplay(next);
        return next;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isReplaying, isReplayPlaying, recordedMoves.length, stepReplay]);

  const handleStartReplay = () => {
    setIsWon(false);
    setIsReplaying(true);
    setReplayStep(0);
    setIsReplayPlaying(true);
    stepReplay(0);
  };

  const handleExitReplay = () => {
    setIsReplaying(false);
    setIsReplayPlaying(false);
    setIsWon(true);
  };

  // Audio Toggle
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audio.setMuted(next);
  };

  const handleSetSfxVolume = (vol: number) => {
    setSfxVolume(vol);
    audio.setSfxVolume(vol);
  };

  // Shape change handler
  const handleSelectShape = (newShape: BoardShape) => {
    setShape(newShape);
    setHoles((prevHoles) => {
      if (prevHoles.length === 0) return prevHoles;
      const newHolePositions = generateHoles(prevHoles.length, 400, 400, 260, newShape);
      const updated = prevHoles.map((h, i) => ({
        ...h,
        x: newHolePositions[i].x,
        y: newHolePositions[i].y,
        angle: newHolePositions[i].angle,
      }));

      setRopes((prevRopes) => {
        const holesMap = new Map<number, Hole>();
        updated.forEach((h) => holesMap.set(h.id, h));
        return prevRopes.map((rope) => {
          const h1 = holesMap.get(rope.startHoleId);
          const h2 = holesMap.get(rope.endHoleId);
          if (h1 && h2) {
            physicsSystem.resetToChord(rope, h1, h2);
          }
          return rope;
        });
      });
      return updated;
    });
  };

  const currentTheme = THEMES[themeId] || THEMES.classic_wood;
  const untangledCount = ropes.filter((r) => r.isUntangled).length;

  return (
    <div
      id="app-root"
      className={`w-full h-screen flex flex-col justify-between overflow-hidden bg-gradient-to-b ${currentTheme.bgGradient} text-[#f5eedc] select-none font-sans`}
    >
      {/* 1. Header Bar */}
      <Header
        mode={mode}
        onSelectMode={(m) => {
          setMode(m);
          initPuzzle(undefined, undefined, m);
        }}
        difficulty={difficulty}
        onSelectDifficulty={(d) => {
          setDifficulty(d);
          initPuzzle(undefined, d);
        }}
        seed={seed}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsSettingsOpen(true)}
      />

      {/* 2. Interactive Canvas Arena */}
      <main
        id="puzzle-main"
        className="flex-1 flex flex-col items-center justify-center relative w-full h-full min-h-0 overflow-hidden"
      >
        <GameCanvas
          themeId={themeId}
          shape={shape}
          holes={holes}
          ropes={ropes}
          intersections={intersections}
          selectedRopeId={selectedRopeId}
          selectedEnd={selectedEnd}
          onSelectPeg={handleSelectPeg}
          onMovePeg={handleMovePeg}
          hintHighlight={hintHighlight}
          particles={particles}
          setParticles={setParticles}
          boardShake={boardShake}
          setBoardShake={setBoardShake}
        />
      </main>

      {/* 3. Bottom HUD Controls Bar */}
      <HUD
        mode={mode}
        timerSeconds={timerSeconds}
        movesCount={movesCount}
        benchmarkMoves={benchmarkMoves}
        crossingsCount={intersections.length}
        totalRopes={ropes.length}
        untangledRopesCount={untangledCount}
        comboCount={comboCount}
        endlessScore={endlessScore}
        hintsLeft={hintsLeft}
        canUndo={moveHistory.length > 0 && !isWon}
        onUndo={handleUndo}
        onHint={handleHint}
        onRestart={handleRestart}
        onNewPuzzle={() => initPuzzle()}
      />

      {/* 4. Victory Modal */}
      <VictoryModal
        isOpen={isWon}
        mode={mode}
        seed={seed}
        timeSeconds={timerSeconds}
        movesCount={movesCount}
        benchmarkMoves={benchmarkMoves}
        maxCombo={maxCombo}
        onNextPuzzle={() => initPuzzle()}
        onRestart={handleRestart}
        onWatchReplay={handleStartReplay}
      />

      {/* 5. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={themeId}
        onSelectTheme={setThemeId}
        currentShape={shape}
        onSelectShape={handleSelectShape}
        sfxVolume={sfxVolume}
        onSetSfxVolume={handleSetSfxVolume}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        stats={stats}
      />

      {/* 6. Replay Viewer Control Bar */}
      <ReplayViewer
        isReplaying={isReplaying}
        currentStep={replayStep}
        totalSteps={recordedMoves.length}
        isPlaying={isReplayPlaying}
        onTogglePlay={() => setIsReplayPlaying((p) => !p)}
        onStepForward={() => stepReplay(Math.min(recordedMoves.length, replayStep + 1))}
        onStepBackward={() => stepReplay(Math.max(0, replayStep - 1))}
        onExitReplay={handleExitReplay}
      />
    </div>
  );
}
