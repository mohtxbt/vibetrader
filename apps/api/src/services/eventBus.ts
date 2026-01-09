import { EventEmitter } from "events";

export type TokenEventType = "pitched" | "rejected" | "bought";

export interface TokenEventBase {
  type: TokenEventType;
  timestamp: number;
  tokenAddress: string;
  symbol: string;
  name: string;
  priceUsd: string;
  marketCap: number | null;
  liquidity: number;
}

export interface PitchedEvent extends TokenEventBase {
  type: "pitched";
}

export interface RejectedEvent extends TokenEventBase {
  type: "rejected";
  reason: string;
}

export interface BoughtEvent extends TokenEventBase {
  type: "bought";
  amountSol: number;
  amountToken: number;
  txSignature: string;
}

export type TokenEvent = PitchedEvent | RejectedEvent | BoughtEvent;

class TokenEventBus extends EventEmitter {
  private static instance: TokenEventBus;

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  static getInstance(): TokenEventBus {
    if (!TokenEventBus.instance) {
      TokenEventBus.instance = new TokenEventBus();
    }
    return TokenEventBus.instance;
  }

  emitTokenEvent(event: TokenEvent) {
    this.emit("tokenEvent", event);
  }

  onTokenEvent(listener: (event: TokenEvent) => void) {
    this.on("tokenEvent", listener);
    return () => this.off("tokenEvent", listener);
  }
}

export const eventBus = TokenEventBus.getInstance();
