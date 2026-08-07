import argon2 from "argon2";
import crypto from "crypto";

export function hashPassword(password: string) {
  return argon2.hash(password, { type: argon2.argon2id });
}

export function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

// For opaque session/reset/verification tokens — we store only the hash,
// never the raw token, so a DB leak doesn't hand out valid tokens.
export function generateRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}