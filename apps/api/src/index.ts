import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import chatRouter from "./routes/chat.js";
import portfolioRouter from "./routes/portfolio.js";
import leaderboardRouter from "./routes/leaderboard.js";
import { initWallet } from "./services/wallet.js";
import { initDb } from "./db/index.js";
import { clerkMiddleware, extractUserIdentifier } from "./middleware/auth.js";
import { resetRateLimit } from "./db/rateLimits.js";
import { startPriceUpdater } from "./services/priceUpdater.js";
import { getOrder, executeSwap } from "./services/swap.js";
import { initWebSocketServer } from "./services/websocket.js";
import { initCache } from "./services/cache.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow credentials for Clerk auth
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// Clerk middleware - adds auth info to all requests
app.use(clerkMiddleware());

// Extract user identifier for rate limiting
app.use(extractUserIdentifier);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/chat", chatRouter);
app.use("/portfolio", portfolioRouter);
app.use("/leaderboard", leaderboardRouter);

// Dev-only endpoints
if (process.env.NODE_ENV !== "production") {
  app.post("/dev/reset-rate-limit", async (req, res) => {
    const { userIdentifier } = req;
    if (!userIdentifier) {
      return res.status(400).json({ error: "No user identifier" });
    }
    await resetRateLimit(userIdentifier);
    console.log(`[DEV] Rate limit reset for: ${userIdentifier}`);
    res.json({ success: true, identifier: userIdentifier });
  });

  // Test swap order endpoint (does not execute, just fetches order)
  app.post("/dev/test-swap-order", async (req, res) => {
    try {
      const { outputMint, amountSol = 0.001 } = req.body;
      if (!outputMint) {
        return res.status(400).json({ error: "outputMint is required" });
      }
      console.log(`[DEV] Testing swap order: ${amountSol} SOL -> ${outputMint}`);
      const order = await getOrder(outputMint, amountSol);
      console.log(`[DEV] Order received: requestId=${order.requestId}`);
      res.json({ success: true, order });
    } catch (error) {
      console.error("[DEV] Swap order test failed:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Test full swap execution (USE WITH CAUTION - real funds!)
  app.post("/dev/test-swap-execute", async (req, res) => {
    try {
      const { outputMint, amountSol = 0.001 } = req.body;
      if (!outputMint) {
        return res.status(400).json({ error: "outputMint is required" });
      }
      if (amountSol > 0.01) {
        return res.status(400).json({ error: "Dev test limited to 0.01 SOL max" });
      }
      console.log(`[DEV] Executing swap: ${amountSol} SOL -> ${outputMint}`);
      const result = await executeSwap(outputMint, amountSol);
      console.log(`[DEV] Swap executed: ${result.signature}`);
      res.json({ success: true, result });
    } catch (error) {
      console.error("[DEV] Swap execution test failed:", error);
      res.status(500).json({ error: String(error) });
    }
  });
}

async function start() {
  await initDb();
  await initCache();
  initWallet();
  startPriceUpdater();

  const server = createServer(app);
  initWebSocketServer(server);

  server.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

start();
