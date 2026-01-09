"use client";

import { useEffect, useRef } from "react";
import { useTokenEvents, TokenEvent } from "@/hooks/useTokenEvents";

interface AnimatedToken {
  id: string;
  symbol: string;
  type: "pitched" | "rejected" | "bought";
  x: number;
  y: number;
  opacity: number;
  scale: number;
  velocityX: number;
  velocityY: number;
  lifetime: number;
  maxLifetime: number;
  glowIntensity: number;
}

export default function TokenEventBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { events } = useTokenEvents();
  const tokensRef = useRef<AnimatedToken[]>([]);
  const lastEventIdRef = useRef<string>("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const getColorForType = (type: string): string => {
      switch (type) {
        case "bought":
          return "#00ff00";
        case "rejected":
          return "#ff4444";
        case "pitched":
        default:
          return "#888888";
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      tokensRef.current = tokensRef.current.filter((token) => {
        token.lifetime += 16;
        const progress = token.lifetime / token.maxLifetime;

        // Update position
        token.x += token.velocityX;
        token.y += token.velocityY;

        // Animation behavior based on type
        if (token.type === "rejected") {
          // Fade out quickly with slight expansion
          token.opacity = Math.max(0, 1 - progress * 1.5);
          token.scale = 1 + progress * 0.4;
          token.glowIntensity = Math.max(0, 15 - progress * 20);
        } else if (token.type === "bought") {
          // Pulse glow effect, float upward
          token.opacity = Math.max(0, 1 - progress * 0.8);
          token.scale = 1 + Math.sin(progress * Math.PI * 4) * 0.15;
          token.glowIntensity = 20 + Math.sin(progress * Math.PI * 6) * 10;
        } else {
          // Pitched: subtle neutral fade
          token.opacity = Math.max(0, 0.7 - progress * 0.7);
          token.glowIntensity = 5;
        }

        if (token.opacity <= 0) return false;

        // Draw token
        const color = getColorForType(token.type);
        ctx.save();
        ctx.globalAlpha = token.opacity * 0.85;
        ctx.font = `bold ${14 * token.scale}px "Press Start 2P", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Glow effect
        if (token.glowIntensity > 0) {
          ctx.shadowColor = color;
          ctx.shadowBlur = token.glowIntensity;
        }

        ctx.fillStyle = color;
        ctx.fillText(`$${token.symbol}`, token.x, token.y);

        // Extra glow pass for bought tokens
        if (token.type === "bought" && token.opacity > 0.3) {
          ctx.globalAlpha = token.opacity * 0.3;
          ctx.shadowBlur = token.glowIntensity * 2;
          ctx.fillText(`$${token.symbol}`, token.x, token.y);
        }

        ctx.restore();
        return true;
      });

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

  // Add new tokens when events arrive
  useEffect(() => {
    if (events.length === 0) return;

    const latestEvent = events[0];
    const eventId = `${latestEvent.timestamp}-${latestEvent.tokenAddress}`;

    if (eventId === lastEventIdRef.current) return;
    lastEventIdRef.current = eventId;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create animated token at random position
    const padding = 100;
    const newToken: AnimatedToken = {
      id: eventId,
      symbol: latestEvent.symbol.slice(0, 8),
      type: latestEvent.type,
      x: padding + Math.random() * (canvas.width - padding * 2),
      y: padding + Math.random() * (canvas.height - padding * 2),
      opacity: 1,
      scale: 1,
      velocityX: (Math.random() - 0.5) * 0.3,
      velocityY: latestEvent.type === "bought" ? -0.8 : 0.3,
      lifetime: 0,
      maxLifetime: latestEvent.type === "bought" ? 5000 : 3000,
      glowIntensity: latestEvent.type === "bought" ? 20 : 10,
    };

    tokensRef.current.push(newToken);
  }, [events]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{ opacity: 0.9 }}
    />
  );
}
