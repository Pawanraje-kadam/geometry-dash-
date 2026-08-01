import {
  GAME_WIDTH, GAME_HEIGHT, GROUND_HEIGHT, PLAYER_SIZE, COLORS,
} from './constants';
import { GameData, Particle, Obstacle } from './types';
import { getShakeOffset } from './engine';

// Generate static mountain shapes
const MOUNTAINS_BACK: number[][] = [];
const MOUNTAINS_FRONT: number[][] = [];

function initMountains() {
  if (MOUNTAINS_BACK.length > 0) return;
  // Back layer
  for (let i = 0; i < 3; i++) {
    const pts: number[] = [];
    const startX = i * 400 - 100;
    for (let x = 0; x <= 500; x += 20) {
      pts.push(startX + x);
      pts.push(GAME_HEIGHT - GROUND_HEIGHT - 60 - Math.random() * 100 - Math.sin(x * 0.02) * 40);
    }
    MOUNTAINS_BACK.push(pts);
  }
  // Front layer
  for (let i = 0; i < 4; i++) {
    const pts: number[] = [];
    const startX = i * 300 - 80;
    for (let x = 0; x <= 380; x += 15) {
      pts.push(startX + x);
      pts.push(GAME_HEIGHT - GROUND_HEIGHT - 20 - Math.random() * 50 - Math.sin(x * 0.03) * 25);
    }
    MOUNTAINS_FRONT.push(pts);
  }
}

function drawMountainLayer(ctx: CanvasRenderingContext2D, mountains: number[][], offset: number, color: string) {
  const groundY = GAME_HEIGHT - GROUND_HEIGHT;
  for (const pts of mountains) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(pts[0] - offset, groundY);
    for (let i = 0; i < pts.length; i += 2) {
      ctx.lineTo(pts[i] - offset, pts[i + 1]);
    }
    ctx.lineTo(pts[pts.length - 2] - offset, groundY);
    ctx.closePath();
    ctx.fill();
  }
}

