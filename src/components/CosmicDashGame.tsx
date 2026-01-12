"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, Play, RotateCcw, Zap, WifiOff } from 'lucide-react';

// --- GAME CONSTANTS & CONFIG ---
const GAME_SPEED_START = 4;
const GAME_SPEED_MAX = 12;
const GRAVITY = 0.5;
const JUMP_STRENGTH = -8;
const OBSTACLE_WIDTH = 50;
const OBSTACLE_GAP = 180; // Vertical gap for passing through
const OBSTACLE_SPACING = 300; // Horizontal distance between obstacles
const PLAYER_SIZE = 30;

interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  passed: boolean; // To track score
}

const CosmicDashGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAME_OVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Refs for mutable game data (no re-renders needed for physics)
  const physics = useRef({
    playerY: 0,
    velocity: 0,
    obstacles: [] as Entity[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    stars: [] as { x: number; y: number; size: number; speed: number }[],
    speed: GAME_SPEED_START,
    frameId: 0,
    lastTime: 0,
  });

  // --- 1. INITIALIZATION & RESIZE ---
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
      initStars(window.innerWidth, window.innerHeight);
    };

    // Load High Score
    const saved = localStorage.getItem('cosmic_high_score');
    if (saved) setHighScore(parseInt(saved));

    window.addEventListener('resize', handleResize);
    handleResize(); // Init immediately

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initStars = (w: number, h: number) => {
    physics.current.stars = Array.from({ length: 50 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.1
    }));
  };

  const resetGame = useCallback(() => {
    const { height, width } = dimensions;
    physics.current = {
      ...physics.current,
      playerY: height / 2,
      velocity: 0,
      obstacles: [],
      particles: [],
      speed: GAME_SPEED_START,
      lastTime: performance.now(),
    };
    
    // Pre-spawn first obstacle
    spawnObstacle(width + 200, height);
    
    setScore(0);
    setGameState('PLAYING');
  }, [dimensions]);

  // --- 2. GAME LOGIC HELPERS ---

  const spawnObstacle = (xOffset: number, screenHeight: number) => {
    // Generate a "Pipe" style obstacle (Top and Bottom)
    const minHeight = 50;
    const availableSpace = screenHeight - OBSTACLE_GAP - (minHeight * 2);
    const topHeight = Math.random() * availableSpace + minHeight;
    const bottomY = topHeight + OBSTACLE_GAP;

    // Top Obstacle
    physics.current.obstacles.push({
      x: xOffset,
      y: 0,
      width: OBSTACLE_WIDTH,
      height: topHeight,
      passed: false
    });

    // Bottom Obstacle
    physics.current.obstacles.push({
      x: xOffset,
      y: bottomY,
      width: OBSTACLE_WIDTH,
      height: screenHeight - bottomY,
      passed: false // We only need to track score on one of them
    });
  };

  const spawnParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 15; i++) {
      physics.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color
      });
    }
  };

  const jump = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    physics.current.velocity = JUMP_STRENGTH;
  }, [gameState]);

  // --- 3. MAIN GAME LOOP ---
  useEffect(() => {
    if (dimensions.width === 0) return; // Wait for resize

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !ctx) return;

    const loop = (time: number) => {
      // Calculate Delta Time (smooth movement regardless of frame rate)
      const deltaTime = (time - physics.current.lastTime) / 16; // Normalized to ~60fps
      physics.current.lastTime = time;

      const { width, height } = dimensions;
      const p = physics.current;

      // --- A. CLEAR & BACKGROUND ---
      ctx.fillStyle = '#050510'; // Deep Space Blue/Black
      ctx.fillRect(0, 0, width, height);

      // Stars Parallax
      ctx.fillStyle = '#ffffff';
      p.stars.forEach(star => {
        if (gameState === 'PLAYING') star.x -= star.speed * (p.speed / 4) * deltaTime;
        if (star.x < 0) star.x = width;
        ctx.globalAlpha = Math.random() * 0.5 + 0.3;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });
      ctx.globalAlpha = 1.0;

      if (gameState === 'PLAYING') {
        // --- B. PHYSICS ---
        
        // Player Gravity
        p.velocity += GRAVITY * deltaTime;
        p.playerY += p.velocity * deltaTime;

        // Speed Scaling (Gets harder over time)
        if (p.speed < GAME_SPEED_MAX) p.speed += 0.001 * deltaTime;

        // Floor/Ceiling Collision
        if (p.playerY > height - PLAYER_SIZE || p.playerY < 0) {
          endGame();
          return; // Stop frame immediately
        }

        // --- C. OBSTACLES ---
        
        // Move & Spawn
        if (p.obstacles.length === 0 || width - p.obstacles[p.obstacles.length - 1].x > OBSTACLE_SPACING) {
           spawnObstacle(width, height);
        }

        for (let i = p.obstacles.length - 1; i >= 0; i--) {
          const obs = p.obstacles[i];
          obs.x -= p.speed * deltaTime;

          // Score Logic (Check only top obstacles to avoid double counting)
          if (!obs.passed && obs.x + obs.width < (width * 0.2) && obs.y === 0) {
            obs.passed = true;
            setScore(prev => prev + 1);
          }

          // Render Obstacle (Neon Pillar)
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ff00ff';
          ctx.fillStyle = '#ff00ff';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          
          // Inner Glow
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(obs.x + 5, obs.y === 0 ? obs.height - 10 : obs.y, obs.width - 10, 10); // Cap detail

          // Collision Detection (AABB with slight forgiveness)
          const playerX = width * 0.2;
          const hitX = playerX + 5; // Left + padding
          const hitY = p.playerY + 5; // Top + padding
          const hitSize = PLAYER_SIZE - 10; // Smaller hitbox

          if (
            hitX < obs.x + obs.width &&
            hitX + hitSize > obs.x &&
            hitY < obs.y + obs.height &&
            hitY + hitSize > obs.y
          ) {
            spawnParticles(playerX + PLAYER_SIZE/2, p.playerY + PLAYER_SIZE/2, '#00f3ff');
            endGame();
            return;
          }

          // Cleanup off-screen
          if (obs.x + obs.width < -50) p.obstacles.splice(i, 1);
        }
      } 
      // --- END PLAYING STATE LOGIC ---

      // --- D. RENDER PLAYER ---
      const pX = width * 0.2;
      ctx.save();
      ctx.translate(pX + PLAYER_SIZE/2, p.playerY + PLAYER_SIZE/2);
      
      // Rotate based on velocity
      const rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (p.velocity * 0.1)));
      ctx.rotate(rotation);

      // Player Glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00f3ff';
      ctx.fillStyle = '#000000';
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 3;

      // Draw Player (Cube)
      ctx.beginPath();
      ctx.rect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
      ctx.fill();
      ctx.stroke();
      
      // Engine Trail
      if (gameState === 'PLAYING') {
         ctx.shadowBlur = 0;
         ctx.fillStyle = `rgba(0, 243, 255, ${Math.random()})`;
         ctx.fillRect(-PLAYER_SIZE, -5, 15, 10); // Tail
      }
      
      ctx.restore();

      // --- E. PARTICLES (Explosion) ---
      for (let i = p.particles.length - 1; i >= 0; i--) {
        const part = p.particles[i];
        part.x += part.vx;
        part.y += part.vy;
        part.life -= 0.05;
        
        ctx.globalAlpha = part.life;
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, Math.random() * 4 + 2, 0, Math.PI * 2);
        ctx.fill();

        if (part.life <= 0) p.particles.splice(i, 1);
      }
      ctx.globalAlpha = 1.0;

      // Loop
      p.frameId = requestAnimationFrame(loop);
    };

    const endGame = () => {
        setGameState('GAME_OVER');
        setScore(prev => {
            const finalScore = prev;
            if (finalScore > highScore) {
                setHighScore(finalScore);
                localStorage.setItem('cosmic_high_score', finalScore.toString());
            }
            return finalScore;
        });
    };

    // Start Loop
    physics.current.lastTime = performance.now();
    physics.current.frameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(physics.current.frameId);
  }, [gameState, dimensions, highScore]);

  // --- 4. INPUT HANDLERS ---
  const handleInput = (e: any) => {
    e.preventDefault(); // Prevent scroll/zoom
    e.stopPropagation();

    if (gameState === 'IDLE' || gameState === 'GAME_OVER') {
        if (gameState === 'GAME_OVER') resetGame();
        else setGameState('PLAYING');
    } else {
        jump();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') handleInput(e);
    });
    return () => window.removeEventListener('keydown', handleInput as any);
  }, [gameState, jump]);


  return (
    <div 
        className="fixed inset-0 w-screen h-[100dvh] bg-[#050510] touch-none select-none overflow-hidden"
        onMouseDown={handleInput}
        onTouchStart={handleInput}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="block w-full h-full"
      />

      {/* --- HUD --- */}
      <div className="absolute top-6 left-0 w-full px-6 flex justify-between items-center pointer-events-none">
        {/* Offline Badge */}
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/50 px-3 py-1 rounded-full">
            <WifiOff className="w-3 h-3 text-red-400" />
            <span className="text-[10px] text-red-200 font-bold tracking-wider">OFFLINE</span>
        </div>
        
        {/* Score Board */}
        <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-yellow-400 font-mono text-sm font-bold opacity-80">
                <Trophy className="w-3 h-3" /> HI: {highScore}
            </div>
            <div className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-cyan-600 drop-shadow-[0_0_10px_rgba(0,243,255,0.4)]">
                {score}
            </div>
        </div>
      </div>

      {/* --- START SCREEN --- */}
      {gameState === 'IDLE' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <h1 className="text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-cyan-400 mb-4 drop-shadow-lg">
            NEON FLIGHT
          </h1>
          <div className="animate-pulse flex items-center gap-2 text-white font-mono bg-white/10 px-6 py-3 rounded-full border border-white/20">
            <Play className="w-4 h-4 fill-white" /> TAP TO FLY
          </div>
          <p className="mt-4 text-slate-400 text-xs font-mono">Tap to Jump • Avoid Neon Walls</p>
        </div>
      )}

      {/* --- GAME OVER SCREEN --- */}
      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-20 pointer-events-none">
          <h2 className="text-3xl font-black text-red-500 tracking-widest mb-2 drop-shadow-[0_0_15px_red]">CRASHED</h2>
          
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center mb-8 w-64">
             <span className="text-slate-400 text-xs uppercase tracking-widest mb-1">Score</span>
             <span className="text-5xl font-mono font-bold text-white mb-4">{score}</span>
             
             {score >= highScore && score > 0 && (
                <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold animate-pulse">
                    <Trophy className="w-3 h-3" /> NEW HIGH SCORE!
                </div>
             )}
          </div>

          <Button 
            variant="default"
            size="lg"
            className="pointer-events-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg px-8 py-6 rounded-full shadow-[0_0_30px_rgba(0,243,255,0.4)] transition-transform active:scale-95"
          >
            <RotateCcw className="w-5 h-5 mr-2" /> TRY AGAIN
          </Button>
        </div>
      )}
    </div>
  );
};

export default CosmicDashGame;