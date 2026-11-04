import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { calculateCombatPower } from './app/game-power.ts';
import { resolveServerAction } from './app/combat-engine.ts';
import { hasServerOwnedChanges } from './app/server-owned-fields.ts';

const source = fs.readFileSync(new URL('./public/game.js', import.meta.url), 'utf8');
const chronicle = fs.readFileSync(new URL('./public/chronicle.js', import.meta.url), 'utf8');
export function harness(seed, options = {}) {
  const nodes = new Map(), events = new Map();
  let clock = Date.now(), interval;
  const FakeDate = class extends Date { constructor(...args) { super(...(args.length ? args : [clock])); } static now() { return clock; } };
  const element = () => ({ dataset: {}, style: {}, innerHTML: '', textContent: '', children: [],
    setAttribute(name,value) { this[name] = String(value); },
    classList: { add() {}, remove() {}, toggle() {} }, appendChild() {}, remove() {}, get offsetWidth() { return 1; } });
  const byId = id => {
    if (!nodes.has(id)) {
      const node = element();
      nodes.set(id, node);
    }
    return nodes.get(id);
  };
  let saved = JSON.stringify(seed), postCount = 0, localWrites = 0;
  const networkActions = [];
  let serverState = structuredClone(seed), serverRevision = 1;
  const fakeFetch = async (_, request = {}) => {
    if (!options.online) throw new Error('offline test');
    if (!request.method || request.method === 'GET')
      return { ok:true, status:200, json:async () => ({ state:serverState, revision:serverRevision,
        adminAvailable: options.adminAvailable ?? false, adminMode: !!options.adminMode }) };
    postCount++;
    const body = JSON.parse(request.body);
    networkActions.push([body.action || 'snapshot', body.id ?? null]);
    if (body.revision !== serverRevision)
      return { ok:false, status:409, json:async () => ({ state:serverState, revision:serverRevision }) };
    let processed;
    if (body.action) {
      const result = resolveServerAction(serverState, { type:body.action, id:body.id }, clock,
        { infiniteStamina: !!options.adminMode });
      if (!result.ok) return { ok:false, status:422, json:async () => ({ code:result.code, state:serverState, revision:serverRevision }) };
      serverState = result.state;
      processed = 'processed' in result ? result.processed : undefined;
    } else {
      if (hasServerOwnedChanges(serverState, body.state))
        return { ok:false, status:422, json:async () => ({ state:serverState, revision:serverRevision }) };
      serverState = body.state;
    }
    serverRevision++;
    return { ok:true, status:200, json:async () => ({ state:serverState, revision:serverRevision, processed }) };
  };
  const fakeDocument = { body: { dataset: {} }, visibilityState:'visible', getElementById: byId,
    createElement: element, querySelector: element, querySelectorAll: () => [],
    addEventListener: (name, fn) => events.set(name, fn) };
  const context = {
    console, Math, Intl, Date: FakeDate, JSON, Number, URLSearchParams,
    localStorage: { getItem: () => saved, setItem: (_, value) => { saved = value; localWrites++; } },
    document: fakeDocument,
    window: { location: { search: options.adminMode ? '?mode=admin' : '', assign() {} },
      addEventListener() {}, scrollTo() {} },
    fetch: fakeFetch,
    setTimeout: (fn, delay = 0) => {
      if (delay <= 100) Promise.resolve().then(() => { clock += delay; fn(); });
      return 1;
    }, clearTimeout() {}, setInterval: fn => { interval = fn; }
  };
  vm.runInNewContext(chronicle, context, { filename: 'chronicle.js' });
  vm.runInNewContext(source, context, { filename: 'game.js' });
  return {
    state: () => JSON.parse(saved), view: id => byId(id).innerHTML, text: id => byId(id).textContent,
    serverState: () => structuredClone(serverState),
    networkRequests: () => postCount,
    networkActions: () => networkActions.slice(),
    localWrites: () => localWrites,
    setVisibility: value => { fakeDocument.visibilityState = value; events.get('visibilitychange')?.(); },
    settle: async () => { for (let i = 0; i < 12; i++) await new Promise(resolve => setImmediate(resolve)); },
    tick: (ms = 1000) => { clock += ms; interval?.(); },
    click: (attribute, value) => events.get('click')({ target: { closest: query => query === `[data-${attribute}]`
      ? { dataset: { [attribute.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())]: value } } : null } })
  };
}

