"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, WifiOff } from "lucide-react";

const OfflinePage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Game configuration
  const GRAVITY = 0.6;
  const LIFT = -10;
  const OBSTACLE_SPEED = 5;
  const OBSTACLE_SPAWN_RATE = 1500; // ms

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full screen
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 0.6; // Take up 60% of screen height
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    let animationFrameId: number;
    let obstacles: { x: number; y: number; width: number; height: number }[] = [];
    let player = { x: 50, y: canvas.height / 2, velocity: 0, radius: 20 };
    let lastSpawnTime = 0;
    let currentScore = 0;

    const resetGame = () => {
      player = { x: 50, y: canvas.height / 2, velocity: 0, radius: 20 };
      obstacles = [];
      currentScore = 0;
      setScore(0);
    };

    const drawRocket = (x: number, y: number) => {
      ctx.fillStyle = '#00f2ff'; // Cyan neon color
      ctx.beginPath();
      ctx.moveTo(x + 20, y);
      ctx.lineTo(x - 10, y + 10);
      ctx.lineTo(x - 10, y - 10);
      ctx.fill();
      
      // Engine flame
      if (gameState === 'playing') {
        ctx.fillStyle = '#ff9900';
        ctx.beginPath();
        ctx.moveTo(x - 15, y);
        ctx.lineTo(x - 25, y + 5);
        ctx.lineTo(x - 25, y - 5);
        ctx.fill();
      }
    };

    const loop = (timestamp: number) => {
      if (gameState !== 'playing') return;

      // Clear canvas
      ctx.fillStyle = '#0f172a'; // Dark background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars background effect
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 20; i++) {
        const sx = Math.random() * canvas.width;
        const sy = Math.random() * canvas.height;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Physics
      player.velocity += GRAVITY;
      player.y += player.velocity;

      // Boundaries
      if (player.y + player.radius > canvas.height) {
        player.y = canvas.height - player.radius;
        player.velocity = 0;
      }
      if (player.y - player.radius < 0) {
        player.y = player.radius;
        player.velocity = 0;
      }

      // Spawn Obstacles
      if (timestamp - lastSpawnTime > OBSTACLE_SPAWN_RATE) {
        const height = Math.random() * (canvas.height / 2) + 50;
        const isTop = Math.random() > 0.5;
        obstacles.push({
          x: canvas.width,
          y: isTop ? 0 : canvas.height - height,
          width: 50,
          height: height
        });
        lastSpawnTime = timestamp;
      }

      // Update & Draw Obstacles
      ctx.fillStyle = '#ef4444'; // Red obstacles
      obstacles.forEach((obs, index) => {
        obs.x -= OBSTACLE_SPEED;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // Collision Detection
        if (
          player.x + player.radius > obs.x &&
          player.x - player.radius < obs.x + obs.width &&
          player.y + player.radius > obs.y &&
          player.y - player.radius < obs.y + obs.height
        ) {
          setGameState('gameover');
          if (currentScore > highScore) setHighScore(currentScore);
        }

        // Remove off-screen obstacles and increase score
        if (obs.x + obs.width < 0) {
          obstacles.splice(index, 1);
          currentScore++;
          setScore(currentScore);
        }
      });

      drawRocket(player.x, player.y);
      animationFrameId = requestAnimationFrame(loop);
    };

    if (gameState === 'playing') {
      resetGame();
      animationFrameId = requestAnimationFrame(loop);
    } else {
      // Initial Static Render
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawRocket(50, canvas.height / 2);
    }

    const handleInput = () => {
      if (gameState === 'playing') {
        player.velocity = LIFT;
      } else if (gameState === 'start' || gameState === 'gameover') {
        setGameState('playing');
      }
    };

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') handleInput();
    });
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent scrolling
        handleInput();
    });
    canvas.addEventListener('mousedown', handleInput);

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      window.removeEventListener('keydown', handleInput);
      canvas.removeEventListener('touchstart', handleInput);
      canvas.removeEventListener('mousedown', handleInput);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, highScore]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="text-center mb-6">
        <WifiOff className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <h1 className="text-3xl font-bold text-primary">You are Offline</h1>
        <p className="text-muted-foreground">No internet connection found. Play Cosmic Dash while you wait!</p>
      </div>

      <div className="relative w-full max-w-2xl border-2 border-primary/20 rounded-xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} className="block w-full touch-none cursor-pointer bg-slate-900" />
        
        {/* Game UI Overlays */}
        {gameState !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
            {gameState === 'start' && <h2 className="text-2xl font-bold mb-4">Tap or Space to Start</h2>}
            {gameState === 'gameover' && (
              <>
                <h2 className="text-3xl font-bold text-red-500 mb-2">Game Over</h2>
                <p className="text-xl mb-4">Score: {score}</p>
                <Button onClick={() => setGameState('playing')} variant="secondary">
                  <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                </Button>
              </>
            )}
          </div>
        )}
        
        {gameState === 'playing' && (
           <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded text-white font-mono text-xl">
             {score}
           </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">High Score: {highScore}</p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="mx-auto"
        >
          Check Connection
        </Button>
      </div>
    </div>
  );
};

export default OfflinePage;