import { and, eq, sql } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { gameSaves, playerAccounts } from "../../../db/schema";
import { getLinkedAccount, validGameState } from "../../player-account";
import { calculateCombatPower } from "../../game-power";
import { validateGameTransition } from "../../game-integrity";
import { newGameState } from "../../game-default";
import { resolveServerAction } from "../../combat-engine";
import { hasServerOwnedChanges } from "../../server-owned-fields";
import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

const responseHeaders = { "Cache-Control": "no-store" };

function error(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: responseHeaders });
}

// A production secret identifies the Site owner allowed to use the isolated
// test save. Query params select the namespace; they never grant permission.
function canAdmin(email: string) {
  const configured = (env as unknown as { GAME_ADMIN_EMAIL?: string }).GAME_ADMIN_EMAIL;
  return !!configured && !!email && configured.trim().toLowerCase() === email.trim().toLowerCase();
}
function adminRequested(request: Request) {
  return new URL(request.url).searchParams.get("mode") === "admin";
}
function gameSaveId(userId: string, accountId: string | undefined, admin: boolean) {
  return admin ? `admin:${userId}` : accountId || userId;
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return error("로그인이 필요합니다.", 401);
  const allowed = canAdmin(user.email);
  const admin = adminRequested(request);
  if (admin && !allowed) return error("관리자 테스트 모드 권한이 없습니다.", 403);
  try {
    const db = getDb();
    const account = await getLinkedAccount(user.userId);
    const save = await db.select().from(gameSaves).where(eq(gameSaves.userId, gameSaveId(user.userId, account?.id, admin))).get();
    return Response.json({ state: save ? JSON.parse(save.payload) : admin ? newGameState(Date.now()) : null, revision: save?.revision ?? 0, updatedAt: save?.updatedAt ?? null, displayName: account?.nickname || user.displayName, accountId: account?.id || null, verifiedStorage: true, adminAvailable: allowed, adminMode: admin }, { headers: responseHeaders });
  } catch (cause) {
    console.error("game-load-failed", cause);
    return error("저장 데이터를 불러오지 못했습니다.", 500);
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return error("로그인이 필요합니다.", 401);
  const admin = adminRequested(request);
  if (admin && !canAdmin(user.email)) return error("관리자 테스트 모드 권한이 없습니다.", 403);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return error("허용되지 않은 요청입니다.", 403);
  let body: { state?: unknown; revision?: unknown; combatPower?: unknown; action?: unknown; id?: unknown };
  try {
    const raw = await request.text();
    if (raw.length > 160_000) return error("저장 요청이 너무 큽니다.", 413);
    body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid");
  } catch { return error("잘못된 저장 요청입니다.", 400); }
  if (typeof body.revision !== "number" || !Number.isSafeInteger(body.revision) || body.revision < 0) return error("올바른 저장 버전이 필요합니다.", 400);
  // Commands and snapshots share the same save row and optimistic revision.
  // The browser never supplies a damage amount, loot, result or new balance.
  if (body.action != null) {
    if (typeof body.action !== "string" || body.action.length > 32 ||
      (body.id != null && typeof body.id !== "string" && typeof body.id !== "number"))
      return error("올바른 게임 명령이 필요합니다.", 400);
    try {
      const db = getDb();
      const account = await getLinkedAccount(user.userId);
      const saveId = gameSaveId(user.userId, account?.id, admin);
      const existing = await db.select().from(gameSaves).where(eq(gameSaves.userId, saveId)).get();
      if ((existing?.revision || 0) !== body.revision)
        return Response.json({ error: "다른 기기에서 기록이 변경되었습니다.",
          state: existing ? JSON.parse(existing.payload) : null, revision: existing?.revision || 0 },
        { status: 409, headers: responseHeaders });
      const now = Date.now();
      const previous = existing ? JSON.parse(existing.payload) : newGameState(now);
      const outcome = resolveServerAction(previous, { type: body.action,
        id: body.id as string | number | undefined }, now, { infiniteStamina: admin });
      if (!outcome.ok) return Response.json({ error: "실행할 수 없는 명령입니다.",
        code: outcome.code, state: previous, revision: existing?.revision || 0 },
      { status: 422, headers: responseHeaders });
      const state = outcome.state;
      const revision = (existing?.revision || 0) + 1;
      if (existing) {
        const changed = await db.update(gameSaves).set({
          payload: JSON.stringify(state), revision, updatedAt: now,
        }).where(and(eq(gameSaves.userId, saveId), eq(gameSaves.revision, existing.revision))).returning();
        if (!changed.length) return error("동시 저장 충돌이 발생했습니다.", 409);
      } else {
        const inserted = await db.insert(gameSaves).values({
          userId: saveId, payload: JSON.stringify(state), revision, updatedAt: now,
        }).onConflictDoNothing().returning();
        if (!inserted.length) return error("동시 저장 충돌이 발생했습니다.", 409);
      }
      // Most ticks and attacks do not change power; avoid a leaderboard write
      // for every frame while preserving new level/equipment milestones.
      // Regular combat changes HP/loot, not the power formula, unless it
      // crosses a level milestone. Upgrades, research and chapter changes
      // still take the complete leaderboard path below.
      const ordinaryCombat = ["attack", "attackBurst", "skill", "gather", "heal", "tick"].includes(body.action);
      if (!admin && account && (!ordinaryCombat || state.level !== previous.level)) {
        const power = calculateCombatPower(state);
        if (power > calculateCombatPower(previous) || state.level > previous.level)
          await db.update(playerAccounts).set({
            bestPower: sql`max(${playerAccounts.bestPower}, ${power})`,
            level: sql`max(${playerAccounts.level}, ${Math.max(1, Math.floor(state.level))})`,
            updatedAt: now,
          }).where(eq(playerAccounts.id, account.id));
      }
      return Response.json({ state, revision, updatedAt: now, verified: true,
        processed: "processed" in outcome ? outcome.processed : body.action === "attack" ? 1 : undefined },
        { headers: responseHeaders });
    } catch (cause) {
      console.error("server-game-action-failed", cause);
      return error("서버 명령 처리에 실패했습니다.", 500);
    }
  }
  if (!validGameState(body.state)) return error("게임 데이터가 올바르지 않거나 너무 큽니다.", 400);
  const state = body.state;
  const serialized = JSON.stringify(state);

  try {
    const db = getDb();
    const account = await getLinkedAccount(user.userId);
    const saveId = gameSaveId(user.userId, account?.id, admin);
    const existing = await db.select().from(gameSaves).where(eq(gameSaves.userId, saveId)).get();
    const now = Date.now();
    // The initial guest browser's stamina timestamp predates this request.
    // A zero-time trusted baseline avoids rejecting an untouched first save;
    // the initial full stamina prevents any free regeneration from this choice.
    const previousState = existing ? JSON.parse(existing.payload) : newGameState(0);
    if (hasServerOwnedChanges(previousState, state)) {
      return Response.json({ error: "전투 및 보상 기록은 서버 명령으로만 변경할 수 있습니다.",
        code: "server-owned-field", state: previousState, revision: existing?.revision || 0 },
      { status: 422, headers: responseHeaders });
    }
    const proof = validateGameTransition(previousState, state, existing ? now - existing.updatedAt : 0, now);
    if (!proof.ok) {
      console.warn("game-integrity-rejected", { code: proof.code, hasAccount: !!account });
      return Response.json({
        error: "허용되지 않은 게임 데이터 변경을 감지했습니다. 서버에 저장된 정상 기록으로 복구합니다.",
        code: proof.code, state: previousState, revision: existing?.revision || 0,
      }, { status: 422, headers: responseHeaders });
    }
    const recordPower = async () => {
      if (!account || admin) return;
      await db.update(playerAccounts).set({
        bestPower: sql`max(${playerAccounts.bestPower}, ${calculateCombatPower(state)})`,
        level: sql`max(${playerAccounts.level}, ${Math.max(1, Math.floor(state.level as number))})`,
        updatedAt: Date.now(),
      }).where(eq(playerAccounts.id, account.id));
    };
    if (!existing) {
      if (body.revision !== 0) return error("저장 기록이 변경되었습니다. 다시 불러오세요.", 409);
      const row = await db.insert(gameSaves).values({ userId: saveId, payload: serialized, revision: 1, updatedAt: now }).onConflictDoNothing().returning();
      if (!row.length) return error("다른 기기에서 저장 기록이 생성되었습니다.", 409);
      await recordPower();
      return Response.json({ revision: 1, updatedAt: now }, { headers: responseHeaders });
    }
    if (existing.revision !== body.revision) return error("다른 기기에서 게임 데이터가 변경되었습니다. 새로고침해 주세요.", 409);
    const nextRevision = existing.revision + 1;
    const updated = await db.update(gameSaves).set({ payload: serialized, revision: nextRevision, updatedAt: now })
      .where(and(eq(gameSaves.userId, saveId), eq(gameSaves.revision, existing.revision))).returning();
    if (!updated.length) return error("저장 충돌이 발생했습니다. 다시 불러오세요.", 409);
    await recordPower();
    return Response.json({ revision: nextRevision, updatedAt: now }, { headers: responseHeaders });
  } catch (cause) {
    console.error("game-save-failed", cause);
    return error("서버 저장에 실패했습니다.", 500);
  }
}

// A reset is the one intentional exception to monotonic progression.
// It is an explicit authenticated operation, never inferred from a client
// snapshot; the fresh balances and counters come entirely from the server.
export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return error("로그인이 필요합니다.", 401);
  const admin = adminRequested(request);
  if (admin && !canAdmin(user.email)) return error("관리자 테스트 모드 권한이 없습니다.", 403);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return error("허용되지 않은 요청입니다.", 403);
  let body: { revision?: unknown };
  try { body = await request.json(); } catch { return error("잘못된 초기화 요청입니다.", 400); }
  if (typeof body.revision !== "number" || !Number.isSafeInteger(body.revision) || body.revision < 0)
    return error("올바른 저장 버전이 필요합니다.", 400);
  try {
    const db = getDb();
    const account = await getLinkedAccount(user.userId);
    const saveId = gameSaveId(user.userId, account?.id, admin);
    const existing = await db.select().from(gameSaves).where(eq(gameSaves.userId, saveId)).get();
    const now = Date.now();
    const state = newGameState(now);
    const serialized = JSON.stringify(state);
    if (!existing) {
      if (body.revision !== 0) return error("저장 기록이 변경되었습니다.", 409);
      const row = await db.insert(gameSaves).values({
        userId: saveId, payload: serialized, revision: 1, updatedAt: now,
      }).onConflictDoNothing().returning();
      if (!row.length) return error("다른 기기에서 저장 기록이 생성되었습니다.", 409);
      if (account && !admin) await db.update(playerAccounts).set({
        bestPower: calculateCombatPower(state), level: 1, updatedAt: now,
      }).where(eq(playerAccounts.id, account.id));
      return Response.json({ state, revision: 1, updatedAt: now }, { headers: responseHeaders });
    }
    if (existing.revision !== body.revision) return error("다른 기기에서 저장 기록이 변경되었습니다.", 409);
    const revision = existing.revision + 1;
    const changed = await db.update(gameSaves).set({
      payload: serialized, revision, updatedAt: now,
    }).where(and(eq(gameSaves.userId, saveId), eq(gameSaves.revision, existing.revision))).returning();
    if (!changed.length) return error("저장 충돌이 발생했습니다.", 409);
    if (account && !admin) await db.update(playerAccounts).set({
      bestPower: calculateCombatPower(state), level: 1, updatedAt: now,
    }).where(eq(playerAccounts.id, account.id));
    return Response.json({ state, revision, updatedAt: now }, { headers: responseHeaders });
  } catch (cause) {
    console.error("game-reset-failed", cause);
    return error("서버 초기화에 실패했습니다.", 500);
  }
}
