"use client";

import { useState, useEffect } from "react";
import {
  StoredConversation,
  getStoredConversations,
  deleteConversation,
  clearAllConversations,
} from "@/lib/conversationStorage";

interface ConversationHistoryProps {
  currentConversationId: string | null;
  onSelectConversation: (conversation: StoredConversation) => void;
  onNewConversation: () => void;
  refreshTrigger?: number;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function ConversationHistory({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  refreshTrigger,
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setConversations(getStoredConversations());
  }, [refreshTrigger]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deleteConversation(id)) {
      setConversations(getStoredConversations());
    }
  };

  const handleClearAll = () => {
    if (confirm("Delete all past conversations?")) {
      clearAllConversations();
      setConversations([]);
      onNewConversation();
    }
  };

  if (conversations.length === 0 && !isOpen) {
    return null;
  }

  return (
    <div className="mb-3 sm:mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-neon-cyan hover:text-neon-yellow transition-colors font-mono text-xs sm:text-sm hover:glow-yellow py-1"
      >
        <span className="text-xs">{isOpen ? "▼" : "▶"}</span>
        [history] <span className="text-meme-light">({conversations.length})</span>
      </button>

      {isOpen && (
        <div className="mt-2 sm:mt-3 neon-border bg-meme-dark/90 backdrop-blur-sm">
          <div className="flex items-center justify-between px-3 py-2 border-b border-neon-pink/30">
            <span className="font-pixel text-[10px] sm:text-xs text-neon-pink glow-pink">
              PAST VIBES
            </span>
            <div className="flex gap-3 sm:gap-2">
              <button
                onClick={onNewConversation}
                className="text-neon-green hover:text-neon-yellow text-xs font-mono transition-colors hover:glow-green py-1 px-1"
              >
                [+ new]
              </button>
              {conversations.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-neon-red hover:text-neon-orange text-xs font-mono transition-colors py-1 px-1"
                >
                  [clear]
                </button>
              )}
            </div>
          </div>

          <div className="max-h-40 sm:max-h-48 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-3 text-meme-light text-xs font-mono text-center">
                no past conversations
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv);
                    setIsOpen(false);
                  }}
                  className={`group px-3 py-2.5 sm:py-2 cursor-pointer border-b border-neon-purple/20 last:border-b-0 transition-colors active:bg-meme-gray/70 ${
                    currentConversationId === conv.id
                      ? "bg-neon-pink/20 border-l-2 border-l-neon-pink"
                      : "hover:bg-meme-gray/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-mono text-white truncate">
                        {conv.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-xs text-meme-light">
                        <span>{conv.messages.length} msgs</span>
                        <span>•</span>
                        <span>{formatTimeAgo(conv.updatedAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-neon-red hover:text-neon-orange text-sm sm:text-xs font-mono transition-all p-1 -mr-1"
                      title="Delete conversation"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
