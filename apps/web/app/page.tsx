import Chat from "@/components/Chat";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="min-h-screen p-4 relative chaos-bg">
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-pixel text-xl md:text-2xl text-neon-pink glow-pink">
            Vibe Trader
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/leaderboard"
              className="text-neon-cyan hover:text-neon-yellow transition-colors font-mono text-sm hover:glow-yellow"
            >
              [leaderboard]
            </Link>
            <Link
              href="/portfolio"
              className="text-neon-cyan hover:text-neon-yellow transition-colors font-mono text-sm hover:glow-yellow"
            >
              [portfolio]
            </Link>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-neon-green hover:text-neon-yellow transition-colors font-mono text-sm hover:glow-green">
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
        <Chat />
      </div>
    </main>
  );
}
