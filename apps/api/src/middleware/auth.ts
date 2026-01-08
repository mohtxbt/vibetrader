import { clerkMiddleware, getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

// Re-export Clerk middleware for use in index.ts
export { clerkMiddleware };

// Extend Express Request type to include auth info
declare global {
  namespace Express {
    interface Request {
      userIdentifier?: string;
      identifierType?: "user" | "ip" | "session";
    }
  }
}

/**
 * Middleware that extracts user identifier for rate limiting.
 * Works for both authenticated and anonymous users.
 */
export function extractUserIdentifier(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const auth = getAuth(req);

  if (auth?.userId) {
    // Authenticated user - use Clerk userId
    req.userIdentifier = auth.userId;
    req.identifierType = "user";
  } else {
    // Anonymous user - use IP address
    const forwardedFor = req.headers["x-forwarded-for"];
    const ip = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(",")[0]?.trim() || req.ip || "unknown";

    req.userIdentifier = `ip:${ip}`;
    req.identifierType = "ip";
  }

  next();
}
