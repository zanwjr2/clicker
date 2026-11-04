import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveServerAction } from './app/combat-engine.ts';
import { newGameState } from './app/game-default.ts';
import { hasServerOwnedChanges } from './app/server-owned-fields.ts';
import { harness } from './game-smoke.test.mjs';

const NOW = Date.now();
const starter = () => newGameState(NOW - 1000);
const doAction = (state, type, at = NOW, id) => {
  const result = resolveServerAction(state, { type, id }, at);
  assert.equal(result.ok, true, `${type} rejected: ${result.code}`);
  return result.state;
};

test('the server alone calculates attacks, stamina, XP and mission rewards', () => {
  const original = starter();
  let current = doAction(original, 'attack', NOW);
  assert.equal(original.clicks, 0, 'server engine must not mutate its stored input');
  assert.equal(current.clicks, 1);
  assert.equal(current.runClicks, 1);
  assert.equal(current.stamina, 67);
  assert.equal(current.enemyHp, 310);
  assert.equal(current.xp, 18);
  assert.equal(hasServerOwnedChanges(original, current), true);
  for (let i = 1; i < 32; i++) current = doAction(current, 'attack', NOW + i * 100);
  assert.equal(current.awaitingNext, true);
  assert.equal(current.kills, 1);
  assert.equal(current.runKills, 1);
  assert.equal(current.enemyHp, 0);
  assert.equal(current.lastVictory.gold, 300);
  assert.ok(current.gold >= 800);
  const advanced = doAction(current, 'next', NOW + 3300);
  assert.equal(advanced.progress, 1);
  assert.equal(advanced.enemyHp, 432);
  assert.equal(advanced.missionEntered, false);
});

test('client snapshots cannot fabricate rewards, kills, combat power sources or prestige', () => {
  const original = starter();
  assert.equal(hasServerOwnedChanges(original, { ...original, gold: 99999 }), false,
    'currency is checked by the economy validator, separately');
  for (const field of ['clicks', 'kills', 'progress', 'enemyHp', 'gearFound',
    'keys', 'achievements', 'questIndex', 'combatUpdatedAt']) {
    const forged = structuredClone(original);
    if (field === 'keys') forged.keys.gold++;
    else if (field === 'achievements') forged.achievements.push('legend');
    else forged[field] = (forged[field] || 0) + 1;
    assert.equal(hasServerOwnedChanges(original, forged), true, field);
  }
  const prestige = structuredClone(original); prestige.prestige.count++;
  assert.equal(hasServerOwnedChanges(original, prestige), true);
});

test('server time and cooldowns cannot be accelerated by forged tick requests', () => {
  const base = starter();
  base.items.drone = 4;
  const entered = doAction(base, 'attack', NOW);
  const ticked = doAction(entered, 'tick', NOW + 1000);
  assert.ok(ticked.enemyHp < entered.enemyHp);
  const repeated = doAction(ticked, 'tick', NOW + 1000);
  assert.equal(repeated.enemyHp, ticked.enemyHp, 'same server time does not grant more DPS');
  const rapid = resolveServerAction(entered, { type: 'attack' }, NOW + 10);
  assert.equal(rapid.ok, false);
  assert.equal(rapid.code, 'action-rate-limit');
});

test('a timed mission still expires after a background-tab gap', () => {
  const timed = starter();
  Object.assign(timed, { progress:2, enemyHp:500, missionEntered:true,
    timerStarted:true, timer:50, combatUpdatedAt:NOW, enemyAttackAt:NOW });
  timed.items.drone = 50;
  timed.enemyHp = 1;
  const afterLongGap = doAction(timed, 'tick', NOW + 60_000);
  assert.equal(afterLongGap.timer, 0);
  assert.equal(afterLongGap.battleOver, true,
    'pausing periodic network requests must not pause the server clock');
  assert.equal(afterLongGap.kills, 0,
    'offline helper damage must not award a victory after the deadline');
});

