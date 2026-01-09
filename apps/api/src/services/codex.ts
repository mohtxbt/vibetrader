import { Codex } from "@codex-data/sdk";
import { withCache, CacheTTL, CachePrefix } from "./cache.js";

const SOLANA_NETWORK_ID = 1399811149;

const codex = new Codex(process.env.CODEX_API_KEY!);

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  priceUsd: string;
  liquidity: number;
  fdv: number | null;
  marketCap: number | null;
  circulatingMarketCap: number | null;
  pairCreatedAt: Date | null;
  lastTransaction: Date | null;
  dex: string;
  pairAddress: string;
  holders?: number;

  // Price changes at different timeframes
  priceChange5m: number;
  priceChange1h: number;
  priceChange4h: number;
  priceChange12h: number;
  priceChange24h: number;

  // High/Low prices
  high24h: number | null;
  low24h: number | null;

  // Volume at different timeframes
  volume5m: number;
  volume1h: number;
  volume4h: number;
  volume12h: number;
  volume24h: number;

  // Buy metrics
  buys5m: number;
  buys1h: number;
  buys4h: number;
  buys12h: number;
  buys24h: number;
  buyVolume24h: number;

  // Sell metrics
  sells5m: number;
  sells1h: number;
  sells4h: number;
  sells12h: number;
  sells24h: number;
  sellVolume24h: number;

  // Unique traders (more meaningful than raw counts)
  uniqueBuyers24h: number;
  uniqueSellers24h: number;

  // Risk/Scam detection
  isScam: boolean;
  sniperCount: number;
  sniperHeldPercent: number;
  bundlerCount: number;
  bundlerHeldPercent: number;
  insiderCount: number;
  insiderHeldPercent: number;
  devHeldPercent: number;
  newWalletPercent1d: number;
  newWalletPercent7d: number;
}

// Helper to parse string numbers from Codex response
function parseNum(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  return typeof val === "string" ? Number(val) : val;
}

