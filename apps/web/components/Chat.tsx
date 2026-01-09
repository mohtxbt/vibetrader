"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { saveConversation, StoredConversation } from "@/lib/conversationStorage";

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

interface ChatProps {
  initialConversation?: StoredConversation | null;
  conversationKey?: number;
  onConversationUpdate?: () => void;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(2) + "K";
  return num.toFixed(2);
}

function formatInlineMarkdown(text: string, keyPrefix: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyPrefix}-${i}`} className="text-neon-yellow">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function formatMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const isLast = i === lines.length - 1;

    // Handle headers
    if (line.startsWith("### ")) {
      return <React.Fragment key={i}><span className="text-lg font-bold text-neon-pink">{formatInlineMarkdown(line.slice(4), `h3-${i}`)}</span>{!isLast && "\n"}</React.Fragment>;
    }
    if (line.startsWith("## ")) {
      return <React.Fragment key={i}><span className="text-xl font-bold text-neon-pink">{formatInlineMarkdown(line.slice(3), `h2-${i}`)}</span>{!isLast && "\n"}</React.Fragment>;
    }
    if (line.startsWith("# ")) {
      return <React.Fragment key={i}><span className="text-2xl font-bold text-neon-pink">{formatInlineMarkdown(line.slice(2), `h1-${i}`)}</span>{!isLast && "\n"}</React.Fragment>;
    }

    // Regular line with inline formatting
    return <React.Fragment key={i}>{formatInlineMarkdown(line, `line-${i}`)}{!isLast && "\n"}</React.Fragment>;
  });
}

function generateId(): string {
  return crypto.randomUUID();
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const isDev = process.env.NODE_ENV === "development";
const ANON_LIMIT = Number(process.env.NEXT_PUBLIC_ANON_DAILY_LIMIT) || 2;
const USER_LIMIT = Number(process.env.NEXT_PUBLIC_USER_DAILY_LIMIT) || 20;

export default function Chat({ initialConversation, conversationKey, onConversationUpdate }: ChatProps) {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>(initialConversation?.messages || []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversation?.id || null
  );
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset state when conversationKey changes (new conversation) or initialConversation changes
  useEffect(() => {
    if (initialConversation) {
      setMessages(initialConversation.messages);
      setConversationId(initialConversation.id);
    } else {
      setMessages([]);
      setConversationId(null);
    }
  }, [conversationKey, initialConversation]);

  // Save conversation to localStorage when messages change
  const saveToStorage = useCallback((id: string, msgs: Message[]) => {
    if (msgs.length > 0) {
      saveConversation(id, msgs);
      onConversationUpdate?.();
    }
  }, [onConversationUpdate]);

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

    // Generate local conversation ID if needed
    const currentConvId = conversationId || generateId();
    if (!conversationId) {
      setConversationId(currentConvId);
    }

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
        try {
          const errorData = await res.json();
          if (errorData.rateLimit) setRateLimit(errorData.rateLimit);
          const limitMessage = errorData.message || (isSignedIn
            ? "You've used all your interactions for today. Come back tomorrow!"
            : "You've used your free interactions. Sign in for more!");
          setMessages((prev) => {
            const updated = [...prev];
            updated[placeholderIndex] = { role: "assistant", content: limitMessage };
            return updated;
          });
        } catch {
          const fallbackMessage = isSignedIn
            ? "You've used all your interactions for today. Come back tomorrow!"
            : "You've used your free interactions. Sign in for more!";
          setMessages((prev) => {
            const updated = [...prev];
            updated[placeholderIndex] = { role: "assistant", content: fallbackMessage };
            return updated;
          });
        }
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
            // Save conversation to localStorage
            setMessages((prev) => {
              saveToStorage(data.conversationId || currentConvId, prev);
              return prev;
            });
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
        // Still save conversation on error
        saveToStorage(currentConvId, updated);
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] sm:h-[calc(100dvh-7rem)] max-w-2xl mx-auto neon-border backdrop-blur-sm w-full">
      {/* Rate Limit Display */}
      <div className="px-3 sm:px-4 py-2 border-b border-neon-pink/30 flex justify-between items-center text-xs font-mono bg-meme-dark/80">
        <span className={`${isSignedIn ? "text-neon-gold glow-yellow" : "text-meme-light"}`}>
          {isSignedIn ? "PRO" : "ANON"}
        </span>
        <div className="flex items-center gap-2 sm:gap-3">
          <span
            className={`text-[10px] sm:text-xs ${
              rateLimit && rateLimit.remaining <= 2
                ? "text-neon-red animate-flash"
                : "text-neon-cyan"
            }`}
          >
            {rateLimit
              ? `${rateLimit.remaining}/${rateLimit.limit} left`
              : isSignedIn
              ? `${USER_LIMIT}/day`
              : `${ANON_LIMIT}/day`}
          </span>
          {!isSignedIn && !rateLimit && (
            <span className="hidden sm:inline text-neon-green text-[10px]">(sign in for {USER_LIMIT}!)</span>
          )}
          {isDev && (
            <button
              onClick={resetUsage}
              className="text-neon-yellow hover:text-neon-orange transition-colors hover:glow-yellow p-1"
              title="[DEV] Reset usage"
            >
              [reset]
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 font-mono text-xs sm:text-sm bg-meme-black/60">
        {messages.length === 0 && (
          <div className="text-center mt-8 sm:mt-12 space-y-3 sm:space-y-4">
            <div className="text-3xl sm:text-4xl animate-float">🚀💰🔥</div>
            <p className="font-pixel text-xs sm:text-sm text-neon-pink glow-pink">PITCH ME A TOKEN</p>
            <p className="text-neon-cyan text-[10px] sm:text-xs glow-cyan">// convince me to ape in</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-neon-cyan/50">
                <Image
                  src="/logo.png"
                  alt="Vibe Trader"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div
              className={`max-w-[80%] sm:max-w-[75%] px-3 sm:px-4 py-2 sm:py-3 ${
                msg.role === "user"
                  ? "bg-neon-pink/20 border-2 border-neon-pink/50 text-white box-glow-pink"
                  : "bg-meme-gray/50 border-2 border-neon-cyan/30 text-meme-light"
              }`}
            >
              {msg.tokenPreview && (
                <div className="mb-3 sm:mb-4 bg-meme-dark/80 border-2 border-neon-yellow/50 p-2 sm:p-3 box-glow-cyan">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2 sm:mb-3 pb-2 border-b border-neon-pink/30">
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                      <span className="text-neon-yellow font-mono text-[10px] sm:text-xs glow-yellow shrink-0">🪙</span>
                      <span className="text-neon-pink font-bold truncate text-xs sm:text-sm glow-pink">
                        ${msg.tokenPreview.symbol}
                      </span>
                    </div>
                    <div className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-mono font-bold shrink-0 ${
                      msg.tokenPreview.priceChange24h >= 0
                        ? "bg-neon-green/20 text-neon-green glow-green"
                        : "bg-neon-red/20 text-neon-red"
                    }`}>
                      {msg.tokenPreview.priceChange24h >= 0 ? "+" : ""}{msg.tokenPreview.priceChange24h.toFixed(1)}%
                    </div>
                  </div>

                  {/* Name */}
                  <div className="text-meme-light text-[10px] sm:text-xs mb-2 sm:mb-3 truncate">{msg.tokenPreview.name}</div>

                  {/* Price */}
                  <div className="text-neon-green text-base sm:text-xl font-mono mb-2 sm:mb-3 glow-green font-bold">${msg.tokenPreview.priceUsd}</div>

                  {/* Stats Grid - 2 cols on mobile, 3 on larger */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                    <div className="bg-meme-gray/50 p-1.5 sm:p-2 border border-neon-purple/30">
                      <div className="text-neon-cyan mb-0.5 sm:mb-1">MCap</div>
                      <div className="text-white font-mono">{msg.tokenPreview.marketCap ? "$" + formatNumber(msg.tokenPreview.marketCap) : "—"}</div>
                    </div>
                    <div className="bg-meme-gray/50 p-1.5 sm:p-2 border border-neon-purple/30">
                      <div className="text-neon-cyan mb-0.5 sm:mb-1">Liq</div>
                      <div className="text-white font-mono">${formatNumber(msg.tokenPreview.liquidity)}</div>
                    </div>
                    <div className="bg-meme-gray/50 p-1.5 sm:p-2 border border-neon-purple/30">
                      <div className="text-neon-cyan mb-0.5 sm:mb-1">Vol 24h</div>
                      <div className="text-white font-mono">${formatNumber(msg.tokenPreview.volume24h)}</div>
                    </div>
                    {msg.tokenPreview.holders && (
                      <div className="bg-meme-gray/50 p-1.5 sm:p-2 border border-neon-purple/30">
                        <div className="text-neon-cyan mb-0.5 sm:mb-1">Holders</div>
                        <div className="text-white font-mono">{msg.tokenPreview.holders.toLocaleString()}</div>
                      </div>
                    )}
                    <div className="bg-meme-gray/50 p-1.5 sm:p-2 border border-neon-purple/30">
                      <div className="text-neon-cyan mb-0.5 sm:mb-1">Age</div>
                      <div className="text-white font-mono">{msg.tokenPreview.age}</div>
                    </div>
                  </div>
                </div>
              )}
              <span className="text-neon-pink mr-2">{msg.role === "user" ? ">" : "$"}</span>
              <span className="whitespace-pre-wrap leading-relaxed">{formatMarkdown(msg.content)}</span>
              {msg.decision && (
                <div
                  className={`mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-neon-purple/30 flex flex-wrap items-center gap-1 sm:gap-2 font-bold text-xs sm:text-sm ${
                    msg.decision.action === "buy"
                      ? "text-neon-green glow-green"
                      : "text-neon-red"
                  }`}
                >
                  {msg.decision.action === "buy" ? (
                    <>
                      <span>🚀 APED IN</span>
                      <span className="text-[10px] sm:text-xs opacity-80">bought {msg.decision.amount?.toFixed(4)} tokens</span>
                    </>
                  ) : (
                    <>
                      <span>❌ NGMI</span>
                      <span className="opacity-80">rejected</span>
                    </>
                  )}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-neon-pink/50">
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt="You"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-neon-pink/30 flex items-center justify-center text-neon-pink text-xs font-bold">
                    ?
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 sm:p-4 border-t border-neon-pink/30 bg-meme-dark/80">
        <div className="flex gap-2 sm:gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="enter your pitch..."
            className="flex-1 bg-meme-black text-white font-mono text-sm sm:text-base px-3 sm:px-4 py-3 min-h-[44px] border-2 border-neon-cyan/50 focus:outline-none focus:border-neon-pink focus:box-glow-pink transition-colors placeholder:text-meme-light"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-neon-pink text-white px-4 sm:px-6 py-3 min-h-[44px] min-w-[60px] sm:min-w-[80px] font-mono font-bold text-sm sm:text-base hover:bg-neon-purple active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "..." : "SEND"}
          </button>
        </div>
      </form>
    </div>
  );
}
