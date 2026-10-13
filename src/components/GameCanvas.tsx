import React, { useRef, useEffect, useCallback } from 'react';
import {
  BiomeTheme,
  BoardShape,
  Hole,
  IntersectionPoint,
  MoveStep,
  ParticleEffect,
  Rope,
} from '../types';
import { THEMES } from '../core/themeData';
import { canvasRenderer } from '../renderer/CanvasRenderer';
import { DragState, physicsSystem } from '../core/RopePhysics';
import { audio } from '../audio/AudioEngine';
import { computeIntersections } from '../core/IntersectionEngine';

interface GameCanvasProps {
  themeId: BiomeTheme;
  shape: BoardShape;
  holes: Hole[];
  ropes: Rope[];
  intersections: IntersectionPoint[];
  selectedRopeId: string | null;
  selectedEnd: 'start' | 'end' | null;
  onSelectPeg: (ropeId: string | null, end: 'start' | 'end' | null) => void;
  onMovePeg: (ropeId: string, end: 'start' | 'end', targetHoleId: number) => void;
  hintHighlight: { ropeId: string; end: 'start' | 'end'; targetHoleId: number } | null;
  particles: ParticleEffect[];
  setParticles: React.Dispatch<React.SetStateAction<ParticleEffect[]>>;
  boardShake: { x: number; y: number; trauma: number };
  setBoardShake: React.Dispatch<
    React.SetStateAction<{ x: number; y: number; trauma: number }>
  >;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  themeId,
  shape,
  holes,
  ropes,
  intersections,
  selectedRopeId,
  selectedEnd,
  onSelectPeg,
  onMovePeg,
  hintHighlight,
  particles,
  setParticles,
  boardShake,
  setBoardShake,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const isPointerDownRef = useRef(false);
  const pointerStartPos = useRef({ x: 0, y: 0 });

  // Get current theme config
  const theme = THEMES[themeId] || THEMES.classic_wood;

  // Convert client pointer coordinate to 800x800 virtual coordinate space
  const getCanvasCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 400, y: 400 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = 800 / (rect.width || 1);
    const scaleY = 800 / (rect.height || 1);
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  // Find peg under coordinate
  const hitTestPeg = useCallback(
    (x: number, y: number): { ropeId: string; end: 'start' | 'end'; holeId: number } | null => {
      const activeRopes = ropes.filter((r) => !r.isUntangled);
      const holesMap = new Map<number, Hole>();
      holes.forEach((h) => holesMap.set(h.id, h));

      const HIT_RADIUS = 24;

      for (const rope of activeRopes) {
        const startHole = holesMap.get(rope.startHoleId);
        const endHole = holesMap.get(rope.endHoleId);

        if (startHole && Math.hypot(x - startHole.x, y - startHole.y) <= HIT_RADIUS) {
          return { ropeId: rope.id, end: 'start', holeId: startHole.id };
        }
        if (endHole && Math.hypot(x - endHole.x, y - endHole.y) <= HIT_RADIUS) {
          return { ropeId: rope.id, end: 'end', holeId: endHole.id };
        }
      }
      return null;
    },
    [ropes, holes]
  );

  // Find hole under coordinate
  const hitTestHole = useCallback(
    (x: number, y: number): Hole | null => {
      const HIT_RADIUS = 26;
      for (const hole of holes) {
        if (Math.hypot(x - hole.x, y - hole.y) <= HIT_RADIUS) {
          return hole;
        }
      }
      return null;
    },
    [holes]
  );

  // Handle Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    audio.unlock();
    const { x, y } = getCanvasCoords(e);
    pointerStartPos.current = { x, y };
    isPointerDownRef.current = true;

    // 1. If user clicks directly on a peg
    const hitPeg = hitTestPeg(x, y);
    if (hitPeg) {
      onSelectPeg(hitPeg.ropeId, hitPeg.end);
      audio.playWoodPick();

      dragStateRef.current = {
        ropeId: hitPeg.ropeId,
        end: hitPeg.end,
        currentX: x,
        currentY: y,
        hoverHoleId: null,
        isValidHover: false,
      };

      // Particle pick burst
      setParticles((prev) => [
        ...prev,
        {
          x,
          y,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2 - 1,
          color: theme.holeHighlight,
          size: 3,
          alpha: 1,
          life: 18,
          maxLife: 18,
          type: 'spark',
        },
      ]);
      return;
    }

