import { Router } from "express";
import { randomUUID } from "crypto";
import type { ChatRequest, ChatResponse } from "@vibe-trader/shared";
import { chat } from "../services/agent.js";
import { executeSwap } from "../services/swap.js";
import { addPurchase } from "../db/index.js";

const router = Router();

const BUY_AMOUNT_SOL = parseFloat(process.env.BUY_AMOUNT_SOL || "0.1");

router.post("/", async (req, res) => {
  try {
    const { message, conversationId }: ChatRequest = req.body;
    const convId = conversationId || randomUUID();

    const agentResponse = await chat(convId, message);

    const response: ChatResponse = {
      message: agentResponse.message,
      conversationId: convId,
    };

    // If agent decided to buy, execute the swap
    if (agentResponse.decision?.action === "buy" && agentResponse.decision.tokenAddress) {
      try {
        const swapResult = await executeSwap(
          agentResponse.decision.tokenAddress,
          BUY_AMOUNT_SOL
        );

        // Record the purchase
        const purchase = addPurchase({
          tokenAddress: swapResult.tokenAddress,
          tokenSymbol: "UNKNOWN", // Could fetch from token metadata
          amountSol: swapResult.inputAmount,
          amountToken: swapResult.outputAmount,
          pricePerToken: swapResult.inputAmount / swapResult.outputAmount,
          reasoning: agentResponse.decision.reasoning,
          txSignature: swapResult.signature,
          timestamp: new Date().toISOString(),
        });

        response.decision = {
          action: "buy",
          token: swapResult.tokenAddress,
          amount: swapResult.outputAmount,
          reasoning: agentResponse.decision.reasoning,
        };
      } catch (swapError) {
        console.error("Swap failed:", swapError);
        response.message += "\n\n(Note: I wanted to buy but the swap failed. Make sure the wallet has SOL!)";
      }
    } else if (agentResponse.decision?.action === "pass") {
      response.decision = {
        action: "pass",
        reasoning: agentResponse.decision.reasoning,
      };
    }

    res.json(response);
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