export function render(ctx: CanvasRenderingContext2D, game: GameData, canvasWidth: number, canvasHeight: number) {
  initMountains();
  const scale = Math.min(canvasWidth / GAME_WIDTH, canvasHeight / GAME_HEIGHT);
  const offsetX = (canvasWidth - GAME_WIDTH * scale) / 2;
  const offsetY = (canvasHeight - GAME_HEIGHT * scale) / 2;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // Clip to game area
  ctx.beginPath();
  ctx.rect(-2, -2, GAME_WIDTH + 4, GAME_HEIGHT + 4);
  ctx.clip();

  // Screen shake
  const shake = getShakeOffset(game.screenShake);
  ctx.translate(shake.x, shake.y);

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  bgGrad.addColorStop(0, COLORS.bgGradientTop);
  bgGrad.addColorStop(0.6, '#12082e');
  bgGrad.addColorStop(1, COLORS.bgGradientBottom);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(-20, -20, GAME_WIDTH + 40, GAME_HEIGHT + 40);

  // Pulsing bg overlay
  if (game.state === 'playing') {
    ctx.fillStyle = `rgba(0, 255, 170, ${0.015 * game.bgPulse})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  // Stars
  for (const star of game.stars) {
    const twinkle = Math.sin(star.twinklePhase) * 0.5 + 0.5;
    const alpha = star.brightness * twinkle * 0.8;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
    if (star.size > 1.5) {
      ctx.fillStyle = `rgba(150, 150, 255, ${alpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Parallax mountains
  const parallaxOffset = (game.distance * 0.05) % 1200;
  drawMountainLayer(ctx, MOUNTAINS_BACK, parallaxOffset * 0.3, 'rgba(15, 10, 40, 0.8)');
  drawMountainLayer(ctx, MOUNTAINS_FRONT, parallaxOffset * 0.6, 'rgba(20, 15, 50, 0.7)');

  // Ground
  drawGround(ctx, game);

  // Particles (behind player)
  for (const p of game.particles) {
    if (p.type === 'trail' || p.type === 'ground') {
      drawParticle(ctx, p);
    }
  }

  // Obstacles
  for (const obs of game.obstacles) {
    drawObstacle(ctx, obs, game.time);
  }

  // Orbs
  for (const orb of game.orbs) {
    if (orb.collected) continue;
    const pulse = Math.sin(orb.pulse) * 3;
    // Outer glow
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = COLORS.orb;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, 22 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Middle glow
    ctx.fillStyle = COLORS.orbGlow;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, 14 + pulse * 0.7, 0, Math.PI * 2);
    ctx.fill();
    // Core
    ctx.fillStyle = COLORS.orb;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, 8 + pulse * 0.4, 0, Math.PI * 2);
    ctx.fill();
    // Bright center
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, 3, 0, Math.PI * 2);
    ctx.fill();
    // Sparkle
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 220, 100, 0.5)';
    ctx.lineWidth = 1;
    const sparkAngle = orb.pulse * 2;
    for (let i = 0; i < 4; i++) {
      const a = sparkAngle + (i * Math.PI) / 2;
      const r1 = 10 + pulse * 0.5;
      const r2 = 16 + pulse;
      ctx.beginPath();
      ctx.moveTo(orb.x + Math.cos(a) * r1, orb.y + Math.sin(a) * r1);
      ctx.lineTo(orb.x + Math.cos(a) * r2, orb.y + Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Player
  if (!game.player.isDead) {
    drawPlayer(ctx, game);
  }

  // Particles (in front)
  for (const p of game.particles) {
    if (p.type !== 'trail' && p.type !== 'ground') {
      drawParticle(ctx, p);
    }
  }

  // Flash overlay
  if (game.flashAlpha > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${game.flashAlpha})`;
    ctx.fillRect(-20, -20, GAME_WIDTH + 40, GAME_HEIGHT + 40);
  }

  // Progress bar at top
  if (game.state === 'playing') {
    drawHUD(ctx, game);
    drawProgressBar(ctx, game);
  }

  ctx.restore();
}

function drawProgressBar(ctx: CanvasRenderingContext2D, game: GameData) {
  const barW = GAME_WIDTH - 40;
  const barH = 3;
  const barX = 20;
  const barY = 8;

  // Background
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(barX, barY, barW, barH);

  // Progress (cycles every 1000 distance)
  const progress = (game.distance % 1000) / 1000;
  const gradBar = ctx.createLinearGradient(barX, 0, barX + barW * progress, 0);
  gradBar.addColorStop(0, COLORS.player);
  gradBar.addColorStop(1, 'rgba(0, 255, 170, 0.3)');
  ctx.fillStyle = gradBar;
  ctx.fillRect(barX, barY, barW * progress, barH);

  // Glow dot at end
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(barX + barW * progress, barY + barH / 2, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawGround(ctx: CanvasRenderingContext2D, game: GameData) {
  const groundY = GAME_HEIGHT - GROUND_HEIGHT;

  // Ground fill gradient
  const gGrad = ctx.createLinearGradient(0, groundY, 0, GAME_HEIGHT);
  gGrad.addColorStop(0, '#1e1e4a');
  gGrad.addColorStop(0.3, '#161640');
  gGrad.addColorStop(1, '#0a0a20');
  ctx.fillStyle = gGrad;
  ctx.fillRect(0, groundY, GAME_WIDTH, GROUND_HEIGHT);

  // Grid lines with perspective feel
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = COLORS.groundGrid;
  ctx.lineWidth = 1;
  const gridSize = 40;

  for (let x = -game.groundOffset; x < GAME_WIDTH; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x, GAME_HEIGHT);
    ctx.stroke();
  }

  for (let y = groundY; y < GAME_HEIGHT; y += gridSize / 2) {
    const alpha = 1 - (y - groundY) / GROUND_HEIGHT;
    ctx.globalAlpha = alpha * 0.3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(GAME_WIDTH, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Top line glow
  ctx.save();
  ctx.shadowColor = '#4444ff';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = COLORS.groundLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(GAME_WIDTH, groundY);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, game: GameData) {
  const p = game.player;
  const cx = p.x + PLAYER_SIZE / 2;
  const cy = p.y + PLAYER_SIZE / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.scale(p.squash, p.stretch);

  const half = PLAYER_SIZE / 2;

  // Outer glow
  ctx.save();
  ctx.shadowColor = COLORS.playerGlow;
  ctx.shadowBlur = 25;
  ctx.fillStyle = 'rgba(0,255,170,0.15)';
  ctx.fillRect(-half - 4, -half - 4, PLAYER_SIZE + 8, PLAYER_SIZE + 8);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Body
  ctx.fillStyle = COLORS.player;
  ctx.fillRect(-half, -half, PLAYER_SIZE, PLAYER_SIZE);

  // Inner dark
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  const inner = PLAYER_SIZE * 0.65;
  ctx.fillRect(-inner / 2, -inner / 2, inner, inner);

  // Inner glow
  ctx.fillStyle = 'rgba(0, 255, 170, 0.45)';
  const innerG = PLAYER_SIZE * 0.38;
  ctx.fillRect(-innerG / 2, -innerG / 2, innerG, innerG);

  // Center accent
  ctx.fillStyle = 'rgba(0, 255, 170, 0.8)';
  const center = PLAYER_SIZE * 0.15;
  ctx.fillRect(-center / 2, -center / 2, center, center);

  // Eye
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(3, -3, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(4, -3, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Eye shine
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(5, -4, 1, 0, Math.PI * 2);
  ctx.fill();

  // Outline with glow
  ctx.save();
  ctx.shadowColor = COLORS.playerGlow;
  ctx.shadowBlur = 8;
  ctx.strokeStyle = COLORS.playerOutline;
  ctx.lineWidth = 2;
  ctx.strokeRect(-half, -half, PLAYER_SIZE, PLAYER_SIZE);
  ctx.shadowBlur = 0;
  ctx.restore();

  ctx.restore();
}

function drawObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  ctx.save();

  // Pulsing glow effect
  const pulse = Math.sin(time * 0.005 + obs.x * 0.01) * 0.3 + 0.7;

  if (obs.type === 'spike') {
    drawSpike(ctx, obs.x, obs.y, obs.width, obs.height, pulse);
  } else if (obs.type === 'double_spike') {
    drawSpike(ctx, obs.x, obs.y, obs.width * 0.5, obs.height, pulse);
    drawSpike(ctx, obs.x + obs.width * 0.5, obs.y, obs.width * 0.5, obs.height, pulse);
  } else if (obs.type === 'block') {
    // Glow
    ctx.save();
    ctx.shadowColor = COLORS.obstacleGlow;
    ctx.shadowBlur = 15 * pulse;

    ctx.fillStyle = COLORS.obstacle;
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

    ctx.shadowBlur = 0;
    ctx.restore();

    // Inner pattern
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(obs.x + 4, obs.y + 4, obs.width - 8, obs.height - 8);

    // X pattern inside
    ctx.strokeStyle = 'rgba(255, 51, 102, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(obs.x + 6, obs.y + 6);
    ctx.lineTo(obs.x + obs.width - 6, obs.y + obs.height - 6);
    ctx.moveTo(obs.x + obs.width - 6, obs.y + 6);
    ctx.lineTo(obs.x + 6, obs.y + obs.height - 6);
    ctx.stroke();

    // Center diamond
    ctx.fillStyle = `rgba(255, 51, 102, ${0.4 * pulse})`;
    const cd = obs.width * 0.25;
    ctx.save();
    ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-cd / 2, -cd / 2, cd, cd);
    ctx.restore();

    ctx.strokeStyle = '#ff6699';
    ctx.lineWidth = 2;
    ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
  } else if (obs.type === 'tall') {
    ctx.save();
    ctx.shadowColor = COLORS.obstacleGlow;
    ctx.shadowBlur = 12 * pulse;

    ctx.fillStyle = COLORS.obstacle;
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(obs.x + 3, obs.y + 3, obs.width - 6, obs.height - 6);

    // Stripe detail with glow
    for (let sy = obs.y + 6; sy < obs.y + obs.height - 6; sy += 10) {
      const stripeAlpha = 0.3 + Math.sin(sy * 0.1 + time * 0.003) * 0.1;
      ctx.fillStyle = `rgba(255, 51, 102, ${stripeAlpha})`;
      ctx.fillRect(obs.x + 5, sy, obs.width - 10, 3);
    }

    ctx.strokeStyle = '#ff6699';
    ctx.lineWidth = 2;
    ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
  }

  ctx.restore();
}

function drawSpike(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pulse: number) {
  ctx.save();
  ctx.shadowColor = COLORS.spikeGlow;
  ctx.shadowBlur = 12 * pulse;

  // Main triangle
  ctx.fillStyle = COLORS.spike;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Inner detail
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + h * 0.3);
  ctx.lineTo(x + w * 0.75, y + h);
  ctx.lineTo(x + w * 0.25, y + h);
  ctx.closePath();
  ctx.fill();

  // Inner bright core
  ctx.fillStyle = `rgba(255, 100, 150, ${0.3 * pulse})`;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + h * 0.5);
  ctx.lineTo(x + w * 0.6, y + h);
  ctx.lineTo(x + w * 0.4, y + h);
  ctx.closePath();
  ctx.fill();

  // Outline
  ctx.strokeStyle = '#ff6699';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.stroke();
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  const alpha = Math.max(0, p.life);
  ctx.save();
  ctx.globalAlpha = alpha;

  if (p.type === 'trail') {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha * 0.35;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.type === 'ground') {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha * 0.5;
    const s = p.size * alpha;
    ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  } else {
    // Outer glow
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha * 0.15;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
    ctx.fill();
    // Core
    ctx.globalAlpha = alpha * 0.9;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    // Bright center
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = alpha * 0.6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawHUD(ctx: CanvasRenderingContext2D, game: GameData) {
  ctx.save();

  // Score - right side
  ctx.shadowColor = COLORS.textGlow;
  ctx.shadowBlur = 10;
  ctx.fillStyle = COLORS.scoreText;
  ctx.font = 'bold 30px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.floor(game.score)}`, GAME_WIDTH - 20, 45);
  ctx.shadowBlur = 0;
  ctx.font = '12px "Courier New", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText('SCORE', GAME_WIDTH - 20, 60);

  // Speed indicator
  const speedPct = Math.min(1, (game.gameSpeed - 5.5) / 6);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = '11px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SPEED: ${game.gameSpeed.toFixed(1)}`, 15, GAME_HEIGHT - GROUND_HEIGHT - 10);
  // Speed bar
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(100, GAME_HEIGHT - GROUND_HEIGHT - 18, 60, 6);
  const speedGrad = ctx.createLinearGradient(100, 0, 160, 0);
  speedGrad.addColorStop(0, '#00ffaa');
  speedGrad.addColorStop(1, '#ff3366');
  ctx.fillStyle = speedGrad;
  ctx.fillRect(100, GAME_HEIGHT - GROUND_HEIGHT - 18, 60 * speedPct, 6);

  // Combo
  if (game.combo > 2) {
    const comboScale = 1 + Math.sin(game.time * 0.01) * 0.05;
    ctx.save();
    ctx.translate(GAME_WIDTH / 2, 38);
    ctx.scale(comboScale, comboScale);
    ctx.shadowColor = COLORS.orbGlow;
    ctx.shadowBlur = 12;
    ctx.fillStyle = COLORS.orb;
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`×${game.combo} COMBO`, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Attempt counter
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '11px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`ATT #${game.attemptCount}`, 15, 45);

  ctx.restore();
}

export function drawMenu(ctx: CanvasRenderingContext2D, game: GameData, canvasWidth: number, canvasHeight: number) {
  render(ctx, game, canvasWidth, canvasHeight);

  const scale = Math.min(canvasWidth / GAME_WIDTH, canvasHeight / GAME_HEIGHT);
  const offsetX = (canvasWidth - GAME_WIDTH * scale) / 2;
  const offsetY = (canvasHeight - GAME_HEIGHT * scale) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // Dark overlay
  ctx.fillStyle = 'rgba(5, 5, 20, 0.75)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Animated line accents
  const lineY1 = GAME_HEIGHT * 0.15;
  const lineY2 = GAME_HEIGHT * 0.85;
  ctx.strokeStyle = `rgba(0, 255, 170, ${0.2 + Math.sin(game.time * 0.003) * 0.1})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(GAME_WIDTH * 0.1, lineY1);
  ctx.lineTo(GAME_WIDTH * 0.9, lineY1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(GAME_WIDTH * 0.1, lineY2);
  ctx.lineTo(GAME_WIDTH * 0.9, lineY2);
  ctx.stroke();

  // Title with animation
  const titleY = GAME_HEIGHT * 0.28;
  const titleBounce = Math.sin(game.time * 0.003) * 3;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 255, 170, 0.8)';
  ctx.shadowBlur = 40;
  ctx.fillStyle = COLORS.player;
  ctx.font = 'bold 58px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('NEON DASH', GAME_WIDTH / 2, titleY + titleBounce);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Subtitle
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = '15px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('— a geometric adventure —', GAME_WIDTH / 2, titleY + 28 + titleBounce);

  // Decorative player icon
  const iconY = titleY + 55;
  ctx.save();
  ctx.translate(GAME_WIDTH / 2, iconY);
  ctx.rotate(game.time * 0.002);
  ctx.fillStyle = COLORS.player;
  ctx.fillRect(-12, -12, 24, 24);
  ctx.strokeStyle = COLORS.playerOutline;
  ctx.lineWidth = 2;
  ctx.strokeRect(-12, -12, 24, 24);
  ctx.restore();

  // Play button
  const pulse = Math.sin(game.time * 0.005) * 0.2 + 0.8;
  const btnW = 240;
  const btnH = 55;
  const btnX = GAME_WIDTH / 2 - btnW / 2;
  const btnY = GAME_HEIGHT * 0.52;

  ctx.save();
  ctx.shadowColor = COLORS.playerGlow;
  ctx.shadowBlur = 25 * pulse;
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 2;
  roundRect(ctx, btnX, btnY, btnW, btnH, 4);
  ctx.stroke();
  ctx.fillStyle = `rgba(0, 255, 170, ${0.08 * pulse})`;
  roundRect(ctx, btnX, btnY, btnW, btnH, 4);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  ctx.fillStyle = COLORS.player;
  ctx.font = 'bold 22px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('▶  PLAY', GAME_WIDTH / 2, btnY + 36);

  // Instructions
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = '13px "Courier New", monospace';
  const instrY = btnY + btnH + 30;
  ctx.fillText('SPACE / ↑ / TAP to jump', GAME_WIDTH / 2, instrY);
  ctx.fillText('ESC / P to pause', GAME_WIDTH / 2, instrY + 20);

  // High scores
  if (game.highScores.length > 0) {
    const hsY = instrY + 50;
    ctx.fillStyle = COLORS.orb;
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.fillText('— HIGH SCORES —', GAME_WIDTH / 2, hsY);

    ctx.font = '13px "Courier New", monospace';
    const toShow = Math.min(5, game.highScores.length);
    for (let i = 0; i < toShow; i++) {
      ctx.fillStyle = i === 0 ? COLORS.player : 'rgba(255, 255, 255, 0.5)';
      ctx.fillText(`${i + 1}. ${game.highScores[i]}`, GAME_WIDTH / 2, hsY + 20 + i * 18);
    }
  }

  ctx.restore();
}

export function drawPause(ctx: CanvasRenderingContext2D, game: GameData, canvasWidth: number, canvasHeight: number) {
  render(ctx, game, canvasWidth, canvasHeight);

  const scale = Math.min(canvasWidth / GAME_WIDTH, canvasHeight / GAME_HEIGHT);
  const offsetX = (canvasWidth - GAME_WIDTH * scale) / 2;
  const offsetY = (canvasHeight - GAME_HEIGHT * scale) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  ctx.fillStyle = 'rgba(5, 5, 20, 0.65)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Pause icon
  const iconX = GAME_WIDTH / 2;
  const iconY = GAME_HEIGHT / 2 - 50;
  ctx.fillStyle = COLORS.player;
  ctx.fillRect(iconX - 18, iconY - 15, 10, 30);
  ctx.fillRect(iconX + 8, iconY - 15, 10, 30);

  ctx.save();
  ctx.shadowColor = COLORS.playerGlow;
  ctx.shadowBlur = 25;
  ctx.fillStyle = COLORS.player;
  ctx.font = 'bold 44px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Score
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '18px "Courier New", monospace';
  ctx.fillText(`Score: ${Math.floor(game.score)}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '14px "Courier New", monospace';
  ctx.fillText('TAP or SPACE to resume', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
  ctx.fillText('R to restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);

  ctx.restore();
}

export function drawGameOver(ctx: CanvasRenderingContext2D, game: GameData, canvasWidth: number, canvasHeight: number) {
  render(ctx, game, canvasWidth, canvasHeight);

  const scale = Math.min(canvasWidth / GAME_WIDTH, canvasHeight / GAME_HEIGHT);
  const offsetX = (canvasWidth - GAME_WIDTH * scale) / 2;
  const offsetY = (canvasHeight - GAME_HEIGHT * scale) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  ctx.fillStyle = 'rgba(10, 0, 10, 0.75)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  const centerY = GAME_HEIGHT * 0.22;

  // Red accent lines
  ctx.strokeStyle = 'rgba(255, 51, 102, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(GAME_WIDTH * 0.2, centerY - 30);
  ctx.lineTo(GAME_WIDTH * 0.8, centerY - 30);
  ctx.stroke();

  // Game Over title
  ctx.save();
  ctx.shadowColor = 'rgba(255, 51, 102, 0.8)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = COLORS.obstacle;
  ctx.font = 'bold 50px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', GAME_WIDTH / 2, centerY);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Score display
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px "Courier New", monospace';
  ctx.fillText(`${Math.floor(game.score)}`, GAME_WIDTH / 2, centerY + 50);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '12px "Courier New", monospace';
  ctx.fillText('FINAL SCORE', GAME_WIDTH / 2, centerY + 68);

  // Best score
  if (game.highScores.length > 0) {
    ctx.fillStyle = COLORS.orb;
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillText(`BEST: ${game.highScores[0]}`, GAME_WIDTH / 2, centerY + 95);
    // New best indicator
    if (game.highScores[0] === Math.floor(game.score)) {
      ctx.fillStyle = COLORS.player;
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillText('★ NEW BEST! ★', GAME_WIDTH / 2, centerY + 115);
    }
  }

  // Max combo
  if (game.maxCombo > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText(`Max Combo: ×${game.maxCombo}`, GAME_WIDTH / 2, centerY + 135);
  }

  // Restart button
  const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.8;
  const btnW = 220;
  const btnH = 50;
  const btnX = GAME_WIDTH / 2 - btnW / 2;
  const btnY = centerY + 155;

  ctx.save();
  ctx.shadowColor = COLORS.playerGlow;
  ctx.shadowBlur = 20 * pulse;
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 2;
  roundRect(ctx, btnX, btnY, btnW, btnH, 4);
  ctx.stroke();
  ctx.fillStyle = `rgba(0, 255, 170, ${0.1 * pulse})`;
  roundRect(ctx, btnX, btnY, btnW, btnH, 4);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  ctx.fillStyle = COLORS.player;
  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.fillText('↺  RETRY', GAME_WIDTH / 2, btnY + 33);

  // Menu button
  const menuBtnY = btnY + btnH + 12;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  roundRect(ctx, btnX, menuBtnY, btnW, 38, 4);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '15px "Courier New", monospace';
  ctx.fillText('MENU', GAME_WIDTH / 2, menuBtnY + 25);

  // High scores table
  if (game.highScores.length > 1) {
    const hsY = menuBtnY + 55;
    ctx.fillStyle = COLORS.orb;
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillText('— LEADERBOARD —', GAME_WIDTH / 2, hsY);

    ctx.font = '12px "Courier New", monospace';
    const toShow = Math.min(5, game.highScores.length);
    for (let i = 0; i < toShow; i++) {
      const isCurrentScore = game.highScores[i] === Math.floor(game.score);
      ctx.fillStyle = isCurrentScore ? COLORS.player : 'rgba(255, 255, 255, 0.45)';
      const prefix = i === 0 ? '👑' : `${i + 1}.`;
      ctx.fillText(
        `${prefix} ${game.highScores[i]}`,
        GAME_WIDTH / 2,
        hsY + 18 + i * 17
      );
    }
  }

  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
