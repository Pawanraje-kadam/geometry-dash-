export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'jump' | 'death' | 'trail' | 'orb' | 'ground';
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'spike' | 'block' | 'tall' | 'double_spike';
  passed: boolean;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

export interface Orb {
  x: number;
  y: number;
  collected: boolean;
  pulse: number;
}

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover';

export interface Player {
  x: number;
  y: number;
  vy: number;
  rotation: number;
  isGrounded: boolean;
  isDead: boolean;
  squash: number;
  stretch: number;
}

export interface ScreenShake {
  intensity: number;
  duration: number;
  elapsed: number;
  active: boolean;
}

export interface GameData {
  player: Player;
  obstacles: Obstacle[];
  orbs: Orb[];
  particles: Particle[];
  stars: Star[];
  score: number;
  distance: number;
  gameSpeed: number;
  groundOffset: number;
  screenShake: ScreenShake;
  state: GameState;
  highScores: number[];
  lastObstacleX: number;
  combo: number;
  maxCombo: number;
  flashAlpha: number;
  time: number;
  bgPulse: number;
  attemptCount: number;
  orbsCollected: number;
}
