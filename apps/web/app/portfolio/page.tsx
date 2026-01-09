"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Purchase {
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

interface Portfolio {
  balance: number;
  purchases: Purchase[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const res = await fetch(`${API_URL}/portfolio`);
      if (!res.ok) throw new Error("Failed to fetch portfolio");
      const data = await res.json();
      setPortfolio(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const shortenAddress = (addr: string) =>
    `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  return (
    <main className="min-h-screen p-4 relative chaos-bg">
      <div className="max-w-4xl mx-auto relative z-10 font-mono">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-pixel text-xl md:text-2xl text-neon-cyan glow-cyan">
            💼 Portfolio
          </h1>
          <Link
            href="/"
            className="text-neon-pink hover:text-neon-yellow transition-colors text-sm hover:glow-yellow"
          >
            [back]
          </Link>
        </div>

        {loading && (
          <div className="text-neon-cyan animate-pulse glow-cyan">
            $ loading wallet... 🔄
          </div>
        )}

        {error && (
          <div className="border-2 border-neon-red p-4 mb-6 bg-neon-red/10">
            <p className="text-neon-red">❌ ERROR: {error}</p>
          </div>
        )}

        {portfolio && (
          <>
            {/* Balance Card */}
            <div className="neon-border p-6 mb-8 bg-meme-dark/80">
              <p className="text-neon-pink text-xs mb-1">// wallet balance</p>
              <p className="text-3xl font-bold text-neon-green glow-green">
                {portfolio.balance.toFixed(4)} <span className="text-xl text-neon-yellow">SOL</span>
              </p>
              <p className="text-meme-light text-xs mt-2">💰 ready to ape</p>
            </div>

            <h2 className="font-pixel text-xs text-neon-yellow mb-6 glow-yellow">
              {">"} APE_HISTORY 🦍
            </h2>

            {portfolio.purchases.length === 0 ? (
              <div className="text-center py-12 text-meme-light">
                <div className="text-4xl mb-4">🦧</div>
                <p className="text-neon-cyan">no apes yet... go find some gems!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {portfolio.purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="bg-meme-dark/80 border-2 border-neon-purple/50 p-5 space-y-4 hover:border-neon-pink transition-colors hover:box-glow-pink"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-neon-pink font-bold glow-pink">${purchase.tokenSymbol}</span>
                        <span className="text-meme-light text-xs">
                          {shortenAddress(purchase.tokenAddress)}
                        </span>
                      </div>
                      <span className="text-neon-cyan text-xs">
                        {new Date(purchase.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div className="border border-neon-purple/30 p-3 bg-meme-gray/30">
                        <p className="text-neon-cyan mb-1">spent</p>
                        <p className="text-white">{purchase.amountSol.toFixed(4)} SOL</p>
                      </div>
                      <div className="border border-neon-purple/30 p-3 bg-meme-gray/30">
                        <p className="text-neon-cyan mb-1">received</p>
                        <p className="text-neon-green glow-green font-bold">{purchase.amountToken.toLocaleString()}</p>
                      </div>
                      <div className="border border-neon-purple/30 p-3 bg-meme-gray/30">
                        <p className="text-neon-cyan mb-1">price</p>
                        <p className="text-white">{purchase.pricePerToken.toFixed(8)}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neon-purple/30">
                      <p className="text-neon-yellow text-xs mb-2">// why i aped 🧠</p>
                      <p className="text-sm text-meme-light leading-relaxed line-clamp-2">
                        {purchase.reasoning}
                      </p>
                    </div>

                    <a
                      href={`https://solscan.io/tx/${purchase.txSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-neon-cyan text-xs hover:text-neon-green transition-colors hover:glow-green"
                    >
                      [view tx 🔗]
                    </a>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
