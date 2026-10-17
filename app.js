/* 훼이맵FateMap — 체험 프로그램 · 향의 지도 · 예약 문의 */
'use strict';

// ▼ 연락처·외부 링크는 여기만 바꾸면 페이지 전체에 반영됩니다.
const SITE = {
  phone: '010-5270-6833',
  email: 'infor423@naver.com',
  hours: '100% 예약제 · 상담 시간은 문의 시 안내',
  address: '대구광역시 북구 · 방문 상담 예약제',
  // 온라인 접수 주소 (탈리 폼 등). 비어 있으면 문자 · 메일로 보내도록 안내합니다.
  formEndpoint: '',
  // 탈리 폼 ID (https://tally.so/r/ 뒤의 글자). 채우면 문의 칸이 탈리 폼으로 바뀝니다.
  tallyId: 'q5ZJ2Y',
};
// 주소가 생기면 채워 주세요. 비어 있으면 버튼이 예약 문의로 연결됩니다.
const LINKS = {
  // 와디즈 펀딩이 열리면 주소를 넣어 주세요 → 스탠다드·프리미엄 '구매하기'가 와디즈로 연결됩니다.
  wadiz: '',
  smartstore: 'https://smartstore.naver.com/healing6833',
  // 제품 카드의 '구매하기' 버튼
  product: 'https://smartstore.naver.com/healing6833/products/10129726013',
  instagram: 'https://www.instagram.com/joyhealing6833/',
  threads: 'https://www.threads.com/@joyhealing6833',
  blog: 'https://blog.naver.com/healing6833',
  youtube: 'https://www.youtube.com/@%ED%96%A5%EA%B8%B0%EC%B9%98%EC%9C%A0%EC%A0%95%EC%9B%90%ED%9B%BC%EC%9D%B4%EB%A7%B5Fat',
};

