import Chat from "@/components/Chat";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-4 relative">
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-pixel text-xl md:text-2xl text-white glow-white">
            Vibe Trader
          </h1>
          <Link
            href="/portfolio"
            className="text-cyber-light hover:text-white transition-colors font-mono text-sm"
          >
            [portfolio]
          </Link>
        </div>
        <Chat />
      </div>
    </main>
  );
}
