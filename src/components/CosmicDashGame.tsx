"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const GAME_ASPECT_RATIO = 16 / 9; // Width / Height
const BASE_GAME_WIDTH = 320; // Base width for calculations
const BASE_GAME_HEIGHT = BASE_GAME_WIDTH / GAME_ASPECT_RATIO;

const GROUND_Y_RATIO = 0.8; // Ground at 80% of height
const ASTRO_SIZE_RATIO = 0.1; // Astro size relative to height
const OBSTACLE_WIDTH_RATIO = 0.03; // Obstacle width relative to width
const OBSTACLE_HEIGHT_RATIO = 0.15; // Obstacle height relative to height

const JUMP_VELOCITY_BASE = -8;
const GRAVITY_BASE = 0.4;
const OBSTACLE_SPEED_BASE = 3;

const CosmicDashGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(true);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [gameDimensions, setGameDimensions] = useState({ width: BASE_GAME_WIDTH, height: BASE_GAME_HEIGHT });

  const gameRef = useRef({
    astroY: 0,
    velocityY: 0,
    isJumping: false,
    obstacles: [] as { x: number; y: number; width: number; height: number }[],
    score: 0,
    lastObstacleTime: 0,
    gameLoopId: 0,
    groundY: 0,
    astroSize: 0,
    obstacleSpeed: 0,
    jumpVelocity: 0,
    gravity: 0,
    obstacleWidth: 0,
    obstacleHeight: 0,
  });

  const updateGameConstants = useCallback((width: number, height: number) => {
    const groundY = height * GROUND_Y_RATIO;
    const astroSize = height * ASTRO_SIZE_RATIO;
    const obstacleWidth = width * OBSTACLE_WIDTH_RATIO;
    const obstacleHeight = height * OBSTACLE_HEIGHT_RATIO;

    gameRef.current.groundY = groundY;
    gameRef.current.astroSize = astroSize;
    gameRef.current.obstacleWidth = obstacleWidth;
    gameRef.current.obstacleHeight = obstacleHeight;

    // Scale physics constants based on height for consistent feel
    const scaleFactor = height / BASE_GAME_HEIGHT;
    gameRef.current.jumpVelocity = JUMP_VELOCITY_BASE * scaleFactor;
    gameRef.current.gravity = GRAVITY_BASE * scaleFactor;
    gameRef.current.obstacleSpeed = OBSTACLE_SPEED_BASE * scaleFactor;
  }, []);

  // Handle resizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const newWidth = containerWidth;
        const newHeight = newWidth / GAME_ASPECT_RATIO;
        setGameDimensions({ width: newWidth, height: newHeight });
        updateGameConstants(newWidth, newHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial size
    return () => window.removeEventListener('resize', handleResize);
  }, [updateGameConstants]);

  // Load high score from local storage on mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem('cosmicDashHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  const saveHighScore = useCallback((newScore: number) => {
    const currentHighScore = parseInt(localStorage.getItem('cosmicDashHighScore') || '0', 10);
    if (newScore > currentHighScore) {
      localStorage.setItem('cosmicDashHighScore', newScore.toString());
      setHighScore(newScore);
    }
  }, []);

  const startGame = useCallback(() => {
    if (gameRef.current.gameLoopId) {
      cancelAnimationFrame(gameRef.current.gameLoopId);
    }
    
    const { groundY, astroSize } = gameRef.current;
    gameRef.current = {
      ...gameRef.current, // Keep physics constants
      astroY: groundY - astroSize,
      velocityY: 0,
      isJumping: false,
      obstacles: [],
      score: 0,
      lastObstacleTime: Date.now(),
      gameLoopId: 0,
    };
    setScore(0);
    setIsGameOver(false);
    setIsGameRunning(true);
  }, []);

  const jump = useCallback(() => {
    if (!gameRef.current.isJumping && isGameRunning) {
      gameRef.current.isJumping = true;
      gameRef.current.velocityY = gameRef.current.jumpVelocity;
    }
  }, [isGameRunning]);

  // Handle touch input
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling
      if (isGameOver) {
        startGame();
      } else {
        jump();
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart);
    return () => canvas.removeEventListener('touchstart', handleTouchStart);
  }, [isGameOver, startGame, jump]);

  // Game Loop
  useEffect(() => {
    if (!isGameRunning) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const updateGame = () => {
      const { current } = gameRef;
      const { width, height } = gameDimensions;

      // 1. Update Astronaut position (Gravity and Jump)
      if (current.isJumping) {
        current.astroY += current.velocityY;
        current.velocityY += current.gravity;

        if (current.astroY >= current.groundY - current.astroSize) {
          current.astroY = current.groundY - current.astroSize;
          current.isJumping = false;
          current.velocityY = 0;
        }
      }

      // 2. Update Obstacles
      current.obstacles = current.obstacles
        .map(o => ({ ...o, x: o.x - current.obstacleSpeed }))
        .filter(o => o.x > -o.width);

      // 3. Spawn new obstacle
      const now = Date.now();
      if (now - current.lastObstacleTime > 1500 + Math.random() * 1000) {
        current.obstacles.push({ 
          x: width, 
          y: current.groundY - current.obstacleHeight, 
          width: current.obstacleWidth, 
          height: current.obstacleHeight 
        });
        current.lastObstacleTime = now;
      }

      // 4. Check for Collision
      const astroX = width * 0.15; // Fixed X position for astronaut
      const astroY = current.astroY;
      const astroBottom = astroY + current.astroSize;
      const astroRight = astroX + current.astroSize;

      for (const obstacle of current.obstacles) {
        const obsRight = obstacle.x + obstacle.width;
        const obsBottom = obstacle.y + obstacle.height;

        // Simple AABB collision detection
        if (
          astroRight > obstacle.x &&
          astroX < obsRight &&
          astroBottom > obstacle.y
        ) {
          // Collision detected! Game Over.
          setIsGameRunning(false);
          setIsGameOver(true);
          saveHighScore(current.score);
          return;
        }
      }

      // 5. Update Score
      current.score += 1;
      setScore(current.score);

      // 6. Draw everything
      ctx.clearRect(0, 0, width, height);

      // Draw Starfield Background (simple dots)
      ctx.fillStyle = '#1a1a2e'; // Dark background
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff'; // White stars
      for (let i = 0; i < 50; i++) {
        const starX = (Math.random() * width + current.score * 0.1) % width; // Scroll stars
        const starY = Math.random() * height;
        ctx.beginPath();
        ctx.arc(starX, starY, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Ground
      ctx.fillStyle = '#222';
      ctx.fillRect(0, current.groundY, width, 2);

      // Draw Astronaut (Blue square with a slight glow)
      ctx.shadowColor = '#1e40af';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#3b82f6'; // Brighter blue
      ctx.fillRect(astroX, astroY, current.astroSize, current.astroSize);
      ctx.shadowBlur = 0; // Reset shadow

      // Draw Obstacles (Neon Green squares with a slight glow)
      ctx.shadowColor = '#74e874';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#a7f3d0'; // Lighter neon green
      current.obstacles.forEach(o => {
        ctx.fillRect(o.x, o.y, o.width, o.height);
      });
      ctx.shadowBlur = 0; // Reset shadow

      animationFrameId = requestAnimationFrame(updateGame);
      current.gameLoopId = animationFrameId;
    };

    animationFrameId = requestAnimationFrame(updateGame);
    gameRef.current.gameLoopId = animationFrameId;

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isGameRunning, saveHighScore, gameDimensions]);

  return (
    <div ref={containerRef} className="flex flex-col items-center space-y-4 p-4 bg-background rounded-lg border border-border shadow-xl w-full max-w-md mx-auto">
      <div className="flex justify-between w-full text-sm font-mono text-foreground">
        <span>Score: {score}</span>
        <span>High Score: {highScore}</span>
      </div>
      <div 
        className={cn(
          "relative border-2 border-border bg-gray-50 dark:bg-gray-900 overflow-hidden",
          isGameOver && "opacity-70"
        )}
        style={{ width: gameDimensions.width, height: gameDimensions.height }}
      >
        <canvas
          ref={canvasRef}
          width={gameDimensions.width}
          height={gameDimensions.height}
          className="block touch-none" // Disable default touch actions
        />
        {(isGameOver || !isGameRunning) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
            <p className="text-xl font-bold text-secondary-neon mb-2">
              {isGameOver && isGameRunning === false ? 'GAME OVER' : 'COSMIC DASH'}
            </p>
            <p className="text-sm text-primary-foreground mb-4">
              Tap anywhere to {isGameOver ? 'Restart' : 'Start'}
            </p>
            <Button 
              onClick={startGame} 
              className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
            >
              {isGameOver ? 'Restart Game' : 'Start Game'}
            </Button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Tap to jump!</p>
    </div>
  );
};

export default CosmicDashGame;