const FRAG_CARDS = [
  {n:1, img:'card-01.webp', type:'zodiac', symbol:'♈', name:'양자리', dateLabel:'3/21–4/19', oil:'로즈마리', kwKr:'열정·용기', kwEn:'Passion, Courage',
    image:'맑고 날카로운 허브 향이 멈춰 있던 마음에 첫 불씨를 댕깁니다.', message:'망설였던 첫걸음을 오늘 내디뎌 보세요.',
    ritual:'아로마 스톤에 1방울. 세 번 깊게 숨 쉬며 오늘 시작할 일 하나를 소리 내어 말해 보세요.', caution:'임신 중 사용 주의'},
  {n:2, img:'card-02.webp', type:'zodiac', symbol:'♉', name:'황소자리', dateLabel:'4/20–5/20', oil:'일랑일랑', kwKr:'여유·향유', kwEn:'Ease, Delight',
    image:'짙고 달콤한 꽃향기가 서두르던 시간을 천천히 늦춰 줍니다.', message:'서두름을 내려놓고 지금을 음미해 보세요.',
    ritual:'디퓨저에 1방울(향이 진해 적게). 차 한 잔을 마시며 맛·온도·향 세 가지 감각에 차례로 집중해 보세요.', caution:'산화된 오일은 피부 감작 우려 — 개봉 후 보관 기간 확인'},
  {n:3, img:'card-03.webp', type:'zodiac', symbol:'♊', name:'쌍둥이자리', dateLabel:'5/21–6/21', oil:'페퍼민트', kwKr:'환기·호기심', kwEn:'Refresh, Curiosity',
    image:'차가우면서도 따뜻한 두 얼굴의 청량감이 생각에 바람길을 냅니다.', message:'창을 열듯 새로운 질문을 던져 보세요.',
    ritual:'티슈에 1방울. 창문을 열고 1분 동안 바깥에서 들리는 소리 세 가지를 찾아보세요.', caution:'영유아 주변 사용 주의'},
  {n:4, img:'card-04.webp', type:'zodiac', symbol:'♋', name:'게자리', dateLabel:'6/22–7/22', oil:'스위트 마조람 & 로먼 캐모마일(P)', kwKr:'위로·포용', kwEn:'Comfort, Embrace',
    image:'마조람이 오늘을 감싸는 따뜻한 손이라면, 캐모마일은 마음을 품는 품입니다.', message:'오늘 애쓴 나를 따뜻하게 안아 주세요.',
    ritual:'티슈에 마조람 1방울을 떨어뜨려 두 손으로 감싸 쥐고 "오늘 수고했어"라고 말해 보세요. (선택) 로먼 캐모마일 1방울을 더하면 부드러운 사과꽃 향이 겹쳐집니다.', caution:'로먼 캐모마일: 국화과 알레르기 주의 · 프리미엄 에디션 구성품(별도 판매)'},
  {n:5, img:'card-05.webp', type:'zodiac', symbol:'♌', name:'사자자리', dateLabel:'7/23–8/22', oil:'스위트 오렌지', kwKr:'관용·온기', kwEn:'Generosity, Warmth',
    image:'햇살을 닮은 달콤한 시트러스 향이 주변까지 환하게 데웁니다.', message:'먼저 건네는 미소로 하루를 밝혀 보세요.',
    ritual:'디퓨저에 2~3방울. 고마운 사람 한 명에게 짧은 안부 메시지를 보내 보세요.', caution:'원액 직접 도포 금지 · 희석 사용'},
  {n:6, img:'card-06.webp', type:'zodiac', symbol:'♍', name:'처녀자리', dateLabel:'8/23–9/22', oil:'라벤더', kwKr:'이완·평온', kwEn:'Relaxation, Serenity',
    image:'깨끗하고 부드러운 꽃향기가 어지러운 하루를 가지런히 정돈합니다.', message:'어깨의 힘을 풀고 숨을 천천히 골라 보세요.',
    ritual:'티슈에 1방울. 4초 들이쉬고 6초 내쉬는 호흡을 다섯 번 반복해 보세요.', caution:'원액 직접 도포 금지 · 희석 사용'},
  {n:7, img:'card-07.webp', type:'zodiac', symbol:'♎', name:'천칭자리', dateLabel:'9/23–10/22', oil:'제라늄 & 로즈(P)', kwKr:'균형·사랑', kwEn:'Balance, Love',
    image:'제라늄이 장미를 닮은 균형이라면, 로즈는 그 균형이 향하는 근원입니다.', message:'나와 타인 사이의 저울을 살펴보세요.',
    ritual:'아로마 스톤에 제라늄 1방울. 오늘 내가 \'받은 것\'과 \'준 것\'을 한 줄씩 적어 보세요. (선택) 로즈 1방울을 더하면 꽃향이 한층 깊어집니다.', caution:'로즈 오토: 프리미엄 에디션 구성품(별도 판매)'},
  {n:8, img:'card-08.webp', type:'zodiac', symbol:'♏', name:'전갈자리', dateLabel:'10/23–11/21', oil:'파출리', kwKr:'심연·몰입', kwEn:'Depth, Intensity',
    image:'젖은 흙처럼 어둡고 깊은 향이 한 곳으로 마음을 가라앉힙니다.', message:'한 가지에 깊이 머무는 시간을 가져 보세요.',
    ritual:'아로마 스톤에 1방울. 타이머를 3분에 맞추고 한 가지 일에만 몰입해 보세요.', caution:'원액 직접 도포 금지 · 희석 사용'},
  {n:9, img:'card-09.webp', type:'zodiac', symbol:'♐', name:'사수자리', dateLabel:'11/22–12/21', oil:'주니퍼베리', kwKr:'정화·도약', kwEn:'Purification, Leap',
    image:'숲속 공기 같은 맑은 우디 향이 묵은 것을 비우고 더 먼 곳을 보게 합니다.', message:'묵은 것을 비우고 한 걸음 더 멀리 가 보세요.',
    ritual:'디퓨저에 2방울. 책상 위 물건 세 개를 제자리에 두거나 비워 보세요.', caution:'임신 중 사용 주의'},
  {n:10, img:'card-10.webp', type:'zodiac', symbol:'♑', name:'염소자리', dateLabel:'12/22–1/19', oil:'시더우드', kwKr:'굳건·기반', kwEn:'Firmness, Foundation',
    image:'곧게 선 나무의 향이 흔들리는 마음에 단단한 바닥을 깔아 줍니다.', message:'오늘 쌓을 벽돌 한 장을 정해 보세요.',
    ritual:'아로마 스톤에 1방울. 허리를 곧게 세워 앉고, 오늘 끝낼 일 하나를 메모해 보세요.', caution:'원액 직접 도포 금지 · 희석 사용'},
  {n:11, img:'card-11.webp', type:'zodiac', symbol:'♒', name:'물병자리', dateLabel:'1/20–2/18', oil:'유칼립투스', kwKr:'통찰·확장', kwEn:'Insight, Expansion',
    image:'탁 트인 들판 같은 시원한 향이 익숙한 시야를 넓게 열어 줍니다.', message:'익숙한 시선 밖으로 한 뼘 넓혀 보세요.',
    ritual:'티슈에 1방울. 평소 보지 않던 분야의 글 한 편을 1분만 읽어 보세요.', caution:'영유아 주변 사용 주의'},
  {n:12, img:'card-12.webp', type:'zodiac', symbol:'♓', name:'물고기자리', dateLabel:'2/19–3/20', oil:'프랑킨센스', kwKr:'영성·보호', kwEn:'Spirituality, Protection',
    image:'오래된 신전의 수지 향이 고요한 나만의 자리를 감싸 줍니다.', message:'고요한 나만의 자리를 지켜 주세요.',
    ritual:'디퓨저에 2방울. 눈을 감고 1분 동안 아무것도 하지 않는 시간을 가져 보세요.', caution:'원액 직접 도포 금지 · 희석 사용'},
  {n:13, img:'card-13.webp', type:'planet', symbol:'☿', name:'수성', oil:'레몬', kwKr:'명쾌·자극', kwEn:'Clarity, Stimulation',
    image:'갓 자른 레몬의 밝은 향이 흐릿한 생각에 또렷한 선을 긋습니다.', message:'할 일을 한 줄로 또렷하게 적어 보세요.',
    ritual:'디퓨저에 2방울. 오늘의 할 일 목록에서 가장 중요한 한 줄에 동그라미를 그려 보세요.', caution:'광독성 — 피부에 사용 후 햇빛 노출 주의'},
  {n:14, img:'card-14.webp', type:'planet', symbol:'♀', name:'금성', oil:'버가못', kwKr:'조화·긍정', kwEn:'Harmony, Positivity',
    image:'향수와 얼그레이에 스며 있는 우아한 시트러스 향이 관계를 부드럽게 잇습니다.', message:'오늘 만난 사람의 좋은 점을 먼저 말해 보세요.',
    ritual:'디퓨저에 2방울. 오늘 만난 사람의 좋은 점 하나를 메모하거나 직접 전해 보세요.', caution:'광독성 — 베르갑텐 제거(FCF) 제품 권장'},
  {n:15, img:'card-15.webp', type:'planet', symbol:'♂', name:'화성', oil:'티트리', kwKr:'경계·해소', kwEn:'Boundary, Release',
    image:'강하고 곧은 약초 향이 나를 지키는 선을 또렷하게 그어 줍니다.', message:'괜찮지 않은 일엔 \'아니요\'라고 말해 보세요.',
    ritual:'아로마 스톤에 1방울. 오늘 거절하거나 미뤄도 되는 일 하나를 적어 보세요.', caution:'산화된 오일은 피부 감작 우려'},
  {n:16, img:'card-16.webp', type:'planet', symbol:'♃', name:'목성', oil:'그레이프후룻', kwKr:'풍요·활력', kwEn:'Abundance, Vitality',
    image:'송이째 열리는 커다란 시트러스의 싱그러운 향이 하루에 생기를 채웁니다.', message:'이미 가진 것 세 가지를 세어 보세요.',
    ritual:'디퓨저에 2~3방울. 오늘 감사한 것 세 가지를 적어 보세요.', caution:'광독성 — 피부에 사용 후 햇빛 노출 주의'},
  {n:17, img:'card-17.webp', type:'planet', symbol:'♄', name:'토성', oil:'베티버', kwKr:'현실·안착', kwEn:'Reality, Grounding',
    image:'깊은 뿌리의 흙 향이 떠 있던 마음을 땅 위에 내려놓습니다.', message:'발바닥이 땅에 닿는 감각을 느껴 보세요.',
    ritual:'아로마 스톤에 1방울. 신발을 벗고 서서 1분 동안 발바닥의 무게를 느껴 보세요.', caution:'원액 직접 도포 금지 · 희석 사용'},
  {n:18, img:'card-18.webp', type:'planet', symbol:'♅', name:'천왕성', oil:'레몬그라스', kwKr:'각성·돌파', kwEn:'Awakening, Breakthrough',
    image:'풀에서 레몬 향이 나는 뜻밖의 역설이 고정관념을 깨웁니다.', message:'늘 하던 방식을 하나만 바꿔 보세요.',
    ritual:'디퓨저에 1방울(향이 강해 적게). 오늘 루틴 하나의 순서나 길을 바꿔 보세요.', caution:'피부 감작 — 반드시 저농도 희석'},
  {n:19, img:'card-19.webp', type:'planet', symbol:'♆', name:'해왕성', oil:'클라리세이지', kwKr:'직관·흐름', kwEn:'Intuition, Flow',
    image:'포도주를 닮은 몽환적인 허브 향이 생각 대신 느낌을 따라가게 합니다.', message:'첫 느낌을 믿고 흐름에 맡겨 보세요.',
    ritual:'디퓨저에 1~2방울. 눈을 감고 떠오르는 단어 세 개를 적어 보세요.', caution:'임신 중 사용 주의'},
  {n:20, img:'card-20.webp', type:'planet', symbol:'♇', name:'명왕성', oil:'네롤리', kwKr:'변용·재생', kwEn:'Transformation, Rebirth',
    image:'쓴 열매의 나무에서 피어난 가장 달콤한 꽃, 그 향이 다시 시작할 힘을 품습니다.', message:'쓴 경험 속 달콤한 배움을 찾아보세요.',
    ritual:'티슈에 1방울. 최근 힘들었던 일에서 얻은 것 하나를 한 줄로 적어 보세요.', caution:'원액 직접 도포 금지 · 희석 사용'},
];
const FRAG_NOTE = '※ (P) = 프리미엄 에디션 구성품(별도 판매) · 스탠다드 에디션은 싱글 에센셜오일 20병+향기카드 20장, 프리미엄 에디션은 로먼 캐모마일·로즈를 더한 22병 구성입니다.<br><br>에센셜오일 원액은 피부에 직접 바르지 말고 반드시 희석해 사용하세요. 레몬·그레이프후룻·버가못은 광독성이 있어 사용 후 햇빛 노출에 주의하세요.<br><br>향기카드 20은 향과 별의 상징을 통해 하루를 돌아보는 자기 성찰 콘텐츠입니다. 미래를 예측하거나 특정한 효과를 약속하지 않으며, 의학적 진단·치료를 대신하지 않습니다.';

