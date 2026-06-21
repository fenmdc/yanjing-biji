import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");

  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [method, salt, hash] = storedHash.split(":");
  if (method !== "scrypt" || !salt || !hash) return false;

  const candidate = scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, "hex");

  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}
