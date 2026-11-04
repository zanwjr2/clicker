import { calculateCombatPower, calculateCombatStats } from "./game-power.ts";

// Server-side economy and progression guard. Browser saves are proposals, not
// authority: every increase needs a plausible in-game source and every
// upgrade must be paid for using the previous server-accepted state.
type State = Record<string, unknown>;
type Dict = Record<string, unknown>;
const BASE_ITEM_COSTS: Record<string, number> = {
  blade: 120, rune: 420, gather: 170, heal: 155,
  staminaRecovery: 850, staminaEfficiency: 1200, drone: 330, armor: 290,
  fortune: 540, wisdom: 660, strike: 1150, barrier: 970,
  reactor: 1700, prospector: 2450, vitality: 2800, amplifier: 4200,
  critical: 2200, merchant: 3100,
};
const ITEM_CAPS: Record<string, number> = { staminaRecovery: 5, staminaEfficiency: 3 };
const HELPERS: Record<string, [number, number]> = {
  scout: [150, 2], mage: [900, 5], golem: [5000, 10],
  ranger: [18000, 18], alchemist: [79000, 30], seraph: [390000, 50],
};
const MODULE_COSTS: Record<string, [number, number]> = {
  force: [12, 8], swift: [16, 8], treasure: [20, 12],
  insight: [24, 15], shell: [28, 18], fortune: [35, 22],
};
const TECHS: Record<string, [number, number, number, number, string?]> = {
  fire: [120, 0, 0, 45], forage: [180, 0, 0, 60],
  bronze: [800, 15, 0, 90, "fire"], irrigation: [1100, 20, 0, 120],
  gunpowder: [2500, 35, 0, 150, "bronze"], guild: [3500, 45, 0, 180],
  steam: [7000, 65, 0, 240, "gunpowder"], rail: [9000, 80, 0, 270],
  computing: [18000, 110, 0, 300, "steam"], alloy: [22000, 120, 0, 330],
  plasma: [40000, 160, 0, 420, "computing"], autofactory: [55000, 180, 0, 480],
  antimatter: [110000, 240, 1, 600, "plasma"], startrade: [150000, 260, 1, 720],
};
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
const MISSION_GOLD = [300, 380, 460, 720, 630, 760, 850, 900, 1150, 1650];
const MISSION_XP = [170, 210, 250, 310, 350, 420, 370, 480, 560, 690];
const MISSION_HP = [1, 1.35, 1.6, 2.1, 2.6, 2.8, 2.2, 3.2, 3.9, 7.2];
const missionMaxHp = (stage: number) => {
  const c = Math.floor(stage / 10), m = stage % 10, era = Math.min(6, Math.floor(c / 2));
  return Math.floor(320 * Math.pow(1.38, c) * MISSION_HP[m] *
    (era === 3 ? 1.08 : 1) * (era === 2 && [4, 8].includes(m) ? 1.15 : 1));
};
const numeric = (o: Dict, k: string) => typeof o[k] === "number" && Number.isFinite(o[k]) ? (o[k] as number) : 0;
const object = (v: unknown): Dict => v && typeof v === "object" && !Array.isArray(v) ? v as Dict : {};
const n = (v: unknown): number => typeof v === "number" && Number.isFinite(v) ? v : 0;
const count = (o: Dict, k: string) => Math.floor(numeric(o, k));
const chapter = (s: State) => Math.max(0, Math.floor(count(s, "progress") / 10));
const gearValue = (s: State, slot: string) => {
  const equipped = object(s.equipped)[slot];
  const item = (Array.isArray(s.inventory) ? s.inventory : []).find(
    v => object(v).id === equipped,
  );
  return numeric(object(item), "value");
};
const maxLevel = (s: State) => Math.max(1, count(s, "level"));
const techBonus = (s: State, effect: "gold" | "xp") => {
  const t = object(s.technologies);
  if (effect === "gold") return (t.forage ? .1 : 0) + (t.irrigation ? .15 : 0) +
    (t.rail ? .2 : 0) + (t.startrade ? .35 : 0);
  return t.computing ? .2 : 0;
};
const goldMultiplier = (s: State, now: number) => {
  const items = object(s.items), mods = object(s.modules), perks = object(object(s.prestige).perks);
  return 1 + (numeric(s, "elixirUntil") > now ? 1 : 0) +
    numeric(items, "fortune") * .15 + numeric(items, "merchant") * .08 +
    numeric(mods, "treasure") * .08 + numeric(perks, "wealth") * .15 +
    gearValue(s, "relic") * .01 + techBonus(s, "gold");
};
const xpMultiplier = (s: State) => {
  const items = object(s.items), mods = object(s.modules), perks = object(object(s.prestige).perks);
  return 1 + numeric(items, "wisdom") * .15 + numeric(mods, "insight") * .1 +
    numeric(perks, "memory") * .15 + techBonus(s, "xp");
};
const missionGold = (stage: number, multiplier: number) => {
  const c = Math.floor(stage / 10), m = stage % 10, era = Math.min(6, Math.floor(c / 2));
  const eraBonus = era === 1 ? 1.12 : 1;
  const cargoBonus = era === 3 && [3, 6].includes(m) ? 1.3 : 1;
  const main = Math.round(MISSION_GOLD[m] * Math.pow(1.42, c) * multiplier * eraBonus * cargoBonus);
  const chapterBonus = m === 9 ? Math.round(600 * Math.pow(1.42, c) * multiplier) : 0;
  return Math.floor((main + chapterBonus) * ([2, 7].includes(m) ? 1.4 : 1));
};
const missionXp = (stage: number) => Math.floor(MISSION_XP[stage % 10] *
  Math.pow(1.28, Math.floor(stage / 10)) * (Math.floor(stage / 20) >= 6 ? 1.2 : 1));
