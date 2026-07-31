import { useRef, useEffect, useCallback } from 'react';
import { GAME_WIDTH, GAME_HEIGHT } from './game/constants';
import { createGameData, resetGame, update, jump } from './game/engine';
import { render, drawMenu, drawPause, drawGameOver } from './game/renderer';
import { GameData } from './game/types';
import { initAudio, playJump, playDeath, playStart, playOrb } from './game/audio';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameData>(createGameData());
  const lastTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const prevOrbCountRef = useRef<number>(0);
  const wasAliveRef = useRef<boolean>(true);

  const startGame = useCallback(() => {
    initAudio();
    playStart();
    const game = gameRef.current;
    resetGame(game);
    game.state = 'playing';
    wasAliveRef.current = true;
    prevOrbCountRef.current = 0;
  }, []);

  const handleAction = useCallback(() => {
    const game = gameRef.current;
    switch (game.state) {
      case 'menu':
        startGame();
        break;
      case 'playing':
        initAudio();
        jump(game);
        playJump();
        break;
      case 'paused':
        game.state = 'playing';
        break;
      case 'gameover':
        startGame();
        break;
    }
  }, [startGame]);

  const handlePause = useCallback(() => {
    const game = gameRef.current;
    if (game.state === 'playing') {
      game.state = 'paused';
    } else if (game.state === 'paused') {
      game.state = 'playing';
    }
  }, []);

  const handleMenu = useCallback(() => {
    const game = gameRef.current;
    game.state = 'menu';
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleAction();
      }
      if (e.code === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handlePause();
      }
      if (e.key === 'r' || e.key === 'R') {
        const game = gameRef.current;
        if (game.state === 'paused' || game.state === 'gameover') {
          startGame();
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        const game = gameRef.current;
        if (game.state === 'gameover') {
          handleMenu();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction, handlePause, startGame, handleMenu]);

  // Handle touch/click with button detection
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getGameCoords = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const scale = Math.min(canvasWidth / GAME_WIDTH, canvasHeight / GAME_HEIGHT);
      const offsetX = (canvasWidth - GAME_WIDTH * scale) / 2;
      const offsetY = (canvasHeight - GAME_HEIGHT * scale) / 2;
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;
      return {
        gx: ((clientX - rect.left) * scaleX - offsetX) / scale,
        gy: ((clientY - rect.top) * scaleY - offsetY) / scale,
      };
    };

    const handleInteraction = (clientX: number, clientY: number) => {
      const game = gameRef.current;
      const { gx, gy } = getGameCoords(clientX, clientY);

      if (game.state === 'gameover') {
        const btnW = 220;
        const btnH = 50;
        const btnX = GAME_WIDTH / 2 - btnW / 2;
        const centerY = GAME_HEIGHT * 0.3;
        const btnY = centerY + 140;
        if (gx >= btnX && gx <= btnX + btnW && gy >= btnY && gy <= btnY + btnH) {
          startGame();
          return;
        }
        const menuBtnY = btnY + btnH + 15;
        if (gx >= btnX && gx <= btnX + btnW && gy >= menuBtnY && gy <= menuBtnY + 40) {
          handleMenu();
          return;
        }
        startGame();
        return;
      }

      handleAction();
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      handleInteraction(e.clientX, e.clientY);
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleAction, startGame, handleMenu]);

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for performance
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Game loop
  useEffect(() => {
    const game = gameRef.current;

    const gameLoop = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      let dt = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      if (dt > 50) dt = 16.667;

      // Update game time even on menu for animations
      if (game.state === 'menu' || game.state === 'gameover') {
        game.time += dt;
        for (const star of game.stars) {
          star.twinklePhase += star.twinkleSpeed;
        }
      }

      if (game.state === 'playing') {
        update(game, dt);

        // Check for death sound
        if (wasAliveRef.current && game.player.isDead) {
          playDeath();
          wasAliveRef.current = false;
        }

        // Check for orb collection sound
        if (game.orbsCollected > prevOrbCountRef.current) {
          playOrb();
          prevOrbCountRef.current = game.orbsCollected;
        }
      }

      // Render
      switch (game.state) {
        case 'menu':
          drawMenu(ctx, game, canvas.width, canvas.height);
          break;
        case 'playing':
          render(ctx, game, canvas.width, canvas.height);
          break;
        case 'paused':
          drawPause(ctx, game, canvas.width, canvas.height);
          break;
        case 'gameover':
          // Still update particles during game over
          for (let i = game.particles.length - 1; i >= 0; i--) {
            const p = game.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.type === 'death') p.vy += 0.15;
            p.life -= 1 / p.maxLife;
            if (p.life <= 0) game.particles.splice(i, 1);
          }
          if (game.flashAlpha > 0) {
            game.flashAlpha -= 0.01;
            if (game.flashAlpha < 0) game.flashAlpha = 0;
          }
          drawGameOver(ctx, game, canvas.width, canvas.height);
          break;
      }

      rafRef.current = requestAnimationFrame(gameLoop);
    };

    rafRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none"
      style={{ touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
    </div>
  );
}
