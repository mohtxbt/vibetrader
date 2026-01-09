import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
    });

    redis.on("connect", () => {
      console.log("[Redis] Connected");
    });
  }
  return redis;
}

// Cache TTLs in seconds
export const CacheTTL = {
  TOKEN_INFO: 30, // 30 seconds for token info (prices change frequently)
  TOKEN_SEARCH: 300, // 5 minutes for search results
  BALANCE: 15, // 15 seconds for wallet balance
  QUOTE: 10, // 10 seconds for swap quotes
} as const;

// Cache key prefixes
export const CachePrefix = {
  TOKEN_INFO: "codex:token:",
  TOKEN_SEARCH: "codex:search:",
  BALANCE: "sol:balance:",
  QUOTE: "jup:quote:",
} as const;

/**
 * Get a cached value by key
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (err) {
    console.error("[Cache] Error getting key:", key, err);
    return null;
  }
}

/**
 * Set a cached value with TTL
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    const redis = getRedis();
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error("[Cache] Error setting key:", key, err);
  }
}

/**
 * Delete a cached value
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(key);
  } catch (err) {
    console.error("[Cache] Error deleting key:", key, err);
  }
}

/**
 * Delete all cached values matching a pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    const redis = getRedis();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error("[Cache] Error deleting pattern:", pattern, err);
  }
}

/**
 * Wrapper for cached function calls
 * Returns cached value if available, otherwise calls the function and caches the result
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    console.log("[Cache] HIT:", key);
    return cached;
  }

  console.log("[Cache] MISS:", key);
  const result = await fn();

  if (result !== null && result !== undefined) {
    await cacheSet(key, result, ttlSeconds);
  }

  return result;
}

/**
 * Initialize Redis connection
 */
export async function initCache(): Promise<void> {
  try {
    const redis = getRedis();
    await redis.ping();
    console.log("[Redis] Connection verified");
  } catch (err) {
    console.error("[Redis] Failed to connect:", err);
  }
}

/**
 * Close Redis connection
 */
export async function closeCache(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
