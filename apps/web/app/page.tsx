import Chat from "@/components/Chat";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="min-h-screen p-4 relative">
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-pixel text-xl md:text-2xl text-white glow-white">
            Vibe Trader
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/leaderboard"
              className="text-cyber-light hover:text-white transition-colors font-mono text-sm"
            >
              [leaderboard]
            </Link>
            <Link
              href="/portfolio"
              className="text-cyber-light hover:text-white transition-colors font-mono text-sm"
            >
              [portfolio]
            </Link>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-cyber-light hover:text-white transition-colors font-mono text-sm">
                  [sign in]
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 border border-cyber-muted",
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
