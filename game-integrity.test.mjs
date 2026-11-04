import assert from 'node:assert/strict';
import test from 'node:test';
import { validateGameTransition } from './app/game-integrity.ts';
import { newGameState } from './app/game-default.ts';
import { harness } from './game-smoke.test.mjs';

const now = 1_800_000_000_000;
const original = () => newGameState(now - 3000);
const change = (source, update) => {
  const next = structuredClone(source);
  update(next);
  return next;
};
const valid = (before, after, seconds = 3) =>
  validateGameTransition(before, after, seconds * 1000, now);
const accepted = (before, after, seconds) =>
  assert.equal(valid(before, after, seconds).ok, true,
    `expected legitimate transition, got ${valid(before, after, seconds).code}`);
const rejected = (before, after, code) => {
  const result = valid(before, after);
  assert.equal(result.ok, false, `expected rejection of ${code}`);
  if (code) assert.equal(result.code, code);
};

test('normal gathering and store upgrades are accepted, direct wallet edits are rejected', () => {
  const start = original();
  const gathered = change(start, s => { s.gold += 15; s.xp += 6; s.tutorialGathers++; });
  accepted(start, gathered);
  const upgraded = change(gathered, s => {
    s.gold -= 120; s.items.blade = 1; s.purchases++; s.runPurchases++; s.xp += 60;
  });
  accepted(gathered, upgraded);
  rejected(start, change(start, s => { s.gold = 10_000_000; }), 'unearned-gold');
  rejected(start, change(start, s => { s.gold += 1; }), 'unearned-gold');
  rejected(start, change(start, s => { s.xp += 1; }), 'unearned-xp');
  rejected(start, change(start, s => { s.items.blade = 99; }), 'unpaid-purchases');
  rejected(start, change(start, s => { s.essence += 300; }), 'unearned-essence');
  rejected(start, change(start, s => { s.shards += 7; }), 'unearned-shards');
  rejected(start, change(start, s => { s.keys.bronze += 1; }), 'unearned-chest-keys');
  rejected(start, change(start, s => { s.gold = 500.5; }), 'noninteger-stat');
  rejected(start, change(start, s => { s.items.blade = 0.5; }), 'invalid-upgrade');
  rejected(start, change(start, s => { s.playerHp = 999_999; }), 'unearned-player-health');
  const tired = change(start, s => { s.stamina = 25; });
  rejected(tired, change(tired, s => { s.stamina++; }), 'unearned-stamina');
});

test('legitimate attack is accepted, forged level and mission progress are not', () => {
  const start = original();
  const attacked = change(start, s => {
    s.stamina -= 5; s.missionEntered = true;
    s.clicks++; s.runClicks++; s.xp += 18; s.enemyHp -= 10;
  });
  accepted(start, attacked);
  rejected(start, change(start, s => { s.level = 50; }), 'unearned-xp');
  rejected(start, change(start, s => { s.progress = 30; }), 'invalid-progression');
  rejected(start, change(start, s => { s.enemyHp = 1; }), 'impossible-battle');
  rejected(start, change(start, s => { s.kills = 1; s.awaitingNext = true; }));
  rejected(start, change(start, s => {
    s.kills++; s.progress++; s.gold += 300; s.enemyHp = 432;
  }));
  rejected(start, change(start, s => { s.runClicks = 500; }), 'forged-run-stat');
  rejected(start, change(start, s => { s.runKills = 40; s.questIndex = 2; }), 'forged-run-stat');
  const winning = change(start, s => { s.awaitingNext = true; s.kills++; s.runKills++; });
  const reused = change(winning, s => { s.progress++; });
  rejected(winning, reused, 'reused-victory');
  rejected(winning, change(winning, s => {
    s.progress++; s.kills++; s.runKills++; s.gold += 300;
    s.missionEntered = true; s.stamina -= 10;
  }), 'unearned-victory-damage');
});

test('daily reward and a timed technology can complete only at their real deadlines', () => {
  const start = original();
  const daily = change(start, s => {
    s.dailyClaim = new Date(now).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
    s.gold += 500; s.essence += 5;
  });
  accepted(start, daily);
  const researching = change(start, s => {
    s.gold -= 120;
    s.researchQueue = { id: 'fire', startedAt: now - 1000, finishAt: now + 44_000 };
  });
  accepted(start, researching);
  const finished = change(researching, s => { s.researchQueue = null; s.technologies.fire = true; });
  assert.equal(validateGameTransition(researching, finished, 3000, now + 3000).code, 'early-technology');
  assert.equal(validateGameTransition(researching, finished, 46_000, now + 46_000).ok, true);
});

