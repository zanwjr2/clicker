(() => {
  'use strict';

  // Font-independent gold coin for Windows and mobile browsers.
  const GOLD_ICON = '<span class="gold-icon" aria-label="금화">G</span>';

  let adminMode = new URLSearchParams(window.location.search).get('mode') === 'admin';
  let adminAvailable = false;
  const STORAGE_KEY = 'riftbound-expedition-save-v1' + (adminMode ? '-admin-test' : '');
  // Each chapter is a new age of human history. The last age continues into
  // uncharted star systems, rather than looping back to prehistory.
  const ERAS = [
    { name:'불의 새벽', age:'원시 시대', period:'기원전 10,000년', scene:'🌄', weapon:{ name:'석제 도끼', icon:'🪓', action:'내리치기', power:0 },
      story:'첫 불꽃을 지킨 작은 부족은 거대한 짐승과 혹독한 밤을 넘어야 한다. 당신의 돌도끼 한 자루가 인류의 첫 역사를 써 내려간다.',
      ending:'불씨를 지키고 부족을 하나로 모았다. 이제 불꽃은 강을 따라 퍼지고, 사람들은 흙과 구리로 도시를 짓기 시작한다.',
      missions:['깨어난 야영지','거친 숲의 길','황혼의 사냥','먹을거리 확보','바위 골짜기','불씨 수호전','맹수의 왕'],
      enemies:['굶주린 늑대','거대 멧돼지','동굴 하이에나','먹이 약탈자','털코뿔소','사나운 검치호','태고의 매머드'],
      emoji:['🐺','🐗','🦴','🪨','🦏','🐅','🦣'],
      beats:['부족의 아이들이 떨고 있다. 첫 번째 사냥을 끝내 불씨를 지켜라.','돌과 가죽을 얻기 위해 위험한 숲을 가로지른다.','어둠이 오기 전에 사냥을 마쳐야 한다.','부족이 굶지 않도록 저장할 식량을 확보한다.','거대한 짐승이 골짜기 입구를 막아섰다.','불씨를 노리는 포식자가 야영지까지 따라왔다.','태고의 거인을 넘어설 때 인류의 첫 시대가 열린다.'] },
    { name:'두 강의 왕국', age:'고대·청동 시대', period:'기원전 3,000년', scene:'🏛️', weapon:{ name:'청동 창', icon:'🔱', action:'찌르기', power:8 },
      story:'강가에 마을이 자라고 최초의 도시가 세워졌다. 청동 주조와 관개 수로는 풍요를 약속하지만 왕국의 경계를 탐내는 이들도 나타난다.',
      ending:'왕국의 성문이 열리고 첫 도서관에 기록이 쌓였다. 철을 다루는 대장장이들이 새로운 시대의 문을 두드린다.',
      missions:['강가의 정착촌','사막 무역로','사라진 서판','곡물 창고 방어','성문 전투','신전의 수호자','황금 왕좌의 시련'],
      enemies:['강가 약탈단','모래 도적','유적의 수호병','전차 부대','청동 거인','신전 장군','폭군의 전차'],
      emoji:['🛶','🏹','📜','🐎','🛡️','👑','🏛️'],
      beats:['곡창을 지키고 첫 도시의 기반을 다진다.','교역로를 열어 다른 부족과 기술을 교환한다.','잊힌 서판에 기록된 금속의 비밀을 찾는다.','풍요를 노린 침략자들로부터 창고를 지킨다.','왕국을 둘러싼 성벽 앞에서 결전을 치른다.','신전의 시험을 넘어 새로운 지식을 얻는다.','왕국의 운명을 결정할 마지막 싸움이다.'] },
    { name:'철의 왕관', age:'중세 시대', period:'서기 1,200년', scene:'🏰', weapon:{ name:'강철 장검', icon:'⚔️', action:'베기', power:20 },
      story:'왕국들이 성을 쌓고 기사가 영토를 다툰다. 장인의 철과 학자의 지식이 충돌 속에서 발전하며, 평범한 병사들도 변화를 꿈꾼다.',
      ending:'오랜 전쟁이 끝나고 인쇄된 책이 대륙에 퍼진다. 과학자들은 증기와 화약이 세상을 다시 바꿀 힘임을 알아챈다.',
      missions:['성벽 아래 첫 전투','숲길의 도적단','봉화대 탈환','마차 보급로','철갑 기사단','대성당 방어전','왕관의 결투'],
      enemies:['길목 도적','산적 궁수','기마 척후병','보급 약탈대','철갑 기사','성채 지휘관','검은 왕관의 군주'],
      emoji:['🗡️','🏹','🐎','🛞','🛡️','🏰','👑'],
      beats:['위태로운 변경의 마을을 구한다.','오래된 숲길을 다시 안전하게 만든다.','봉화대를 되찾아 왕국에 경고를 전한다.','전쟁으로 끊긴 보급길을 연결한다.','강철을 입은 기사단의 진형을 무너뜨린다.','마지막 성채에서 동료를 지켜라.','왕관의 무게를 넘어 지식의 시대를 연다.'] },
    { name:'증기의 도시', age:'산업혁명 시대', period:'서기 1,850년', scene:'🏭', weapon:{ name:'화약 포', icon:'💣', action:'포격', power:40 },
      story:'증기기관이 공장을 깨우고 철길이 대륙을 잇는다. 발전의 그림자에는 오염과 빈곤도 있다. 사람과 기계가 함께 살아갈 길을 찾아야 한다.',
      ending:'전기가 어두운 거리를 밝힌다. 비행기와 통신망은 세계를 하나로 연결하고, 인류는 또 한 번 거대한 선택 앞에 선다.',
      missions:['첫 증기기관','끊어진 철도','공장 화재','보급 열차 구출','강철 기동대','검은 굴뚝','기계도시의 심장'],
      enemies:['공장 파괴자','철도 약탈자','증기 감시병','철갑 화물차','장갑 기계병','대형 증기전차','거대 기관장'],
      emoji:['🔩','🚂','⚙️','🚃','🦾','🏭','🤖'],
      beats:['멈춘 기계를 다시 움직일 부품을 모은다.','철길을 복구해 외딴 도시를 연결한다.','공장에 번진 불길을 막고 노동자를 구한다.','굶주린 도시에 생필품을 전달한다.','쇳덩이 군단을 상대로 신기술을 시험한다.','검은 연기 너머의 진상을 밝힌다.','도시의 엔진을 멈추고 새로운 규칙을 세운다.'] },
    { name:'분열의 세기', age:'현대 시대', period:'서기 2,020년', scene:'🌆', weapon:{ name:'자동 소총', icon:'🔫', action:'사격', power:70 },
      story:'컴퓨터와 인공위성 덕분에 인류는 지구 어디든 연결됐다. 그러나 자원 위기와 전쟁의 상처는 깊다. 모두의 미래를 위한 협력이 시작된다.',
      ending:'지구의 국가들이 공동 연구 협정을 체결했다. 인류 최초의 지속 가능한 우주 기지를 짓기 위한 설계도가 완성된다.',
      missions:['통신망 복구','폐허의 도로','위성 신호 추적','구호 물자 호송','방호시설 돌파','연합 기지 방어','세계 협약의 날'],
      enemies:['무장 정찰대','도로 봉쇄군','전자전 드론','화물 탈취부대','중장갑 차량','기지 방어 AI','군벌 지휘부'],
      emoji:['📻','🚙','🛰️','🚚','🚓','🤖','🌍'],
      beats:['재난 지역의 통신을 되살린다.','고립된 사람들에게 이동로를 확보한다.','실종된 인공위성의 신호를 찾아라.','긴급 구호품을 안전하게 운송한다.','강화된 방어시설을 넘어 연합군과 합류한다.','과학 기지를 지켜 지구의 희망을 잇는다.','각자의 깃발을 내려놓고 하나의 미래를 약속한다.'] },
    { name:'합성의 지평', age:'미래 시대', period:'서기 2,150년', scene:'🌐', weapon:{ name:'플라즈마 라이플', icon:'⚡', action:'방전', power:115 },
      story:'인공지능과 핵융합 에너지는 인류를 새로운 문명의 문턱에 세웠다. 인간과 기계는 낯선 바다를 탐험하며 별을 향해 도약할 준비를 한다.',
      ending:'최초의 성간 엔진이 점화됐다. 어두운 하늘의 점 하나가 이제 도착할 수 있는 목적지로 바뀐다.',
      missions:['융합 발전소','자율도시 순찰','나노 공장 침투','에너지 수송선','합성 장갑 실험','궤도 승강기','성간 엔진 점화'],
      enemies:['정찰 나노봇','자율 경비기','해킹된 조립기','에너지 탈취기','합성 중장갑','궤도 수호 드론','폭주한 거대 AI'],
      emoji:['🔬','🤖','🦠','🔋','🛡️','🛰️','🧠'],
      beats:['별을 향할 에너지원을 안정화한다.','인간과 기계의 질서를 되찾는다.','나노 공장에서 사라진 핵심 부품을 찾는다.','성간 엔진에 필요한 연료를 수송한다.','최첨단 장갑을 돌파해 기술을 검증한다.','우주로 향하는 승강기의 안전을 확보한다.','새 시대를 위해 마지막 관문을 돌파한다.'] },
    { name:'별의 문턱', age:'우주 시대', period:'서기 2,400년 이후', scene:'🌌', weapon:{ name:'궤도 광자포', icon:'🚀', action:'광자 포격', power:180 },
      story:'오랜 세월 돌도끼를 쥐었던 인류가 이제 별 사이를 걷는다. 낯선 행성에 기지를 세우고 생명을 찾아 떠나는 끝없는 탐험이 시작된다.',
      ending:'첫 개척 성계가 안정됐다. 별들의 바다에는 여전히 수많은 미지의 세계가 기다린다. 인류의 연대기는 계속된다.',
      missions:['달의 전초기지','화성 항로','소행성 자원선','얼음 위성 상륙','외계 방어시설','성간 관측소','새 별의 개척자'],
      enemies:['우주 잔해 드론','해적 탐사선','소행성 채굴기','극저온 수호체','외계 중장갑','항성 방어위성','미지의 성간 거신'],
      emoji:['🌙','🛸','☄️','🪐','👾','🛰️','🌌'],
      beats:['달에 영구 거주 기지를 세운다.','화성을 향한 첫 수송로를 개척한다.','소행성대에서 생존에 필요한 자원을 얻는다.','얼어붙은 위성의 땅을 밟는다.','누가 남긴 것인지 모를 시설을 조사한다.','우주 저편의 신호를 해독한다.','우리의 첫 번째 새로운 고향을 확보한다.'] }
  ];
  const CHAPTERS = window.ERA_CHAPTERS;
  const MISSIONS_PER_CHAPTER = 10;
  const STAMINA = Object.freeze({ base:72, perLevel:2, regenMs:90_000, regenBonus:1, regenFasterMs:5_000, supplyAmount:22, supplyBonus:3, supplyCooldownMs:600_000, minMissionCost:2 });
  const THEMES = { evolution:{ logo:'ERA<span>BOUND</span>', sector:'문명 진화 연대기', category:'인류 개척단', story:'돌도끼 하나로 시작한 인류가 불을 지키고 도시를 세워 마침내 별에 닿는 이야기.', success:'시대의 장벽을 넘어 새로운 역사를 썼습니다.' } };
  const MISSION_TYPES = [
    { name: '첫 번째 접촉', type: '일반', tag: 'NORMAL', icon: '◈', role: '워밍업 · 전력 점검', hp: 1, gold: 300, xp: 170 },
    { name: '방벽 돌파', type: '일반', tag: 'NORMAL', icon: '◇', role: '성장 확인 · 강화 실험', hp: 1.35, gold: 380, xp: 210 },
    { name: '60초 긴급 작전', type: '속전', tag: 'TIME ATTACK', icon: '◷', role: '속도 시험 · 빠를수록 보너스', hp: 1.6, gold: 460, xp: 250 },
    { name: '보급선 습격', type: '수송', tag: 'CARGO', icon: '◉', role: '보급 구간 · 금화 집중 획득', hp: 2.1, gold: 720, xp: 310 },
    { name: '중장갑 전투', type: '중장갑', tag: 'ARMORED', icon: '⬡', role: '장비 검사 · 클릭 피해 20% 감소', hp: 2.6, gold: 630, xp: 350 },
    { name: '첫 번째 전초기지', type: '정예', tag: 'ELITE', icon: '✧', role: '중간 난관 · 강한 반격', hp: 2.8, gold: 760, xp: 420 },
    { name: '숨 고르기', type: '수송', tag: 'CARGO', icon: '◉', role: '보급 기회 · 금화 집중 획득', hp: 2.2, gold: 850, xp: 370 },
    { name: '최후의 추적', type: '속전', tag: 'TIME ATTACK', icon: '◷', role: '속도 시험 · 빠를수록 보너스', hp: 3.2, gold: 900, xp: 480 },
    { name: '결전의 길목', type: '중장갑', tag: 'ARMORED', icon: '⬡', role: '보스 전초전 · 장갑 돌파', hp: 3.9, gold: 1150, xp: 560 },
    { name: '챕터 최종 결전', type: '보스', tag: 'BOSS', icon: '♛', role: '챕터 결전 · 체력 35%에 각성', hp: 7.2, gold: 1650, xp: 690 }
  ];
  // The seven mission beats alternate relief, pressure, resource payout and a boss climax.
  // Chapters introduce a readable twist rather than only larger HP numbers.
  const CHAPTER_RULES = [
    { name: '생존 본능', detail: '성장과 조작을 익히는 균형 구간', hp: 1, incoming: 1, gold: 1, xp: 1 },
    { name: '왕국의 경계', detail: '반격 +15% · 금화 +12%', hp: 1, incoming: 1.15, gold: 1.12, xp: 1 },
    { name: '철갑 진형', detail: '중장갑 체력 +15% · 장비 발견 +6%', hp: 1, incoming: 1, gold: 1, xp: 1, armorHp: 1.15, loot: .06 },
    { name: '산업 생산력', detail: '수송 보상 +30% · 적 체력 +8%', hp: 1.08, incoming: 1, gold: 1, xp: 1, cargoGold: 1.3 },
    { name: '현대의 전장', detail: '반격 +25% · 마력 획득 +2', hp: 1, incoming: 1.25, gold: 1, xp: 1, essence: 2 },
    { name: '합성 장갑', detail: '보스 각성 강화 · 유물 +1', hp: 1, incoming: 1, gold: 1, xp: 1, bossRage: 1.3, shard: 1 },
    { name: '광속 개척', detail: '속전 50초 · 경험치 +20%', hp: 1, incoming: 1, gold: 1, xp: 1.2, speedLimit: 50 }
  ];
  const ITEMS = [
    { id: 'blade', icon: '⚔️', name: '강화된 무기', desc: '클릭할 때마다 더 강한 일격을 가합니다.', base: 120, gain: 5, stat: '클릭 공격력 +5' },
    { id: 'rune', icon: '📕', name: '전투 기술 교범', desc: '시대별 공격 기술을 훈련해 공격력을 높입니다.', base: 420, gain: 18, stat: '클릭 공격력 +18' },
    { id: 'gather', icon: GOLD_ICON, name: '정밀 채굴 도구', desc: '채집 클릭으로 얻는 금화가 증가합니다.', base: 170, gain: 8, stat: '채집 금화 +8' },
    { id: 'heal', icon: '🧪', name: '응급 치료 키트', desc: '치료 클릭 한 번에 회복하는 체력이 증가합니다.', base: 155, gain: 10, stat: '치료량 +10' },
    { id: 'staminaRecovery', icon: '🌿', name: '야영 회복 체계', desc: '자연 회복량 +1, 회복 간격 -5초, 야영 보급량 +3. 최대 5단계.', base: 850, maxLevel: 5, stat: '자연 회복 +1 / 간격 -5초 · 보급 +3' },
    { id: 'staminaEfficiency', icon: '🥾', name: '행군 효율 훈련', desc: '미션 입장 스태미너 소모 -1. 최소 비용 2, 최대 3단계.', base: 1200, maxLevel: 3, stat: '미션 입장 비용 -1' },
    { id: 'drone', icon: '⚡', name: '자동 공격 장치', desc: '전투 중 초당 일정한 피해를 가합니다.', base: 330, gain: 3, stat: '초당 피해 +3' },
    { id: 'armor', icon: '🛡️', name: '탐사자 보호 장갑', desc: '탐사자의 최대 체력을 증가시킵니다.', base: 290, gain: 25, stat: '최대 체력 +25' },
    { id: 'fortune', icon: '🍀', name: '자원 확보 노하우', desc: '미션과 채집으로 획득하는 금화를 늘립니다.', base: 540, gain: 15, stat: '금화 획득 +15%' },
    { id: 'wisdom', icon: '📜', name: '문명 지식 기록', desc: '전투와 임무에서 얻는 경험치를 늘립니다.', base: 660, gain: 15, stat: '경험치 획득 +15%' },
    { id: 'strike', icon: '🪓', name: '분쇄 투사체', desc: '중장갑 적을 상대할 때 추가 피해를 가합니다.', base: 1150, gain: 8, stat: '중장갑 피해 +8%' },
    { id: 'barrier', icon: '🛡️', name: '보강된 방어구', desc: '적의 반격 피해를 감소시킵니다.', base: 970, gain: 2, stat: '받는 피해 -2' },
    { id: 'reactor', icon: '⚗️', name: '연구 자료 회수기', desc: '적 처치 시 추가 연구력을 회수합니다.', base: 1700, gain: 2, stat: '연구력 보상 +2' },
    { id: 'prospector', icon: '⛏️', name: '자원 탐지 장치', desc: '일반 임무에서 열쇠와 장비를 발견할 확률을 높입니다.', base: 2450, gain: 5, stat: '발견 확률 +5%' },
    { id: 'vitality', icon: '💗', name: '생존 의학', desc: '완료한 미션마다 체력을 추가 회복합니다.', base: 2800, gain: 4, stat: '승리 회복 +4%' },
    { id: 'amplifier', icon: '📡', name: '동료 신호 증폭기', desc: '모든 동료의 자동 공격력을 증가시킵니다.', base: 4200, gain: 10, stat: '동료 피해 +10%' },
    { id: 'critical', icon: '💥', name: '치명타 연구', desc: '공격 시 일정 확률로 2배 피해를 가합니다.', base: 2200, gain: 3, stat: '치명타 확률 +3%' },
    { id: 'merchant', icon: '⚖️', name: '보급선 계약', desc: '미션 금화 보상과 채집 효율을 높입니다.', base: 3100, gain: 8, stat: '금화 획득 +8%' }
  ];
  const SHOP_CATEGORIES = [
    { id:'recommended', label:'⭐ 추천', hint:'처음에는 공격력과 스태미너를 우선 강화해 보세요.', items:['blade','drone','staminaRecovery','staminaEfficiency','gather'] },
    { id:'stamina', label:'⚡ 스태미너', hint:'미션을 더 자주 진행하고 싶다면 회복과 소모 효율을 강화하세요.', items:['staminaRecovery','staminaEfficiency'] },
    { id:'combat', label:'⚔ 전투', hint:'공격력·자동 공격·생존력을 높이는 강화입니다.', items:['blade','rune','heal','drone','armor','strike','barrier','vitality','amplifier','critical'] },
    { id:'resources', label:GOLD_ICON + ' 자원', hint:'금화와 경험치, 전리품 획득을 늘리는 강화입니다.', items:['gather','fortune','wisdom','reactor','prospector','merchant'] },
    { id:'all', label:'전체', hint:'모든 강화 항목을 한 번에 볼 수 있습니다.', items:ITEMS.map(item=>item.id) }
  ];
  const HELPERS = [
    { id: 'scout', name: '리안', role: '부족 정찰대', icon: '🧑‍🦱', desc: '원시 야영지에서 함께 길을 찾는 선봉 정찰대원.', cost: 150, req: 2, dps: 8 },
    { id: 'mage', name: '세라', role: '청동 투창대', icon: '🏹', desc: '훈련된 원거리 부대로 전투를 지원합니다.', cost: 900, req: 5, dps: 30 },
    { id: 'golem', name: '노바', role: '공성 기술자', icon: '🔨', desc: '기계와 공성 무기를 다루는 숙련 기술자.', cost: 5000, req: 10, dps: 140 },
    { id: 'ranger', name: '에린', role: '정예 사격수', icon: '🎯', desc: '약점을 정확히 노리는 정예 사격수.', cost: 18000, req: 18, dps: 360 },
    { id: 'alchemist', name: '카인', role: '미래 기술자', icon: '🧑‍🔬', desc: '신기술과 자동 방어 포탑으로 지원합니다.', cost: 79000, req: 30, dps: 950 },
    { id: 'seraph', name: '아스텔', role: '우주 개척사', icon: '🧑‍🚀', desc: '성간 전투 데이터를 분석하는 최첨단 동료.', cost: 390000, req: 50, dps: 3600 }
  ];
  const QUESTS = [
    { title: '첫 일격', desc: '적에게 15번 공격하세요.', key: 'clicks', target: 15, gold: 250, essence: 3 },
    { title: '첫 승전보', desc: '미션을 2개 완료하세요.', key: 'kills', target: 2, gold: 450, essence: 5 },
    { title: '장비 보급', desc: '상점에서 업그레이드 3개를 구매하세요.', key: 'purchases', target: 3, gold: 750, essence: 7 },
    { title: '베테랑 탐사자', desc: '미션을 10개 완료해 첫 챕터를 정복하세요.', key: 'kills', target: 10, gold: 1600, essence: 12 },
    { title: '전쟁의 기술', desc: '누적 75번 공격하세요.', key: 'clicks', target: 75, gold: 2500, essence: 20 },
    { title: '선발대의 명예', desc: '미션을 20개 완료하세요.', key: 'kills', target: 20, gold: 4200, essence: 30 },
    { title: '잠든 수집가', desc: '상자를 3개 열어보세요.', key: 'chestsOpened', target: 3, gold: 5600, essence: 35 },
    { title: '연구의 시작', desc: '모듈을 3회 강화하세요.', key: 'moduleResearch', target: 3, gold: 6200, essence: 45 },
    { title: '끝없는 도전', desc: '미션 40개 완료', key: 'kills', target: 40, gold: 10500, essence: 70 },
    { title: '끝나지 않은 기록', desc: '공격 500회 달성', key: 'clicks', target: 500, gold: 18000, essence: 90 },
    { title: '보급의 달인', desc: '장비 및 동료 강화 30회', key: 'purchases', target: 30, gold: 22000, essence: 120 },
    { title: '차원의 항로', desc: '캐러밴을 5회 완료하세요.', key: 'caravanCount', target: 5, gold: 45000, essence: 180 }
  ];
  const ACHIEVEMENTS = [
    { id: 'first', icon: '🏅', title: '첫 번째 승리', desc: '미션 1개 완료', key: 'kills', target: 1, reward: 150 },
    { id: 'hunter', icon: '⚔️', title: '백 번의 일격', desc: '공격 클릭 100회 달성', key: 'clicks', target: 100, reward: 650 },
    { id: 'merchant', icon: '💰', title: '탐사단의 후원자', desc: '장비 10회 구매', key: 'purchases', target: 10, reward: 950 },
    { id: 'veteran', icon: '🗺️', title: '한 장의 지도', desc: '첫 챕터 10개 미션 완수', key: 'kills', target: 10, reward: 1200 },
    { id: 'champion', icon: '🏆', title: '투기장의 강자', desc: '투기장 3승 달성', key: 'arenaWins', target: 3, reward: 1500 },
    { id: 'legend', icon: '👑', title: '문명 개척의 전설', desc: '미션 60개 완수', key: 'kills', target: 60, reward: 7500 },
    { id: 'archivist', icon: '📚', title: '유물 수집가', desc: '장비 10개 획득', key: 'gearFound', target: 10, reward: 3000 },
    { id: 'engineer', icon: '⚙️', title: '기계와 마법', desc: '모듈 10회 연구', key: 'moduleResearch', target: 10, reward: 7200 },
    { id: 'resurrection', icon: '♾️', title: '다시 시작하는 자', desc: '첫 프레스티지 달성', key: 'prestigeCount', target: 1, reward: 13000 },
    { id: 'merchant2', icon: '🗝️', title: '비밀의 창고', desc: '상자 20개 개봉', key: 'chestsOpened', target: 20, reward: 12000 },
    { id: 'caravanner', icon: '🐪', title: '먼 길의 탐사자', desc: '캐러밴 10회 완료', key: 'caravanCount', target: 10, reward: 21000 },
    { id: 'shadow', icon: '🌑', title: '어둠 속의 승리', desc: '특수 작전 10회 승리', key: 'specialWins', target: 10, reward: 32000 }
  ];
  const MODULES = [
    { id: 'force', icon: '✦', name: '전술 훈련', desc: '클릭 피해 +12% / 레벨', req: 8, base: 12, cost: 12 },
    { id: 'swift', icon: '⚡', name: '자동화 연구', desc: '자동 공격 +14% / 레벨', req: 8, base: 14, cost: 16 },
    { id: 'treasure', icon: GOLD_ICON, name: '교역 효율화', desc: '금화 획득 +8% / 레벨', req: 12, base: 8, cost: 20 },
    { id: 'insight', icon: '📖', name: '지식 축적', desc: '경험치 +10% / 레벨', req: 15, base: 10, cost: 24 },
    { id: 'shell', icon: '🛡️', name: '생존 장비 강화', desc: '최대 체력 +35 / 레벨', req: 18, base: 35, cost: 28 },
    { id: 'fortune', icon: '💎', name: '유물 분석법', desc: '발견 확률 +4% / 레벨', req: 22, base: 4, cost: 35 }
  ];
  // Timed technology is distinct from the existing instant, repeatable modules.
  // The bonuses are permanent, including after a prestige reset.
  const TECHS = [
    {id:'fire',era:0,icon:'🔥',name:'불의 사용',description:'불꽃을 제련과 무기에 활용한다.',gold:120,essence:0,seconds:45,effect:'attack',bonus:.1},
    {id:'forage',era:0,icon:'🌾',name:'조직적 채집',description:'부족이 농작물과 자원을 계획적으로 모은다.',gold:180,essence:0,seconds:60,effect:'gold',bonus:.1},
    {id:'bronze',era:1,icon:'🔱',name:'청동 주조',description:'견고한 청동 무기를 생산한다.',gold:800,essence:15,seconds:90,effect:'attack',bonus:.15,requires:'fire'},
    {id:'irrigation',era:1,icon:'🌊',name:'관개 농업',description:'수로를 건설해 안정적으로 식량을 확보한다.',gold:1100,essence:20,seconds:120,effect:'gold',bonus:.15},
    {id:'gunpowder',era:2,icon:'💥',name:'화약 제조법',description:'화약으로 전투의 결정타를 강화한다.',gold:2500,essence:35,seconds:150,effect:'crit',bonus:.05,requires:'bronze'},
    {id:'guild',era:2,icon:'⚒️',name:'장인 길드',description:'길드의 협업으로 자동 전투 생산력을 높인다.',gold:3500,essence:45,seconds:180,effect:'dps',bonus:.18},
    {id:'steam',era:3,icon:'🚂',name:'증기 자동화',description:'증기 동력으로 동료와 기계를 자동화한다.',gold:7000,essence:65,seconds:240,effect:'dps',bonus:.25,requires:'gunpowder'},
    {id:'rail',era:3,icon:'🛤️',name:'철도 교역망',description:'광역 물류망으로 자원 수익을 늘린다.',gold:9000,essence:80,seconds:270,effect:'gold',bonus:.2},
    {id:'computing',era:4,icon:'💻',name:'컴퓨터 공학',description:'정교한 분석으로 획득 경험치를 늘린다.',gold:18000,essence:110,seconds:300,effect:'xp',bonus:.2,requires:'steam'},
    {id:'alloy',era:4,icon:'🛡️',name:'첨단 합금',description:'가벼우면서 강한 생존 장비를 개발한다.',gold:22000,essence:120,seconds:330,effect:'hp',bonus:.2},
    {id:'plasma',era:5,icon:'⚡',name:'플라즈마 공학',description:'새로운 에너지로 공격력을 증폭한다.',gold:40000,essence:160,seconds:420,effect:'attack',bonus:.3,requires:'computing'},
    {id:'autofactory',era:5,icon:'🤖',name:'자율 생산체계',description:'지능형 공장이 전투를 지속 지원한다.',gold:55000,essence:180,seconds:480,effect:'dps',bonus:.3},
    {id:'antimatter',era:6,icon:'🌌',name:'반물질 반응로',description:'우주 개척에 필요한 막대한 출력을 얻는다.',gold:110000,essence:240,shards:1,seconds:600,effect:'attack',bonus:.35,requires:'plasma'},
    {id:'startrade',era:6,icon:'🪐',name:'성간 교역망',description:'행성 사이에서 안정적인 물자를 확보한다.',gold:150000,essence:260,shards:1,seconds:720,effect:'gold',bonus:.35}
  ];
  const TECH_EFFECT_LABEL = {attack:'클릭 공격력',gold:'금화 획득',dps:'자동 공격',xp:'경험치 획득',hp:'최대 체력',crit:'치명타 확률'};
  const PRESTIGE_PERKS = [
    { id: 'might', icon: '⚔️', name: '영원의 공격', gain: 15, desc: '영구 공격력 +15% / 레벨' },
    { id: 'wealth', icon: GOLD_ICON, name: '탐사단 재산', gain: 15, desc: '영구 금화 보너스 +15% / 레벨' },
    { id: 'memory', icon: '📚', name: '계승된 지식', gain: 15, desc: '영구 경험치 보너스 +15% / 레벨' },
    { id: 'soul', icon: '💗', name: '불멸의 의지', gain: 30, desc: '영구 최대 체력 +30 / 레벨' }
  ];
  const GEAR_BASES = [
    { slot: 'weapon', icon: '🗡️', name: '탐험 단검', base: 8 }, { slot: 'weapon', icon: '🏹', name: '강화 장궁', base: 11 },
    { slot: 'weapon', icon: '🔱', name: '정예 장창', base: 16 }, { slot: 'armor', icon: '🧥', name: '방호복', base: 24 },
    { slot: 'armor', icon: '🛡️', name: '철제 갑옷', base: 35 }, { slot: 'armor', icon: '🥋', name: '보강된 외투', base: 28 },
    { slot: 'relic', icon: '💍', name: '황금 반지', base: 5 }, { slot: 'relic', icon: '📿', name: '교역 목걸이', base: 8 },
    { slot: 'relic', icon: '🧭', name: '항해 나침반', base: 11 }
  ];
  const RARITIES = [
    { name: '일반', label: 'common', weight: 58, multi: 1 }, { name: '고급', label: 'uncommon', weight: 27, multi: 1.7 },
    { name: '희귀', label: 'rare', weight: 12, multi: 2.6 }, { name: '영웅', label: 'epic', weight: 2.7, multi: 4.5 },
    { name: '전설', label: 'legendary', weight: .3, multi: 8 }
  ];
  // Difficulty and payout should increase together across chapters. At very
  // high chapters, the old linear gold rewards could no longer fund upgrades.
  const BALANCE = Object.freeze({ chapterHp: 1.38, chapterGold: 1.42, chapterXp: 1.28, upgradeCost: 1.55, helperCost: 1.75, xpGrowth: 1.125 });
  const RUN_STATS = { clicks: 'runClicks', kills: 'runKills', purchases: 'runPurchases',
    chestsOpened: 'runChestsOpened', moduleResearch: 'runModuleResearch', caravanCount: 'runCaravanCount' };
  const TUTORIAL_VERSION = 1;
  const TUTORIAL_STEPS = [
    { icon: '🪓', title: '첫 공격', text: '석제 도끼 버튼을 세 번 눌러 위협을 물리치세요. 시대가 변하면 무기도 진화해요. Space 키로도 공격할 수 있어요.', tab: 'battle', target: '[data-action="attack"]', metric: 'runClicks', count: 3, progressLabel: '공격' },
    { icon: GOLD_ICON, title: '채집과 스태미너', text: '채집으로 금화를 모아 보세요. 미션 시작 시 스태미너가 한 번 차감되고, 기본 90초마다 1씩 회복돼요. 레벨마다 최대치가 2 증가합니다.', tab: 'battle', target: '[data-action="gather"]', metric: 'tutorialGathers', count: 1, progressLabel: '채집' },
    { icon: '🔧', title: '상점 이용', text: '상점 · 장비 강화에서 추천·전투·스태미너·자원 분류를 골라 원하는 강화를 구매하세요.', tab: 'shop', target: '[data-buy="blade"]', metric: 'runPurchases', count: 1, progressLabel: '강화 구매' },
    { icon: '🎁', title: '첫 전리품', text: '장비·상자 탭에서 시작 보급상자를 열어 장비를 획득하세요. 얻은 장비는 자동 장착할 수 있어요.', tab: 'inventory', target: '[data-chest="bronze"]', metric: 'runChestsOpened', count: 1, progressLabel: '상자 개봉' },
    { icon: '🏆', title: '첫 번째 승리', text: '다시 전투로 돌아가 적을 처치하세요. 체력이 부족하면 치료하고, 승리 창에서 다음 작전을 진행할 수 있어요.', tab: 'battle', target: '[data-action="attack"]', metric: 'runKills', count: 1, progressLabel: '미션 완료' },
    { icon: '📜', title: '지령 보상', text: '임무·업적에서 완료된 지령의 보상을 수령해 보세요. 지령은 회차마다, 업적은 평생 기록으로 관리돼요.', tab: 'quests', target: '[data-action="claimQuest"]', metric: 'questIndex', count: 1, progressLabel: '보상 수령' },
    { icon: '🔬', title: '문명의 연구', text: '기술 연구에서는 자원을 투자한 뒤 실제 시간이 지나야 영구 패시브가 완성돼요. 연구는 오프라인에서도 진행됩니다. 일곱 시대를 넘어 우주까지 발전하세요!', tab: 'modules', target: '[data-nav="modules"]', metric: null, count: 0, progressLabel: '' }
  ];

  const $ = id => document.getElementById(id);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const fmt = n => !Number.isFinite(Number(n)) ? '0' : Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(Math.floor(n));
  const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  const defaultState = () => ({
    saveFormat:2, theme: 'evolution', gold: 500, essence: 0, shards: 0, level: 1, xp: 0, progress: 0, selectedMission: null, enemyHp: 320, playerHp: 120,
    stamina:STAMINA.base, staminaUpdatedAt:Date.now(), missionEntered:false, lastSupplyAt:0,
    clicks: 0, kills: 0, purchases: 0, runClicks: 0, runKills: 0, runPurchases: 0,
    runChestsOpened: 0, runModuleResearch: 0, runCaravanCount: 0, arenaWins: 0, questIndex: 0, items: {}, helpers: {}, achievements: [],
    dailyClaim: '', arenaAt: 0, awaitingNext: false, battleOver: false, timer: 60, timerStarted: false, lastVictory: null,
    inventory: [], equipped: { weapon: null, armor: null, relic: null }, keys: { bronze: 1, silver: 0, gold: 0 },
    consumables: { bomb: 1, potion: 2, elixir: 0 }, consumablePurchased: { bomb: 0, potion: 0, elixir: 0 }, modules: {}, technologies: {}, researchQueue: null, autoclickers: 0,
    prestige: { count: 0, points: 0, perks: {} }, prestigeCount: 0, gearFound: 0, chestsOpened: 0, moduleResearch: 0,
    caravanCount: 0, caravan: null, specialWins: 0, specialAt: 0, specialMission: null, eventDay: '', eventStartKills: 0, eventClaimed: false,
    elixirUntil: 0, lastSaved: Date.now(), seenIntro: false,
    tutorial: { version: 0, active: false, step: 0, baseline: 0, rewardClaimed: false }, tutorialGathers: 0, healsUsed: 0, skillsUsed: 0, specialStrikes: 0
  });
  function mergeState(raw) {
    if (!raw || typeof raw !== 'object') return defaultState();
    const d = defaultState();
    const merged = { ...d, ...raw, items: { ...(raw.items || {}) }, helpers: { ...(raw.helpers || {}) },
      modules: { ...(raw.modules || {}) }, technologies: { ...(raw.technologies || {}) }, keys: { ...d.keys, ...(raw.keys || {}) },
      consumables: { ...d.consumables, ...(raw.consumables || {}) },
      consumablePurchased: { ...d.consumablePurchased, ...(raw.consumablePurchased || {}) },
      prestige: { ...d.prestige, ...(raw.prestige || {}), perks: { ...((raw.prestige || {}).perks || {}) } },
      equipped: { ...d.equipped, ...(raw.equipped || {}) },
      tutorial: { ...d.tutorial, ...(raw.tutorial || {}) },
      inventory: Array.isArray(raw.inventory) ? raw.inventory.slice(0, 250) : [],
      achievements: Array.isArray(raw.achievements) ? raw.achievements : []
    };
    merged.gold = Math.max(0, Number(merged.gold) || 0);
    merged.progress = Math.max(0, Math.floor(Number(merged.progress) || 0));
    merged.selectedMission = Number.isSafeInteger(raw.selectedMission) &&
      raw.selectedMission >= 0 && raw.selectedMission < merged.progress &&
      raw.selectedMission < CHAPTERS.length * MISSIONS_PER_CHAPTER ? raw.selectedMission : null;
    if (Number(raw.saveFormat || 1) < 2) {
      const oldChapter = Math.floor(merged.progress / 7), oldMission = merged.progress % 7;
      merged.progress = oldChapter < 7
        ? oldChapter * 20 + (oldMission === 6 && raw.awaitingNext ? 19 : Math.floor(oldMission * 20 / 7))
        : 140 + (oldChapter - 7) * MISSIONS_PER_CHAPTER + Math.floor(oldMission * MISSIONS_PER_CHAPTER / 7);
      merged.missionEntered = false;
    }
    merged.saveFormat = 2;
    merged.stamina = clamp(Number(merged.stamina) || 0, 0, 10000);
    merged.staminaUpdatedAt = Number.isFinite(Number(merged.staminaUpdatedAt)) ? Number(merged.staminaUpdatedAt) : Date.now();
    merged.lastSupplyAt = Math.max(0, Number(merged.lastSupplyAt) || 0);
    for (const [lifetime, run] of Object.entries(RUN_STATS)) {
      // Migrate pre-v2.1 saves. First-run records can inherit prior progress;
      // after a prestige, lifetime totals must never unlock new-run quests.
      if (!Object.hasOwn(raw, run)) merged[run] = (raw.prestige?.count || 0) > 0 ? 0 : Math.max(0, Number(raw[lifetime]) || 0);
      else merged[run] = Math.max(0, Number(raw[run]) || 0);
    }
    merged.theme = 'evolution'; // Migrate existing saves, retaining progression and currency.
    const q = raw.researchQueue;
    merged.researchQueue = q && TECHS.some(t => t.id === q.id) && Number.isFinite(q.finishAt) && Number.isFinite(q.startedAt) ? { id:q.id, startedAt:q.startedAt, finishAt:q.finishAt } : null;
    return merged;
  }
  function load() { try { return mergeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')); } catch { return defaultState(); } }
  let s = load();
  let activeTab = 'battle';
  let shopCategory = 'recommended';
  let chapterBrowserIndex = Math.min(CHAPTERS.length - 1, Math.floor(s.progress / MISSIONS_PER_CHAPTER));
  let moreNavExpanded = false;
  let modal = '';
  let pendingMissionTarget = null;
  let helperRemainder = 0;
  let enemyAttackRemainder = 0;
  let timerRemainder = 0;
  let lastTick = Date.now();
  let lastRender = 0;
  const theme = () => THEMES[s.theme];
  const activeStage = () => s.selectedMission == null ? s.progress : s.selectedMission;
  const isReplay = () => s.selectedMission != null && s.selectedMission < s.progress;
  const missionIndex = () => activeStage() % MISSIONS_PER_CHAPTER;
  const chapterIndex = () => Math.floor(activeStage() / MISSIONS_PER_CHAPTER);
  const unlockedChapter = () => Math.floor(s.progress / MISSIONS_PER_CHAPTER);
  const unlockedEraIndex = () => Math.min(ERAS.length - 1, Math.floor(unlockedChapter() / 2));
  const eraIndex = () => Math.min(ERAS.length - 1, Math.floor(chapterIndex() / 2));
  const era = () => ERAS[eraIndex()];
  const chapter = () => CHAPTERS[Math.min(CHAPTERS.length - 1, chapterIndex())];
  const chapterWeapon = () => chapter().weapon;
  const missionStory = () => chapter().missions[missionIndex()];
  const enemyStageIndex = () => [0,1,2,3,4,5,3,1,4,6][missionIndex()];
  const mission = () => MISSION_TYPES[missionIndex()];
  const chapterRule = () => CHAPTER_RULES[eraIndex()];
  const equippedGear = slot => s.inventory.find(item => item.id === s.equipped[slot]);
  const gearBonus = slot => equippedGear(slot)?.value || 0;
  const perk = id => Number(s.prestige.perks[id] || 0);
  const moduleLevel = id => Number(s.modules[id] || 0);
  const techBonus = effect => TECHS.reduce((sum, t) => sum + (s.technologies[t.id] && t.effect === effect ? t.bonus : 0), 0);
  const recoveryLevel = () => clamp(Math.floor(Number(s.items.staminaRecovery) || 0), 0, 5);
  const efficiencyLevel = () => clamp(Math.floor(Number(s.items.staminaEfficiency) || 0), 0, 3);
  const regenAmount = () => 1 + recoveryLevel() * STAMINA.regenBonus;
  const regenInterval = () => STAMINA.regenMs - recoveryLevel() * STAMINA.regenFasterMs;
  const campAmount = () => STAMINA.supplyAmount + recoveryLevel() * STAMINA.supplyBonus;
  const maxStamina = () => STAMINA.base + Math.max(0, Math.floor(s.level) - 1) * STAMINA.perLevel;
  const staminaCost = () => Math.max(STAMINA.minMissionCost, 5 + Math.floor(chapterIndex() / 4) - efficiencyLevel());
  const supplyCost = () => Math.floor(420 * Math.pow(1.32, Math.min(20, chapterIndex())));
  function refreshStamina(now = Date.now()) {
    const cap = maxStamina(), previous = s.stamina;
    s.stamina = clamp(Number(s.stamina) || 0, 0, cap);
    if (s.stamina >= cap) { s.staminaUpdatedAt = now; return false; }
    const elapsed = Math.max(0, now - s.staminaUpdatedAt);
    const ticks = Math.floor(elapsed / regenInterval());
    if (ticks > 0) {
      s.stamina = Math.min(cap, s.stamina + ticks * regenAmount());
      s.staminaUpdatedAt = s.stamina === cap ? now : s.staminaUpdatedAt + ticks * regenInterval();
    }
    return s.stamina !== previous;
  }
  function startMission() {
    if (s.awaitingNext || s.battleOver) return false;
    if (s.missionEntered) return true;
    refreshStamina();
    const cost = staminaCost();
    if (s.stamina < cost) { toast('⚡ 스태미너 부족! ' + cost + ' 필요 · 야영 보급 또는 자연 회복을 이용하세요.'); return false; }
    s.stamina -= cost;
    s.staminaUpdatedAt = s.stamina === maxStamina() - cost ? Date.now() : s.staminaUpdatedAt;
    s.missionEntered = true;
    s.timerStarted = true;
    setStatus('작전 시작 · 스태미너 -' + cost, missionStory()[1]);
    persist();
    return true;
  }
  function campSupply() {
    refreshStamina();
    if (s.stamina >= maxStamina()) { toast('스태미너가 이미 가득합니다.'); return; }
    const remaining = Math.max(0, STAMINA.supplyCooldownMs - (Date.now() - s.lastSupplyAt));
    if (remaining > 0) { toast('야영 보급 대기: ' + Math.ceil(remaining / 60000) + '분'); return; }
    const cost = supplyCost();
    if (s.gold < cost) { toast('야영 보급에 필요한 금화 ' + fmt(cost) + '가 부족합니다.'); return; }
    const restored = Math.min(maxStamina() - s.stamina, campAmount());
    s.gold -= cost; s.stamina = Math.min(maxStamina(), s.stamina + restored);
    s.lastSupplyAt = Date.now();
    if (s.stamina >= maxStamina()) s.staminaUpdatedAt = Date.now();
    toast('🏕️ 야영 보급 완료 · 스태미너 +' + restored, true);
    persist(); render();
  }
  const legacyMulti = () => 1 + .06 * Math.sqrt(Math.max(0, s.prestige.count));
  const masteryTier = () => Math.floor(Math.max(0, s.level) / 5);
  const masteryMulti = () => 1 + masteryTier() * .1;
  const maxHp = () => Math.floor((120 + (s.level - 1) * 10 + masteryTier() * 25 + (s.items.armor || 0) * 25 + gearBonus('armor') + moduleLevel('shell') * 35 + perk('soul') * 30) * (1 + techBonus('hp')));
  const baseAttack = () => (10 + chapterWeapon().power + (s.level - 1) * 2 + (s.items.blade || 0) * 5 + (s.items.rune || 0) * 18 + gearBonus('weapon')) * masteryMulti() * (1 + moduleLevel('force') * .12 + perk('might') * .15 + techBonus('attack'));
  const attack = () => Math.floor(baseAttack() * legacyMulti());
  const gather = () => 15 + Math.floor((s.level - 1) / 4) * 3 + (s.items.gather || 0) * 8;
  const heal = () => 12 + (s.items.heal || 0) * 10;
  const dps = () => Math.floor(((s.items.drone || 0) * 3 + HELPERS.reduce((sum, h) => sum + ((s.helpers[h.id] || 0) * h.dps), 0) * (1 + (s.items.amplifier || 0) * .1) + s.autoclickers * baseAttack() * .4) * (1 + .025 * (s.level - 1) + .05 * masteryTier()) * (1 + moduleLevel('swift') * .14 + techBonus('dps')) * legacyMulti());
  const power = () => attack() + dps() * 3 + (maxHp() - 120) / 4;
  const xpGoal = lvl => Math.floor(650 * Math.pow(BALANCE.xpGrowth, lvl - 1));
  const goldMulti = () => 1 + .15 * (s.items.fortune || 0) + .08 * (s.items.merchant || 0) + .08 * moduleLevel('treasure') + .15 * perk('wealth') + gearBonus('relic') * .01 + techBonus('gold') + (Date.now() < s.elixirUntil ? 1 : 0);
  const xpMulti = () => 1 + .15 * (s.items.wisdom || 0) + .1 * moduleLevel('insight') + .15 * perk('memory') + techBonus('xp');
  const missionMax = () => Math.floor(320 * Math.pow(BALANCE.chapterHp, chapterIndex()) * mission().hp * chapterRule().hp * ([4,8].includes(missionIndex()) ? (chapterRule().armorHp || 1) : 1));
  const missionReward = () => Math.round(mission().gold * Math.pow(BALANCE.chapterGold, chapterIndex()) * goldMulti() * chapterRule().gold * ([3,6].includes(missionIndex()) ? (chapterRule().cargoGold || 1) : 1));
  const chapterClearBonus = () => missionIndex() === 9 ? Math.round(600 * Math.pow(BALANCE.chapterGold, chapterIndex()) * goldMulti()) : 0;
  const expectedGold = () => missionReward() + chapterClearBonus();
  const missionXp = () => Math.floor(mission().xp * Math.pow(BALANCE.chapterXp, chapterIndex()) * chapterRule().xp);
  const speedLimit = () => chapterRule().speedLimit || 60;
  const enemyHit = () => {
    const i = missionIndex(), enraged = i === 9 && s.enemyHp / missionMax() <= .35;
    const phase = [5,8].includes(i) ? 1.2 : i === 9 ? 1.4 * (enraged ? 1.5 * (chapterRule().bossRage || 1) : 1) : 1;
    return Math.max(1, Math.ceil((5 + chapterIndex() * 3) * phase * chapterRule().incoming) - (s.items.barrier || 0) * 2);
  };
  const armorReduction = () => [4,8].includes(missionIndex()) ? Math.min(1, .8 + (s.items.strike || 0) * .08) : 1;
  const itemCost = item => Math.floor(item.base * Math.pow(BALANCE.upgradeCost, s.items[item.id] || 0));
  const helperCost = h => Math.floor(h.cost * Math.pow(BALANCE.helperCost, s.helpers[h.id] || 0));
  // Repeatable expedition orders track the current run; achievements keep
  // lifetime counters. This prevents reward claims immediately after rebirth.
  const quest = () => {
    const entry = QUESTS[s.questIndex];
    return entry ? { ...entry, key: RUN_STATS[entry.key] || entry.key } : null;
  };
  const statCounter = key => Number(s[key] || 0);
  const questCounter = key => Number(s[RUN_STATS[key] || key] || 0);
  let serverRevision = 0, serverReady = false, serverSaving = false, serverDirty = false, serverBlocked = false, saveTimer = null;
  let serverActionQueue = Promise.resolve(), serverActionsPending = 0, lastServerTick = 0;
  let lastStaminaBackup = 0;
  let pendingVisualDamage = 0;
  let localBackupTimer = null, lastVerifiedBackup = 0;
  const bufferedAttacks = [];
  let attackFlushTimer = null, attackBatchInFlight = false;
  const gameApiUrl = () => '/api/game' + (adminMode ? '?mode=admin' : '');
  const staminaLabel = () => adminMode && serverReady ? '∞ 무제한' : fmt(s.stamina) + '/' + fmt(maxStamina());
  function saveLocal() {
    clearTimeout(localBackupTimer); localBackupTimer = null;
    s.lastSaved = Date.now();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  }
  function backupVerifiedState(type) {
    const now = Date.now();
    if (type === 'tick' || type === 'attackBurst' && now - lastVerifiedBackup < 1200) {
      if (!localBackupTimer) localBackupTimer = setTimeout(() => {
        localBackupTimer = null; saveLocal(); lastVerifiedBackup = Date.now();
      }, 1200);
    } else { saveLocal(); lastVerifiedBackup = now; }
  }
  function persist() {
    saveLocal(); serverDirty = true;
    if (serverReady && !serverBlocked) {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(syncServer, 1800);
    }
  }
  function saveStatus(message) { const el = $('saveIndicator'); if (el) el.textContent = message; }
  // Paint feedback immediately, while the server remains the sole authority
  // for damage, HP, loot, XP and stamina. This never mutates the game state.
  function paintPendingDamage() {
    if (activeTab !== 'battle') return;
    const shownHp = s.awaitingNext ? 0 : Math.max(1, s.enemyHp - pendingVisualDamage);
    $('enemyHpText').textContent = fmt(shownHp) + ' / ' + fmt(missionMax());
    $('enemyHpFill').style.width = clamp(shownHp / missionMax() * 100, 0, 100) + '%';
  }
  function showImmediateAction(type) {
    if (activeTab !== 'battle') return 0;
    if (type === 'gather') { floatText('채집 중…', 'gold'); return 0; }
    if (type !== 'attack' && type !== 'skill') return 0;
    if (s.awaitingNext || s.battleOver || type === 'skill' && s.essence < 25 ||
      !s.missionEntered && !adminMode && s.stamina < staminaCost()) return 0;
    const amount = type === 'attack' ? Math.max(1, Math.floor(attack() * armorReduction()))
      : 60 + attack() * 7 + dps() * 2;
    pendingVisualDamage += amount;
    floatText((type === 'skill' ? '✦ ' : '') + '-' + fmt(amount));
    const enemy = $('enemySprite');
    enemy.classList.add('hit');
    setTimeout(() => enemy.classList.remove('hit'), 120);
    const button = $('attackButton');
    button.classList.add('attack-queued');
    setTimeout(() => button.classList.remove('attack-queued'), 110);
    paintPendingDamage();
    return amount;
  }
  function releaseAttackVisuals(attacks) {
    if (!attacks.length) return;
    serverActionsPending = Math.max(0, serverActionsPending - attacks.length);
    pendingVisualDamage = Math.max(0, pendingVisualDamage - attacks.reduce((total, hit) => total + hit, 0));
    paintPendingDamage();
  }
  function discardBufferedAttacks() {
    clearTimeout(attackFlushTimer);
    attackFlushTimer = null;
    releaseAttackVisuals(bufferedAttacks.splice(0));
  }
  function scheduleAttackFlush(delay = 75) {
    if (attackFlushTimer || attackBatchInFlight || !bufferedAttacks.length || serverBlocked) return;
    attackFlushTimer = setTimeout(() => { attackFlushTimer = null; flushAttackBuffer(); }, delay);
  }
  function flushAttackBuffer() {
    if (attackBatchInFlight || !bufferedAttacks.length || serverBlocked) return;
    clearTimeout(attackFlushTimer);
    attackFlushTimer = null;
    const batch = bufferedAttacks.splice(0, 6);
    attackBatchInFlight = true;
    serverAction('attackBurst', batch.length, batch);
  }
  async function syncServer() {
    if (!serverReady || serverSaving || serverBlocked || !serverDirty) return;
    serverSaving = true; serverDirty = false;
    const snapshot = JSON.parse(JSON.stringify(s));
    saveStatus('◐ 서버 저장 중');
    try {
      const response = await fetch(gameApiUrl(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: snapshot, revision: serverRevision }), credentials: 'same-origin' });
      if (response.status === 409) { serverBlocked = true; saveStatus('⚠ 저장 충돌'); toast('다른 기기와 저장이 충돌했습니다. 로컬 진행 기록은 남아 있으니 새로고침 전에 확인하세요.'); return; }
      if (response.status === 422) {
        const rejected = await response.json();
        if (rejected.state) {
          s = mergeState(rejected.state);
          serverRevision = rejected.revision || 0;
          serverDirty = false;
          saveLocal();
          render();
        }
        saveStatus('🔒 변조 감지 · 서버 기록 복구');
        toast('⚠ 비정상적인 변경이 감지되어 서버 기록으로 복구했습니다.');
        return;
      }
      if (!response.ok) throw new Error('save failed');
      const result = await response.json(); serverRevision = result.revision; saveStatus('🔒 서버 검증 완료');
    } catch { serverDirty = true; saveStatus('○ 오프라인 저장'); }
    finally { serverSaving = false; if (serverDirty && !serverBlocked) { clearTimeout(saveTimer); saveTimer = setTimeout(syncServer, 4500); } }
  }
  function serverAction(type, id, attackBatch = null) {
    if (!serverReady || serverBlocked) return;
    if (type === 'attack') {
      if (bufferedAttacks.length >= 24) return;
      const estimate = showImmediateAction(type);
      if (!estimate) return;
      bufferedAttacks.push(estimate);
      serverActionsPending++;
      scheduleAttackFlush();
      return;
    }
    if (type !== 'attackBurst') flushAttackBuffer();
    const visualDamage = type === 'attackBurst' ? 0 : showImmediateAction(type);
    if (type !== 'attackBurst') serverActionsPending++;
    serverActionQueue = serverActionQueue.then(async () => {
      let attackBatchResolved = false, nextAttackDelay = 75;
      try {
        for (let i = 0; serverSaving && i < 80; i++)
          await new Promise(resolve => setTimeout(resolve, 100));
        if (serverSaving) throw new Error('saving in progress');
        if (serverDirty) await syncServer();
        if (serverDirty || serverBlocked) throw new Error('unsaved changes');
        const previous = { level:s.level, progress:s.progress, selectedMission:s.selectedMission, awaitingNext:s.awaitingNext,
          battleOver:s.battleOver, inventory:s.inventory, arenaWins:s.arenaWins };
        const response = await fetch(gameApiUrl(), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: type, id, revision: serverRevision }),
          credentials: 'same-origin'
        });
        const result = await response.json();
        if (!response.ok) {
          if (response.status === 409) {
            serverBlocked = true; saveStatus('⚠ 다른 기기의 게임 기록과 충돌');
            toast('다른 기기에서 게임을 진행했습니다. 최신 기록을 불러오려면 새로고침하세요.');
          } else if (type === 'attackBurst' && result.code === 'action-rate-limit') {
            bufferedAttacks.unshift(...attackBatch);
            attackBatchResolved = true;
            nextAttackDelay = 95;
          } else if (type !== 'tick') toast('⚠ 서버에서 행동을 승인하지 않았습니다. 잠시 후 다시 시도하세요.');
          return;
        }
        s = mergeState(result.state);
        serverRevision = result.revision;
        serverDirty = false;
        if (['attackBurst', 'skill', 'gather', 'heal', 'tick', 'next', 'retry'].includes(type))
          lastServerTick = Date.now();
        if (type === 'attackBurst') {
          // A successful legacy response without a count is treated as fully
          // accepted; never blindly replay an action already acknowledged.
          const processed = Number.isSafeInteger(result.processed)
            ? Math.max(0, Math.min(attackBatch.length, result.processed)) : attackBatch.length;
          releaseAttackVisuals(attackBatch.slice(0, processed));
          if (processed < attackBatch.length) {
            if (s.awaitingNext || s.battleOver) releaseAttackVisuals(attackBatch.slice(processed));
            else { bufferedAttacks.unshift(...attackBatch.slice(processed)); nextAttackDelay = 95; }
          }
          attackBatchResolved = true;
        }
        backupVerifiedState(type);
        if (['attackBurst', 'skill', 'gather', 'heal', 'tick'].includes(type) &&
          s.level === previous.level && s.progress === previous.progress &&
          s.selectedMission === previous.selectedMission &&
          s.awaitingNext === previous.awaitingNext && s.battleOver === previous.battleOver &&
          !s.tutorial.active) renderFastCombat();
        else render();
        saveStatus('🔒 서버 전투·보상 판정 완료');
        if (!previous.awaitingNext && s.awaitingNext)
          openModal('victory', victoryContent(s.lastVictory));
        else if (!previous.battleOver && s.battleOver)
          openModal('defeat', `<span class="modal-crest">🩸</span><h2>작전 중단</h2><p>체력이 소진되었거나 제한 시간이 끝났습니다. 재도전해 주세요.</p><div class="modal-actions"><button data-action="retry">다시 도전하기</button></div>`);
        if (type === 'next') {
          closeModal();
          if (previous.selectedMission != null) toast('재도전 완료! 최고 진행 미션으로 복귀했습니다.', true);
          else if (chapterIndex() !== Math.floor(previous.progress / MISSIONS_PER_CHAPTER)) chapterStoryModal();
          else setStatus('다음 작전 준비 완료', missionStory()[0]);
        }
        if (type === 'selectMission') {
          closeModal(); navigate('battle');
          toast(isReplay() ? '재도전 준비 완료 · 첫 공격에 스태미너가 소모됩니다.' : '선택한 미션으로 이동했습니다.', true);
        }
        if (type === 'retry') closeModal();
        if (type === 'doPrestige') {
          closeModal(); navigate('prestige');
          toast('프레스티지 달성! 명예 포인트가 서버에서 지급됐습니다.', true);
        }
        if (type === 'openChest') {
          const oldIds = new Set((previous.inventory || []).map(g => g.id));
          const found = s.inventory.find(g => !oldIds.has(g.id));
          if (found) openModal('loot', `<span class="modal-crest">${found.icon}</span><h2>${found.name}</h2><p>${found.rank} 장비를 서버 보상으로 획득했습니다.</p><div class="modal-actions"><button data-action="close">보관함에서 확인</button></div>`);
        }
        if (type === 'arenaFight') toast(s.arenaWins > previous.arenaWins ? '투기장 승리! 서버 보상을 획득했습니다.' : '투기장 패배. 강화한 후 다시 도전하세요.');
        if (type === 'claimDaily' || type === 'claimEvent' || type === 'claimQuest' || type === 'claimCaravan')
          toast('✓ 서버에서 보상을 지급했습니다.', true);
      } catch {
        if (type !== 'tick') toast('서버 연결이 불안정합니다. 행동이 적용되지 않았으니 다시 시도하세요.');
        saveStatus('⚠ 서버 응답 확인 필요');
      } finally {
        if (type === 'attackBurst') {
          if (!attackBatchResolved) releaseAttackVisuals(attackBatch);
          attackBatchInFlight = false;
          if (serverBlocked || s.awaitingNext || s.battleOver) discardBufferedAttacks();
          else scheduleAttackFlush(nextAttackDelay);
        } else serverActionsPending--;
        if (visualDamage) { pendingVisualDamage = Math.max(0, pendingVisualDamage - visualDamage); paintPendingDamage(); }
      }
    });
  }
  async function initializeServer() {
    saveStatus('◐ 서버 연결 중');
    try {
      const response = await fetch(gameApiUrl(), { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) throw new Error('auth or server unavailable');
      const data = await response.json(); serverRevision = data.revision || 0;
      adminAvailable = data.adminAvailable === true;
      if (adminMode && data.adminMode !== true) throw new Error('admin access denied');
      if (data.state) {
        if (Number(data.state.saveFormat || 1) < 2) serverDirty = true;
        s = mergeState(data.state);
        if (refreshStamina()) serverDirty = true;
        finishTechnology();
        const wasNewDay = s.eventDay !== today();
        dailyEvent();
        if (wasNewDay) serverDirty = true;
        const elapsed = Math.min(4 * 3600, Math.max(0, (Date.now() - (s.lastSaved || Date.now())) / 1000));
        s.gold += Math.floor(elapsed * dps() * .12);
        if (!s.awaitingNext && !s.battleOver) s.enemyHp = clamp(s.enemyHp, 1, missionMax());
        s.timer = Math.min(Number.isFinite(s.timer) ? s.timer : speedLimit(), speedLimit());
        saveLocal();
        if (elapsed > 20) serverDirty = true;
        render();
        if (modal === 'intro' && s.seenIntro) closeModal();
      } else serverDirty = true; // Existing browser progress becomes the first server save.
      serverReady = true; saveStatus(adminMode ? '🛠 관리자 테스트 서버 연결' : '🔒 서버 전투 판정 활성화');
      $('testToolsButton').classList.toggle('admin-active', adminMode);
      $('adminModeNotice').classList.toggle('hidden', !adminMode);
      render();
      if (serverDirty) { clearTimeout(saveTimer); saveTimer = setTimeout(syncServer, 1000); }
    } catch {
      if (adminMode) {
        saveStatus('⚠ 관리자 권한 확인 실패');
        toast('관리자 모드를 확인하지 못했습니다. 일반 모드로 돌아갑니다.');
        setTimeout(() => { window.location.assign('/play.html'); }, 1800);
      } else saveStatus('○ 로컬 저장 모드');
    }
  }

  const away = Math.min(4 * 3600, Math.max(0, (Date.now() - (s.lastSaved || Date.now())) / 1000));
  if (refreshStamina()) saveLocal(); // Persist offline recovery even before the first user action.
  const awayGold = Math.floor(away * dps() * .12);
  if (awayGold > 0) { s.gold += awayGold; persist(); }
  if (!Number.isFinite(s.enemyHp) || s.enemyHp <= 0 && !s.awaitingNext) s.enemyHp = missionMax();
  if (!s.awaitingNext && !s.battleOver) s.enemyHp = Math.min(s.enemyHp, missionMax());
  s.timer = Math.min(Number.isFinite(s.timer) ? s.timer : speedLimit(), speedLimit());
  dailyEvent(); // Establish today's kill baseline before the first battle.
  s.playerHp = clamp(s.playerHp, 0, maxHp());

  function toast(message, isGold = false) {
    const el = document.createElement('div'); el.className = 'toast' + (isGold ? ' gold-toast' : ''); el.textContent = message;
    $('toastLayer').appendChild(el); setTimeout(() => el.remove(), 3200);
  }
  function floatText(text, kind = '') {
    if (activeTab !== 'battle') return;
    const el = document.createElement('span'); el.className = 'damage-pop ' + kind; el.textContent = text;
    el.style.left = (45 + Math.random() * 13) + '%'; el.style.top = (37 + Math.random() * 14) + '%';
    $('floatingTexts').appendChild(el); setTimeout(() => el.remove(), 750);
  }
  function setStatus(title, text) { $('statusTitle').textContent = title; $('statusText').textContent = text; }
  function xpGain(amount) {
    s.xp += Math.floor(amount * xpMulti());
    let gained = 0;
    const oldAttack = attack(), oldHp = maxHp(), oldMastery = masteryTier(), oldStaminaCap = maxStamina();
    while (s.xp >= xpGoal(s.level) && gained < 100) {
      s.xp -= xpGoal(s.level); s.level++; gained++;
      s.playerHp = maxHp(); s.gold += 60 + s.level * 22;
    }
    if (gained) {
      s.stamina = Math.min(maxStamina(), s.stamina + gained * 3);
      const milestone = masteryTier() > oldMastery;
      toast((milestone ? '✦ 성장 돌파! ' : '레벨 업! ') + 'LV.' + s.level + ' · 공격 ' + fmt(oldAttack) + ' → ' + fmt(attack()) + ' · HP +' + fmt(maxHp() - oldHp) + ' · 스태미너 최대 +' + (maxStamina() - oldStaminaCap), true);
      setStatus(milestone ? 'LV.' + s.level + ' 전투 숙련 돌파!' : '레벨 ' + s.level + ' 달성!', '최대 스태미너 +' + (maxStamina() - oldStaminaCap) + ' · 공격력과 체력이 상승했습니다. ' + (milestone ? '숙련 보너스 +10% 적용!' : '다음 돌파는 LV.' + (Math.floor(s.level / 5) + 1) * 5));
      if (milestone) { $('growthCard')?.classList.add('growth-burst'); setTimeout(() => $('growthCard')?.classList.remove('growth-burst'), 1700); }
    }
  }
  function randomGear(tier = 0) {
    const base = GEAR_BASES[Math.floor(Math.random() * GEAR_BASES.length)];
    const luck = (s.items.prospector || 0) * .7 + moduleLevel('fortune') * 1.5 + tier * 7;
    const roll = Math.random() * 100 - luck;
    const rarity = roll < .3 ? RARITIES[4] : roll < 3 ? RARITIES[3] : roll < 15 ? RARITIES[2] : roll < 42 ? RARITIES[1] : RARITIES[0];
    const value = Math.max(1, Math.floor((base.base + chapterIndex() * 3 + tier * 4) * rarity.multi));
    return { id: 'item-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9), slot: base.slot,
      name: base.name, icon: base.icon, rarity: rarity.label, rank: rarity.name, value, upgrade: 0 };
  }
  function addGear(tier = 0) {
    if (s.inventory.length >= 200) { toast('장비 보관함이 가득 찼습니다. 장비를 판매하세요.'); return null; }
    const gear = randomGear(tier);
    s.inventory.push(gear); s.gearFound++;
    if (!s.equipped[gear.slot]) s.equipped[gear.slot] = gear.id;
    return gear;
  }
  function equipGear(id) {
    const gear = s.inventory.find(x => x.id === id); if (!gear) return;
    s.equipped[gear.slot] = gear.id; s.playerHp = Math.min(s.playerHp, maxHp());
    toast(gear.name + ' 장착 완료'); persist(); render();
  }
  function sellGear(id) {
    const gear = s.inventory.find(x => x.id === id); if (!gear) return;
    if (s.equipped[gear.slot] === id) { toast('장착 중인 장비는 먼저 다른 장비로 교체하세요.'); return; }
    const value = Math.max(30, gear.value * 20);
    s.gold += value; s.inventory = s.inventory.filter(x => x.id !== id);
    toast('장비 판매: +' + fmt(value) + ' 금화', true); persist(); render();
  }
  function forgeGear(id) {
    const gear = s.inventory.find(x => x.id === id); if (!gear || gear.upgrade >= 10) return;
    const goldCost = Math.floor((gear.value + 10) * 12 * Math.pow(1.5, gear.upgrade));
    const essenceCost = 2 + gear.upgrade * 3;
    if (s.gold < goldCost || s.essence < essenceCost) { toast('제련에 필요한 금화 또는 마력이 부족합니다.'); return; }
    s.gold -= goldCost; s.essence -= essenceCost; gear.value = Math.max(gear.value + 1, Math.floor(gear.value * 1.2)); gear.upgrade++;
    toast(gear.name + ' +' + gear.upgrade + ' 제련 성공'); persist(); render();
  }
  function openChest(type) {
    if (!['bronze','silver','gold'].includes(type) || !s.keys[type]) { toast('해당 상자의 열쇠가 부족합니다.'); return; }
    s.keys[type]--;
    const tier = type === 'gold' ? 3 : type === 'silver' ? 2 : 0;
    const gear = addGear(tier), gold = Math.floor(Math.max(200 + s.level * 40, 220 * Math.pow(BALANCE.chapterGold, chapterIndex())) * (tier + 1) * goldMulti());
    s.gold += gold; s.essence += 3 + tier * 5; s.chestsOpened++; s.runChestsOpened++;
    toast(gear ? gear.rank + ' 장비 획득: ' + gear.name : '상자 개봉 완료'); persist(); render();
    if (gear) openModal('loot', `<span class="modal-crest">${gear.icon}</span><div class="modal-overline">CHEST REWARD / ${gear.rank}</div><h2>${gear.name}</h2><p>${gear.slot === 'weapon' ? '공격력' : gear.slot === 'armor' ? '최대 체력' : '행운'} +${gear.value}<br>금화 ${fmt(gold)} 및 마력도 획득했습니다.</p><div class="modal-actions"><button data-action="close">보관함에서 확인</button></div>`);
  }
  function buyConsumable(id) {
    const costs = { bomb: 300, potion: 180, elixir: 900 };
    if (!(id in costs) || s.gold < costs[id]) { toast('금화가 부족합니다.'); return; }
    s.gold -= costs[id]; s.consumables[id] = (s.consumables[id] || 0) + 1; s.consumablePurchased[id] = (s.consumablePurchased[id] || 0) + 1; s.purchases++; s.runPurchases++;
    toast('소모품 구매 완료'); persist(); render();
  }
  function useConsumable(id) {
    if (!s.consumables[id]) { toast('소모품이 없습니다.'); return; }
    if (id === 'bomb' && (s.awaitingNext || s.battleOver)) return;
    if (id === 'bomb' && !startMission()) return;
    if (id === 'potion' && s.playerHp >= maxHp()) { toast('체력이 이미 가득합니다.'); return; }
    s.consumables[id]--;
    if (id === 'bomb') takeDamage(Math.max(100, attack() * 12), '💣 -');
    else if (id === 'potion') s.playerHp = Math.min(maxHp(), s.playerHp + Math.ceil(maxHp() * .65));
    else if (id === 'elixir') s.elixirUntil = Math.max(Date.now(), s.elixirUntil) + 10 * 60_000;
    toast('소모품 사용: ' + ({bomb:'폭발탄',potion:'치유 물약',elixir:'황금 비약'}[id])); persist(); render();
  }
  function researchModule(id) {
    const m = MODULES.find(x => x.id === id); if (!m) return;
    if (s.level < m.req) { toast('레벨 ' + m.req + '부터 연구할 수 있습니다.'); return; }
    const level = moduleLevel(id), cost = Math.floor(m.cost * Math.pow(1.6, level)), shard = level >= 3 ? 1 + Math.floor((level - 3) / 3) : 0;
    if (s.essence < cost || s.shards < shard) { toast('마력 또는 유물이 부족합니다.'); return; }
    s.essence -= cost; s.shards -= shard; s.modules[id] = level + 1; s.moduleResearch++; s.runModuleResearch++; s.purchases++; s.runPurchases++;
    if (id === 'shell') s.playerHp = Math.min(maxHp(), s.playerHp + 35);
    toast(m.name + ' 연구 LV.' + (level + 1)); persist(); render();
  }
  function beginTechnology(id) {
    const t = TECHS.find(x => x.id === id);
    if (!t || s.technologies[id] || s.researchQueue) return;
    if (unlockedEraIndex() < t.era) { toast('이 기술은 ' + ERAS[t.era].age + '에 해금됩니다.'); return; }
    if (t.requires && !s.technologies[t.requires]) { toast('선행 기술을 먼저 완성해야 합니다.'); return; }
    if (s.gold < t.gold || s.essence < t.essence || s.shards < (t.shards || 0)) { toast('연구 자원이 부족합니다.'); return; }
    s.gold -= t.gold; s.essence -= t.essence; s.shards -= t.shards || 0;
    s.researchQueue = { id: t.id, startedAt: Date.now(), finishAt: Date.now() + t.seconds * 1000 };
    toast('🔬 ' + t.name + ' 연구 시작 · ' + Math.ceil(t.seconds / 60) + '분 이내 완성');
    persist(); render();
  }
  function finishTechnology() {
    const q = s.researchQueue;
    if (!q || Date.now() < q.finishAt) return false;
    const t = TECHS.find(x => x.id === q.id);
    s.researchQueue = null;
    if (t && !s.technologies[t.id]) {
      const previousHp = maxHp();
      s.technologies[t.id] = true;
      if (t.effect === 'hp') s.playerHp += maxHp() - previousHp;
      toast('🎉 연구 완료! ' + t.name + ' · ' + TECH_EFFECT_LABEL[t.effect] + ' +' + Math.round(t.bonus * 100) + (t.effect === 'crit' ? '%p' : '%'), true);
    }
    persist();
    return true;
  }
  function technologyMarkup() {
    const done = TECHS.filter(t => s.technologies[t.id]).length;
    const q = s.researchQueue, ongoing = q && TECHS.find(t => t.id === q.id);
    const remaining = q ? Math.max(0, Math.ceil((q.finishAt - Date.now()) / 1000)) : 0;
    const progress = q ? clamp((Date.now() - q.startedAt) / Math.max(1, q.finishAt - q.startedAt) * 100, 0, 100) : 0;
    return `<div class="section-label">🔬 문명 기술 연구 · ${done} / ${TECHS.length} 완료</div><div class="research-overview">${ongoing ? `<div class="research-active"><span class="research-live">● 연구 진행 중</span><h3>${ongoing.icon} ${ongoing.name}</h3><p>연구는 게임을 종료해도 계속 진행됩니다.</p><div class="research-meter"><div id="researchProgress" style="width:${progress}%"></div></div><strong id="researchCountdown">${Math.floor(remaining / 60)}분 ${remaining % 60}초 남음</strong></div>` : `<div class="research-idle">🧪 <strong>연구 슬롯 대기 중</strong><small>시대에 맞는 기술을 선택하면 자원을 지불하고 연구가 시작됩니다. 한 번에 하나만 진행할 수 있어요.</small></div>`}<span class="research-total">완료 ${done}종 · 진행 ${ongoing ? 1 : 0}종</span></div><div class="tech-grid">${TECHS.map(t => {
      const complete = !!s.technologies[t.id], lockedAge = unlockedEraIndex() < t.era, prerequisite = t.requires && !s.technologies[t.requires], inProgress = q?.id === t.id;
      const affordable = s.gold >= t.gold && s.essence >= t.essence && s.shards >= (t.shards || 0);
      const disabled = complete || lockedAge || prerequisite || !!q || !affordable;
      const status = complete ? '✓ 연구 완료 · 영구 적용 중' : inProgress ? '⏳ 연구 진행 중' : lockedAge ? '🔒 ' + ERAS[t.era].age + ' 해금' : prerequisite ? '🔗 선행 연구: ' + TECHS.find(x => x.id === t.requires).name : !!q ? '다른 연구 진행 중' : !affordable ? '연구 재화 부족' : '기술 연구 시작';
      return `<article class="tech-card ${complete ? 'researched' : ''} ${lockedAge ? 'tech-locked' : ''}"><div class="tech-head"><span class="tech-icon">${t.icon}</span><div><small>CH.${t.era + 1} · ${ERAS[t.era].age}</small><h3>${t.name}</h3></div></div><p>${t.description}</p><div class="tech-benefit">✦ ${TECH_EFFECT_LABEL[t.effect]} +${Math.round(t.bonus * 100)}${t.effect === 'crit' ? '%p' : '%'} · 영구 패시브</div><div class="tech-cost"><span class="gold-icon" aria-label="금화">G</span> ${fmt(t.gold)}G · 🔮 ${fmt(t.essence)}${t.shards ? ' · 💎 ' + t.shards : ''}<br>⏱ ${t.seconds >= 60 ? Math.round(t.seconds / 60) + '분' : t.seconds + '초'} 소요</div><button class="purchase-button" data-tech="${t.id}" ${disabled ? 'disabled' : ''}>${status}</button></article>`;
    }).join('')}</div>`;
  }
  function buyAutoClicker() {
    if (s.level < 6) { toast('레벨 6부터 오토클리커를 설치할 수 있습니다.'); return; }
    const cost = Math.floor(750 * Math.pow(1.95, s.autoclickers));
    if (s.gold < cost) { toast('금화가 부족합니다.'); return; }
    s.gold -= cost; s.autoclickers++; s.purchases++; s.runPurchases++;
    toast('오토클리커 설치! 초당 피해 증가'); persist(); render();
  }
  function spendPrestige(id) {
    const p = PRESTIGE_PERKS.find(x => x.id === id); if (!p || s.prestige.points < 1) return;
    s.prestige.points--; s.prestige.perks[id] = perk(id) + 1;
    if (id === 'soul') s.playerHp += 30;
    toast(p.name + ' 영구 강화 완료'); persist(); render();
  }
  const prestigeGain = () => Math.max(0, Math.floor(s.progress / MISSIONS_PER_CHAPTER) + Math.floor(s.progress / (3 * MISSIONS_PER_CHAPTER)) + Math.floor(s.level / 15));
  function performPrestige() {
    const gain = prestigeGain(); if (s.progress < MISSIONS_PER_CHAPTER || gain <= 0) return;
    if (s.specialMission) { toast('진행 중인 특수 작전을 마친 후 프레스티지할 수 있습니다.'); return; }
    const previous = s, fresh = defaultState();
    fresh.theme = previous.theme;
    fresh.prestige = { count: previous.prestige.count + 1, points: previous.prestige.points + gain, perks: { ...previous.prestige.perks } };
    fresh.prestigeCount = previous.prestigeCount + 1;
    fresh.achievements = [...previous.achievements];
    fresh.inventory = [...previous.inventory]; fresh.equipped = { ...previous.equipped };
    fresh.modules = { ...previous.modules }; fresh.keys = { ...previous.keys };
    fresh.technologies = { ...previous.technologies }; fresh.researchQueue = previous.researchQueue ? { ...previous.researchQueue } : null;
    fresh.shards = previous.shards; fresh.caravan = previous.caravan;
    fresh.gearFound = previous.gearFound; fresh.chestsOpened = previous.chestsOpened;
    fresh.moduleResearch = previous.moduleResearch; fresh.caravanCount = previous.caravanCount;
    fresh.specialWins = previous.specialWins; fresh.kills = previous.kills; fresh.clicks = previous.clicks;
    fresh.seenIntro = true; fresh.playerHp = 120 + (fresh.prestige.perks.soul || 0) * 30 + gearBonus('armor');
    fresh.gold = 500 + Math.min(4000, fresh.prestige.count * 300) + perk('wealth') * 150;
    s = fresh; s.enemyHp = missionMax(); s.playerHp = maxHp(); closeModal(); navigate('prestige'); persist();
    toast('프레스티지 달성! 명예 포인트 +' + gain, true);
  }
  const CARAVANS = [
    { name: '오솔길 조사', icon: '🗺️', duration: 90_000, cost: 350, gold: 1050, essence: 12, req: 1 },
    { name: '잊힌 보급로', icon: '🐪', duration: 240_000, cost: 2200, gold: 6700, essence: 36, req: 8 },
    { name: '심연의 무역로', icon: '🛸', duration: 600_000, cost: 12000, gold: 38500, essence: 110, req: 18 }
  ];
  function launchCaravan(index) {
    const route = CARAVANS[index];
    if (!route || s.caravan || s.level < route.req || s.gold < route.cost) return;
    s.gold -= route.cost;
    s.caravan = { index, finish: Date.now() + route.duration };
    toast(route.name + ' 파견 시작'); persist(); render();
  }
  function claimCaravan() {
    if (!s.caravan || Date.now() < s.caravan.finish) return;
    const route = CARAVANS[s.caravan.index]; if (!route) return;
    const gold = Math.floor(route.gold * goldMulti());
    s.gold += gold; s.essence += route.essence; s.caravanCount++; s.runCaravanCount++;
    if (Math.random() < .35) s.keys.silver++;
    if (Math.random() < .2) addGear(1);
    s.caravan = null;
    toast('캐러밴 귀환! 금화 +' + fmt(gold), true); persist(); render();
  }
  function startSpecial() {
    if (s.level < 8 || s.specialMission || Date.now() < s.specialAt) return;
    const hp = Math.floor(2500 * Math.pow(1.4, Math.floor(s.specialWins / 3)) + s.level * 110);
    s.specialMission = { max: hp, hp, finish: Date.now() + 75_000 };
    persist(); render(); toast('특수 작전 시작! 제한 시간 75초');
  }
  function strikeSpecial() {
    const op = s.specialMission;
    if (!op) return;
    if (Date.now() >= op.finish) { s.specialMission = null; s.specialAt = Date.now() + 45_000; persist(); render(); return; }
    s.specialStrikes++;
    const dmg = Math.floor(attack() * (Math.random() < .15 ? 2 : 1) * 4 + dps() * 1.5);
    op.hp = Math.max(0, op.hp - dmg);
    if (op.hp === 0) {
      const reward = Math.floor((1400 + s.specialWins * 600) * goldMulti());
      s.specialWins++; s.gold += reward; s.essence += 30 + s.specialWins * 3;
      s.keys.gold++; addGear(2); s.specialMission = null; s.specialAt = Date.now() + 120_000;
      toast('특수 작전 성공! 전리품, 금열쇠, 장비 획득', true);
    }
    persist(); render();
  }
  function dailyEvent() {
    const day = today();
    if (s.eventDay !== day) { s.eventDay = day; s.eventStartKills = s.kills; s.eventClaimed = false; }
    return Math.max(0, s.kills - s.eventStartKills);
  }
  function claimEvent() {
    if (dailyEvent() < 5 || s.eventClaimed) return;
    s.eventClaimed = true; s.essence += 30; s.keys.silver++; s.gold += Math.floor(1250 * Math.pow(BALANCE.chapterGold, chapterIndex()) + s.level * 55);
    toast('일일 탐사 이벤트 완료! 은열쇠 +1', true); persist(); render();
  }
  function takeDamage(amount, source = '') {
    if (s.awaitingNext || s.battleOver) return;
    s.enemyHp = Math.max(0, s.enemyHp - amount);
    if (source) floatText(source + fmt(amount));
    if (s.enemyHp === 0) winMission();
  }
  function victoryContent(result = null) {
    const boss = missionIndex() === 9;
    const replay = !!result?.replay || isReplay();
    const headline = boss ? chapterTitle() + ' 돌파!' : '개척 성공!';
    const summary = missionStory()[2] + (boss ? '<br><br>' + chapter().epilogue : '');
    const rewards = result
      ? `<div class="modal-rewards"><span><span class="gold-icon" aria-label="금화">G</span> ${fmt(result.gold)} 금화</span><span>✨ ${fmt(result.xp)} XP</span><span>🔮 ${result.essence} 마력</span>${result.shard ? `<span>💎 유물 +${result.shard}</span>` : ''}${result.foundKey ? '<span>🗝️ 상자 열쇠 +1</span>' : ''}${result.foundGear ? `<span>${result.foundGear.icon} ${result.foundGear.rank} 장비</span>` : ''}</div>`
      : '<div class="modal-rewards"><span>✓ 전리품이 이미 지급되었습니다</span></div>';
    return `<div class="victory-era-panel"><div class="victory-era-icon">${chapter().scene}</div><span>CHAPTER ${String(chapterIndex()+1).padStart(2,'0')} · ${era().age}</span><strong>${chapterTitle()}</strong><small>${chapter().period} · 문명 진화 연대기</small></div><div class="victory-detail"><div class="modal-overline">${replay ? 'REPLAY COMPLETE · 재도전 성공' : 'MISSION ' + String(missionIndex()+1).padStart(2, '0') + ' / ' + MISSIONS_PER_CHAPTER + ' COMPLETE'}</div><h2>${headline}</h2><p>${summary}${replay ? '<br>재도전 보상은 25%이며 보스 유물·장비·열쇠는 중복 지급되지 않습니다.' : ''}${result?.speedBonus > 1 ? '<br>⏱ 속전 보너스 +40% 달성!' : ''}</p>${rewards}<div class="modal-actions"><button data-action="next">${replay ? '원래 진행 미션으로 →' : boss ? '다음 챕터로 →' : '다음 미션으로 →'}</button></div></div>`;
  }
  function winMission() {
    if (s.awaitingNext) return;
    dailyEvent(); // Day rollover counts victories in the correct KST day.
    s.awaitingNext = true; s.timerStarted = false;
    const speedBonus = [2,7].includes(missionIndex()) && s.timer >= speedLimit() - 20 ? 1.4 : 1;
    const replay = isReplay();
    const gold = Math.max(1, Math.floor((replay ? missionReward() : expectedGold()) * speedBonus * (replay ? .25 : 1))), xp = Math.max(1, Math.floor(missionXp() * speedBonus * (replay ? .25 : 1))), essence = replay ? 1 : 4 + chapterIndex() * 2 + (s.items.reactor || 0) * 2 + (chapterRule().essence || 0), shard = !replay && missionIndex() === 9 ? 1 + (chapterRule().shard || 0) : 0;
    s.gold += gold; s.essence += essence; s.shards += shard; s.kills++; s.runKills++;
    const discovery = Math.min(.85, .19 + (s.items.prospector || 0) * .05 + moduleLevel('fortune') * .04 + (chapterRule().loot || 0));
    const foundGear = !replay && (missionIndex() === 9 || Math.random() < discovery) ? addGear(missionIndex() === 9 ? 2 : 0) : null;
    const foundKey = !replay && ([3,6,9].includes(missionIndex()) || Math.random() < (.18 + (s.items.prospector || 0) * .04));
    if (foundKey) s.keys[missionIndex() === 9 && chapterIndex() >= 2 ? 'silver' : 'bronze']++;
    if (!replay && missionIndex() === 9) s.stamina = Math.min(maxStamina(), s.stamina + 12);
    xpGain(xp);
    s.lastVictory = { gold, xp, essence, shard, foundKey, foundGear: foundGear ? { icon: foundGear.icon, rank: foundGear.rank } : null, speedBonus, replay };
    persist(); render();
    openModal('victory', victoryContent(s.lastVictory));
  }
  function failMission(reason) {
    if (s.battleOver || s.awaitingNext) return;
    s.battleOver = true; persist(); render();
    openModal('defeat', `<span class="modal-crest">🩸</span><div class="modal-overline">EXPEDITION FAILED</div><h2>작전 중단</h2><p>${reason}<br>이번 전투를 재시도해 주세요. 구매한 장비와 재화는 유지됩니다.</p><div class="modal-actions"><button data-action="retry">다시 도전하기</button></div>`);
  }
  function advance() {
    if (!s.awaitingNext) return;
    const pastChapter = chapterIndex(), replay = isReplay();
    if (!replay) s.progress++;
    s.selectedMission = null; s.lastVictory = null; s.enemyHp = missionMax(); s.playerHp = Math.max(Math.ceil(maxHp() * .65), Math.min(maxHp(), s.playerHp + maxHp() * (.3 + .04 * (s.items.vitality || 0))));
    s.awaitingNext = false; s.battleOver = false; s.timer = speedLimit(); s.timerStarted = false; s.missionEntered = false;
    closeModal(); persist(); render();
    if (replay) toast('재도전 완료! 현재 진행 미션으로 복귀했습니다.', true);
    else if (chapterIndex() !== pastChapter) { toast('새 챕터 해금! ' + chapterTitle()); setStatus('문명의 새로운 장', chapter().prologue); chapterStoryModal(); }
    else setStatus('다음 작전 준비 완료', '새 작전: ' + missionStory()[0]);
  }
  function selectMission(target, confirmed = false) {
    if (!Number.isSafeInteger(target) || target < 0 || target > s.progress || target >= CHAPTERS.length * MISSIONS_PER_CHAPTER) {
      toast('아직 해금되지 않은 미션입니다.'); return;
    }
    if (serverReady && (serverActionsPending || serverSaving)) { toast('서버 전투 판정이 끝난 후 선택해 주세요.'); return; }
    if (target === activeStage()) {
      closeModal(); navigate('battle');
      if (s.awaitingNext) openModal('victory', victoryContent(s.lastVictory));
      else if (s.battleOver) openModal('defeat', `<span class="modal-crest">🩸</span><h2>작전 중단</h2><p>현재 미션에 다시 도전할 수 있습니다.</p><div class="modal-actions"><button data-action="retry">다시 도전하기</button></div>`);
      return;
    }
    if (!confirmed && s.missionEntered && !s.awaitingNext && !s.battleOver) {
      pendingMissionTarget = target;
      const story = CHAPTERS[Math.floor(target / 10)].missions[target % 10];
      openModal('mission-switch', `<div class="modal-overline">CHANGE OPERATION</div><h2>진행 중인 전투를 포기할까요?</h2><p>현재 전투는 중단되고 입장에 사용한 스태미너는 돌려받지 못합니다.<br>선택할 미션: <strong>${story[0]}</strong></p><div class="modal-actions"><button class="modal-secondary" data-action="close">현재 전투 유지</button><button data-action="confirmMissionSelect">미션 변경하기 →</button></div>`);
      return;
    }
    pendingMissionTarget = null;
    if (serverReady) { serverAction('selectMission', target); return; }
    s.selectedMission = target < s.progress ? target : null;
    s.enemyHp = missionMax(); s.playerHp = maxHp();
    s.lastVictory = null; s.awaitingNext = false; s.battleOver = false;
    s.missionEntered = false; s.timerStarted = false; s.timer = speedLimit();
    helperRemainder = 0; enemyAttackRemainder = 0; timerRemainder = 0;
    closeModal(); persist(); navigate('battle');
    toast(isReplay() ? '재도전 준비 완료 · 첫 공격 시 스태미너 소모' : '미션 선택 완료', true);
  }
  function retry() { s.enemyHp = missionMax(); s.playerHp = maxHp(); s.battleOver = false; s.timer = speedLimit(); s.timerStarted = false; s.missionEntered = false; closeModal(); persist(); render(); }
  function chapterTitle() { return chapterIndex() < CHAPTERS.length ? chapter().name : '성간 개척 · 제' + (chapterIndex() - CHAPTERS.length + 2) + '성계'; }
  function actAttack() {
    if (s.awaitingNext || s.battleOver) { toast('먼저 현재 작전을 마무리하세요.'); return; }
    if (!startMission()) return;
    s.timerStarted = true; s.clicks++; s.runClicks++;
    const crit = Math.random() < Math.min(.65, (s.items.critical || 0) * .03 + techBonus('crit'));
    const amount = attack() * armorReduction() * (crit ? 2 : 1);
    if (crit) toast('💥 치명타!');
    takeDamage(Math.max(1, Math.floor(amount)), '-'); xpGain(18 + chapterIndex() * 3);
    const el = $('enemySprite'); el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 130);
    persist(); render();
  }
  function actHeal() { if (s.awaitingNext || s.battleOver) return; const gain = Math.min(maxHp() - s.playerHp, heal()); if (gain <= 0) { toast('체력이 이미 가득합니다.'); return; } s.playerHp += gain; s.healsUsed++; xpGain(3); floatText('+' + fmt(gain) + ' HP', 'heal'); persist(); render(); }
  function actGather() { const amount = Math.floor(gather() * goldMulti()); s.gold += amount; s.tutorialGathers = (s.tutorialGathers || 0) + 1; xpGain(6); floatText('+' + fmt(amount) + ' G', 'gold'); persist(); render(); }
  function actSkill() { if (s.awaitingNext || s.battleOver) return; if (s.essence < 25) { toast('마력이 부족합니다. 미션 완료로 마력을 모으세요.'); return; } if (!startMission()) return; s.essence -= 25; s.skillsUsed++; s.timerStarted = true; const amount = 60 + attack() * 7 + dps() * 2; takeDamage(amount, '✦ -'); xpGain(80); persist(); render(); }
  function buyItem(id) {
    const item = ITEMS.find(i => i.id === id);
    if (!item) return;
    const level = Math.max(0, Math.floor(Number(s.items[id]) || 0));
    if (item.maxLevel && level >= item.maxLevel) { toast('이미 최대 강화 단계입니다.'); return; }
    const cost = itemCost(item);
    if (s.gold < cost) { toast('금화가 부족합니다.'); return; }
    if (id === 'staminaRecovery') refreshStamina(); // Settle old recovery ticks before changing the rate.
    s.gold -= cost; s.items[id] = level + 1; s.purchases++; s.runPurchases++;
    if (id === 'armor') s.playerHp = Math.min(maxHp(), s.playerHp + 25);
    xpGain(60); toast(item.name + ' 강화 완료!'); persist(); render();
  }
  function buyHelper(id) { const h = HELPERS.find(i => i.id === id); if (!h) return; if (s.level < h.req) { toast('레벨 ' + h.req + '부터 합류할 수 있습니다.'); return; } const cost = helperCost(h); if (s.gold < cost) { toast('금화가 부족합니다.'); return; } s.gold -= cost; s.helpers[id] = (s.helpers[id] || 0) + 1; s.purchases++; s.runPurchases++; xpGain(100); toast(h.name + ' ' + ((s.helpers[h.id] === 1) ? '합류!' : '강화!')); persist(); render(); }
  function claimQuest() { const q = quest(); if (!q || questCounter(q.key) < q.target) return; s.gold += q.gold; s.essence += q.essence; s.questIndex++; toast('임무 보상 지급: ' + fmt(q.gold) + ' 금화', true); persist(); render(); }
  function claimAchievement(id) { const a = ACHIEVEMENTS.find(i => i.id === id); if (!a || s.achievements.includes(id) || statCounter(a.key) < a.target) return; s.gold += a.reward; s.achievements.push(id); toast('업적 보상: +' + fmt(a.reward) + ' 금화', true); persist(); render(); }
  function claimDaily() { if (s.dailyClaim === today()) { toast('오늘의 보상은 이미 받았습니다.'); return; } const amount = Math.floor(350 + s.level * 30 + 120 * Math.pow(BALANCE.chapterGold, chapterIndex())); s.gold += amount; s.essence += 5; s.stamina = Math.min(maxStamina(), s.stamina + 20); s.dailyClaim = today(); toast('일일 보상: +' + fmt(amount) + ' 금화 · +5 마력 · 스태미너 +20', true); persist(); render(); }
  function arenaFight() { if (s.level < 3) { toast('레벨 3부터 참가할 수 있습니다.'); return; } const remaining = Math.max(0, Math.ceil((s.arenaAt + 30_000 - Date.now()) / 1000)); if (remaining) { toast(remaining + '초 후 재도전할 수 있습니다.'); return; } const enemyPower = 50 + s.arenaWins * 55; const myPower = power(); const win = myPower >= enemyPower * (.77 + Math.random() * .35); s.arenaAt = Date.now(); if (win) { s.arenaWins++; const amount = Math.floor(300 + s.arenaWins * 120 + 90 * Math.pow(BALANCE.chapterGold, chapterIndex())); s.gold += amount; s.essence += 4; toast('투기장 승리! +' + fmt(amount) + ' 금화', true); } else { toast('투기장 패배! 장비와 동료를 강화하세요.'); } persist(); render(); }

  function renderStaminaLive() {
    const recovery = Math.max(0, Math.ceil((regenInterval() - Math.max(0, Date.now() - s.staminaUpdatedAt)) / 1000));
    $('staminaText').textContent = adminMode && serverReady ? '∞ 무제한' : fmt(s.stamina) + ' / ' + fmt(maxStamina());
    $('staminaFill').style.width = adminMode && serverReady ? '100%' : clamp(s.stamina / maxStamina() * 100, 0, 100) + '%';
    const staminaPace = '자연 +' + regenAmount() + '/' + (regenInterval() / 1000) + '초';
    $('staminaInfo').textContent = adminMode && serverReady ? '🛠 관리자 전용 · 미션 입장 스태미너 소모 없음' : (s.missionEntered ? '✓ 추가 차감 없음' : '입장 -' + staminaCost()) + ' · ' + staminaPace + ' · ' + (s.stamina >= maxStamina() ? '충전 완료' : '다음 회복 ' + recovery + '초');
    const supplyRemaining = Math.max(0, STAMINA.supplyCooldownMs - (Date.now() - s.lastSupplyAt));
    $('staminaSupply').textContent = supplyRemaining ? '🏕️ 보급 대기 ' + Math.ceil(supplyRemaining / 60000) + '분' : '🏕️ 야영 보급 +' + campAmount() + ' · ' + fmt(supplyCost()) + ' 금화';
    $('staminaSupply').disabled = s.stamina >= maxStamina() || supplyRemaining > 0 || s.gold < supplyCost();
    $('attackButton').disabled = !adminMode && !s.missionEntered && s.stamina < staminaCost() || s.awaitingNext || s.battleOver || adminMode && !serverReady;
  }
  function renderCombatLive() {
    const enraged = missionIndex() === 9 && s.enemyHp / missionMax() <= .35 && !s.awaitingNext;
    if ($('battlefield').dataset.liveEnraged !== String(enraged)) {
      renderBattle(); // Boss phase and narrative actually changed.
      return;
    }
    $('enemyHpText').textContent = fmt(s.enemyHp) + ' / ' + fmt(missionMax());
    $('enemyHpFill').style.width = clamp(s.enemyHp / missionMax() * 100, 0, 100) + '%';
    $('playerHpText').textContent = fmt(s.playerHp) + ' / ' + fmt(maxHp());
    $('playerHpFill').style.width = clamp(s.playerHp / maxHp() * 100, 0, 100) + '%';
    $('missionTimer').textContent = [2, 7].includes(missionIndex()) ? '◷ ' + Math.ceil(s.timer) + '초' : '';
    renderStaminaLive();
    if (pendingVisualDamage) paintPendingDamage();
  }
  function renderBattle() {
    const c = chapterIndex(), i = missionIndex(), info = mission(), max = missionMax(), t = era();
    const ep = chapter(), storyline = missionStory(), wp = chapterWeapon();
    const enraged = i === 9 && s.enemyHp / max <= .35 && !s.awaitingNext;
    const helperSignature = `${s.level}:${HELPERS.map(h => s.helpers[h.id] || 0).join(',')}:${dps()}`;
    if ($('leftHelperSlots').dataset.signature !== helperSignature) {
      const ownedCount = HELPERS.filter(h => (s.helpers[h.id] || 0) > 0).length;
      $('leftHelperSlots').innerHTML = `<button class="helper-summary" data-nav="helpers" title="동료 관리로 이동"><span>♧ 동료 ${ownedCount}/${HELPERS.length}</span><small>자동 피해 ${fmt(dps())}/초 · 관리 →</small></button>`;
      $('leftHelperSlots').dataset.signature = helperSignature;
    }
    $('pageEyebrow').textContent = 'CHAPTER ' + String(c + 1).padStart(2, '0') + ' / OPERATION ' + String(i + 1).padStart(2, '0');
    $('pageTitle').textContent = chapterTitle() + ' · ' + storyline[0];
    $('pageSubtitle').textContent = s.awaitingNext ? storyline[2] : storyline[1];
    $('missionBadge').innerHTML = info.type + ' 임무 <span>● ' + (s.awaitingNext ? '완료' : isReplay() ? '재도전 중' : '진행 중') + '</span><em>LV.' + s.level + ' · 숙련 공격 +' + (masteryTier() * 10) + '%</em>';
    $('worldLabel').textContent = 'CH.' + (c + 1) + ' · ' + t.age + ' · ' + ep.period;
    $('chapterName').textContent = chapterTitle(); $('chapterNum').textContent = String(c + 1).padStart(2, '0');
    $('chapterProgress').textContent = Math.max(0, Math.min(MISSIONS_PER_CHAPTER, s.progress - c * MISSIONS_PER_CHAPTER)) + ' / ' + MISSIONS_PER_CHAPTER + ' 완료';
    $('chapterReward').textContent = '보스 추가 금화 ' + fmt(Math.floor(600 * Math.pow(BALANCE.chapterGold, c) * goldMulti())) + ' · 유물 ' + (1 + (chapterRule().shard || 0)) + '개';
    $('chapterTrait').textContent = '✧ ' + chapterRule().name + ' · ' + chapterRule().detail;
    $('chapterStory').innerHTML = `<span>${ep.scene} ${t.age}</span><strong>${ep.prologue}</strong><small>챕터 전체 이야기 읽기 ↗</small>`;
    const missionSignature = c + ':' + i + ':' + s.progress + ':' + s.awaitingNext + ':' + s.selectedMission;
    if ($('missionList').dataset.signature !== missionSignature) {
      $('missionList').innerHTML = MISSION_TYPES.map((m, index) => {
        const target = c * MISSIONS_PER_CHAPTER + index;
        const completed = target < s.progress || target === s.progress && s.awaitingNext;
        const active = target === activeStage();
        const unlocked = target <= s.progress;
        return `<button class="mission-item ${completed ? 'complete' : ''} ${active ? 'active' : ''} ${index === 9 ? 'boss-mission' : ''}" ${unlocked ? '' : 'disabled'} data-select-mission="${target}" title="${unlocked ? (completed ? '재도전 · 보상 25%' : '현재 미션') : '이전 미션을 클리어하면 해금'} · ${m.role}"><span class="mission-index">${index === 9 ? '♛' : String(index + 1).padStart(2, '0')}</span><span class="mission-copy"><strong>${ep.missions[index][0]}</strong><small>${index === 9 ? 'BOSS · 챕터 결전' : m.tag + ' · ' + m.role.split(' · ')[0]}</small></span><span class="mission-mark">${active ? '◉' : completed ? '✔' : '🔒'}</span></button>`;
      }).join('');
      $('missionList').dataset.signature = missionSignature;
    }
    $('fieldSector').textContent = t.age.toUpperCase() + ' · ' + info.tag;
    $('missionStoryPreview').textContent = storyline[1].slice(0, 42) + '…  자세히 보기 ↗';
    $('fieldCondition').textContent = s.awaitingNext ? '작전 완료' : enraged ? '⚡ 보스 각성!' : info.type === '보스' ? '보스 교전 중' : '적대 신호 감지';
    $('battlefield').classList.toggle('boss-enraged', enraged);
    $('battlefield').dataset.liveEnraged = String(enraged);
    $('enemyName').textContent = t.enemies[enemyStageIndex()]; $('enemyType').textContent = enraged ? '각성 2단계 · 반격 강화' : info.type + '형 · 위협도 ' + (c + 1);
    $('enemySprite').textContent = t.emoji[enemyStageIndex()];
    $('eraSceneMark').textContent = ep.scene;
    $('enemyHpText').textContent = fmt(s.enemyHp) + ' / ' + fmt(max);
    $('enemyHpFill').style.width = clamp(s.enemyHp / max * 100, 0, 100) + '%';
    $('battleHint').textContent = enraged ? '⚠ 각성: 더 빠르고 강한 반격 · 치료에 주의!' : info.type === '중장갑' ? '중장갑: 클릭 피해 20% 감소 · 분쇄 투사체로 대응' : info.type === '수송' ? '보급선을 제압하면 금화를 집중 획득합니다.' : info.type === '정예' ? '정예 수비대: 적의 반격 +20%' : info.type === '속전' ? speedLimit() + '초 안에 제압 · 20초 이상 남기면 보너스' : info.type === '보스' ? '체력 35% 아래에서 2단계로 각성합니다!' : info.role;
    $('missionTimer').textContent = info.type === '속전' ? '◷ ' + Math.ceil(s.timer) + '초' : '';
    $('missionPayout').textContent = isReplay()
      ? '재도전 보상 25% · 금화 ' + fmt(Math.max(1, Math.floor(missionReward() * .25))) + ' · XP ' + fmt(Math.max(1, Math.floor(missionXp() * .25))) + ' · 유물 중복 지급 없음'
      : '예상 보상 · 금화 ' + fmt(expectedGold()) + ' · XP ' + fmt(missionXp()) + (i === 9 ? ' · 유물 ' + (1 + (chapterRule().shard || 0)) : '');
    $('attackDamage').textContent = '+' + fmt(attack());
    $('attackWeaponIcon').textContent = wp.icon;
    $('attackActionLabel').textContent = wp.action;
    $('attackWeaponName').textContent = wp.name + ' · 기본 화력 +' + wp.power;
    renderStaminaLive();
    $('playerHpText').textContent = fmt(s.playerHp) + ' / ' + fmt(maxHp());
    $('playerHpFill').style.width = clamp(s.playerHp / maxHp() * 100, 0, 100) + '%';
    $('powerValue').textContent = fmt(power()); $('dpcValue').textContent = fmt(attack()); $('dpsValue').textContent = fmt(dps());
    $('growthBonus').textContent = '공격 +' + masteryTier() * 10 + '% · 최대 체력 +' + masteryTier() * 25;
    $('growthNext').textContent = '다음 성장 돌파 LV.' + (Math.floor(s.level / 5) + 1) * 5 + ' · ' + (5 - s.level % 5) + '레벨 남음';
    $('healVal').textContent = '+' + fmt(heal()) + ' HP'; $('gatherVal').textContent = '+' + fmt(gather()) + ' 금화';
    $('skillDetail').textContent = '마력 25 소모 · 피해 ' + fmt(60 + attack() * 7 + dps() * 2);
    const q = quest();
    const questSignature = s.questIndex + ':' + (q ? statCounter(q.key) : 0);
    if ($('quickQuest').dataset.signature !== questSignature) {
      $('quickQuest').innerHTML = q ? `<div class="quest-strap"><span>✦ 탐사단의 지령</span><span>${s.questIndex + 1} / ${QUESTS.length}</span></div><div class="quest-title">${q.title}</div><div class="quest-desc">${q.desc}</div><div class="quest-bar"><div style="width:${Math.min(100, statCounter(q.key) / q.target * 100)}%"></div></div><div class="quest-foot"><span>${fmt(Math.min(q.target, statCounter(q.key)))} / ${fmt(q.target)} · 보상 ${fmt(q.gold)} G</span>${statCounter(q.key) >= q.target ? '<button class="quest-claim" data-action="claimQuest">보상 받기</button>' : '<span>진행 중</span>'}</div>` : `<div class="quest-strap">✦ 모든 지령 완료</div><p class="quest-desc">당신은 최고의 탐사 지휘관입니다.</p>`;
      $('quickQuest').dataset.signature = questSignature;
    }
    if (pendingVisualDamage) paintPendingDamage();
  }
  function renderChapters() {
    chapterBrowserIndex = clamp(chapterBrowserIndex, 0, CHAPTERS.length - 1);
    const selected = CHAPTERS[chapterBrowserIndex], ch = chapterBrowserIndex;
    const finished = Math.max(0, Math.min(MISSIONS_PER_CHAPTER, s.progress - ch * MISSIONS_PER_CHAPTER));
    const reached = ch <= unlockedChapter();
    const totalFinished = Math.min(CHAPTERS.length * MISSIONS_PER_CHAPTER, s.progress);
    const chapterButtons = CHAPTERS.map((item, index) => {
      const cleared = s.progress >= (index + 1) * MISSIONS_PER_CHAPTER;
      const opened = index <= unlockedChapter();
      return `<button type="button" class="chapter-pick ${chapterBrowserIndex === index ? 'selected' : ''} ${cleared ? 'cleared' : ''}" data-browse-chapter="${index}" aria-pressed="${chapterBrowserIndex === index}"><span class="chapter-pick-icon">${opened ? item.scene : '🔒'}</span><span><small>CHAPTER ${String(index + 1).padStart(2, '0')} · ${ERAS[item.era].age}</small><strong>${item.name}</strong></span><em>${cleared ? '완료 ✓' : opened ? Math.max(0, s.progress - index * 10) + '/10' : '잠김'}</em></button>`;
    }).join('');
    const missionCards = selected.missions.map((story, index) => {
      const stage = ch * MISSIONS_PER_CHAPTER + index;
      const cleared = stage < s.progress;
      const playable = stage <= s.progress;
      const focused = stage === activeStage();
      const boss = index === MISSIONS_PER_CHAPTER - 1;
      return `<article class="chapter-mission-card ${boss ? 'boss' : ''} ${cleared ? 'cleared' : ''} ${focused ? 'focused' : ''} ${playable ? '' : 'locked'}"><div class="chapter-mission-top"><span class="chapter-mission-num">${boss ? '♛ BOSS' : String(index + 1).padStart(2, '0')}</span><span class="chapter-mission-state">${focused ? '● 선택 중' : cleared ? '✓ 클리어' : playable ? '● 도전 가능' : '🔒 미해금'}</span></div><h3>${story[0]}</h3><small>${boss ? '챕터 최종 보스전' : MISSION_TYPES[index].type + ' · ' + MISSION_TYPES[index].tag}</small><p>${playable ? story[1] : '이전 미션을 클리어하면 스토리가 공개됩니다.'}</p><button type="button" data-select-mission="${stage}" ${playable ? '' : 'disabled'}>${focused ? '전투 화면으로 →' : cleared ? '↻ 재도전 · 보상 25%' : '⚔ 미션 선택 →'}</button></article>`;
    }).join('');
    $('secondaryView').innerHTML = `<section class="chapter-browser secondary"><div class="chapter-browser-summary"><div><span class="section-label">EXPEDITION MAP / 문명의 연대기</span><h2>챕터 · 미션 선택</h2><p>원시 시대부터 우주 개척까지 · 14개 챕터 · 140개 미션</p></div><strong>${totalFinished}<small> / 140 완료</small></strong></div><div class="chapter-browser-layout"><nav class="chapter-picker" aria-label="챕터 목록">${chapterButtons}</nav><div class="chapter-browser-detail"><div class="chapter-detail-hero"><span class="chapter-detail-scene">${selected.scene}</span><div><small>CHAPTER ${String(ch + 1).padStart(2, '0')} · ${selected.period}</small><h2>${selected.name}</h2><p>${reached ? selected.prologue : '아직 도달하지 못한 시대입니다. 이전 챕터의 보스를 클리어하면 해금됩니다.'}</p><span class="chapter-detail-progress">${finished} / 10 미션 클리어 · ${finished === 10 ? '챕터 완료 ✓' : reached ? '진행 중' : '미개척'}</span></div></div><div class="chapter-browser-guide">${reached ? '⚔ 해금한 미션을 선택하면 전투 화면으로 이동합니다. 첫 입장 공격 시 스태미너가 소모됩니다.' : '🔒 이전 챕터의 보스전을 클리어하면 이 챕터를 플레이할 수 있습니다.'}<br>↻ 재도전은 금화·경험치 25%와 마력 1만 획득하며 보스 전용 유물·장비·열쇠는 중복 지급되지 않습니다.</div><div class="chapter-mission-grid">${missionCards}</div></div></div></section>`;
  }
  function renderShop() {
    const hitsPerSecond = (attack() + dps()) * armorReduction();
    const seconds = Math.ceil(missionMax() / Math.max(1, hitsPerSecond));
    const stage = seconds <= 45 ? '쾌속 돌파 가능' : seconds <= 100 ? '적정 도전 · 강화로 단축' : '공격력 또는 동료 강화 권장';
    const category = SHOP_CATEGORIES.find(group => group.id === shopCategory) || SHOP_CATEGORIES[0];
    const staminaSummary = `<div class="stamina-shop-summary"><div><small>⚡ 보유 스태미너</small><strong>${fmt(s.stamina)} / ${fmt(maxStamina())}</strong><span>레벨마다 최대 +${STAMINA.perLevel}</span></div><div><small>🌿 자연 회복</small><strong>+${regenAmount()} / ${regenInterval() / 1000}초</strong><span>보급 +${campAmount()}</span></div><div><small>🥾 미션 입장</small><strong>-${staminaCost()}</strong><span>효율 LV.${efficiencyLevel()} / 3</span></div></div>`;
    const staminaStat = item => item.id === 'staminaRecovery'
      ? '다음: +' + (regenAmount() + 1) + ' / ' + ((regenInterval() - STAMINA.regenFasterMs) / 1000) + '초 · 보급 +' + (campAmount() + STAMINA.supplyBonus)
      : item.id === 'staminaEfficiency' ? '다음: 입장 -' + Math.max(STAMINA.minMissionCost, staminaCost() - 1) : item.stat;
    const filters = SHOP_CATEGORIES.map(group => `<button type="button" class="shop-filter ${group.id === category.id ? 'active' : ''}" data-shop-filter="${group.id}" role="tab" aria-selected="${group.id === category.id}">${group.label}</button>`).join('');
    const cards = ITEMS.filter(item => category.items.includes(item.id)).map(item => {
      const level = Math.max(0, Math.floor(Number(s.items[item.id]) || 0));
      const maxed = item.maxLevel && level >= item.maxLevel;
      const affordable = s.gold >= itemCost(item);
      return `<article class="store-item ${item.id.startsWith('stamina') ? 'stamina-upgrade' : ''}"><div class="item-top"><div class="item-icon">${item.icon}</div><div><strong>${item.name}</strong><small>강화 단계 LV.${level}${item.maxLevel ? ' / ' + item.maxLevel : ''}</small></div></div><p>${item.desc}</p><div class="item-meta"><span>${maxed ? '최대 강화 완료' : staminaStat(item)}</span><strong>${maxed ? 'MAX' : '<span class="gold-icon" aria-label="금화">G</span> ' + fmt(itemCost(item))}</strong></div><button class="purchase-button" data-buy="${item.id}" ${maxed || !affordable ? 'disabled' : ''}>${maxed ? '최대 강화 완료' : affordable ? '강화하기' : '금화 부족'}</button></article>`;
    }).join('');
    $('secondaryView').innerHTML = `<div class="secondary"><div class="secondary-header shop-heading"><p>필요한 강화만 골라 구매하세요.</p><span class="section-count"><span class="gold-icon" aria-label="금화">G</span> ${fmt(s.gold)} 금화</span></div><div class="shop-filter-tabs" role="tablist" aria-label="상점 강화 분류">${filters}</div><div class="shop-category-hint"><span>${category.hint}</span><strong>${category.items.length}개 항목</strong></div>${['recommended','stamina'].includes(category.id) ? staminaSummary : ''}<div class="store-grid">${cards}</div><details class="shop-advanced"><summary>현재 작전 성장 가이드 · ${stage}</summary><p>공격 초당 1회 기준 예상 ${fmt(seconds)}초 · 승리 예상 금화 ${fmt(expectedGold())}G · XP ${fmt(missionXp())}<br>레벨마다 공격력 +2 / 체력 +10 / 최대 스태미너 +2 · 5레벨마다 공격력 +10%, 체력 +25</p></details></div>`;
  }
  function renderHelpers() {
    $('secondaryView').innerHTML = `<div class="secondary"><div class="secondary-header"><p>동료는 전투 중 자동으로 공격합니다. 합류 후에도 계속 강화할 수 있습니다.</p><span class="section-count">초당 자동 피해 ${fmt(dps())}</span></div><div class="helper-grid">${HELPERS.map(h => { const lv = s.helpers[h.id] || 0; const unlocked = s.level >= h.req; return `<article class="helper-card"><div class="helper-portrait">${h.icon}</div><div class="helper-name">${h.name} <small>LV.${lv}</small></div><div class="helper-role">${h.role} · ${unlocked ? '합류 가능' : 'LV.' + h.req + ' 해금'}</div><p>${h.desc}</p><div class="item-meta"><span>초당 피해 +${fmt(h.dps)}</span><strong><span class="gold-icon" aria-label="금화">G</span> ${fmt(helperCost(h))}</strong></div><button class="purchase-button" data-helper="${h.id}" ${!unlocked || s.gold < helperCost(h) ? 'disabled' : ''}>${!unlocked ? '레벨 ' + h.req + ' 필요' : s.gold < helperCost(h) ? '금화 부족' : lv ? '동료 강화' : '동료 영입'}</button></article>`; }).join('')}</div></div>`;
  }
  function renderQuests() {
    const q = quest();
    $('secondaryView').innerHTML = `<div class="secondary"><div class="secondary-header"><p>탐사 임무와 업적을 완료하고 보상을 받아 성장하세요.</p><button class="section-count purchase-button" style="width:auto" data-action="daily">${s.dailyClaim === today() ? '✓ 오늘의 출석 완료' : '🎁 일일 보상 받기'}</button></div><div class="panel" style="padding:19px;margin-bottom:20px"><div class="panel-head" style="padding:0 0 14px">📋 진행 중인 지령 <small>총 ${QUESTS.length}개</small></div>${q ? `<div class="quest-item" style="margin-top:12px"><div class="item-icon">📜</div><div><strong>${q.title}</strong><p>${q.desc} · ${fmt(statCounter(q.key))} / ${q.target}</p><div class="progress-stat"><div style="width:${Math.min(100, statCounter(q.key) / q.target * 100)}%"></div></div></div><button class="purchase-button" data-action="claimQuest" ${statCounter(q.key) < q.target ? 'disabled' : ''}><span class="gold-icon" aria-label="금화">G</span> ${fmt(q.gold)} 받기</button></div>` : `<p style="color:#a3b8c7;font-size:12px">현재 준비된 모든 지령을 완료했습니다.</p>`}</div><div class="secondary-header"><p>업적 도전</p><span class="section-count">${s.achievements.length} / ${ACHIEVEMENTS.length} 획득</span></div><div class="achievement-grid">${ACHIEVEMENTS.map(a => { const done = statCounter(a.key) >= a.target, claimed = s.achievements.includes(a.id); return `<article class="achievement-card ${done ? 'done' : ''} ${claimed ? 'claimed' : ''}"><div class="achieve-icon">${a.icon}</div><h3>${a.title}</h3><p>${a.desc}<br>${fmt(Math.min(statCounter(a.key), a.target))} / ${fmt(a.target)}</p><div class="item-meta"><span>${claimed ? '수령 완료' : done ? '달성!' : '도전 중'}</span><strong><span class="gold-icon" aria-label="금화">G</span> ${fmt(a.reward)}</strong></div><button class="purchase-button" data-achievement="${a.id}" ${!done || claimed ? 'disabled' : ''}>${claimed ? '수령 완료' : done ? '보상 수령' : '미달성'}</button></article>`; }).join('')}</div></div>`;
  }
  function renderArena() {
    const opponentPower = 50 + s.arenaWins * 55;
    const wait = Math.max(0, Math.ceil((s.arenaAt + 30_000 - Date.now()) / 1000));
    $('secondaryView').innerHTML = `<div class="secondary"><div class="secondary-header"><p>가상의 상대와 전투력을 겨뤄 단계별 보상을 획득합니다.</p><span class="section-count">현재 ${s.arenaWins}승</span></div><div class="arena-layout"><div class="arena-card arena-stage"><div class="modal-overline">SIMULATION ARENA / RANK ${s.arenaWins + 1}</div><span class="arena-opponent">${['🦹','🤺','👹','🐲'][s.arenaWins % 4]}</span><strong>${['그림자 검사','황혼의 결투자','폐허의 집행자','심연의 용기사'][s.arenaWins % 4]}</strong><small>적 예상 전투력 ${fmt(opponentPower)}</small></div><div class="arena-card arena-info"><h3>⚔️ 모의 투기장</h3><p>나의 전투력: <b style="color:var(--primary)">${fmt(power())}</b><br>적의 전투력: <b>${fmt(opponentPower)}</b><br>참가 조건: 레벨 3 이상<br>승리 보상: 금화, 마력<br>경기 간 대기 시간: 30초</p><button class="purchase-button" data-action="arenaFight" ${s.level < 3 || wait ? 'disabled' : ''}>${s.level < 3 ? '레벨 3에 해금' : wait ? wait + '초 대기 중' : '전투 시작'}</button></div></div><div class="notice-box">이 모드는 현재 NPC와 벌이는 싱글플레이 모의전입니다. 실시간 다른 유저와 대결하는 멀티플레이 아레나는 추후 서버 연동이 필요합니다.</div></div>`;
  }
  function renderCodex() {
    const unlocked = Math.max(0, Math.min(MISSIONS_PER_CHAPTER, s.progress - chapterIndex() * MISSIONS_PER_CHAPTER + (s.awaitingNext && !isReplay() ? 1 : 0)));
    $('secondaryView').innerHTML = `<div class="secondary"><div class="secondary-header"><p>${era().age} · ${chapterTitle()}에 등장하는 적과 사건 기록입니다.</p><span class="section-count">${unlocked}/${MISSIONS_PER_CHAPTER}개 기록</span></div><div class="codex-grid">${MISSION_TYPES.map((m, i) => { const known = unlocked >= i + 1, story = chapter().missions[i]; return `<article class="codex-card ${known ? '' : 'locked'}"><div class="codex-sprite">${known ? era().emoji[[0,1,2,3,4,5,3,1,4,6][i]] : '❔'}</div><h3>${known ? story[0] : '미발견 미션'}</h3><small>${known ? m.tag + ' / 기록 완료' : '스토리 해금 전'}</small><p>${known ? story[2] : '해당 작전을 클리어하면 결말이 공개됩니다.'}</p></article>`; }).join('')}</div><div class="section-label">문명 연대기 · ${CHAPTERS.length}개 챕터</div><div class="era-chronicle">${CHAPTERS.map((ch,i) => `<article class="chronicle-era ${i <= unlockedChapter() ? 'reached' : ''}"><span>${ch.scene}</span><strong>CH.${i+1} ${ch.name}</strong><small>${ERAS[ch.era].age} · ${ch.period}</small><button class="tiny-btn" data-chapter-story="${i}" ${i > unlockedChapter() ? 'disabled' : ''}>${i > unlockedChapter() ? '미개척' : '이야기 보기'}</button></article>`).join('')}</div></div>`;
  }
  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const SLOT_LABEL = { weapon: '무기 · 공격력', armor: '방어구 · 최대 체력', relic: '유물 · 금화 보너스' };
  const CONSUMABLES = [
    { id: 'bomb', icon: '💣', name: '폭발탄', desc: '현재 적에게 강력한 즉시 피해', cost: 300 },
    { id: 'potion', icon: '🧪', name: '치유 물약', desc: '최대 체력의 65% 즉시 회복', cost: 180 },
    { id: 'elixir', icon: '🍯', name: '황금 비약', desc: '10분간 금화 획득 +100%', cost: 900 }
  ];
  function renderInventory() {
    const slots = ['weapon', 'armor', 'relic'];
    const chestNames = [{ id:'bronze', name:'낡은 보급상자', icon:'📦', rarity:'일반~전설' },{ id:'silver', name:'정예 보급상자', icon:'🗝️', rarity:'희귀 확률 증가' },{ id:'gold', name:'전설 보급상자', icon:'🎁', rarity:'고급 등급 보장 가능' }];
    const equipped = slots.map(slot => { const gear = equippedGear(slot); return `<article class="craft-slot"><div class="craft-slot-head">${SLOT_LABEL[slot]}</div><div class="craft-slot-icon">${gear ? escapeHtml(gear.icon) : '◇'}</div><strong>${gear ? escapeHtml(gear.name) + ' +' + gear.upgrade : '장착 장비 없음'}</strong><small>${gear ? gear.rank + ' / +' + gear.value : '아래 보관함에서 장착하세요'}</small></article>`; }).join('');
    const gear = s.inventory.slice().reverse().map(item => { const eq = s.equipped[item.slot] === item.id, max = item.upgrade >= 10;
      const cost = Math.floor((item.value + 10) * 12 * Math.pow(1.5, item.upgrade)); const essence = 2 + item.upgrade * 3;
      return `<article class="gear-row ${escapeHtml(item.rarity)}"><span class="gear-avatar">${escapeHtml(item.icon)}</span><div class="gear-detail"><strong>${escapeHtml(item.name)} ${item.upgrade ? '+' + item.upgrade : ''}</strong><small>${escapeHtml(item.rank)} · ${SLOT_LABEL[item.slot]} +${fmt(item.value)} ${eq ? '· 장착 중' : ''}</small></div><div class="gear-actions"><button class="tiny-btn" data-gear-equip="${escapeHtml(item.id)}" ${eq ? 'disabled' : ''}>${eq ? '장착 중' : '장착'}</button><button class="tiny-btn" data-gear-forge="${escapeHtml(item.id)}" ${max || s.gold < cost || s.essence < essence ? 'disabled' : ''}>${max ? 'MAX' : '제련 ' + fmt(cost) + 'G / ' + essence + 'M'}</button><button class="tiny-btn danger" data-gear-sell="${escapeHtml(item.id)}" ${eq ? 'disabled' : ''}>판매</button></div></article>`;
    }).join('');
    $('secondaryView').innerHTML = `<div class="secondary"><div class="secondary-header"><p>전투 중 장비를 획득하고 장착·제련해 강해집니다. 장착한 장비는 프레스티지 후에도 유지됩니다.</p><span class="section-count">보관함 ${s.inventory.length} / 200</span></div><div class="section-label">현재 장착 장비</div><div class="craft-grid">${equipped}</div><div class="section-label">열쇠와 보급상자</div><div class="craft-grid">${chestNames.map(c => `<article class="craft-slot"><div class="craft-slot-icon">${c.icon}</div><strong>${c.name}</strong><small>${c.rarity}</small><p>열쇠 ${fmt(s.keys[c.id] || 0)}개 보유</p><button class="purchase-button" data-chest="${c.id}" ${!s.keys[c.id] ? 'disabled' : ''}>상자 열기</button></article>`).join('')}</div><div class="section-label">전투 소모품</div><div class="craft-grid">${CONSUMABLES.map(c => `<article class="craft-slot"><div class="craft-slot-icon">${c.icon}</div><strong>${c.name}</strong><small>${c.desc}</small><p>보유 ${s.consumables[c.id] || 0}개</p><div class="craft-actions"><button class="purchase-button" data-consumable-buy="${c.id}" ${s.gold < c.cost ? 'disabled' : ''}>구매 ${fmt(c.cost)}G</button><button class="purchase-button secondary-buy" data-consumable-use="${c.id}" ${!s.consumables[c.id] ? 'disabled' : ''}>사용</button></div></article>`).join('')}</div><div class="section-label">장비 보관함</div><div class="gear-list">${gear || '<div class="empty-slot">보관 중인 장비가 없습니다. 임무를 완료하거나 보급상자를 열어보세요.</div>'}</div></div>`;
  }
  function renderModules() {
    const autoCost = Math.floor(750 * Math.pow(1.95, s.autoclickers));
    $('secondaryView').innerHTML = `<div class="secondary"><div class="secondary-header"><p>마력과 유물을 소비해 장기 연구를 진행합니다. 연구 성과는 프레스티지 후에도 이어집니다.</p><span class="section-count">🔮 ${fmt(s.essence)} 마력 · 💎 ${fmt(s.shards)} 유물</span></div><div class="section-label">영구 연구 모듈 · 6종</div><div class="store-grid">${MODULES.map(m => { const lv = moduleLevel(m.id), cost = Math.floor(m.cost * Math.pow(1.6, lv)), shards = lv >= 3 ? 1 + Math.floor((lv - 3) / 3) : 0; return `<article class="store-item"><div class="item-top"><div class="item-icon">${m.icon}</div><div><strong>${m.name}</strong><small>연구 레벨 LV.${lv}</small></div></div><p>${m.desc}</p><div class="item-meta"><span>해금 LV.${m.req}</span><strong>🔮 ${fmt(cost)}${shards ? ' · 💎 ' + shards : ''}</strong></div><button class="purchase-button" data-module="${m.id}" ${s.level < m.req || s.essence < cost || s.shards < shards ? 'disabled' : ''}>${s.level < m.req ? 'LV.' + m.req + ' 필요' : s.essence < cost || s.shards < shards ? '재화 부족' : '연구 강화'}</button></article>`; }).join('')}</div><div class="section-label">후반 자동화</div><div class="feature-card"><div class="feature-icon">⏱️</div><div><h3>오토클리커 · ${s.autoclickers}기 운영 중</h3><p>공격력의 40%를 장치 하나당 초당 자동 공격으로 변환합니다. 자동 장치는 프레스티지 시 초기화됩니다.</p><strong>현재 자동화 초당 +${fmt(s.autoclickers * attack() * .4)} 피해</strong></div><button class="purchase-button" data-action="buyAutoClicker" ${s.level < 6 || s.gold < autoCost ? 'disabled' : ''}>${s.level < 6 ? 'LV.6 해금' : '설치 ' + fmt(autoCost) + 'G'}</button></div></div>`;
  }
  function renderExpedition() {
    const count = dailyEvent();
    const remaining = s.caravan ? Math.max(0, Math.ceil((s.caravan.finish - Date.now()) / 1000)) : 0;
    const op = s.specialMission;
    const cooldown = Math.max(0, Math.ceil((s.specialAt - Date.now()) / 1000));
    $('secondaryView').innerHTML = `<div class="secondary"><div class="secondary-header"><p>전투 외 파견, 시간제 정예 토벌, 일일 목표를 수행해 추가 재화를 획득합니다.</p><span class="section-count">파견 ${s.caravanCount}회 · 정예 승리 ${s.specialWins}회</span></div><div class="section-label">탐사 캐러밴</div>${s.caravan ? `<div class="feature-card"><div class="feature-icon">🐪</div><div><h3>${CARAVANS[s.caravan.index]?.name || '파견 중'} · ${remaining ? '이동 중' : '귀환 완료'}</h3><p>${remaining ? '남은 시간 ' + Math.floor(remaining / 60) + '분 ' + remaining % 60 + '초' : '보급대가 물자를 가져왔습니다.'}</p></div><button class="purchase-button" data-action="claimCaravan" ${remaining ? 'disabled' : ''}>${remaining ? '파견 진행 중' : '보상 수령'}</button></div>` : `<div class="craft-grid">${CARAVANS.map((c,i) => `<article class="craft-slot"><div class="craft-slot-icon">${c.icon}</div><strong>${c.name}</strong><small>${Math.floor(c.duration / 60_000)}분 ${Math.floor(c.duration % 60_000 / 1000)}초 소요 · LV.${c.req} 해금</small><p>금화 ${fmt(c.gold)} / 마력 ${c.essence} 기대</p><button class="purchase-button" data-caravan="${i}" ${s.level < c.req || s.gold < c.cost ? 'disabled' : ''}>${s.level < c.req ? '레벨 부족' : '파견 ' + fmt(c.cost) + 'G'}</button></article>`).join('')}</div>`}<div class="section-label">한정 정예 토벌 · 제한 75초</div><div class="feature-card special-card"><div class="feature-icon">👹</div><div><h3>${op ? '진행 중: 심연의 침입자' : '심연의 침입자 토벌'}</h3><p>${op ? '남은 체력 ' + fmt(op.hp) + ' / ' + fmt(op.max) + ' · ' + Math.max(0, Math.ceil((op.finish-Date.now())/1000)) + '초 남음' : '강화한 공격력과 자동 DPS로 정예 적을 처치하세요. 승리 시 금열쇠와 고급 장비를 지급합니다.'}</p>${op ? `<div class="progress-stat"><div style="width:${Math.max(0,op.hp/op.max*100)}%"></div></div>` : '<small>레벨 8 해금 · 승리 후 2분 재정비</small>'}</div><button class="purchase-button" data-action="${op ? 'strikeSpecial' : 'startSpecial'}" ${(!op && (s.level < 8 || cooldown)) ? 'disabled' : ''}>${op ? '⚔ 정예 공격' : cooldown ? cooldown + '초 후 재개' : s.level < 8 ? 'LV.8 해금' : '특수 작전 시작'}</button></div><div class="section-label">오늘의 탐사 의뢰</div><div class="feature-card"><div class="feature-icon">🌟</div><div><h3>오늘 적 5회 처치 · ${Math.min(5,count)} / 5</h3><p>오늘 완료한 임무로 목표를 채우세요. 보상: 금화, 마력 30, 은열쇠 1개.</p><div class="progress-stat"><div style="width:${Math.min(100,count/5*100)}%"></div></div></div><button class="purchase-button" data-action="claimEvent" ${count < 5 || s.eventClaimed ? 'disabled' : ''}>${s.eventClaimed ? '오늘 완료' : count < 5 ? '진행 중' : '보상 수령'}</button></div></div>`;
  }
  function renderPrestige() {
    const gain = prestigeGain();
    const nextGold = 500 + Math.min(4000, (s.prestige.count + 1) * 300) + perk('wealth') * 150;
    $('secondaryView').innerHTML = `<div class="secondary"><div class="secondary-header"><p>첫 챕터 10개 미션을 완수하면 프레스티지가 해금됩니다. 연구 기술·장비·영구 특성은 유지됩니다.</p><span class="section-count">♛ ${s.prestige.count}회 환생 · ${fmt(s.prestige.points)} P 보유</span></div><div class="prestige-hero"><div class="prestige-emblem">♛</div><div><div class="modal-overline">LEGACY ASCENSION</div><h2>프레스티지 · 새로운 역사의 시작</h2><p>현재 미션 ${fmt(s.progress + 1)} / 레벨 ${fmt(s.level)} 기준</p><strong>+${fmt(gain)} P</strong><p>챕터당 1P · 3챕터마다 1P 추가 · 레벨 15마다 1P 추가</p><p>승급 후 시작 금화 ${fmt(nextGold)}G · 회차 공격 보너스 ${Math.round(.06 * Math.sqrt(s.prestige.count + 1) * 100)}%</p></div><button class="purchase-button" data-action="confirmPrestige" ${s.progress < MISSIONS_PER_CHAPTER || gain < 1 || s.specialMission ? 'disabled' : ''}>${s.specialMission ? '특수 작전 완료 후 승급' : s.progress < MISSIONS_PER_CHAPTER ? '첫 챕터 완료 후 개방' : '회차 승급'}</button></div><div class="section-label">명예 포인트 영구 강화</div><div class="craft-grid prestige-perks">${PRESTIGE_PERKS.map(p => `<article class="craft-slot"><div class="craft-slot-icon">${p.icon}</div><strong>${p.name}</strong><small>${p.desc}</small><p>현재 단계 LV.${perk(p.id)}</p><button class="purchase-button" data-prestige-perk="${p.id}" ${s.prestige.points < 1 ? 'disabled' : ''}>1 P 사용</button></article>`).join('')}</div><div class="notice-box">계승: 장비 및 장착 정보, 연구 모듈·완료된 기술·진행 중인 연구, 유물·열쇠, 캐러밴, 영구 특성, 업적과 누적 통계.<br>초기화: 레벨·경험치·금화·마력·스태미너(기본값으로 회복)·일반 강화·동료·오토클리커·소모품·작전 진행도.<br>지령은 회차별로 새로 시작하고 업적은 평생 기록을 유지합니다.</div></div>`;
  }
  const tutorialMetric = step => step.metric ? Number(s[step.metric] || 0) : 0;
  let tutorialCollapsed = false;
  function startTutorial() {
    if (s.awaitingNext) {
      openModal('victory', victoryContent(s.lastVictory));
      return;
    }
    if (s.battleOver) retry();
    closeModal();
    s.tutorial.active = true;
    s.tutorial.step = 0;
    s.tutorial.baseline = tutorialMetric(TUTORIAL_STEPS[0]);
    tutorialCollapsed = false;
    persist(); navigate('battle');
    focusTutorialTarget();
  }
  function finishTutorial(skipped = false) {
    if (!s.tutorial.active) return;
    s.tutorial.active = false; s.tutorial.version = TUTORIAL_VERSION;
    if (!skipped && !s.tutorial.rewardClaimed) {
      s.gold += 300; s.essence += 10; s.tutorial.rewardClaimed = true;
      toast('튜토리얼 완료! 금화 +300 · 마력 +10', true);
    } else if (skipped) toast('튜토리얼을 건너뛰었습니다. 도움말에서 다시 시작할 수 있어요.');
    persist(); render();
  }
  function nextTutorialStep() {
    if (!s.tutorial.active) return;
    const index = clamp(Math.floor(Number(s.tutorial.step) || 0), 0, TUTORIAL_STEPS.length - 1);
    if (index >= TUTORIAL_STEPS.length - 1) { finishTutorial(); return; }
    s.tutorial.step = index + 1;
    s.tutorial.baseline = tutorialMetric(TUTORIAL_STEPS[index + 1]);
    tutorialCollapsed = false;
    persist(); navigate(TUTORIAL_STEPS[index + 1].tab);
    focusTutorialTarget();
  }
  function focusTutorialTarget() {
    if (!s.tutorial.active) return;
    const step = TUTORIAL_STEPS[s.tutorial.step];
    if (step && step.tab !== activeTab) navigate(step.tab);
    const target = step ? document.querySelector(step.target) : null;
    if (target && typeof target.scrollIntoView === 'function') target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function renderTutorial() {
    const root = $('tutorialRoot'); if (!root) return;
    document.querySelectorAll('.tutorial-highlight').forEach(node => node.classList.remove('tutorial-highlight'));
    if (!s.tutorial.active || modal) { root.classList.add('hidden'); if (!s.tutorial.active) root.innerHTML = ''; return; }
    const index = clamp(Math.floor(Number(s.tutorial.step) || 0), 0, TUTORIAL_STEPS.length - 1);
    const step = TUTORIAL_STEPS[index];
    const progress = Math.min(step.count, Math.max(0, tutorialMetric(step) - Number(s.tutorial.baseline || 0)));
    const completed = progress >= step.count;
    if (!modal && activeTab === step.tab) document.querySelector(step.target)?.classList.add('tutorial-highlight');
    root.classList.remove('hidden');
    if (tutorialCollapsed) {
      root.innerHTML = `<div class="tutorial-mini"><span>${step.icon} 튜토리얼 ${index + 1}/${TUTORIAL_STEPS.length}</span><button data-action="tutorialToggle">이어하기 ↑</button></div>`;
      return;
    }
    const status = step.count ? `<div class="tutorial-goal ${completed ? 'complete' : ''}"><span>${completed ? '✓ 목표 달성!' : '◉ ' + step.progressLabel + ' ' + progress + ' / ' + step.count}</span><span>${completed ? '다음 단계로 이동할 수 있어요' : '게임 화면에서 직접 해보세요'}</span></div>` : '<div class="tutorial-goal complete">✓ 여기까지 배우면 기본 준비 완료!</div>';
    root.innerHTML = `<section class="tutorial-card" role="region" aria-label="게임 튜토리얼"><div class="tutorial-topline"><span>FIELD MANUAL / STEP ${index + 1} OF ${TUTORIAL_STEPS.length}</span><button data-action="tutorialToggle" aria-label="튜토리얼 접기">—</button></div><div class="tutorial-track">${TUTORIAL_STEPS.map((_, i) => `<i class="${i <= index ? 'filled' : ''}"></i>`).join('')}</div><h3><span>${step.icon}</span> ${step.title}</h3><p>${step.text}</p>${status}<div class="tutorial-controls"><button class="tutorial-quiet" data-action="tutorialStop">전체 건너뛰기</button><button class="tutorial-move" data-action="tutorialGo">${activeTab === step.tab ? '목표 위치 보기' : '해당 화면으로 이동'}</button><button class="tutorial-primary" data-action="tutorialStep">${index === TUTORIAL_STEPS.length - 1 ? '완료하기' : completed ? '다음 단계 →' : '이 단계 넘기기 →'}</button></div></section>`;
  }
  // Frequent server replies only update live combat and numeric displays.
  // Sidebar, navigation, story and shop DOM are left untouched until needed.
  function renderFastCombat() {
    $('goldTop').textContent = fmt(s.gold);
    $('essenceTop').textContent = fmt(s.essence);
    $('shardsTop').textContent = fmt(s.shards);
    $('staminaTop').textContent = staminaLabel();
    $('xpMini').textContent = fmt(s.xp) + ' / ' + fmt(xpGoal(s.level));
    $('levelFill').style.width = clamp(s.xp / xpGoal(s.level) * 100, 0, 100) + '%';
    if (activeTab === 'battle') renderBattle();
  }
  function render() {
    document.body.dataset.theme = s.theme;
    document.body.dataset.era = eraIndex();
    $('brandName').innerHTML = theme().logo;
    $('retroBrand').innerHTML = theme().logo;
    document.querySelector('.expedition-tip p').textContent = era().story;
    $('goldTop').textContent = fmt(s.gold); $('essenceTop').textContent = fmt(s.essence); $('shardsTop').textContent = fmt(s.shards);
    $('staminaTop').textContent = staminaLabel();
    $('sideLevel').textContent = fmt(s.level); $('rankText').textContent = s.level >= 20 ? '전설' : s.level >= 10 ? '정예' : s.level >= 5 ? '숙련' : '견습';
    $('levelFill').style.width = clamp(s.xp / xpGoal(s.level) * 100, 0, 100) + '%';
    $('xpMini').textContent = fmt(s.xp) + ' / ' + fmt(xpGoal(s.level));
    for (const el of document.querySelectorAll('[data-nav]')) el.classList.toggle('selected', el.dataset.nav === activeTab);
    $('moreNav').classList.toggle('hidden', !moreNavExpanded);
    $('moreNavToggle').setAttribute('aria-expanded', String(moreNavExpanded));
    $('moreNavToggle').classList.toggle('selected', ['inventory','quests','arena','expedition','prestige','codex'].includes(activeTab));
    $('battleView').classList.toggle('hidden', activeTab !== 'battle'); $('secondaryView').classList.toggle('hidden', activeTab === 'battle');
    if (activeTab === 'battle') renderBattle();
    else {
      const titles = { chapters: ['챕터 · 미션 선택', 'CHAPTERS / MISSION SELECT'], shop: ['상점 · 장비 강화', 'SHOP / UPGRADES'], helpers: ['동료 관리', 'EXPEDITION / CREW'], inventory: ['장비와 보급상자', 'INVENTORY / LOOT'], modules: ['기술 연구소', 'TECHNOLOGY / CHRONICLE'], quests: ['임무와 업적', 'MISSIONS / ACHIEVEMENTS'], arena: ['모의 투기장', 'ARENA / SIMULATION'], expedition: ['특수 작전과 파견', 'SPECIAL / CARAVANS'], prestige: ['프레스티지 계승', 'ASCENSION / LEGACY'], codex: ['탐사 도감', 'ARCHIVE / DISCOVERIES'], leaderboard: ['전투력 리더보드', 'GLOBAL / HALL OF EXPLORERS'] };
      const [title, eyebrow] = titles[activeTab];
      $('pageEyebrow').textContent = eyebrow; $('pageTitle').textContent = title;
      $('pageSubtitle').textContent = activeTab === 'chapters' ? '해금한 미션을 자유롭게 선택하고 챕터 최종 보스에 도전하세요.' : activeTab === 'shop' ? '금화로 전투력과 스태미너를 강화하세요.' : activeTab === 'leaderboard' ? '최고 전투력을 겨루는 탐사자들의 기록입니다.' : '탐사단을 성장시켜 더 강한 적과 새로운 지역에 도전하세요.';
      $('missionBadge').innerHTML = 'LV. ' + s.level + ' <span>● 활동 중</span>';
      if (activeTab === 'leaderboard') {
        if (window.ERA_ACCOUNT_UI) window.ERA_ACCOUNT_UI.renderLeaderboard($('secondaryView'));
        else $('secondaryView').innerHTML = '<div class="secondary"><p>리더보드 연결 중…</p></div>';
      } else ({ chapters: renderChapters, shop: renderShop, helpers: renderHelpers, inventory: renderInventory, modules: renderModules, quests: renderQuests, arena: renderArena, expedition: renderExpedition, prestige: renderPrestige, codex: renderCodex })[activeTab]();
      if (activeTab === 'modules') $('secondaryView').innerHTML = $('secondaryView').innerHTML.replace('<div class="section-label">영구 연구 모듈', technologyMarkup() + '<div class="section-label">영구 연구 모듈');
    }
    renderTutorial();
  }
  function navigate(tab) { if (!['battle','chapters','shop','helpers','inventory','modules','quests','arena','expedition','prestige','codex','leaderboard'].includes(tab)) return; if (tab === 'chapters' && activeTab !== 'chapters') chapterBrowserIndex = Math.min(CHAPTERS.length - 1, chapterIndex()); activeTab = tab; moreNavExpanded = ['inventory','quests','arena','expedition','prestige','codex'].includes(tab); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function openModal(id, content) { modal = id; $('modalRoot').innerHTML = `<div class="modal-card ${id === 'victory' ? 'victory-modal' : ''}" role="dialog" aria-modal="true">${content}</div>`; $('modalRoot').classList.remove('hidden'); renderTutorial(); }
  function closeModal() { modal = ''; $('modalRoot').classList.add('hidden'); $('modalRoot').innerHTML = ''; renderTutorial(); }
  function eraStoryModal(index = eraIndex()) {
    const e = ERAS[clamp(index, 0, ERAS.length - 1)];
    const opened = index <= unlockedEraIndex();
    if (!opened) return;
    const finish = index < unlockedEraIndex() || (index === unlockedEraIndex() && missionIndex() === 9 && s.awaitingNext && !isReplay());
    openModal('story', `<span class="modal-crest">${e.scene}</span><div class="modal-overline">CHAPTER ${String(index + 1).padStart(2, '0')} / ${e.period}</div><h2>${e.age} · ${e.name}</h2><p>${e.story}</p><div class="story-weapon">${e.weapon.icon} 이 시대의 무기: <strong>${e.weapon.name}</strong> · ${e.weapon.action}</div>${finish ? `<p class="story-epilogue">${e.ending}</p>` : ''}<div class="modal-actions"><button data-action="close">${index === eraIndex() ? '이 시대 개척하기' : '연대기로 돌아가기'}</button></div>`);
  }
  function chapterStoryModal(index = chapterIndex()) {
    if (index > unlockedChapter() || index < 0 || index >= CHAPTERS.length) return;
    const ch = CHAPTERS[index], unlocked = s.progress >= (index + 1) * MISSIONS_PER_CHAPTER || (index === unlockedChapter() && s.awaitingNext && missionIndex() === 9 && !isReplay());
    openModal('story', `<span class="modal-crest">${ch.scene}</span><div class="modal-overline">CHAPTER ${String(index+1).padStart(2,'0')} / ${ch.period} · ${ERAS[ch.era].age}</div><h2>${ch.name}</h2><p class="story-intro">${ch.prologue}</p><div class="story-weapon">${ch.weapon.icon} 이번 챕터의 무기: <strong>${ch.weapon.name}</strong> · ${ch.weapon.action}</div>${unlocked ? `<p class="story-epilogue">${ch.epilogue}</p>` : ''}<div class="modal-actions"><button data-action="close">${index === chapterIndex() ? '챕터 진행하기' : '연대기로 돌아가기'}</button></div>`);
  }
  function missionStoryModal() {
    const story = missionStory();
    openModal('story', `<span class="modal-crest">📜</span><div class="modal-overline">CH.${String(chapterIndex()+1).padStart(2,'0')} / MISSION ${String(missionIndex()+1).padStart(2,'0')} OF ${MISSIONS_PER_CHAPTER}</div><h2>${story[0]}</h2><p class="story-intro">${chapter().prologue}</p><div class="story-incident"><strong>이번 사건</strong><p>${story[1]}</p></div>${s.awaitingNext ? `<div class="story-epilogue"><strong>결말</strong><p>${story[2]}</p></div>` : `<div class="story-locked">🔒 결말은 미션을 완료하면 공개됩니다.</div>`}<div class="modal-actions"><button data-action="close">${s.awaitingNext ? '결과 확인' : '작전으로 돌아가기 · 스태미너 ' + staminaCost() + ' 소모'}</button></div>`);
  }
  function introModal() { openModal('intro', `<span class="modal-crest">🌄</span><div class="modal-overline">PROLOGUE / FROM STONE TO STARS</div><h2>돌에서 별까지</h2><p>우리는 아직 이름 없는 작은 부족입니다.<br>밤을 밝히는 것은 희미한 불씨 하나, 손에 쥔 것은 돌도끼 한 자루뿐.<br><br>불을 지키고, 도시를 세우고, 철과 증기를 발명하세요.<br>컴퓨터와 미래 기술을 넘어 인류를 별의 바다로 이끄세요.<br><br>7개 시대, 14개 챕터, 140개 미션에 이어지는 이야기가 기다립니다.</p><div class="modal-actions"><button data-action="begin">인류의 연대기 시작 🪓</button></div>`); }
  function settingsModal() { openModal('settings', `<span class="modal-overline">CHRONICLE SETTINGS</span><h2>문명 진화 연대기</h2><p>원시 시대에서 우주 개척까지 일곱 시대를 여행합니다. 시대마다 무기·적·스토리가 달라집니다.<br>최고 해금 <b>챕터 ${unlockedChapter()+1}</b> · 현재 플레이 <b>${era().age}</b></p><div class="theme-select">${ERAS.map((e,i) => `<button class="theme-option ${i === eraIndex() ? 'selected' : ''}" data-era-story="${i}" ${i > unlockedEraIndex() ? 'disabled' : ''}><span>${e.scene}</span><strong>${e.age}</strong></button>`).join('')}</div><div class="modal-actions"><button class="modal-secondary" data-action="help">게임 설명</button><button class="modal-secondary" data-action="restartTutorial">🎓 튜토리얼 시작</button><button data-action="close">닫기</button></div><div style="margin-top:25px;border-top:1px solid #425567;padding-top:14px"><button class="modal-secondary" data-action="confirmReset" style="background:transparent;border:0;color:#cb999c;font-size:11px">모든 진행 상황 초기화</button></div>`); }
  function testToolsModal() {
    const status = adminMode ? '🛠 관리자 테스트 모드' : '🔒 일반 플레이 모드';
    const modeButton = adminAvailable
      ? `<button class="modal-secondary" data-action="${adminMode ? 'exitAdmin' : 'enterAdmin'}">${adminMode ? '↩ 일반 모드로 돌아가기' : '🛠 관리자 모드 켜기 · 스태미너 ∞'}</button>`
      : '<p class="test-tools-note">관리자 모드는 사이트 소유자에게만 제공됩니다.</p>';
    openModal('testTools', `<span class="modal-crest">🧰</span><div class="modal-overline">TEST & ACCOUNT TOOLS</div><h2>테스트 관리</h2><p><b>${status}</b><br>${adminMode ? '실제 계정과 분리된 테스트 저장 데이터를 사용합니다. 랭킹에 반영되지 않습니다.' : '평소 게임 진행과 기록을 관리합니다.'}</p><div class="test-tools-actions">${modeButton}<button class="modal-secondary" data-action="confirmReset">${adminMode ? '🗑 테스트 진행 데이터 초기화' : '🗑 내 계정 진행 상황 초기화'}</button></div><p class="test-tools-note">${adminMode ? '일반 계정을 초기화하려면 먼저 일반 모드로 돌아가세요.' : '초기화는 레벨·재화·장비·미션과 리더보드 전투력에 적용됩니다.'}</p><div class="modal-actions"><button data-action="close">닫기</button></div>`);
  }
  async function switchAdminMode(enter) {
    if (!serverReady || !adminAvailable || serverBlocked) { toast('로그인된 서버에서 관리자 권한을 먼저 확인해 주세요.'); return; }
    if (serverActionsPending || serverSaving) { toast('진행 중인 서버 작업이 끝난 후 전환해 주세요.'); return; }
    closeModal(); saveStatus('◐ 모드 전환 준비 중');
    clearTimeout(saveTimer);
    if (serverDirty) await syncServer();
    if (serverDirty || serverBlocked || serverSaving) { toast('저장이 완료되지 않아 모드를 전환하지 않았습니다.'); return; }
    window.location.assign(enter ? '/play.html?mode=admin' : '/play.html');
  }
  function helpModal() { openModal('help', `<span class="modal-crest">📖</span><div class="modal-overline">HOW TO PLAY</div><h2>문명 개척 가이드</h2><p style="text-align:left">① <b>전투</b>에서 시대별 무기 버튼을 눌러 공격합니다. (Space)<br>② 미션 첫 공격에만 <b>스태미너</b>를 소모합니다. 기본 90초마다 1 회복, 재도전 시 입장 비용이 다시 발생합니다.<br>③ <b>상점 · 장비 강화</b>의 스태미너 분류에서 회복 체계와 행군 효율을 구매할 수 있습니다.<br>④ <b>야영 보급</b>은 금화로 스태미너를 보충하며 10분간 재사용 대기합니다.<br>⑤ 매 레벨업마다 최대 스태미너 +2, 공격력 +2, 최대 체력 +10이 적용됩니다.<br>⑥ 총 14챕터·140미션에 시작 사건과 클리어 후 결말이 있습니다.<br>⑦ <b>기술 연구</b>는 시간이 지나 완료되고, 프레스티지 후에도 유지됩니다.<br>⑧ 나머지 기능은 상단 <b>더보기</b>에서 찾을 수 있습니다. 상점의 일반 강화는 프레스티지 시 초기화됩니다.<br>⑨ 서버 저장에 연결되지 않으면 브라우저에 백업됩니다.</p><div class="modal-actions"><button class="modal-secondary" data-action="restartTutorial">🎓 직접 따라하기</button><button data-action="close">확인</button></div>`); }
  function resetConfirm() { openModal('reset', `<span class="modal-crest">⚠️</span><h2>${adminMode ? '테스트 데이터' : '내 계정'} 초기화</h2><p>${adminMode ? '관리자 테스트 저장 데이터만' : '일반 계정의 레벨, 재화, 장비, 미션과 리더보드 전투력까지'} 초기화됩니다.<br>복구할 수 없습니다. 정말 초기화할까요?</p><div class="modal-actions"><button class="modal-secondary" data-action="testTools">취소</button><button data-action="reset" style="background:#df878d">초기화 확인</button></div>`); }
  async function resetProgress() {
    if (serverActionsPending || serverSaving) { toast('진행 중인 서버 작업이 끝난 후 초기화해 주세요.'); return; }
    if (!serverReady) {
      if (adminMode) { toast('서버 권한을 확인할 때까지 테스트 데이터를 초기화할 수 없습니다.'); return; }
      const selectedTheme = s.theme; s = defaultState(); s.theme = selectedTheme;
      persist(); closeModal(); navigate('battle'); introModal();
      toast('로컬 진행 상황만 초기화했습니다. 서버 연결 후 기록을 다시 확인하세요.');
      return;
    }
    serverBlocked = true;
    clearTimeout(saveTimer);
    saveStatus('◐ 서버 초기화 중');
    try {
      for (let i = 0; serverSaving && i < 80; i++)
        await new Promise(resolve => setTimeout(resolve, 100));
      if (serverSaving) throw new Error('pending save');
      const response = await fetch(gameApiUrl(), {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision: serverRevision }), credentials: 'same-origin',
      });
      if (!response.ok) throw new Error('reset failed');
      const result = await response.json();
      s = mergeState(result.state); serverRevision = result.revision;
      serverDirty = false; serverBlocked = false;
      saveLocal(); closeModal(); navigate('battle'); introModal();
      saveStatus('🔒 초기화 · 서버 반영 완료');
      toast(adminMode ? '테스트 데이터를 초기화했습니다.' : '내 계정과 리더보드 전투력을 초기화했습니다.', true);
    } catch {
      serverBlocked = false;
      saveStatus('⚠ 서버 초기화 실패');
      toast('서버 초기화에 실패했습니다. 연결 상태를 확인하고 다시 시도하세요.');
    }
  }
  function changeTheme(key) { if (!THEMES[key]) return; s.theme = key; persist(); settingsModal(); render(); toast(THEMES[key].category + ' 세계관 적용'); }

  document.addEventListener('click', event => {
    if (serverReady && serverActionsPending && event.target.closest(
      '[data-buy],[data-helper],[data-gear-equip],[data-gear-sell],[data-gear-forge],' +
      '[data-consumable-buy],[data-module],[data-tech],[data-prestige-perk]')) {
      toast('서버 판정 처리 중입니다. 잠시 후 강화해 주세요.');
      return;
    }
    const nav = event.target.closest('[data-nav]'); if (nav) { navigate(nav.dataset.nav); return; }
    const browseChapter = event.target.closest('[data-browse-chapter]'); if (browseChapter) { const value = Number(browseChapter.dataset.browseChapter); if (Number.isSafeInteger(value) && value >= 0 && value < CHAPTERS.length) { chapterBrowserIndex = value; renderChapters(); } return; }
    const chooseMission = event.target.closest('[data-select-mission]'); if (chooseMission) { selectMission(Number(chooseMission.dataset.selectMission)); return; }
    const shopFilter = event.target.closest('[data-shop-filter]'); if (shopFilter) { if (SHOP_CATEGORIES.some(group => group.id === shopFilter.dataset.shopFilter)) { shopCategory = shopFilter.dataset.shopFilter; renderShop(); } return; }
    const buy = event.target.closest('[data-buy]'); if (buy) { buyItem(buy.dataset.buy); return; }
    const h = event.target.closest('[data-helper]'); if (h) { buyHelper(h.dataset.helper); return; }
    const a = event.target.closest('[data-achievement]'); if (a) { if (serverReady) serverAction('claimAchievement', a.dataset.achievement); else claimAchievement(a.dataset.achievement); return; }
    const equip = event.target.closest('[data-gear-equip]'); if (equip) { equipGear(equip.dataset.gearEquip); return; }
    const sell = event.target.closest('[data-gear-sell]'); if (sell) { sellGear(sell.dataset.gearSell); return; }
    const forge = event.target.closest('[data-gear-forge]'); if (forge) { forgeGear(forge.dataset.gearForge); return; }
    const chest = event.target.closest('[data-chest]'); if (chest) { if (serverReady) serverAction('openChest', chest.dataset.chest); else openChest(chest.dataset.chest); return; }
    const consumeBuy = event.target.closest('[data-consumable-buy]'); if (consumeBuy) { buyConsumable(consumeBuy.dataset.consumableBuy); return; }
    const consumeUse = event.target.closest('[data-consumable-use]'); if (consumeUse) { if (serverReady) serverAction(consumeUse.dataset.consumableUse); else useConsumable(consumeUse.dataset.consumableUse); return; }
    const moduleBtn = event.target.closest('[data-module]'); if (moduleBtn) { researchModule(moduleBtn.dataset.module); return; }
    const techBtn = event.target.closest('[data-tech]'); if (techBtn) { beginTechnology(techBtn.dataset.tech); return; }
    const eraBtn = event.target.closest('[data-era-story]'); if (eraBtn) { eraStoryModal(Number(eraBtn.dataset.eraStory)); return; }
    const chapterBtn = event.target.closest('[data-chapter-story]'); if (chapterBtn) { chapterStoryModal(Number(chapterBtn.dataset.chapterStory)); return; }
    const perkBtn = event.target.closest('[data-prestige-perk]'); if (perkBtn) { spendPrestige(perkBtn.dataset.prestigePerk); return; }
    const caravanBtn = event.target.closest('[data-caravan]'); if (caravanBtn) { if (serverReady) serverAction('launchCaravan', Number(caravanBtn.dataset.caravan)); else launchCaravan(Number(caravanBtn.dataset.caravan)); return; }
    const th = event.target.closest('[data-theme-pick]'); if (th) { changeTheme(th.dataset.themePick); return; }
    const btn = event.target.closest('[data-action]'); if (!btn) return;
    const authoritative = { attack:'attack', heal:'heal', gather:'gather', skill:'skill',
      next:'next', retry:'retry', claimQuest:'claimQuest', daily:'claimDaily',
      arenaFight:'arenaFight', campSupply:'campSupply', claimCaravan:'claimCaravan',
      startSpecial:'startSpecial', strikeSpecial:'strikeSpecial', claimEvent:'claimEvent',
      doPrestige:'doPrestige' };
    if (serverReady && authoritative[btn.dataset.action]) {
      serverAction(authoritative[btn.dataset.action]); return;
    }
    switch (btn.dataset.action) {
      case 'attack': actAttack(); break; case 'heal': actHeal(); break; case 'gather': actGather(); break; case 'skill': actSkill(); break;
      case 'confirmMissionSelect': if (pendingMissionTarget != null) selectMission(pendingMissionTarget, true); break;
      case 'next': advance(); break; case 'retry': retry(); break; case 'claimQuest': claimQuest(); break;
      case 'daily': claimDaily(); break; case 'arenaFight': arenaFight(); break;
      case 'campSupply': campSupply(); break; case 'missionStory': missionStoryModal(); break;
      case 'shopStamina': shopCategory = 'stamina'; navigate('shop'); break;
      case 'toggleMoreNav': moreNavExpanded = !moreNavExpanded; render(); break;
      case 'buyAutoClicker': buyAutoClicker(); break; case 'claimCaravan': claimCaravan(); break;
      case 'startSpecial': startSpecial(); break; case 'strikeSpecial': strikeSpecial(); break; case 'claimEvent': claimEvent(); break;
      case 'confirmPrestige': openModal('ascension', `<span class="modal-crest">♛</span><h2>새로운 탐사를 시작할까요?</h2><p>지금 프레스티지를 하면 명예 포인트 ${fmt(prestigeGain())}개를 얻습니다.<br>레벨, 재화, 일반 강화, 동료, 진행 중인 작전은 초기화됩니다.<br>장비, 모듈, 완료된 기술과 진행 중인 시간 연구, 영구 특성은 남습니다.</p><div class="modal-actions"><button class="modal-secondary" data-action="close">취소</button><button data-action="doPrestige">프레스티지 확정</button></div>`); break;
      case 'doPrestige': performPrestige(); break;
      case 'restartTutorial': startTutorial(); break;
      case 'tutorialStep': nextTutorialStep(); break;
      case 'tutorialStop': finishTutorial(true); break;
      case 'tutorialGo': tutorialCollapsed = false; focusTutorialTarget(); renderTutorial(); break;
      case 'tutorialToggle': tutorialCollapsed = !tutorialCollapsed; renderTutorial(); break;
      case 'help': helpModal(); break; case 'settings': settingsModal(); break; case 'testTools': testToolsModal(); break; case 'confirmReset': resetConfirm(); break;
      case 'enterAdmin': switchAdminMode(true); break; case 'exitAdmin': switchAdminMode(false); break;
      case 'chapterStory': chapterStoryModal(); break;
      case 'begin': s.seenIntro = true; persist(); closeModal(); startTutorial(); break;
      case 'close': closeModal(); if (s.awaitingNext) toast('다음 미션으로 진행하려면 완료 창을 확인하세요.'); break;
      case 'reset': resetProgress(); break;
      case 'focusMission': if (s.awaitingNext) toast('승리 창에서 다음 미션으로 이동하세요.'); break;
    }
  });
  document.addEventListener('keydown', e => {
    if (modal || e.target.matches('input,textarea,select')) return;
    if (e.code === 'Space' && activeTab === 'battle') { e.preventDefault(); if (serverReady) serverAction('attack'); else actAttack(); }
    if (e.code === 'KeyH' && activeTab === 'battle') { if (serverReady) serverAction('heal'); else actHeal(); }
    if (e.code === 'KeyG' && activeTab === 'battle') { if (serverReady) serverAction('gather'); else actGather(); }
    if (e.code === 'KeyQ' && activeTab === 'battle') { if (serverReady) serverAction('skill'); else actSkill(); }
  });
  // All local mutations already call persist(). Navigating away must not
  // invent a new dirty snapshot and trigger an unnecessary D1 write.
  window.addEventListener('beforeunload', saveLocal);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveLocal();
    else { lastRender = 0; lastServerTick = 0; }
  });
  setInterval(() => {
    const now = Date.now(), dt = clamp((now - lastTick) / 1000, 0, 2); lastTick = now;
    if (document.visibilityState === 'hidden') return;
    // Passive stamina regeneration is also computed by the server on the next
    // command; it does not need an extra write for every regeneration tick.
    if (refreshStamina(now) && now - lastStaminaBackup > 10_000) {
      saveLocal(); lastStaminaBackup = now;
    }
    if (finishTechnology()) render();
    if (!serverReady && !s.awaitingNext && !s.battleOver && s.seenIntro) {
      if (s.missionEntered && dps() > 0) { s.timerStarted = true; helperRemainder += dps() * armorReduction() * dt; if (helperRemainder >= 1) { const dealt = Math.floor(helperRemainder); helperRemainder -= dealt; takeDamage(dealt); } }
      if (s.missionEntered && s.timerStarted && [2,7].includes(missionIndex())) { timerRemainder += dt; if (timerRemainder >= .1) { s.timer = Math.max(0, s.timer - timerRemainder); timerRemainder = 0; if (s.timer === 0) failMission('제한 시간 내 목표를 제압하지 못했습니다.'); } }
      if (s.missionEntered && s.timerStarted && s.playerHp > 0) { enemyAttackRemainder += dt; const delay = missionIndex() === 9 && s.enemyHp / missionMax() <= .35 ? 1.85 : 2.5; if (enemyAttackRemainder >= delay) { enemyAttackRemainder = 0; s.playerHp = Math.max(0, s.playerHp - enemyHit()); if (s.playerHp === 0) failMission('탐사자의 체력이 모두 소진되었습니다.'); else if (activeTab === 'battle') renderFastCombat(); } }
    }
    if (!serverReady && s.specialMission && now >= s.specialMission.finish) { s.specialMission = null; s.specialAt = now + 45_000; toast('특수 작전 시간이 종료되었습니다.'); persist(); }
    if (serverReady && !serverBlocked && !serverActionsPending &&
      (s.missionEntered && !s.awaitingNext && !s.battleOver || s.specialMission) &&
      now - lastServerTick > 2200) {
      lastServerTick = now;
      serverAction('tick');
    }
    if (now - lastRender > (s.missionEntered ? 700 : 1000)) { $('staminaTop').textContent = staminaLabel(); if (activeTab === 'battle') { if (s.missionEntered) renderCombatLive(); else renderStaminaLive(); } if (activeTab === 'arena') renderArena(); if (activeTab === 'expedition') renderExpedition(); if (activeTab === 'modules' && s.researchQueue) { const time = Math.max(0, Math.ceil((s.researchQueue.finishAt - now) / 1000)), q = s.researchQueue; if ($('researchCountdown')) $('researchCountdown').textContent = Math.floor(time / 60) + '분 ' + time % 60 + '초 남음'; if ($('researchProgress')) $('researchProgress').style.width = clamp((now - q.startedAt) / Math.max(1, q.finishAt - q.startedAt) * 100, 0, 100) + '%'; } lastRender = now; }
  }, 250);

  window.ERA_GAME_BRIDGE = {
    snapshot: () => JSON.parse(JSON.stringify(s)),
  };
  finishTechnology();
  render();
  if (!s.seenIntro) introModal();
  else if (s.awaitingNext) openModal('victory', victoryContent(s.lastVictory));
  else if (s.battleOver) openModal('defeat', `<span class="modal-crest">🩸</span><div class="modal-overline">EXPEDITION FAILED</div><h2>작전 중단</h2><p>중단된 전투 기록을 불러왔습니다. 재도전하면 탐사자의 체력이 회복됩니다.</p><div class="modal-actions"><button data-action="retry">다시 도전하기</button></div>`);
  if (awayGold > 0) toast('오프라인 지원 보상: +' + fmt(awayGold) + ' 금화', true);
  initializeServer();
})();
