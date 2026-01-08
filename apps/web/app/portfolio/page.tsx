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
    <main className="min-h-screen p-4 relative">
      <div className="max-w-4xl mx-auto relative z-10 font-mono">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-pixel text-xl md:text-2xl text-white glow-white">
            Portfolio
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
            $ loading wallet...
          </div>
        )}

        {error && (
          <div className="border border-white p-4 mb-6">
            <p className="text-white">ERROR: {error}</p>
          </div>
        )}

        {portfolio && (
          <>
            {/* Balance Card */}
            <div className="border border-cyber-muted p-6 mb-8 bg-black/50">
              <p className="text-cyber-muted text-xs mb-1">// wallet balance</p>
              <p className="text-3xl font-bold text-white glow-white">
                {portfolio.balance.toFixed(4)} <span className="text-xl text-cyber-light">SOL</span>
              </p>
            </div>

            <h2 className="font-pixel text-xs text-cyber-light mb-6">
              {">"} PURCHASE_HISTORY
            </h2>

            {portfolio.purchases.length === 0 ? (
              <div className="text-center py-12 text-cyber-muted">
                <div className="text-2xl mb-4">[ empty ]</div>
                <p>no purchases yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {portfolio.purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="bg-black/50 border border-cyber-muted p-5 space-y-4 hover:border-white transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{purchase.tokenSymbol}</span>
                        <span className="text-cyber-muted text-xs">
                          {shortenAddress(purchase.tokenAddress)}
                        </span>
                      </div>
                      <span className="text-cyber-muted text-xs">
                        {new Date(purchase.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div className="border border-cyber-muted p-3">
                        <p className="text-cyber-muted mb-1">spent</p>
                        <p className="text-white">{purchase.amountSol.toFixed(4)} SOL</p>
                      </div>
                      <div className="border border-cyber-muted p-3">
                        <p className="text-cyber-muted mb-1">received</p>
                        <p className="text-cyber-green glow-green">{purchase.amountToken.toLocaleString()}</p>
                      </div>
                      <div className="border border-cyber-muted p-3">
                        <p className="text-cyber-muted mb-1">price</p>
                        <p className="text-white">{purchase.pricePerToken.toFixed(8)}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-cyber-muted">
                      <p className="text-cyber-muted text-xs mb-2">// reasoning</p>
                      <p className="text-sm text-cyber-light leading-relaxed line-clamp-2">
                        {purchase.reasoning}
                      </p>
                    </div>

                    <a
                      href={`https://solscan.io/tx/${purchase.txSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-cyber-light text-xs hover:text-white transition-colors"
                    >
                      [view tx]
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
