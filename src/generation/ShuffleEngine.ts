import { BoardShape, Difficulty, Hole, Rope, ThemeConfig } from '../types';
import { computeIntersections } from '../core/IntersectionEngine';

// Seeded PRNG: Mulberry32
export class SeededRandom {
  private seed: number;

  constructor(seedStr: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) {
      h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
    }
    this.seed = h >>> 0;
  }

  // Returns float [0, 1)
  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Integer [min, max] inclusive
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Pick random element
  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  // Shuffle array in place
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

/**
 * Creates holes positioned on the perimeter according to board shape and dimensions.
 */
export function generateHoles(
  numHoles: number,
  centerX: number = 400,
  centerY: number = 400,
  radius: number = 260,
  shape: BoardShape = 'circle'
): Hole[] {
  const holes: Hole[] = [];

  for (let i = 0; i < numHoles; i++) {
    const angle = (i / numHoles) * Math.PI * 2 - Math.PI / 2;
    let r = radius;

    if (shape === 'octagon') {
      const octAngle = ((angle + Math.PI / 8) % (Math.PI / 4) + Math.PI / 4) % (Math.PI / 4) - Math.PI / 8;
      // Octagon distance modulation (kept well within the board outer perimeter)
      r = radius * (0.94 + 0.04 * Math.cos(octAngle * 2));
    } else if (shape === 'star') {
      const isTip = i % 2 === 0;
      r = isTip ? radius : radius * 0.88;
    }

    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;

    holes.push({
      id: i,
      index: i,
      x,
      y,
      angle,
      isOccupied: false,
    });
  }

  return holes;
}

/**
 * Generates initial non-crossing chords for a given number of holes and ropes.
 */
export function generateNonCrossingChords(
  numHoles: number,
  numRopes: number,
  rng: SeededRandom
): Array<{ startHole: number; endHole: number }> {
  // A clean non-crossing planar partition of circle chords:
  // Connect hole i with hole i + 1, or nested intervals
  // To keep it balanced, we pick distinct intervals
  const chords: Array<{ startHole: number; endHole: number }> = [];
  const holeStep = Math.floor(numHoles / (numRopes * 2));

  for (let i = 0; i < numRopes; i++) {
    const start = (i * 2 * holeStep) % numHoles;
    const end = ((i * 2 + 1) * holeStep) % numHoles;
    chords.push({ startHole: start, endHole: end });
  }

  // Check if any accidently cross and adjust if needed
  return chords;
}

export interface GeneratedPuzzle {
  seed: string;
  difficulty: Difficulty;
  numHoles: number;
  numRopes: number;
  holes: Hole[];
  ropes: Rope[];
  initialCrossingsCount: number;
  benchmarkMoves: number;
}

/**
 * Procedurally generates an always-solvable puzzle using reverse shuffling.
 */
