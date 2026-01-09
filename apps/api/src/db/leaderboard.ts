import { pool } from "./index.js";
import { randomUUID } from "crypto";
import type { LeaderboardEntry, GlobalStats, TopToken } from "@vibe-trader/shared";

// Mask user identifiers for privacy
function maskUserId(userId: string, userType: string): string {
  if (userType === "user") {
    // Clerk user IDs: show first 4 chars
    return `user_${userId.slice(0, 4)}...`;
  } else {
    // IP addresses: show last 4 chars only
    const cleaned = userId.replace("ip:", "");
    return `anon_***${cleaned.slice(-4)}`;
  }
}

// Get global platform statistics
export async function getGlobalStats(): Promise<GlobalStats> {
  // Total trades and volume
  const statsResult = await pool.query(`
    SELECT
      COUNT(*) as total_trades,
      COUNT(DISTINCT user_id) as total_users,
      COALESCE(SUM(amount_sol), 0) as total_volume_sol
    FROM purchases
    WHERE user_id IS NOT NULL
  `);

  const stats = statsResult.rows[0];

  // Top tokens by trade count
  const topTokensResult = await pool.query(`
    SELECT
      token_address,
      token_symbol,
      COUNT(*) as trade_count
    FROM purchases
    GROUP BY token_address, token_symbol
    ORDER BY trade_count DESC
    LIMIT 5
  `);

  // Calculate overall win rate from cache
  const winRateResult = await pool.query(`
    SELECT
      CASE WHEN SUM(total_trades) > 0
        THEN (SUM(win_count)::float / SUM(total_trades)) * 100
        ELSE 0
      END as overall_win_rate
    FROM leaderboard_cache
  `);

  const topTokens: TopToken[] = topTokensResult.rows.map((row) => ({
    address: row.token_address,
    symbol: row.token_symbol || "UNKNOWN",
    tradeCount: parseInt(row.trade_count),
    avgPnlPercent: 0,
  }));

  return {
    totalTrades: parseInt(stats.total_trades) || 0,
    totalUsersTraded: parseInt(stats.total_users) || 0,
    overallWinRate: parseFloat(winRateResult.rows[0]?.overall_win_rate) || 0,
    totalVolumeSOL: parseFloat(stats.total_volume_sol) || 0,
    topTokens,
  };
}

// Get leaderboard entries (paginated)
export async function getLeaderboard(
  sortBy: "pnl" | "trades" | "winRate" = "pnl",
  limit = 50,
  offset = 0
): Promise<LeaderboardEntry[]> {
  const orderColumn: Record<string, string> = {
    pnl: "total_pnl_usd",
    trades: "total_trades",
    winRate: "win_rate",
  };

  const result = await pool.query(
    `SELECT
      user_id,
      user_type,
      total_trades,
      total_invested_sol,
      total_pnl_usd,
      win_rate
    FROM leaderboard_cache
    WHERE total_trades > 0
    ORDER BY ${orderColumn[sortBy]} DESC
    LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return result.rows.map((row, index) => ({
    rank: offset + index + 1,
    userId: row.user_id,
    displayName: maskUserId(row.user_id, row.user_type),
    totalTrades: row.total_trades,
    totalInvestedSol: parseFloat(row.total_invested_sol),
    totalPnlUsd: parseFloat(row.total_pnl_usd),
    winRate: parseFloat(row.win_rate),
  }));
}

// Get user's stats and rank
export async function getUserStats(userId: string): Promise<{
  totalTrades: number;
  totalInvestedSol: number;
  totalPnlUsd: number;
  winRate: number;
  rank: number | null;
  lastUpdated: string | null;
} | null> {
  const result = await pool.query(
    `SELECT
      user_id, total_trades, total_invested_sol,
      total_pnl_usd, win_rate, last_updated
     FROM leaderboard_cache
     WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  // Get user's rank
  const rankResult = await pool.query(
    `SELECT COUNT(*) + 1 as rank
     FROM leaderboard_cache
     WHERE total_pnl_usd > (
       SELECT total_pnl_usd FROM leaderboard_cache WHERE user_id = $1
     )`,
    [userId]
  );

  const userStats = result.rows[0];
  return {
    totalTrades: userStats.total_trades,
    totalInvestedSol: parseFloat(userStats.total_invested_sol),
    totalPnlUsd: parseFloat(userStats.total_pnl_usd),
    winRate: parseFloat(userStats.win_rate),
    rank: parseInt(rankResult.rows[0]?.rank) || null,
    lastUpdated: userStats.last_updated,
  };
}

// Save token price snapshot
export async function saveTokenPriceSnapshot(
  tokenAddress: string,
  priceUsd: number
): Promise<void> {
  await pool.query(
    `INSERT INTO token_price_snapshots (id, token_address, price_usd, timestamp)
     VALUES ($1, $2, $3, NOW())`,
    [randomUUID(), tokenAddress, priceUsd]
  );
}

// Get latest price for a token
export async function getLatestTokenPrice(
  tokenAddress: string
): Promise<number | null> {
  const result = await pool.query(
    `SELECT price_usd FROM token_price_snapshots
     WHERE token_address = $1
     ORDER BY timestamp DESC
     LIMIT 1`,
    [tokenAddress]
  );

  return result.rows[0]?.price_usd || null;
}

// Refresh leaderboard cache (called periodically by price updater)
export async function refreshLeaderboardCache(
  tokenPrices: Map<string, number>,
  solPriceUsd: number
): Promise<void> {
  // Get all users with their purchases
  const usersResult = await pool.query(`
    SELECT DISTINCT user_id, user_type FROM purchases WHERE user_id IS NOT NULL
  `);

  for (const user of usersResult.rows) {
    const purchasesResult = await pool.query(
      `SELECT token_address, amount_sol, amount_token, price_per_token
       FROM purchases
       WHERE user_id = $1`,
      [user.user_id]
    );

    const totalTrades = purchasesResult.rows.length;
    let totalInvestedSol = 0;
    let totalCurrentValueUsd = 0;
    let winCount = 0;

    for (const purchase of purchasesResult.rows) {
      totalInvestedSol += parseFloat(purchase.amount_sol);

      const currentPrice = tokenPrices.get(purchase.token_address);
      if (currentPrice !== undefined) {
        const currentValue = parseFloat(purchase.amount_token) * currentPrice;
        const costBasisUsd = parseFloat(purchase.amount_sol) * solPriceUsd;
        totalCurrentValueUsd += currentValue;

        if (currentValue > costBasisUsd) {
          winCount++;
        }
      }
    }

    const totalPnlUsd = totalCurrentValueUsd - totalInvestedSol * solPriceUsd;
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

    // Upsert cache entry
    await pool.query(
      `INSERT INTO leaderboard_cache
        (id, user_id, user_type, total_trades, total_invested_sol, total_current_value_usd, total_pnl_usd, win_count, win_rate, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         total_trades = $4,
         total_invested_sol = $5,
         total_current_value_usd = $6,
         total_pnl_usd = $7,
         win_count = $8,
         win_rate = $9,
         last_updated = NOW()`,
      [
        randomUUID(),
        user.user_id,
        user.user_type,
        totalTrades,
        totalInvestedSol,
        totalCurrentValueUsd,
        totalPnlUsd,
        winCount,
        winRate,
      ]
    );
  }
}

// Get all unique token addresses from purchases
export async function getActiveTokens(): Promise<string[]> {
  const result = await pool.query(`
    SELECT DISTINCT token_address FROM purchases
  `);
  return result.rows.map((row) => row.token_address);
}
