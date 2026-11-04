import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { playerAccountLinks, playerAccounts } from "../db/schema";

const hashIterations = 260_000;
const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string) {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) throw new Error("Invalid encoded bytes");
  return new Uint8Array(hex.match(/.{2}/g)!.map(pair => Number.parseInt(pair, 16)));
}

async function derivePassword(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: Uint8Array.from(salt).buffer, iterations: hashIterations },
    key, 256,
  );
  return bytesToHex(new Uint8Array(bits));
}

export async function createPasswordHash(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { passwordSalt: bytesToHex(salt), passwordHash: await derivePassword(password, salt) };
}

export async function checkPassword(password: string, saltHex: string, referenceHex: string) {
  const derived = hexToBytes(await derivePassword(password, hexToBytes(saltHex)));
  const reference = hexToBytes(referenceHex);
  if (derived.length !== reference.length) return false;
  let mismatch = 0;
  for (let i = 0; i < derived.length; i++) mismatch |= derived[i] ^ reference[i];
  return mismatch === 0;
}

export function normalizeUsername(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().toLowerCase();
  return /^[a-z0-9_]{3,20}$/.test(name) ? name : null;
}

export function normalizeNickname(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.normalize("NFC").trim().replace(/\s+/g, " ");
  return /^[가-힣a-zA-Z0-9_ ]{2,16}$/.test(name) ? name : null;
}

export function validPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && value.length <= 128;
}

export function validGameState(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const state = value as Record<string, unknown>;
  if (["gold", "essence", "shards", "level", "progress", "xp", "playerHp", "enemyHp"].some(
    field => typeof state[field] !== "number" || !Number.isFinite(state[field]) ||
      (state[field] as number) < 0 || (state[field] as number) > 1e15,
  )) return false;
  return JSON.stringify(state).length <= 125_000;
}

export async function getLinkedAccount(platformUserId: string) {
  const db = getDb();
  const link = await db.select({ accountId: playerAccountLinks.accountId })
    .from(playerAccountLinks).where(eq(playerAccountLinks.platformUserId, platformUserId)).get();
  if (!link) return null;
  return db.select({
    id: playerAccounts.id,
    username: playerAccounts.username,
    nickname: playerAccounts.nickname,
    bestPower: playerAccounts.bestPower,
    level: playerAccounts.level,
  }).from(playerAccounts).where(eq(playerAccounts.id, link.accountId)).get();
}

export function publicAccount(account: {
  id: string; username: string; nickname: string; bestPower: number; level: number;
}) {
  return { id: account.id, username: account.username, nickname: account.nickname,
    bestPower: account.bestPower, level: account.level };
}
