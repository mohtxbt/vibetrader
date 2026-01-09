"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export type TokenEventType = "pitched" | "rejected" | "bought";

export interface TokenEvent {
  type: TokenEventType;
  timestamp: number;
  tokenAddress: string;
  symbol: string;
  name: string;
  priceUsd: string;
  marketCap: number | null;
  liquidity: number;
  reason?: string;
  amountSol?: number;
  amountToken?: number;
  txSignature?: string;
}

const isDev = process.env.NODE_ENV === "development";

// Mock token data for dev testing
const MOCK_TOKENS = [
  { symbol: "PEPE", name: "Pepe Token" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "SHIB", name: "Shiba Inu" },
  { symbol: "BONK", name: "Bonk" },
  { symbol: "WIF", name: "dogwifhat" },
  { symbol: "FLOKI", name: "Floki Inu" },
  { symbol: "MEME", name: "Memecoin" },
  { symbol: "WOJAK", name: "Wojak" },
  { symbol: "CHAD", name: "Chad Token" },
  { symbol: "MOON", name: "MoonToken" },
];

function generateMockEvent(): TokenEvent {
  const types: TokenEventType[] = ["pitched", "rejected", "bought"];
  const type = types[Math.floor(Math.random() * types.length)];
  const token = MOCK_TOKENS[Math.floor(Math.random() * MOCK_TOKENS.length)];

  return {
    type,
    timestamp: Date.now(),
    tokenAddress: `${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`,
    symbol: token.symbol,
    name: token.name,
    priceUsd: (Math.random() * 0.01).toFixed(8),
    marketCap: Math.floor(Math.random() * 10000000),
    liquidity: Math.floor(Math.random() * 500000),
    reason: type === "rejected" ? "Low liquidity" : undefined,
    amountSol: type === "bought" ? Math.random() * 0.1 : undefined,
    amountToken: type === "bought" ? Math.floor(Math.random() * 1000000) : undefined,
  };
}

function getWsUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  return apiUrl.replace(/^http/, "ws") + "/ws/events";
}

export function useTokenEvents() {
  const [events, setEvents] = useState<TokenEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const devIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Dev mode: generate fake events
  const startDevMode = useCallback(() => {
    if (!isDev) return;
    console.log("[WS-DEV] Starting mock event generator");
    setDevMode(true);
    setIsConnected(true);

    devIntervalRef.current = setInterval(() => {
      const mockEvent = generateMockEvent();
      setEvents((prev) => [mockEvent, ...prev].slice(0, 50));
    }, 2000 + Math.random() * 3000); // Random interval 2-5s
  }, []);

  const stopDevMode = useCallback(() => {
    if (devIntervalRef.current) {
      clearInterval(devIntervalRef.current);
      devIntervalRef.current = null;
    }
    setDevMode(false);
    setIsConnected(false);
    console.log("[WS-DEV] Stopped mock event generator");
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (devMode) return; // Don't connect if in dev mode

    const wsUrl = getWsUrl();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Connected to event feed");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const tokenEvent = JSON.parse(event.data) as TokenEvent;
        setEvents((prev) => {
          const updated = [tokenEvent, ...prev].slice(0, 50);
          return updated;
        });
      } catch (err) {
        console.error("[WS] Failed to parse event:", err);
      }
    };

    ws.onclose = () => {
      console.log("[WS] Disconnected, reconnecting in 3s...");
      setIsConnected(false);
      if (!devMode) {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = (err) => {
      console.error("[WS] Error:", err);
    };
  }, [devMode]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (devIntervalRef.current) {
        clearInterval(devIntervalRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    events,
    isConnected,
    // Dev mode controls (only available in development)
    ...(isDev && {
      devMode,
      startDevMode,
      stopDevMode,
    }),
  };
}
