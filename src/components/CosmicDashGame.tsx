"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, Play, RotateCcw, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- CONFIGURATION ---
const GAME_CFG = {
  GRAVITY: 0.5,
  JUMP_STRENGTH: -8,
  SPEED_INITIAL: 4,
  SPEED_MAX: 10,
  SPAWN_RATE: 120, // Frames between obstacles
  PLAYER_SIZE: 24,
  PARTICLE_COUNT: 20,
};

// --- TYPES ---
interface Entity {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

interface Obstacle extends Entity {
  passed: boolean;
  type: 'WALL' | 'FLOOR_SPIKE';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

// --- ENGINE STATE (Mutable Ref) ---
// We use a Ref for game state to avoid React re-renders slowing down the 60FPS loop
type GameStateRef = {
  player: { x: number; y: number; vy: number; rotation: number };
  obstacles: Obstacle[];
  particles: Particle[];
  stars: { x: number; y: number; size: number; speed: number }[];
  score: number;
  gameSpeed: number;
  frameCount: number;
  isRunning: boolean;
  isGameOver: boolean;
  // Canvas Dimensions
  width: number;
  height: number;
};

const CosmicDashGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  
  // React State for UI Overlays only (Score, Menus)
  const [uiState, setUiState] = useState<'MENU' | 'PLAYING' | 'GAME_OVER'>('MENU');
  const [displayScore, setDisplayScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // The Physics Engine State
  const engine = useRef<GameStateRef>({
    player: { x: 50, y: 200, vy: 0, rotation: 0 },
    obstacles: [],
    particles: [],
    stars: [],
    score: 0,
    gameSpeed: GAME_CFG.SPEED_INITIAL,
    frameCount: 0,
    isRunning: false,
    isGameOver: false,
    width: 0,
    height: 0,
  });

  // --- 1. INITIALIZATION & RESIZE HANDLING ---
  useEffect(() => {
    // Load High Score
    const savedScore = localStorage.getItem('cosmic_dash_hs');
    if (savedScore) setHighScore(parseInt(savedScore));

    const initCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      // 1. Get container dimensions
      const { clientWidth: w, clientHeight: h } = container;
      const dpr = window.devicePixelRatio || 1;

      // 2. Set Canvas Size (Physical Pixels for sharpness)
      canvas.width = w * dpr;
      canvas.height = h * dpr;

      // 3. Set CSS Size (Logical Pixels for layout)
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      // 4. Scale Context to match
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);

      // 5. Update Engine Boundaries
      engine.current.width = w;
      engine.current.height = h;

      // 6. Init Stars (Background)
      if (engine.current.stars.length === 0) {
        for (let i = 0; i < 50; i++) {
          engine.current.stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            size: Math.random() * 2,
            speed: Math.random() * 0.5 + 0.1
          });
        }
      }
    };

