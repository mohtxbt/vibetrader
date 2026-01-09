"use client";

import { useState, useCallback } from "react";
import Chat from "@/components/Chat";
import ConversationHistory from "@/components/ConversationHistory";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { StoredConversation } from "@/lib/conversationStorage";

export default function Home() {
  const [selectedConversation, setSelectedConversation] = useState<StoredConversation | null>(null);
  const [conversationKey, setConversationKey] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNewConversation = useCallback(() => {
    setSelectedConversation(null);
    setConversationKey((k) => k + 1);
  }, []);

  const handleSelectConversation = useCallback((conv: StoredConversation) => {
    setSelectedConversation(conv);
    setConversationKey((k) => k + 1);
  }, []);

  const handleConversationUpdate = useCallback(() => {
    setRefreshTrigger((t) => t + 1);
  }, []);

  return (
    <main className="min-h-screen p-3 sm:p-4 relative chaos-bg">
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header - stacks on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
          <div className="flex items-center justify-between">
            <h1 className="font-pixel text-lg sm:text-xl md:text-2xl text-neon-pink glow-pink">
              Vibe Trader
            </h1>
            {/* Auth button visible on mobile header row */}
            <div className="sm:hidden">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-neon-green hover:text-neon-yellow transition-colors font-mono text-xs hover:glow-green">
                    [sign in]
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-7 h-7 border-2 border-neon-pink shadow-glow-pink",
                    },
                  }}
                />
              </SignedIn>
            </div>
          </div>

          {/* Navigation - horizontal scroll on mobile */}
          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-hide">
            <Link
              href="/leaderboard"
              className="text-neon-cyan hover:text-neon-yellow transition-colors font-mono text-xs sm:text-sm hover:glow-yellow whitespace-nowrap"
            >
              [leaderboard]
            </Link>
            <Link
              href="/portfolio"
              className="text-neon-cyan hover:text-neon-yellow transition-colors font-mono text-xs sm:text-sm hover:glow-yellow whitespace-nowrap"
            >
              [portfolio]
            </Link>
            <Link
              href="/about"
              className="text-neon-cyan hover:text-neon-yellow transition-colors font-mono text-xs sm:text-sm hover:glow-yellow whitespace-nowrap"
            >
              [about]
            </Link>

            {/* Auth button hidden on mobile (shown in header row instead) */}
            <div className="hidden sm:block">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-neon-green hover:text-neon-yellow transition-colors font-mono text-sm hover:glow-green whitespace-nowrap">
                    [sign in]
                  </button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 border-2 border-neon-pink shadow-glow-pink",
                    },
                  }}
                />
              </SignedIn>
            </div>
          </div>
        </div>

        <ConversationHistory
          currentConversationId={selectedConversation?.id || null}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          refreshTrigger={refreshTrigger}
        />

        <Chat
          key={conversationKey}
          initialConversation={selectedConversation}
          conversationKey={conversationKey}
          onConversationUpdate={handleConversationUpdate}
        />
      </div>
    </main>
  );
}
