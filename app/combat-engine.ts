import { calculateCombatStats } from "./game-power.ts";
import { newGameState } from "./game-default.ts";

// Authoritative gameplay actions. Only a small action name and a selection ID
// cross the network; the database state, server clock and server RNG decide
// damage, experience, loot, energy and rewards.
type Game = Record<string, any>;
const HP = [1, 1.35, 1.6, 2.1, 2.6, 2.8, 2.2, 3.2, 3.9, 7.2];
const GOLD = [300, 380, 460, 720, 630, 760, 850, 900, 1150, 1650];
const XP = [170, 210, 250, 310, 350, 420, 370, 480, 560, 690];
const CHAPTERS = [
  { hp: 1, gold: 1, xp: 1, incoming: 1 },
  { hp: 1, gold: 1.12, xp: 1, incoming: 1.15 },
  { hp: 1, gold: 1, xp: 1, incoming: 1, armorHp: 1.15, loot: .06 },
  { hp: 1.08, gold: 1, xp: 1, incoming: 1, cargoGold: 1.3 },
  { hp: 1, gold: 1, xp: 1, incoming: 1.25, essence: 2 },
  { hp: 1, gold: 1, xp: 1, incoming: 1, bossRage: 1.3, shard: 1 },
  { hp: 1, gold: 1, xp: 1.2, incoming: 1, speedLimit: 50 },
] as Array<Record<string, number>>;
const GEAR = [
  ["weapon", "🗡️", "탐험 단검", 8], ["weapon", "🏹", "강화 장궁", 11],
  ["weapon", "🔱", "정예 장창", 16], ["armor", "🧥", "방호복", 24],
  ["armor", "🛡️", "철제 갑옷", 35], ["armor", "🥋", "보강된 외투", 28],
  ["relic", "💍", "황금 반지", 5], ["relic", "📿", "교역 목걸이", 8],
  ["relic", "🧭", "항해 나침반", 11],
] as const;
const RARITIES = [
  ["일반", "common", 1], ["고급", "uncommon", 1.7],
  ["희귀", "rare", 2.6], ["영웅", "epic", 4.5], ["전설", "legendary", 8],
] as const;
const QUESTS: Array<[string, number, number, number]> = [
  ["runClicks", 15, 250, 3], ["runKills", 2, 450, 5],
  ["runPurchases", 3, 750, 7], ["runKills", 10, 1600, 12],
  ["runClicks", 75, 2500, 20], ["runKills", 20, 4200, 30],
  ["runChestsOpened", 3, 5600, 35], ["runModuleResearch", 3, 6200, 45],
  ["runKills", 40, 10500, 70], ["runClicks", 500, 18000, 90],
  ["runPurchases", 30, 22000, 120], ["runCaravanCount", 5, 45000, 180],
];
const ACHIEVEMENTS: Record<string, [string, number, number]> = {
  first: ["kills", 1, 150], hunter: ["clicks", 100, 650],
  merchant: ["purchases", 10, 950], veteran: ["kills", 10, 1200],
  champion: ["arenaWins", 3, 1500], legend: ["kills", 60, 7500],
  archivist: ["gearFound", 10, 3000], engineer: ["moduleResearch", 10, 7200],
  resurrection: ["prestigeCount", 1, 13000], merchant2: ["chestsOpened", 20, 12000],
  caravanner: ["caravanCount", 10, 21000], shadow: ["specialWins", 10, 32000],
};
const CARAVANS = [
  { duration: 90_000, cost: 350, gold: 1050, essence: 12, level: 1 },
  { duration: 240_000, cost: 2200, gold: 6700, essence: 36, level: 8 },
  { duration: 600_000, cost: 12000, gold: 38500, essence: 110, level: 18 },
];
const num = (v: unknown) => typeof v === "number" && Number.isFinite(v) ? v : 0;
const random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
const stat = (o: any, k: string) => num(o?.[k]);
const stage = (s: Game) => Number.isSafeInteger(s.selectedMission) &&
  s.selectedMission >= 0 && s.selectedMission < Math.floor(num(s.progress))
  ? s.selectedMission : Math.floor(num(s.progress));
