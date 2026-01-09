"use client";

import { useEffect, useState } from "react";
import { useTokenEvents } from "@/hooks/useTokenEvents";

const ASCII_FRAMES = [
  "🚀═══════════════════════════════════════🚀",
  "💎═══════════════════════════════════════💎",
  "🔥═══════════════════════════════════════🔥",
  "💰═══════════════════════════════════════💰",
];

const isDev = process.env.NODE_ENV === "development";

export default function AsciiFooter() {
  const [frame, setFrame] = useState(0);
  const [glitchText, setGlitchText] = useState("VIBE_TRADER");
  const tokenEvents = useTokenEvents();

  useEffect(() => {
    const frameInterval = setInterval(() => {
      setFrame((f) => (f + 1) % ASCII_FRAMES.length);
    }, 500);

    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.85) {
        const chars = "🚀💎🔥💰🦍🐸📈🌙⭐";
        const text = "VIBE_TRADER";
        const pos = Math.floor(Math.random() * text.length);
        const glitched =
          text.slice(0, pos) +
          chars[Math.floor(Math.random() * chars.length)] +
          text.slice(pos + 1);
        setGlitchText(glitched);
        setTimeout(() => setGlitchText("VIBE_TRADER"), 150);
      }
    }, 200);

    return () => {
      clearInterval(frameInterval);
      clearInterval(glitchInterval);
    };
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 bg-meme-dark/95 border-t-2 border-neon-pink/50 font-mono text-xs py-2 px-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <span className="hidden sm:inline text-neon-cyan opacity-80">{ASCII_FRAMES[frame]}</span>
        <div className="flex items-center gap-3">
          <span className="text-neon-pink glow-pink">{glitchText}</span>
          {isDev && tokenEvents.startDevMode && (
            <button
              onClick={() => {
                if (tokenEvents.devMode) {
                  tokenEvents.stopDevMode?.();
                } else {
                  tokenEvents.startDevMode?.();
                }
              }}
              className={`px-2 py-0.5 text-[10px] border transition-colors ${
                tokenEvents.devMode
                  ? "border-neon-green text-neon-green"
                  : "border-meme-muted text-meme-light hover:border-neon-yellow hover:text-neon-yellow"
              }`}
              title="Toggle mock WebSocket events"
            >
              {tokenEvents.devMode ? "WS: ON" : "WS: OFF"}
            </button>
          )}
        </div>
        <span className="hidden sm:inline text-neon-cyan opacity-80">{ASCII_FRAMES[frame]}</span>
      </div>
    </footer>
  );
}
