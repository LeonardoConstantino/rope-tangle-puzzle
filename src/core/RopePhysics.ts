import { Hole, Particle, Rope } from '../types';

export interface DragState {
  ropeId: string;
  end: 'start' | 'end';
  currentX: number;
  currentY: number;
  hoverHoleId: number | null;
  isValidHover: boolean;
}

export class RopePhysicsSystem {
  private damping: number = 0.94;
  private gravity: number = 0.05; // Gentle downward sag
  private constraintIterations: number = 4;

  /**
   * Updates all active rope particles using Verlet Integration and Distance Constraints.
   */
  public update(
    ropes: Rope[],
    holes: Hole[],
    dragState: DragState | null,
    time: number
  ) {
    const holesMap = new Map<number, Hole>();
    holes.forEach((h) => holesMap.set(h.id, h));

    for (const rope of ropes) {
      if (rope.isUntangled) continue;

      const numP = rope.particles.length;
      const startHole = holesMap.get(rope.startHoleId);
      const endHole = holesMap.get(rope.endHoleId);
      if (!startHole || !endHole) continue;

      // Determine target endpoints (hole or drag position)
      let startTargetX = startHole.x;
      let startTargetY = startHole.y;
      let endTargetX = endHole.x;
      let endTargetY = endHole.y;

      if (dragState && dragState.ropeId === rope.id) {
        if (dragState.end === 'start') {
          startTargetX = dragState.currentX;
          startTargetY = dragState.currentY;
        } else {
          endTargetX = dragState.currentX;
          endTargetY = dragState.currentY;
        }
      }

      // Pin first and last particle
      const p0 = rope.particles[0];
      p0.x = startTargetX;
      p0.y = startTargetY;
      p0.oldX = startTargetX;
      p0.oldY = startTargetY;

      const pLast = rope.particles[numP - 1];
      pLast.x = endTargetX;
      pLast.y = endTargetY;
      pLast.oldX = endTargetX;
      pLast.oldY = endTargetY;

      // 1. Verlet integration for inner particles
      for (let i = 1; i < numP - 1; i++) {
        const p = rope.particles[i];
        const vx = (p.x - p.oldX) * this.damping;
        const vy = (p.y - p.oldY) * this.damping + this.gravity;

        p.oldX = p.x;
        p.oldY = p.y;
        p.x += vx;
        p.y += vy;

        // Subtle idle breathing
        const idleWave = Math.sin(time * 0.002 + rope.wobblePhase + i * 0.5) * 0.04;
        p.y += idleWave;
      }

      // 2. Target distance constraint per segment
      const totalSpan = Math.hypot(endTargetX - startTargetX, endTargetY - startTargetY);
      const segmentRestLength = totalSpan / (numP - 1);

      // Relax constraints multiple times for stability
      for (let iter = 0; iter < this.constraintIterations; iter++) {
        for (let i = 0; i < numP - 1; i++) {
          const p1 = rope.particles[i];
          const p2 = rope.particles[i + 1];

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 0.001) continue;

          const diff = (dist - segmentRestLength) / dist;
          const offsetX = dx * diff * 0.5;
          const offsetY = dy * diff * 0.5;

          if (i > 0) {
            p1.x += offsetX;
            p1.y += offsetY;
          }
          if (i + 1 < numP - 1) {
            p2.x -= offsetX;
            p2.y -= offsetY;
          }
        }
      }
    }
  }

  /**
   * Applies an impulse wave along the rope when it snaps into a new peg hole.
   */
  public applySnapImpulse(rope: Rope, snappedEnd: 'start' | 'end') {
    const numP = rope.particles.length;
    for (let i = 1; i < numP - 1; i++) {
      const p = rope.particles[i];
      const factor = snappedEnd === 'start' ? 1 - i / numP : i / numP;
      const angle = (Math.random() - 0.5) * Math.PI;
      const force = factor * 14;
      p.oldX = p.x - Math.cos(angle) * force;
      p.oldY = p.y - Math.sin(angle) * force;
    }
  }

  /**
   * Smoothly interpolates particles during an Undo action or initialization.
   */
  public resetToChord(rope: Rope, startHole: Hole, endHole: Hole) {
    const numP = rope.particles.length;
    for (let i = 0; i < numP; i++) {
      const t = i / (numP - 1);
      const px = startHole.x + (endHole.x - startHole.x) * t;
      const py = startHole.y + (endHole.y - startHole.y) * t;
      rope.particles[i].x = px;
      rope.particles[i].y = py;
      rope.particles[i].oldX = px;
      rope.particles[i].oldY = py;
    }
  }
}

export const physicsSystem = new RopePhysicsSystem();