test('batched attacks retain server-enforced rate limits and never trust a forged click count', () => {
  const original = starter();
  const burst = resolveServerAction(original, { type:'attackBurst', id:6 }, NOW);
  assert.equal(burst.ok, true);
  assert.equal(burst.processed, 6);
  assert.equal(burst.state.clicks, 6);
  assert.equal(burst.state.runClicks, 6);
  assert.equal(burst.state.enemyHp, 260);
  assert.equal(burst.state.stamina, 67, 'one mission consumes stamina once');
  assert.equal(original.clicks, 0, 'the input snapshot is never mutated');
  for (const count of [0, -1, 7, 1000, 2.5, '6']) {
    const forged = resolveServerAction(original, { type:'attackBurst', id:count }, NOW);
    assert.equal(forged.ok, false, `${count} must not be accepted`);
    assert.equal(forged.code, 'invalid-burst');
  }
  const tooFast = resolveServerAction(burst.state, { type:'attackBurst', id:6 }, NOW + 20);
  assert.equal(tooFast.ok, false);
  assert.equal(tooFast.code, 'action-rate-limit');
  const cooled = resolveServerAction(burst.state, { type:'attackBurst', id:6 }, NOW + 170);
  assert.equal(cooled.ok, true);
  assert.equal(cooled.processed, 2, 'only elapsed server time earns additional accepted hits');
  assert.equal(cooled.state.clicks, 8);
});

test('infinite stamina is applied only through an explicit server-authorized engine option', () => {
  const depleted = starter();
  depleted.stamina = 0;
  const normal = resolveServerAction(depleted, { type:'attack' }, NOW);
  assert.equal(normal.ok, false, 'ordinary accounts must still pay stamina');
  const admin = resolveServerAction(depleted, { type:'attack' }, NOW, { infiniteStamina:true });
  assert.equal(admin.ok, true);
  assert.equal(admin.state.stamina, 72);
  assert.equal(admin.state.missionEntered, true);
  assert.equal(admin.state.clicks, 1);
  const result = resolveServerAction(admin.state, { type:'tick' }, NOW + 1000, { infiniteStamina:true });
  assert.equal(result.state.stamina, 72);
  assert.equal(depleted.stamina, 0, 'server actions must not mutate their input');
});

test('admin browser displays infinite stamina while using authoritative server actions', async () => {
  const source = starter();
  source.seenIntro = true;
  source.eventDay = new Date().toLocaleDateString('sv-SE', { timeZone:'Asia/Seoul' });
  source.stamina = 0;
  const browser = harness(source, { online:true, adminAvailable:true, adminMode:true });
  await browser.settle();
  assert.match(browser.text('staminaTop'), /∞/);
  browser.click('action', 'attack');
  await browser.settle();
  assert.equal(browser.serverState().clicks, 1);
  assert.equal(browser.serverState().stamina, 72);
  browser.click('action', 'testTools');
  assert.match(browser.view('modalRoot'), /테스트 진행 데이터 초기화/);
});

test('quest, chest and daily payouts are server-computed and cannot repeat', () => {
  const base = starter();
  const chest = doAction(base, 'openChest', NOW, 'bronze');
  assert.equal(chest.keys.bronze, 0);
  assert.equal(chest.chestsOpened, 1);
  assert.equal(chest.inventory.length, 1);
  assert.equal(resolveServerAction(chest, { type: 'openChest', id: 'bronze' }, NOW + 100).ok, false);
  const daily = doAction(chest, 'claimDaily', NOW + 100);
  assert.equal(daily.essence, chest.essence + 5);
  assert.equal(resolveServerAction(daily, { type: 'claimDaily' }, NOW + 200).ok, false);
  const ready = structuredClone(daily); ready.runClicks = 15; ready.clicks = 15;
  const quest = doAction(ready, 'claimQuest', NOW + 300);
  assert.equal(quest.gold, ready.gold + 250);
  assert.equal(quest.questIndex, 1);
  assert.equal(resolveServerAction(quest, { type:'claimAchievement', id:'__proto__' }, NOW + 400).ok, false,
    'prototype keys are never valid reward IDs');
});

test('special combat and rebirth use server-owned state', () => {
  const source = starter();
  Object.assign(source, { level: 15, progress: 10, gold: 9999, essence: 500 });
  const launched = doAction(source, 'startSpecial', NOW);
  assert.ok(launched.specialMission.max > 3000);
  assert.equal(launched.specialWins, 0);
  const hit = doAction(launched, 'strikeSpecial', NOW + 100);
  assert.ok(hit.specialMission.hp < launched.specialMission.hp);
  const rebirth = doAction(source, 'doPrestige', NOW + 100);
  assert.equal(rebirth.level, 1);
  assert.equal(rebirth.progress, 0);
  assert.equal(rebirth.prestige.count, 1);
  assert.equal(rebirth.gold, 800);
  assert.equal(rebirth.combatAuthority, 1);
});

