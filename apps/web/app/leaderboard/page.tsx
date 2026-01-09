"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  totalTrades: number;
  totalInvestedSol: number;
  totalPnlUsd: number;
  winRate: number;
}

interface TopToken {
  symbol: string;
  tradeCount: number;
}

interface GlobalStats {
  totalTrades: number;
  totalUsersTraded: number;
  overallWinRate: number;
  totalVolumeSOL: number;
  topTokens: TopToken[];
}

interface LeaderboardData {
  globalStats: GlobalStats;
  leaderboard: LeaderboardEntry[];
  lastUpdated: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"pnl" | "trades" | "winRate">("pnl");

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/leaderboard?sort=${sortBy}`);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const formatPnL = (pnl: number) => {
    const sign = pnl >= 0 ? "+" : "";
    return `${sign}$${pnl.toFixed(2)}`;
  };

  return (
    <main className="min-h-screen p-4 relative">
      <div className="max-w-5xl mx-auto relative z-10 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-pixel text-xl md:text-2xl text-white glow-white">
            Leaderboard
          </h1>
          <Link
            href="/"
            className="text-cyber-light hover:text-white transition-colors text-sm"
          >
            [back]
          </Link>
        </div>

        {loading && (
          <div className="text-cyber-light animate-pulse">
            $ loading leaderboard...
          </div>
        )}

        {error && (
          <div className="border border-white p-4 mb-6">
            <p className="text-white">ERROR: {error}</p>
          </div>
        )}

        {data && (
          <>
            {/* Global Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="border border-cyber-muted p-4 bg-black/50">
                <p className="text-cyber-muted text-xs mb-1">// total_trades</p>
                <p className="text-2xl font-bold text-white glow-white">
                  {data.globalStats.totalTrades.toLocaleString()}
                </p>
              </div>
              <div className="border border-cyber-muted p-4 bg-black/50">
                <p className="text-cyber-muted text-xs mb-1">// traders</p>
                <p className="text-2xl font-bold text-white glow-white">
                  {data.globalStats.totalUsersTraded.toLocaleString()}
                </p>
              </div>
              <div className="border border-cyber-muted p-4 bg-black/50">
                <p className="text-cyber-muted text-xs mb-1">// win_rate</p>
                <p className="text-2xl font-bold text-cyber-green glow-green">
                  {data.globalStats.overallWinRate.toFixed(1)}%
                </p>
              </div>
              <div className="border border-cyber-muted p-4 bg-black/50">
                <p className="text-cyber-muted text-xs mb-1">// volume_sol</p>
                <p className="text-2xl font-bold text-white glow-white">
                  {data.globalStats.totalVolumeSOL.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Top Tokens */}
            {data.globalStats.topTokens.length > 0 && (
              <div className="mb-8">
                <h2 className="font-pixel text-xs text-cyber-light mb-4">
                  {">"} TOP_TOKENS
                </h2>
                <div className="flex gap-2 flex-wrap">
                  {data.globalStats.topTokens.map((token, i) => (
                    <span
                      key={i}
                      className="border border-cyber-muted px-3 py-1 text-xs text-cyber-light bg-black/50"
                    >
                      {token.symbol} ({token.tradeCount})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sort Buttons */}
            <div className="flex gap-2 mb-6">
              {(["pnl", "trades", "winRate"] as const).map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  className={`px-4 py-2 text-xs border transition-colors ${
                    sortBy === sort
                      ? "border-white text-white bg-white/10"
                      : "border-cyber-muted text-cyber-light hover:border-white"
                  }`}
                >
                  {sort === "pnl" && "P&L"}
                  {sort === "trades" && "Trades"}
                  {sort === "winRate" && "Win Rate"}
                </button>
              ))}
            </div>

            {/* Leaderboard Table */}
            <div className="border border-cyber-muted bg-black/50">
              {/* Header */}
              <div className="grid grid-cols-6 gap-2 md:gap-4 p-4 border-b border-cyber-muted text-cyber-muted text-xs">
                <span>#</span>
                <span>TRADER</span>
                <span className="text-right">TRADES</span>
                <span className="text-right hidden md:block">INVESTED</span>
                <span className="text-right">P&L</span>
                <span className="text-right">WIN%</span>
              </div>

              {/* Rows */}
              {data.leaderboard.map((entry) => (
                <div
                  key={entry.displayName}
                  className="grid grid-cols-6 gap-2 md:gap-4 p-4 border-b border-cyber-muted/50 hover:bg-white/5 transition-colors text-sm"
                >
                  <span className="text-white font-bold">
                    {entry.rank}
                  </span>
                  <span className="text-cyber-light truncate">
                    {entry.displayName}
                  </span>
                  <span className="text-right text-white">
                    {entry.totalTrades}
                  </span>
                  <span className="text-right text-white hidden md:block">
                    {entry.totalInvestedSol.toFixed(2)}
                  </span>
                  <span
                    className={`text-right font-bold ${
                      entry.totalPnlUsd >= 0
                        ? "text-cyber-green glow-green"
                        : "text-red-500"
                    }`}
                  >
                    {formatPnL(entry.totalPnlUsd)}
                  </span>
                  <span className="text-right text-cyber-light">
                    {entry.winRate.toFixed(1)}%
                  </span>
                </div>
              ))}

              {data.leaderboard.length === 0 && (
                <div className="text-center py-12 text-cyber-muted">
                  <div className="text-2xl mb-4">[ empty ]</div>
                  <p>no trades recorded yet</p>
                </div>
              )}
            </div>

            {/* Last Updated */}
            <p className="text-cyber-muted text-xs mt-4 text-right">
              last updated: {new Date(data.lastUpdated).toLocaleString()}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
