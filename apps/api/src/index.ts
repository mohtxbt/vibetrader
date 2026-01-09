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
import { initWebSocketServer } from "./services/websocket.js";

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

// Dev-only endpoint to reset rate limits
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
}

async function start() {
  await initDb();
  initWallet();
  startPriceUpdater();

  const server = createServer(app);
  initWebSocketServer(server);

  server.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

start();
