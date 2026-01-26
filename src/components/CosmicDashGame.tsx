"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, Play, RotateCcw, Zap, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- CONFIGURATION ---
const PHYSICS = {
  PLAYER_SIZE: 30, // Slightly larger for better visibility
  GRAVITY_FLY: 0.25,
  GRAVITY_RUN: 0.7,
  JUMP_FLY: -6,
  JUMP_RUN: -12, // Stronger jump
  SPEED_BASE: 5,
  SPEED_MAX: 10,
  PHASE_SCORE: 10, 
};

interface GameEntity {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'PIPE' | 'BLOCK' | 'FLYER';
  passed: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const CosmicDashGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // UI State
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAME_OVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [activeMode, setActiveMode] = useState<'FLY' | 'RUN'>('FLY');

  // Mutable Game Engine State
  const engine = useRef({
    playerY: 0,
    velocity: 0,
    floorY: 0,
    targetFloorY: 0,
    speed: PHYSICS.SPEED_BASE,
    obstacles: [] as GameEntity[],
    particles: [] as Particle[],
    bgOffset: 0,
    lastTime: 0,
    frameId: 0,
    scoreRef: 0,
    // Store logical dimensions to sync render & logic
    logicalWidth: 0,
    logicalHeight: 0
  });

  // --- 1. SETUP & RESIZE ---
  useEffect(() => {
    const saved = localStorage.getItem('cosmic_dash_hs');
    if (saved) setHighScore(parseInt(saved));

    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        const canvas = canvasRef.current;
        const parent = containerRef.current;
        const dpr = window.devicePixelRatio || 1;
        
        // 1. Set Physical Size (for sharpness)
        canvas.width = parent.clientWidth * dpr;
        canvas.height = parent.clientHeight * dpr;
        
        // 2. Set CSS Size (for layout)
        canvas.style.width = `${parent.clientWidth}px`;
        canvas.style.height = `${parent.clientHeight}px`;
        
        // 3. Scale Context (so 1 unit = 1 CSS pixel)
        const ctx = canvas.getContext('2d');
        if(ctx) {
            ctx.scale(dpr, dpr);
            // Optimization: Disable text rendering during resizing
            ctx.imageSmoothingEnabled = false; 
        }

        // 4. Update Engine Logical Dimensions
        engine.current.logicalWidth = parent.clientWidth;
        engine.current.logicalHeight = parent.clientHeight;

        // Reset positions if IDLE to prevent getting stuck
        if (gameState === 'IDLE') {
            engine.current.playerY = parent.clientHeight / 2;
            engine.current.floorY = parent.clientHeight + 200;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Init immediately

    return () => window.removeEventListener('resize', handleResize);
  }, [gameState]);

  // --- 2. GAME ENGINE ---
  const spawnObstacle = (width: number, height: number, mode: 'FLY' | 'RUN') => {
    const minGap = 200; // Wider gap for better playability
    
    if (mode === 'FLY') {
      const pipeHeight = Math.random() * (height * 0.3) + 50;
      const gap = Math.random() * 100 + minGap;
      const safeGap = Math.min(gap, height - pipeHeight - 50); // Ensure bottom pipe fits

      // Top Pipe
      engine.current.obstacles.push({
        x: width, y: 0, w: 60, h: pipeHeight, 
        type: 'PIPE', passed: false 
      });
      // Bottom Pipe
      engine.current.obstacles.push({
        x: width, y: pipeHeight + safeGap, w: 60, h: height - (pipeHeight + safeGap), 
        type: 'PIPE', passed: false 
      });
    } else {
      // Runner Mode
      const isFlyingEnemy = Math.random() > 0.6;
      const floorLevel = height - 50; // Floor is 50px from bottom

      if (isFlyingEnemy) {
        engine.current.obstacles.push({
          x: width, y: floorLevel - 100, w: 40, h: 40, 
          type: 'FLYER', passed: false 
        });
      } else {
        const h = Math.random() * 50 + 40;
        engine.current.obstacles.push({
          x: width, y: floorLevel - h, w: 40, h: h, 
          type: 'BLOCK', passed: false 
        });
      }
    }
  };

  const createParticles = (x: number, y: number, color: string, burst: boolean) => {
    const count = burst ? 20 : 5;
    for (let i = 0; i < count; i++) {
      engine.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * (burst ? 15 : 6),
        vy: (Math.random() - 0.5) * (burst ? 15 : 6),
        life: 1.0,
        color
      });
    }
  };

  const updatePhysics = (deltaTime: number) => {
    const st = engine.current;
    const width = st.logicalWidth;
    const height = st.logicalHeight;
    
    // --- MODE SWITCH ---
    const targetMode = st.scoreRef >= PHYSICS.PHASE_SCORE ? 'RUN' : 'FLY';
    if (targetMode !== activeMode) {
      setActiveMode(targetMode);
      if (targetMode === 'RUN') {
        createParticles(width/2, height/2, '#00f3ff', true);
      }
    }

    // Floor Animation
    st.targetFloorY = targetMode === 'RUN' ? height - 50 : height + 300;
    st.floorY += (st.targetFloorY - st.floorY) * 0.08;

    // Gravity
    const gravity = targetMode === 'FLY' ? PHYSICS.GRAVITY_FLY : PHYSICS.GRAVITY_RUN;
    st.velocity += gravity * deltaTime;
    st.playerY += st.velocity * deltaTime;

    // Floor Collision
    if (st.playerY + PHYSICS.PLAYER_SIZE > st.floorY) {
      if (targetMode === 'RUN') {
        st.playerY = st.floorY - PHYSICS.PLAYER_SIZE;
        st.velocity = 0;
      } else {
        return 'CRASH'; // Fly mode floor death
      }
    }

    // Ceiling Collision
    if (st.playerY < 0) {
      st.playerY = 0;
      st.velocity = 0;
    }

    // --- OBSTACLES ---
    const lastObs = st.obstacles[st.obstacles.length - 1];
    const spawnBuffer = targetMode === 'RUN' ? 450 : 300;
    
    // Safe Zone during transition (Score 8-12) to prevent cheap deaths
    const transitionZone = st.scoreRef >= 8 && st.scoreRef < 11;
    
    if (!transitionZone && (!lastObs || (width - lastObs.x > spawnBuffer))) {
      spawnObstacle(width, height, targetMode);
    }

    // Update Obstacles
    for (let i = st.obstacles.length - 1; i >= 0; i--) {
      let o = st.obstacles[i];
      o.x -= st.speed * deltaTime;

      // Scoring
      if (!o.passed && o.x + o.w < width * 0.15) {
        o.passed = true;
        if(o.type !== 'PIPE' || o.y === 0) {
           st.scoreRef += 1;
           setScore(st.scoreRef);
           st.speed = Math.min(st.speed + 0.05, PHYSICS.SPEED_MAX);
        }
      }

      // Cleanup
      if (o.x + o.w < -100) st.obstacles.splice(i, 1);

      // Collision (Smaller Hitbox for fairness)
      const pX = width * 0.15;
      const hitboxBuffer = 8; 
      if (
        pX + hitboxBuffer < o.x + o.w &&
        pX + PHYSICS.PLAYER_SIZE - hitboxBuffer > o.x &&
        st.playerY + hitboxBuffer < o.y + o.h &&
        st.playerY + PHYSICS.PLAYER_SIZE - hitboxBuffer > o.y
      ) {
        return 'CRASH';
      }
    }

    // --- PARTICLES ---
    for (let i = st.particles.length - 1; i >= 0; i--) {
      let p = st.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
      if (p.life <= 0) st.particles.splice(i, 1);
    }

    return 'OK';
  };

  const drawGame = (ctx: CanvasRenderingContext2D) => {
    const st = engine.current;
    const width = st.logicalWidth;
    const height = st.logicalHeight;
    
    ctx.clearRect(0, 0, width, height);

    // 1. Background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (activeMode === 'FLY') {
        gradient.addColorStop(0, '#0f172a'); 
        gradient.addColorStop(1, '#1e293b'); 
    } else {
        gradient.addColorStop(0, '#2e1065'); 
        gradient.addColorStop(1, '#4c1d95'); 
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Floor
    if (st.floorY < height + 50) {
        ctx.fillStyle = activeMode === 'RUN' ? '#a855f7' : '#38bdf8';
        ctx.shadowBlur = 15;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fillRect(0, st.floorY, width, 6);
        ctx.shadowBlur = 0;
        
        // Dark fill below
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, st.floorY + 6, width, height - st.floorY);
    }

    // 3. Player
    const pX = width * 0.15;
    ctx.save();
    ctx.translate(pX + PHYSICS.PLAYER_SIZE/2, st.playerY + PHYSICS.PLAYER_SIZE/2);
    
    if (activeMode === 'FLY') {
        const rot = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (st.velocity * 0.1)));
        ctx.rotate(rot);
    } else {
        if (st.playerY >= st.floorY - PHYSICS.PLAYER_SIZE - 2) {
            // Running Bob
            ctx.scale(1, 1 - Math.sin(Date.now()/60)*0.15); 
        } else {
            // Spin Jump
            ctx.rotate(st.velocity * 0.1); 
        }
    }

    ctx.shadowBlur = 20;
    ctx.shadowColor = activeMode === 'FLY' ? '#38bdf8' : '#e879f9';
    ctx.fillStyle = '#ffffff';
    
    // Player Body
    const s = PHYSICS.PLAYER_SIZE;
    ctx.beginPath();
    ctx.roundRect(-s/2, -s/2, s, s, 8);
    ctx.fill();
    ctx.restore();

    // 4. Obstacles
    st.obstacles.forEach(o => {
        ctx.shadowBlur = 15;
        if (o.type === 'PIPE') {
            ctx.fillStyle = '#38bdf8'; 
            ctx.shadowColor = '#0ea5e9';
        } else if (o.type === 'FLYER') {
            ctx.fillStyle = '#f43f5e'; 
            ctx.shadowColor = '#e11d48';
        } else {
            ctx.fillStyle = '#c084fc'; 
            ctx.shadowColor = '#a855f7';
        }
        ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    ctx.shadowBlur = 0;

    // 5. Particles
    st.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  };

  // --- 3. LOOP ---
  const loop = (time: number) => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;

    // Time Delta Cap
    const rawDelta = (time - engine.current.lastTime) / 16;
    const dt = Math.min(rawDelta, 2.0); 
    engine.current.lastTime = time;

    const result = updatePhysics(dt);
    
    if (result === 'CRASH') {
        gameOver();
    } else {
        drawGame(ctx);
        engine.current.frameId = requestAnimationFrame(loop);
    }
  };

  const jump = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    const st = engine.current;

    if (activeMode === 'FLY') {
        st.velocity = PHYSICS.JUMP_FLY;
        createParticles(st.logicalWidth * 0.15, st.playerY + PHYSICS.PLAYER_SIZE, '#fff', false);
    } else {
        if (st.playerY >= st.floorY - PHYSICS.PLAYER_SIZE - 5) {
            st.velocity = PHYSICS.JUMP_RUN;
            createParticles(st.logicalWidth * 0.15 + 10, st.floorY, '#a855f7', true);
        }
    }
  }, [gameState, activeMode]);

  const startGame = () => {
    if (containerRef.current) {
        const h = containerRef.current.clientHeight;
        const w = containerRef.current.clientWidth;
        engine.current = {
            ...engine.current,
            playerY: h / 2,
            velocity: 0,
            floorY: h + 200,
            targetFloorY: h + 200,
            obstacles: [],
            particles: [],
            scoreRef: 0,
            speed: PHYSICS.SPEED_BASE,
            logicalHeight: h,
            logicalWidth: w,
            lastTime: performance.now()
        };
    }
    setScore(0);
    setGameState('PLAYING');
    setActiveMode('FLY');
    engine.current.frameId = requestAnimationFrame(loop);
  };

  const gameOver = () => {
    setGameState('GAME_OVER');
    cancelAnimationFrame(engine.current.frameId);
    if (engine.current.scoreRef > highScore) {
        setHighScore(engine.current.scoreRef);
        localStorage.setItem('cosmic_dash_hs', engine.current.scoreRef.toString());
    }
  };

  // --- EVENTS ---
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            if (gameState === 'IDLE' || gameState === 'GAME_OVER') startGame();
            else jump();
        }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, activeMode]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 select-none touch-none"
      onMouseDown={(e) => { e.preventDefault(); if (gameState === 'IDLE' || gameState === 'GAME_OVER') startGame(); else jump(); }}
      onTouchStart={(e) => { e.preventDefault(); if (gameState === 'IDLE' || gameState === 'GAME_OVER') startGame(); else jump(); }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* HUD */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between pointer-events-none z-10">
         <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-4">
            <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border shadow-lg transition-colors duration-500",
                activeMode === 'FLY' 
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" 
                    : "bg-purple-500/10 border-purple-500/30 text-purple-400"
            )}>
                <Activity className="w-4 h-4 animate-pulse" />
                <span className="text-xs font-black tracking-widest">{activeMode} MODE</span>
            </div>
         </div>

         <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-yellow-500/80 font-mono text-xs font-bold mb-1">
                <Trophy className="w-3 h-3" /> HI: {highScore}
            </div>
            <div className="text-5xl font-black italic text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] tabular-nums">
                {score}
            </div>
         </div>
      </div>

      {/* MENU SCREENS */}
      {gameState === 'IDLE' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-20">
           <div className="text-center animate-in zoom-in-95 duration-300">
              <h1 className="text-6xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-white to-purple-500 drop-shadow-2xl mb-2">
                 COSMIC
              </h1>
              <h2 className="text-2xl md:text-4xl font-light text-white tracking-[0.5em] mb-8 opacity-90">SHIFT</h2>
              <Button 
                className="group relative px-10 py-8 bg-white text-black hover:bg-cyan-50 rounded-full font-black text-xl tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                 <Play className="w-6 h-6 mr-2 fill-black" /> START
              </Button>
              <div className="mt-8 flex gap-4 text-xs font-mono text-slate-400 bg-black/50 px-6 py-3 rounded-xl border border-white/10">
                 <div className="flex items-center gap-1"><span className="text-cyan-400">●</span> Tap to Fly</div>
                 <div className="w-[1px] h-4 bg-slate-600" />
                 <div className="flex items-center gap-1"><span className="text-purple-400">■</span> Tap to Jump</div>
              </div>
           </div>
        </div>
      )}

      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md z-30">
           <div className="bg-slate-900/90 p-8 rounded-3xl border border-white/10 shadow-2xl text-center w-[90%] max-w-sm animate-in fade-in slide-in-from-bottom-8">
              <h3 className="text-3xl font-black text-red-500 tracking-widest mb-1">CRASHED</h3>
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-6">Synchronization Lost</p>
              <div className="flex justify-center items-end gap-1 mb-8">
                 <span className="text-7xl font-black text-white leading-none">{score}</span>
                 <span className="text-sm font-bold text-slate-500 mb-1">PTS</span>
              </div>
              <Button className="w-full py-7 bg-white text-black hover:bg-slate-200 font-bold text-lg rounded-xl shadow-xl transition-transform active:scale-95">
                 <RotateCcw className="w-5 h-5 mr-2" /> RESTART
              </Button>
           </div>
        </div>
      )}
    </div>
  );
};

export default CosmicDashGame;