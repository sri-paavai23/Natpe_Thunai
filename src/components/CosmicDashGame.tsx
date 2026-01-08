"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Zap, Trophy, Play, RotateCcw, AlertTriangle, WifiOff } from 'lucide-react';

// --- CONFIGURATION ---
const CONSTANTS = {
  GRAVITY: 0.6, 
  JUMP_FORCE: -10, 
  DOUBLE_JUMP_FORCE: -8, 
  BASE_SPEED: 5,
  MAX_SPEED: 20, 
  SPEED_INCREMENT: 0.005, 
  GROUND_HEIGHT_RATIO: 0.85, // Ground is at 85% of screen height
  PLAYER_SIZE: 24, 
};

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
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'SPIKE' | 'DRONE' | 'WALL';
}

const CosmicDashGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAME_OVER'>('IDLE');
  
  // Dimensions state to handle resize
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Game State Ref
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
    distance: 0,
    lastSpawnX: 0,
    shake: 0,
    frameId: 0,
    stars: [] as { x: number; y: number; size: number; speed: number }[],
    speedLines: [] as { x: number; y: number; len: number; speed: number }[],
  });

  // --- RESIZE HANDLER ---
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setDimensions({ width: w, height: h });
      
      // Re-init background elements on resize
      game.current.stars = Array.from({ length: 40 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2,
        speed: Math.random() * 0.5 + 0.1
      }));
      game.current.speedLines = Array.from({ length: 15 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        len: Math.random() * 20 + 10,
        speed: Math.random() * 10 + 5
      }));
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Init immediately
    
    const saved = localStorage.getItem('cosmicHighScore');
    if (saved) setHighScore(parseInt(saved));

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- GAME LOGIC ---
  const spawnParticles = (x: number, y: number, count: number, color: string, speedMult = 1) => {
    for (let i = 0; i < count; i++) {
      game.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8 * speedMult,
        vy: (Math.random() - 0.5) * 8 * speedMult,
        life: 1.0,
        color,
        size: Math.random() * 4 + 1
      });
    }
  };

  const spawnObstacles = (groundY: number, width: number) => {
    const g = game.current;
    const minGap = 250 + (g.speed * 15); // Dynamic gap based on speed
    
    if (g.distance - g.lastSpawnX < minGap) return;

    const spawnX = width + 50;
    const pattern = Math.random();
    
    // Tactical Patterns adapted for responsive height
    if (pattern < 0.3) {
      // Ground Spike
      g.obstacles.push({ id: Date.now(), x: spawnX, y: groundY - 40, width: 30, height: 40, type: 'SPIKE' });
    } else if (pattern < 0.6) {
      // Low Drone (Jump)
      g.obstacles.push({ id: Date.now(), x: spawnX, y: groundY - 70, width: 30, height: 30, type: 'DRONE' });
    } else if (pattern < 0.8) {
      // High Drone (No Jump / Small Jump)
      g.obstacles.push({ id: Date.now(), x: spawnX, y: groundY - 120, width: 30, height: 30, type: 'DRONE' });
    } else {
      // The Gate (High Wall + Low Gap or High Gap)
      g.obstacles.push({ id: Date.now(), x: spawnX, y: groundY - 30, width: 20, height: 30, type: 'WALL' });
      g.obstacles.push({ id: Date.now()+1, x: spawnX + 200, y: groundY - 100, width: 30, height: 30, type: 'DRONE' });
      g.lastSpawnX = g.distance + 200; // Extra buffer
    }
    
    if(g.lastSpawnX < g.distance) g.lastSpawnX = g.distance;
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
      distance: 0,
      speed: CONSTANTS.BASE_SPEED,
      lastSpawnX: 0,
      shake: 0,
      jumpCount: 0,
    };
    setScore(0);
    setGameState('PLAYING');
  };

  const jump = () => {
    if (gameState !== 'PLAYING') return;
    const g = game.current;

    if (g.jumpCount < 2) {
      // Slightly stronger physics for mobile feel
      const force = g.jumpCount === 0 ? CONSTANTS.JUMP_FORCE : CONSTANTS.DOUBLE_JUMP_FORCE;
      g.velocity = force;
      g.jumpCount++;
      g.rotation = g.jumpCount === 1 ? -0.2 : -6.28;
      
      // Spawn particles at feet
      spawnParticles(
        dimensions.width * 0.15 + 10, 
        g.playerY + 20, 
        8, 
        g.jumpCount === 1 ? '#00f3ff' : '#ff00ff'
      );
    }
  };

  // --- RENDER LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false }); // Optimize for no transparency on base
    if (!canvas || !ctx || dimensions.width === 0) return;

    const loop = () => {
      const { width, height } = dimensions;
      const groundLevel = height * CONSTANTS.GROUND_HEIGHT_RATIO;
      const g = game.current;

      // 1. Background Fill (Cyberpunk Dark)
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, width, height);

      // Screen Shake application
      ctx.save();
      if (g.shake > 0) {
        const mx = (Math.random() - 0.5) * g.shake;
        const my = (Math.random() - 0.5) * g.shake;
        ctx.translate(mx, my);
        g.shake *= 0.9;
        if (g.shake < 0.5) g.shake = 0;
      }

      // 2. Stars & Speed Lines
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      g.stars.forEach(s => {
        if (gameState === 'PLAYING') s.x -= s.speed * (g.speed / 4);
        if (s.x < 0) s.x = width;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });

      if (g.speed > 8) {
        ctx.strokeStyle = `rgba(0, 243, 255, ${(g.speed - 8) / 30})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        g.speedLines.forEach(line => {
          line.x -= line.speed * (g.speed/5);
          if (line.x < -line.len) {
            line.x = width + Math.random() * 200;
            line.y = Math.random() * height;
          }
          ctx.moveTo(line.x, line.y);
          ctx.lineTo(line.x + line.len, line.y);
        });
        ctx.stroke();
      }

      // 3. Ground (Neon Grid Floor)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, groundLevel, width, height - groundLevel);
      
      // Top Neon Line
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f3ff';
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, groundLevel);
      ctx.lineTo(width, groundLevel);
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (gameState === 'PLAYING') {
        // --- PHYSICS UPDATE ---
        g.velocity += CONSTANTS.GRAVITY;
        g.playerY += g.velocity;
        g.distance += g.speed;

        // Ground Collision
        if (g.playerY >= groundLevel - CONSTANTS.PLAYER_SIZE) {
          g.playerY = groundLevel - CONSTANTS.PLAYER_SIZE;
          g.velocity = 0;
          g.isGrounded = true;
          g.jumpCount = 0;
          g.rotation *= 0.8; // Align to ground
        } else {
          g.isGrounded = false;
          g.rotation += g.jumpCount === 1 ? 0.05 : 0.2;
        }

        // Difficulty scaling
        if (g.speed < CONSTANTS.MAX_SPEED) g.speed += CONSTANTS.SPEED_INCREMENT;
        g.score += g.speed * 0.02;
        setScore(Math.floor(g.score));

        // Spawner
        spawnObstacles(groundLevel, width);

        // --- OBSTACLE RENDER & COLLISION ---
        const pX = width * 0.15; // Player X Position
        const hitboxPadding = 6; // Forgiving hitbox

        for (let i = g.obstacles.length - 1; i >= 0; i--) {
          const obs = g.obstacles[i];
          obs.x -= g.speed;

          // Render
          const isDrone = obs.type === 'DRONE';
          ctx.fillStyle = isDrone ? '#ff00ff' : '#ff3333';
          ctx.shadowBlur = 20;
          ctx.shadowColor = ctx.fillStyle;
          
          ctx.beginPath();
          if (isDrone) {
            ctx.arc(obs.x + obs.width/2, obs.y + obs.height/2, obs.width/2, 0, Math.PI*2);
          } else {
            // Triangle Spikes
            ctx.moveTo(obs.x, obs.y + obs.height);
            ctx.lineTo(obs.x + obs.width/2, obs.y);
            ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
          }
          ctx.fill();
          ctx.shadowBlur = 0;

          // Collision AABB
          if (
            pX + CONSTANTS.PLAYER_SIZE - hitboxPadding > obs.x + hitboxPadding &&
            pX + hitboxPadding < obs.x + obs.width - hitboxPadding &&
            g.playerY + CONSTANTS.PLAYER_SIZE - hitboxPadding > obs.y + hitboxPadding &&
            g.playerY + hitboxPadding < obs.y + obs.height - hitboxPadding
          ) {
            setGameState('GAME_OVER');
            g.shake = 25;
            spawnParticles(pX, g.playerY, 40, '#ff0000', 2);
            if (g.score > highScore) {
              setHighScore(Math.floor(g.score));
              localStorage.setItem('cosmicHighScore', Math.floor(g.score).toString());
            }
          }

          if (obs.x + obs.width < -100) g.obstacles.splice(i, 1);
        }
      }

      // 4. Player Render
      const pX = width * 0.15;
      ctx.save();
      ctx.translate(pX + CONSTANTS.PLAYER_SIZE/2, g.playerY + CONSTANTS.PLAYER_SIZE/2);
      ctx.rotate(g.rotation);

      // Dash Trail
      if (g.speed > 10 && gameState === 'PLAYING') {
        ctx.fillStyle = 'rgba(0, 243, 255, 0.2)';
        ctx.fillRect(-CONSTANTS.PLAYER_SIZE, -CONSTANTS.PLAYER_SIZE/2, CONSTANTS.PLAYER_SIZE*3, CONSTANTS.PLAYER_SIZE);
      }

      // Player Box
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f3ff';
      ctx.fillStyle = '#000';
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.rect(-CONSTANTS.PLAYER_SIZE/2, -CONSTANTS.PLAYER_SIZE/2, CONSTANTS.PLAYER_SIZE, CONSTANTS.PLAYER_SIZE);
      ctx.fill();
      ctx.stroke();

      // Core
      ctx.fillStyle = g.jumpCount === 2 ? '#ff00ff' : '#fff';
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();

      // 5. Particles Render
      g.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
        if(p.life <= 0) g.particles.splice(idx, 1);
      });
      ctx.globalAlpha = 1;

      ctx.restore(); // Restore shake
      g.frameId = requestAnimationFrame(loop);
    };

    const frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [dimensions, gameState, highScore]);

  // --- INPUT HANDLING ---
  useEffect(() => {
    const handleAction = () => {
      if (gameState === 'IDLE' || gameState === 'GAME_OVER') {
        if(gameState === 'GAME_OVER') resetGame();
        else setGameState('PLAYING');
      } else {
        jump();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleAction();
      }
    };

    const handleTouch = (e: TouchEvent) => {
      e.preventDefault(); // Stop scrolling/zooming
      handleAction();
    };

    window.addEventListener('keydown', handleKeyDown);
    // Add non-passive listener to block scroll
    window.addEventListener('touchstart', handleTouch, { passive: false }); 
    window.addEventListener('mousedown', handleAction);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('mousedown', handleAction);
    };
  }, [gameState]);

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] overflow-hidden bg-[#050510] touch-none select-none">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="block w-full h-full"
      />

      {/* UI OVERLAY */}
      <div className="absolute top-4 left-0 w-full px-6 flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
           <Trophy className="w-5 h-5 text-yellow-400" />
           <span className="text-yellow-400 font-mono font-bold text-lg">{highScore}</span>
        </div>
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-cyan-500/50 px-4 py-1 rounded-full">
           <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400 animate-pulse" />
           <span className="text-white font-mono font-bold text-xl">{score.toString().padStart(5, '0')}</span>
        </div>
      </div>

      {/* OFFLINE INDICATOR */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500/50 px-3 py-1 rounded-full flex items-center gap-2">
        <WifiOff className="w-3 h-3 text-red-400" />
        <span className="text-[10px] text-red-200 font-bold uppercase tracking-wider">OFFLINE MODE</span>
      </div>

      {/* START SCREEN */}
      {gameState === 'IDLE' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-30">
          <h1 className="text-5xl md:text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 to-blue-600 mb-4 drop-shadow-[0_0_15px_rgba(0,243,255,0.5)]">
            COSMIC DASH
          </h1>
          <div className="animate-bounce flex items-center gap-2 text-white font-mono bg-cyan-500/20 px-6 py-3 rounded-lg border border-cyan-500/50">
            <Play className="w-5 h-5 fill-white" /> TAP SCREEN TO START
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md z-30 animate-in zoom-in-95">
          <div className="text-red-500 flex flex-col items-center mb-6">
            <AlertTriangle className="w-12 h-12 mb-2" />
            <h2 className="text-4xl font-black tracking-widest">CRITICAL FAILURE</h2>
          </div>
          
          <div className="text-center mb-8">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Final Distance</p>
            <p className="text-5xl font-mono font-bold text-white">{score}</p>
          </div>

          <Button 
            onClick={resetGame}
            size="lg"
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg px-8 py-6 rounded-full shadow-[0_0_30px_rgba(0,243,255,0.4)] transition-transform hover:scale-105 active:scale-95"
          >
            <RotateCcw className="w-5 h-5 mr-2" /> REBOOT SYSTEM
          </Button>
        </div>
      )}
    </div>
  );
};

export default CosmicDashGame;