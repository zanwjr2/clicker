// These fields are persisted only by resolveServerAction, never accepted from
// a browser-proposed save. Local UI preferences and paid upgrades still use
// the existing economy-transition validator.
const FIELDS = ["clicks", "kills", "runClicks", "runKills", "progress", "selectedMission", "enemyHp",
  "missionEntered", "awaitingNext", "battleOver", "timer", "timerStarted",
  "lastVictory", "tutorialGathers", "healsUsed", "skillsUsed", "specialStrikes",
  "combatUpdatedAt", "enemyAttackAt", "helperRemainder", "lastCombatActionAt",
  "chestsOpened", "runChestsOpened", "gearFound", "questIndex", "achievements",
  "dailyClaim", "arenaWins", "arenaAt", "specialWins", "specialMission", "specialAt",
  "caravan", "caravanCount", "runCaravanCount", "keys", "lastSupplyAt",
  "combatAuthority"];

function clearedMissions(state: Record<string, unknown>) {
  if (Array.isArray(state.clearedMissions)) return state.clearedMissions;
  // Trusted old saves predate the per-mission ledger. Their contiguous progress
  // is the only history they can legitimately import on their first new save.
  const count = Math.min(140, Math.max(0, Math.floor(Number(state.progress) || 0)));
  return Array.from({ length: count }, (_, i) => i);
}

export function hasServerOwnedChanges(before: Record<string, unknown>, after: Record<string, unknown>) {
  if (JSON.stringify(clearedMissions(before)) !== JSON.stringify(clearedMissions(after))) return true;
  if (FIELDS.some(key => JSON.stringify(after[key] ?? null) !==
    JSON.stringify(before[key] ?? null))) return true;
  const oldPrestige = (before.prestige || {}) as Record<string, unknown>;
  const newPrestige = (after.prestige || {}) as Record<string, unknown>;
  return Number(newPrestige.count) !== Number(oldPrestige.count);
}
