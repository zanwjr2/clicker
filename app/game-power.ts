// Keep this formula aligned with power()/attack()/dps()/maxHp() in public/game.js.
// The leaderboard must never accept an arbitrary power number from a request.
const chapterWeapons = [0, 5, 8, 14, 20, 30, 40, 54, 70, 90, 115, 150, 180, 220];
const helperDamage = { scout: 8, mage: 30, golem: 140, ranger: 360, alchemist: 950, seraph: 3600 };
const techEffects = {
  fire: ["attack", .1], bronze: ["attack", .15], plasma: ["attack", .3], antimatter: ["attack", .35],
  guild: ["dps", .18], steam: ["dps", .25], autofactory: ["dps", .3], alloy: ["hp", .2],
} as const;

export function calculateCombatStats(state: Record<string, unknown>) {
  const values = (state.items || {}) as Record<string, unknown>;
  const helpers = (state.helpers || {}) as Record<string, unknown>;
  const modules = (state.modules || {}) as Record<string, unknown>;
  const technology = (state.technologies || {}) as Record<string, unknown>;
  const legacy = (state.prestige || {}) as Record<string, unknown>;
  const perks = (legacy.perks || {}) as Record<string, unknown>;
  const gear = (state.equipped || {}) as Record<string, unknown>;
  const inventory = Array.isArray(state.inventory) ? state.inventory : [];
  const num = (value: unknown, cap = 1_000_000) =>
    typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(cap, value)) : 0;
  const item = (id: string) => num(values[id]);
  const mod = (id: string) => num(modules[id]);
  const perk = (id: string) => num(perks[id]);
  const gearBonus = (slot: string) => {
    const equipped = inventory.find(value => value && typeof value === "object" &&
      (value as Record<string, unknown>).id === gear[slot]) as Record<string, unknown> | undefined;
    return num(equipped?.value);
  };
  const tech = (effect: string) => Object.entries(techEffects).reduce((total, [id, [kind, bonus]]) =>
    total + (kind === effect && technology[id] ? bonus : 0), 0);
  const level = Math.max(1, Math.floor(num(state.level, 10_000)));
  const unlockedStage = Math.floor(num(state.progress, 1_000_000));
  const selected = state.selectedMission;
  const stage = typeof selected === "number" && Number.isSafeInteger(selected) &&
    selected >= 0 && selected < unlockedStage ? selected : unlockedStage;
  const chapterIndex = Math.min(chapterWeapons.length - 1, Math.floor(stage / 10));
  const masteryTier = Math.floor(level / 5);
  const masteryMulti = 1 + masteryTier * .1;
  const legacyMulti = 1 + .06 * Math.sqrt(num(legacy.count));
  const maxHp = Math.floor((120 + (level - 1) * 10 + masteryTier * 25 + item("armor") * 25 +
    gearBonus("armor") + mod("shell") * 35 + perk("soul") * 30) * (1 + tech("hp")));
  const baseAttack = (10 + chapterWeapons[chapterIndex] + (level - 1) * 2 + item("blade") * 5 +
    item("rune") * 18 + gearBonus("weapon")) * masteryMulti *
    (1 + mod("force") * .12 + perk("might") * .15 + tech("attack"));
  const attack = Math.floor(baseAttack * legacyMulti);
  const helperTotal = Object.entries(helperDamage).reduce(
    (total, [id, damage]) => total + num(helpers[id]) * damage, 0);
  const dps = Math.floor((item("drone") * 3 + helperTotal * (1 + item("amplifier") * .1) +
    num(state.autoclickers) * baseAttack * .4) *
    (1 + .025 * (level - 1) + .05 * masteryTier) *
    (1 + mod("swift") * .14 + tech("dps")) * legacyMulti);
  return { attack, dps, maxHp,
    power: Math.min(1_000_000_000_000, Math.max(0, Math.floor(attack + dps * 3 + (maxHp - 120) / 4))) };
}

export function calculateCombatPower(state: Record<string, unknown>): number {
  return calculateCombatStats(state).power;
}
