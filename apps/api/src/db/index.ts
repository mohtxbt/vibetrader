import Database from "better-sqlite3";
import type { Purchase } from "@vibe-trader/shared";
import { randomUUID } from "crypto";

const db = new Database("vibe-trader.db");

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    token_address TEXT NOT NULL,
    token_symbol TEXT,
    amount_sol REAL NOT NULL,
    amount_token REAL NOT NULL,
    price_per_token REAL NOT NULL,
    reasoning TEXT NOT NULL,
    tx_signature TEXT NOT NULL,
    timestamp TEXT NOT NULL
  )
`);

export function addPurchase(purchase: Omit<Purchase, "id">): Purchase {
  const id = randomUUID();
  const stmt = db.prepare(`
    INSERT INTO purchases (id, token_address, token_symbol, amount_sol, amount_token, price_per_token, reasoning, tx_signature, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    purchase.tokenAddress,
    purchase.tokenSymbol || "UNKNOWN",
    purchase.amountSol,
    purchase.amountToken,
    purchase.pricePerToken,
    purchase.reasoning,
    purchase.txSignature,
    purchase.timestamp
  );

  return { id, ...purchase };
}

export function getPurchases(): Purchase[] {
  const stmt = db.prepare(`
    SELECT
      id,
      token_address as tokenAddress,
      token_symbol as tokenSymbol,
      amount_sol as amountSol,
      amount_token as amountToken,
      price_per_token as pricePerToken,
      reasoning,
      tx_signature as txSignature,
      timestamp
    FROM purchases
    ORDER BY timestamp DESC
  `);

  return stmt.all() as Purchase[];
}

export function getPurchasesByToken(tokenAddress: string): Purchase[] {
  const stmt = db.prepare(`
    SELECT
      id,
      token_address as tokenAddress,
      token_symbol as tokenSymbol,
      amount_sol as amountSol,
      amount_token as amountToken,
      price_per_token as pricePerToken,
      reasoning,
      tx_signature as txSignature,
      timestamp
    FROM purchases
    WHERE token_address = ?
    ORDER BY timestamp DESC
  `);

  return stmt.all(tokenAddress) as Purchase[];
}
