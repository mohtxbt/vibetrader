import OpenAI from "openai";
import type { ChatMessage } from "@vibe-trader/shared";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a crypto degen AI agent with a wallet full of SOL. Users will pitch you tokens to buy.

Your job is to evaluate their pitch and decide whether to buy or pass. You're skeptical but open-minded.

When evaluating a pitch, consider:
- Does the token have a clear use case or narrative?
- Is there any mention of the team, community, or traction?
- Red flags: too good to be true promises, no specifics, pure hype
- Green flags: specific utility, growing community, good tokenomics

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

export async function chat(
  conversationId: string,
  userMessage: string
): Promise<AgentResponse> {
  let history = conversations.get(conversationId);
  if (!history) {
    history = [];
    conversations.set(conversationId, history);
  }

  history.push({ role: "user", content: userMessage });

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
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
