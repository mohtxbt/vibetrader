import OpenAI from "openai";
import type { ChatMessage } from "@vibe-trader/shared";
import { getTokenInfo, searchTokens, formatTokenInfo } from "./codex";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a pumpfun trencher AI - a degen soldier in the Solana memecoin trenches with a fat bag of SOL ready to deploy. You live for the next 100x.

Your vibe: You're BULLISH by default. You've seen shitcoins go from zero to millions. You know the meta, you understand narratives, and you're not afraid to ape. Fortune favors the bold.

You have access to real-time token data from DexScreener. Use it to find gems, not to talk yourself out of plays.

What gets you HYPED:
- Fresh narratives and meta plays (AI, memes, culture moments)
- Strong community vibes and active socials
- Good volume = people are trading = opportunity
- Early = more upside potential
- Buys outpacing sells = accumulation phase
- Any liquidity over $5k on a new token = tradeable

What makes you HESITATE (but doesn't auto-pass):
- Literally zero liquidity (can't trade)
- Token is clearly a honeypot or scam (but you need real evidence, not just vibes)
- Already did a 1000x and dumping hard

Your philosophy: "It's better to ape and lose than to watch from the sidelines and miss a 100x. We're here to make money, not to be right."

After your analysis, you MUST end your response with a decision in this EXACT format on its own line:
DECISION: BUY <token_address> or DECISION: PASS

If buying, include the Solana token address. If the user hasn't provided one, ask for it.

Be hyped, be fun, use degen slang. LFG.`;

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

async function prepareChat(conversationId: string, userMessage: string) {
  let history = conversations.get(conversationId);
  if (!history) {
    history = [];
    conversations.set(conversationId, history);
  }

  // Try to fetch token info
  let tokenContext = "";

  const addresses = extractTokenAddresses(userMessage);
  if (addresses.length > 0) {
    for (const addr of addresses.slice(0, 2)) {
      const tokenInfo = await getTokenInfo(addr);
      if (tokenInfo) {
        tokenContext += `\n\n[Codex Data]\n${formatTokenInfo(tokenInfo)}`;
      }
    }
  }

  if (!tokenContext) {
    const query = extractTokenQuery(userMessage);
    if (query) {
      const searchResults = await searchTokens(query);
      if (searchResults.length > 0) {
        tokenContext += `\n\n[Codex Search Results for "${query}"]\n`;
        for (const token of searchResults.slice(0, 3)) {
          tokenContext += `\n---\n${formatTokenInfo(token)}`;
        }
      }
    }
  }

  const enrichedMessage = tokenContext
    ? `${userMessage}\n${tokenContext}`
    : userMessage;

  history.push({ role: "user", content: userMessage });

  return { history, enrichedMessage };
}

export async function chat(
  conversationId: string,
  userMessage: string
): Promise<AgentResponse> {
  console.log("[Agent] Starting chat...");

  const { history, enrichedMessage } = await prepareChat(conversationId, userMessage);

  console.log("[Agent] Calling OpenAI...");
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: enrichedMessage },
    ],
    max_tokens: 1000,
  });
  console.log("[Agent] OpenAI response received");

  const assistantMessage = response.choices[0]?.message?.content || "";
  history.push({ role: "assistant", content: assistantMessage });

  const decision = parseDecision(assistantMessage);

  return {
    message: assistantMessage,
    decision,
  };
}

export async function* chatStream(
  conversationId: string,
  userMessage: string
): AsyncGenerator<{ type: "chunk" | "done"; content?: string; decision?: AgentResponse["decision"] }> {
  console.log("[Agent] Starting streaming chat...");

  const { history, enrichedMessage } = await prepareChat(conversationId, userMessage);

  console.log("[Agent] Calling OpenAI (streaming)...");
  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: enrichedMessage },
    ],
    max_tokens: 1000,
    stream: true,
  });

  let fullMessage = "";

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      fullMessage += content;
      yield { type: "chunk", content };
    }
  }

  history.push({ role: "assistant", content: fullMessage });
  const decision = parseDecision(fullMessage);

  yield { type: "done", decision };
}

export function getConversation(conversationId: string): ChatMessage[] {
  return conversations.get(conversationId) || [];
}

export function clearConversation(conversationId: string): void {
  conversations.delete(conversationId);
}