FRAG_CARDS.forEach(c => { c.img = 'img/' + c.img; c.thumb = c.img.replace('.webp', '-s.webp'); });

// 향 노트 (탑 8 · 미들 8 · 베이스 4)
const NOTE_OF = {1:'middle',2:'middle',3:'top',4:'middle',5:'top',6:'middle',7:'middle',8:'base',9:'middle',10:'base',
  11:'top',12:'base',13:'top',14:'top',15:'top',16:'top',17:'base',18:'top',19:'middle',20:'middle'};
const NOTE_INFO = {
  top:{label:'탑', color:'var(--top)', w:3},
  middle:{label:'미들', color:'var(--middle)', w:4},
  base:{label:'베이스', color:'var(--base)', w:2},
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const cardBy = n => FRAG_CARDS.find(c => c.n === n);
const mainOil = c => c.oil.split(' & ')[0].replace('(P)', '').trim();
const shortOil = c => mainOil(c).replace('스위트 ', '').replace('그레이프후룻', '자몽');
const pad = n => String(n).padStart(2, '0');
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
// 받침 유무에 따라 '이에요/예요'
const josaIeyo = w => ((w.charCodeAt(w.length - 1) - 0xAC00) % 28 ? '이에요' : '예요');
function esc(s){ const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }

function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- 카드 한 장 결과 ---------- */
function cardDetailHTML(c, {flip = false} = {}){
  const visual = flip
    ? `<div class="card-flip" id="flip-one"><div class="inner"><div class="face"></div><div class="face front" style="background-image:url('${c.img}')"></div></div></div>`
    : `<img class="card-img" src="${c.img}" alt="향기카드 ${pad(c.n)} ${esc(c.name)} · ${esc(c.oil)}" width="1024" height="1536">`;
  const note = NOTE_INFO[NOTE_OF[c.n]];
  return `
    <div class="card-result">
      ${visual}
      <div>
        <div class="card-head"><span class="card-no">No. ${pad(c.n)}</span><h3 class="card-title" id="card-modal-title">${c.symbol}︎ ${esc(c.name)} · ${esc(c.oil.replace('(P)', ''))}</h3></div>
        <p class="card-kw">${esc(c.kwKr)} · ${esc(c.kwEn)} · ${note.label} 노트${c.dateLabel ? ' · ' + c.dateLabel : ''}</p>
        <div class="card-sec"><p class="card-label">향의 이미지</p><p class="card-text">${esc(c.image)}</p></div>
        <div class="card-sec"><p class="card-label">오늘의 메시지</p><p class="card-text">${esc(c.message)}</p></div>
        <div class="card-sec"><p class="card-label">1분 향기 리추얼</p><p class="card-text">${esc(c.ritual)}</p></div>
        <p class="card-caution">주의 · ${esc(c.caution)}</p>
        <div class="card-actions">
          <a class="btn btn-dark" href="#contact" data-prefill="1:1 오행·별자리 아로마 컨설팅" data-note="향기카드 ${pad(c.n)} ${esc(c.name)} · ${esc(mainOil(c))} 카드를 뽑았어요. 이 향으로 상담받고 싶어요.">이 향으로 상담 받기</a>
          <button class="btn btn-line" type="button" data-share="${c.n}">결과 공유</button>
        </div>
      </div>
    </div>`;
}

const cardModal = $('#card-modal');
function openCard(n){
  $('#card-modal-body').innerHTML = cardDetailHTML(cardBy(n));
  cardModal.showModal();
}

/* ---------- 향기카드 20 ---------- */
const stage = $('#card-stage');

function spreadHTML(){
  let h = '';
  for (let i = 0; i < 20; i++){
    const rot = (-20 + i * (40 / 19)).toFixed(1);
    const lift = Math.round(Math.abs(9.5 - i) * 1.8);
    h += `<button class="spread-card" type="button" aria-label="${i + 1}번째 카드" style="transform:rotate(${rot}deg) translateY(${lift}px)"></button>`;
  }
  return `<div class="spread" id="spread">${h}</div>`;
}

function methodOne(){
  stage.innerHTML = `<p class="stage-intro">숨을 한 번 고른 뒤, 가장 먼저 눈길이 가는 카드 한 장을 눌러 보세요.</p>${spreadHTML()}`;
  const order = shuffle(FRAG_CARDS.map(c => c.n));
  $$('.spread-card', stage).forEach((el, i) => el.addEventListener('click', () => {
    const c = cardBy(order[i]);
    stage.innerHTML = cardDetailHTML(c, {flip:true}) + `<p style="text-align:center;margin:24px 0 0"><button class="btn btn-line btn-sm" type="button" id="again">다른 카드 뽑기</button></p>`;
    requestAnimationFrame(() => setTimeout(() => $('#flip-one')?.classList.add('open'), 60));
    $('#again').addEventListener('click', methodOne);
  }));
}

const SPREAD_POS = [
  {label:'지금의 나', key:'image'},
  {label:'내게 필요한 것', key:'message'},
  {label:'오늘의 리추얼', key:'ritual'},
];

function methodThree(){
  stage.innerHTML = `<p class="stage-intro">숨을 세 번 고른 뒤, 마음이 끌리는 카드 세 장을 차례로 눌러 보세요.</p><p class="stage-status" id="status">0 / 3</p>${spreadHTML()}`;
  const order = shuffle(FRAG_CARDS.map(c => c.n));
  const picks = [];
  $$('.spread-card', stage).forEach((el, i) => el.addEventListener('click', () => {
    if (picks.length >= 3 || el.classList.contains('picked')) return;
    picks.push(order[i]);
    el.classList.add('picked');
    el.innerHTML = `<span class="no">${picks.length}</span>`;
    $('#status').innerHTML = picks.length < 3 ? `<b>${picks.length}</b> / 3` : '카드를 펼치는 중이에요…';
    if (picks.length === 3){ $('#spread').classList.add('done'); setTimeout(() => readingThree(picks.map(cardBy)), 650); }
  }));
}

function readingThree(cs){
  stage.innerHTML = `
    <div class="reading">${cs.map((c, i) => `
      <div class="reading-item">
        <span class="reading-pos">${i + 1} · ${SPREAD_POS[i].label}</span>
        <div class="card-flip" data-card="${c.n}" role="button" tabindex="0" aria-label="${esc(c.name)} 카드 자세히 보기"><div class="inner"><div class="face"></div><div class="face front" style="background-image:url('${c.img}')"></div></div></div>
        <div class="reading-text"><b>${c.symbol}︎ ${esc(c.name)} · ${esc(mainOil(c))}</b>${esc(c[SPREAD_POS[i].key])}</div>
      </div>`).join('')}
    </div>
    <div id="recipe-slot"></div>`;
  $$('.reading-item', stage).forEach((item, i) => {
    setTimeout(() => { $('.card-flip', item).classList.add('open'); item.classList.add('open'); }, 350 + i * 650);
  });
  setTimeout(() => renderRecipe(cs), 350 + 3 * 650 + 150);
}

// 노트 비중(미들 4 : 탑 3 : 베이스 2)으로 방울 수를 나눔 (각 오일 최소 1방울)
function blendDrops(cs, total){
  const w = cs.map(c => NOTE_INFO[NOTE_OF[c.n]].w);
  const sum = w.reduce((a, b) => a + b, 0);
  const raw = w.map(x => x / sum * total);
  const drops = raw.map(x => Math.max(1, Math.floor(x)));
  let left = total - drops.reduce((a, b) => a + b, 0);
  const order = raw.map((x, i) => [x - drops[i], i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; left > 0 && k < order.length; k++, left--) drops[order[k][1]]++;
  return drops;
}

function renderRecipe(cs){
  const roll = blendDrops(cs, 4), diff = blendDrops(cs, 6);
  const notes = cs.map(c => NOTE_OF[c.n]);
  const hint = !notes.includes('base') ? '베이스 노트가 없어 향이 빨리 날아갈 수 있어요. 시더우드나 베티버를 한 방울 더해 보세요.'
    : !notes.includes('top') ? '탑 노트가 없어 첫 향이 묵직할 수 있어요. 레몬이나 버가못으로 산뜻함을 더해 보세요.'
    : '탑 · 미들 · 베이스가 고르게 어우러진 조합이에요.';
  const names = cs.map(mainOil);
  const row = (c, d, max) => `<div class="recipe-row"><span>${esc(mainOil(c))}</span><span class="recipe-bar"><i style="width:${d / max * 100}%;background:${NOTE_INFO[NOTE_OF[c.n]].color}"></i></span><span>${d}방울</span></div>`;
  const note = `[3장 리딩] 지금의 나: ${cs[0].name}(${names[0]}) / 내게 필요한 것: ${cs[1].name}(${names[1]}) / 오늘의 리추얼: ${cs[2].name}(${names[2]}) — 이 조합으로 블렌딩해 보고 싶어요.`;
  $('#recipe-slot').innerHTML = `
    <div class="recipe">
      <h4>나만의 블렌딩 레시피</h4>
      <p class="recipe-sub">${esc(names.join(' + '))} · ${hint}</p>
      <div class="recipe-cols">
        <div><p class="card-label">롤온 10ml · 캐리어오일 + 총 4방울(약 2%)</p>${cs.map((c, i) => row(c, roll[i], 4)).join('')}</div>
        <div><p class="card-label">디퓨저 · 물 100ml 기준 총 6방울</p>${cs.map((c, i) => row(c, diff[i], 6)).join('')}</div>
      </div>
      <ul>${[...new Set(cs.map(c => c.caution))].map(t => `<li>${esc(t)}</li>`).join('')}<li>처음엔 시향지에 섞어 맡아 본 뒤 사용하세요.</li></ul>
      <div class="card-actions">
        <a class="btn btn-dark" href="#contact" data-prefill="나만의 블렌딩 클래스" data-note="${esc(note)}">이 조합으로 클래스 · 상담 신청</a>
        <button class="btn btn-line" type="button" id="again3">다시 뽑기</button>
      </div>
    </div>`;
  $('#again3').addEventListener('click', methodThree);
}

function methodSign(){
  stage.innerHTML = `<p class="stage-intro">태어난 날짜가 속한 별자리를 골라 주세요.</p>
    <div class="sign-grid">${FRAG_CARDS.filter(c => c.type === 'zodiac').map(c =>
      `<button class="sign-btn" type="button" data-n="${c.n}"><b>${c.symbol}︎</b><span>${c.name}</span><small>${c.dateLabel}</small></button>`).join('')}</div>`;
  $$('.sign-btn', stage).forEach(b => b.addEventListener('click', () => showInStage(Number(b.dataset.n), methodSign)));
}

function methodKeyword(){
  stage.innerHTML = `<p class="stage-intro">오늘 나에게 필요한 단어 하나를 골라 주세요.</p>
    <div class="kw-grid">${shuffle(FRAG_CARDS).map(c => `<button class="kw-btn" type="button" data-n="${c.n}">${esc(c.kwKr)}</button>`).join('')}</div>`;
  $$('.kw-btn', stage).forEach(b => b.addEventListener('click', () => showInStage(Number(b.dataset.n), methodKeyword)));
}

function showInStage(n, back){
  stage.innerHTML = cardDetailHTML(cardBy(n), {flip:true}) + `<p style="text-align:center;margin:24px 0 0"><button class="btn btn-line btn-sm" type="button" id="again">다시 고르기</button></p>`;
  setTimeout(() => $('#flip-one')?.classList.add('open'), 60);
  $('#again').addEventListener('click', back);
}

const METHODS = {one:methodOne, three:methodThree, sign:methodSign, keyword:methodKeyword};
$$('.method-btn').forEach(b => b.addEventListener('click', () => {
  $$('.method-btn').forEach(x => x.classList.toggle('active', x === b));
  METHODS[b.dataset.method]();
}));
stage.addEventListener('click', e => {
  const f = e.target.closest('.card-flip[data-card]');
  if (f) openCard(Number(f.dataset.card));
});
stage.addEventListener('keydown', e => {
  const f = e.target.closest('.card-flip[data-card]');
  if (f && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); openCard(Number(f.dataset.card)); }
});
methodOne();

/* ---------- 4원소 자가진단 ---------- */
const ELEMENTS = {
  fire:{ name:'불', en:'FIRE', color:'var(--fire)', icon:'🔥', cards:[1,5,9], key:'열정 · 시작',
    desc:'앞으로 나아가는 힘이 두드러져요. 시작이 빠르고 주변에 활력을 전하지만, 쉼 없이 달리면 쉽게 소진될 수 있어요.',
    balance:'작은 시작으로 불씨를 더해 보세요' },
  earth:{ name:'흙', en:'EARTH', color:'var(--earth)', icon:'🌿', cards:[2,6,10], key:'안정 · 실행',
    desc:'현실 감각과 꾸준함이 돋보여요. 믿음직한 사람이지만, 변화 앞에서 마음이 무거워질 수 있어요.',
    balance:'발을 딛는 작은 루틴을 더해 보세요' },
  air:{ name:'공기', en:'AIR', color:'var(--air)', icon:'🌬️', cards:[3,7,11], key:'소통 · 생각',
    desc:'호기심과 말솜씨가 빛나요. 아이디어가 넘치지만, 생각이 많아 머리가 쉬지 못할 수 있어요.',
    balance:'환기와 대화로 바람길을 내 보세요' },
  water:{ name:'물', en:'WATER', color:'var(--water)', icon:'💧', cards:[4,8,12], key:'감성 · 공감',
    desc:'섬세한 감수성과 공감력이 깊어요. 따뜻한 사람이지만, 다른 이의 감정까지 떠안아 지칠 수 있어요.',
    balance:'감정을 흘려보내는 쉼을 더해 보세요' },
};
const QUIZ = [
  ['주말 아침, 가장 끌리는 계획은?', ['새로운 곳으로 즉흥 나들이', '집 정리하고 장보기', '친구와 브런치 수다', '혼자 음악 들으며 늦잠']],
  ['일이 막힐 때 나는?', ['일단 부딪혀 본다', '계획을 다시 세운다', '사람들에게 의견을 묻는다', '마음이 정리될 때까지 기다린다']],
  ['요즘 나의 상태에 가장 가까운 것은?', ['마음이 조급하고 들떠 있다', '몸이 무겁고 처진다', '생각이 많아 머리가 복잡하다', '감정이 쉽게 출렁인다']],
  ['지금 끌리는 색은?', ['붉은 노을빛', '흙빛 · 올리브', '하늘색 · 은빛', '깊은 남색']],
  ['들으면 가장 기쁜 칭찬은?', ['추진력 있다', '믿음직하다', '센스 있다, 말이 잘 통한다', '따뜻하다, 공감을 잘한다']],
  ['스트레스를 풀 때 나는?', ['몸을 움직여 땀을 낸다', '맛있는 걸 먹고 정리정돈', '대화하거나 새 정보를 찾는다', '목욕하거나 영화를 보며 운다']],
  ['하루 중 가장 좋아하는 시간은?', ['햇살 가득한 한낮', '노을 지는 이른 저녁', '맑은 아침', '고요한 밤']],
  ['중요한 결정을 내릴 때 나는?', ['직감과 열정을 따른다', '현실성과 근거를 본다', '장단점을 비교한다', '내 마음이 편한지 살핀다']],
  ['지금 맡고 싶은 향은?', ['스파이시 · 시트러스', '우디 · 흙내음', '허브 · 민트', '플로럴 · 부드러운 꽃향']],
  ['가 보고 싶은 풍경은?', ['붉은 사막과 화산', '깊은 숲과 산', '탁 트인 고원과 도시', '바다와 호수']],
  ['요즘 가장 바라는 것은?', ['다시 의욕이 생기는 것', '안정과 단단한 기반', '새로운 자극과 교류', '위로와 쉼']],
  ['친구들이 말하는 나는?', ['에너지가 넘친다', '한결같다', '아이디어가 많다', '감수성이 풍부하다']],
];
const EL_KEYS = ['fire', 'earth', 'air', 'water'];
const elStage = $('#element-stage');
let quizAnswers = [];

function quizStart(){
  quizAnswers = [];
  elStage.innerHTML = `
    <div style="text-align:center;padding:10px 0">
      <p class="eyebrow">FOUR ELEMENTS</p>
      <h3 style="font-size:24px;margin:0 0 10px">지금 나에게 두드러진 원소는?</h3>
      <p class="panel-intro">심리 · 생활 12가지 질문으로 불 · 흙 · 공기 · 물 중 지금 두드러진 기운과<br>보완하면 좋은 기운을 찾고, 어울리는 향기카드를 추천해 드려요. (약 1분)</p>
      <button class="btn btn-dark" type="button" id="quiz-go">진단 시작하기</button>
    </div>`;
  $('#quiz-go').addEventListener('click', () => quizStep(0));
}

function quizStep(i){
  const [q, opts] = QUIZ[i];
  const order = shuffle([0, 1, 2, 3]);
  elStage.innerHTML = `
    <div class="quiz-progress"><i style="width:${i / QUIZ.length * 100}%"></i></div>
    <p class="quiz-count">${i + 1} / ${QUIZ.length}</p>
    <h3 class="quiz-q">${q}</h3>
    <div class="quiz-opts">${order.map(k => `<button class="quiz-opt" type="button" data-el="${EL_KEYS[k]}">${opts[k]}</button>`).join('')}</div>
    <div class="quiz-nav">${i > 0 ? '<button class="link" type="button" id="quiz-back">← 이전 질문</button>' : '<span></span>'}<span style="color:var(--muted)">가장 가까운 것 하나</span></div>`;
  $$('.quiz-opt', elStage).forEach(b => b.addEventListener('click', () => {
    quizAnswers[i] = b.dataset.el;
    i + 1 < QUIZ.length ? quizStep(i + 1) : quizResult();
  }));
  $('#quiz-back')?.addEventListener('click', () => quizStep(i - 1));
}

function quizResult(){
  const count = Object.fromEntries(EL_KEYS.map(k => [k, 0]));
  quizAnswers.forEach(k => count[k]++);
  const sorted = [...EL_KEYS].sort((a, b) => count[b] - count[a]);
  const top = ELEMENTS[sorted[0]], low = ELEMENTS[sorted[3]];
  const cs = low.cards.map(cardBy);
  elStage.innerHTML = `
    <div class="el-result">
      <div>
        <span class="el-badge" style="background:${top.color}">${top.icon} ${top.en} · ${top.name}</span>
        <h3 class="el-title">지금 두드러진 원소는 '${top.name}'${josaIeyo(top.name)}</h3>
        <p class="card-text">${top.desc}</p>
        <div class="el-bars">${sorted.map(k => `
          <div class="el-bar"><span>${ELEMENTS[k].icon} ${ELEMENTS[k].name}</span><span class="recipe-bar"><i style="width:${count[k] / QUIZ.length * 100}%;background:${ELEMENTS[k].color}"></i></span><span>${Math.round(count[k] / QUIZ.length * 100)}%</span></div>`).join('')}
        </div>
      </div>
      <div>
        <p class="card-label">보완하면 좋은 원소 · ${low.icon} ${low.name} (${low.key})</p>
        <p class="card-text">${low.balance}. ${low.name}의 기운을 닮은 향기카드 세 장을 추천해요.</p>
        <div class="el-cards">${cs.map(c => `<img src="${c.img}" alt="${esc(c.name)} · ${esc(mainOil(c))} 카드" data-card="${c.n}" loading="lazy" width="1024" height="1536">`).join('')}</div>
        <p class="fine" style="margin-top:6px">${cs.map(c => `${c.symbol}︎ ${esc(mainOil(c))}`).join(' · ')} — 카드를 누르면 자세히 볼 수 있어요.</p>
        <div class="card-actions">
          <a class="btn btn-dark" href="#contact" data-prefill="1:1 오행·별자리 아로마 컨설팅" data-note="[4원소 자가진단] 두드러진 원소: ${top.name} / 보완할 원소: ${low.name} — 결과로 상담받고 싶어요.">결과로 1:1 상담 받기</a>
          <button class="btn btn-line" type="button" id="quiz-again">다시 하기</button>
        </div>
      </div>
    </div>`;
  $$('[data-card]', elStage).forEach(img => img.addEventListener('click', () => openCard(Number(img.dataset.card))));
  $('#quiz-again').addEventListener('click', quizStart);
}
quizStart();

/* ---------- 오늘의 향 찾기 ---------- */
const MOODS = [
  {icon:'😮‍💨', label:'지치고 피곤해요', cards:[1,3,5], line:'맑은 허브와 달콤한 시트러스로 무거운 하루에 바람을 들여요.'},
  {icon:'🌀', label:'마음이 복잡해요', cards:[6,14,7], line:'부드러운 꽃향과 우아한 시트러스로 생각을 가지런히 정돈해요.'},
  {icon:'🌙', label:'잠들기 전 쉬고 싶어요', cards:[6,10,4], line:'포근한 나무 향과 라벤더로 하루를 천천히 닫아요.'},
  {icon:'📚', label:'집중이 필요해요', cards:[13,1,12], line:'또렷한 레몬과 깊은 수지 향으로 한 가지에 머무는 시간을 만들어요.'},
  {icon:'☁️', label:'기분이 가라앉아요', cards:[14,16,20], line:'햇살 같은 시트러스와 하얀 꽃향으로 마음에 빛을 비춰요.'},
  {icon:'🌱', label:'새롭게 시작하고 싶어요', cards:[9,18,11], line:'숲 공기와 풀잎 향으로 묵은 것을 비우고 한 걸음 내디뎌요.'},
];
$('#mood-grid').innerHTML = MOODS.map((m, i) => `<button class="mood-btn" type="button" data-i="${i}"><b>${m.icon}</b>${m.label}</button>`).join('');
$('#mood-grid').addEventListener('click', e => {
  const b = e.target.closest('.mood-btn'); if (!b) return;
  $$('.mood-btn').forEach(x => x.classList.toggle('on', x === b));
  const m = MOODS[b.dataset.i], cs = m.cards.map(cardBy);
  $('#mood-result').innerHTML = `
    <div class="mood-result">
      <div class="mood-cards">${cs.map(c => `<img src="${c.img}" alt="${esc(c.name)} 카드" data-card="${c.n}" width="1024" height="1536">`).join('')}</div>
      <div>
        <p class="card-label">오늘의 추천 블렌드</p>
        <h3 class="card-title">${cs.map(c => esc(mainOil(c))).join(' · ')}</h3>
        <p class="card-text" style="margin-top:8px">${m.line}</p>
        <p class="fine" style="margin-top:6px">카드를 누르면 향의 이야기와 1분 리추얼을 볼 수 있어요.</p>
        <div class="card-actions"><a class="btn btn-dark" href="#contact" data-prefill="1:1 오행·별자리 아로마 컨설팅" data-note="[오늘의 향 찾기] ${m.label} → ${cs.map(mainOil).join(', ')}">이 향으로 상담 받기</a></div>
      </div>
    </div>`;
  $$('#mood-result [data-card]').forEach(img => img.addEventListener('click', () => openCard(Number(img.dataset.card))));
});

/* ---------- 탭 ---------- */
function selectTab(name){
  $$('.tab').forEach(t => {
    const on = t.dataset.tab === name;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    $('#panel-' + t.dataset.tab).hidden = !on;
  });
}
$$('.tab').forEach(t => {
  t.addEventListener('click', () => selectTab(t.dataset.tab));
  t.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tabs = $$('.tab'), i = tabs.indexOf(t);
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    selectTab(next.dataset.tab); next.focus();
  });
});
document.addEventListener('click', e => {
  const a = e.target.closest('[data-open-tab]'); if (a) selectTab(a.dataset.openTab);
});