test('legacy accounts missing newer action counters are safely migrated by the server', () => {
  const legacy = starter();
  delete legacy.healsUsed;
  delete legacy.skillsUsed;
  delete legacy.tutorialGathers;
  delete legacy.specialStrikes;
  delete legacy.runClicks;
  legacy.clicks = 10;
  const gathered = doAction(legacy, 'gather', NOW);
  assert.equal(gathered.tutorialGathers, 1);
  assert.equal(gathered.runClicks, 10);
  assert.equal(gathered.specialStrikes, 0);
});

test('the browser consumes authoritative responses and flushes paid upgrades before combat', async () => {
  const seeded = newGameState(Date.now() - 1000);
  seeded.seenIntro = true;
  seeded.eventDay = new Date().toLocaleDateString('sv-SE', { timeZone:'Asia/Seoul' });
  const browser = harness(seeded, { online:true });
  await browser.settle();
  browser.click('buy', 'blade');
  browser.click('action', 'attack');
  await browser.settle();
  const stored = browser.serverState();
  assert.equal(stored.items.blade, 1, 'shop upgrade should be saved before attack command');
  assert.equal(stored.clicks, 1);
  assert.equal(stored.enemyHp, 305);
  assert.equal(browser.state().enemyHp, stored.enemyHp);
  browser.tick(100);
  browser.click('action', 'gather');
  await browser.settle();
  assert.equal(browser.serverState().tutorialGathers, 1);
  assert.equal(browser.state().gold, browser.serverState().gold);
});

test('attack responds visually before the server reply, then reconciles to verified HP', async () => {
  const seeded = newGameState(Date.now() - 1000);
  seeded.seenIntro = true;
  seeded.eventDay = new Date().toLocaleDateString('sv-SE', { timeZone:'Asia/Seoul' });
  const browser = harness(seeded, { online:true });
  await browser.settle();
  assert.match(browser.text('enemyHpText'), /320 \/ 320/);
  browser.click('action', 'attack');
  assert.match(browser.text('enemyHpText'), /310 \/ 320/,
    'visual feedback should not wait for fetch resolution');
  await browser.settle();
  assert.equal(browser.serverState().enemyHp, 310);
  assert.equal(browser.state().enemyHp, 310);
  assert.match(browser.text('enemyHpText'), /310 \/ 320/);
});

test('six rapid clicks need one authoritative server request and still register six attacks', async () => {
  const seeded = newGameState(Date.now() - 1000);
  seeded.seenIntro = true;
  const browser = harness(seeded, { online:true });
  await browser.settle();
  for (let i = 0; i < 6; i++) browser.click('action', 'attack');
  assert.match(browser.text('enemyHpText'), /260 \/ 320/, 'feedback is immediate even before batching');
  await browser.settle();
  assert.equal(browser.networkActions().filter(([action]) => action === 'attackBurst').length, 1,
    JSON.stringify(browser.networkActions()));
  assert.equal(browser.serverState().clicks, 6);
  assert.equal(browser.state().enemyHp, 260);
  assert.equal(browser.serverState().stamina, 67);
  assert.equal(browser.state().clicks, browser.serverState().clicks);
});

test('a burst stops at the victory boundary without granting extra attacks or rewards', async () => {
  const seeded = newGameState(Date.now() - 1000);
  Object.assign(seeded, { seenIntro:true, missionEntered:true, enemyHp:20 });
  const browser = harness(seeded, { online:true });
  await browser.settle();
  for (let i = 0; i < 6; i++) browser.click('action', 'attack');
  await browser.settle();
  assert.equal(browser.serverState().clicks, 2);
  assert.equal(browser.state().clicks, 2);
  assert.equal(browser.serverState().kills, 1);
  assert.equal(browser.serverState().awaitingNext, true);
  assert.equal(browser.networkActions().filter(([action]) => action === 'attackBurst').length, 1);
  assert.match(browser.view('modalRoot'), /victory-illustration/);
  assert.match(browser.view('modalRoot'), /이번 임무의 결말/);
});

