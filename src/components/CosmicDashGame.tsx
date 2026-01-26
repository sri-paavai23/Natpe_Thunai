"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, Play, RotateCcw, Zap, Activity, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- CONFIGURATION ---
const PHYSICS = {
  PLAYER_SIZE: 24,
  GRAVITY_FLY: 0.25,
  GRAVITY_RUN: 0.6,
  JUMP_FLY: -6,
  JUMP_RUN: -11,
  SPEED_BASE: 4,
  SPEED_MAX: 9,
  PHASE_SCORE: 10, // Score to switch modes
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
    // Physics
    playerY: 0,
    velocity: 0,
    floorY: 0, // Dynamic floor position
    targetFloorY: 0,
    speed: PHYSICS.SPEED_BASE,
    
    // Entities
    obstacles: [] as GameEntity[],
    particles: [] as Particle[],
    bgOffset: 0,
    
    // Loop
    lastTime: 0,
    frameId: 0,
    scoreRef: 0,
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
        
        // Match CSS size
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.width = parent.clientWidth * dpr;
        canvas.height = parent.clientHeight * dpr;
        
        const ctx = canvas.getContext('2d');
        if(ctx) ctx.scale(dpr, dpr);

        // Reset Player Position on Resize
        engine.current.playerY = parent.clientHeight / 2;
        engine.current.floorY = parent.clientHeight + 200; // Start floor off-screen
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Init

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- 2. GAME ENGINE ---
  const spawnObstacle = (width: number, height: number, mode: 'FLY' | 'RUN') => {
    const minGap = 180;
    
    if (mode === 'FLY') {
      const pipeHeight = Math.random() * (height * 0.4) + 50;
      const gap = Math.random() * 100 + minGap;
      
      // Top Pipe
      engine.current.obstacles.push({
        x: width, y: 0, w: 50, h: pipeHeight, 
        type: 'PIPE', passed: false 
      });
      // Bottom Pipe
      engine.current.obstacles.push({
        x: width, y: pipeHeight + gap, w: 50, h: height - (pipeHeight + gap), 
        type: 'PIPE', passed: false 
      });
    } else {
      // Runner Mode Obstacles
      const isFlyingEnemy = Math.random() > 0.7;
      const floorLevel = height - 50;

      if (isFlyingEnemy) {
        engine.current.obstacles.push({
          x: width, y: floorLevel - 90, w: 40, h: 40, 
          type: 'FLYER', passed: false 
        });
      } else {
        const h = Math.random() * 40 + 30;
        engine.current.obstacles.push({
          x: width, y: floorLevel - h, w: 30, h: h, 
          type: 'BLOCK', passed: false 
        });
      }
    }
  };

  const createParticles = (x: number, y: number, color: string, burst: boolean) => {
    const count = burst ? 15 : 3;
    for (let i = 0; i < count; i++) {
      engine.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * (burst ? 12 : 5),
        vy: (Math.random() - 0.5) * (burst ? 12 : 5),
        life: 1.0,
        color
      });
    }
  };

  const updatePhysics = (deltaTime: number, width: number, height: number) => {
    const st = engine.current;
    
    // --- MODE SWITCH LOGIC ---
    const targetMode = st.scoreRef >= PHYSICS.PHASE_SCORE ? 'RUN' : 'FLY';
    
    if (targetMode !== activeMode) {
      setActiveMode(targetMode); // React State Sync
      if (targetMode === 'RUN') {
        createParticles(width/2, height/2, '#00f3ff', true); // Visual Boom
      }
    }

    // Floor Animation
    st.targetFloorY = targetMode === 'RUN' ? height - 50 : height + 200;
    st.floorY += (st.targetFloorY - st.floorY) * 0.05; // Smooth Lerp

    // Gravity & Velocity
    const gravity = targetMode === 'FLY' ? PHYSICS.GRAVITY_FLY : PHYSICS.GRAVITY_RUN;
    st.velocity += gravity * deltaTime;
    st.playerY += st.velocity * deltaTime;

    // Floor Collision
    if (st.playerY + PHYSICS.PLAYER_SIZE > st.floorY) {
      if (targetMode === 'RUN') {
        st.playerY = st.floorY - PHYSICS.PLAYER_SIZE;
        st.velocity = 0;
      } else {
        return 'CRASH'; // Die if hitting bottom in Fly mode
      }
    }

    // Ceiling Collision
    if (st.playerY < 0) {
      st.playerY = 0;
      st.velocity = 0;
    }

    // --- OBSTACLES ---
    // Spawn Logic
    const lastObs = st.obstacles[st.obstacles.length - 1];
    const spawnBuffer = targetMode === 'RUN' ? 400 : 250;
    
    // Don't spawn pipes if we are about to switch to run mode (Score 8-10)
    const transitionZone = st.scoreRef >= 8 && st.scoreRef < 10;
    
    if (!transitionZone && (!lastObs || (width - lastObs.x > spawnBuffer))) {
      spawnObstacle(width, height, targetMode);
    }

    // Update Obstacles
    for (let i = st.obstacles.length - 1; i >= 0; i--) {
      let o = st.obstacles[i];
      o.x -= st.speed * deltaTime;

      // Score Counting
      if (!o.passed && o.x + o.w < width * 0.15) {
        o.passed = true;
        // Only add score once per column
        if(o.type !== 'PIPE' || o.y === 0) {
           st.scoreRef += 1;
           setScore(st.scoreRef);
           // Increase speed slightly
           st.speed = Math.min(st.speed + 0.05, PHYSICS.SPEED_MAX);
        }
      }

      // Cleanup
      if (o.x + o.w < -100) st.obstacles.splice(i, 1);

      // COLLISION DETECTION (AABB with buffer)
      const pX = width * 0.15; // Player X position fixed at 15% screen width
      const buffer = 6; 
      if (
        pX + buffer < o.x + o.w &&
        pX + PHYSICS.PLAYER_SIZE - buffer > o.x &&
        st.playerY + buffer < o.y + o.h &&
        st.playerY + PHYSICS.PLAYER_SIZE - buffer > o.y
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

  const drawGame = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const st = engine.current;
    
    // Clear
    ctx.clearRect(0, 0, width, height);

    // 1. Dynamic Background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (activeMode === 'FLY') {
        gradient.addColorStop(0, '#0f172a'); // Slate 900
        gradient.addColorStop(1, '#1e293b'); // Slate 800
    } else {
        gradient.addColorStop(0, '#2e1065'); // Violet 950
        gradient.addColorStop(1, '#4c1d95'); // Violet 900
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Grid Effect (Runner Mode)
    if (activeMode === 'RUN' || st.floorY < height) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        const gridSize = 50;
        st.bgOffset = (st.bgOffset - st.speed) % gridSize;
        
        ctx.beginPath();
        // Vertical moving lines
        for (let x = st.bgOffset; x < width; x += gridSize) {
            ctx.moveTo(x, st.floorY);
            ctx.lineTo(x - (height - st.floorY) * 2, height); // Perspective slant
        }
        // Horizontal lines below floor
        for (let y = st.floorY; y < height; y += 20) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();
    }

    // 2. Draw Floor
    ctx.fillStyle = activeMode === 'RUN' ? '#a855f7' : '#38bdf8'; // Purple or Blue
    ctx.shadowBlur = 20;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillRect(0, st.floorY, width, 4);
    ctx.shadowBlur = 0;
    
    // Fill below floor
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, st.floorY + 4, width, height - st.floorY);

    // 3. Draw Player
    const pX = width * 0.15;
    ctx.save();
    ctx.translate(pX + PHYSICS.PLAYER_SIZE/2, st.playerY + PHYSICS.PLAYER_SIZE/2);
    
    // Visual Rotation
    if (activeMode === 'FLY') {
        const rot = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (st.velocity * 0.1)));
        ctx.rotate(rot);
    } else {
        // Bobbing while running
        if (st.playerY >= st.floorY - PHYSICS.PLAYER_SIZE - 1) {
            ctx.scale(1, 1 - Math.sin(Date.now()/50)*0.1); 
        } else {
            ctx.rotate(st.velocity * 0.05); // Spin jump
        }
    }

    // Neon Glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = activeMode === 'FLY' ? '#38bdf8' : '#e879f9';
    ctx.fillStyle = '#ffffff';
    
    // Player Shape (Rounded Box)
    const s = PHYSICS.PLAYER_SIZE;
    ctx.beginPath();
    ctx.roundRect(-s/2, -s/2, s, s, 6);
    ctx.fill();
    ctx.restore();

    // 4. Draw Obstacles
    st.obstacles.forEach(o => {
        ctx.shadowBlur = 10;
        if (o.type === 'PIPE') {
            ctx.fillStyle = '#38bdf8'; // Blue
            ctx.shadowColor = '#0ea5e9';
        } else if (o.type === 'FLYER') {
            ctx.fillStyle = '#f43f5e'; // Red
            ctx.shadowColor = '#e11d48';
        } else {
            ctx.fillStyle = '#c084fc'; // Purple
            ctx.shadowColor = '#a855f7';
        }
        ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    ctx.shadowBlur = 0;

    // 5. Draw Particles
    st.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  };

  // --- 3. LOOP & INPUT ---
  const loop = (time: number) => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if(!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if(!ctx) return;

    // Delta Time Logic
    const rawDelta = (time - engine.current.lastTime) / 16;
    const dt = Math.min(rawDelta, 2.5); // Cap delta to prevent skipping
    engine.current.lastTime = time;

    const result = updatePhysics(dt, canvas.width, canvas.height);
    
    if (result === 'CRASH') {
        gameOver();
    } else {
        drawGame(ctx, canvas.width, canvas.height);
        engine.current.frameId = requestAnimationFrame(loop);
    }
  };

  const jump = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    const st = engine.current;

    if (activeMode === 'FLY') {
        st.velocity = PHYSICS.JUMP_FLY;
        createParticles(window.innerWidth * 0.15, st.playerY + PHYSICS.PLAYER_SIZE, '#fff', false);
    } else {
        // Can only jump if on floor in Run mode
        if (st.playerY >= st.floorY - PHYSICS.PLAYER_SIZE - 5) {
            st.velocity = PHYSICS.JUMP_RUN;
            createParticles(window.innerWidth * 0.15 + 10, st.floorY, '#a855f7', true); // Dust kick
        }
    }
  }, [gameState, activeMode]);

  const startGame = () => {
    if (containerRef.current) {
        const h = containerRef.current.clientHeight;
        engine.current = {
            ...engine.current,
            playerY: h / 2,
            velocity: 0,
            floorY: h + 200,
            obstacles: [],
            particles: [],
            scoreRef: 0,
            speed: PHYSICS.SPEED_BASE,
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

  // --- INPUT LISTENERS ---
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
  }, [gameState, activeMode]); // Dependencies matter for jump logic

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 select-none touch-none"
      onMouseDown={(e) => { e.preventDefault(); if (gameState === 'PLAYING') jump(); }}
      onTouchStart={(e) => { e.preventDefault(); if (gameState === 'PLAYING') jump(); }}
    >
      {/* CANVAS LAYER */}
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* --- HUD OVERLAY --- */}
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

      {/* --- MENUS --- */}
      {gameState === 'IDLE' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-20">
           <div className="text-center animate-in zoom-in-95 duration-300">
              <h1 className="text-6xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-white to-purple-500 drop-shadow-2xl mb-2">
                 COSMIC
              </h1>
              <h2 className="text-2xl md:text-4xl font-light text-white tracking-[0.5em] mb-8 opacity-90">SHIFT</h2>
              
              <Button 
                onClick={(e) => { e.stopPropagation(); startGame(); }}
                className="group relative px-10 py-8 bg-white text-black hover:bg-cyan-50 rounded-full font-black text-xl tracking-widest shadow-[0_0_40px_rgba(34,211,238,0.6)] transition-all hover:scale-105 active:scale-95"
              >
                 <Play className="w-6 h-6 mr-2 fill-black" /> START
                 <div className="absolute inset-0 rounded-full ring-2 ring-white animate-ping opacity-50" />
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
           <div className="bg-slate-900/80 p-8 rounded-3xl border border-white/10 shadow-2xl text-center w-[90%] max-w-sm animate-in fade-in slide-in-from-bottom-8">
              <h3 className="text-3xl font-black text-red-500 tracking-widest mb-1">CRASHED</h3>
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-6">Synchronization Lost</p>
              
              <div className="flex justify-center items-end gap-1 mb-8">
                 <span className="text-7xl font-black text-white leading-none">{score}</span>
                 <span className="text-sm font-bold text-slate-500 mb-1">PTS</span>
              </div>

              {score >= highScore && score > 0 && (
                 <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-lg animate-bounce">
                    <Trophy className="w-3 h-3 fill-black" /> NEW RECORD
                 </div>
              )}

              <Button 
                onClick={(e) => { e.stopPropagation(); startGame(); }}
                className="w-full py-7 bg-white text-black hover:bg-slate-200 font-bold text-lg rounded-xl shadow-xl transition-transform active:scale-95"
              >
                 <RotateCcw className="w-5 h-5 mr-2" /> TRY AGAIN
              </Button>
           </div>
        </div>
      )}

      {/* --- MOBILE CONTROL HINT (Bottom Fade) --- */}
      {gameState === 'PLAYING' && (
         <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none opacity-40 animate-pulse">
            <span className="text-white/50 text-xs font-black uppercase tracking-widest bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
               {activeMode === 'FLY' ? 'Tap to Float' : 'Tap to Jump'}
            </span>
         </div>
      )}
    </div>
  );
};

export default CosmicDashGame;