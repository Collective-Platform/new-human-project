import { createHmac, randomBytes, randomInt } from "node:crypto";
import { env } from "@/src/env";

export function generateOtp(): string {
  // Full 6-digit space (000000–999999), zero-padded.
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashToken(raw: string): string {
  return createHmac("sha256", env.SESSION_SECRET).update(raw).digest("hex");
}

export function generateRawToken(): string {
  return randomBytes(32).toString("hex");
}

export function generateSessionId(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  const bytes = randomBytes(21);
  let id = "";
  for (let i = 0; i < 21; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return id;
}
