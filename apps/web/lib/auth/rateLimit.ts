import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Login is counted per internet connection AND per email, so a shared
// connection never locks out other people, and one account cannot be guessed at.
export const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "ratelimit:login",
});

// Counted per internet connection only. Many people can share one connection
// (mobile carriers, office Wi-Fi), so this is set higher than a single person
// would ever need, while still stopping a script from mass creating accounts.
export const registerLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  prefix: "ratelimit:register",
});

export const passwordResetLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "ratelimit:reset",
});

// The limits below are counted per signed-in person, not per connection.

// Browsing providers. Generous, but stops a script copying the whole directory.
export const searchLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "ratelimit:search",
});

// Posting new requests. A real person posts a handful a day.
export const jobLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  prefix: "ratelimit:job",
});

// Sending bids.
export const bidLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 h"),
  prefix: "ratelimit:bid",
});

// If the limit service itself is down, reading is allowed (people can still browse)
// but writing is refused (so abuse cannot slip through while the guard is off).
export async function withinLimit(
  limiter: Ratelimit,
  key: string,
  options: { failOpen: boolean }
): Promise<boolean> {
  try {
    const { success } = await limiter.limit(key);
    return success;
  } catch {
    return options.failOpen;
  }
}
