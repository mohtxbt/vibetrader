import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const connection = new Connection(RPC_URL, "confirmed");

let keypair: Keypair | null = null;

export function initWallet(): Keypair {
  if (keypair) return keypair;

  const privateKey = process.env.SOLANA_PRIVATE_KEY?.trim();
  if (!privateKey || privateKey === "your-base58-private-key") {
    console.log("No valid SOLANA_PRIVATE_KEY found, generating new wallet...");
    keypair = Keypair.generate();
    console.log("Generated wallet address:", keypair.publicKey.toBase58());
    console.log("Private key (save this!):", bs58.encode(keypair.secretKey));
  } else {
    try {
      keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
      console.log("Loaded wallet:", keypair.publicKey.toBase58());
    } catch (err) {
      console.error("Invalid SOLANA_PRIVATE_KEY format. Must be base58-encoded.");
      console.log("Generating new wallet instead...");
      keypair = Keypair.generate();
      console.log("Generated wallet address:", keypair.publicKey.toBase58());
      console.log("Private key (save this!):", bs58.encode(keypair.secretKey));
    }
  }

  return keypair;
}

export function getWallet(): Keypair {
  if (!keypair) {
    return initWallet();
  }
  return keypair;
}

export function getPublicKey(): PublicKey {
  return getWallet().publicKey;
}

export async function getBalance(): Promise<number> {
  const wallet = getWallet();
  const balance = await connection.getBalance(wallet.publicKey);
  return balance / LAMPORTS_PER_SOL;
}

export async function signAndSendTransaction(
  transaction: Transaction
): Promise<string> {
  const wallet = getWallet();
  transaction.feePayer = wallet.publicKey;

  const latestBlockhash = await connection.getLatestBlockhash();
  transaction.recentBlockhash = latestBlockhash.blockhash;

  const signature = await sendAndConfirmTransaction(connection, transaction, [
    wallet,
  ]);

  return signature;
}

export function getConnection(): Connection {
  return connection;
}
