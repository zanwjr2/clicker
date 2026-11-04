# ERA BOUND · 돌에서 별까지

원시 시대부터 우주 개척까지 문명을 발전시키는 한국어 웹 클리커 RPG입니다. 이 저장소는 기존 ChatGPT Sites 웹게임의 **실제 프런트엔드·서버·DB 스키마·테스트 소스**를 다른 개발자/AI 모델이 이어서 작업할 수 있도록 복사한 것입니다.

- 원본 게임: https://riftbound-expedition-2026.neatsugar12.chatgpt.site
- 원본 Sites 소스 기준 커밋: `6e3883758107504b9908bfed1772f7ebb97f3a08`
- 이 저장소의 복사는 **운영 DB 데이터, 사용자 계정/비밀번호, 배포 비밀값까지 복제하는 작업이 아닙니다.**
- 원본 배포와 이 GitHub 저장소는 **자동 동기화되지 않습니다.** GitHub에서 수정하더라도 원본 사이트는 자동 변경되지 않습니다.

## 구현 기능

- 시대/무기 변화와 연대기 스토리, 14개 챕터·140개 미션, 각 챕터의 10번째 보스
- 해금된 미션 선택과 과거 미션 재도전 (일반 보상 25%, 보스 희귀 보상 중복 방지)
- 클릭 공격, 자동 공격 동료, 적 특성·시간 제한·전투 보상·레벨업·장비 성장
- 스태미너 회복/소모와 상점 업그레이드, 기술 연구와 패시브 효과
- 튜토리얼, 계정 생성(아이디/비밀번호/닉네임), 리더보드
- 서버 권위형 전투/경제 검증, 요청 버전 관리 및 클릭 묶음 처리
- 서버 권한에 따른 테스트 관리자 기능

## 기술 스택

- Node.js **22.13 이상**, pnpm **11.25.0**
- React 19, Next.js 16 기반 **vinext** (Vite), TypeScript
- Cloudflare Workers + D1(SQLite), Drizzle ORM
- 정적 게임 UI: `public/play.html`, `public/game.js`, `public/retro.css`

### 로컬 실행

```bash
git clone https://github.com/zanwjr2/clicker.git
cd clicker
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

로컬 개발 서버가 출력하는 주소로 접속하세요. 기본적으로 `/play.html`이 게임 UI입니다. 개발 환경에서 ChatGPT Sites 로그인 에뮬레이터와 D1 상태가 필요할 수 있으므로, 자세한 실행 프로파일과 Sites 보조 스크립트는 [기존 스타터 지침](docs/upstream-starter.md)을 참고하세요. 새 배포 환경에서는 인증·D1 바인딩을 별도로 연결해야 합니다.

### 빌드 및 테스트

```bash
pnpm build
pnpm exec tsc --noEmit --incremental false
node --test server-combat.test.mjs game-integrity.test.mjs game-smoke.test.mjs
```

테스트는 게임 밸런스·진행/보상 판정·서버 데이터 무결성·빠른 클릭 처리·미션 재도전 등을 검증합니다.

## 코드 안내

| 위치 | 역할 |
| --- | --- |
| `public/chronicle.js` | 시대·챕터·미션·무기·스토리 등 콘텐츠 |
| `public/game.js` | 전투 UI, 렌더링, 상점, 성장, 연구, 로컬 상태 |
| `public/retro.css` · `public/play.html` | 스타일, 게임 페이지 |
| `public/account.js` | 가입·로그인 등 계정 화면 |
| `app/combat-engine.ts` | 서버 권위 전투와 보상 계산 |
| `app/game-integrity.ts` · `app/server-owned-fields.ts` | 세이브 검증과 서버 전용 필드 |
| `app/game-power.ts` · `app/game-default.ts` | 전투력 계산 및 기본 상태 |
| `app/api/game/route.ts` | 서버 저장·게임 명령·리비전 검사 |
| `app/api/account/route.ts` | 계정 관리 |
| `app/api/leaderboard/route.ts` | 리더보드 |
| `db/schema.ts`, `drizzle/` | 계정·게임 데이터 스키마와 마이그레이션 |
| `*.test.mjs` | 회귀·무결성·밸런스 테스트 |

## AI 모델 또는 새 개발자를 위한 필수 규칙

1. **프런트엔드 값만 수정해서 게임 규칙을 바꾸지 마세요.** 공격, 보상, 스태미너, 전투력 등 중요한 수치는 서버에서 검증됩니다. 화면 변경 시 `app/combat-engine.ts` 등 서버 규칙과 일치시켜야 합니다.
2. `selectedMission`, `progress`, `revision`, 보상 지급 및 계정 인증 관련 필드를 수정할 때는 **중복 보상/클라이언트 조작/동시 요청** 시나리오를 테스트하세요.
3. 이미 운영 중인 유저의 세이브 및 계정 데이터와 호환성을 유지하고, 데이터베이스 마이그레이션은 비파괴적으로 설계하세요.
4. 기능 변경 후 위 테스트와 타입 검사를 실행하고, 새 규칙에는 회귀 테스트를 추가하세요.
5. 공개 저장소로 전환하기 전에는 반드시 보안 검토를 수행하세요. 실제 계정 데이터, `.env`, 비밀 토큰, DB 덤프는 커밋하지 마세요.
6. `.openai/hosting.json`은 **기존 원본 Sites 프로젝트를 가리키는 설정**입니다. 다른 환경에 배포할 때는 새 프로젝트와 자원을 구성하세요. 원본 사이트로 배포하는 행동은 별도 승인을 받아야 합니다.

더 자세한 AI 작업 지침은 [AGENTS.md](AGENTS.md)를 참고하세요.
