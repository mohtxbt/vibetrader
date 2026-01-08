"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

interface RateLimitInfo {
  limit: number;
  remaining: number;
  used: number;
  resetsAt: string;
}

interface TokenPreview {
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

interface Message {
  role: "user" | "assistant";
  content: string;
  tokenPreview?: TokenPreview;
  decision?: {
    action: "buy" | "pass";
    token?: string;
    amount?: number;
  };
}

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(2) + "K";
  return num.toFixed(2);
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const isDev = process.env.NODE_ENV === "development";

export default function Chat() {
  const { getToken, isSignedIn } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const resetUsage = async () => {
    try {
      const token = isSignedIn ? await getToken() : null;
      const res = await fetch(`${API_URL}/dev/reset-rate-limit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
      });
      if (res.ok) {
        setRateLimit(null);
        console.log("[DEV] Rate limit reset");
      }
    } catch (error) {
      console.error("Failed to reset rate limit:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    // Add placeholder for streaming response
    const placeholderIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const token = isSignedIn ? await getToken() : null;

      const res = await fetch(`${API_URL}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
        body: JSON.stringify({
          message: userMessage,
          conversationId,
        }),
      });

      if (res.status === 429) {
        const errorData = await res.json();
        setRateLimit(errorData.rateLimit);
        setMessages((prev) => {
          const updated = [...prev];
          updated[placeholderIndex] = { role: "assistant", content: errorData.message };
          return updated;
        });
        return;
      }

      if (!res.ok || !res.body) {
        throw new Error(`Server error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));

          if (data.type === "token") {
            setMessages((prev) => {
              const updated = [...prev];
              updated[placeholderIndex] = {
                ...updated[placeholderIndex],
                tokenPreview: data.tokenPreview,
              };
              return updated;
            });
            if (data.conversationId) setConversationId(data.conversationId);
          } else if (data.type === "chunk") {
            setMessages((prev) => {
              const updated = [...prev];
              updated[placeholderIndex] = {
                ...updated[placeholderIndex],
                content: updated[placeholderIndex].content + data.content,
              };
              return updated;
            });
          } else if (data.type === "decision") {
            setMessages((prev) => {
              const updated = [...prev];
              updated[placeholderIndex] = {
                ...updated[placeholderIndex],
                decision: data.decision,
              };
              return updated;
            });
          } else if (data.type === "done") {
            if (data.conversationId) setConversationId(data.conversationId);
            if (data.rateLimit) setRateLimit(data.rateLimit);
          } else if (data.type === "error") {
            throw new Error(data.error);
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[placeholderIndex] = { role: "assistant", content: "ERROR: Connection failed. Retry." };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto border border-cyber-muted bg-black/80 backdrop-blur-sm">
      {/* Rate Limit Display */}
      <div className="px-4 py-2 border-b border-cyber-muted flex justify-between items-center text-xs font-mono">
        <span className="text-cyber-muted">
          {isSignedIn ? "PRO USER" : "FREE USER"}
        </span>
        <div className="flex items-center gap-3">
          <span
            className={`${
              rateLimit && rateLimit.remaining <= 2
                ? "text-red-400"
                : "text-cyber-light"
            }`}
          >
            {rateLimit
              ? `${rateLimit.remaining}/${rateLimit.limit} interactions remaining`
              : isSignedIn
              ? "20/day limit"
              : "2/day limit (sign in for 20!)"}
          </span>
          {isDev && (
            <button
              onClick={resetUsage}
              className="text-yellow-500 hover:text-yellow-300 transition-colors"
              title="[DEV] Reset usage"
            >
              [reset]
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm">
        {messages.length === 0 && (
          <div className="text-center mt-12 space-y-4">
            <div className="text-2xl text-cyber-light">{">"}_</div>
            <p className="font-pixel text-xs text-white glow-white">PITCH ME A TOKEN</p>
            <p className="text-cyber-light text-xs">// tell me why I should buy</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 ${
                msg.role === "user"
                  ? "bg-cyber-gray border border-cyber-muted text-white"
                  : "bg-transparent border border-cyber-muted text-cyber-light"
              }`}
            >
              {msg.tokenPreview && (
                <div className="mb-3 pb-3 border-b border-cyber-muted">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold">
                      {msg.tokenPreview.name} ({msg.tokenPreview.symbol})
                    </span>
                    <span className={`text-xs ${msg.tokenPreview.priceChange24h >= 0 ? "text-cyber-green" : "text-red-400"}`}>
                      {msg.tokenPreview.priceChange24h >= 0 ? "+" : ""}{msg.tokenPreview.priceChange24h.toFixed(2)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div><span className="text-cyber-muted">Price:</span> <span className="text-white">${msg.tokenPreview.priceUsd}</span></div>
                    <div><span className="text-cyber-muted">Liq:</span> <span className="text-white">${formatNumber(msg.tokenPreview.liquidity)}</span></div>
                    <div><span className="text-cyber-muted">MCap:</span> <span className="text-white">{msg.tokenPreview.marketCap ? "$" + formatNumber(msg.tokenPreview.marketCap) : "N/A"}</span></div>
                    <div><span className="text-cyber-muted">Vol:</span> <span className="text-white">${formatNumber(msg.tokenPreview.volume24h)}</span></div>
                    {msg.tokenPreview.holders && (
                      <div><span className="text-cyber-muted">Holders:</span> <span className="text-white">{msg.tokenPreview.holders.toLocaleString()}</span></div>
                    )}
                    <div><span className="text-cyber-muted">Age:</span> <span className="text-white">{msg.tokenPreview.age}</span></div>
                  </div>
                </div>
              )}
              <span className="text-cyber-muted mr-2">{msg.role === "user" ? ">" : "$"}</span>
              <span className="whitespace-pre-wrap leading-relaxed">{msg.content}</span>
              {msg.decision && (
                <div
                  className={`mt-3 pt-3 border-t border-cyber-muted flex items-center gap-2 ${
                    msg.decision.action === "buy"
                      ? "text-cyber-green glow-green"
                      : "text-cyber-light"
                  }`}
                >
                  {msg.decision.action === "buy" ? (
                    <>
                      <span>[OK]</span>
                      <span>bought {msg.decision.amount?.toFixed(4)} tokens</span>
                    </>
                  ) : (
                    <>
                      <span>[PASS]</span>
                      <span>rejected</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-cyber-muted">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="enter pitch..."
            className="flex-1 bg-black text-white font-mono px-4 py-3 border border-cyber-muted focus:outline-none focus:border-white transition-colors placeholder:text-cyber-muted"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-white text-black px-6 py-3 font-mono hover:bg-cyber-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            SEND
          </button>
        </div>
      </form>
    </div>
  );
}