const chapter = (s: Game) => Math.floor(stage(s) / 10);
const index = (s: Game) => stage(s) % 10;
const rule = (s: Game) => CHAPTERS[Math.min(6, Math.floor(chapter(s) / 2))];
const cap = (s: Game) => 72 + (Math.max(1, num(s.level)) - 1) * 2;
const stCost = (s: Game) => Math.max(2, 5 + Math.floor(chapter(s) / 4) - stat(s.items, "staminaEfficiency"));
const maxEnemy = (s: Game) => Math.floor(320 * Math.pow(1.38, chapter(s)) * HP[index(s)] *
  rule(s).hp * ([4, 8].includes(index(s)) ? rule(s).armorHp || 1 : 1));
const speedLimit = (s: Game) => rule(s).speedLimit || 60;
const bonuses = (s: Game) => {
  const t = s.technologies || {};
  const relicId = s.equipped?.relic;
  const relic = (s.inventory || []).find((g: any) => g.id === relicId);
  const gold = 1 + stat(s.items, "fortune") * .15 + stat(s.items, "merchant") * .08 +
    stat(s.modules, "treasure") * .08 + stat(s.prestige?.perks, "wealth") * .15 +
    num(relic?.value) * .01 + (t.forage ? .1 : 0) + (t.irrigation ? .15 : 0) +
    (t.rail ? .2 : 0) + (t.startrade ? .35 : 0) +
    (num(s.elixirUntil) > Date.now() ? 1 : 0);
  const xp = 1 + stat(s.items, "wisdom") * .15 + stat(s.modules, "insight") * .1 +
    stat(s.prestige?.perks, "memory") * .15 + (t.computing ? .2 : 0);
  return { gold, xp };
};
function refreshStamina(s: Game, now: number) {
  if (s.stamina >= cap(s)) { s.stamina = cap(s); s.staminaUpdatedAt = now; return; }
  const recovery = stat(s.items, "staminaRecovery");
  const interval = 90_000 - recovery * 5000;
  const ticks = Math.floor(Math.max(0, now - num(s.staminaUpdatedAt)) / interval);
  if (ticks > 0) {
    s.stamina = Math.min(cap(s), num(s.stamina) + ticks * (1 + recovery));
    s.staminaUpdatedAt = s.stamina >= cap(s) ? now : num(s.staminaUpdatedAt) + ticks * interval;
  }
}
function grantXp(s: Game, amount: number) {
  s.xp += Math.floor(amount * bonuses(s).xp);
  let levels = 0;
  while (s.xp >= Math.floor(650 * Math.pow(1.125, s.level - 1)) && levels < 100) {
    s.xp -= Math.floor(650 * Math.pow(1.125, s.level - 1));
    s.level++; levels++;
    s.gold += 60 + s.level * 22;
    s.playerHp = calculateCombatStats(s).maxHp;
  }
  if (levels) s.stamina = Math.min(cap(s), s.stamina + levels * 3);
}
function addGear(s: Game, tier = 0) {
  if (s.inventory.length >= 200) return null;
  const base = GEAR[Math.floor(random() * GEAR.length)];
  const luck = stat(s.items, "prospector") * .7 + stat(s.modules, "fortune") * 1.5 + tier * 7;
  const roll = random() * 100 - luck;
  const rarity = RARITIES[roll < .3 ? 4 : roll < 3 ? 3 : roll < 15 ? 2 : roll < 42 ? 1 : 0];
  const gear = { id: `item-${crypto.randomUUID()}`, slot: base[0], icon: base[1],
    name: base[2], rarity: rarity[1], rank: rarity[0],
    value: Math.max(1, Math.floor((base[3] + chapter(s) * 3 + tier * 4) * rarity[2])), upgrade: 0 };
  s.inventory.push(gear); s.gearFound++;
  if (!s.equipped[gear.slot]) s.equipped[gear.slot] = gear.id;
  return gear;
}
function startMission(s: Game, now: number, infiniteStamina = false) {
  if (s.awaitingNext || s.battleOver) return false;
  if (s.missionEntered) return true;
  if (!infiniteStamina && s.stamina < stCost(s)) return false;
  if (!infiniteStamina) s.stamina -= stCost(s);
  s.missionEntered = true; s.timerStarted = true;
  s.enemyAttackAt = now; s.combatUpdatedAt = now;
  return true;
}
function nextDay(s: Game, now: number) {
  const day = new Date(now).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  if (s.eventDay !== day) {
    s.eventDay = day; s.eventStartKills = s.kills; s.eventClaimed = false;
  }
  return day;
}
function win(s: Game, now: number) {
  if (s.awaitingNext) return;
  nextDay(s, now);
  s.awaitingNext = true; s.timerStarted = false; s.enemyHp = 0;
  const speedBonus = [2, 7].includes(index(s)) && s.timer >= speedLimit(s) - 20 ? 1.4 : 1;
  const c = chapter(s), i = index(s), r = rule(s), multiplier = bonuses(s).gold;
  const goldBase = Math.round(GOLD[i] * Math.pow(1.42, c) * multiplier * r.gold *
    ([3, 6].includes(i) ? r.cargoGold || 1 : 1));
  const bossGold = i === 9 ? Math.round(600 * Math.pow(1.42, c) * multiplier) : 0;
  const replay = stage(s) < num(s.progress);
  const gold = replay ? Math.max(1, Math.floor(goldBase * speedBonus * .25))
    : Math.floor((goldBase + bossGold) * speedBonus);
  const xp = Math.max(1, Math.floor(Math.floor(XP[i] * Math.pow(1.28, c) * r.xp) * speedBonus * (replay ? .25 : 1)));
  const essence = replay ? 1 : 4 + c * 2 + stat(s.items, "reactor") * 2 + (r.essence || 0);
  const shard = !replay && i === 9 ? 1 + (r.shard || 0) : 0;
  s.gold += gold; s.essence += essence; s.shards += shard; s.kills++; s.runKills++;
  const chance = Math.min(.85, .19 + stat(s.items, "prospector") * .05 +
    stat(s.modules, "fortune") * .04 + (r.loot || 0));
  const foundGear = !replay && (i === 9 || random() < chance) ? addGear(s, i === 9 ? 2 : 0) : null;
  const foundKey = !replay && ([3, 6, 9].includes(i) || random() < .18 + stat(s.items, "prospector") * .04);
  if (foundKey) s.keys[i === 9 && c >= 2 ? "silver" : "bronze"]++;
  if (!replay && i === 9) s.stamina = Math.min(cap(s), s.stamina + 12);
  grantXp(s, xp);
  s.lastVictory = { gold, xp, essence, shard, foundKey, foundGear: foundGear ?
    { icon: foundGear.icon, rank: foundGear.rank } : null, speedBonus, replay };
}
function takeDamage(s: Game, damage: number, now: number) {
  if (s.awaitingNext || s.battleOver) return;
  s.enemyHp = Math.max(0, num(s.enemyHp) - damage);
  if (s.enemyHp === 0) win(s, now);
}
function tick(s: Game, now: number) {
  refreshStamina(s, now);
  if (s.specialMission && now >= s.specialMission.finish) {
    s.specialMission = null; s.specialAt = now + 45_000;
  }
  if (!s.missionEntered || s.awaitingNext || s.battleOver) {
    s.combatUpdatedAt = now;
    return;
  }
  const last = num(s.combatUpdatedAt) || now;
  const elapsed = Math.max(0, now - last);
  const duration = Math.min(3000, elapsed);
  if ([2, 7].includes(index(s)) && s.timerStarted && elapsed >= num(s.timer) * 1000) {
    s.timer = 0; s.battleOver = true; s.combatUpdatedAt = now;
    return; // An expired mission cannot win from delayed background DPS.
  }
  const stats = calculateCombatStats(s);
  const reduction = [4, 8].includes(index(s)) ?
    Math.min(1, .8 + stat(s.items, "strike") * .08) : 1;
  const total = num(s.helperRemainder) + stats.dps * reduction * duration / 1000;
  const dealt = Math.floor(total);
  s.helperRemainder = total - dealt;
  if (dealt > 0) takeDamage(s, dealt, now);
  if (!s.awaitingNext && [2, 7].includes(index(s)) && s.timerStarted) {
    // The timer is wall-clock based even when the tab is backgrounded.
    // Only automatic DPS is capped at three seconds per reconciliation.
    s.timer = Math.max(0, num(s.timer) - elapsed / 1000);
    if (s.timer === 0) s.battleOver = true;
  }
  if (!s.awaitingNext && !s.battleOver) {
    const enraged = index(s) === 9 && s.enemyHp / maxEnemy(s) <= .35;
    const delay = enraged ? 1850 : 2500;
    const previous = num(s.enemyAttackAt) || now;
    const hits = Math.min(3, Math.floor(Math.max(0, now - previous) / delay));
    if (hits) {
      s.enemyAttackAt = previous + hits * delay;
      const i = index(s), phase = [5, 8].includes(i) ? 1.2 : i === 9 ?
        1.4 * (enraged ? 1.5 * (rule(s).bossRage || 1) : 1) : 1;
      const damage = Math.max(1, Math.ceil((5 + chapter(s) * 3) * phase * rule(s).incoming) -
        stat(s.items, "barrier") * 2);
      s.playerHp = Math.max(0, s.playerHp - hits * damage);
      if (s.playerHp === 0) s.battleOver = true;
    }
  }
  s.combatUpdatedAt = now;
}

