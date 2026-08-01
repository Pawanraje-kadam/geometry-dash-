import {
  GAME_WIDTH, GAME_HEIGHT, GROUND_HEIGHT, PLAYER_SIZE,
  GRAVITY, JUMP_FORCE, GAME_SPEED_INITIAL, GAME_SPEED_INCREMENT,
  OBSTACLE_MIN_GAP, OBSTACLE_MAX_GAP,
  PARTICLE_COUNT_JUMP, PARTICLE_COUNT_DEATH,
  SCREEN_SHAKE_DURATION, SCREEN_SHAKE_INTENSITY, COLORS,
} from './constants';
import { GameData, Particle, Obstacle, Star, Player, ScreenShake } from './types';

function loadHighScores(): number[] {
  try {
    const saved = localStorage.getItem('neondash_highscores');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveHighScores(scores: number[]) {
  try {
    localStorage.setItem('neondash_highscores', JSON.stringify(scores));
  } catch {}
}

function createStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * (GAME_HEIGHT - GROUND_HEIGHT - 40),
      size: Math.random() * 2.5 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
      brightness: Math.random(),
      twinkleSpeed: Math.random() * 0.03 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

function createPlayer(): Player {
  return {
    x: 120,
    y: GAME_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
    vy: 0,
    rotation: 0,
    isGrounded: true,
    isDead: false,
    squash: 1,
    stretch: 1,
  };
}

export function createGameData(): GameData {
  return {
    player: createPlayer(),
    obstacles: [],
    orbs: [],
    particles: [],
    stars: createStars(),
    score: 0,
    distance: 0,
    gameSpeed: GAME_SPEED_INITIAL,
    groundOffset: 0,
    screenShake: { intensity: 0, duration: 0, elapsed: 0, active: false },
    state: 'menu',
    highScores: loadHighScores(),
    lastObstacleX: GAME_WIDTH + 200,
    combo: 0,
    maxCombo: 0,
    flashAlpha: 0,
    time: 0,
    bgPulse: 0,
    attemptCount: 0,
    orbsCollected: 0,
  };
}

export function resetGame(game: GameData) {
  game.player = createPlayer();
  game.obstacles = [];
  game.orbs = [];
  game.particles = [];
  game.score = 0;
  game.distance = 0;
  game.gameSpeed = GAME_SPEED_INITIAL;
  game.groundOffset = 0;
  game.screenShake = { intensity: 0, duration: 0, elapsed: 0, active: false };
  game.lastObstacleX = GAME_WIDTH + 200;
  game.combo = 0;
  game.maxCombo = 0;
  game.flashAlpha = 0;
  game.time = 0;
  game.bgPulse = 0;
  game.orbsCollected = 0;
  game.attemptCount++;
}

function spawnParticles(game: GameData, x: number, y: number, count: number, color: string, type: Particle['type'], spread: number = 4) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * spread + 1;
    game.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (type === 'jump' ? 2 : 0),
      life: 1,
      maxLife: Math.random() * 30 + 20,
      size: Math.random() * 4 + 2,
      color,
      type,
    });
  }
}

function spawnTrailParticle(game: GameData) {
  const p = game.player;
  game.particles.push({
    x: p.x - PLAYER_SIZE / 2 + Math.random() * 4 - 2,
    y: p.y + PLAYER_SIZE / 2 + Math.random() * 4,
    vx: -game.gameSpeed * 0.3 + Math.random() * 0.5,
    vy: Math.random() * -1,
    life: 1,
    maxLife: 15 + Math.random() * 10,
    size: Math.random() * 3 + 1,
    color: COLORS.particleTrail,
    type: 'trail',
  });
}

function generateObstacle(game: GameData): Obstacle {
  const groundY = GAME_HEIGHT - GROUND_HEIGHT;
  const typeRoll = Math.random();
  let type: Obstacle['type'];
  let width: number;
  let height: number;

  if (typeRoll < 0.35) {
    type = 'spike';
    width = PLAYER_SIZE;
    height = PLAYER_SIZE;
  } else if (typeRoll < 0.6) {
    type = 'block';
    width = PLAYER_SIZE * 1.2;
    height = PLAYER_SIZE * 1.2;
  } else if (typeRoll < 0.8) {
    type = 'tall';
    width = PLAYER_SIZE * 0.8;
    height = PLAYER_SIZE * 2;
  } else {
    type = 'double_spike';
    width = PLAYER_SIZE * 2;
    height = PLAYER_SIZE;
  }

  return {
    x: game.lastObstacleX + OBSTACLE_MIN_GAP + Math.random() * (OBSTACLE_MAX_GAP - OBSTACLE_MIN_GAP),
    y: groundY - height,
    width,
    height,
    type,
    passed: false,
  };
}

