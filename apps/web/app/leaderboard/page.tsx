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
    <main className="min-h-screen p-4 relative chaos-bg">
      <div className="max-w-5xl mx-auto relative z-10 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-pixel text-xl md:text-2xl text-neon-yellow glow-yellow">
            🏆 Leaderboard
          </h1>
          <Link
            href="/"
            className="text-neon-pink hover:text-neon-cyan transition-colors text-sm hover:glow-cyan"
          >
            [back]
          </Link>
        </div>

        {loading && (
          <div className="text-neon-cyan animate-pulse glow-cyan">
            $ loading degens... 🔄
          </div>
        )}

        {error && (
          <div className="border-2 border-neon-red p-4 mb-6 bg-neon-red/10">
            <p className="text-neon-red">❌ ERROR: {error}</p>
          </div>
        )}

        {data && (
          <>
            {/* Global Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="border-2 border-neon-pink/50 p-4 bg-meme-dark/80 box-glow-pink">
                <p className="text-neon-pink text-xs mb-1">// total_apes</p>
                <p className="text-2xl font-bold text-white glow-pink">
                  {data.globalStats.totalTrades.toLocaleString()}
                </p>
              </div>
              <div className="border-2 border-neon-cyan/50 p-4 bg-meme-dark/80 box-glow-cyan">
                <p className="text-neon-cyan text-xs mb-1">// degens</p>
                <p className="text-2xl font-bold text-white glow-cyan">
                  {data.globalStats.totalUsersTraded.toLocaleString()}
                </p>
              </div>
              <div className="border-2 border-neon-green/50 p-4 bg-meme-dark/80 box-glow-green">
                <p className="text-neon-green text-xs mb-1">// win_rate</p>
                <p className="text-2xl font-bold text-neon-green glow-green">
                  {data.globalStats.overallWinRate.toFixed(1)}%
                </p>
              </div>
              <div className="border-2 border-neon-yellow/50 p-4 bg-meme-dark/80">
                <p className="text-neon-yellow text-xs mb-1">// volume_sol</p>
                <p className="text-2xl font-bold text-neon-yellow glow-yellow">
                  {data.globalStats.totalVolumeSOL.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Top Tokens */}
            {data.globalStats.topTokens.length > 0 && (
              <div className="mb-8">
                <h2 className="font-pixel text-xs text-neon-cyan mb-4 glow-cyan">
                  {">"} HOT_TOKENS 🔥
                </h2>
                <div className="flex gap-2 flex-wrap">
                  {data.globalStats.topTokens.map((token, i) => (
                    <span
                      key={i}
                      className="border-2 border-neon-purple/50 px-3 py-1 text-xs text-neon-pink bg-meme-dark/80 hover:border-neon-pink transition-colors"
                    >
                      ${token.symbol} ({token.tradeCount})
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
                  className={`px-4 py-2 text-xs border-2 transition-colors ${
                    sortBy === sort
                      ? "border-neon-pink text-neon-pink bg-neon-pink/20 glow-pink"
                      : "border-meme-muted text-meme-light hover:border-neon-cyan hover:text-neon-cyan"
                  }`}
                >
                  {sort === "pnl" && "💰 P&L"}
                  {sort === "trades" && "📊 Trades"}
                  {sort === "winRate" && "🎯 Win Rate"}
                </button>
              ))}
            </div>

            {/* Leaderboard Table */}
            <div className="neon-border bg-meme-dark/80">
              {/* Header */}
              <div className="grid grid-cols-6 gap-2 md:gap-4 p-4 border-b border-neon-purple/30 text-neon-cyan text-xs">
                <span>#</span>
                <span>DEGEN</span>
                <span className="text-right">APES</span>
                <span className="text-right hidden md:block">YOLO&apos;D</span>
                <span className="text-right">P&L</span>
                <span className="text-right">WIN%</span>
              </div>

              {/* Rows */}
              {data.leaderboard.map((entry) => (
                <div
                  key={entry.displayName}
                  className="grid grid-cols-6 gap-2 md:gap-4 p-4 border-b border-neon-purple/20 hover:bg-neon-pink/10 transition-colors text-sm"
                >
                  <span className="text-neon-yellow font-bold">
                    {entry.rank === 1 && "🥇 "}
                    {entry.rank === 2 && "🥈 "}
                    {entry.rank === 3 && "🥉 "}
                    {entry.rank > 3 && entry.rank}
                  </span>
                  <span className="text-neon-pink truncate">
                    {entry.displayName}
                  </span>
                  <span className="text-right text-white">
                    {entry.totalTrades}
                  </span>
                  <span className="text-right text-neon-cyan hidden md:block">
                    {entry.totalInvestedSol.toFixed(2)}
                  </span>
                  <span
                    className={`text-right font-bold ${
                      entry.totalPnlUsd >= 0
                        ? "text-neon-green glow-green"
                        : "text-neon-red"
                    }`}
                  >
                    {formatPnL(entry.totalPnlUsd)}
                  </span>
                  <span className="text-right text-meme-light">
                    {entry.winRate.toFixed(1)}%
                  </span>
                </div>
              ))}

              {data.leaderboard.length === 0 && (
                <div className="text-center py-12 text-meme-light">
                  <div className="text-4xl mb-4">🦧</div>
                  <p className="text-neon-cyan">no degens yet... be the first!</p>
                </div>
              )}
            </div>

            {/* Last Updated */}
            <p className="text-meme-light text-xs mt-4 text-right">
              last updated: {new Date(data.lastUpdated).toLocaleString()}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
