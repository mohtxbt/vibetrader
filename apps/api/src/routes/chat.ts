import { Router } from "express";
import { randomUUID } from "crypto";
import type { ChatRequest, ChatResponse, TokenPreview } from "@vibe-trader/shared";
import { chat, chatStream } from "../services/agent.js";
import { executeSwap } from "../services/swap.js";
import { addPurchase } from "../db/index.js";
import { checkRateLimit } from "../middleware/rateLimit.js";
import { getTokenInfo } from "../services/codex.js";
import { eventBus } from "../services/eventBus.js";

const router = Router();

const BUY_AMOUNT_SOL = parseFloat(process.env.BUY_AMOUNT_SOL || "0.1");

// Extract Solana token addresses (base58, 32-44 chars)
function extractTokenAddress(text: string): string | null {
  const base58Regex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
  const matches = text.match(base58Regex) || [];
  const filtered = matches.filter(
    (addr) => addr.length >= 32 && addr.length <= 44 && !addr.match(/^[a-z]+$/i)
  );
  return filtered[0] || null;
}

function formatAge(createdAt: Date | null): string {
  if (!createdAt) return "Unknown";
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) return `${diffDays}d`;
  if (diffHours > 0) return `${diffHours}h`;
  return `${diffMinutes}m`;
}

