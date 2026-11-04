import { and, asc, count, desc, eq, gt, lt, or } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { playerAccounts } from "../../../db/schema";
import { getLinkedAccount } from "../../player-account";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "사이트 로그인이 필요합니다." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const db = getDb();
    const [players, self, total] = await Promise.all([
      db.select({
        id: playerAccounts.id, nickname: playerAccounts.nickname,
        power: playerAccounts.bestPower, level: playerAccounts.level,
      }).from(playerAccounts).orderBy(desc(playerAccounts.bestPower), asc(playerAccounts.createdAt), asc(playerAccounts.id)).limit(50),
      getLinkedAccount(user.userId),
      db.select({ value: count() }).from(playerAccounts).get(),
    ]);
    let ownRank: number | null = null;
    if (self) {
      const ownRecord = await db.select({ createdAt: playerAccounts.createdAt })
        .from(playerAccounts).where(eq(playerAccounts.id, self.id)).get();
      if (ownRecord) {
        const ahead = await db.select({ value: count() }).from(playerAccounts).where(or(
          gt(playerAccounts.bestPower, self.bestPower),
          and(eq(playerAccounts.bestPower, self.bestPower), lt(playerAccounts.createdAt, ownRecord.createdAt)),
          and(eq(playerAccounts.bestPower, self.bestPower), eq(playerAccounts.createdAt, ownRecord.createdAt), lt(playerAccounts.id, self.id)),
        )).get();
        ownRank = (ahead?.value || 0) + 1;
      }
    }
    return Response.json({
      players: players.map((player, index) => ({
        rank: index + 1, nickname: player.nickname, power: player.power, level: player.level,
        isMe: player.id === self?.id,
      })),
      total: total?.value || 0,
      me: self ? { rank: ownRank, nickname: self.nickname, power: self.bestPower, level: self.level } : null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("leaderboard-failed", cause);
    return Response.json({ error: "랭킹을 불러오지 못했습니다." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