/* ---------- 20가지 향의 지도 ---------- */
(function atlas(){
  const C = 320;
  const pt = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [(C + r * Math.cos(a)).toFixed(1), (C + r * Math.sin(a)).toFixed(1)]; };
  let h = `<circle cx="${C}" cy="${C}" r="304" style="fill:none;stroke:var(--border)"/>
    <circle cx="${C}" cy="${C}" r="232" style="fill:none;stroke:var(--gold);stroke-opacity:.55"/>
    <circle cx="${C}" cy="${C}" r="148" style="fill:none;stroke:var(--air);stroke-opacity:.5" stroke-dasharray="3 6"/>
    <circle cx="${C}" cy="${C}" r="64" style="fill:var(--surface);stroke:var(--border)"/>
    <text x="${C}" y="${C - 4}" text-anchor="middle" style="fill:var(--text)" font-size="19" font-weight="700">향의</text>
    <text x="${C}" y="${C + 22}" text-anchor="middle" style="fill:var(--text)" font-size="19" font-weight="700">지도</text>`;
  const node = (c, x, y, r, color, tx, ty, size) => `
    <g class="node" data-card="${c.n}" tabindex="0" role="button" aria-label="${c.name} ${mainOil(c)} 카드 보기">
      <circle cx="${x}" cy="${y}" r="${r}" style="fill:${color}"/>
      <text x="${tx}" y="${ty - 3}" text-anchor="middle" style="fill:var(--text)" font-size="${size}">${c.symbol}︎ ${c.name.replace('자리', '')}</text>
      <text x="${tx}" y="${Number(ty) + size - 1}" text-anchor="middle" style="fill:var(--muted)" font-size="${size - 3.5}">${shortOil(c)}</text>
    </g>`;
  FRAG_CARDS.filter(c => c.type === 'zodiac').forEach((c, i) => {
    const deg = i * 30, [l1x, l1y] = pt(232, deg + 15), [l2x, l2y] = pt(304, deg + 15);
    const [dx, dy] = pt(232, deg), [tx, ty] = pt(270, deg);
    h += `<line x1="${l1x}" y1="${l1y}" x2="${l2x}" y2="${l2y}" style="stroke:var(--border)"/>` + node(c, dx, dy, 10, 'var(--gold)', tx, ty, 16);
  });
  FRAG_CARDS.filter(c => c.type === 'planet').forEach((c, i) => {
    const deg = i * 45 + 22.5, [dx, dy] = pt(148, deg), [tx, ty] = pt(104, deg);
    h += node(c, dx, dy, 9, 'var(--air)', tx, ty, 13.5);
  });
  const wheel = $('#wheel');
  wheel.innerHTML = h;
  $$('.node', wheel).forEach(g => {
    const go = () => openCard(Number(g.dataset.card));
    g.addEventListener('click', go);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
  });

  $('#oil-list').innerHTML = FRAG_CARDS.map(c => {
    const n = NOTE_INFO[NOTE_OF[c.n]];
    return `<button class="oil-item" type="button" data-card="${c.n}"><img src="${c.thumb}" alt="" loading="lazy" width="120" height="180"><span><small>${pad(c.n)} · ${c.symbol}︎ ${c.name}</small><b>${esc(c.oil.replace('(P)', ''))}</b></span><span class="note" style="background:${n.color}">${n.label}</span></button>`;
  }).join('');
  $('#oil-list').addEventListener('click', e => { const b = e.target.closest('[data-card]'); if (b) openCard(Number(b.dataset.card)); });

  // 제품 카드 이미지
  $$('[data-fan]').forEach(el => {
    el.innerHTML = el.dataset.fan.split(',').map(n => `<img src="${cardBy(Number(n)).thumb}" alt="" loading="lazy" width="120" height="180">`).join('');
  });
})();