const base = { saveFormat:2, theme: 'evolution', gold: 1000, essence: 50, shards: 2, level: 15, xp: 0,
  progress: 10, enemyHp: 100, playerHp: 120, clicks: 500, kills: 10, purchases: 30,
  questIndex: 0, items: {}, helpers: {}, seenIntro: true, lastSaved: Date.now(),
  caravan: { index: 0, finish: Date.now() + 80_000 },
  prestige: { count: 0, points: 0, perks: { wealth: 1 } } };
const firstRun = harness(base);
firstRun.click('action', 'gather'); // First mutation writes the migrated state.
assert.equal(firstRun.state().runClicks, 500);
assert.equal(firstRun.state().runKills, 10);
firstRun.click('nav', 'prestige');
assert.match(firstRun.view('secondaryView'), /\+2 P/);
firstRun.click('action', 'confirmPrestige');
firstRun.click('action', 'doPrestige');
const reset = firstRun.state();
assert.equal(reset.progress, 0);
assert.equal(reset.level, 1);
assert.equal(reset.prestige.count, 1);
assert.equal(reset.prestige.points, 2);
assert.equal(reset.gold, 950);
assert.equal(reset.shards, 2);
assert.equal(reset.caravan.index, 0);
assert.equal(reset.runClicks, 0);
assert.equal(reset.runKills, 0);
assert.equal(reset.clicks, 500);
assert.equal(reset.kills, 10);
firstRun.click('nav', 'battle');
assert.match(firstRun.view('quickQuest'), /0 \/ 15/);
firstRun.click('action', 'attack');
assert.equal(firstRun.state().runClicks, 1);
assert.equal(firstRun.state().clicks, 501);

const returning = harness({ ...base, progress: 0, level: 1,
  prestige: { count: 1, points: 0, perks: {} } });
