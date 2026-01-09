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

// Leaderboard types
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalTrades: number;
  totalInvestedSol: number;
  totalPnlUsd: number;
  winRate: number;
  topToken?: string;
}

export interface TopToken {
  address: string;
  symbol: string;
  tradeCount: number;
  avgPnlPercent: number;
}

export interface GlobalStats {
  totalTrades: number;
  totalUsersTraded: number;
  overallWinRate: number;
  totalVolumeSOL: number;
  topTokens: TopToken[];
}

export interface LeaderboardResponse {
  globalStats: GlobalStats;
  leaderboard: LeaderboardEntry[];
  lastUpdated: string;
}

export interface UserStats {
  totalTrades: number;
  totalInvestedSol: number;
  totalPnlUsd: number;
  winRate: number;
  rank: number | null;
  lastUpdated?: string;
}
