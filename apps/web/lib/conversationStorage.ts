interface TokenPreview {
  address: string;
  name: string;
  symbol: string;
  priceUsd: string;
  liquidity: number;
  marketCap: number | null;
  volume24h: number;
  priceChange24h: number;
  holders?: number;
  age: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  tokenPreview?: TokenPreview;
  decision?: {
    action: "buy" | "pass";
    token?: string;
    amount?: number;
  };
}

export interface StoredConversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "vibe-trader-conversations";
const MAX_CONVERSATIONS = 50;

export function getStoredConversations(): StoredConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveConversation(
  id: string,
  messages: Message[]
): StoredConversation | null {
  if (typeof window === "undefined" || messages.length === 0) return null;

  const conversations = getStoredConversations();
  const existingIndex = conversations.findIndex((c) => c.id === id);

  // Generate title from first user message
  const firstUserMessage = messages.find((m) => m.role === "user");
  const title = firstUserMessage
    ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "")
    : "New conversation";

  const now = Date.now();
  const conversation: StoredConversation = {
    id,
    title,
    messages,
    createdAt: existingIndex >= 0 ? conversations[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    conversations[existingIndex] = conversation;
  } else {
    conversations.unshift(conversation);
  }

  // Keep only the most recent conversations
  const trimmed = conversations.slice(0, MAX_CONVERSATIONS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return conversation;
  } catch {
    return null;
  }
}

export function getConversation(id: string): StoredConversation | null {
  const conversations = getStoredConversations();
  return conversations.find((c) => c.id === id) || null;
}

export function deleteConversation(id: string): boolean {
  if (typeof window === "undefined") return false;

  const conversations = getStoredConversations();
  const filtered = conversations.filter((c) => c.id !== id);

  if (filtered.length === conversations.length) return false;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

export function clearAllConversations(): boolean {
  if (typeof window === "undefined") return false;

  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