const safeAdd = (a: number, b: number) => Math.min(Number.MAX_SAFE_INTEGER, a + b);
const money = (value: number) => Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;
const integer = (value: unknown, limit = 1_000_000) => typeof value === "number" &&
  Number.isSafeInteger(value) && value >= 0 && value <= limit;
const fail = (code: string) => ({ ok: false as const, code });

export function validateGameTransition(before: State, after: State, elapsedMs: number, now = Date.now()) {
  const time = Math.max(0, Math.min(4 * 3600, elapsedMs / 1000));
  const smallWindow = Math.max(1, Math.min(600, time));
  const cBefore = chapter(before), cAfter = chapter(after);
  const prestigeBefore = object(before.prestige), prestigeAfter = object(after.prestige);
  const rebirth = numeric(prestigeAfter, "count") === numeric(prestigeBefore, "count") + 1;
  const keys = ["gold", "essence", "shards", "xp", "stamina", "playerHp", "enemyHp"];
  if (keys.some(k => typeof after[k] !== "number" || !money(after[k] as number)) || !integer(after.level, 10000) ||
    !integer(after.progress, 1_000_000) || !integer(after.kills, 1_000_000_000) ||
    !integer(after.clicks, 1_000_000_000)) return fail("invalid-numbers");
  for (const key of ["gold", "essence", "shards", "xp", "stamina",
    "purchases", "chestsOpened", "gearFound", "moduleResearch",
    "caravanCount", "arenaWins", "specialWins", "autoclickers",
    "tutorialGathers", "healsUsed", "skillsUsed", "specialStrikes", "prestigeCount",
    "runClicks", "runKills", "runPurchases", "runChestsOpened",
    "runModuleResearch", "runCaravanCount", "questIndex"]) {
    if (after[key] != null && !integer(after[key], 1_000_000_000_000))
      return fail("noninteger-stat");
  }
  if (count(after, "level") < 1) return fail("invalid-level");
  const tracked = ["clicks", "kills", "purchases", "chestsOpened", "gearFound",
    "caravanCount", "moduleResearch", "arenaWins", "specialWins", "prestigeCount"];
  if (tracked.some(k => !(rebirth && ["purchases", "arenaWins"].includes(k)) &&
    count(after, k) < count(before, k))) return fail("counter-regression");
  const clicks = count(after, "clicks") - count(before, "clicks");
  const kills = count(after, "kills") - count(before, "kills");
  const purchases = count(after, "purchases") - count(before, "purchases");
  const chestOpenings = count(after, "chestsOpened") - count(before, "chestsOpened");
  const caravans = count(after, "caravanCount") - count(before, "caravanCount");
  const specials = count(after, "specialWins") - count(before, "specialWins");
  const arenaWins = count(after, "arenaWins") - count(before, "arenaWins");
  const gathers = count(after, "tutorialGathers") - count(before, "tutorialGathers");
  const heals = count(after, "healsUsed") - count(before, "healsUsed");
  const skills = count(after, "skillsUsed") - count(before, "skillsUsed");
  const specialStrikes = count(after, "specialStrikes") - count(before, "specialStrikes");
  if (!rebirth && (gathers < 0 || heals < 0 || skills < 0) ||
    (!rebirth && specialStrikes < 0) ||
    clicks + Math.max(0, gathers) + Math.max(0, heals) + Math.max(0, skills) + Math.max(0, specialStrikes) > smallWindow * 12 + 8 ||
    kills > Math.ceil(smallWindow * 3) + 2 || arenaWins > Math.ceil(smallWindow / 30) + 1 ||
    specials > Math.ceil(smallWindow / 4) + 1) return fail("implausible-action-rate");
  if (rebirth) {
    if (count(before, "progress") < 10 || count(after, "progress") !== 0 ||
      count(after, "level") !== 1 || count(after, "prestigeCount") !== count(before, "prestigeCount") + 1 ||
      !!before.specialMission ||
      count(prestigeAfter, "points") > count(prestigeBefore, "points") +
        Math.floor(count(before, "progress") / 10) + Math.floor(count(before, "progress") / 30) +
        Math.floor(count(before, "level") / 15)) return fail("invalid-prestige");
  } else {
    if (count(prestigeAfter, "count") !== count(prestigeBefore, "count") ||
      count(after, "level") < count(before, "level") ||
      count(after, "progress") < count(before, "progress") ||
      count(after, "progress") > count(before, "progress") + kills + (before.awaitingNext ? 1 : 0))
      return fail("invalid-progression");
    if (after.awaitingNext && !before.awaitingNext && kills === 0)
      return fail("unearned-victory");
    if (before.awaitingNext && after.awaitingNext &&
      count(after, "progress") > count(before, "progress") && kills === 0)
      return fail("reused-victory");
    if (after.awaitingNext && !before.awaitingNext &&
      count(after, "progress") === count(before, "progress") && kills !== 1)
      return fail("multiple-victories-on-one-stage");
    const stagesAdvanced = count(after, "progress") - count(before, "progress");
    if (kills > stagesAdvanced + (before.awaitingNext ? 0 : 1) ||
      (before.awaitingNext && kills > 0 && stagesAdvanced === 0))
      return fail("unearned-multiple-victories");
    for (const [run, lifetime] of [
      ["runClicks", "clicks"], ["runKills", "kills"],
      ["runPurchases", "purchases"], ["runChestsOpened", "chestsOpened"],
      ["runModuleResearch", "moduleResearch"], ["runCaravanCount", "caravanCount"],
    ]) {
      if (count(after, run) - count(before, run) !==
        count(after, lifetime) - count(before, lifetime))
        return fail("forged-run-stat");
    }
  }
  for (const key of ["lastSupplyAt", "arenaAt", "specialAt"]) {
    if (!rebirth && n(after[key]) < n(before[key])) return fail("rewound-cooldown");
  }
  const earlier = object(before.items), later = object(after.items);
  let goldSpent = 0, essenceSpent = 0, shardsSpent = 0, newPurchases = 0;
  for (const [id, value] of Object.entries(later)) {
    if (!(id in BASE_ITEM_COSTS) || !integer(value, 250)) return fail("invalid-upgrade");
  }
  for (const [id, cost] of Object.entries(BASE_ITEM_COSTS)) {
    const a = count(earlier, id), b = count(later, id);
    if (!rebirth && b < a || b > (ITEM_CAPS[id] || 250)) return fail("invalid-upgrade-level");
    if (!rebirth) for (let stage = a; stage < b; stage++) {
      goldSpent = safeAdd(goldSpent, Math.floor(cost * Math.pow(1.55, stage)));
      newPurchases++;
    }
  }
  for (const [kind, base] of Object.entries(HELPERS)) {
    const a = count(object(before.helpers), kind), b = count(object(after.helpers), kind);
    if (!integer(object(after.helpers)[kind] ?? 0, 250) ||
      (!rebirth && b < a)) return fail("invalid-helper-level");
    if (!rebirth) for (let stage = a; stage < b; stage++) {
      if (maxLevel(after) < base[1]) return fail("helper-locked");
      goldSpent = safeAdd(goldSpent, Math.floor(base[0] * Math.pow(1.75, stage)));
      newPurchases++;
    }
  }
  if (Object.keys(object(after.helpers)).some(k => !(k in HELPERS))) return fail("unknown-helper");
  for (const [id, base] of Object.entries(MODULE_COSTS)) {
    const a = count(object(before.modules), id), b = count(object(after.modules), id);
    if (!integer(object(after.modules)[id] ?? 0, 150) || b < a)
      return fail("invalid-module-level");
    for (let stage = a; stage < b; stage++) {
      if (maxLevel(after) < base[1]) return fail("module-locked");
      essenceSpent = safeAdd(essenceSpent, Math.floor(base[0] * Math.pow(1.6, stage)));
      if (stage >= 3) shardsSpent += 1 + Math.floor((stage - 3) / 3);
      newPurchases++;
    }
  }
  if (!rebirth && count(after, "moduleResearch") - count(before, "moduleResearch") !==
    Object.keys(MODULE_COSTS).reduce((sum, id) => sum +
      count(object(after.modules), id) - count(object(before.modules), id), 0))
    return fail("forged-module-research");
  if (Object.keys(object(after.modules)).some(k => !(k in MODULE_COSTS))) return fail("unknown-module");
  const autoBefore = count(before, "autoclickers"), autoAfter = count(after, "autoclickers");
  if (!rebirth && (autoAfter < autoBefore || autoAfter > 200)) return fail("invalid-auto");
  if (!rebirth) for (let i = autoBefore; i < autoAfter; i++) {
    if (maxLevel(after) < 6) return fail("auto-locked");
    goldSpent = safeAdd(goldSpent, Math.floor(750 * Math.pow(1.95, i)));
    newPurchases++;
  }
  for (const [id, cost] of Object.entries({ bomb: 300, potion: 180, elixir: 900 })) {
    const bought = count(object(after.consumablePurchased), id) -
      count(object(before.consumablePurchased), id);
    const currentAmount = count(object(after.consumables), id);
    if (!integer(currentAmount, 100_000) ||
      (!rebirth && (bought < 0 || bought > 100 ||
        currentAmount > count(object(before.consumables), id) + bought)))
      return fail("invalid-consumable");
    if (!rebirth) { goldSpent += bought * cost; newPurchases += bought; }
  }
  const elixirExtended = n(after.elixirUntil) > n(before.elixirUntil);
  if (elixirExtended && count(object(after.consumables), "elixir") >=
    count(object(before.consumables), "elixir") && purchases === 0) return fail("free-elixir");
  if (elixirExtended && n(after.elixirUntil) >
    Math.max(now, n(before.elixirUntil)) + 600_000 + 5000) return fail("invalid-elixir-duration");
  const oldCaravan = object(before.caravan), nextCaravan = object(after.caravan);
  const caravanRoutes = [
    { duration: 90_000, cost: 350, gold: 1050, essence: 12, level: 1 },
    { duration: 240_000, cost: 2200, gold: 6700, essence: 36, level: 8 },
    { duration: 600_000, cost: 12000, gold: 38500, essence: 110, level: 18 },
  ];
  if (caravans > 0) {
    if (!oldCaravan.finish || n(oldCaravan.finish) > now || nextCaravan.finish ||
      caravans !== 1) return fail("unearned-caravan-reward");
  } else if (oldCaravan.finish && nextCaravan.finish &&
    (oldCaravan.index !== nextCaravan.index || oldCaravan.finish !== nextCaravan.finish))
    return fail("modified-caravan-timer");
  if (!oldCaravan.finish && nextCaravan.finish) {
    const route = caravanRoutes[count(nextCaravan, "index")];
    if (!route || maxLevel(after) < route.level ||
      n(nextCaravan.finish) > now + route.duration + 5000 ||
      n(nextCaravan.finish) < now + route.duration - Math.max(elapsedMs, 15_000) - 5000)
      return fail("invalid-caravan-launch");
    goldSpent += route.cost;
  }
  const oldSpecial = object(before.specialMission), nextSpecial = object(after.specialMission);
  const bossMaxHp = Math.floor(2500 * Math.pow(1.4,
    Math.floor(count(before, "specialWins") / 3)) + maxLevel(after) * 110);
  const specialPowerBefore = calculateCombatStats(before);
  const specialPowerAfter = calculateCombatStats(after);
  const perSpecialStrike = Math.max(specialPowerBefore.attack, specialPowerAfter.attack) * 8 +
    Math.max(specialPowerBefore.dps, specialPowerAfter.dps) * 1.5 + 2;
  if (specials > 0) {
    // A player can launch and finish a weak special boss before the debounced
    // autosave. Both the existing-boss and same-save outcomes are checked.
    if (specials !== 1 || nextSpecial.max || specialStrikes === 0 ||
      (oldSpecial.max && (n(oldSpecial.finish) < now || !oldSpecial.hp)) ||
      (!oldSpecial.max && (maxLevel(after) < 8 || n(before.specialAt) > now)) ||
      n(after.specialAt) < now - Math.max(elapsedMs, 15_000) ||
      n(after.specialAt) > now + 125_000)
      return fail("unearned-special-win");
    if ((oldSpecial.max ? n(oldSpecial.hp) : bossMaxHp) > specialStrikes * perSpecialStrike)
      return fail("impossible-special-damage");
  } else if (!oldSpecial.max && nextSpecial.max) {
    const damage = n(nextSpecial.max) - n(nextSpecial.hp);
    if (maxLevel(after) < 8 || n(before.specialAt) > now ||
      n(nextSpecial.max) !== bossMaxHp ||
      damage < 0 || damage > specialStrikes * perSpecialStrike ||
      n(nextSpecial.finish) > now + 80_000 ||
      n(nextSpecial.finish) < now + 75_000 - Math.max(elapsedMs, 15_000) - 5000)
      return fail("invalid-special-start");
  } else if (oldSpecial.max && nextSpecial.max) {
    if (n(nextSpecial.max) !== n(oldSpecial.max) ||
      n(nextSpecial.finish) !== n(oldSpecial.finish) ||
      n(nextSpecial.hp) > n(oldSpecial.hp))
      return fail("modified-special-boss");
  }
  if (specialStrikes > 0 && !oldSpecial.max && !nextSpecial.max && !specials)
    return fail("strikes-without-special-operation");
  if (oldSpecial.max && !specials && nextSpecial.max &&
    n(oldSpecial.hp) - n(nextSpecial.hp) > specialStrikes * perSpecialStrike)
    return fail("impossible-special-damage");
  if (arenaWins > 0) {
    if (arenaWins !== 1 || maxLevel(after) < 3 ||
      (n(before.arenaAt) > 0 && n(after.arenaAt) -
      n(before.arenaAt) < 30_000) ||
      n(after.arenaAt) > now + 5000 || n(after.arenaAt) <
      now - Math.max(elapsedMs, 15_000) - 5000 ||
      calculateCombatPower(after) < (50 + count(before, "arenaWins") * 55) * .77)
      return fail("unearned-arena-win");
  }
  const lastQueue = object(before.researchQueue), currentQueue = object(after.researchQueue);
  const technologies = object(after.technologies), previousTechnologies = object(before.technologies);
  if (Object.keys(technologies).some(k => !(k in TECHS)) ||
      Object.keys(previousTechnologies).some(k => !(k in TECHS))) return fail("unknown-technology");
  for (const id of Object.keys(TECHS)) {
    if (technologies[id] != null && technologies[id] !== true &&
      technologies[id] !== false) return fail("invalid-technology-value");
    if (previousTechnologies[id] && !technologies[id]) return fail("technology-removed");
    if (!previousTechnologies[id] && technologies[id]) {
      if (lastQueue.id !== id || numeric(lastQueue, "finishAt") > now)
        return fail("early-technology");
    }
  }
  if (currentQueue.id && currentQueue.id !== lastQueue.id) {
    const tech = TECHS[String(currentQueue.id)];
    if (!tech || previousTechnologies[String(currentQueue.id)] ||
      numeric(currentQueue, "startedAt") < now - Math.max(15_000, elapsedMs + 5_000) ||
      numeric(currentQueue, "startedAt") > now + 5_000 ||
      numeric(currentQueue, "finishAt") < numeric(currentQueue, "startedAt") + tech[3] * 1000 - 5_000 ||
      Math.floor(cAfter / 2) < Math.floor(Object.keys(TECHS).indexOf(String(currentQueue.id)) / 2))
      return fail("invalid-research-timer");
    if (tech[4] && !technologies[tech[4]]) return fail("missing-prerequisite");
    goldSpent += tech[0]; essenceSpent += tech[1]; shardsSpent += tech[2];
  }
  if (currentQueue.id && lastQueue.id === currentQueue.id &&
    numeric(currentQueue, "finishAt") < numeric(lastQueue, "finishAt"))
    return fail("research-timer-rewind");
  if (lastQueue.id && !currentQueue.id && !technologies[String(lastQueue.id)] &&
    numeric(lastQueue, "finishAt") > now) return fail("cancelled-research");
  if (!rebirth) essenceSpent += Math.max(0, skills) * 25;
  const invBefore = Array.isArray(before.inventory) ? before.inventory.map(object) : [];
  const invAfter = Array.isArray(after.inventory) ? after.inventory.map(object) : [];
  if (invAfter.length > 200 || new Set(invAfter.map(g => g.id)).size !== invAfter.length)
    return fail("invalid-inventory");
  const oldGear = new Map(invBefore.map(g => [g.id, g]));
  const added = invAfter.filter(g => !oldGear.has(g.id));
  let saleGold = 0;
  for (const item of invBefore) if (!invAfter.some(g => g.id === item.id))
    saleGold += Math.max(30, numeric(item, "value") * 20);
  if (added.length > kills + chestOpenings + caravans + specials ||
      count(after, "gearFound") - count(before, "gearFound") <
        added.length) return fail("unearned-gear");
  if (count(after, "gearFound") - count(before, "gearFound") >
      kills + chestOpenings + caravans + specials) return fail("forged-gear-counter");
  for (const item of invAfter) {
    if (!["weapon", "armor", "relic"].includes(String(item.slot)) ||
      !integer(item.upgrade, 10) || !integer(item.value, 1_000_000_000) ||
      numeric(item, "value") < 1) return fail("invalid-gear");
    const old = oldGear.get(item.id);
    if (old) {
      const beforeUpgrade = count(old, "upgrade"), afterUpgrade = count(item, "upgrade");
      if (afterUpgrade < beforeUpgrade) return fail("gear-downgrade");
      let expectedValue = numeric(old, "value");
      for (let i = beforeUpgrade; i < afterUpgrade; i++) {
        goldSpent += Math.floor((expectedValue + 10) * 12 * Math.pow(1.5, i));
        essenceSpent += 2 + i * 3;
        expectedValue = Math.max(expectedValue + 1, Math.floor(expectedValue * 1.2));
      }
      if (numeric(item, "value") !== expectedValue) return fail("forged-gear-value");
    } else {
      const tierCap = (40 + Math.max(cBefore, cAfter) * 3 + 3 * 4) * 8;
      if (numeric(item, "value") > tierCap || count(item, "upgrade") !== 0)
        return fail("impossible-loot");
    }
  }
  const ownedGear = new Map(invAfter.map(g => [g.id, g]));
  for (const [slot, id] of Object.entries(object(after.equipped))) {
    if (id != null && ownedGear.get(id)?.slot !== slot) return fail("invalid-equipment");
  }
  if (!rebirth && purchases !== newPurchases) return fail("unpaid-purchases");
  const perkBefore = object(prestigeBefore.perks), perkAfter = object(prestigeAfter.perks);
  let perkSteps = 0;
  for (const key of ["might", "wealth", "memory", "soul"]) {
    const difference = count(perkAfter, key) - count(perkBefore, key);
    if (!integer(perkAfter[key] ?? 0, 1000) || difference < 0 || difference > 100)
      return fail("invalid-prestige-perks");
    perkSteps += difference;
  }
  if (Object.keys(perkAfter).some(k => !["might", "wealth", "memory", "soul"].includes(k)))
    return fail("unknown-prestige-perk");
  if (!integer(prestigeAfter.count, 10_000) || !integer(prestigeAfter.points, 1_000_000))
    return fail("invalid-prestige-number");
  if (count(prestigeAfter, "points") >
      count(prestigeBefore, "points") +
      (rebirth ? Math.floor(count(before, "progress") / 10) +
        Math.floor(count(before, "progress") / 30) + Math.floor(count(before, "level") / 15) : 0) -
      perkSteps) return fail("unearned-prestige-points");
  if (rebirth) {
    if (Object.values(later).some(v => n(v) !== 0) ||
      Object.values(object(after.helpers)).some(v => n(v) !== 0) ||
      autoAfter !== 0 || n(after.essence) !== 0 || n(after.shards) !== n(before.shards) ||
      JSON.stringify(after.inventory) !== JSON.stringify(before.inventory) ||
      JSON.stringify(after.modules) !== JSON.stringify(before.modules) ||
      JSON.stringify(after.technologies) !== JSON.stringify(before.technologies))
      return fail("prestige-data-injection");
    if (["runClicks", "runKills", "runPurchases", "runChestsOpened",
      "runModuleResearch", "runCaravanCount", "tutorialGathers", "healsUsed",
      "skillsUsed", "specialStrikes", "questIndex"].some(k => count(after, k) !== 0))
      return fail("prestige-counter-injection");
    if (n(after.gold) > 500 + Math.min(4000, count(prestigeAfter, "count") * 300) +
      numeric(perkAfter, "wealth") * 150 + 5) return fail("prestige-gold-injection");
    return { ok: true as const, code: "valid-prestige" };
  }
  const questBefore = count(before, "questIndex"), questAfter = count(after, "questIndex");
  if (questAfter < questBefore || questAfter > QUESTS.length) return fail("invalid-quest-index");
  let questGold = 0, questEssence = 0;
  for (let i = questBefore; i < questAfter; i++) {
    const [metric, requirement, gold, essence] = QUESTS[i];
    if (count(after, metric) < requirement) return fail("unearned-quest");
    questGold += gold; questEssence += essence;
  }
  const oldAchievements = new Set(Array.isArray(before.achievements) ? before.achievements : []);
  const newAchievements = new Set(Array.isArray(after.achievements) ? after.achievements : []);
  let achievementGold = 0;
  for (const id of oldAchievements) if (!newAchievements.has(id)) return fail("achievement-removed");
  for (const id of newAchievements) {
    if (!(id in ACHIEVEMENTS)) return fail("unknown-achievement");
    if (!oldAchievements.has(id)) {
      const [metric, target, reward] = ACHIEVEMENTS[String(id)];
      if (count(after, metric) < target) return fail("unearned-achievement");
      achievementGold += reward;
    }
  }
  const daily = after.dailyClaim !== before.dailyClaim;
  if (daily && after.dailyClaim !== new Date(now).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }))
    return fail("invalid-daily-claim");
  const eventClaim = !before.eventClaimed && !!after.eventClaimed;
  const today = new Date(now).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  if (after.eventDay !== before.eventDay &&
    (after.eventDay !== today || count(after, "eventStartKills") !== count(before, "kills")))
    return fail("invalid-event-rollover");
  if (after.eventDay === before.eventDay &&
    count(after, "eventStartKills") !== count(before, "eventStartKills"))
    return fail("modified-event-baseline");
  if (before.eventClaimed && !after.eventClaimed &&
    after.eventDay === before.eventDay) return fail("reclaimed-event");
  if (eventClaim && count(after, "kills") - count(after, "eventStartKills") < 5)
    return fail("unearned-daily-event");
  let keysBefore = 0, keysAfter = 0;
  for (const id of ["bronze", "silver", "gold"]) {
    const prev = object(before.keys)[id], current = object(after.keys)[id];
    if (!integer(current, 100_000)) return fail("invalid-keys");
    keysBefore += n(prev);
    keysAfter += n(current);
  }
  if (keysAfter + chestOpenings >
    keysBefore + kills + caravans + specials + (eventClaim ? 1 : 0))
    return fail("unearned-chest-keys");
  const multi = Math.max(goldMultiplier(before, now), goldMultiplier(after, now));
  const rewardStage = Math.max(cBefore, cAfter), lvl = Math.max(maxLevel(before), maxLevel(after));
  let goldIncome = 0, essenceIncome = 0, shardsIncome = 0, bossWins = 0;
  for (let i = 0; i < kills; i++) {
    const stage = Math.min(999, count(before, "progress") + i);
    goldIncome += missionGold(stage, multi);
    essenceIncome += 4 + Math.floor(stage / 10) * 2 +
      Math.max(numeric(object(before.items), "reactor"), numeric(object(after.items), "reactor")) * 2 +
      (Math.floor(stage / 20) === 4 ? 2 : 0);
    if (stage % 10 === 9) {
      shardsIncome += 1 + (Math.floor(stage / 20) === 5 ? 1 : 0);
      bossWins++;
    }
  }
  goldIncome += gathers * (15 + Math.floor((lvl - 1) / 4) * 3 +
    Math.max(numeric(object(before.items), "gather"), numeric(object(after.items), "gather")) * 8) * multi;
  goldIncome += questGold + achievementGold + saleGold;
  const maxChestTier = count(object(before.keys), "gold") > 0 || specials > 0 ? 3 :
    count(object(before.keys), "silver") > 0 || caravans > 0 || eventClaim ? 2 : 0;
  essenceIncome += questEssence + chestOpenings * (3 + maxChestTier * 5);
  goldIncome += chestOpenings * Math.max(200 + lvl * 40, 220 * Math.pow(1.42, rewardStage)) *
    (maxChestTier + 1) * multi;
  if (daily) {
    goldIncome += 350 + lvl * 30 + 120 * Math.pow(1.42, rewardStage);
    essenceIncome += 5;
  }
  if (eventClaim) {
    goldIncome += 1250 * Math.pow(1.42, rewardStage) + lvl * 55;
    essenceIncome += 30;
  }
  if (caravans) {
    const route = caravanRoutes[count(oldCaravan, "index")];
    if (!route) return fail("invalid-caravan-route");
    goldIncome += route.gold * multi;
    essenceIncome += route.essence;
  }
  for (let i = 0; i < arenaWins; i++) {
    goldIncome += 300 + (count(before, "arenaWins") + i + 1) * 120 +
      90 * Math.pow(1.42, rewardStage);
    essenceIncome += 4;
  }
  for (let i = 0; i < specials; i++) {
    goldIncome += (1400 + (count(before, "specialWins") + i) * 600) * multi;
    essenceIncome += 30 + (count(before, "specialWins") + i + 1) * 3;
  }
  for (let i = count(before, "level") + 1; i <= count(after, "level"); i++)
    goldIncome += 60 + i * 22;
  // Offline helpers earn gold at 12% of DPS for at most four hours.
  if (time > 20)
    goldIncome += Math.max(calculateCombatStats(before).dps, calculateCombatStats(after).dps) *
      time * .12;
  const goldCeiling = n(before.gold) + goldIncome * 1.025 - goldSpent;
  if (n(after.gold) > goldCeiling) return fail("unearned-gold");
  if (n(after.essence) > n(before.essence) + essenceIncome - essenceSpent)
    return fail("unearned-essence");
  if (n(after.shards) > n(before.shards) + shardsIncome - shardsSpent)
    return fail("unearned-shards");
  // Progression needs actual combat/click/purchase activity. XP is an
  // accumulated budget across all levels, not a freely editable field.
  let earnedXp = n(after.xp) - n(before.xp);
  for (let i = count(before, "level"); i < count(after, "level"); i++)
    earnedXp += Math.floor(650 * Math.pow(1.125, i - 1));
  const maxXpFactor = Math.max(xpMultiplier(before), xpMultiplier(after));
  const xpBudget = (
    clicks * (18 + Math.max(cBefore, cAfter) * 3) +
    gathers * 6 + purchases * 100 +
    kills * missionXp(Math.max(count(before, "progress"), count(after, "progress"))) * 1.4 +
    Math.max(0, skills) * 80 + Math.max(0, heals) * 3
  ) * maxXpFactor;
  if (earnedXp > xpBudget) return fail("unearned-xp");
  const maxStamina = 72 + (maxLevel(after) - 1) * 2;
  const recovery = Math.max(count(object(before.items), "staminaRecovery"),
    count(object(after.items), "staminaRecovery"));
  const regenInterval = 90 - recovery * 5;
  const oldCap = 72 + (maxLevel(before) - 1) * 2;
  const remainingRegen = Math.max(0, now - n(before.staminaUpdatedAt));
  const regenLimit = n(before.stamina) >= oldCap && maxLevel(before) === maxLevel(after) ?
    0 : Math.floor(Math.min(remainingRegen, elapsedMs + 90_000) /
      (regenInterval * 1000)) * (1 + recovery);
  const resupplied = n(after.lastSupplyAt) > n(before.lastSupplyAt);
  if (n(after.staminaUpdatedAt) < n(before.staminaUpdatedAt) ||
    n(after.staminaUpdatedAt) > now + 5000) return fail("modified-stamina-clock");
  if (resupplied && (n(after.lastSupplyAt) > now + 5000 ||
    n(after.lastSupplyAt) < now - Math.max(elapsedMs, 15_000) - 5000 ||
    (n(before.lastSupplyAt) > 0 && n(after.lastSupplyAt) - n(before.lastSupplyAt) < 600_000)))
    return fail("invalid-camp-supply");
  if (resupplied) goldSpent += Math.floor(420 * Math.pow(1.32, Math.min(20, cBefore)));
  const staminaIncome = regenLimit +
    Math.max(0, maxLevel(after) - maxLevel(before)) * 3 +
    bossWins * 12 + (daily ? 20 : 0) + (resupplied ? 22 + recovery * 3 : 0);
  const stageMoved = Math.max(0, count(after, "progress") - count(before, "progress"));
  const efficiency = Math.max(count(object(before.items), "staminaEfficiency"),
    count(object(after.items), "staminaEfficiency"));
  const initialEntry = !before.missionEntered && (after.missionEntered || kills > 0) ? 1 : 0;
  const followupEntry = stageMoved && after.missionEntered ? 1 : 0;
  const startCost = initialEntry * Math.max(2, 5 + Math.floor(cBefore / 4) - efficiency) +
    followupEntry * Math.max(2, 5 + Math.floor(cAfter / 4) - efficiency);
  if (n(after.stamina) > maxStamina ||
    n(after.stamina) > n(before.stamina) + staminaIncome - startCost)
    return fail("unearned-stamina");
  const hpBefore = calculateCombatStats(before).maxHp;
  const hpAfter = calculateCombatStats(after).maxHp;
  const healingPerUse = 12 + Math.max(count(object(before.items), "heal"),
    count(object(after.items), "heal")) * 10;
  const potionsUsed = Math.max(0, count(object(before.consumables), "potion") +
    count(object(after.consumablePurchased), "potion") -
    count(object(before.consumablePurchased), "potion") -
    count(object(after.consumables), "potion"));
  const canFullyHeal = maxLevel(after) > maxLevel(before) ||
    count(after, "progress") > count(before, "progress") ||
    (before.battleOver && !after.battleOver);
  if (n(after.playerHp) > hpAfter ||
      (!canFullyHeal && n(after.playerHp) > n(before.playerHp) +
        heals * healingPerUse + potionsUsed * Math.ceil(hpAfter * .65) +
        Math.max(0, hpAfter - hpBefore)))
    return fail("unearned-player-health");
  // An instant mission kill with no ability to deal enough damage is not a
  // valid source of rewards, even if the browser also forged a kill counter.
  if (!before.awaitingNext || kills > 0) {
    const p = calculateCombatStats(before), q = calculateCombatStats(after);
    const strike = Math.max(p.attack, q.attack);
    const dps = Math.max(p.dps, q.dps);
    const maxSkillCount = Math.max(0, skills);
    const maxDamage = clicks * strike * 2 +
      Math.max(0, time) * dps * 1.15 + maxSkillCount * (60 + strike * 7 + dps * 2) +
      Math.max(0, count(object(before.consumables), "bomb") -
        count(object(after.consumables), "bomb")) * Math.max(100, strike * 12) + 5;
    if (!before.awaitingNext && count(after, "progress") === count(before, "progress")) {
      const dealt = Math.max(0, n(before.enemyHp) - n(after.enemyHp));
      if (dealt > maxDamage) return fail("impossible-battle");
    }
    if (kills > 0) {
      const firstStage = count(before, "progress") + (before.awaitingNext ? 1 : 0);
      let requiredDamage = before.awaitingNext ? missionMaxHp(firstStage) : n(before.enemyHp);
      for (let i = 1; i < kills; i++)
        requiredDamage += missionMaxHp(firstStage + i);
      if (maxDamage + 5 < requiredDamage) return fail("unearned-victory-damage");
    }
  }
  return { ok: true as const, code: "verified" };
}