test('only cleared missions or the current frontier can be selected, with no stamina cost', () => {
  const base = starter();
  base.progress = 20;
  base.enemyHp = 609;
  assert.equal(resolveServerAction(base, {type:'selectMission', id:21}, NOW).code, 'mission-locked');
  assert.equal(resolveServerAction(base, {type:'selectMission', id:139}, NOW).code, 'mission-locked');
  assert.equal(resolveServerAction(base, {type:'selectMission', id:140}, NOW).ok, false);
  assert.equal(resolveServerAction(base, {type:'selectMission', id:'9'}, NOW).ok, false);
  assert.equal(hasServerOwnedChanges(base, {...base, selectedMission:9}), true,
    'the browser cannot forge a chapter selection with a snapshot');
  const selected = doAction(base, 'selectMission', NOW, 9);
  assert.equal(base.selectedMission, null);
  assert.equal(selected.progress, 20, 'replaying never rewinds the progression record');
  assert.equal(selected.selectedMission, 9);
  assert.equal(selected.enemyHp, 2304, 'selected chapter boss has the correct HP');
  assert.equal(selected.missionEntered, false);
  assert.equal(selected.stamina, base.stamina, 'selection must not charge stamina');
  const returned = doAction(selected, 'selectMission', NOW + 100, 20);
  assert.equal(returned.selectedMission, null);
  assert.equal(returned.progress, 20);
  assert.equal(returned.enemyHp, 609);
});

test('legacy nonsequential clears remain replayable, but only explicit starts pay stamina', () => {
  const base = starter();
  base.progress = 3;
  base.clearedMissions = [0, 1, 2, 139]; // Already cleared in the previous build.
  assert.equal(resolveServerAction(base, {type:'selectMission', id:138}, NOW).code, 'mission-locked');
  const chosen = doAction(base, 'selectMission', NOW, 139);
  assert.equal(chosen.stamina, base.stamina);
  assert.equal(chosen.selectedMission, 139);
  assert.equal(chosen.missionEntered, false);
  assert.equal(hasServerOwnedChanges(base, { ...base, clearedMissions:[139] }), true,
    'the client cannot invent a completed boss stage');

  const started = doAction(chosen, 'startMission', NOW + 100);
  assert.equal(started.missionEntered, true);
  assert.equal(started.stamina, chosen.stamina - 8);
  assert.equal(started.clicks, chosen.clicks, 'starting is not an attack');
  assert.equal(resolveServerAction(started, {type:'startMission'}, NOW + 150).ok, false,
    'repeated starts must not restart a paid mission');

  started.enemyHp = 1;
  const beaten = doAction(started, 'attack', NOW + 200);
  assert.equal(beaten.lastVictory.replay, true);
  assert.ok(beaten.clearedMissions.includes(139));
  assert.equal(beaten.clearedMissions.filter(id => id === 139).length, 1);
  assert.equal(beaten.lastVictory.shard, 0, 'replaying an already cleared future boss cannot duplicate rewards');
  assert.equal(beaten.progress, 3, 'old nonsequential history does not skip unfinished stages');
  const advanced = doAction(beaten, 'next', NOW + 300);
  assert.equal(advanced.progress, 3);
  assert.equal(advanced.selectedMission, null);

  const replayStage = doAction(advanced, 'selectMission', NOW + 400, 139);
  assert.equal(replayStage.stamina, advanced.stamina);
  replayStage.enemyHp = 1;
  const replay = doAction(replayStage, 'attack', NOW + 500);
  assert.equal(replay.lastVictory.replay, true);
  assert.equal(replay.lastVictory.shard, 0);
  assert.equal(replay.lastVictory.foundGear, null);
  assert.equal(replay.lastVictory.foundKey, false);
  assert.equal(replay.clearedMissions.filter(id => id === 139).length, 1);
  const next = doAction(replay, 'next', NOW + 600);
  next.enemyHp = 1;
  const frontierWin = doAction(next, 'attack', NOW + 700);
  assert.equal(frontierWin.lastVictory.replay, false);
  assert.ok(frontierWin.clearedMissions.includes(3));
  const frontierAdvance = doAction(frontierWin, 'next', NOW + 800);
  assert.equal(frontierAdvance.progress, 4);
});

