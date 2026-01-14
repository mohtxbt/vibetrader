# vibe-trader

An AI agent that buys tokens on Solana if you can convince it. Pitch your bags, see if the agent bites.

## How it works

You chat with the agent and try to sell it on a token. It evaluates your pitch - tokenomics, narrative, red flags, whatever - and decides to buy or pass. If it buys, it swaps SOL for the token via Jupiter.

## Setup

```bash
# start postgres
docker compose up -d

# install deps
pnpm install

# configure
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# then add your OPENAI_API_KEY etc...

# run
pnpm dev
```

API runs on :3001, frontend on :3000.

## Project structure

```
apps/
  api/     # express backend - agent, wallet, swaps
  web/     # next.js frontend - chat ui, portfolio
packages/
  shared/  # types shared between apps
```

## Env vars

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string |
| `OPENAI_API_KEY` | For the agent |
| `SOLANA_PRIVATE_KEY` | Agent's wallet (base58). Generated on first run if not set |
| `SOLANA_RPC_URL` | Defaults to mainnet |
| `BUY_AMOUNT_SOL` | How much SOL to spend per buy (default 0.1) |

## Notes

- The agent will generate a new wallet on startup if you don't provide one. Check the logs for the private key.
- Test on devnet first unless you want to lose money.
- The agent is skeptical by default. You actually have to make a decent pitch.

## Contract

pump


