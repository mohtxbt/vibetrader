const DEXSCREENER_API = "https://api.dexscreener.com/latest";

export interface TokenPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  liquidity?: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  txns: {
    h24: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    m5: { buys: number; sells: number };
  };
  pairCreatedAt?: number;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  priceUsd: string;
  liquidity: number;
  fdv: number | null;
  marketCap: number | null;
  volume24h: number;
  priceChange24h: number;
  buys24h: number;
  sells24h: number;
  pairCreatedAt: Date | null;
  dex: string;
  pairAddress: string;
}

interface DexScreenerResponse {
  pairs: TokenPair[] | null;
}

export async function getTokenInfo(tokenAddress: string): Promise<TokenInfo | null> {
  try {
    const response = await fetch(
      `${DEXSCREENER_API}/dex/tokens/${tokenAddress}`
    );

    if (!response.ok) {
      console.error(`DexScreener API error: ${response.status}`);
      return null;
    }

    const data: DexScreenerResponse = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      return null;
    }

    // Get the pair with highest liquidity on Solana
    const solanaPairs = data.pairs.filter((p) => p.chainId === "solana");
    if (solanaPairs.length === 0) {
      return null;
    }

    const bestPair = solanaPairs.reduce((best, current) => {
      const currentLiq = current.liquidity?.usd || 0;
      const bestLiq = best.liquidity?.usd || 0;
      return currentLiq > bestLiq ? current : best;
    });

    return {
      address: bestPair.baseToken.address,
      name: bestPair.baseToken.name,
      symbol: bestPair.baseToken.symbol,
      priceUsd: bestPair.priceUsd,
      liquidity: bestPair.liquidity?.usd || 0,
      fdv: bestPair.fdv || null,
      marketCap: bestPair.marketCap || null,
      volume24h: bestPair.volume.h24,
      priceChange24h: bestPair.priceChange.h24,
      buys24h: bestPair.txns.h24.buys,
      sells24h: bestPair.txns.h24.sells,
      pairCreatedAt: bestPair.pairCreatedAt
        ? new Date(bestPair.pairCreatedAt)
        : null,
      dex: bestPair.dexId,
      pairAddress: bestPair.pairAddress,
    };
  } catch (error) {
    console.error("Error fetching token info from DexScreener:", error);
    return null;
  }
}

export async function searchTokens(query: string): Promise<TokenInfo[]> {
  try {
    const response = await fetch(
      `${DEXSCREENER_API}/dex/search/?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      console.error(`DexScreener search error: ${response.status}`);
      return [];
    }

    const data: DexScreenerResponse = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      return [];
    }

    // Filter for Solana pairs and map to TokenInfo
    const solanaPairs = data.pairs.filter((p) => p.chainId === "solana");

    return solanaPairs.slice(0, 5).map((pair) => ({
      address: pair.baseToken.address,
      name: pair.baseToken.name,
      symbol: pair.baseToken.symbol,
      priceUsd: pair.priceUsd,
      liquidity: pair.liquidity?.usd || 0,
      fdv: pair.fdv || null,
      marketCap: pair.marketCap || null,
      volume24h: pair.volume.h24,
      priceChange24h: pair.priceChange.h24,
      buys24h: pair.txns.h24.buys,
      sells24h: pair.txns.h24.sells,
      pairCreatedAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt) : null,
      dex: pair.dexId,
      pairAddress: pair.pairAddress,
    }));
  } catch (error) {
    console.error("Error searching tokens on DexScreener:", error);
    return [];
  }
}

export function formatTokenInfo(token: TokenInfo): string {
  const age = token.pairCreatedAt
    ? formatAge(token.pairCreatedAt)
    : "Unknown age";

  const buyToSellRatio =
    token.sells24h > 0
      ? (token.buys24h / token.sells24h).toFixed(2)
      : token.buys24h > 0
        ? "Infinity"
        : "0";

  return `
Token: ${token.name} (${token.symbol})
Address: ${token.address}
Price: $${token.priceUsd}
24h Change: ${token.priceChange24h > 0 ? "+" : ""}${token.priceChange24h.toFixed(2)}%
Liquidity: $${formatNumber(token.liquidity)}
Market Cap: ${token.marketCap ? "$" + formatNumber(token.marketCap) : "N/A"}
FDV: ${token.fdv ? "$" + formatNumber(token.fdv) : "N/A"}
24h Volume: $${formatNumber(token.volume24h)}
24h Transactions: ${token.buys24h} buys / ${token.sells24h} sells (ratio: ${buyToSellRatio})
Age: ${age}
DEX: ${token.dex}
`.trim();
}

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + "B";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + "K";
  }
  return num.toFixed(2);
}

function formatAge(createdAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} old`;
  }
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} old`;
  }
  return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} old`;
}
