import { getTokenInfo } from "./codex.js";
import {
  saveTokenPriceSnapshot,
  refreshLeaderboardCache,
  getActiveTokens,
} from "../db/leaderboard.js";

// SOL token address for price lookup
const SOL_TOKEN_ADDRESS = "So11111111111111111111111111111111111111112";

// Fetch SOL price in USD (using a well-known wrapped SOL pair)
async function getSolPriceUsd(): Promise<number> {
  try {
    const solInfo = await getTokenInfo(SOL_TOKEN_ADDRESS);
    if (solInfo && solInfo.priceUsd) {
      return parseFloat(solInfo.priceUsd);
    }
  } catch (error) {
    console.error("[PriceUpdater] Failed to fetch SOL price:", error);
  }
  // Fallback to a reasonable estimate if API fails
  return 100;
}

// Fetch and cache current prices for all tokens
export async function updateAllTokenPrices(): Promise<Map<string, number>> {
  const tokens = await getActiveTokens();
  const prices = new Map<string, number>();

  console.log(`[PriceUpdater] Updating prices for ${tokens.length} tokens...`);

  for (const tokenAddress of tokens) {
    try {
      const tokenInfo = await getTokenInfo(tokenAddress);
      if (tokenInfo && tokenInfo.priceUsd) {
        const price = parseFloat(tokenInfo.priceUsd);
        prices.set(tokenAddress, price);
        await saveTokenPriceSnapshot(tokenAddress, price);
      }
    } catch (error) {
      console.error(
        `[PriceUpdater] Failed to fetch price for ${tokenAddress}:`,
        error
      );
    }

    // Rate limit: 200ms between requests to avoid hitting API limits
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`[PriceUpdater] Updated ${prices.size} token prices`);
  return prices;
}

// Run full leaderboard refresh
export async function runLeaderboardRefresh(): Promise<void> {
  console.log("[PriceUpdater] Starting leaderboard refresh...");

  try {
    const [prices, solPriceUsd] = await Promise.all([
      updateAllTokenPrices(),
      getSolPriceUsd(),
    ]);

    console.log(`[PriceUpdater] SOL price: $${solPriceUsd}`);

    await refreshLeaderboardCache(prices, solPriceUsd);
    console.log("[PriceUpdater] Leaderboard refresh complete");
  } catch (error) {
    console.error("[PriceUpdater] Leaderboard refresh failed:", error);
  }
}

// Start periodic updates
export function startPriceUpdater(): void {
  const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  console.log("[PriceUpdater] Starting (5 minute interval)");

  // Initial run after 10 seconds (give time for DB init)
  setTimeout(() => {
    runLeaderboardRefresh().catch(console.error);
  }, 10000);

  // Then every 5 minutes
  setInterval(() => {
    runLeaderboardRefresh().catch(console.error);
  }, INTERVAL_MS);
}
