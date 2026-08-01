// Game constants
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 500;
export const GROUND_HEIGHT = 80;
export const PLAYER_SIZE = 36;
export const GRAVITY = 0.65;
export const JUMP_FORCE = -12.5;
export const GAME_SPEED_INITIAL = 5.5;
export const GAME_SPEED_INCREMENT = 0.0008;
export const OBSTACLE_MIN_GAP = 220;
export const OBSTACLE_MAX_GAP = 380;
export const PARTICLE_COUNT_JUMP = 8;
export const PARTICLE_COUNT_DEATH = 30;
export const PARTICLE_COUNT_TRAIL = 1;
export const SCREEN_SHAKE_DURATION = 300;
export const SCREEN_SHAKE_INTENSITY = 8;

export const COLORS = {
  bg: '#0a0a1a',
  bgGradientTop: '#0d0d2b',
  bgGradientBottom: '#1a0a2e',
  ground: '#1a1a3e',
  groundLine: '#3a3a7e',
  groundGrid: '#2a2a5e',
  player: '#00ffaa',
  playerGlow: 'rgba(0, 255, 170, 0.4)',
  playerOutline: '#00cc88',
  obstacle: '#ff3366',
  obstacleGlow: 'rgba(255, 51, 102, 0.4)',
  spike: '#ff2255',
  spikeGlow: 'rgba(255, 34, 85, 0.5)',
  particleJump: '#00ffaa',
  particleDeath: '#ff3366',
  particleTrail: '#00ffaa',
  text: '#ffffff',
  textGlow: 'rgba(0, 255, 170, 0.6)',
  scoreText: '#00ffaa',
  uiPanel: 'rgba(10, 10, 30, 0.9)',
  uiBorder: '#3a3a7e',
  star: '#ffffff',
  orb: '#ffaa00',
  orbGlow: 'rgba(255, 170, 0, 0.5)',
};
