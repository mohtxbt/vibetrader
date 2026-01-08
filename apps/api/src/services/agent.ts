import OpenAI from "openai";
import type { ChatMessage } from "@vibe-trader/shared";
import { getTokenInfo, searchTokens, formatTokenInfo } from "./dexscreener";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a crypto degen AI agent with a wallet full of SOL. Users will pitch you tokens to buy.

Your job is to evaluate their pitch and decide whether to buy or pass. You're skeptical but open-minded.

You have access to real-time token data from DexScreener. When token info is provided, use it to make informed decisions.

When evaluating a pitch, consider:
- Does the token have a clear use case or narrative?
- Is there any mention of the team, community, or traction?
- Red flags: too good to be true promises, no specifics, pure hype, very low liquidity (<$10k), extreme sell pressure
- Green flags: specific utility, growing community, good tokenomics, healthy liquidity, positive buy/sell ratio

When you have DexScreener data, also evaluate:
- Liquidity: Is there enough liquidity to trade safely? (<$10k is risky, >$100k is solid)
- Volume: Is there trading activity? Low volume = hard to exit
- Price action: What's the 24h trend? Massive pumps might mean incoming dump
- Buy/Sell ratio: More buys than sells is bullish
- Age: Very new tokens (<1 day) are higher risk

After your analysis, you MUST end your response with a decision in this EXACT format on its own line:
DECISION: BUY <token_address> or DECISION: PASS

If buying, include the Solana token address (like "So11111111111111111111111111111111111111112").
If the user hasn't provided a token address, ask for it before making a BUY decision.

Be conversational and fun. You can ask follow-up questions. Show your reasoning.`;

const conversations = new Map<string, ChatMessage[]>();

export interface AgentResponse {
  message: string;
  decision?: {
    action: "buy" | "pass";
    tokenAddress?: string;
    reasoning: string;
  };
}

function parseDecision(content: string): AgentResponse["decision"] | undefined {
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim().toUpperCase();
    if (trimmed.startsWith("DECISION:")) {
      const decisionPart = trimmed.replace("DECISION:", "").trim();
      if (decisionPart.startsWith("BUY")) {
        const tokenAddress = decisionPart.replace("BUY", "").trim();
        return {
          action: "buy",
          tokenAddress: tokenAddress || undefined,
          reasoning: content,
        };
      } else if (decisionPart === "PASS") {
        return {
          action: "pass",
          reasoning: content,
        };
      }
    }
  }
  return undefined;
}

// Extract Solana token addresses from text (base58, typically 32-44 chars)
function extractTokenAddresses(text: string): string[] {
  const base58Regex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
  const matches = text.match(base58Regex) || [];
  // Filter out common false positives
  return matches.filter(
    (addr) =>
      addr.length >= 32 &&
      addr.length <= 44 &&
      !addr.match(/^[a-z]+$/i) // Exclude pure alphabetic strings
  );
}

// Extract potential token names/symbols for search
function extractTokenQuery(text: string): string | null {
  // Look for $SYMBOL pattern
  const symbolMatch = text.match(/\$([A-Za-z]{2,10})/);
  if (symbolMatch) {
    return symbolMatch[1];
  }
  return null;
}

export async function chat(
  conversationId: string,
  userMessage: string
): Promise<AgentResponse> {
  let history = conversations.get(conversationId);
  if (!history) {
    history = [];
    conversations.set(conversationId, history);
  }

  // Try to fetch token info from DexScreener
  let tokenContext = "";

  // First, check for token addresses in the message
  const addresses = extractTokenAddresses(userMessage);
  if (addresses.length > 0) {
    for (const addr of addresses.slice(0, 2)) {
      // Limit to 2 lookups
      const tokenInfo = await getTokenInfo(addr);
      if (tokenInfo) {
        tokenContext += `\n\n[DexScreener Data]\n${formatTokenInfo(tokenInfo)}`;
      }
    }
  }

  // If no address found, try searching by symbol
  if (!tokenContext) {
    const query = extractTokenQuery(userMessage);
    if (query) {
      const searchResults = await searchTokens(query);
      if (searchResults.length > 0) {
        tokenContext += `\n\n[DexScreener Search Results for "${query}"]\n`;
        for (const token of searchResults.slice(0, 3)) {
          tokenContext += `\n---\n${formatTokenInfo(token)}`;
        }
      }
    }
  }

  // Append token context to user message if we found data
  const enrichedMessage = tokenContext
    ? `${userMessage}\n${tokenContext}`
    : userMessage;

  history.push({ role: "user", content: userMessage }); // Store original message in history

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: enrichedMessage }, // Use enriched message for current turn
    ],
    temperature: 0.8,
    max_tokens: 1000,
  });

  const assistantMessage = response.choices[0]?.message?.content || "";
  history.push({ role: "assistant", content: assistantMessage });

  const decision = parseDecision(assistantMessage);

  return {
    message: assistantMessage,
    decision,
  };
}

export function getConversation(conversationId: string): ChatMessage[] {
  return conversations.get(conversationId) || [];
}

export function clearConversation(conversationId: string): void {
  conversations.delete(conversationId);
}