function parseNumOrNull(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  return typeof val === "string" ? Number(val) : val;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTokenResult(t: any, fallbackAddress?: string): TokenInfo {
  return {
    address: t.token?.address || fallbackAddress || "",
    name: t.token?.name || "Unknown",
    symbol: t.token?.symbol || "???",
    priceUsd: t.priceUSD?.toString() || "0",
    liquidity: parseNum(t.liquidity),
    fdv: null,
    marketCap: parseNumOrNull(t.marketCap),
    circulatingMarketCap: parseNumOrNull(t.circulatingMarketCap),
    pairCreatedAt: t.createdAt ? new Date(t.createdAt * 1000) : null,
    lastTransaction: t.lastTransaction ? new Date(t.lastTransaction * 1000) : null,
    dex: t.exchanges?.[0]?.name || "unknown",
    pairAddress: t.pair?.address || "",
    holders: t.holders ?? undefined,

    // Price changes (decimal format from API, convert to percentage)
    priceChange5m: parseNum(t.change5m) * 100,
    priceChange1h: parseNum(t.change1) * 100,
    priceChange4h: parseNum(t.change4) * 100,
    priceChange12h: parseNum(t.change12) * 100,
    priceChange24h: parseNum(t.change24) * 100,

    // High/Low
    high24h: parseNumOrNull(t.high24),
    low24h: parseNumOrNull(t.low24),

    // Volume at different timeframes
    volume5m: parseNum(t.volume5m),
    volume1h: parseNum(t.volume1),
    volume4h: parseNum(t.volume4),
    volume12h: parseNum(t.volume12),
    volume24h: parseNum(t.volume24),

    // Buy metrics
    buys5m: t.buyCount5m ?? 0,
    buys1h: t.buyCount1 ?? 0,
    buys4h: t.buyCount4 ?? 0,
    buys12h: t.buyCount12 ?? 0,
    buys24h: t.buyCount24 ?? 0,
    buyVolume24h: parseNum(t.buyVolume24),

    // Sell metrics
    sells5m: t.sellCount5m ?? 0,
    sells1h: t.sellCount1 ?? 0,
    sells4h: t.sellCount4 ?? 0,
    sells12h: t.sellCount12 ?? 0,
    sells24h: t.sellCount24 ?? 0,
    sellVolume24h: parseNum(t.sellVolume24),

    // Unique traders
    uniqueBuyers24h: t.uniqueBuys24 ?? 0,
    uniqueSellers24h: t.uniqueSells24 ?? 0,

    // Risk/Scam detection
    isScam: t.isScam ?? false,
    sniperCount: t.sniperCount ?? 0,
    sniperHeldPercent: t.sniperHeldPercentage ?? 0,
    bundlerCount: t.bundlerCount ?? 0,
    bundlerHeldPercent: t.bundlerHeldPercentage ?? 0,
    insiderCount: t.insiderCount ?? 0,
    insiderHeldPercent: t.insiderHeldPercentage ?? 0,
    devHeldPercent: t.devHeldPercentage ?? 0,
    newWalletPercent1d: parseNum(t.swapPct1dOldWallet),
    newWalletPercent7d: parseNum(t.swapPct7dOldWallet),
  };
}

export async function getTokenInfo(tokenAddress: string): Promise<TokenInfo | null> {
  const cacheKey = `${CachePrefix.TOKEN_INFO}${tokenAddress}`;

  return withCache(cacheKey, CacheTTL.TOKEN_INFO, async () => {
    try {
      console.log("[Codex] Fetching token info for:", tokenAddress);

      const result = await codex.queries.filterTokens({
        filters: {
          network: [SOLANA_NETWORK_ID],
        },
        phrase: tokenAddress,
        limit: 1,
      });

      const tokens = result.filterTokens?.results || [];
      if (tokens.length === 0) {
        console.log("[Codex] No token data found");
        return null;
      }

      const t = tokens[0];
      if (!t) return null;

      return mapTokenResult(t, tokenAddress);
    } catch (error) {
      console.error("[Codex] Error fetching token info:", error);
      return null;
    }
  });
}

export async function searchTokens(query: string): Promise<TokenInfo[]> {
  const cacheKey = `${CachePrefix.TOKEN_SEARCH}${query.toLowerCase()}`;

  return withCache(cacheKey, CacheTTL.TOKEN_SEARCH, async () => {
    try {
      console.log("[Codex] Searching tokens for:", query);

      const result = await codex.queries.filterTokens({
        filters: {
          network: [SOLANA_NETWORK_ID],
        },
        phrase: query,
        limit: 5,
      });

      const tokens = result.filterTokens?.results || [];

      return tokens.filter((t) => t !== null).map((t) => mapTokenResult(t));
    } catch (error) {
      console.error("[Codex] Error searching tokens:", error);
      return [];
    }
  });
}

function formatChange(val: number): string {
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}%`;
}

export function formatTokenInfo(token: TokenInfo): string {
  const age = token.pairCreatedAt ? formatAge(token.pairCreatedAt) : "Unknown age";
  const lastActive = token.lastTransaction ? formatAge(token.lastTransaction) : null;

  const lines = [
    `=== ${token.name} (${token.symbol}) ===`,
    `Address: ${token.address}`,
    `Price: $${formatPrice(token.priceUsd)}`,
    token.isScam ? "⚠️ FLAGGED AS SCAM ⚠️" : null,
    "",
    "-- Price Changes --",
    `5m: ${formatChange(token.priceChange5m)} | 1h: ${formatChange(token.priceChange1h)} | 4h: ${formatChange(token.priceChange4h)} | 12h: ${formatChange(token.priceChange12h)} | 24h: ${formatChange(token.priceChange24h)}`,
    token.high24h && token.low24h ? `24h Range: $${formatPrice(token.low24h.toString())} - $${formatPrice(token.high24h.toString())}` : null,
    "",
    "-- Market Stats --",
    `Liquidity: $${formatNumber(token.liquidity)}`,
    `Market Cap: ${token.marketCap ? "$" + formatNumber(token.marketCap) : "N/A"}`,
    token.circulatingMarketCap ? `Circulating MCap: $${formatNumber(token.circulatingMarketCap)}` : null,
    token.holders ? `Holders: ${token.holders.toLocaleString()}` : null,
    "",
    "-- Volume --",
    `5m: $${formatNumber(token.volume5m)} | 1h: $${formatNumber(token.volume1h)} | 4h: $${formatNumber(token.volume4h)} | 24h: $${formatNumber(token.volume24h)}`,
    "",
    "-- Trading Activity (24h) --",
    `Buys: ${token.buys24h} (${token.uniqueBuyers24h} unique) | Volume: $${formatNumber(token.buyVolume24h)}`,
    `Sells: ${token.sells24h} (${token.uniqueSellers24h} unique) | Volume: $${formatNumber(token.sellVolume24h)}`,
    `Buy/Sell Ratio: ${token.sells24h > 0 ? (token.buys24h / token.sells24h).toFixed(2) : "∞"}`,
    "",
    "-- Recent Activity --",
    `5m: ${token.buys5m} buys / ${token.sells5m} sells | 1h: ${token.buys1h} buys / ${token.sells1h} sells`,
    "",
    "-- Risk Indicators --",
    `Snipers: ${token.sniperCount} (holding ${token.sniperHeldPercent.toFixed(1)}%)`,
    `Bundlers: ${token.bundlerCount} (holding ${token.bundlerHeldPercent.toFixed(1)}%)`,
    `Insiders: ${token.insiderCount} (holding ${token.insiderHeldPercent.toFixed(1)}%)`,
    token.devHeldPercent > 0 ? `Dev Holdings: ${token.devHeldPercent.toFixed(1)}%` : null,
    token.newWalletPercent1d > 0 ? `New Wallets (<1d): ${token.newWalletPercent1d.toFixed(1)}%` : null,
    token.newWalletPercent7d > 0 ? `New Wallets (<7d): ${token.newWalletPercent7d.toFixed(1)}%` : null,
    "",
    "-- Token Info --",
    `Age: ${age}`,
    lastActive ? `Last Activity: ${lastActive}` : null,
    `DEX: ${token.dex}`,
    token.pairAddress ? `Pair: ${token.pairAddress}` : null,
  ];

  return lines.filter((line) => line !== null).join("\n");
}

function formatPrice(priceStr: string): string {
  const num = parseFloat(priceStr);
  if (isNaN(num) || num === 0) return "0";

  // For prices >= $1, show 2 decimal places
  if (num >= 1) {
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // For prices >= $0.01, show 4 decimal places
  if (num >= 0.01) {
    return num.toFixed(4);
  }

  // For very small prices, use subscript notation: 0.0{5}4187 means 5 zeros then 4187
  const str = num.toFixed(20);
  const match = str.match(/^0\.(0*)([1-9]\d*)/);
  if (match) {
    const zeros = match[1].length;
    const significantDigits = match[2].slice(0, 4); // Show 4 significant digits
    if (zeros >= 3) {
      return `0.0{${zeros}}${significantDigits}`;
    }
    // For 1-2 zeros, just show the number
    return num.toFixed(zeros + 4);
  }

  return num.toPrecision(4);
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
