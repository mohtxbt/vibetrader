export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  decision?: {
    action: "buy" | "pass";
    token?: string;
    amount?: number;
    reasoning: string;
  };
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
