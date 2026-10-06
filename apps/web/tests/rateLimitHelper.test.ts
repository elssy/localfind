import { describe, it, expect, beforeAll } from "vitest";

// A stand-in for the limit service, so no network is used.
const fakeLimiter = (behaviour: "allow" | "deny" | "down") =>
  ({
    limit: async () => {
      if (behaviour === "down") throw new Error("service unavailable");
      return { success: behaviour === "allow" };
    },
  }) as never;

let withinLimit: typeof import("../lib/auth/rateLimit").withinLimit;

beforeAll(async () => {
  process.env.UPSTASH_REDIS_REST_URL = "https://example.invalid";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  ({ withinLimit } = await import("../lib/auth/rateLimit"));
});

describe("withinLimit", () => {
  it("passes on the limiter's answer when the service works", async () => {
    expect(await withinLimit(fakeLimiter("allow"), "k", { failOpen: false })).toBe(true);
    expect(await withinLimit(fakeLimiter("deny"), "k", { failOpen: true })).toBe(false);
  });

  it("lets reading carry on when the limit service is down", async () => {
    expect(await withinLimit(fakeLimiter("down"), "k", { failOpen: true })).toBe(true);
  });

  it("refuses writing when the limit service is down, so abuse cannot slip through", async () => {
    expect(await withinLimit(fakeLimiter("down"), "k", { failOpen: false })).toBe(false);
  });
});
