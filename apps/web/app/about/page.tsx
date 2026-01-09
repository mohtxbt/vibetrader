import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen p-4 relative chaos-bg">
      <div className="max-w-3xl mx-auto relative z-10 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-pixel text-xl md:text-2xl text-neon-pink glow-pink">
            About
          </h1>
          <Link
            href="/"
            className="text-neon-pink hover:text-neon-cyan transition-colors text-sm hover:glow-cyan"
          >
            [back]
          </Link>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* What is this */}
          <section className="border-2 border-neon-pink/50 p-6 bg-meme-dark/80 box-glow-pink">
            <h2 className="font-pixel text-xs text-neon-cyan mb-4 glow-cyan">
              {">"} WHAT_IS_THIS
            </h2>
            <p className="text-meme-light leading-relaxed">
              <span className="text-neon-yellow">Vibe Trader</span> is an
              experimental human-AI trading interface for Solana tokens.
              Have a conversation with an AI agent that can execute real trades
              based on your discussion.
            </p>
          </section>

          {/* Why we built it */}
          <section className="border-2 border-neon-yellow/50 p-6 bg-meme-dark/80 box-glow-yellow">
            <h2 className="font-pixel text-xs text-neon-green mb-4 glow-green">
              {">"} WHY_I_BUILT_IT
            </h2>
            <p className="text-meme-light leading-relaxed">
              Got inspired by all the LLM trading projects popping up. Most use
              reinforcement learning, but IMO that doesn&apos;t work because{" "}
              <span className="text-neon-pink">trading is inherently human</span>.
            </p>
            <p className="text-meme-light leading-relaxed mt-4">
              Vibe Trader keeps a{" "}
              <span className="text-neon-cyan">human in the loop</span>. You
              have to actually convince the agent to buy your tokens, and at the
              same time question yourself. It&apos;s human and machine working
              together in a{" "}
              <span className="text-neon-yellow">fun experiment</span>.
            </p>
          </section>

          {/* Tech Stack */}
          <section className="border-2 border-neon-yellow/50 p-6 bg-meme-dark/80">
            <h2 className="font-pixel text-xs text-neon-green mb-4 glow-green">
              {">"} TECH_STACK
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                "Next.js",
                "React",
                "TypeScript",
                "Solana",
                "OpenAI",
              ].map((tech) => (
                <span
                  key={tech}
                  className="border-2 border-neon-purple/50 px-3 py-1 text-xs text-neon-cyan bg-meme-dark/80 hover:border-neon-pink transition-colors"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>

          {/* Links */}
          <section className="border-2 border-neon-green/50 p-6 bg-meme-dark/80 box-glow-green">
            <h2 className="font-pixel text-xs text-neon-pink mb-4 glow-pink">
              {">"} LINKS
            </h2>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://github.com/mohtxbt/vibe-trader"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-cyan hover:text-neon-yellow transition-colors hover:glow-yellow"
              >
                [github]
              </a>
              <a
                href="https://x.com/mohtxbt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-cyan hover:text-neon-yellow transition-colors hover:glow-yellow"
              >
                [twitter]
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