function zodiacByDate(m, d){
  const v = m * 100 + d;
  return FRAG_CARDS.filter(c => c.type === 'zodiac').find(c => {
    const [a, b] = c.dateLabel.split('–').map(s => { const [mm, dd] = s.split('/').map(Number); return mm * 100 + dd; });
    return a <= b ? (v >= a && v <= b) : (v >= a || v <= b);
  });
}
$('#birth-form').addEventListener('submit', e => {
  e.preventDefault();
  const val = $('#birth-date').value, out = $('#birth-out');
  if (!val){ out.textContent = '생일을 입력해 주세요.'; return; }
  const [, m, d] = val.split('-').map(Number);
  const c = zodiacByDate(m, d);
  out.innerHTML = `${c.symbol}︎ <b>${c.name}</b>의 향은 <b>${esc(mainOil(c))}</b> · ${esc(c.kwKr)} <button class="link" type="button">카드 보기 →</button>`;
  $('button', out).addEventListener('click', () => openCard(c.n));
});

/* ---------- 공유 ---------- */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-share]'); if (!b) return;
  const c = cardBy(Number(b.dataset.share));
  const text = `오늘의 향기카드: ${c.name} · ${mainOil(c)} — "${c.message}"`;
  const url = 'https://healing6833-jin.github.io/#experience';
  try {
    if (navigator.share){ await navigator.share({title:'훼이맵FateMap 향기카드', text, url}); return; }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    toast('결과를 복사했어요. 원하는 곳에 붙여 넣어 공유해 보세요.');
  } catch (_) { /* 공유 취소 */ }
});

