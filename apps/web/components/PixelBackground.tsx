"use client";

import { useEffect, useRef } from "react";

export default function PixelBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    let candlesticks: Candlestick[] = [];

    // Neon meme colors
    const colors = ["#ff00ff", "#00ffff", "#ffff00", "#00ff00", "#ff6600", "#9d00ff", "#ff1493"];

    class Particle {
      x: number;
      y: number;
      size: number;
      color: string;
      alpha: number;
      alphaChange: number;
      pulseSpeed: number;
      velocityY: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = Math.random() * 0.6 + 0.2;
        this.alphaChange = (Math.random() - 0.5) * 0.03;
        this.pulseSpeed = Math.random() * 0.02 + 0.01;
        this.velocityY = Math.random() * 0.3 - 0.15;
      }

      update(canvasHeight: number) {
        this.alpha += this.alphaChange;
        if (this.alpha <= 0.1 || this.alpha >= 0.8) {
          this.alphaChange *= -1;
        }
        this.y += this.velocityY;
        if (this.y < 0) this.y = canvasHeight;
        if (this.y > canvasHeight) this.y = 0;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.shadowBlur = 0;
      }
    }

    // Candlestick for chart pattern effect
    class Candlestick {
      x: number;
      y: number;
      width: number;
      height: number;
      wickHeight: number;
      isGreen: boolean;
      alpha: number;
      alphaChange: number;

      constructor(x: number, canvasHeight: number) {
        this.x = x;
        this.width = 8;
        this.height = Math.random() * 40 + 20;
        this.wickHeight = Math.random() * 20 + 10;
        this.y = canvasHeight - this.height - Math.random() * 100;
        this.isGreen = Math.random() > 0.4;
        this.alpha = Math.random() * 0.15 + 0.05;
        this.alphaChange = (Math.random() - 0.5) * 0.01;
      }

      update() {
        this.alpha += this.alphaChange;
        if (this.alpha <= 0.03 || this.alpha >= 0.2) {
          this.alphaChange *= -1;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        const color = this.isGreen ? "#00ff00" : "#ff3333";
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = color;
        // Body
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Wick
        ctx.fillRect(this.x + this.width / 2 - 1, this.y - this.wickHeight, 2, this.wickHeight);
        ctx.fillRect(this.x + this.width / 2 - 1, this.y + this.height, 2, this.wickHeight);
      }
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
      initCandlesticks();
    };

    const initParticles = () => {
      particles = [];
      const spacing = 40;
      const cols = Math.ceil(canvas.width / spacing);
      const rows = Math.ceil(canvas.height / spacing);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          if (Math.random() > 0.75) {
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;
            particles.push(new Particle(i * spacing + offsetX, j * spacing + offsetY));
          }
        }
      }
    };

    const initCandlesticks = () => {
      candlesticks = [];
      const spacing = 25;
      const count = Math.ceil(canvas.width / spacing);
      for (let i = 0; i < count; i++) {
        candlesticks.push(new Candlestick(i * spacing, canvas.height));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw candlesticks in background
      candlesticks.forEach((candle) => {
        candle.update();
        candle.draw(ctx);
      });

      // Draw particles
      particles.forEach((particle) => {
        particle.update(canvas.height);
        particle.draw(ctx);
      });

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    };

    resize();
    animate();

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