export type ServerAction = { type: string; id?: string | number };
type ServerActionResult = { ok: true; state: Game; code: string; processed?: number } |
  { ok: false; code: string };
export function resolveServerAction(previous: Game, command: ServerAction, now = Date.now(),
  options: { infiniteStamina?: boolean } = {}): ServerActionResult {
  // Apply a small burst in one database transaction. The requested count is
  // never trusted as earned attacks: only the first batch may contain six
  // immediate starter hits; subsequent hits require 75ms of server time each.
  if (command.type === "attackBurst") {
    const requested = command.id;
    if (typeof requested !== "number" || !Number.isSafeInteger(requested) || requested < 1 || requested > 6)
      return { ok: false as const, code: "invalid-burst" };
    const lastHitAt = num(previous.lastCombatActionAt);
    const allowance = lastHitAt ? Math.floor(Math.max(0, now - lastHitAt) / 75) : 6;
    if (allowance <= 0) return { ok: false as const, code: "action-rate-limit" };
    const maximum = Math.min(requested, allowance);
    let accepted = 0;
    let authoritative = previous;
    for (let i = 0; i < maximum; i++) {
      const actionAt = now - (maximum - 1 - i) * 75;
      const outcome = resolveServerAction(authoritative, { type: "attack" }, actionAt, options);
      if (!outcome.ok) {
        if (!accepted) return outcome;
        break;
      }
      authoritative = outcome.state;
      accepted++;
      if (authoritative.awaitingNext || authoritative.battleOver) break;
    }
    return { ok: true as const, state: authoritative,
      code: "server-authoritative-burst", processed: accepted };
  }
  let s: Game = structuredClone(previous);
  // Older saves predate the server-command counters. Fill only missing fields
  // from previously accepted server data; never accept a browser-supplied
  // migration or arbitrary imported balance.
  s.prestige = s.prestige || { count: 0, points: 0, perks: {} };
  s.prestige.perks = s.prestige.perks || {};
  for (const [run, lifetime] of [
    ["runClicks", "clicks"], ["runKills", "kills"], ["runPurchases", "purchases"],
    ["runChestsOpened", "chestsOpened"], ["runModuleResearch", "moduleResearch"],
    ["runCaravanCount", "caravanCount"],
  ]) if (s[run] == null) s[run] = s.prestige.count > 0 ? 0 : num(s[lifetime]);
  for (const key of ["tutorialGathers", "healsUsed", "skillsUsed", "specialStrikes",
    "helperRemainder", "enemyAttackAt", "combatUpdatedAt", "lastCombatActionAt"])
    if (!Number.isFinite(s[key])) s[key] = 0;
  s.keys = { bronze: 0, silver: 0, gold: 0, ...(s.keys || {}) };
  s.consumables = { bomb: 0, potion: 0, elixir: 0, ...(s.consumables || {}) };
  s.inventory = Array.isArray(s.inventory) ? s.inventory : [];
  s.achievements = Array.isArray(s.achievements) ? s.achievements : [];
  s.equipped = { weapon: null, armor: null, relic: null, ...(s.equipped || {}) };
  const type = command.type, choice = command.id;
  const limited = new Set(["attack", "skill", "heal", "gather", "bomb", "potion", "elixir", "strikeSpecial"]);
  if (limited.has(type) && num(s.lastCombatActionAt) && now - num(s.lastCombatActionAt) < 65)
    return { ok: false as const, code: "action-rate-limit" };
  tick(s, now);
  if (options.infiniteStamina) {
    s.stamina = cap(s);
    s.staminaUpdatedAt = now;
  }
  const stats = () => calculateCombatStats(s);
  if (type === "tick") { /* Time is earned, not provided by the browser. */ }
  else if (type === "attack") {
    if (!startMission(s, now, options.infiniteStamina)) return { ok: false as const, code: "mission-unavailable" };
    const reduction = [4, 8].includes(index(s)) ?
      Math.min(1, .8 + stat(s.items, "strike") * .08) : 1;
    const chance = Math.min(.65, stat(s.items, "critical") * .03 +
      (s.technologies?.gunpowder ? .05 : 0));
    s.clicks++; s.runClicks++;
    takeDamage(s, Math.max(1, Math.floor(stats().attack * reduction *
      (random() < chance ? 2 : 1))), now);
    grantXp(s, 18 + chapter(s) * 3);
  } else if (type === "skill") {
    if (s.essence < 25 || !startMission(s, now, options.infiniteStamina))
      return { ok: false as const, code: "insufficient-magic-or-stamina" };
    s.essence -= 25; s.skillsUsed++;
    takeDamage(s, 60 + stats().attack * 7 + stats().dps * 2, now);
    grantXp(s, 80);
  } else if (type === "heal") {
    if (s.awaitingNext || s.battleOver || s.playerHp >= stats().maxHp)
      return { ok: false as const, code: "healing-unavailable" };
    s.playerHp = Math.min(stats().maxHp, s.playerHp + 12 + stat(s.items, "heal") * 10);
    s.healsUsed++; grantXp(s, 3);
  } else if (type === "gather") {
    const amount = 15 + Math.floor((s.level - 1) / 4) * 3 + stat(s.items, "gather") * 8;
    s.gold += Math.floor(amount * bonuses(s).gold);
    s.tutorialGathers++; grantXp(s, 6);
  } else if (["bomb", "potion", "elixir"].includes(type)) {
    if (stat(s.consumables, type) < 1 ||
      (type === "bomb" && !startMission(s, now, options.infiniteStamina)) ||
      (type === "potion" && s.playerHp >= stats().maxHp))
      return { ok: false as const, code: "consumable-unavailable" };
    s.consumables[type]--;
    if (type === "bomb") takeDamage(s, Math.max(100, stats().attack * 12), now);
    if (type === "potion") s.playerHp = Math.min(stats().maxHp,
      s.playerHp + Math.ceil(stats().maxHp * .65));
    if (type === "elixir") s.elixirUntil = Math.max(now, num(s.elixirUntil)) + 600_000;
  } else if (type === "selectMission") {
    if (typeof choice !== "number" || !Number.isSafeInteger(choice) || choice < 0 ||
      choice > Math.floor(num(s.progress)) || choice >= 140)
      return { ok: false as const, code: "mission-locked" };
    s.selectedMission = choice < num(s.progress) ? choice : null;
    s.enemyHp = maxEnemy(s); s.playerHp = stats().maxHp;
    s.lastVictory = null; s.awaitingNext = false; s.battleOver = false;
    s.missionEntered = false; s.timerStarted = false; s.timer = speedLimit(s);
    s.helperRemainder = 0; s.enemyAttackAt = 0; s.combatUpdatedAt = now;
  } else if (type === "next") {
    if (!s.awaitingNext) return { ok: false as const, code: "no-victory-to-advance" };
    if (s.selectedMission == null) s.progress++;
    s.selectedMission = null; s.lastVictory = null;
    s.enemyHp = maxEnemy(s);
    s.playerHp = Math.max(Math.ceil(stats().maxHp * .65),
      Math.min(stats().maxHp, s.playerHp + stats().maxHp *
        (.3 + .04 * stat(s.items, "vitality"))));
    s.awaitingNext = false; s.battleOver = false; s.missionEntered = false;
    s.timer = speedLimit(s); s.timerStarted = false; s.helperRemainder = 0; s.enemyAttackAt = 0;
  } else if (type === "retry") {
    if (!s.battleOver) return { ok: false as const, code: "retry-unavailable" };
    s.enemyHp = maxEnemy(s); s.playerHp = stats().maxHp;
    s.battleOver = false; s.missionEntered = false; s.timer = speedLimit(s);
    s.timerStarted = false; s.helperRemainder = 0; s.enemyAttackAt = 0;
  } else if (type === "doPrestige") {
    if (s.progress < 10 || s.specialMission) return { ok: false as const, code: "prestige-unavailable" };
    const gain = Math.floor(s.progress / 10) + Math.floor(s.progress / 30) + Math.floor(s.level / 15);
    if (gain <= 0) return { ok: false as const, code: "prestige-unavailable" };
    const old = s;
    s = newGameState(now);
    s.prestige = { count: old.prestige.count + 1,
      points: old.prestige.points + gain, perks: { ...old.prestige.perks } };
    s.prestigeCount = old.prestigeCount + 1;
    for (const key of ["achievements", "inventory", "equipped", "modules", "keys",
      "technologies", "researchQueue", "caravan", "gearFound", "chestsOpened",
      "moduleResearch", "caravanCount", "specialWins", "kills", "clicks", "shards"])
      s[key] = structuredClone(old[key]);
    s.seenIntro = true;
    s.gold = 500 + Math.min(4000, s.prestige.count * 300) +
      stat(s.prestige.perks, "wealth") * 150;
    s.enemyHp = maxEnemy(s);
    s.playerHp = calculateCombatStats(s).maxHp;
  } else if (type === "arenaFight") {
    if (s.level < 3 || now - num(s.arenaAt) < 30_000)
      return { ok: false as const, code: "arena-unavailable" };
    const enemy = 50 + s.arenaWins * 55;
    const won = stats().power >= enemy * (.77 + random() * .35);
    s.arenaAt = now;
    if (won) {
      s.arenaWins++;
      s.gold += Math.floor(300 + s.arenaWins * 120 + 90 * Math.pow(1.42, chapter(s)));
      s.essence += 4;
    }
  } else if (type === "startSpecial") {
    if (s.level < 8 || s.specialMission || now < num(s.specialAt))
      return { ok: false as const, code: "special-unavailable" };
    const hp = Math.floor(2500 * Math.pow(1.4, Math.floor(s.specialWins / 3)) + s.level * 110);
    s.specialMission = { max: hp, hp, finish: now + 75_000 };
  } else if (type === "strikeSpecial") {
    const op = s.specialMission;
    if (!op || now >= op.finish) return { ok: false as const, code: "special-expired" };
    s.specialStrikes++;
    const damage = Math.floor(stats().attack * (random() < .15 ? 2 : 1) * 4 + stats().dps * 1.5);
    op.hp = Math.max(0, op.hp - damage);
    if (op.hp === 0) {
      s.gold += Math.floor((1400 + s.specialWins * 600) * bonuses(s).gold);
      s.specialWins++; s.essence += 30 + s.specialWins * 3; s.keys.gold++;
      addGear(s, 2); s.specialMission = null; s.specialAt = now + 120_000;
    }
  } else if (type === "claimDaily") {
    const day = nextDay(s, now);
    if (s.dailyClaim === day) return { ok: false as const, code: "daily-already-claimed" };
    s.gold += Math.floor(350 + s.level * 30 + 120 * Math.pow(1.42, chapter(s)));
    s.essence += 5; s.stamina = Math.min(cap(s), s.stamina + 20);
    s.dailyClaim = day;
  } else if (type === "campSupply") {
    const recovery = stat(s.items, "staminaRecovery");
    const cost = Math.floor(420 * Math.pow(1.32, Math.min(20, chapter(s))));
    if (s.stamina >= cap(s) || now - num(s.lastSupplyAt) < 600_000 || s.gold < cost)
      return { ok: false as const, code: "camp-supply-unavailable" };
    s.gold -= cost;
    s.stamina = Math.min(cap(s), s.stamina + 22 + recovery * 3);
    s.lastSupplyAt = now;
    if (s.stamina >= cap(s)) s.staminaUpdatedAt = now;
  } else if (type === "claimEvent") {
    nextDay(s, now);
    if (s.eventClaimed || s.kills - s.eventStartKills < 5)
      return { ok: false as const, code: "event-unavailable" };
    s.eventClaimed = true; s.essence += 30; s.keys.silver++;
    s.gold += Math.floor(1250 * Math.pow(1.42, chapter(s)) + s.level * 55);
  } else if (type === "claimQuest") {
    const quest = QUESTS[s.questIndex];
    if (!quest || num(s[quest[0]]) < quest[1])
      return { ok: false as const, code: "quest-unavailable" };
    s.questIndex++; s.gold += quest[2]; s.essence += quest[3];
  } else if (type === "claimAchievement") {
    const quest = Object.hasOwn(ACHIEVEMENTS, String(choice)) ? ACHIEVEMENTS[String(choice)] : undefined;
    if (!quest || s.achievements.includes(choice) || num(s[quest[0]]) < quest[1])
      return { ok: false as const, code: "achievement-unavailable" };
    s.achievements.push(choice); s.gold += quest[2];
  } else if (type === "openChest") {
    if (!["bronze", "silver", "gold"].includes(String(choice)) || !s.keys[choice as string])
      return { ok: false as const, code: "chest-unavailable" };
    s.keys[choice as string]--;
    const tier = choice === "gold" ? 3 : choice === "silver" ? 2 : 0;
    addGear(s, tier);
    s.gold += Math.floor(Math.max(200 + s.level * 40, 220 * Math.pow(1.42, chapter(s))) *
      (tier + 1) * bonuses(s).gold);
    s.essence += 3 + tier * 5; s.chestsOpened++; s.runChestsOpened++;
  } else if (type === "launchCaravan") {
    const route = CARAVANS[Number(choice)];
    if (!Number.isSafeInteger(Number(choice)) || !route || s.caravan ||
      s.level < route.level || s.gold < route.cost)
      return { ok: false as const, code: "caravan-unavailable" };
    s.gold -= route.cost; s.caravan = { index: Number(choice), finish: now + route.duration };
  } else if (type === "claimCaravan") {
    const route = CARAVANS[s.caravan?.index];
    if (!route || now < s.caravan.finish)
      return { ok: false as const, code: "caravan-not-returned" };
    s.gold += Math.floor(route.gold * bonuses(s).gold);
    s.essence += route.essence; s.caravanCount++; s.runCaravanCount++;
    if (random() < .35) s.keys.silver++;
    if (random() < .2) addGear(s, 1);
    s.caravan = null;
  } else return { ok: false as const, code: "unknown-action" };

  if (limited.has(type)) s.lastCombatActionAt = now;
  if (options.infiniteStamina) s.stamina = cap(s);
  if (["gold", "essence", "shards", "xp", "stamina", "level", "progress",
    "enemyHp", "playerHp"].some(k => !Number.isFinite(s[k]) || s[k] < 0 || s[k] > Number.MAX_SAFE_INTEGER))
    return { ok: false as const, code: "numeric-overflow" };
  s.combatAuthority = 1;
  s.lastSaved = now;
  return { ok: true as const, state: s, code: "server-authoritative" };
}
