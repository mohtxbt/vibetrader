"use client";

import { useEffect, useState } from "react";

const ASCII_FRAMES = [
  "[ * ]───────────────────────────────────────[ * ]",
  "[ ─ ]───────────────────────────────────────[ ─ ]",
  "[ * ]───────────────────────────────────────[ * ]",
  "[ | ]───────────────────────────────────────[ | ]",
];

export default function AsciiFooter() {
  const [frame, setFrame] = useState(0);
  const [glitchText, setGlitchText] = useState("VIBE_TRADER_v0.1");

  useEffect(() => {
    const frameInterval = setInterval(() => {
      setFrame((f) => (f + 1) % ASCII_FRAMES.length);
    }, 500);

    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.9) {
        const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
        const text = "VIBE_TRADER_v0.1";
        const pos = Math.floor(Math.random() * text.length);
        const glitched =
          text.slice(0, pos) +
          chars[Math.floor(Math.random() * chars.length)] +
          text.slice(pos + 1);
        setGlitchText(glitched);
        setTimeout(() => setGlitchText("VIBE_TRADER_v0.1"), 100);
      }
    }, 200);

    return () => {
      clearInterval(frameInterval);
      clearInterval(glitchInterval);
    };
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 bg-black/90 border-t border-cyber-muted font-mono text-xs text-cyber-muted py-2 px-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <span className="hidden sm:inline opacity-60">{ASCII_FRAMES[frame]}</span>
        <span className="text-cyber-light">{glitchText}</span>
        <span className="hidden sm:inline opacity-60">{ASCII_FRAMES[frame]}</span>
      </div>
    </footer>
  );
}
