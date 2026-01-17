"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, Play, RotateCcw, WifiOff, Zap, ChevronsUp } from 'lucide-react';

// --- CONFIGURATION ---
const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;
const PLAYER_SIZE = 30;

// Phase Thresholds
const PHASE_RUNNER_SCORE = 10; // Switch to Dino Run at 10
const PHASE_HYPER_SCORE = 25;  // Switch to Hard Mode at 25

interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'PIPE' | 'BLOCK' | 'DRONE'; // Different obstacle types
  passed: boolean;
}

const CosmicDashGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // React State for UI
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAME_OVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameMode, setGameMode] = useState<'FLY' | 'RUN'>('FLY'); // Tracks logic mode
  const [showTutorial, setShowTutorial] = useState(true);

  // Mutable Game State (Refs for performance)
  const physics = useRef({
    playerY: CANVAS_HEIGHT / 2,
    velocity: 0,
    obstacles: [] as Entity[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    stars: [] as { x: number; y: number; size: number; speed: number }[],
    
    // Dynamic Physics
    speed: 4,
    gravity: 0.4,
    jumpStrength: -7,
    floorY: CANVAS_HEIGHT + 100, // Starts below screen
    
    frameId: 0,
    lastTime: 0,
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    // Load High Score
    const saved = localStorage.getItem('cosmic_high_score');
    if (saved) setHighScore(parseInt(saved));

    // Init Background Stars
    physics.current.stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.2
    }));

    // Handle Resize
    const handleResize = () => {
        if(canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- GAME LOGIC ---

  const spawnObstacle = () => {
    const { width, height } = canvasRef.current || { width: window.innerWidth, height: window.innerHeight };
    const p = physics.current;
    const mode = score >= PHASE_RUNNER_SCORE ? 'RUN' : 'FLY';

    if (mode === 'FLY') {
        // Flappy Style Pipes
        const gap = 200; // Easy gap
        const minHeight = 100;
        const topHeight = Math.random() * (height - gap - minHeight * 2) + minHeight;
        
        p.obstacles.push({ x: width, y: 0, width: 60, height: topHeight, type: 'PIPE', passed: false });
        p.obstacles.push({ x: width, y: topHeight + gap, width: 60, height: height - (topHeight + gap), type: 'PIPE', passed: false });
    } else {
        // Dino Run Style Blocks
        const isDrone = Math.random() > 0.7 && score > PHASE_HYPER_SCORE; // Flying enemies in hard mode
        
        if (isDrone) {
            // Mid-air obstacle
            p.obstacles.push({ x: width, y: height - 150, width: 40, height: 40, type: 'DRONE', passed: false });
        } else {
            // Ground obstacle
            const h = Math.random() * 40 + 40;
            p.obstacles.push({ x: width, y: height - 100 - h, width: 40, height: h, type: 'BLOCK', passed: false });
        }
    }
  };

  const spawnParticles = (x: number, y: number, color: string, count: number = 10) => {
    for (let i = 0; i < count; i++) {
      physics.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color
      });
    }
  };

  const resetGame = () => {
    const { height, width } = canvasRef.current || { width: window.innerWidth, height: window.innerHeight };
    physics.current = {
      ...physics.current,
      playerY: height / 2,
      velocity: 0,
      obstacles: [],
      particles: [],
      speed: 5, // Start easy
      gravity: 0.4, // Floaty gravity start
      floorY: height + 100, // Reset floor
      lastTime: performance.now(),
    };
    setScore(0);
    setGameMode('FLY');
    setGameState('PLAYING');
    setShowTutorial(false);
    spawnObstacle();
  };

  const jump = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    const p = physics.current;
    
    // Logic varies by mode
    if (gameMode === 'FLY') {
        p.velocity = -7; // Flap
        spawnParticles(window.innerWidth * 0.2, p.playerY + PLAYER_SIZE, '#00f3ff', 3);
    } else {
        // Only jump if on floor (Dino mode)
        const { height } = canvasRef.current || { height: window.innerHeight };
        const floorLevel = height - 100;
        
        // Allow jump if basically on the ground
        if (p.playerY >= floorLevel - PLAYER_SIZE - 5) {
            p.velocity = -12; // High jump
            spawnParticles(window.innerWidth * 0.2 + PLAYER_SIZE/2, p.playerY + PLAYER_SIZE, '#ff00ff', 5);
        }
    }
  }, [gameState, gameMode]);

  // --- RENDER LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const loop = (time: number) => {
      // Delta Time (cap at 60fps equivalent to prevent huge jumps)
      const rawDelta = (time - physics.current.lastTime) / 16;
      const deltaTime = Math.min(rawDelta, 2); 
      physics.current.lastTime = time;

      const { width, height } = canvas;
      const p = physics.current;

      // 1. CLEAR & BACKGROUND
      // Gradient background based on mode
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      if (gameMode === 'FLY') {
          gradient.addColorStop(0, '#050510');
          gradient.addColorStop(1, '#1a0b2e');
      } else {
          // Redder/More intense background for Runner mode
          gradient.addColorStop(0, '#1a0510');
          gradient.addColorStop(1, '#2e0b1a');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Stars
      ctx.fillStyle = '#ffffff';
      p.stars.forEach(star => {
        if (gameState === 'PLAYING') star.x -= star.speed * (p.speed * 0.5) * deltaTime;
        if (star.x < 0) star.x = width;
        ctx.globalAlpha = Math.random() * 0.5 + 0.3;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });
      ctx.globalAlpha = 1.0;

      if (gameState === 'PLAYING') {
        // --- PHASE SHIFT LOGIC ---
        const targetMode = score >= PHASE_RUNNER_SCORE ? 'RUN' : 'FLY';
        
        // Transition to RUNNER
        if (targetMode === 'RUN') {
            // Animate floor up
            const targetFloor = height - 100;
            if (p.floorY > targetFloor) p.floorY -= 2 * deltaTime;
            else p.floorY = targetFloor;

            // Adjust physics for Runner
            p.gravity = 0.8; // Heavier
            if (gameMode === 'FLY') {
                setGameMode('RUN'); // Trigger React State once
                spawnParticles(width/2, height/2, '#ffffff', 50); // Flash effect
            }
        } 
        
        // Speed scaling
        const speedCap = score > PHASE_HYPER_SCORE ? 12 : 8;
        if (p.speed < speedCap) p.speed += 0.005 * deltaTime;


        // --- PHYSICS ---
        p.velocity += p.gravity * deltaTime;
        p.playerY += p.velocity * deltaTime;

        // Floor Collision
        const floorLevel = p.floorY;
        if (p.playerY + PLAYER_SIZE > floorLevel) {
            if (gameMode === 'FLY') {
                // In Fly mode, touching bottom is death (unless floor is rising)
                if (score < PHASE_RUNNER_SCORE) {
                    endGame();
                    return;
                }
            } 
            // In Run mode, touching floor is walking
            p.playerY = floorLevel - PLAYER_SIZE;
            p.velocity = 0;
        }

        // Ceiling Collision
        if (p.playerY < 0) {
            p.playerY = 0;
            p.velocity = 0;
        }

        // --- OBSTACLES ---
        // Spawn
        const lastObs = p.obstacles[p.obstacles.length - 1];
        if (!lastObs || (width - lastObs.x > (gameMode === 'RUN' ? 400 : 300))) {
            spawnObstacle();
        }

        for (let i = p.obstacles.length - 1; i >= 0; i--) {
            const obs = p.obstacles[i];
            obs.x -= p.speed * deltaTime;

            // Score
            if (!obs.passed && obs.x + obs.width < width * 0.2) {
                obs.passed = true;
                // Only count score once per vertical set (pipe pair)
                if (obs.type !== 'PIPE' || obs.y === 0) {
                    setScore(s => s + 1);
                }
            }

            // Draw Obstacles
            ctx.fillStyle = obs.type === 'PIPE' ? '#00f3ff' : (obs.type === 'DRONE' ? '#ff0055' : '#ff00ff');
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.fillStyle;
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            ctx.shadowBlur = 0;

            // Collision
            const pX = width * 0.2;
            const buffer = 4; // Hitbox forgiveness
            if (
                pX + buffer < obs.x + obs.width &&
                pX + PLAYER_SIZE - buffer > obs.x &&
                p.playerY + buffer < obs.y + obs.height &&
                p.playerY + PLAYER_SIZE - buffer > obs.y
            ) {
                spawnParticles(pX, p.playerY, '#ff0000');
                endGame();
                return;
            }

            if (obs.x + obs.width < -50) p.obstacles.splice(i, 1);
        }

        // Draw Floor (if visible)
        if (p.floorY < height) {
            ctx.fillStyle = '#ff00ff';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff00ff';
            ctx.fillRect(0, p.floorY, width, 2); // Neon Line
            ctx.fillStyle = '#1a0510'; // Fill below
            ctx.fillRect(0, p.floorY + 2, width, height - p.floorY);
            ctx.shadowBlur = 0;
        }
      }

      // --- RENDER PLAYER ---
      const pX = width * 0.2;
      ctx.save();
      ctx.translate(pX + PLAYER_SIZE/2, p.playerY + PLAYER_SIZE/2);
      
      // Rotate based on mode
      if (gameMode === 'FLY') {
          ctx.rotate(Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (p.velocity * 0.1))));
      } else {
          // Running wobble
          if (p.playerY > p.floorY - PLAYER_SIZE - 5) {
             // On ground
             ctx.rotate(Math.sin(Date.now() / 100) * 0.1); 
          } else {
             // Jumping spin
             ctx.rotate(Date.now() / 100);
          }
      }

      // Player Shape
      ctx.shadowBlur = 15;
      ctx.shadowColor = gameMode === 'FLY' ? '#00f3ff' : '#ffe600';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
      ctx.restore();

      // --- PARTICLES ---
      for (let i = p.particles.length - 1; i >= 0; i--) {
        const part = p.particles[i];
        part.x += part.vx;
        part.y += part.vy;
        part.life -= 0.02;
        ctx.globalAlpha = part.life;
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
        if (part.life <= 0) p.particles.splice(i, 1);
      }
      ctx.globalAlpha = 1.0;

      p.frameId = requestAnimationFrame(loop);
    };

    const endGame = () => {
        setGameState('GAME_OVER');
        setScore(prev => {
            if (prev > highScore) {
                setHighScore(prev);
                localStorage.setItem('cosmic_high_score', prev.toString());
            }
            return prev;
        });
    };

    physics.current.lastTime = performance.now();
    physics.current.frameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(physics.current.frameId);
  }, [gameState, gameMode, highScore, score]);

  // Input Handling
  const handleInput = (e: any) => {
      e.preventDefault(); 
      e.stopPropagation();
      if (gameState === 'IDLE' || gameState === 'GAME_OVER') resetGame();
      else jump();
  };

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => { if (e.code === 'Space' || e.code === 'ArrowUp') handleInput(e); };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, [gameState, jump]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-[#050510] touch-none select-none overflow-hidden" onMouseDown={handleInput} onTouchStart={handleInput}>
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {/* UI OVERLAY */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between pointer-events-none">
         <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 px-3 py-1.5 rounded-full backdrop-blur-md">
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-xs text-red-100 font-bold tracking-wider">OFFLINE MODE</span>
            </div>
            {gameMode === 'RUN' && (
                <div className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/50 px-3 py-1.5 rounded-full animate-in slide-in-from-left">
                    <Zap className="w-4 h-4 text-purple-300" />
                    <span className="text-xs text-purple-100 font-bold">GRAVITY: HIGH</span>
                </div>
            )}
         </div>
         <div className="text-right">
            <div className="flex items-center justify-end gap-2 text-yellow-400 font-mono text-sm font-bold opacity-80 mb-1">
                <Trophy className="w-4 h-4" /> HI: {highScore}
            </div>
            <div className="text-6xl font-black italic text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                {score}
            </div>
         </div>
      </div>

      {/* START SCREEN */}
      {gameState === 'IDLE' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none text-center p-4">
          <h1 className="text-5xl md:text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-purple-500 mb-6 drop-shadow-2xl">
            NEON SHIFT
          </h1>
          <div className="animate-pulse flex items-center gap-3 text-white font-mono bg-white/10 px-8 py-4 rounded-full border border-white/20 mb-4">
            <Play className="w-6 h-6 fill-white" /> TAP TO START
          </div>
          <div className="space-y-1 text-slate-400 text-sm font-mono">
             <p>Score 0-10: <span className="text-cyan-400">Fly (Tap to Float)</span></p>
             <p>Score 10+: <span className="text-purple-400">Run (Tap to Jump)</span></p>
          </div>
        </div>
      )}

      {/* GAME OVER */}
      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-20 pointer-events-none">
          <h2 className="text-4xl font-black text-red-500 tracking-widest mb-6 drop-shadow-[0_0_25px_rgba(255,0,0,0.6)]">SYNC FAILED</h2>
          <div className="bg-slate-900/90 p-8 rounded-3xl border border-slate-700 shadow-2xl flex flex-col items-center mb-8 w-72">
             <span className="text-slate-400 text-xs uppercase tracking-widest mb-2">Distance</span>
             <span className="text-6xl font-mono font-bold text-white mb-2">{score}</span>
             {score >= highScore && score > 0 && <div className="text-yellow-400 text-sm font-bold flex gap-1 animate-pulse"><Trophy className="w-4 h-4"/> NEW BEST</div>}
          </div>
          <Button variant="default" size="lg" className="pointer-events-auto bg-white text-black hover:bg-slate-200 font-bold text-xl px-10 py-8 rounded-full shadow-2xl transition-transform active:scale-95">
            <RotateCcw className="w-6 h-6 mr-2" /> RECONNECT
          </Button>
        </div>
      )}
    </div>
  );
};

export default CosmicDashGame;