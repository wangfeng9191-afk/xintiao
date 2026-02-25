/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

// --- Constants ---
const CANVAS_WIDTH = 840;
const CANVAS_HEIGHT = 680;
const CANVAS_CENTER_X = CANVAS_WIDTH / 2;
const CANVAS_CENTER_Y = CANVAS_HEIGHT / 2;
const IMAGE_ENLARGE = 11;
const HEART_COLOR = "#FFD700"; // Gold color

// --- Mathematical Functions ---

function heartFunction(t: number) {
  // Parametric equations for the heart shape
  let x = 17 * Math.pow(Math.sin(t), 3);
  let y = -(16 * Math.cos(t) - 5 * Math.cos(2 * t) - 3 * Math.cos(3 * t));

  // Scale and center
  x *= IMAGE_ENLARGE;
  y *= IMAGE_ENLARGE;
  x += CANVAS_CENTER_X;
  y += CANVAS_CENTER_Y;

  return { x: Math.floor(x), y: Math.floor(y) };
}

function scatterInside(x: number, y: number, beta = 0.15) {
  const ratioX = -beta * Math.log(Math.random());
  const ratioY = -beta * Math.log(Math.random());

  const dx = ratioX * (x - CANVAS_CENTER_X);
  const dy = ratioY * (y - CANVAS_CENTER_Y);

  return { x: x - dx, y: y - dy };
}

function shrink(x: number, y: number, ratio: number) {
  const force = -1 / Math.pow(Math.pow(x - CANVAS_CENTER_X, 2) + Math.pow(y - CANVAS_CENTER_Y, 2), 0.6);
  const dx = ratio * force * (x - CANVAS_CENTER_X);
  const dy = ratio * force * (y - CANVAS_CENTER_Y);
  return { x: x - dx, y: y - dy };
}

function curve(p: number) {
  return 2 * (2 * Math.sin(4 * p)) / (2 * Math.PI);
}

// --- Heart Logic ---

class Heart {
  private points: { x: number; y: number }[] = [];
  private edgeDiffusionPoints: { x: number; y: number }[] = [];
  private centerDiffusionPoints: { x: number; y: number }[] = [];
  private allPoints: Record<number, { x: number; y: number; size: number }[]> = {};
  private generateFrame: number;

  constructor(generateFrame = 200) {
    this.generateFrame = generateFrame;
    this.build(1000);
    for (let frame = 0; frame < generateFrame; frame++) {
      this.calc(frame);
    }
  }

  private build(number: number) {
    // Heart outline
    for (let i = 0; i < number; i++) {
      const t = Math.random() * 2 * Math.PI;
      const { x, y } = heartFunction(t);
      this.points.push({ x, y });
    }

    // Edge diffusion
    this.points.forEach((p) => {
      for (let i = 0; i < 3; i++) {
        const { x, y } = scatterInside(p.x, p.y, 0.05);
        this.edgeDiffusionPoints.push({ x, y });
      }
    });

    // Center diffusion
    for (let i = 0; i < 5000; i++) {
      const p = this.points[Math.floor(Math.random() * this.points.length)];
      const { x, y } = scatterInside(p.x, p.y, 0.27);
      this.centerDiffusionPoints.push({ x, y });
    }
  }

  private calcPosition(x: number, y: number, ratio: number) {
    const force = 1 / Math.pow(Math.pow(x - CANVAS_CENTER_X, 2) + Math.pow(y - CANVAS_CENTER_Y, 2), 0.420);
    const dx = ratio * force * (x - CANVAS_CENTER_X) + (Math.random() * 2 - 1);
    const dy = ratio * force * (y - CANVAS_CENTER_Y) + (Math.random() * 2 - 1);
    return { x: x - dx, y: y - dy };
  }

  private calc(frame: number) {
    const ratio = 15 * curve((frame / 100) * Math.PI);
    const haloRadius = Math.floor(4 + 6 * (1 + curve((frame / 100) * Math.PI)));
    const haloNumber = Math.floor(1500 + 2000 * Math.pow(Math.abs(curve((frame / 100) * Math.PI)), 2));

    const framePoints: { x: number; y: number; size: number }[] = [];

    // Halo
    for (let i = 0; i < haloNumber; i++) {
      const t = Math.random() * 2 * Math.PI;
      let { x, y } = heartFunction(t);
      ({ x, y } = shrink(x, y, haloRadius));

      x += Math.floor(Math.random() * 121) - 60;
      y += Math.floor(Math.random() * 121) - 60;
      const size = Math.random() < 0.66 ? 1 : 2;
      framePoints.push({ x, y, size });
    }

    // Outline
    this.points.forEach((p) => {
      const { x, y } = this.calcPosition(p.x, p.y, ratio);
      const size = Math.floor(Math.random() * 3) + 1;
      framePoints.push({ x, y, size });
    });

    // Edge diffusion
    this.edgeDiffusionPoints.forEach((p) => {
      const { x, y } = this.calcPosition(p.x, p.y, ratio);
      const size = Math.floor(Math.random() * 2) + 1;
      framePoints.push({ x, y, size });
    });

    // Center diffusion
    this.centerDiffusionPoints.forEach((p) => {
      const { x, y } = this.calcPosition(p.x, p.y, ratio);
      const size = Math.floor(Math.random() * 2) + 1;
      framePoints.push({ x, y, size });
    });

    this.allPoints[frame] = framePoints;
  }

  public render(ctx: CanvasRenderingContext2D, frame: number) {
    const points = this.allPoints[frame % this.generateFrame];
    ctx.fillStyle = HEART_COLOR;
    points.forEach((p) => {
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    // Draw beating text
    const beatRatio = curve((frame / 100) * Math.PI);
    const fontSize = 40 + 10 * beatRatio;
    ctx.font = `bold ${fontSize}px "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add a subtle glow to the text
    ctx.shadowBlur = 15;
    ctx.shadowColor = HEART_COLOR;
    ctx.fillStyle = HEART_COLOR;
    
    // Position text above the heart
    ctx.fillText("新年快乐~", CANVAS_CENTER_X, CANVAS_CENTER_Y - 220 - (10 * beatRatio));
    
    // Reset shadow for other drawings
    ctx.shadowBlur = 0;
  }
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartRef = useRef<Heart | null>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!heartRef.current) {
      heartRef.current = new Heart();
    }

    let animationId: number;

    const animate = () => {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      heartRef.current?.render(ctx, frameRef.current);
      frameRef.current += 1;
      
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="relative group">
        {/* Decorative background glow */}
        <div className="absolute -inset-4 bg-yellow-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="relative bg-black rounded-2xl shadow-2xl overflow-hidden border border-white/5">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="max-w-full h-auto block"
          />
          
          {/* Overlay UI */}
          <div className="absolute top-6 left-6">
            <h1 className="text-yellow-200/40 font-mono text-xs tracking-[0.3em] uppercase">
              Bobby / Heart Equation
            </h1>
          </div>
          
          <div className="absolute bottom-6 right-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-yellow-200/40 font-mono text-[10px] tracking-widest uppercase">
                Live Rendering
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