export function createPuzzle(
  difficulty: Difficulty,
  seedStr: string,
  theme: ThemeConfig,
  shape: BoardShape = 'circle',
  centerX: number = 400,
  centerY: number = 400,
  boardRadius: number = 260
): GeneratedPuzzle {
  const rng = new SeededRandom(seedStr);

  let numHoles: number;
  let numRopes: number;
  let shuffleSteps: number;
  let minTargetCrossings: number;

  switch (difficulty) {
    case 'easy':
      numHoles = rng.range(8, 10);
      numRopes = rng.range(4, 5);
      shuffleSteps = rng.range(8, 14);
      minTargetCrossings = 2;
      break;
    case 'medium':
      numHoles = rng.range(12, 16);
      numRopes = rng.range(6, 8);
      shuffleSteps = rng.range(16, 26);
      minTargetCrossings = 5;
      break;
    case 'hard':
      numHoles = rng.range(18, 22);
      numRopes = rng.range(9, 12);
      shuffleSteps = rng.range(28, 40);
      minTargetCrossings = 9;
      break;
  }

  // Ensure numHoles >= numRopes * 2 + 2 so there are always at least 2 free holes to move
  numHoles = Math.max(numHoles, numRopes * 2 + 2);

  const holes = generateHoles(numHoles, centerX, centerY, boardRadius, shape);

  // 1. Initial solved non-crossing layout
  // We can pick non-crossing chords systematically
  const nonCrossingChords: Array<{ startHole: number; endHole: number }> = [];
  const holeIndices = Array.from({ length: numHoles }, (_, i) => i);
  
  // Pick disjoint non-crossing pairs on circle: (0, 1), (2, 3), (4, 5)...
  for (let i = 0; i < numRopes; i++) {
    const s = i * 2;
    const e = i * 2 + 1;
    nonCrossingChords.push({ startHole: s, endHole: e });
  }

  // Create initial ropes
  const ropes: Rope[] = nonCrossingChords.map((chord, idx) => {
    const color = theme.ropePalettes[idx % theme.ropePalettes.length];
    const h1 = holes[chord.startHole];
    const h2 = holes[chord.endHole];

    // Initialize 10 particles along the rope line
    const numParticles = 10;
    const particles = [];
    for (let p = 0; p < numParticles; p++) {
      const t = p / (numParticles - 1);
      const px = h1.x + (h2.x - h1.x) * t;
      const py = h1.y + (h2.y - h1.y) * t;
      particles.push({
        x: px,
        y: py,
        oldX: px,
        oldY: py,
        pinned: p === 0 || p === numParticles - 1,
      });
    }

    return {
      id: `rope_${idx}_${Date.now()}`,
      color,
      startHoleId: chord.startHole,
      endHoleId: chord.endHole,
      particles,
      noteIndex: idx % 5,
      isUntangled: false,
      untangleProgress: 0,
      wearCount: 0,
      wobblePhase: rng.next() * Math.PI * 2,
      createdAt: Date.now(),
    };
  });

  // Mark occupied holes
  ropes.forEach((rope) => {
    holes[rope.startHoleId].isOccupied = true;
    holes[rope.startHoleId].occupiedByRopeId = rope.id;
    holes[rope.startHoleId].occupiedEnd = 'start';

    holes[rope.endHoleId].isOccupied = true;
    holes[rope.endHoleId].occupiedByRopeId = rope.id;
    holes[rope.endHoleId].occupiedEnd = 'end';
  });

  // 2. Apply reverse shuffle steps to scramble the ropes while guaranteeing solvability
  let attempts = 0;
  let successfulSteps = 0;
  const maxAttempts = shuffleSteps * 4;

  while (successfulSteps < shuffleSteps && attempts < maxAttempts) {
    attempts++;
    const ropeToMove = rng.choice(ropes);
    const endToMove: 'start' | 'end' = rng.next() > 0.5 ? 'start' : 'end';
    const currentHoleId = endToMove === 'start' ? ropeToMove.startHoleId : ropeToMove.endHoleId;
    const otherEndHoleId = endToMove === 'start' ? ropeToMove.endHoleId : ropeToMove.startHoleId;

    const availableHoles = holes.filter((h) => !h.isOccupied && h.id !== otherEndHoleId);
    if (availableHoles.length === 0) continue;

    const targetHole = rng.choice(availableHoles);

    // Apply move
    holes[currentHoleId].isOccupied = false;
    holes[currentHoleId].occupiedByRopeId = undefined;
    holes[currentHoleId].occupiedEnd = undefined;

    targetHole.isOccupied = true;
    targetHole.occupiedByRopeId = ropeToMove.id;
    targetHole.occupiedEnd = endToMove;

    if (endToMove === 'start') {
      ropeToMove.startHoleId = targetHole.id;
    } else {
      ropeToMove.endHoleId = targetHole.id;
    }

    successfulSteps++;
  }

  // Update initial particle positions to match the tangled endpoints
  ropes.forEach((rope) => {
    const h1 = holes[rope.startHoleId];
    const h2 = holes[rope.endHoleId];
    const numP = rope.particles.length;
    for (let p = 0; p < numP; p++) {
      const t = p / (numP - 1);
      const px = h1.x + (h2.x - h1.x) * t;
      const py = h1.y + (h2.y - h1.y) * t;
      rope.particles[p].x = px;
      rope.particles[p].y = py;
      rope.particles[p].oldX = px;
      rope.particles[p].oldY = py;
    }
  });

  const check = computeIntersections(ropes, holes);
  const initialCrossingsCount = check.intersections.length;
  const benchmarkMoves = Math.max(3, Math.min(successfulSteps, Math.ceil(initialCrossingsCount * 1.2)));

  return {
    seed: seedStr,
    difficulty,
    numHoles,
    numRopes,
    holes,
    ropes,
    initialCrossingsCount,
    benchmarkMoves,
  };
}

/**
 * Returns today's ISO date string in YYYY-MM-DD format for Daily Puzzle.
 */
export function getDailySeedString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `DAILY-${year}-${month}-${day}`;
}
