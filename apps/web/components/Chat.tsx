"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  decision?: {
    action: "buy" | "pass";
    token?: string;
    amount?: number;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
        }),
      });

      const data = await res.json();
      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          decision: data.decision,
        },
      ]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "ERROR: Connection failed. Retry." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto border border-cyber-muted bg-black/80 backdrop-blur-sm">
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
        {loading && (
          <div className="flex justify-start">
            <div className="border border-cyber-muted px-4 py-3 text-cyber-light">
              <span className="animate-pulse">processing...</span>
            </div>
          </div>
        )}
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
