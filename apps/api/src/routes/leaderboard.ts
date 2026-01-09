import { Router } from "express";
import type { LeaderboardResponse, UserStats } from "@vibe-trader/shared";
import { getGlobalStats, getLeaderboard, getUserStats } from "../db/leaderboard.js";

const router = Router();

// GET /leaderboard - Main leaderboard endpoint
router.get("/", async (req, res) => {
  try {
    const sortBy = (req.query.sort as "pnl" | "trades" | "winRate") || "pnl";
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    // Validate sortBy
    if (!["pnl", "trades", "winRate"].includes(sortBy)) {
      return res.status(400).json({ error: "Invalid sort parameter" });
    }

    const [globalStats, leaderboard] = await Promise.all([
      getGlobalStats(),
      getLeaderboard(sortBy, limit, offset),
    ]);

    const response: LeaderboardResponse = {
      globalStats,
      leaderboard,
      lastUpdated: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /leaderboard/me - Current user's stats
router.get("/me", async (req, res) => {
  try {
    const { userIdentifier } = req;

    if (!userIdentifier) {
      return res.status(401).json({ error: "User not identified" });
    }

    const stats = await getUserStats(userIdentifier);

    if (!stats) {
      // User has no trades yet
      const response: UserStats = {
        totalTrades: 0,
        totalInvestedSol: 0,
        totalPnlUsd: 0,
        winRate: 0,
        rank: null,
      };
      return res.json(response);
    }

    const response: UserStats = {
      totalTrades: stats.totalTrades,
      totalInvestedSol: stats.totalInvestedSol,
      totalPnlUsd: stats.totalPnlUsd,
      winRate: stats.winRate,
      rank: stats.rank,
      lastUpdated: stats.lastUpdated || undefined,
    };

    res.json(response);
  } catch (error) {
    console.error("User stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
