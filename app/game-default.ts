// Secure baseline for first-time players. Never use a browser-supplied save
// as a new account's trusted starting balance.
export function newGameState(now = Date.now()) {
  return {
    saveFormat: 2, theme: "evolution", gold: 500, essence: 0, shards: 0,
    level: 1, xp: 0, progress: 0, selectedMission: null, enemyHp: 320, playerHp: 120,
    stamina: 72, staminaUpdatedAt: now, missionEntered: false, lastSupplyAt: 0,
    clicks: 0, kills: 0, purchases: 0, runClicks: 0, runKills: 0,
    runPurchases: 0, runChestsOpened: 0, runModuleResearch: 0, runCaravanCount: 0,
    arenaWins: 0, questIndex: 0, items: {}, helpers: {}, achievements: [],
    dailyClaim: "", arenaAt: 0, awaitingNext: false, battleOver: false,
    timer: 60, timerStarted: false, lastVictory: null,
    inventory: [], equipped: { weapon: null, armor: null, relic: null },
    keys: { bronze: 1, silver: 0, gold: 0 },
    consumables: { bomb: 1, potion: 2, elixir: 0 },
    consumablePurchased: { bomb: 0, potion: 0, elixir: 0 },
    modules: {}, technologies: {}, researchQueue: null, autoclickers: 0,
    prestige: { count: 0, points: 0, perks: {} }, prestigeCount: 0,
    gearFound: 0, chestsOpened: 0, moduleResearch: 0,
    caravanCount: 0, caravan: null, specialWins: 0, specialAt: 0,
    specialMission: null, eventDay: "", eventStartKills: 0, eventClaimed: false,
    elixirUntil: 0, lastSaved: now, seenIntro: false,
    tutorial: { version: 0, active: false, step: 0, baseline: 0, rewardClaimed: false },
    tutorialGathers: 0, healsUsed: 0, skillsUsed: 0, specialStrikes: 0,
  };
}