test('equipment cannot be injected or inflated from the browser', () => {
  const start = original();
  const chest = change(start, s => {
    s.keys.bronze--; s.inventory.push({
      id: 'item-legit', slot: 'weapon', name: '탐험 단검',
      icon: '🗡️', rarity: 'common', rank: '일반', value: 8, upgrade: 0,
    });
    s.equipped.weapon = 'item-legit'; s.gearFound++;
    s.chestsOpened++; s.runChestsOpened++; s.gold += 240; s.essence += 3;
  });
  accepted(start, chest);
  rejected(start, change(start, s => {
    s.inventory.push({ id: 'item-hacked', slot: 'weapon', value: 900000, upgrade: 0 });
  }), 'unearned-gear');
  rejected(chest, change(chest, s => { s.inventory[0].value = 999999; }), 'forged-gear-value');
  rejected(start, change(start, s => { s.prestige.points = 9000; }), 'unearned-prestige-points');
});

test('claimable rewards require server-stored eligibility and real deadlines', () => {
  const start = original();
  rejected(start, change(start, s => {
    s.caravanCount++; s.runCaravanCount++; s.gold += 38_500;
  }), 'unearned-caravan-reward');
  rejected(start, change(start, s => {
    s.specialWins++; s.keys.gold++; s.gold += 1400;
  }), 'unearned-special-win');
  const onCooldown = change(start, s => { s.arenaAt = now - 10_000; });
  rejected(onCooldown, change(onCooldown, s => {
    s.arenaWins++; s.gold += 420; s.arenaAt = now;
  }), 'unearned-arena-win');
  rejected(start, change(start, s => {
    s.eventDay = new Date(now).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
    s.eventStartKills = -100;
    s.eventClaimed = true;
  }), 'invalid-event-rollover');
  rejected(start, change(start, s => {
    s.researchQueue = { id: 'fire', startedAt: 1, finishAt: 10 };
  }), 'invalid-research-timer');
  const eventClaimed = change(start, s => {
    s.eventDay = new Date(now).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
    s.eventClaimed = true;
  });
  rejected(eventClaimed, change(eventClaimed, s => { s.eventClaimed = false; }), 'reclaimed-event');
  rejected(start, change(start, s => { s.moduleResearch = 9; s.runModuleResearch = 9; }), 'forged-module-research');
});

test('real game-engine actions produce saves accepted by the server guard', () => {
  const started = newGameState(Date.now());
  started.seenIntro = true;
  const game = harness(started);
  const save0 = game.state();
  game.click('action', 'gather');
  const save1 = game.state();
  assert.equal(validateGameTransition(save0, save1, 2200, Date.now()).ok, true);
  game.click('buy', 'blade');
  const save2 = game.state();
  assert.equal(validateGameTransition(save1, save2, 2200, Date.now()).ok, true);
  game.click('action', 'attack');
  const save3 = game.state();
  assert.equal(validateGameTransition(save2, save3, 2200, Date.now()).ok, true);
  const beforeConsumable = game.state();
  game.click('consumable-buy', 'potion');
  const afterConsumable = game.state();
  const potionReview = validateGameTransition(beforeConsumable, afterConsumable, 2200, Date.now());
  assert.equal(potionReview.ok, true, `potion purchase rejected: ${potionReview.code}`);
  for (let i = 0; i < 35 && !game.state().awaitingNext; i++) game.click('action', 'attack');
  const victory = game.state();
  assert.equal(victory.awaitingNext, true);
  const reviewedVictory = validateGameTransition(afterConsumable, victory, 9000, Date.now());
  assert.equal(reviewedVictory.ok, true, reviewedVictory.code);
  game.click('action', 'next');
  const next = game.state();
  const reviewedAdvance = validateGameTransition(victory, next, 2000, Date.now());
  assert.equal(reviewedAdvance.ok, true, reviewedAdvance.code);
});

test('real timed systems, daily rewards, and prestige pass economy verification', () => {
  const base = newGameState(Date.now());
  Object.assign(base, { seenIntro: true, level: 15, progress: 10,
    purchases: 3, arenaWins: 2,
    gold: 20_000, essence: 500, shards: 3, playerHp: 120, enemyHp: 432 });
  const game = harness(base);
  let simulatedOffset = 0;
  const step = (kind, value, seconds = 3) => {
    const before = game.state();
    game.click(kind, value);
    const after = game.state();
    const result = validateGameTransition(before, after, seconds * 1000, Date.now() + simulatedOffset);
    assert.equal(result.ok, true, `${kind}:${value} rejected: ${result.code}`);
  };
  step('action', 'claimDaily');
  step('caravan', '0');
  const dispatched = game.state();
  game.tick(91_000);
  simulatedOffset = 91_000;
  game.click('action', 'claimCaravan');
  const returned = game.state();
  const caravanReview = validateGameTransition(dispatched, returned, 91_000, Date.now() + 91_000);
  assert.equal(caravanReview.ok, true, `legitimate caravan return rejected: ${caravanReview.code}`);
  step('tech', 'fire');
  step('action', 'startSpecial');
  step('action', 'strikeSpecial');
  const prestigeGame = harness(base);
  const beforeRebirth = prestigeGame.state();
  prestigeGame.click('action', 'doPrestige');
  const rebirth = prestigeGame.state();
  assert.equal(rebirth.prestige.count, 1);
  const result = validateGameTransition(beforeRebirth, rebirth, 3000, Date.now());
  assert.equal(result.ok, true, `legitimate prestige rejected: ${result.code}`);
});