/* ---------- 모달 ---------- */
$$('dialog').forEach(d => {
  d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
});
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]'); if (o) $('#' + o.dataset.open).showModal();
});

/* ---------- 연락처 · 외부 링크 ---------- */
$$('[data-config]').forEach(el => {
  const k = el.dataset.config, v = SITE[k]; if (!v) return;
  el.textContent = v;
  if (el.tagName === 'A'){
    if (k === 'phone') el.href = `tel:${v.replace(/[^0-9+]/g, '')}`;
    if (k === 'email') el.href = `mailto:${v}`;
  }
});
$$('[data-config-href]').forEach(el => {
  const tel = SITE.phone.replace(/[^0-9+]/g, '');
  el.href = el.dataset.configHref === 'sms' ? `sms:${tel}` : `tel:${tel}`;
});
// 주소가 있으면 그 링크로, 없으면 data-fallback-link(예: 와디즈 → 스마트스토어 상품)로 연결
$$('[data-link]').forEach(el => {
  const url = LINKS[el.dataset.link] || LINKS[el.dataset.fallbackLink];
  if (url){ el.href = url; el.target = '_blank'; el.rel = 'noopener'; }
  else { el.dataset.prefill = el.dataset.fallbackPrefill; el.dataset.note = el.dataset.fallbackNote; }
});
// 와디즈 주소가 들어가면 '준비 중' 표시도 자동으로 바뀜
if (LINKS.wadiz) $$('[data-wadiz-tag]').forEach(el => { el.textContent = el.dataset.wadizTag; });
// 채널 로고 버튼 (주소가 있는 채널만 표시)
const CHANNEL_ICONS = {
  instagram:{ name:'Instagram', handle:'@joyhealing6833', bg:'linear-gradient(45deg,#F9CE34 0%,#EE2A7B 45%,#6228D7 100%)',
    svg:'<rect x="3" y="3" width="18" height="18" rx="5.2" fill="none" stroke="#fff" stroke-width="1.9"/><circle cx="12" cy="12" r="4.1" fill="none" stroke="#fff" stroke-width="1.9"/><circle cx="17.3" cy="6.7" r="1.25" fill="#fff"/>' },
  threads:{ name:'Threads', handle:'@joyhealing6833', bg:'#000',
    svg:'<path fill="#fff" d="M16.7 11.1c-.1-.05-.2-.1-.3-.14-.18-3.3-1.98-5.19-5-5.21h-.04c-1.8 0-3.3.77-4.23 2.17l1.66 1.14c.69-1.05 1.78-1.27 2.57-1.27h.03c.99 0 1.74.3 2.22.86.35.41.59.97.7 1.68-.86-.15-1.8-.19-2.79-.13-2.8.16-4.6 1.8-4.48 4.07.06 1.15.64 2.15 1.62 2.79.83.55 1.9.82 3.01.76 1.47-.08 2.62-.64 3.42-1.66.61-.78 1-1.78 1.17-3.04.7.42 1.22.98 1.51 1.65.49 1.14.52 3.02-1.01 4.55-1.34 1.34-2.95 1.92-5.39 1.94-2.7-.02-4.75-.89-6.08-2.58C5.62 17.17 4.97 14.9 4.94 12c.03-2.9.68-5.17 1.94-6.75 1.33-1.69 3.38-2.56 6.08-2.58 2.72.02 4.8.89 6.18 2.6.68.83 1.19 1.88 1.52 3.11l1.95-.52c-.4-1.5-1.04-2.79-1.92-3.87C18.92 1.85 16.38.78 12.97.76h-.01C9.56.78 7.06 1.86 5.37 3.98 3.87 5.86 3.1 8.48 3.07 11.99v.02c.03 3.51.8 6.13 2.3 8.01 1.69 2.12 4.19 3.2 7.59 3.22h.01c3.02-.02 5.15-.81 6.91-2.57 2.3-2.3 2.23-5.18 1.47-6.95-.54-1.27-1.58-2.3-3-2.98Zm-4.97 4.67c-1.26.07-2.57-.5-2.64-1.71-.05-.9.64-1.9 2.71-2.02.24-.01.47-.02.7-.02.75 0 1.45.07 2.09.21-.24 2.98-1.64 3.47-2.86 3.54Z"/>' },
  blog:{ name:'네이버 블로그', handle:'healing6833', bg:'#03C75A',
    svg:'<path fill="#fff" d="M5 4.5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-5.2L12 20.3l-1.8-2.8H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z"/><text x="12" y="14.2" text-anchor="middle" font-family="Arial,sans-serif" font-size="6.4" font-weight="700" fill="#03C75A">blog</text>' },
  youtube:{ name:'YouTube', handle:'향기치유정원', bg:'#FF0000',
    svg:'<rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="#fff"/><path d="M10.2 9.2v5.6l4.8-2.8z" fill="#FF0000"/>' },
  smartstore:{ name:'스마트스토어', handle:'healing6833', bg:'#03C75A',
    svg:'<path fill="#fff" d="M6 8.2h12l-.9 11.1a1.4 1.4 0 0 1-1.4 1.3H8.3a1.4 1.4 0 0 1-1.4-1.3L6 8.2Z"/><path d="M9 8.6V7a3 3 0 0 1 6 0v1.6" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><path fill="#03C75A" d="M9.6 11.3h1.7l1.9 2.9v-2.9h1.6v6.1h-1.6l-1.9-2.9v2.9H9.6z"/>' },
  wadiz:{ name:'와디즈', handle:'', bg:'#00C4C4',
    svg:'<text x="12" y="16" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="#fff">W</text>' },
};
const CHANNEL_ORDER = ['instagram', 'threads', 'blog', 'youtube', 'smartstore', 'wadiz'];
(function channels(){
  const list = CHANNEL_ORDER.filter(k => LINKS[k]);
  $$('[data-channels]').forEach(box => {
    if (!list.length){ box.hidden = true; return; }
    box.innerHTML = list.map(k => {
      const c = CHANNEL_ICONS[k];
      return `<a class="channel" href="${LINKS[k]}" target="_blank" rel="noopener" aria-label="${c.name} (새 창)" title="${c.name}">
        <span class="channel-logo" style="background:${c.bg}"><svg viewBox="0 0 24 24" aria-hidden="true">${c.svg}</svg></span>
        <span class="channel-text"><b>${c.name}</b>${c.handle ? `<small>${c.handle}</small>` : ''}</span>
      </a>`;
    }).join('');
  });
})();
$('#year').textContent = new Date().getFullYear();

