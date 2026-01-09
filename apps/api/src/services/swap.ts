import { VersionedTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getWallet, getConnection } from "./wallet.js";

const JUPITER_API = "https://quote-api.jup.ag/v6";
const SOL_MINT = "So11111111111111111111111111111111111111112";

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
}

export interface SwapResult {
  signature: string;
  inputAmount: number;
  outputAmount: number;
  tokenAddress: string;
}

export async function getQuote(
  outputMint: string,
  amountSol: number
): Promise<SwapQuote> {
  const amountLamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

  const params = new URLSearchParams({
    inputMint: SOL_MINT,
    outputMint,
    amount: amountLamports.toString(),
    slippageBps: "100", // 1% slippage
  });

  const response = await fetch(`${JUPITER_API}/quote?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to get quote: ${response.statusText}`);
  }

  return response.json();
}

export async function executeSwap(
  outputMint: string,
  amountSol: number
): Promise<SwapResult> {
  const wallet = getWallet();
  const connection = getConnection();

  // Get quote
  const quote = await getQuote(outputMint, amountSol);

  // Get swap transaction
  const swapResponse = await fetch(`${JUPITER_API}/swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: wallet.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
    }),
  });

  if (!swapResponse.ok) {
    throw new Error(`Failed to get swap transaction: ${swapResponse.statusText}`);
  }

  const { swapTransaction } = await swapResponse.json();

  // Deserialize and sign transaction
  const transactionBuffer = Buffer.from(swapTransaction, "base64");
  const transaction = VersionedTransaction.deserialize(transactionBuffer);
  transaction.sign([wallet]);

  // Send transaction
  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });

  // Confirm transaction
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });

  return {
    signature,
    inputAmount: amountSol,
    outputAmount: parseInt(quote.outAmount) / LAMPORTS_PER_SOL,
    tokenAddress: outputMint,
  };
}
