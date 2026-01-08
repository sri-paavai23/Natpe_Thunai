"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Zap, Trophy, Play, RotateCcw, AlertTriangle } from 'lucide-react';

// --- TACTICAL CONFIGURATION ---
const CONSTANTS = {
  ASPECT_RATIO: 16 / 9,
  GRAVITY: 0.7, // Heavier gravity for snappier jumps
  JUMP_FORCE: -11, // Stronger initial jump
  DOUBLE_JUMP_FORCE: -9, // Strategic second jump
  BASE_SPEED: 6, // Faster start
  MAX_SPEED: 18, // Higher skill ceiling
  SPEED_INCREMENT: 0.002, // Aggressive ramp up
  GROUND_HEIGHT_RATIO: 0.85,
  PLAYER_SIZE: 20, // Slightly smaller hitbox for precision
  OBSTACLE_WIDTH: 25,
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
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'SPIKE' | 'DRONE' | 'WALL';
  passed: boolean;
}

const CosmicDashGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAME_OVER'>('IDLE');
  const [dimensions, setDimensions] = useState({ width: 320, height: 180 });

  // Mutable Game State
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
    lastSpawnX: 0, // Track spawn by distance, not time
    shake: 0,
    frameId: 0,
    stars: [] as { x: number; y: number; size: number; speed: number }[],
    speedLines: [] as { x: number; y: number; len: number; speed: number }[],
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        const h = w / CONSTANTS.ASPECT_RATIO;
        setDimensions({ width: w, height: h });
        initBackground(w, h);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    
    const saved = localStorage.getItem('cosmicHighScore');
    if (saved) setHighScore(parseInt(saved));

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initBackground = (w: number, h: number) => {
    game.current.stars = Array.from({ length: 30 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 2,
      speed: Math.random() * 0.5 + 0.1
    }));
    game.current.speedLines = Array.from({ length: 10 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      len: Math.random() * 20 + 10,
      speed: Math.