/* ---------- 예약 문의 ---------- */
const form = $('#contact-form');
const programSel = $('#contact-program');
function syncReportFields(){ $('#report-fields').hidden = programSel.value !== '정식 오행 사주 리포트'; }
programSel.addEventListener('change', syncReportFields);

// 탈리 폼 넣기: 숨은 칸(program, note)에 체험 결과를 담아 전달
let tallyFrame = null;
function tallySrc(program, note){
  const q = new URLSearchParams({alignLeft:'1', hideTitle:'1', transparentBackground:'1', dynamicHeight:'1'});
  if (program) q.set('program', program);
  if (note) q.set('note', note);
  return `https://tally.so/embed/${SITE.tallyId}?${q}`;
}
(function initTally(){
  if (!SITE.tallyId) return;
  form.hidden = true;
  const box = document.createElement('div');
  box.className = 'contact-form tally-box reveal in';
  box.innerHTML = `<iframe title="훼이맵 상담 · 예약 신청" loading="lazy" width="100%" height="720" frameborder="0" src="${tallySrc()}"></iframe>
    <p class="fine" style="margin:8px 0 0">폼이 보이지 않으면 <a href="https://tally.so/r/${SITE.tallyId}" target="_blank" rel="noopener">새 창에서 열기</a></p>`;
  form.after(box);
  tallyFrame = $('iframe', box);
  // 탈리 공식 스크립트: 폼 높이를 내용에 맞게 자동 조절
  const s = document.createElement('script');
  s.src = 'https://tally.so/widgets/embed.js'; s.async = true;
  s.onload = () => window.Tally && window.Tally.loadEmbeds();
  document.body.appendChild(s);
})();