    // 2. If a peg was already selected and user clicks on a hole
    if (selectedRopeId && selectedEnd) {
      const hitHole = hitTestHole(x, y);
      if (hitHole) {
        const rope = ropes.find((r) => r.id === selectedRopeId);
        if (rope) {
          const currentHoleId =
            selectedEnd === 'start' ? rope.startHoleId : rope.endHoleId;
          const otherHoleId =
            selectedEnd === 'start' ? rope.endHoleId : rope.startHoleId;

          if (!hitHole.isOccupied && hitHole.id !== otherHoleId) {
            // Valid Move!
            onMovePeg(selectedRopeId, selectedEnd, hitHole.id);
            onSelectPeg(null, null);
            dragStateRef.current = null;
            return;
          } else if (hitHole.id === currentHoleId) {
            // Deselect
            onSelectPeg(null, null);
            dragStateRef.current = null;
            return;
          } else {
            // Invalid move
            audio.playInvalidBounce();
            return;
          }
        }
      } else {
        // Clicked empty board -> Deselect
        onSelectPeg(null, null);
        dragStateRef.current = null;
      }
    }
  };

  // Handle Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragStateRef.current) return;

    const { x, y } = getCanvasCoords(e);
    dragStateRef.current.currentX = x;
    dragStateRef.current.currentY = y;

    // Check proximity to empty hole
    const hitHole = hitTestHole(x, y);
    const rope = ropes.find((r) => r.id === dragStateRef.current?.ropeId);

    if (hitHole && rope) {
      const otherHoleId =
        dragStateRef.current.end === 'start' ? rope.endHoleId : rope.startHoleId;
      const isValid = !hitHole.isOccupied && hitHole.id !== otherHoleId;

      dragStateRef.current.hoverHoleId = hitHole.id;
      dragStateRef.current.isValidHover = isValid;
    } else {
      dragStateRef.current.hoverHoleId = null;
      dragStateRef.current.isValidHover = false;
    }
  };

  // Handle Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = false;
    const drag = dragStateRef.current;
    if (!drag) return;

    const { x, y } = getCanvasCoords(e);
    const distDragged = Math.hypot(
      x - pointerStartPos.current.x,
      y - pointerStartPos.current.y
    );

    // If dragged sufficiently to a new hole
    if (distDragged > 15 && drag.hoverHoleId !== null && drag.isValidHover) {
      onMovePeg(drag.ropeId, drag.end, drag.hoverHoleId);
      onSelectPeg(null, null);
    } else if (distDragged > 15 && drag.hoverHoleId !== null && !drag.isValidHover) {
      audio.playInvalidBounce();
    }

    dragStateRef.current = null;
  };

  // Animation & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = currentTime - lastTime;
      lastTime = currentTime;

      // Update particle physics for ropes
      physicsSystem.update(ropes, holes, dragStateRef.current, currentTime);

      // Update transient particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 1,
            size: p.type === 'ring' ? p.size + 1.2 : p.size,
          }))
          .filter((p) => p.life > 0)
      );

      // Dampen board shake
      setBoardShake((prev) => ({
        ...prev,
        trauma: Math.max(0, prev.trauma - dt * 0.003),
      }));

      // Render frame
      canvasRenderer.render({
        canvas,
        ctx,
        width: canvas.width / (window.devicePixelRatio || 1),
        height: canvas.height / (window.devicePixelRatio || 1),
        dpr: window.devicePixelRatio || 1,
        theme,
        shape,
        holes,
        ropes,
        intersections,
        selectedRopeId,
        selectedEnd,
        dragState: dragStateRef.current,
        particles,
        boardShake,
        hintHighlight,
        time: currentTime,
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    theme,
    shape,
    holes,
    ropes,
    intersections,
    selectedRopeId,
    selectedEnd,
    particles,
    boardShake,
    hintHighlight,
    setParticles,
    setBoardShake,
  ]);

  // Responsive Canvas Resize Observer
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height || 600, 780);
      const dpr = window.devicePixelRatio || 1;

      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      id="game-canvas-container"
      className="w-full flex-1 flex items-center justify-center relative p-2 touch-none select-none overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        id="puzzle-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="cursor-pointer max-w-full max-h-full rounded-full shadow-2xl transition-transform active:cursor-grabbing"
      />
    </div>
  );
};
