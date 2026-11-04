import { eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { gameSaves, playerAccountLinks, playerAccounts, playerLoginAttempts } from "../../../db/schema";
import {
  checkPassword, createPasswordHash, getLinkedAccount, normalizeNickname, normalizeUsername,
  publicAccount, validGameState, validPassword,
} from "../../player-account";
import { calculateCombatPower } from "../../game-power";
import { newGameState } from "../../game-default";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
const respond = (body: unknown, status = 200) => Response.json(body, { status, headers });
const error = (message: string, status: number) => respond({ error: message }, status);

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return error("사이트 로그인이 필요합니다.", 401);
  try {
    const account = await getLinkedAccount(user.userId);
    return respond({ account: account ? publicAccount(account) : null });
  } catch (cause) {
    console.error("account-load-failed", cause);
    return error("계정 정보를 불러오지 못했습니다.", 500);
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return error("사이트 로그인이 필요합니다.", 401);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return error("허용되지 않은 요청입니다.", 403);
  let body: Record<string, unknown>;
  try {
    const serialized = await request.text();
    if (serialized.length > 160_000) return error("요청 데이터가 너무 큽니다.", 413);
    body = JSON.parse(serialized);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid");
  } catch { return error("요청 형식이 올바르지 않습니다.", 400); }

  const db = getDb();
  const now = Date.now();
  try {
    if (body.action === "logout") {
      await db.delete(playerAccountLinks).where(eq(playerAccountLinks.platformUserId, user.userId));
      return respond({ account: null });
    }

    if (body.action === "register") {
      const username = normalizeUsername(body.username);
      const nickname = normalizeNickname(body.nickname);
      if (!username) return error("아이디는 영문 소문자·숫자·밑줄 3~20자로 입력하세요.", 400);
      if (!nickname) return error("닉네임은 한글·영문·숫자·공백 2~16자로 입력하세요.", 400);
      if (!validPassword(body.password)) return error("비밀번호는 8~128자로 입력하세요.", 400);
      if (await getLinkedAccount(user.userId))
        return error("이미 연결된 게임 계정이 있습니다. 로그아웃 후 다시 시도하세요.", 409);
      const creator = await db.select({ id: playerAccounts.id }).from(playerAccounts)
        .where(eq(playerAccounts.creatorUserId, user.userId)).get();
      if (creator) return error("이미 이 사용자로 계정을 생성했습니다. 기존 아이디로 로그인하세요.", 409);
      if (await db.select({ id: playerAccounts.id }).from(playerAccounts)
        .where(eq(playerAccounts.username, username)).get()) return error("이미 사용 중인 아이디입니다.", 409);
      if (await db.select({ id: playerAccounts.id }).from(playerAccounts)
        .where(eq(playerAccounts.nickname, nickname)).get()) return error("이미 사용 중인 닉네임입니다.", 409);

      const accountId = crypto.randomUUID();
      const passwordFields = await createPasswordHash(body.password);
      const legacy = await db.select().from(gameSaves).where(eq(gameSaves.userId, user.userId)).get();
      // Browser-local progress cannot establish a trusted starting wallet.
      // Reuse only a pre-existing server save; otherwise seed at the server.
      const sourceState = legacy ? JSON.parse(legacy.payload) : newGameState(now);
      const bestPower = validGameState(sourceState) ? calculateCombatPower(sourceState) : 0;
      const profile = {
        id: accountId, username, nickname, creatorUserId: user.userId, ...passwordFields,
        bestPower, level: validGameState(sourceState) ? Math.max(1, Math.floor(Number(sourceState.level))) : 1,
        createdAt: now, updatedAt: now,
      };
      const insertAccount = db.insert(playerAccounts).values(profile);
      const insertLink = db.insert(playerAccountLinks).values({ platformUserId: user.userId, accountId, updatedAt: now });
      await db.batch([insertAccount, insertLink, db.insert(gameSaves).values({
        userId: accountId, payload: JSON.stringify(sourceState),
        revision: legacy?.revision || 1, updatedAt: now,
      })]);
      return respond({ account: publicAccount(profile), migrated: Boolean(legacy) });
    }

    if (body.action === "login") {
      const username = normalizeUsername(body.username);
      if (!username || typeof body.password !== "string" || body.password.length > 128)
        return error("아이디 또는 비밀번호를 확인하세요.", 400);
      const attempt = await db.select().from(playerLoginAttempts)
        .where(eq(playerLoginAttempts.platformUserId, user.userId)).get();
      if (attempt?.lockedUntil && attempt.lockedUntil > now)
        return error("로그인 시도가 너무 많습니다. 15분 뒤 다시 시도하세요.", 429);
      const account = await db.select().from(playerAccounts).where(eq(playerAccounts.username, username)).get();
      const valid = account ? await checkPassword(body.password, account.passwordSalt, account.passwordHash) : false;
      if (!valid) {
        const failures = (attempt?.failures || 0) + 1;
        await db.insert(playerLoginAttempts).values({
          platformUserId: user.userId, failures,
          lockedUntil: failures >= 5 ? now + 15 * 60_000 : 0, updatedAt: now,
        }).onConflictDoUpdate({
          target: playerLoginAttempts.platformUserId,
          set: { failures, lockedUntil: failures >= 5 ? now + 15 * 60_000 : 0, updatedAt: now },
        });
        return error(failures >= 5 ? "로그인 시도가 너무 많습니다. 15분 뒤 다시 시도하세요." : "아이디 또는 비밀번호가 일치하지 않습니다.", failures >= 5 ? 429 : 401);
      }
      await db.insert(playerAccountLinks).values({
        platformUserId: user.userId, accountId: account!.id, updatedAt: now,
      }).onConflictDoUpdate({
        target: playerAccountLinks.platformUserId, set: { accountId: account!.id, updatedAt: now },
      });
      await db.delete(playerLoginAttempts).where(eq(playerLoginAttempts.platformUserId, user.userId));
      return respond({ account: publicAccount(account!) });
    }
    return error("지원하지 않는 작업입니다.", 400);
  } catch (cause) {
    console.error("account-action-failed", cause);
    return error("계정 처리 중 오류가 발생했습니다. 잠시 후 다시 시도하세요.", 500);
  }
}