returning.click('action', 'gather');
assert.equal(returning.state().runClicks, 0);
assert.match(returning.view('quickQuest'), /0 \/ 15/);
returning.click('nav', 'quests');
assert.match(returning.view('secondaryView'), /백 번의 일격/);
returning.click('nav', 'shop');
assert.match(returning.view('secondaryView'), /현재 작전 성장 가이드/);
assert.match(returning.view('secondaryView'), /야영 회복 체계/);
assert.doesNotMatch(returning.view('secondaryView'), /전투 기술 교범/,'shop opens with a concise recommendation list');
returning.click('shop-filter','stamina');
assert.match(returning.view('secondaryView'), /야영 회복 체계/);
assert.match(returning.view('secondaryView'), /행군 효율 훈련/);
assert.doesNotMatch(returning.view('secondaryView'), /강화된 무기/);
returning.click('shop-filter','combat');
assert.match(returning.view('secondaryView'), /전투 기술 교범/);
assert.doesNotMatch(returning.view('secondaryView'), /야영 회복 체계/);
returning.click('shop-filter','all');
assert.equal((returning.view('secondaryView').match(/data-buy="/g) || []).length,18,'all eighteen shop upgrades remain accessible');
returning.click('nav','battle');
returning.click('action','shopStamina');
assert.match(returning.view('secondaryView'), /행군 효율 훈련/);
assert.doesNotMatch(returning.view('secondaryView'), /강화된 무기/);
returning.click('nav','inventory');
assert.equal(returning.text('pageTitle'),'장비와 보급상자','advanced menu remains reachable');
returning.click('action','toggleMoreNav');
returning.click('nav','battle');
assert.match(returning.view('leftHelperSlots'), /동료 0\/6/,'six vacant helper slots collapse into one clear shortcut');

const seventhChapter = harness({ ...base, progress: 60, level: 25 });
seventhChapter.click('nav', 'shop');
const rewardText = seventhChapter.view('secondaryView').match(/승리 예상 금화 ([\d,]+)G/);
assert.ok(rewardText);
const goldAtChapter7 = Number(rewardText[1].replaceAll(',', ''));
assert.equal(goldAtChapter7, Math.round(300 * 1.42 ** 6 * 1.15));

// Level stats grow even without equipment; LV.5/LV.10 grant a visible mastery spike.
const nearFive = harness({ ...base, level: 4, xp: 925, progress: 0, enemyHp: 320,
  items: {}, helpers: {}, inventory: [], equipped: { weapon: null, armor: null, relic: null } });
assert.equal(nearFive.text('dpcValue'), '16');
nearFive.click('action', 'attack');
assert.equal(nearFive.state().level, 5);
assert.equal(nearFive.text('dpcValue'), '19');
assert.match(nearFive.text('growthBonus'), /공격 \+10% · 최대 체력 \+25/);
assert.match(nearFive.text('growthNext'), /LV\.10/);
assert.equal(nearFive.text('playerHpText'), '185 / 185');
assert.match(nearFive.text('statusTitle'), /돌파/);
assert.equal(calculateCombatPower(nearFive.state()), Number(nearFive.text('powerValue').replaceAll(',', '')),
  'server leaderboard power matches the game combat formula at the level 5 mastery spike');
const gearAndTech = harness({ ...base, level: 32, progress: 84, items: { blade: 12, drone: 8, amplifier: 3, armor: 7 },
  helpers: { scout: 5, mage: 3, ranger: 1 }, modules: { force: 2, swift: 3, shell: 2 },
  technologies: { fire: true, bronze: true, steam: true, alloy: true },
  prestige: { count: 2, points: 0, perks: { might: 2, soul: 1 } },
  inventory: [{ id: 'qa-weapon', value: 41 }, { id: 'qa-armor', value: 72 }],
  equipped: { weapon: 'qa-weapon', armor: 'qa-armor', relic: null } });
assert.equal(calculateCombatPower(gearAndTech.state()), Number(gearAndTech.text('powerValue').replaceAll(',', '')),
  'server leaderboard power matches equipment, helpers, research, and legacy bonuses');

// Every chapter has a ten-step curve: supply relief, two armored checks, a boss.
const missionSeeds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const expectedHp = [320, 432, 512, 672, 832, 896, 704, 1024, 1248, 2304];
for (const [index, hp] of expectedHp.entries()) {
  const stage = harness({ ...base, progress: index, level: 1, enemyHp: hp, inventory: [],
    equipped: { weapon: null, armor: null, relic: null }, prestige: { count: 0, points: 0, perks: {} } });
  assert.equal(stage.text('enemyHpText'), `${hp.toLocaleString('ko-KR')} / ${hp.toLocaleString('ko-KR')}`);
  assert.ok(stage.text('missionPayout').includes('XP'));
}
const cargoStage = harness({ ...base, progress: 3, enemyHp: 1 });
assert.match(cargoStage.text('missionPayout'), /금화 828/); // Wealth perk +15% applied to 720.
const bossStage = harness({ ...base, progress: 9, enemyHp: 300,
  prestige: { count: 0, points: 0, perks: {} }, inventory: [] });
assert.match(bossStage.text('fieldCondition'), /각성/);
assert.match(bossStage.text('battleHint'), /더 빠르고 강한 반격/);
assert.match(bossStage.text('missionPayout'), /금화 2,250/);
const alteredChapter = harness({ ...base, progress: 60, enemyHp: 1 });
assert.match(alteredChapter.text('chapterTrait'), /산업 생산력/);
assert.match(alteredChapter.text('chapterTrait'), /수송 보상/);
const timedChapter = harness({ ...base, progress: 122, enemyHp: 1000, timer: 60 });
assert.match(timedChapter.text('missionTimer'), /50초/);
const defended = harness({ ...base, level: 1, progress: 0, enemyHp: 320, playerHp: 120, items: { barrier: 2 }, helpers: {} });
defended.click('action', 'attack');
defended.tick(2000);
defended.tick(600);
assert.equal(defended.text('playerHpText'), '119 / 120', 'barrier upgrades must actually reduce enemy retaliation');

// The enemy remains visible from the start; finished battles use a separate
// chapter story emblem without newly generated illustrations.
const battleMarkup = fs.readFileSync(new URL('./public/play.html', import.meta.url), 'utf8');
assert.doesNotMatch(battleMarkup, /id="armorGrid"/, 'the old 12-tile illustration cover must be gone');
const storyData = { window: {} };
vm.runInNewContext(chronicle, storyData);
assert.equal(storyData.window.ERA_CHAPTERS.length, 14);
assert.equal(storyData.window.ERA_CHAPTERS.reduce((n, ch) => n + ch.missions.length, 0), 140);
for (const ch of storyData.window.ERA_CHAPTERS) {
  assert.equal(ch.missions.length, 10, ch.name + ' must have 10 missions');
  assert.ok(ch.prologue.length > 50 && ch.epilogue.length > 40);
  assert.ok(ch.missions.every(([name, setup, outcome]) => name.length > 1 && setup.length > 15 && outcome.length > 15));
}
const eras = [
  ['원시 시대','석제 도끼','🪓','번개의 선물'],
  ['원시 시대','부싯돌 창','🏹','강변의 첫 움막'],
  ['고대·청동 시대','청동 창','🔱','점토판의 약속'],
  ['고대·청동 시대','청동 검','🗡️','멈춘 구리 광산'],
  ['중세 시대','철제 장검','⚔️','대장간의 첫 불'],
  ['중세 시대','강력한 석궁','🏹','성벽의 전령'],
  ['산업혁명 시대','초기 화약 포','💣','끓는 물의 비밀'],
  ['산업혁명 시대','연발 소총','🔫','철도의 종착역'],
  ['현대 시대','자동 소총','🔫','첫 번째 컴퓨터'],
  ['현대 시대','정밀 드론','🛰️','바닷가의 경고'],
  ['미래 시대','플라즈마 라이플','⚡','핵융합 점화'],
  ['미래 시대','양자 입자총','💠','항성 지도 제작'],
  ['우주 시대','궤도 광자포','🚀','달의 첫 새벽'],
  ['우주 시대','반물질 광선포','🌌','외행성의 전초기지']
];
for (const [index, [age, weapon, icon, firstMission]] of eras.entries()) {
  const victory = harness({ ...base, progress: index * 10, level: 1, enemyHp: 1, playerHp: 120, inventory: [] });
  assert.equal(victory.state().theme, 'evolution');
  assert.equal(victory.text('attackWeaponIcon'), icon);
  assert.match(victory.text('attackWeaponName'), new RegExp(weapon));
  assert.match(victory.text('pageTitle'), new RegExp(firstMission));
  assert.match(victory.text('worldLabel'), new RegExp(age));
  victory.click('action', 'attack');
  assert.equal(victory.state().awaitingNext, true);
  assert.match(victory.view('modalRoot'), /victory-era-panel/);
  assert.match(victory.view('modalRoot'), new RegExp(age));
  assert.doesNotMatch(victory.view('modalRoot'), /victory-.*\.webp/);
  assert.match(victory.view('modalRoot'), /modal-rewards/);
  assert.match(victory.view('modalRoot'), /다음 미션으로/);
  const reloadedVictory = harness(victory.state());
  assert.match(reloadedVictory.view('modalRoot'), /victory-era-panel/);
  assert.match(reloadedVictory.view('modalRoot'), /금화/);
  victory.click('action', 'next');
  assert.equal(victory.state().lastVictory, null);
}
// The space-age extension never wraps back to stone tools.
const outerSpace = harness({ ...base, progress: 140, level: 48 });
assert.equal(outerSpace.text('attackWeaponIcon'), '🌌');
assert.match(outerSpace.text('pageTitle'), /성간 개척/);
// Each boss unlocks a chapter-story modal with the new civilization and weapon.
const changeEra = harness({ ...base, progress: 19, enemyHp: 1, level: 5 });
changeEra.click('action', 'attack');
changeEra.click('action', 'next');
assert.match(changeEra.view('modalRoot'), /두 강의 첫 도시/);
assert.match(changeEra.view('modalRoot'), /청동 창/);
assert.equal(changeEra.text('attackWeaponIcon'), '🔱');
changeEra.click('action', 'close');
changeEra.click('action', 'chapterStory');
assert.match(changeEra.view('modalRoot'), /고대·청동 시대/);

// Timed research deducts resources once, runs offline and awards an actual
// permanent passive on the clock. A reload and a prestige both retain it.
const scientist = harness({ ...base, progress: 0, level: 1, gold: 500, essence: 0, shards: 0, enemyHp: 320 });
scientist.click('nav','modules');
assert.match(scientist.view('secondaryView'), /불의 사용/);
assert.match(scientist.view('secondaryView'), /45초/);
scientist.click('tech','fire');
assert.equal(scientist.state().gold,380);
assert.equal(scientist.state().researchQueue.id,'fire');
scientist.click('tech','forage');
assert.equal(scientist.state().gold,380,'cannot start two simultaneous technologies');
const resumedResearch = harness(scientist.state());
resumedResearch.tick(46000);
assert.equal(resumedResearch.state().technologies.fire,true);
assert.equal(resumedResearch.state().researchQueue,null);
assert.equal(resumedResearch.text('dpcValue'),'11','technology passive is included in click power');
resumedResearch.click('nav','modules');
assert.match(resumedResearch.view('secondaryView'), /연구 완료 · 영구 적용 중/);
const knownTech = harness({ ...base, progress: 10, level: 15, technologies: { fire:true }, researchQueue: null });
knownTech.click('nav','prestige');
knownTech.click('action','confirmPrestige');
knownTech.click('action','doPrestige');
assert.equal(knownTech.state().technologies.fire,true,'prestige must not erase technology research');

// Stamina is paid once on mission entry, survives reload, and recovers offline.
const activeStamina = harness({ ...base, progress:0, level:1, stamina:12, staminaUpdatedAt:Date.now(), enemyHp:320, gold:2000 });
activeStamina.click('action','attack');
assert.equal(activeStamina.state().stamina,7);
assert.equal(activeStamina.state().missionEntered,true);
activeStamina.click('action','attack');
assert.equal(activeStamina.state().stamina,7,'each click must not charge stamina again');
const resumedStamina = harness(activeStamina.state());
assert.equal(resumedStamina.state().missionEntered,true);
resumedStamina.tick(90_000);
assert.equal(resumedStamina.state().stamina,8,'90 seconds restore one stamina even after reload');
// Each level increases maximum stamina by 2, without buying capacity in the store.
const starterCap = harness({ ...base, level:1, progress:0, stamina:72 });
assert.equal(starterCap.text('staminaText'),'72 / 72');
const higherCap = harness({ ...base, level:5, progress:0, stamina:80 });
assert.equal(higherCap.text('staminaText'),'80 / 80');
assert.equal(harness({ ...base, level:15, progress:0, stamina:100 }).text('staminaText'),'100 / 100');
const nextLevel = harness({ ...base, level:4, xp:925, progress:0, stamina:70, enemyHp:320, items:{} });
nextLevel.click('action','attack');
assert.equal(nextLevel.state().level,5);
assert.equal(nextLevel.text('staminaText').split(' / ')[1],'80','level-up increases capacity immediately');

// Shop improvements visibly change passive recovery, camp supply, and mission costs.
const regenUpgrade = harness({ ...base, level:1, progress:0, gold:10_000, stamina:10, staminaUpdatedAt:Date.now(), items:{} });
regenUpgrade.click('nav','shop');
assert.match(regenUpgrade.view('secondaryView'), /야영 회복 체계/);
assert.match(regenUpgrade.view('secondaryView'), /행군 효율 훈련/);
assert.match(regenUpgrade.view('secondaryView'), /레벨마다 최대 \+2/);
regenUpgrade.click('buy','staminaRecovery');
assert.equal(regenUpgrade.state().items.staminaRecovery,1);
assert.equal(regenUpgrade.state().gold,9150);
regenUpgrade.click('nav','battle');
assert.match(regenUpgrade.text('staminaInfo'), /자연 \+2\/85초/);
regenUpgrade.tick(85_000);
assert.equal(regenUpgrade.state().stamina,12);
const offlineRecovery = harness({ ...regenUpgrade.state(), staminaUpdatedAt:Date.now() - 85_000 });
offlineRecovery.tick(1000);
assert.equal(offlineRecovery.state().stamina,14,'recovery upgrade works across reloads');
offlineRecovery.click('action','campSupply');
assert.equal(offlineRecovery.state().stamina,39,'camp supply amount scales with recovery upgrade');
assert.equal(offlineRecovery.state().gold,8730);
const efficient = harness({ ...base, level:1, progress:0, stamina:30, gold:30_000, items:{} });
efficient.click('nav','shop');
for(let level=1;level<=3;level++) efficient.click('buy','staminaEfficiency');
assert.equal(efficient.state().items.staminaEfficiency,3);
assert.match(efficient.view('secondaryView'), /최대 강화 완료/);
const cappedGold = efficient.state().gold;
efficient.click('buy','staminaEfficiency');
assert.equal(efficient.state().gold,cappedGold,'maxed stamina efficiency cannot be bought again');
efficient.click('nav','battle');
assert.match(efficient.text('staminaInfo'), /입장 -2/);
efficient.click('action','attack');
assert.equal(efficient.state().stamina,28);
const afterReload = harness(efficient.state());
assert.equal(afterReload.state().items.staminaEfficiency,3,'stamina upgrades survive save/reload');
afterReload.click('nav','shop');
assert.match(afterReload.view('secondaryView'), /효율 LV\.3 \/ 3/);
const maxedRecovery = harness({ ...base, level:1, progress:0, stamina:0, items:{ staminaRecovery:5, staminaEfficiency:3 } });
assert.match(maxedRecovery.text('staminaInfo'), /자연 \+6\/65초/);
maxedRecovery.tick(65_000);
assert.equal(maxedRecovery.state().stamina,6);
maxedRecovery.click('nav','shop');
assert.match(maxedRecovery.view('secondaryView'), /보급 \+37/);
const laterEfficiency = harness({ ...base, progress:120, level:45, stamina:80, items:{ staminaEfficiency:3 } });
assert.match(laterEfficiency.text('staminaInfo'), /입장 -5/,'late-game cost still scales with chapters');
const emptyStamina = harness({ ...base, progress:0, level:1, stamina:0, staminaUpdatedAt:Date.now(), enemyHp:320, gold:2000, helpers:{scout:1} });
emptyStamina.tick(5000);
assert.equal(emptyStamina.state().enemyHp,320,'automatic attacks cannot bypass the mission entry cost');
emptyStamina.click('action','attack');
assert.equal(emptyStamina.state().enemyHp,320);
assert.ok(!emptyStamina.state().missionEntered);
emptyStamina.click('action','campSupply');
assert.equal(emptyStamina.state().stamina,22);
assert.equal(emptyStamina.state().gold,1580);
emptyStamina.click('action','campSupply');
assert.equal(emptyStamina.state().gold,1580,'supply cooldown blocks repeated purchases');
emptyStamina.click('action','attack');
assert.equal(emptyStamina.state().stamina,17);
// Old seven-mission saves land in the same age on the new fourteen-chapter timeline.
const oldSave = harness({ ...base, saveFormat:undefined, theme:'cyber', progress:7, enemyHp:100 });
assert.match(oldSave.text('pageTitle'), /두 강의 첫 도시/);
oldSave.click('action','gather');
assert.equal(oldSave.state().progress,20);
assert.equal(oldSave.state().saveFormat,2);
assert.equal(oldSave.state().theme,'evolution');

// A one-click-per-second solo playthrough with affordable upgrades must clear
// the first two chapters without an unexplained economy or difficulty wall.
const playtest = harness({ theme: 'evolution', seenIntro: true, lastSaved: Date.now() });
playtest.click('action', 'daily'); // The free daily stamina reward supports an active play session.
const shopChoices = [
  { id: 'blade', base: 120, growth: 1.55, value: 5, kind: 'items' },
  { id: 'rune', base: 420, growth: 1.55, value: 18, kind: 'items' },
  { id: 'drone', base: 330, growth: 1.55, value: 3, kind: 'items' },
  { id: 'scout', base: 150, growth: 1.75, value: 8, kind: 'helpers', req: 2 },
  { id: 'mage', base: 900, growth: 1.75, value: 30, kind: 'helpers', req: 5 },
  { id: 'golem', base: 5000, growth: 1.75, value: 140, kind: 'helpers', req: 10 },
  { id: 'ranger', base: 18000, growth: 1.75, value: 360, kind: 'helpers', req: 18 }
];
const stageRecords = [];
let retryCount = 0;
for (let stage = 0; stage < 28; stage++) {
  const before = playtest.state(), health = Number(playtest.text('enemyHpText').split(' / ')[1].replaceAll(',', ''));
  let clicks = 0;
  for (let elapsed = 0; elapsed < 300; elapsed++) {
    const state = playtest.state();
    if (state.awaitingNext) break;
    if (state.battleOver) { retryCount++; playtest.click('action', 'retry'); continue; }
    if (!state.missionEntered && state.stamina < 5 + Math.floor(Math.floor(state.progress / 10) / 4) && elapsed === 0) playtest.click('action', 'campSupply');
    if (state.playerHp < 40 && state.playerHp < 120 + (state.level - 1) * 10) playtest.click('action', 'heal');
    else { playtest.click('action', 'attack'); clicks++; }
    playtest.tick();
  }
  assert.ok(playtest.state().awaitingNext, `stage ${stage + 1} should be completable · HP ${playtest.state().enemyHp} · ST ${playtest.state().stamina} · gold ${playtest.state().gold} · level ${playtest.state().level} · entered ${playtest.state().missionEntered}`);
  stageRecords.push({ stage: stage + 1, hp: health, attacks: clicks, level: playtest.state().level });
  playtest.click('action', 'next');
  for (let purchase = 0; purchase < 12; purchase++) {
    const state = playtest.state();
    const candidates = shopChoices.map(item => ({ ...item, cost: Math.floor(item.base * item.growth ** (state[item.kind]?.[item.id] || 0)) }))
      .filter(item => state.level >= (item.req || 1) && item.cost <= state.gold * .8)
      .sort((a, b) => b.value / b.cost - a.value / a.cost);
    if (!candidates.length) break;
    const pick = candidates[0];
    playtest.click(pick.kind === 'items' ? 'buy' : 'helper', pick.id);
  }
}
assert.equal(retryCount, 0, 'the opening four chapters should be clearable with sensible upgrades');
assert.ok(stageRecords[6].level >= 5, 'first chapter should reach the first level-mastery breakthrough');
assert.ok(playtest.state().level >= 9, 'chapter two should unlock midgame companions');
assert.ok(Number(playtest.text('dpcValue')) >= 50, 'click damage should visibly outgrow the starting 10');
console.log('balance-playtest:', JSON.stringify({ retries: retryCount, milestones: stageRecords.filter(r => [1, 4, 7, 10, 14, 17, 21, 24, 28].includes(r.stage)), finalLevel: playtest.state().level, gold: playtest.state().gold }));

// New players enter the hands-on tutorial directly after the story prologue.
const beginner = harness({ ...base, seenIntro: false, progress: 0, level: 1,
  clicks: 0, kills: 0, purchases: 0, gold: 500, essence: 0, questIndex: 0,
  prestige: { count: 0, points: 0, perks: {} }, caravan: null });
beginner.click('action', 'begin');
assert.equal(beginner.state().tutorial.active, true);
assert.equal(beginner.state().tutorial.step, 0);
assert.match(beginner.view('tutorialRoot'), /첫 공격/);
for (let i = 0; i < 3; i++) beginner.click('action', 'attack');
assert.match(beginner.view('tutorialRoot'), /목표 달성/);
beginner.click('action', 'tutorialStep');
assert.equal(beginner.state().tutorial.step, 1);
beginner.click('action', 'gather');
assert.match(beginner.view('tutorialRoot'), /목표 달성/);

// A reload retains the active step and progress.
const resumed = harness(beginner.state());
assert.equal(resumed.state().tutorial.step, 1);
assert.match(resumed.view('tutorialRoot'), /채집과 스태미너/);
for (let i = 0; i < 5; i++) resumed.click('action', 'tutorialStep');
assert.equal(resumed.state().tutorial.step, 6);
resumed.click('action', 'tutorialStep');
assert.equal(resumed.state().tutorial.active, false);
assert.equal(resumed.state().tutorial.version, 1);
assert.equal(resumed.state().tutorial.rewardClaimed, true);
assert.equal(resumed.state().essence, 10);
resumed.click('action', 'restartTutorial');
assert.equal(resumed.state().tutorial.step, 0);
resumed.click('action', 'tutorialStop');
assert.equal(resumed.state().tutorial.active, false);
assert.equal(resumed.state().tutorial.version, 1);
assert.equal(resumed.state().essence, 10); // Rewards are granted once.
console.log('game-smoke: saves, prestige, quests, tutorial onboarding/replay/resume passed');