function prefillContact(program, note){
  if (tallyFrame){ tallyFrame.src = tallySrc(program, note); return; }
  if (program && [...programSel.options].some(o => o.text === program)) programSel.value = program;
  if (note) $('#contact-message').value = note;
  syncReportFields();
  form.hidden = false; $('#form-done').hidden = true; $('#form-submit').hidden = false;
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-prefill]'); if (!a) return;
  if (cardModal.open) cardModal.close();
  prefillContact(a.dataset.prefill, a.dataset.note);
  if (a.dataset.note) toast('선택하신 내용을 문의서에 담아 두었어요.');
});

(function(){
  const t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
  form.date.min = t.toISOString().slice(0, 10);
})();

function summaryText(fd){
  const lines = [`성함: ${fd.get('name')}`, `연락처: ${fd.get('tel')}`, `프로그램: ${fd.get('program')}`, `희망 날짜: ${fd.get('date') || '미정'}`];
  if (fd.get('program') === '정식 오행 사주 리포트'){
    lines.push(`생년월일: ${fd.get('birth') || '-'} (${fd.get('calendar')})`, `태어난 시간: ${fd.get('time_unknown') ? '모름' : (fd.get('birth_time') || '-')}`, `출생지: ${fd.get('birth_place') || '-'}`);
  }
  lines.push('', '요청사항:', (fd.get('message') || '-').trim());
  return lines.join('\n');
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const err = $('#form-error');
  const name = form.name.value.trim(), tel = form.tel.value.trim();
  const telOk = /^[0-9\-+\s]{9,}$/.test(tel);
  form.name.classList.toggle('is-invalid', !name);
  form.tel.classList.toggle('is-invalid', !telOk);
  if (!name){ err.textContent = '성함을 입력해 주세요.'; form.name.focus(); return; }
  if (!telOk){ err.textContent = '연락처를 올바르게 입력해 주세요.'; form.tel.focus(); return; }
  if (!form.agree.checked){ err.textContent = '개인정보 수집·이용에 동의해 주세요.'; return; }
  err.textContent = '';

  const fd = new FormData(form);
  const btn = $('#form-submit');
  let sent = false;
  if (SITE.formEndpoint){
    btn.disabled = true; btn.textContent = '보내는 중…';
    try {
      const res = await fetch(SITE.formEndpoint, {method:'POST', body:fd});
      sent = res.ok;
    } catch (_) { sent = false; }
    btn.disabled = false; btn.textContent = '문의 내용 보내기';
  }

  const done = $('#form-done');
  const text = summaryText(fd);
  const subject = `[훼이맵 예약 문의] ${name} 님 - ${fd.get('program')}`;
  const tel0 = SITE.phone.replace(/[^0-9+]/g, '');
  if (sent){
    done.innerHTML = `<h4>문의가 접수되었어요</h4><p>${esc(name)} 님, 남겨 주신 연락처로 영업일 기준 하루 안에 연락드릴게요.</p>`;
    form.reset(); syncReportFields();
  } else {
    done.innerHTML = `<h4>편한 방법으로 보내 주세요</h4><p>작성하신 내용이 자동으로 채워져요. 보내기만 누르시면 대표에게 바로 전달됩니다.</p>
      <div class="btns">
        <a class="btn btn-dark btn-sm" href="sms:${tel0}?&body=${encodeURIComponent(text)}">문자로 보내기</a>
        <a class="btn btn-line btn-sm" href="mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}">메일로 보내기</a>
        <button class="btn btn-line btn-sm" type="button" id="copy-form">내용 복사</button>
      </div>`;
    $('#copy-form').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(text); toast('문의 내용을 복사했어요.'); } catch (_) { toast('복사하지 못했어요. 직접 선택해 복사해 주세요.'); }
    });
  }
  done.hidden = false;
  done.scrollIntoView({behavior:'smooth', block:'center'});
});

/* ---------- 헤더 · 메뉴 · 스크롤 ---------- */
const header = $('#header'), nav = $('#nav'), menuBtn = $('#menu-btn');
function setMenu(open){
  nav.classList.toggle('open', open);
  header.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
}
menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
$$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
function onScroll(){
  header.classList.toggle('solid', scrollY > 40);
  $('#to-top').classList.toggle('show', scrollY > 900);
}
addEventListener('scroll', onScroll, {passive:true});
onScroll();

const navLinks = $$('a[href^="#"]', nav);
const spy = new IntersectionObserver(entries => entries.forEach(en => {
  if (en.isIntersecting) navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
}), {rootMargin:'-45% 0px -50% 0px'});
$$('main > section[id]').forEach(s => spy.observe(s));

const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
}), {threshold:.12});
$$('.reveal').forEach(el => io.observe(el));

/* ---------- 주소창에 #top, #contact 같은 표시를 남기지 않고 이동 ---------- */
function scrollToId(id){
  if (id === 'top'){ scrollTo({top:0, behavior:'smooth'}); return true; }
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({behavior:'smooth', block:'start'});
  return true;
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const id = a.getAttribute('href').slice(1);
  if (!id || !scrollToId(id)) return;
  e.preventDefault();
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  if (id === 'contact' && a.dataset.prefill) setTimeout(() => $('#contact-form [name=name]').focus({preventScroll:true}), 600);
});
// 다른 곳에서 #주소로 들어온 경우에도 해당 위치로 이동한 뒤 주소는 깔끔하게
if (location.hash){
  const id = decodeURIComponent(location.hash.slice(1));
  history.replaceState(null, '', location.pathname + location.search);
  addEventListener('load', () => scrollToId(id));
}
addEventListener('hashchange', () => {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  history.replaceState(null, '', location.pathname + location.search);
  scrollToId(id);
});
