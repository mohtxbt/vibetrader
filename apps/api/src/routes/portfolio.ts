import { Router } from "express";
import type { PortfolioResponse, Purchase } from "@vibe-trader/shared";
import { getBalance } from "../services/wallet.js";
import { getPurchases, updatePurchaseSymbol } from "../db/index.js";
import { getTokenInfo } from "../services/codex.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const balance = await getBalance();
    const purchases = await getPurchases();

    // Enrich purchases that have UNKNOWN symbol by fetching from Codex
    const enrichedPurchases: Purchase[] = await Promise.all(
      purchases.map(async (purchase) => {
        if (purchase.tokenSymbol === "UNKNOWN" || !purchase.tokenSymbol) {
          try {
            const tokenInfo = await getTokenInfo(purchase.tokenAddress);
            if (tokenInfo && tokenInfo.symbol && tokenInfo.symbol !== "???") {
              // Update the database for future requests
              await updatePurchaseSymbol(purchase.id, tokenInfo.symbol);
              return {
                ...purchase,
                tokenSymbol: tokenInfo.symbol,
              };
            }
          } catch (error) {
            console.error(`Failed to fetch token info for ${purchase.tokenAddress}:`, error);
          }
        }
        return purchase;
      })
    );

    const response: PortfolioResponse = {
      balance,
      purchases: enrichedPurchases,
    };

    res.json(response);
  } catch (error) {
    console.error("Portfolio error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
