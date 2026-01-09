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

function getWsUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  return apiUrl.replace(/^http/, "ws") + "/ws/events";
}

export function useTokenEvents() {
  const [events, setEvents] = useState<TokenEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

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
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error("[WS] Error:", err);
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  return { events, isConnected };
}
