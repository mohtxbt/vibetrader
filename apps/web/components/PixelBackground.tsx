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
    let stars: Star[] = [];
    let candlesticks: Candlestick[] = [];

    // Star colors - mix of white and neon
    const starColors = ["#ffffff", "#ff00ff", "#00ffff", "#ffff00", "#b388ff"];

    class Star {
      x: number;
      y: number;
      size: number;
      color: string;
      alpha: number;
      twinkleSpeed: number;
      twinklePhase: number;

      constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.size = Math.random() * 3 + 1;
        // More colored stars for visibility
        this.color = Math.random() > 0.7
          ? starColors[Math.floor(Math.random() * starColors.length)]
          : "#ffffff";
        this.alpha = Math.random() * 0.5 + 0.5;
        this.twinkleSpeed = Math.random() * 0.02 + 0.005;
        this.twinklePhase = Math.random() * Math.PI * 2;
      }

      update(time: number) {
        // Smooth twinkling using sine wave - brighter range
        this.alpha = 0.5 + Math.sin(time * this.twinkleSpeed + this.twinklePhase) * 0.5;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;

        // Draw star with glow effect
        if (this.size > 1.5) {
          ctx.shadowColor = this.color;
          ctx.shadowBlur = 10;
        } else {
          ctx.shadowColor = this.color;
          ctx.shadowBlur = 4;
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
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
        this.width = 6;
        this.height = Math.random() * 30 + 15;
        this.wickHeight = Math.random() * 15 + 5;
        this.y = canvasHeight - this.height - Math.random() * 80;
        this.isGreen = Math.random() > 0.4;
        this.alpha = Math.random() * 0.15 + 0.05;
        this.alphaChange = (Math.random() - 0.5) * 0.005;
      }

      update() {
        this.alpha += this.alphaChange;
        if (this.alpha <= 0.04 || this.alpha >= 0.18) {
          this.alphaChange *= -1;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        const color = this.isGreen ? "#00ff00" : "#ff3333";
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillRect(this.x + this.width / 2 - 1, this.y - this.wickHeight, 2, this.wickHeight);
        ctx.fillRect(this.x + this.width / 2 - 1, this.y + this.height, 2, this.wickHeight);
      }
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
      initCandlesticks();
    };

    const initStars = () => {
      stars = [];
      // Dense star field for vibrant effect
      const starCount = Math.floor((canvas.width * canvas.height) / 2500);
      for (let i = 0; i < starCount; i++) {
        stars.push(new Star(canvas.width, canvas.height));
      }
    };

    const initCandlesticks = () => {
      candlesticks = [];
      const spacing = 30;
      const count = Math.ceil(canvas.width / spacing);
      for (let i = 0; i < count; i++) {
        candlesticks.push(new Candlestick(i * spacing, canvas.height));
      }
    };

    let time = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time++;

      // Draw candlesticks in background (very subtle)
      candlesticks.forEach((candle) => {
        candle.update();
        candle.draw(ctx);
      });

      // Draw stars
      stars.forEach((star) => {
        star.update(time);
        star.draw(ctx);
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
      style={{ opacity: 1 }}
    />
  );
}
