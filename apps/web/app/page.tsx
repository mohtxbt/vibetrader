import Chat from "@/components/Chat";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Vibe Trader</h1>
          <Link
            href="/portfolio"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Portfolio
          </Link>
        </div>
        <Chat />
      </div>
    </main>
  );
}
