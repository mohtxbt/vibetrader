import pg from "pg";
import { randomUUID } from "crypto";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface RateLimitInfo {
  count: number;
  limit: number;
  remaining: number;
  isLimited: boolean;
}

const LIMITS = {
  user: Number(process.env.USER_DAILY_LIMIT) || 20,
  anonymous: Number(process.env.ANON_DAILY_LIMIT) || 2,
};

export async function getRateLimitInfo(
  identifier: string,
  identifierType: "user" | "ip" | "session"
): Promise<RateLimitInfo> {
  const limit = identifierType === "user" ? LIMITS.user : LIMITS.anonymous;
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const result = await pool.query(
    `SELECT interaction_count FROM rate_limits
     WHERE identifier = $1 AND date = $2`,
    [identifier, today]
  );

  const count = result.rows[0]?.interaction_count || 0;

  return {
    count,
    limit,
    remaining: Math.max(0, limit - count),
    isLimited: count >= limit,
  };
}

export async function incrementRateLimit(
  identifier: string,
  identifierType: "user" | "ip" | "session"
): Promise<RateLimitInfo> {
  const limit = identifierType === "user" ? LIMITS.user : LIMITS.anonymous;
  const today = new Date().toISOString().split("T")[0];

  // Upsert: insert or increment
  const result = await pool.query(
    `INSERT INTO rate_limits (id, identifier, identifier_type, date, interaction_count)
     VALUES ($1, $2, $3, $4, 1)
     ON CONFLICT (identifier, date)
     DO UPDATE SET
       interaction_count = rate_limits.interaction_count + 1,
       updated_at = NOW()
     RETURNING interaction_count`,
    [randomUUID(), identifier, identifierType, today]
  );

  const count = result.rows[0].interaction_count;

  return {
    count,
    limit,
    remaining: Math.max(0, limit - count),
    isLimited: count > limit, // > not >= because we just incremented
  };
}

export async function resetRateLimit(identifier: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  await pool.query(
    `DELETE FROM rate_limits WHERE identifier = $1 AND date = $2`,
    [identifier, today]
  );
}
