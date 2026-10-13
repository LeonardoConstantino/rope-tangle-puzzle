export type GameMode = 'puzzle' | 'daily' | 'endless';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type BiomeTheme = 'classic_wood' | 'enchanted_forest' | 'cyber_neon' | 'royal_rosewood';
export type BoardShape = 'circle' | 'octagon' | 'star';

export interface Point {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  pinned: boolean;
  targetX?: number;
  targetY?: number;
}

export interface Hole {
  id: number;
  index: number;
  x: number;
  y: number;
  angle: number; // in radians
  isOccupied: boolean;
  occupiedByRopeId?: string;
  occupiedEnd?: 'start' | 'end';
}

export interface RopeColor {
  name: string;
  primary: string;
  shadow: string;
  highlight: string;
  glow: string;
  weave: string;
}

export interface Rope {
  id: string;
  color: RopeColor;
  startHoleId: number;
  endHoleId: number;
  particles: Particle[];
  noteIndex: number;
  isUntangled: boolean;
  untangleProgress: number; // 0 -> 1 during untangle disappearance
  wearCount: number;
  wobblePhase: number;
  createdAt: number;
}

export interface IntersectionPoint {
  id: string;
  ropeAId: string;
  ropeBId: string;
  x: number;
  y: number;
  segA: number;
  segB: number;
  pulsePhase: number;
  age: number;
}

export interface MoveStep {
  ropeId: string;
  endMoved: 'start' | 'end';
  fromHoleId: number;
  toHoleId: number;
  timestamp: number;
}

export interface HintAction {
  ropeId: string;
  endToMove: 'start' | 'end';
  fromHoleId: number;
  toHoleId: number;
  crossingsReduced: number;
}

export interface GameStats {
  puzzlesCompleted: number;
  totalRopesUntangled: number;
  dailyStreak: number;
  lastDailyDate: string;
  bestEndlessScore: number;
  unlockedThemes: string[];
}

export interface ThemeConfig {
  id: BiomeTheme;
  name: string;
  boardBase: string;
  boardDark: string;
  boardGrain: string;
  boardRim: string;
  boardGlow: string;
  holeInner: string;
  holeRim: string;
  holeHighlight: string;
  bgGradient: string;
  accentColor: string;
  ropePalettes: RopeColor[];
}

export interface ParticleEffect {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'spark' | 'ring' | 'smoke' | 'wood_chip' | 'note';
}