    initCanvas();
    window.addEventListener('resize', initCanvas);
    return () => window.removeEventListener('resize', initCanvas);
  }, []);

  // --- 2. CORE GAME FUNCTIONS ---

  const resetGame = () => {
    const { height } = engine.current;
    engine.current = {
      ...engine.current,
      player: { x: 50, y: height / 2, vy: 0, rotation: 0 },
      obstacles: [],
      particles: [],
      score: 0,
      gameSpeed: GAME_CFG.SPEED_INITIAL,
      frameCount: 0,
      isRunning: true,
      isGameOver: false,
    };
    setDisplayScore(0);
    setUiState('PLAYING');
  };

  const spawnParticles = (x: number, y: number, color: string, count: number = 10) => {
    for (let i = 0; i < count; i++) {
      engine.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color
      });
    }
  };

  const handleInput = () => {
    const st = engine.current;
    if (uiState === 'MENU' || uiState === 'GAME_OVER') {
        resetGame();
    } else if (st.isRunning) {
        st.player.vy = GAME_CFG.JUMP_STRENGTH;
        // Spawn small jet trail
        spawnParticles(st.player.x, st.player.y + 10, '#00f3ff', 3);
    }
  };

  // --- 3. THE GAME LOOP ---
  const animate = (time: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const st = engine.current;

    if (!canvas || !ctx || st.width === 0) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    // A. CLEAR SCREEN
    ctx.clearRect(0, 0, st.width, st.height);

    // B. BACKGROUND (Stars)
    // Draw Space Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, st.height);
    gradient.addColorStop(0, '#0f172a'); // Deep Space Blue
    gradient.addColorStop(1, '#1e1b4b'); // Deep Indigo
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, st.width, st.height);

    // Update & Draw Stars
    ctx.fillStyle = '#ffffff';
    st.stars.forEach(star => {
      star.x -= star.speed * (st.isRunning ? st.gameSpeed * 0.5 : 0.5);
      if (star.x < 0) star.x = st.width;
      ctx.globalAlpha = Math.random() * 0.5 + 0.3;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // --- GAME LOGIC ---
    if (st.isRunning && !st.isGameOver) {
      st.frameCount++;

      // 1. Player Physics
      st.player.vy += GAME_CFG.GRAVITY;
      st.player.y += st.player.vy;
      st.player.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (st.player.vy * 0.1)));

      // 2. Floor/Ceiling Collision
      if (st.player.y + GAME_CFG.PLAYER_SIZE > st.height || st.player.y < 0) {
        triggerGameOver();
      }

      // 3. Spawning Obstacles
      if (st.frameCount % GAME_CFG.SPAWN_RATE === 0) {
        const gapSize = 180;
        const minHeight = 50;
        const maxObsHeight = st.height - gapSize - minHeight;
        const topHeight = Math.random() * (maxObsHeight - minHeight) + minHeight;

        // Top Obstacle
        st.obstacles.push({
          x: st.width,
          y: 0,
          w: 60,
          h: topHeight,
          color: '#ef4444',
          passed: false,
          type: 'WALL'
        });

        // Bottom Obstacle
        st.obstacles.push({
          x: st.width,
          y: topHeight + gapSize,
          w: 60,
          h: st.height - (topHeight + gapSize),
          color: '#ef4444',
          passed: false,
          type: 'WALL'
        });
      }

      // 4. Update Obstacles
      for (let i = st.obstacles.length - 1; i >= 0; i--) {
        const obs = st.obstacles[i];
        obs.x -= st.gameSpeed;

        // Draw Obstacle (Neon Style)
        ctx.shadowBlur = 15;
        ctx.shadowColor = obs.color;
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.shadowBlur = 0;

        // Collision Check (AABB)
        const pPadding = 4; // Hitbox forgiveness
        if (
          st.player.x + pPadding < obs.x + obs.w &&
          st.player.x + GAME_CFG.PLAYER_SIZE - pPadding > obs.x &&
          st.player.y + pPadding < obs.y + obs.h &&
          st.player.y + GAME_CFG.PLAYER_SIZE - pPadding > obs.y
        ) {
          triggerGameOver();
        }

        // Scoring
        if (!obs.passed && obs.x + obs.w < st.player.x) {
          obs.passed = true;
          // Only score for the top pipe to avoid double counting
          if (obs.y === 0) {
            st.score++;
            setDisplayScore(st.score);
            // Ramp up speed slightly
            st.gameSpeed = Math.min(st.gameSpeed + 0.1, GAME_CFG.SPEED_MAX);
          }
        }

        // Cleanup
        if (obs.x + obs.w < 0) {
          st.obstacles.splice(i, 1);
        }
      }
    }

    // C. DRAW PLAYER
    ctx.save();
    ctx.translate(st.player.x + GAME_CFG.PLAYER_SIZE / 2, st.player.y + GAME_CFG.PLAYER_SIZE / 2);
    ctx.rotate(st.player.rotation);
    
    // Neon Glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00f3ff';
    ctx.fillStyle = '#ffffff';
    
    // Player Shape
    ctx.beginPath();
    ctx.roundRect(-GAME_CFG.PLAYER_SIZE / 2, -GAME_CFG.PLAYER_SIZE / 2, GAME_CFG.PLAYER_SIZE, GAME_CFG.PLAYER_SIZE, 6);
    ctx.fill();
    ctx.restore();

    // D. DRAW PARTICLES
    for (let i = st.particles.length - 1; i >= 0; i--) {
      const p = st.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
      ctx.fill();

      if (p.life <= 0) st.particles.splice(i, 1);
    }
    ctx.globalAlpha = 1.0;

    // Loop
    requestRef.current = requestAnimationFrame(animate);
  };

  const triggerGameOver = () => {
    const st = engine.current;
    st.isGameOver = true;
    st.isRunning = false;
    spawnParticles(st.player.x, st.player.y, '#ffffff', 30); // Explosion
    setUiState('GAME_OVER');
    
    if (st.score > highScore) {
      setHighScore(st.score);
      localStorage.setItem('cosmic_dash_hs', st.score.toString());
    }
  };

  // Start Loop
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  // --- 4. INPUT LISTENERS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleInput();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uiState]); // Re-bind when UI state changes

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 select-none touch-none"
      onMouseDown={(e) => { e.preventDefault(); handleInput(); }}
      onTouchStart={(e) => { e.preventDefault(); handleInput(); }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* --- HUD --- */}
      <div className="absolute top-6 left-6 right-6 flex justify-between pointer-events-none z-10">
         <div className="flex items-center gap-2 text-cyan-400 font-black tracking-widest text-sm bg-cyan-950/30 px-4 py-2 rounded-full border border-cyan-500/30 backdrop-blur-sm animate-pulse">
            <Zap className="w-4 h-4 fill-cyan-400" /> ENERGY ACTIVE
         </div>
         <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-yellow-500/80 font-mono text-xs font-bold mb-1">
                <Trophy className="w-3 h-3" /> HI: {highScore}
            </div>
            <div className="text-6xl font-black italic text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] tabular-nums leading-none">
                {displayScore}
            </div>
         </div>
      </div>

      {/* --- MENU OVERLAY --- */}
      {uiState === 'MENU' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20">
           <div className="text-center animate-in zoom-in-95 duration-300 space-y-6">
              <div>
                <h1 className="text-6xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-white to-purple-500 drop-shadow-2xl mb-2">
                    COSMIC
                </h1>
                <h2 className="text-2xl md:text-4xl font-light text-white tracking-[0.5em] opacity-90">DASH</h2>
              </div>
              
              <Button 
                onClick={(e) => { e.stopPropagation(); resetGame(); }}
                className="group relative px-10 py-8 bg-white text-black hover:bg-cyan-50 rounded-full font-black text-xl tracking-widest shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all hover:scale-105 active:scale-95"
              >
                 <Play className="w-6 h-6 mr-2 fill-black" /> LAUNCH
                 <div className="absolute inset-0 rounded-full ring-2 ring-white animate-ping opacity-50" />
              </Button>

              <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">
                 Tap Screen or Press Space to Fly
              </p>
           </div>
        </div>
      )}

      {/* --- GAME OVER OVERLAY --- */}
      {uiState === 'GAME_OVER' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/20 backdrop-blur-md z-30 animate-in fade-in duration-300">
           <div className="bg-slate-900/90 p-8 rounded-3xl border border-white/10 shadow-2xl text-center w-[90%] max-w-sm">
              <h3 className="text-4xl font-black text-red-500 tracking-tighter mb-1 animate-pulse">CRITICAL FAILURE</h3>
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-8">System Offline</p>
              
              <div className="flex justify-center items-end gap-2 mb-8">
                 <span className="text-8xl font-black text-white leading-none">{displayScore}</span>
                 <span className="text-sm font-bold text-slate-500 mb-2">PTS</span>
              </div>

              <Button 
                onClick={(e) => { e.stopPropagation(); resetGame(); }}
                className="w-full py-7 bg-white text-black hover:bg-slate-200 font-bold text-lg rounded-xl shadow-xl transition-transform active:scale-95"
              >
                 <RotateCcw className="w-5 h-5 mr-2" /> REBOOT SYSTEM
              </Button>
           </div>
        </div>
      )}
    </div>
  );
};

export default CosmicDashGame;