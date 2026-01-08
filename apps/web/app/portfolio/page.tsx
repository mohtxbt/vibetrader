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
    <main className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Back to Chat
          </Link>
        </div>

        {loading && <p className="text-gray-400">Loading...</p>}

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {portfolio && (
          <>
            <div className="bg-gray-800 rounded-xl p-6 mb-8">
              <p className="text-gray-400 text-sm">Wallet Balance</p>
              <p className="text-3xl font-bold">{portfolio.balance.toFixed(4)} SOL</p>
            </div>

            <h2 className="text-xl font-semibold mb-4">Purchase History</h2>

            {portfolio.purchases.length === 0 ? (
              <p className="text-gray-500">No purchases yet. Go pitch some tokens!</p>
            ) : (
              <div className="space-y-4">
                {portfolio.purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="bg-gray-800 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold">{purchase.tokenSymbol}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          {shortenAddress(purchase.tokenAddress)}
                        </span>
                      </div>
                      <span className="text-gray-400 text-sm">
                        {new Date(purchase.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Spent</p>
                        <p>{purchase.amountSol.toFixed(4)} SOL</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Received</p>
                        <p>{purchase.amountToken.toLocaleString()} tokens</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Price</p>
                        <p>{purchase.pricePerToken.toFixed(8)} SOL</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-700">
                      <p className="text-gray-500 text-sm">Reasoning</p>
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {purchase.reasoning}
                      </p>
                    </div>

                    <a
                      href={`https://solscan.io/tx/${purchase.txSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 text-sm hover:underline"
                    >
                      View transaction
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
