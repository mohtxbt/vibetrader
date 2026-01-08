export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  used: number;
  resetsAt: string;
}

export interface TokenPreview {
  address: string;
  name: string;
  symbol: string;
  priceUsd: string;
  liquidity: number;
  marketCap: number | null;
  volume24h: number;
  priceChange24h: number;
  holders?: number;
  age: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  tokenPreview?: TokenPreview;
  decision?: {
    action: "buy" | "pass";
    token?: string;
    amount?: number;
    reasoning: string;
  };
  rateLimit?: RateLimitInfo;
}

export interface Purchase {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  amountSol: number;
  amountToken: number;
  pricePerToken: number;
  reasoning: string;
  txSignature: string;
  timestamp: string;
}

export interface PortfolioResponse {
  balance: number;
  purchases: Purchase[];
}
