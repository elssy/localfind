import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// For opaque session/reset/verification tokens — we store only the hash,
// never the raw token, so a DB leak doesn't hand out valid tokens.
export function generateRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}