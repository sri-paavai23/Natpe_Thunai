"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Zap, Trophy, Play, RotateCcw } from 'lucide-react';

// --- CONFIGURATION ---
const CONSTANTS = {
  ASPECT_RATIO: 16 / 9,
  GRAVITY: 0.6,
  JUMP_FORCE: -10,
  DOUBLE_JUMP_FORCE: -8,
  BASE_SPEED: 4,
  MAX_SPEED: 12,
  SPEED_INCREMENT: 0.001, // Speed increase per frame
  GROUND_HEIGHT_RATIO: 0.85,
  PLAYER_SIZE: 24,
  PARTICLE_COUNT: 20,
  COLORS: {
    BG: '#050510',
    NEON_BLUE: '#00f3ff',
    NEON_PINK: '#ff00ff',
    NEON_GREEN: '#0aff0a',
    GRID: 'rgba(0, 243, 255, 0.2)',
  }
};

// --- TYPES ---
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'GROUND' | 'FLYING';
}

const CosmicDashGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAME_OVER'>('IDLE');
  const [dimensions, setDimensions] = useState({ width: 320, height: 180 });

  // Game State Ref (Mutable for performance)
  const game = useRef({
    playerY: 0,
    velocity: 0,
    isGrounded: false,
    jumpCount: 0,
    rotation: 0,
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    speed: CONSTANTS.BASE_SPEED,
    score: 0,
    lastObstacleTime: 0,
    shake: 0,
    frameId: 0,
    stars: [] as { x: number; y: number; size: number; speed: number }[],
    gridOffset: 0,
  });

  // --- INITIALIZATION & RESIZE ---
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        const h = w / CONSTANTS.ASPECT_RATIO;
        setDimensions({ width: w, height: h });
        initStars(w, h);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    
    // Load High Score
    const saved = localStorage.getItem('cosmicHighScore');
    if (saved) setHighScore(parseInt(saved));

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initStars = (w: number, h: number) => {
    game.current.stars = Array.from({ length: 40 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 2,
      speed: Math.random() * 0.5 + 0.1
    }));
  };

  // --- GAME LOGIC HELPER FUNCTIONS ---

  const spawnParticles = (x: number, y: number, count: number, color: string, speedMultiplier = 1) => {
    for (let i = 0; i < count; i++) {
      game.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4 * speedMultiplier,
        vy: (Math.random() - 0.5) * 4 * speedMultiplier,
        life: 1.0,
        color,
        size: Math.random() * 3 + 1
      });
    }
  };

  const resetGame = () => {
    const groundY = dimensions.height * CONSTANTS.GROUND_HEIGHT_RATIO;
    game.current = {
      ...game.current,
      playerY: groundY - CONSTANTS.PLAYER_SIZE,
      velocity: 0,
      obstacles: [],
      particles: [],
      score: 0,
      speed: CONSTANTS.BASE_SPEED,
      shake: 0,
      jumpCount: 0,
    };
    setScore(0);
    setGameState('PLAYING');
  };

  const jump = () => {
    if (gameState !== 'PLAYING') return;

    // Double Jump Logic
    if (game.current.jumpCount < 2) {
      const force = game.current.jumpCount === 0 ? CONSTANTS.JUMP_FORCE : CONSTANTS.DOUBLE_JUMP_FORCE;
      game.current.velocity = force;
      game.current.jumpCount++;
      
      // Spawn Jump Particles
      const pX = dimensions.width * 0.15 + CONSTANTS.PLAYER_SIZE / 2;
      const pY = game.current.playerY + CONSTANTS.PLAYER_SIZE;
      spawnParticles(pX, pY, 8, CONSTANTS.COLORS.NEON_BLUE);
    }
  };

  // --- MAIN GAME LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const loop = () => {
      const { width, height } = dimensions;
      const groundLevel = height * CONSTANTS.GROUND_HEIGHT_RATIO;
      const g = game.current;

      // 1. CLEAR & SHAKE
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      
      // Screen Shake Effect
      if (g.shake > 0) {
        const shakeX = (Math.random() - 0.5) * g.shake;
        const shakeY = (Math.random() - 0.5) * g.shake;
        ctx.translate(shakeX, shakeY);
        g.shake *= 0.9; // Damping
        if (g.shake < 0.5) g.shake = 0;
      }

      // 2. DRAW BACKGROUND (Stars & Retro Grid)
      ctx.fillStyle = CONSTANTS.COLORS.BG;
      ctx.fillRect(0, 0, width, height);
      
      // Parallax Stars
      ctx.fillStyle = '#ffffff';
      g.stars.forEach(star => {
        if (gameState === 'PLAYING') star.x -= star.speed * (g.speed / 4);
        if (star.x < 0) star.x = width;
        ctx.globalAlpha = Math.random() * 0.5 + 0.3;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Retro Grid Floor
      if (gameState === 'PLAYING') g.gridOffset = (g.gridOffset - g.speed) % 40;
      ctx.strokeStyle = CONSTANTS.COLORS.GRID;
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Horizontal lines
      for (let i = groundLevel; i < height; i += 15) {
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
      }
      // Vertical Perspective lines
      for (let i = -width; i < width * 2; i += 40) {
        const slant = (i - width/2) * 0.8; // Perspective slant
        ctx.moveTo(i + g.gridOffset, groundLevel);
        ctx.lineTo(i + slant + g.gridOffset, height);
      }
      ctx.stroke();

      // Top Horizon Line
      ctx.shadowBlur = 15;
      ctx.shadowColor = CONSTANTS.COLORS.NEON_BLUE;
      ctx.strokeStyle = CONSTANTS.COLORS.NEON_BLUE;
      ctx.beginPath();
      ctx.moveTo(0, groundLevel);
      ctx.lineTo(width, groundLevel);
      ctx.stroke();
      ctx.shadowBlur = 0;


      if (gameState === 'PLAYING') {
        // 3. PHYSICS & UPDATES
        
        // Player Physics
        g.velocity += CONSTANTS.GRAVITY;
        g.playerY += g.velocity;
        
        // Ground Collision
        if (g.playerY >= groundLevel - CONSTANTS.PLAYER_SIZE) {
          g.playerY = groundLevel - CONSTANTS.PLAYER_SIZE;
          g.velocity = 0;
          g.isGrounded = true;
          g.jumpCount = 0;
          g.rotation = 0; // Reset rotation on ground
        } else {
          g.isGrounded = false;
          g.rotation += 0.1; // Spin while jumping
        }

        // Speed Scaling
        if (g.speed < CONSTANTS.MAX_SPEED) g.speed += CONSTANTS.SPEED_INCREMENT;

        // Score
        g.score += g.speed * 0.05;
        setScore(Math.floor(g.score));

        // Obstacle Spawning
        const now = Date.now();
        if (now - g.lastObstacleTime > 2000 / (g.speed / 3)) {
          const isFlying = Math.random() > 0.7; // 30% chance of flying obstacle
          const obsHeight = isFlying ? 30 : 40 + Math.random() * 20;
          const obsWidth = 30;
          const obsY = isFlying 
            ? groundLevel - 70 - Math.random() * 30 // Air position
            : groundLevel - obsHeight; // Ground position

          g.obstacles.push({
            x: width,
            y: obsY,
            width: obsWidth,
            height: obsHeight,
            type: isFlying ? 'FLYING' : 'GROUND'
          });
          g.lastObstacleTime = now;
        }

        // Update Obstacles
        g.obstacles.forEach(obs => obs.x -= g.speed);
        g.obstacles = g.obstacles.filter(obs => obs.x + obs.width > -50);

        // Collision Detection
        const pX = width * 0.15; // Fixed player X
        const hitboxPadding = 4;
        
        for (const obs of g.obstacles) {
          if (
            pX + CONSTANTS.PLAYER_SIZE - hitboxPadding > obs.x &&
            pX + hitboxPadding < obs.x + obs.width &&
            g.playerY + CONSTANTS.PLAYER_SIZE - hitboxPadding > obs.y &&
            g.playerY + hitboxPadding < obs.y + obs.height
          ) {
            // GAME OVER
            setGameState('GAME_OVER');
            g.shake = 20; // Big impact shake
            spawnParticles(pX, g.playerY, 30, CONSTANTS.COLORS.NEON_PINK, 2);
            if (g.score > highScore) {
              setHighScore(Math.floor(g.score));
              localStorage.setItem('cosmicHighScore', Math.floor(g.score).toString());
            }
          }
        }
      }

      // 4. DRAWING ENTITIES

      // Draw Particles
      g.particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        p.size *= 0.9;
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        if (p.life <= 0) g.particles.splice(index, 1);
      });
      ctx.globalAlpha = 1.0;

      // Draw Player (Neon Capsule)
      const pX = width * 0.15;
      ctx.save();
      ctx.translate(pX + CONSTANTS.PLAYER_SIZE/2, g.playerY + CONSTANTS.PLAYER_SIZE/2);
      ctx.rotate(g.rotation);
      
      // Glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = CONSTANTS.COLORS.NEON_BLUE;
      ctx.fillStyle = '#000';
      ctx.strokeStyle = CONSTANTS.COLORS.NEON_BLUE;
      ctx.lineWidth = 2;
      
      // Shape
      ctx.beginPath();
      ctx.rect(-CONSTANTS.PLAYER_SIZE/2, -CONSTANTS.PLAYER_SIZE/2, CONSTANTS.PLAYER_SIZE, CONSTANTS.PLAYER_SIZE);
      ctx.fill();
      ctx.stroke();
      
      // Core
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();

      // Draw Obstacles (Glitch Spikes)
      g.obstacles.forEach(obs => {
        ctx.shadowBlur = 10;
        ctx.shadowColor = CONSTANTS.COLORS.NEON_PINK;
        ctx.fillStyle = CONSTANTS.COLORS.NEON_PINK;
        
        ctx.beginPath();
        if (obs.type === 'FLYING') {
            // Drone shape
            ctx.moveTo(obs.x, obs.y + obs.height/2);
            ctx.lineTo(obs.x + obs.width/2, obs.y);
            ctx.lineTo(obs.x + obs.width, obs.y + obs.height/2);
            ctx.lineTo(obs.x + obs.width/2, obs.y + obs.height);
        } else {
            // Spike shape
            ctx.moveTo(obs.x, obs.y + obs.height);
            ctx.lineTo(obs.x + obs.width/2, obs.y);
            ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        }
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Trail Effect (Spawn particles while moving)
      if (gameState === 'PLAYING' && g.frameId % 5 === 0) {
        spawnParticles(pX, g.playerY + CONSTANTS.PLAYER_SIZE/2, 1, CONSTANTS.COLORS.NEON_BLUE, 0.5);
      }

      ctx.restore();
      g.frameId = requestAnimationFrame(loop);
    };

    const frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [dimensions, gameState, highScore]);

  // --- CONTROLS ---
  useEffect(() => {
    const handleInput = (e: TouchEvent | KeyboardEvent | MouseEvent) => {
      e.preventDefault(); // Uncommented this line for better mobile interactivity
      if (gameState === 'GAME_OVER') {
        resetGame();
      } else if (gameState === 'IDLE') {
        setGameState('PLAYING');
      } else {
        jump();
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', handleInput);
      canvas.addEventListener('mousedown', handleInput);
    }
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') handleInput(e);
    });

    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', handleInput);
        canvas.removeEventListener('mousedown', handleInput);
      }
      window.removeEventListener('keydown', handleInput as any);
    };
  }, [gameState]);

  return (
    <div ref={containerRef} className="w-full max-w-md mx-auto p-4 flex flex-col items-center gap-4">
      {/* HUD */}
      <div className="flex w-full justify-between items-center text-sm font-bold font-mono tracking-wider text-cyan-400">
        <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400">HI: {highScore}</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full border border-cyan-500/30">
            <Zap className="w-4 h-4" />
            <span>{score.toString().padStart(5, '0')}</span>
        </div>
      </div>

      {/* GAME CANVAS CONTAINER */}
      <div 
        className={cn(
            "relative w-full rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,243,255,0.15)] border border-slate-800",
            "transition-all duration-300",
            gameState === 'GAME_OVER' ? "grayscale-[0.5] ring-2 ring-red-500/50" : "ring-1 ring-cyan-500/30"
        )}
        style={{ height: dimensions.height }}
      >
        <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            className="block touch-none cursor-pointer"
        />

        {/* UI OVERLAYS */}
        {gameState === 'IDLE' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px]">
                <h2 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2 drop-shadow-[0_2px_10px_rgba(0,255,255,0.5)]">
                    COSMIC DASH
                </h2>
                <div className="animate-pulse flex items-center gap-2 text-white font-mono text-sm bg-cyan-500/20 px-4 py-2 rounded">
                    <Play className="w-4 h-4" /> TAP TO START
                </div>
            </div>
        )}

        {gameState === 'GAME_OVER' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                <h2 className="text-3xl font-black text-red-500 mb-2 tracking-widest drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">
                    CRASHED
                </h2>
                <div className="flex flex-col items-center gap-1 mb-6 font-mono">
                    <span className="text-slate-400 text-xs">FINAL SCORE</span>
                    <span className="text-2xl text-white font-bold">{score}</span>
                </div>
                <Button 
                    onClick={resetGame}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold gap-2 shadow-[0_0_15px_rgba(0,243,255,0.4)]"
                >
                    <RotateCcw className="w-4 h-4" /> TRY AGAIN
                </Button>
            </div>
        )}
      </div>

      <p className="text-[10px] text-slate-500 font-mono text-center uppercase tracking-widest">
        Double Tap to Boost Jump • Avoid Glitch Spikes
      </p>
    </div>
  );
};

export default CosmicDashGame;