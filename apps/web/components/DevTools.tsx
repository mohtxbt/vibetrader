"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Example tokens for testing
const TEST_TOKENS = [
  { name: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
  { name: "BONK", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
  { name: "JUP", mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" },
];

export default function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState(TEST_TOKENS[0].mint);
  const [customMint, setCustomMint] = useState("");
  const [amount, setAmount] = useState("0.001");

  // Only render in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const getMint = () => customMint || selectedToken;

  const testOrder = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/dev/test-swap-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outputMint: getMint(),
          amountSol: parseFloat(amount),
        }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const testExecute = async () => {
    if (!confirm("This will execute a REAL swap with real funds. Continue?")) {
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/dev/test-swap-execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outputMint: getMint(),
          amountSol: parseFloat(amount),
        }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-neon-purple/80 text-white font-mono text-xs px-3 py-2 rounded border border-neon-pink hover:bg-neon-pink/80 transition-colors"
      >
        [dev tools]
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-black/95 border border-neon-pink rounded-lg p-4 font-mono text-xs shadow-glow-pink">
      <div className="flex justify-between items-center mb-3">
        <span className="text-neon-pink font-bold">Dev Tools - Swap Test</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-neon-cyan hover:text-neon-yellow"
        >
          [x]
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-neon-cyan block mb-1">Token:</label>
          <select
            value={selectedToken}
            onChange={(e) => {
              setSelectedToken(e.target.value);
              setCustomMint("");
            }}
            className="w-full bg-black border border-neon-cyan/50 text-neon-green p-1 rounded"
          >
            {TEST_TOKENS.map((t) => (
              <option key={t.mint} value={t.mint}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-neon-cyan block mb-1">Custom Mint (optional):</label>
          <input
            type="text"
            value={customMint}
            onChange={(e) => setCustomMint(e.target.value)}
            placeholder="Token mint address..."
            className="w-full bg-black border border-neon-cyan/50 text-neon-green p-1 rounded text-xs"
          />
        </div>

        <div>
          <label className="text-neon-cyan block mb-1">Amount (SOL):</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.001"
            min="0.001"
            max="0.01"
            className="w-full bg-black border border-neon-cyan/50 text-neon-green p-1 rounded"
          />
          <span className="text-neon-yellow/60 text-xs">Max: 0.01 SOL</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={testOrder}
            disabled={loading}
            className="flex-1 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan py-1 px-2 rounded hover:bg-neon-cyan/40 disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : "Test Order"}
          </button>
          <button
            onClick={testExecute}
            disabled={loading}
            className="flex-1 bg-neon-pink/20 border border-neon-pink text-neon-pink py-1 px-2 rounded hover:bg-neon-pink/40 disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : "Execute!"}
          </button>
        </div>

        {result && (
          <div className="mt-2">
            <label className="text-neon-cyan block mb-1">Result:</label>
            <pre className="bg-black/80 border border-neon-green/30 p-2 rounded overflow-auto max-h-40 text-neon-green whitespace-pre-wrap break-all">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
