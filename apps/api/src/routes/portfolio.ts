import { Router } from "express";
import type { PortfolioResponse } from "@vibe-trader/shared";
import { getBalance } from "../services/wallet.js";
import { getPurchases } from "../db/index.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const balance = await getBalance();
    const purchases = await getPurchases();

    const response: PortfolioResponse = {
      balance,
      purchases,
    };

    res.json(response);
  } catch (error) {
    console.error("Portfolio error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
