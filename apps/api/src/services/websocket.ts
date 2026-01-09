import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { eventBus, TokenEvent } from "./eventBus.js";

let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: Server) {
  wss = new WebSocketServer({ server, path: "/ws/events" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("[WS] Client connected");

    const unsubscribe = eventBus.onTokenEvent((event: TokenEvent) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
      }
    });

    (ws as any).isAlive = true;
    ws.on("pong", () => {
      (ws as any).isAlive = true;
    });

    ws.on("close", () => {
      console.log("[WS] Client disconnected");
      unsubscribe();
    });

    ws.on("error", (err) => {
      console.error("[WS] Error:", err);
      unsubscribe();
    });
  });

  // Heartbeat to detect stale connections
  const interval = setInterval(() => {
    wss?.clients.forEach((ws) => {
      if ((ws as any).isAlive === false) {
        return ws.terminate();
      }
      (ws as any).isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  console.log("[WS] WebSocket server initialized on /ws/events");
}

export function getWebSocketServer() {
  return wss;
}