test('replayed chapter bosses pay reduced rewards, no repeat relic, and preserve unlocked stages', () => {
  const base = starter();
  base.progress = 20;
  const selected = doAction(base, 'selectMission', NOW, 9);
  selected.enemyHp = 1;
  const beaten = doAction(selected, 'attack', NOW + 100);
  assert.equal(beaten.awaitingNext, true);
  assert.equal(beaten.lastVictory.replay, true);
  assert.equal(beaten.lastVictory.shard, 0);
  assert.equal(beaten.lastVictory.foundKey, false);
  assert.equal(beaten.lastVictory.foundGear, null);
  assert.equal(beaten.essence, selected.essence + 1);
  assert.equal(beaten.shards, selected.shards);
  assert.equal(beaten.progress, 20);
  const returned = doAction(beaten, 'next', NOW + 200);
  assert.equal(returned.progress, 20);
  assert.equal(returned.selectedMission, null);
  assert.equal(returned.awaitingNext, false);
});

test('mission browser displays fourteen chapters, boss endings and selectable cleared stages', async () => {
  const seeded = newGameState(Date.now() - 1000);
  Object.assign(seeded, {seenIntro:true, progress:20, enemyHp:609, level:20});
  const browser = harness(seeded, {online:true});
  await browser.settle();
  browser.click('nav', 'chapters');
  assert.equal((browser.view('secondaryView').match(/data-browse-chapter=/g) || []).length, 14);
  assert.equal((browser.view('secondaryView').match(/data-select-mission=/g) || []).length, 0);
  assert.match(browser.view('secondaryView'), /미발견 미션/);
  browser.click('browse-chapter', '0');
  assert.match(browser.view('secondaryView'), /맘모스의 골짜기/);
  assert.match(browser.view('secondaryView'), /BOSS/);
  browser.click('select-mission', '9');
  await browser.settle();
  assert.equal(browser.serverState().selectedMission, 9);
  assert.equal(browser.serverState().progress, 20);
  assert.equal(browser.text('chapterName'), '불을 지키는 사람들');
  browser.click('action', 'startMission');
  await browser.settle();
  assert.equal(browser.serverState().missionEntered, true);
  assert.equal(browser.serverState().clicks, 0, 'explicit start does not attack');
  browser.click('nav', 'chapters');
  browser.click('browse-chapter', '2');
  assert.equal((browser.view('secondaryView').match(/data-select-mission=/g) || []).length, 0,
    'even the current uncompleted stage is not offered as a selectable card');
  assert.match(browser.view('secondaryView'), /disabled>클리어 후 선택 가능/);
  browser.click('browse-chapter', '1');
  browser.click('select-mission', '10');
  assert.match(browser.view('modalRoot'), /진행 중인 전투를 포기/);
  browser.click('action', 'confirmMissionSelect');
  await browser.settle();
  assert.equal(browser.serverState().selectedMission, 10);
  assert.equal(browser.serverState().progress, 20);
  assert.equal(browser.serverState().missionEntered, false);
});

test('inactive tabs stop polling, and timer-only server changes avoid local backup churn', async () => {
  const seeded = newGameState(Date.now() - 1000);
  seeded.seenIntro = true;
  const browser = harness(seeded, { online:true });
  await browser.settle();
  browser.click('action', 'attack');
  await browser.settle();
  const writesAfterAttack = browser.localWrites();
  browser.tick(2500);
  await browser.settle();
  assert.ok(browser.networkActions().some(([action]) => action === 'tick'));
  assert.equal(browser.localWrites(), writesAfterAttack,
    'server-only periodic tick should not synchronously rewrite localStorage');
  browser.setVisibility('hidden');
  const requestsAtHide = browser.networkRequests();
  browser.tick(10_000);
  await browser.settle();
  assert.equal(browser.networkRequests(), requestsAtHide,
    'no background interval should issue a redundant D1 request');
  browser.setVisibility('visible');
  browser.tick(250);
  await browser.settle();
  assert.ok(browser.networkRequests() > requestsAtHide,
    'the next visible interval catches up the authoritative game state');
});
