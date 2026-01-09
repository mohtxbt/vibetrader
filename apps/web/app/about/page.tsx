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
              <span className="text-neon-yellow">Vibe Trader</span> is a
              human-AI open source trading experimental agent that trades Solana tokens.
              Have a conversation with an AI agent that can execute real trades
              based on your discussion. The agent SOL is funded by the Bags Fees.
            </p>
          </section>

          {/* Why we built it */}
          <section className="border-2 border-neon-yellow/50 p-6 bg-meme-dark/80 box-glow-yellow">
            <h2 className="font-pixel text-xs text-neon-green mb-4 glow-green">
              {">"} WHY_I_BUILT_IT
            </h2>
            <p className="text-meme-light leading-relaxed">
              I was inspired by all the LLM trading projects popping up. Most use
              reinforcement learning, but IMO that doesn&apos;t work because{" "}
              <span className="text-neon-pink">trading is inherently more based on vibes than logic</span>.
            </p>
            <p className="text-meme-light leading-relaxed mt-4">
              This is what vibe trader is all about. The agent trades based on your vibes and your reasoning more than pure data and logic. LLMs excel at sentiment analysis and reasoning, but not so much at data based trading where
              where other types of agents excel.
            </p>
            <p className="text-meme-light leading-relaxed mt-4">
              Vibe Trader keeps a{" "}
              <span className="text-neon-cyan">human in the loop</span>. You
              have to actually convince the agent to buy your tokens, and at the
              same time question yourself. It&apos;s human and machine working
              together in a{" "}
              <span className="text-neon-yellow">fun experiment</span>.
            </p>
            <p className="text-meme-light leading-relaxed mt-4">
              Feel free to fork the project and make your own agent! This is fully open source and free to use.
            </p>
          </section>

          {/* Who built it */}
          <section className="border-2 border-neon-pink/50 p-6 bg-meme-dark/80 box-glow-pink">
            <h2 className="font-pixel text-xs text-neon-cyan mb-4 glow-cyan">
              {">"} WHO_BUILT_IT
            </h2>
            <p className="text-meme-light leading-relaxed">
              I&apos;m <span className="text-neon-yellow">mohtxbt</span>, a developer
              that&apos;s been in the space for a while. I worked on a range of
              projects from telegram trading bots, NFT marketplaces, trading
              terminals, crypto native games...
            </p>
            <p className="text-meme-light leading-relaxed mt-4">
              I&apos;ve been more and more impressed by the potential of AI and how
              it can be used to improve the space and make it easier for everyone
              to go from prototype to production. Crypto is a playground for
              experimentation and I&apos;m excited to see what the future holds.
            </p>
            <p className="text-meme-light leading-relaxed mt-4">
              I encourage you to get your hands dirty and build something yourself!
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
                "PostgreSQL",
                "Docker",
                "Clerk",
                "Jupiter",
                "Codex",
                "Express",
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
