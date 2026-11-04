(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  const number = value => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(Number(value) || 0);
  let profile = null;
  let mode = 'register';
  let loading = false;
  let rankingToken = 0;
  const overlay = $('accountOverlay');

  function setProfile(account) {
    profile = account || null;
    $('accountButton').innerHTML = profile ? '👤 ' + escapeHtml(profile.nickname) : '👤 가입 · 로그인';
    $('accountButton').classList.toggle('signed-in', Boolean(profile));
    const label = document.querySelector('.profile-copy strong');
    if (label) label.textContent = profile?.nickname || '게스트 탐사자';
    if (document.querySelector('[data-nav="leaderboard"].selected')) renderLeaderboard($('secondaryView'));
  }

  async function request(path, options) {
    const response = await fetch(path, {
      cache: 'no-store', credentials: 'same-origin', ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || '서버 요청에 실패했습니다.');
    return data;
  }

  async function loadProfile() {
    try {
      const data = await request('/api/account');
      setProfile(data.account);
    } catch {
      $('accountButton').textContent = '👤 계정 연결';
    }
  }

  function field(name, type, label, hint, extra = '') {
    return `<label class="account-field"><span>${label}</span><input name="${name}" type="${type}" required ${extra} placeholder="${hint}"></label>`;
  }

  function openAccount(nextMode) {
    mode = nextMode || (profile ? 'profile' : 'register');
    paintAccount();
    overlay.classList.remove('hidden');
    overlay.querySelector('input')?.focus();
  }

  function closeAccount() {
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
  }

  function paintAccount(error = '') {
    const head = `<div class="account-head"><div><small>ERA BOUND / COMMANDER ID</small><h2>${profile && mode === 'profile' ? '내 게임 계정' : '탐사단 계정'}</h2></div><button type="button" data-account-action="close" aria-label="닫기">✕</button></div>`;
    if (profile && mode === 'profile') {
      overlay.innerHTML = `<section class="account-dialog" role="dialog" aria-modal="true" aria-label="내 게임 계정">
        ${head}<div class="account-profile-card"><span>✦ 탐사단 지휘관</span><h3>${escapeHtml(profile.nickname)}</h3>
        <p>아이디 <b>${escapeHtml(profile.username)}</b></p>
        <div><span>최고 전투력</span><strong>⚡ ${number(profile.bestPower)}</strong></div></div>
        <p class="account-footnote">전투력이 갱신되면 서버 저장 후 리더보드에 반영됩니다.</p>
        <div class="account-actions"><button type="button" data-account-action="rank">🏆 리더보드 보기</button><button type="button" class="muted" data-account-action="logout">로그아웃</button></div>
      </section>`;
      return;
    }
    const joining = mode === 'register';
    overlay.innerHTML = `<section class="account-dialog" role="dialog" aria-modal="true" aria-label="게임 계정 가입 및 로그인">
      ${head}
      <div class="account-mode-tabs"><button data-account-action="registerMode" class="${joining ? 'on' : ''}" type="button">회원가입</button>
      <button data-account-action="loginMode" class="${joining ? '' : 'on'}" type="button">로그인</button></div>
      <form id="accountForm" autocomplete="on">
        ${field('username', 'text', '아이디', '영문·숫자 3~20자', 'minlength="3" maxlength="20" pattern="[a-zA-Z0-9_]{3,20}" autocomplete="username"')}
        ${field('password', 'password', '비밀번호', '8자 이상', 'minlength="8" maxlength="128" autocomplete="' + (joining ? 'new-password' : 'current-password') + '"')}
        ${joining ? field('nickname', 'text', '닉네임', '리더보드에 표시될 이름', 'minlength="2" maxlength="16" autocomplete="nickname"') : ''}
        <p class="account-error" role="alert">${escapeHtml(error)}</p>
        <button class="account-submit" type="submit" ${loading ? 'disabled' : ''}>${loading ? '처리 중…' : joining ? '계정 만들고 시작하기' : '게임 계정 로그인'}</button>
      </form>
      <p class="account-footnote">${joining ? '기존 서버 저장 기록은 이어받습니다. 브라우저에만 남은 기록은 부정행위 방지를 위해 이전하지 않습니다.' : '같은 아이디로 다른 기기에서도 이어서 플레이할 수 있습니다.'}<br>게임 계정은 현재 사이트 접근 권한 내에서 이용됩니다.</p>
    </section>`;
  }

  async function submitAccount(event) {
    event.preventDefault();
    if (loading) return;
    const form = event.target;
    const entries = new FormData(form);
    const joining = mode === 'register';
    const requestBody = {
      action: joining ? 'register' : 'login',
      username: String(entries.get('username') || ''),
      password: String(entries.get('password') || ''),
    };
    if (joining) {
      requestBody.nickname = String(entries.get('nickname') || '');
    }
    loading = true;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = '확인 중…';
    try {
      await request('/api/account', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody),
      });
      // A fresh game request must load the newly linked account's own save.
      window.location.reload();
    } catch (cause) {
      const message = form.querySelector('.account-error');
      message.textContent = cause.message || '잠시 후 다시 시도하세요.';
      submit.disabled = false;
      submit.textContent = joining ? '계정 만들고 시작하기' : '게임 계정 로그인';
    } finally { loading = false; }
  }

  async function logout() {
    if (loading) return;
    loading = true;
    try {
      await request('/api/account', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }),
      });
      window.location.reload();
    } catch (cause) {
      const note = overlay.querySelector('.account-footnote');
      if (note) note.textContent = cause.message;
    } finally { loading = false; }
  }

  async function renderLeaderboard(root) {
    if (!root) return;
    const token = ++rankingToken;
    root.innerHTML = `<section class="leaderboard-shell">
      <div class="leaderboard-hero"><div><small>HALL OF EXPLORERS</small><h2>🏆 전투력 리더보드</h2><p>탐사단의 최고 전투력을 비교해 보세요. 계정의 닉네임만 공개됩니다.</p></div>
      <button class="leaderboard-refresh" data-account-action="refreshRanking">↻ 순위 새로고침</button></div>
      <div class="leaderboard-loading">탐사 기록을 불러오는 중…</div></section>`;
    try {
      const data = await request('/api/leaderboard');
      if (token !== rankingToken || !root.querySelector('.leaderboard-shell')) return;
      const rows = data.players.map(player => `<div class="leaderboard-row ${player.isMe ? 'mine' : ''}" role="row">
        <span class="board-rank ${player.rank <= 3 ? 'top-rank' : ''}" role="cell">${player.rank <= 3 ? ['🥇','🥈','🥉'][player.rank - 1] : '#' + player.rank}</span>
        <span class="board-name" role="cell">${escapeHtml(player.nickname)}${player.isMe ? '<small>나</small>' : ''}</span>
        <span class="board-level" role="cell">LV.${number(player.level)}</span>
        <strong class="board-power" role="cell">⚡ ${number(player.power)}</strong></div>`).join('');
      const self = data.me ? `<div class="leaderboard-my-rank">내 순위 <strong>#${number(data.me.rank)}위</strong><span>${escapeHtml(data.me.nickname)} · 최고 전투력 ⚡ ${number(data.me.power)}</span></div>`
        : `<div class="leaderboard-my-rank guest"><span>계정을 만들면 내 순위를 기록할 수 있어요.</span><button data-account-action="open">회원가입 · 로그인</button></div>`;
      root.querySelector('.leaderboard-shell').innerHTML = `<div class="leaderboard-hero"><div><small>HALL OF EXPLORERS</small><h2>🏆 전투력 리더보드</h2><p>총 ${number(data.total)}명의 탐사자 · 최고 전투력 기준</p></div><button class="leaderboard-refresh" data-account-action="refreshRanking">↻ 새로고침</button></div>
      ${self}<div class="leaderboard-table" role="table" aria-label="전투력 리더보드">
      <div class="leaderboard-columns" role="row"><span>순위</span><span>닉네임</span><span>레벨</span><span>최고 전투력</span></div>
      ${rows || '<p class="leaderboard-empty">아직 등록된 탐사자가 없습니다. 첫 번째 주인공이 되어 보세요!</p>'}</div>`;
    } catch (cause) {
      if (token !== rankingToken) return;
      root.querySelector('.leaderboard-loading').textContent = cause.message || '순위를 불러오지 못했습니다.';
    }
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-account-action]');
    if (!button) return;
    switch (button.dataset.accountAction) {
      case 'open': openAccount(); break;
      case 'close': closeAccount(); break;
      case 'registerMode': mode = 'register'; paintAccount(); break;
      case 'loginMode': mode = 'login'; paintAccount(); break;
      case 'logout': logout(); break;
      case 'rank': closeAccount(); document.querySelector('[data-nav="leaderboard"]').click(); break;
      case 'refreshRanking': renderLeaderboard($('secondaryView')); break;
    }
  });
  overlay.addEventListener('submit', event => {
    if (event.target.id === 'accountForm') submitAccount(event);
  });
  overlay.addEventListener('click', event => { if (event.target === overlay) closeAccount(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !overlay.classList.contains('hidden')) closeAccount();
  });

  window.ERA_ACCOUNT_UI = { renderLeaderboard, openAccount, getProfile: () => profile };
  loadProfile();
})();
