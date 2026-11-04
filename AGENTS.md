# AGENTS.md — ERA BOUND 개발 인수인계

## Project
한국어 웹게임 ERA BOUND (원시 시대 → 우주 시대), 14 chapters × 10 missions, final mission per chapter is boss. This repository is copied from an existing production ChatGPT Site. Preserve its gameplay, existing saves and server anti-cheat.

## Before editing
1. Read `README.md`, `package.json`, `public/chronicle.js`, relevant `app/` files and tests.
2. The gameplay browser entry is `/play.html`. Server APIs: `/api/game`, `/api/account`, `/api/leaderboard`.
3. For economic/gameplay edits, update server authority in `app/combat-engine.ts` and related guards first, then client presentation in `public/game.js`.
4. Never trust arbitrary browser-supplied game balances, inventory, power, progress or replay selection.
5. Do not remove existing features, player saves, authentication checks or rate limits just to simplify implementation.

## Validation
- `pnpm build`
- `pnpm exec tsc --noEmit --incremental false`
- `node --test server-combat.test.mjs game-integrity.test.mjs game-smoke.test.mjs`

## Production and secrets
- Do not commit secrets, database contents, production credentials, or test-user passwords.
- Production D1 data is not included in Git; schema/migrations are included.
- Original production Site is independent from this repository. `.openai/hosting.json` points to that original Site. Never deploy changes to it unless the user explicitly asks.
- Keep README and tests updated when making changes, and explain feature scope and compatibility risks in PRs.