function generateOrb(game: GameData, obstacleX: number) {
  if (Math.random() < 0.3) {
    game.orbs.push({
      x: obstacleX - 60 - Math.random() * 40,
      y: GAME_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE * 2 - Math.random() * 60,
      collected: false,
      pulse: 0,
    });
  }
}

export function jump(game: GameData) {
  if (game.state !== 'playing') return;
  const p = game.player;
  if (p.isGrounded && !p.isDead) {
    p.vy = JUMP_FORCE;
    p.isGrounded = false;
    p.squash = 0.7;
    p.stretch = 1.3;
    spawnParticles(game, p.x, p.y + PLAYER_SIZE, PARTICLE_COUNT_JUMP, COLORS.particleJump, 'jump', 3);
    // ground dust
    for (let i = 0; i < 5; i++) {
      game.particles.push({
        x: p.x + Math.random() * PLAYER_SIZE - PLAYER_SIZE / 2,
        y: GAME_HEIGHT - GROUND_HEIGHT,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 2,
        life: 1,
        maxLife: 20,
        size: Math.random() * 3 + 1,
        color: '#6a6aae',
        type: 'ground',
      });
    }
  }
}

function triggerScreenShake(game: GameData, intensity: number = SCREEN_SHAKE_INTENSITY, duration: number = SCREEN_SHAKE_DURATION) {
  game.screenShake = {
    intensity,
    duration,
    elapsed: 0,
    active: true,
  };
}

function killPlayer(game: GameData) {
  if (game.player.isDead) return;
  game.player.isDead = true;
  game.flashAlpha = 0.6;
  triggerScreenShake(game, 12, 400);
  spawnParticles(game, game.player.x + PLAYER_SIZE / 2, game.player.y + PLAYER_SIZE / 2, PARTICLE_COUNT_DEATH, COLORS.particleDeath, 'death', 6);
  // also spawn player-colored particles
  spawnParticles(game, game.player.x + PLAYER_SIZE / 2, game.player.y + PLAYER_SIZE / 2, 15, COLORS.player, 'death', 5);

  // Save score
  const finalScore = Math.floor(game.score);
  game.highScores.push(finalScore);
  game.highScores.sort((a, b) => b - a);
  game.highScores = game.highScores.slice(0, 10);
  saveHighScores(game.highScores);

  setTimeout(() => {
    game.state = 'gameover';
  }, 600);
}

function checkCollision(player: Player, obstacle: Obstacle): boolean {
  const px = player.x;
  const py = player.y;
  const ps = PLAYER_SIZE;
  const shrink = 6; // Forgiving hitbox

  if (obstacle.type === 'spike' || obstacle.type === 'double_spike') {
    // Triangle collision approximation with a shrunken inner rect
    const ox = obstacle.x;
    const oy = obstacle.y;
    const ow = obstacle.width;
    const oh = obstacle.height;
    // Use a smaller inner box for spikes
    const innerShrink = 8;
    return (
      px + ps - shrink > ox + innerShrink &&
      px + shrink < ox + ow - innerShrink &&
      py + ps - shrink > oy + innerShrink &&
      py + shrink < oy + oh
    );
  }

  return (
    px + ps - shrink > obstacle.x + 4 &&
    px + shrink < obstacle.x + obstacle.width - 4 &&
    py + ps - shrink > obstacle.y + 4 &&
    py + shrink < obstacle.y + obstacle.height - 4
  );
}

