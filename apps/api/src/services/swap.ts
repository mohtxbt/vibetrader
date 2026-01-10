import { VersionedTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getWallet } from "./wallet.js";

const JUPITER_ULTRA_API = "https://api.jup.ag/ultra/v1";
const SOL_MINT = "So11111111111111111111111111111111111111112";

function getJupiterApiKey(): string {
  const apiKey = process.env.JUPITER_API_KEY;
  if (!apiKey) {
    throw new Error("JUPITER_API_KEY environment variable is required");
  }
  return apiKey;
}

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
}

export interface OrderResponse {
  transaction: string;
  requestId: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  swapType: string;
  slippageBps: number;
}

export interface SwapResult {
  signature: string;
  inputAmount: number;
  outputAmount: number;
  tokenAddress: string;
}

export async function getOrder(
  outputMint: string,
  amountSol: number
): Promise<OrderResponse> {
  const wallet = getWallet();
  const amountLamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

  console.log("[swap] getOrder called with:", {
    outputMint,
    outputMintLength: outputMint?.length,
    amountSol,
    amountLamports,
  });

  const params = new URLSearchParams({
    inputMint: SOL_MINT,
    outputMint,
    amount: amountLamports.toString(),
    taker: wallet.publicKey.toBase58(),
  });

  const url = `${JUPITER_ULTRA_API}/order?${params}`;
  console.log("[swap] Requesting order from:", url);

  const response = await fetch(url, {
    headers: {
      "x-api-key": getJupiterApiKey(),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[swap] Order request failed:", {
      status: response.status,
      statusText: response.statusText,
      errorText,
      outputMint,
    });
    throw new Error(`Failed to get order: ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

// Keep getQuote for backward compatibility
export async function getQuote(
  outputMint: string,
  amountSol: number
): Promise<SwapQuote> {
  const order = await getOrder(outputMint, amountSol);
  return {
    inputMint: order.inputMint,
    outputMint: order.outputMint,
    inAmount: order.inAmount,
    outAmount: order.outAmount,
    priceImpactPct: "0", // Ultra API doesn't provide this directly
  };
}

export async function executeSwap(
  outputMint: string,
  amountSol: number
): Promise<SwapResult> {
  console.log("[swap] executeSwap called with:", { outputMint, amountSol });

  const wallet = getWallet();

  // Get order with transaction
  const order = await getOrder(outputMint, amountSol);
  console.log("[swap] Order received:", {
    requestId: order.requestId,
    inAmount: order.inAmount,
    outAmount: order.outAmount,
    swapType: order.swapType,
  });

  // Deserialize and sign transaction
  const transactionBuffer = Buffer.from(order.transaction, "base64");
  const transaction = VersionedTransaction.deserialize(transactionBuffer);
  transaction.sign([wallet]);

  // Serialize signed transaction to base64
  const signedTransaction = Buffer.from(transaction.serialize()).toString("base64");

  // Execute order via Jupiter Ultra API
  const executeResponse = await fetch(`${JUPITER_ULTRA_API}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getJupiterApiKey(),
    },
    body: JSON.stringify({
      signedTransaction,
      requestId: order.requestId,
    }),
  });

  if (!executeResponse.ok) {
    const errorText = await executeResponse.text();
    throw new Error(`Failed to execute swap: ${executeResponse.statusText} - ${errorText}`);
  }

  const result = await executeResponse.json();

  if (result.status !== "Success") {
    throw new Error(`Swap execution failed with status: ${result.status}`);
  }

  return {
    signature: result.signature,
    inputAmount: amountSol,
    outputAmount: parseInt(order.outAmount) / LAMPORTS_PER_SOL,
    tokenAddress: outputMint,
  };
}
