import type { Request, Response, NextFunction } from "express";
import { getRateLimitInfo, incrementRateLimit } from "../db/rateLimits.js";

/**
 * Get the reset time (midnight UTC of the next day)
 */
function getResetTime(): string {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

/**
 * Middleware that checks and enforces rate limits.
 * Must be used after extractUserIdentifier middleware.
 */
export async function checkRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userIdentifier, identifierType } = req;

    if (!userIdentifier || !identifierType) {
      console.error("Rate limit middleware: Missing user identifier");
      return res.status(500).json({ error: "Internal server error" });
    }

    // Check current rate limit status
    const rateLimitInfo = await getRateLimitInfo(userIdentifier, identifierType);

    if (rateLimitInfo.isLimited) {
      // User has exceeded their limit
      console.log(
        `Rate limit exceeded for ${identifierType}: ${userIdentifier} ` +
        `(${rateLimitInfo.count}/${rateLimitInfo.limit})`
      );

      return res.status(429).json({
        error: "Rate limit exceeded",
        message: identifierType === "user"
          ? "You have used all 20 interactions for today. Resets at midnight UTC."
          : "You have used all 2 free interactions. Sign in for 20 interactions per day!",
        rateLimit: {
          limit: rateLimitInfo.limit,
          remaining: 0,
          used: rateLimitInfo.count,
          resetsAt: getResetTime(),
        },
      });
    }

    // Increment the rate limit counter
    const updatedInfo = await incrementRateLimit(userIdentifier, identifierType);

    // Attach rate limit info to response locals for use in route handlers
    res.locals.rateLimit = {
      limit: updatedInfo.limit,
      remaining: updatedInfo.remaining,
      used: updatedInfo.count,
      resetsAt: getResetTime(),
    };

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", updatedInfo.limit);
    res.setHeader("X-RateLimit-Remaining", updatedInfo.remaining);
    res.setHeader("X-RateLimit-Reset", getResetTime());

    // Log to terminal
    console.log(
      `Rate limit: ${identifierType} ${userIdentifier} - ` +
      `${updatedInfo.count}/${updatedInfo.limit} (${updatedInfo.remaining} remaining)`
    );

    next();
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Fail open - allow the request if rate limiting fails
    next();
  }
}