export function update(game: GameData, dt: number) {
  if (game.state !== 'playing') return;

  const dtScale = dt / 16.667; // normalize to 60fps
  game.time += dt;

  const p = game.player;
  if (p.isDead) return;

  // Update game speed
  game.gameSpeed = GAME_SPEED_INITIAL + game.distance * GAME_SPEED_INCREMENT;
  const speed = game.gameSpeed * dtScale;

  // Update distance & score
  game.distance += speed;
  game.score += speed * 0.05;

  // Background pulse
  game.bgPulse = Math.sin(game.time * 0.002) * 0.15 + 0.85;

  // Ground offset
  game.groundOffset = (game.groundOffset + speed) % 40;

  // Player physics
  p.vy += GRAVITY * dtScale;
  p.y += p.vy * dtScale;

  const groundLevel = GAME_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE;
  if (p.y >= groundLevel) {
    p.y = groundLevel;
    p.vy = 0;
    if (!p.isGrounded) {
      p.squash = 1.3;
      p.stretch = 0.7;
      // landing particles
      for (let i = 0; i < 3; i++) {
        game.particles.push({
          x: p.x + Math.random() * PLAYER_SIZE,
          y: GAME_HEIGHT - GROUND_HEIGHT,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 1.5,
          life: 1,
          maxLife: 15,
          size: Math.random() * 2 + 1,
          color: '#6a6aae',
          type: 'ground',
        });
      }
    }
    p.isGrounded = true;
  }

  // Rotation
  if (!p.isGrounded) {
    p.rotation += 5 * dtScale;
  } else {
    // Snap to nearest 90 degrees
    const target = Math.round(p.rotation / 90) * 90;
    p.rotation += (target - p.rotation) * 0.3;
  }

  // Squash & stretch recovery
  p.squash += (1 - p.squash) * 0.15;
  p.stretch += (1 - p.stretch) * 0.15;

  // Trail particles
  if (Math.random() < 0.4) {
    spawnTrailParticle(game);
  }

  // Generate obstacles
  const furthestObstacle = game.obstacles.length > 0 ? Math.max(...game.obstacles.map(o => o.x)) : 0;
  if (game.obstacles.length === 0 || furthestObstacle < GAME_WIDTH + 100) {
    const newObs = generateObstacle(game);
    game.lastObstacleX = newObs.x;
    game.obstacles.push(newObs);
    generateOrb(game, newObs.x);
  }

  // Update obstacles
  for (let i = game.obstacles.length - 1; i >= 0; i--) {
    const obs = game.obstacles[i];
    obs.x -= speed;

    // Score when passed
    if (!obs.passed && obs.x + obs.width < p.x) {
      obs.passed = true;
      game.combo++;
      if (game.combo > game.maxCombo) game.maxCombo = game.combo;
    }

    // Collision
    if (checkCollision(p, obs)) {
      killPlayer(game);
      return;
    }

    // Remove off-screen
    if (obs.x + obs.width < -50) {
      game.obstacles.splice(i, 1);
    }
  }

  // Update orbs
  for (let i = game.orbs.length - 1; i >= 0; i--) {
    const orb = game.orbs[i];
    orb.x -= speed;
    orb.pulse += 0.08;

    if (!orb.collected) {
      const dx = (p.x + PLAYER_SIZE / 2) - orb.x;
      const dy = (p.y + PLAYER_SIZE / 2) - orb.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < PLAYER_SIZE) {
        orb.collected = true;
        game.score += 25;
        game.orbsCollected++;
        game.flashAlpha = 0.15;
        spawnParticles(game, orb.x, orb.y, 10, COLORS.orb, 'orb', 4);
      }
    }

    if (orb.x < -50) {
      game.orbs.splice(i, 1);
    }
  }

  // Update particles
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const part = game.particles[i];
    part.x += part.vx * dtScale;
    part.y += part.vy * dtScale;
    if (part.type === 'death' || part.type === 'jump' || part.type === 'orb') {
      part.vy += 0.1 * dtScale;
    }
    part.life -= (1 / part.maxLife) * dtScale;
    if (part.life <= 0) {
      game.particles.splice(i, 1);
    }
  }

  // Update stars
  for (const star of game.stars) {
    star.x -= star.speed * dtScale;
    star.twinklePhase += star.twinkleSpeed * dtScale;
    if (star.x < -5) {
      star.x = GAME_WIDTH + 5;
      star.y = Math.random() * (GAME_HEIGHT - GROUND_HEIGHT - 40);
    }
  }

  // Screen shake
  if (game.screenShake.active) {
    game.screenShake.elapsed += dt;
    if (game.screenShake.elapsed >= game.screenShake.duration) {
      game.screenShake.active = false;
    }
  }

  // Flash decay
  if (game.flashAlpha > 0) {
    game.flashAlpha -= 0.02 * dtScale;
    if (game.flashAlpha < 0) game.flashAlpha = 0;
  }
}

export function getShakeOffset(shake: ScreenShake): { x: number; y: number } {
  if (!shake.active) return { x: 0, y: 0 };
  const progress = shake.elapsed / shake.duration;
  const decay = 1 - progress;
  const intensity = shake.intensity * decay;
  return {
    x: (Math.random() - 0.5) * intensity * 2,
    y: (Math.random() - 0.5) * intensity * 2,
  };
}