// Apply rate limiting to chat endpoint
router.post("/", checkRateLimit, async (req, res) => {
  try {
    const { message, conversationId }: ChatRequest = req.body;
    const convId = conversationId || randomUUID();

    // Check for token address and fetch preview
    let tokenPreview: TokenPreview | undefined;
    const tokenAddress = extractTokenAddress(message);
    if (tokenAddress) {
      const tokenInfo = await getTokenInfo(tokenAddress);
      if (tokenInfo) {
        tokenPreview = {
          address: tokenInfo.address,
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          priceUsd: tokenInfo.priceUsd,
          liquidity: tokenInfo.liquidity,
          marketCap: tokenInfo.marketCap,
          volume24h: tokenInfo.volume24h,
          priceChange24h: tokenInfo.priceChange24h,
          holders: tokenInfo.holders,
          age: formatAge(tokenInfo.pairCreatedAt),
        };
      }
    }

    const agentResponse = await chat(convId, message);

    const response: ChatResponse = {
      message: agentResponse.message,
      conversationId: convId,
      tokenPreview,
      rateLimit: res.locals.rateLimit,
    };

    // If agent decided to buy, execute the swap
    if (agentResponse.decision?.action === "buy" && agentResponse.decision.tokenAddress) {
      try {
        const swapResult = await executeSwap(
          agentResponse.decision.tokenAddress,
          BUY_AMOUNT_SOL
        );

        // Record the purchase with user info
        await addPurchase({
          tokenAddress: swapResult.tokenAddress,
          tokenSymbol: "UNKNOWN", // Could fetch from token metadata
          amountSol: swapResult.inputAmount,
          amountToken: swapResult.outputAmount,
          pricePerToken: swapResult.inputAmount / swapResult.outputAmount,
          reasoning: agentResponse.decision.reasoning,
          txSignature: swapResult.signature,
          timestamp: new Date().toISOString(),
          userId: req.userIdentifier,
          userType: req.identifierType === "user" ? "user" : "ip",
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

// Streaming endpoint using Server-Sent Events
router.post("/stream", checkRateLimit, async (req, res) => {
  const { message, conversationId }: ChatRequest = req.body;
  const convId = conversationId || randomUUID();

  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    // Check for token address and fetch preview
    let tokenPreview: TokenPreview | undefined;
    const tokenAddress = extractTokenAddress(message);
    if (tokenAddress) {
      const tokenInfo = await getTokenInfo(tokenAddress);
      if (tokenInfo) {
        tokenPreview = {
          address: tokenInfo.address,
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          priceUsd: tokenInfo.priceUsd,
          liquidity: tokenInfo.liquidity,
          marketCap: tokenInfo.marketCap,
          volume24h: tokenInfo.volume24h,
          priceChange24h: tokenInfo.priceChange24h,
          holders: tokenInfo.holders,
          age: formatAge(tokenInfo.pairCreatedAt),
        };
        res.write(`data: ${JSON.stringify({ type: "token", tokenPreview, conversationId: convId })}\n\n`);

        // Emit pitched event for WebSocket clients
        eventBus.emitTokenEvent({
          type: "pitched",
          timestamp: Date.now(),
          tokenAddress: tokenInfo.address,
          symbol: tokenInfo.symbol,
          name: tokenInfo.name,
          priceUsd: tokenInfo.priceUsd,
          marketCap: tokenInfo.marketCap,
          liquidity: tokenInfo.liquidity,
        });
      }
    }

    // Stream the LLM response
    let fullMessage = "";
    let decision: { action: "buy" | "pass"; tokenAddress?: string; reasoning: string } | undefined;

    for await (const event of chatStream(convId, message)) {
      if (event.type === "chunk" && event.content) {
        fullMessage += event.content;
        res.write(`data: ${JSON.stringify({ type: "chunk", content: event.content })}\n\n`);
      } else if (event.type === "done") {
        decision = event.decision;
      }
    }

    // Handle buy decision
    if (decision?.action === "buy" && decision.tokenAddress) {
      try {
        const swapResult = await executeSwap(decision.tokenAddress, BUY_AMOUNT_SOL);

        await addPurchase({
          tokenAddress: swapResult.tokenAddress,
          tokenSymbol: tokenPreview?.symbol || "UNKNOWN",
          amountSol: swapResult.inputAmount,
          amountToken: swapResult.outputAmount,
          pricePerToken: swapResult.inputAmount / swapResult.outputAmount,
          reasoning: decision.reasoning,
          txSignature: swapResult.signature,
          timestamp: new Date().toISOString(),
          userId: req.userIdentifier,
          userType: req.identifierType === "user" ? "user" : "ip",
        });

        // Emit bought event for WebSocket clients
        eventBus.emitTokenEvent({
          type: "bought",
          timestamp: Date.now(),
          tokenAddress: swapResult.tokenAddress,
          symbol: tokenPreview?.symbol || "UNKNOWN",
          name: tokenPreview?.name || "Unknown Token",
          priceUsd: tokenPreview?.priceUsd || "0",
          marketCap: tokenPreview?.marketCap || null,
          liquidity: tokenPreview?.liquidity || 0,
          amountSol: swapResult.inputAmount,
          amountToken: swapResult.outputAmount,
          txSignature: swapResult.signature,
        });

        res.write(`data: ${JSON.stringify({
          type: "decision",
          decision: {
            action: "buy",
            token: swapResult.tokenAddress,
            amount: swapResult.outputAmount,
            reasoning: decision.reasoning,
          },
        })}\n\n`);
      } catch (swapError) {
        console.error("Swap failed:", swapError);
        res.write(`data: ${JSON.stringify({ type: "chunk", content: "\n\n(Note: I wanted to buy but the swap failed. Make sure the wallet has SOL!)" })}\n\n`);
      }
    } else if (decision?.action === "pass") {
      // Emit rejected event for WebSocket clients
      if (tokenAddress && tokenPreview) {
        eventBus.emitTokenEvent({
          type: "rejected",
          timestamp: Date.now(),
          tokenAddress: tokenAddress,
          symbol: tokenPreview.symbol,
          name: tokenPreview.name,
          priceUsd: tokenPreview.priceUsd,
          marketCap: tokenPreview.marketCap,
          liquidity: tokenPreview.liquidity,
          reason: decision.reasoning.slice(0, 200),
        });
      }

      res.write(`data: ${JSON.stringify({
        type: "decision",
        decision: { action: "pass", reasoning: decision.reasoning },
      })}\n\n`);
    }

    // Send done event with rate limit info
    res.write(`data: ${JSON.stringify({
      type: "done",
      conversationId: convId,
      rateLimit: res.locals.rateLimit,
    })}\n\n`);

    res.end();
  } catch (error) {
    console.error("Stream error:", error);
    res.write(`data: ${JSON.stringify({ type: "error", error: "Stream failed" })}\n\n`);
    res.end();
  }
});

export default router;
