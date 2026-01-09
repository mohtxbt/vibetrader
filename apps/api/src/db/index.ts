import pg from "pg";
import type { Purchase } from "@vibe-trader/shared";
import { randomUUID } from "crypto";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export { pool };

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      token_address TEXT NOT NULL,
      token_symbol TEXT,
      amount_sol DOUBLE PRECISION NOT NULL,
      amount_token DOUBLE PRECISION NOT NULL,
      price_per_token DOUBLE PRECISION NOT NULL,
      reasoning TEXT NOT NULL,
      tx_signature TEXT NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL
    )
  `);

  // Add user tracking columns to purchases (migration)
  await pool.query(`
    ALTER TABLE purchases
    ADD COLUMN IF NOT EXISTS user_id TEXT,
    ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'ip'
  `);

  // Index for user-based leaderboard queries
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_purchases_user_id
    ON purchases(user_id)
  `);

  // Rate limits table for tracking daily interactions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      identifier_type TEXT NOT NULL,
      date DATE NOT NULL,
      interaction_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(identifier, date)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_date
    ON rate_limits(identifier, date)
  `);

  // Token price snapshots for P&L calculation
  await pool.query(`
    CREATE TABLE IF NOT EXISTS token_price_snapshots (
      id TEXT PRIMARY KEY,
      token_address TEXT NOT NULL,
      price_usd DOUBLE PRECISION NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_token_prices_address_timestamp
    ON token_price_snapshots(token_address, timestamp DESC)
  `);

  // Leaderboard cache (refreshed periodically)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leaderboard_cache (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      user_type TEXT NOT NULL,
      total_trades INTEGER NOT NULL DEFAULT 0,
      total_invested_sol DOUBLE PRECISION NOT NULL DEFAULT 0,
      total_current_value_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
      total_pnl_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
      win_count INTEGER NOT NULL DEFAULT 0,
      win_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
      last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_leaderboard_pnl
    ON leaderboard_cache(total_pnl_usd DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_leaderboard_trades
    ON leaderboard_cache(total_trades DESC)
  `);
}

export interface PurchaseInput extends Omit<Purchase, "id"> {
  userId?: string;
  userType?: "user" | "ip";
}

export async function addPurchase(purchase: PurchaseInput): Promise<Purchase> {
  const id = randomUUID();

  await pool.query(
    `INSERT INTO purchases (id, token_address, token_symbol, amount_sol, amount_token, price_per_token, reasoning, tx_signature, timestamp, user_id, user_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
      purchase.tokenAddress,
      purchase.tokenSymbol || "UNKNOWN",
      purchase.amountSol,
      purchase.amountToken,
      purchase.pricePerToken,
      purchase.reasoning,
      purchase.txSignature,
      purchase.timestamp,
      purchase.userId || null,
      purchase.userType || "ip",
    ]
  );

  return { id, ...purchase };
}

export async function getPurchases(): Promise<Purchase[]> {
  const result = await pool.query(`
    SELECT
      id,
      token_address as "tokenAddress",
      token_symbol as "tokenSymbol",
      amount_sol as "amountSol",
      amount_token as "amountToken",
      price_per_token as "pricePerToken",
      reasoning,
      tx_signature as "txSignature",
      timestamp
    FROM purchases
    ORDER BY timestamp DESC
  `);

  return result.rows;
}

export async function getPurchasesByToken(tokenAddress: string): Promise<Purchase[]> {
  const result = await pool.query(
    `SELECT
      id,
      token_address as "tokenAddress",
      token_symbol as "tokenSymbol",
      amount_sol as "amountSol",
      amount_token as "amountToken",
      price_per_token as "pricePerToken",
      reasoning,
      tx_signature as "txSignature",
      timestamp
    FROM purchases
    WHERE token_address = $1
    ORDER BY timestamp DESC`,
    [tokenAddress]
  );

  return result.rows;
}
