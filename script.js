/* =========================================
   훼이맵 - Aromatherapy Personal Page
   ========================================= */

// ▼ 연락처 정보는 여기만 수정하면 페이지 전체에 반영됩니다.
const SITE = {
  phone: "010-0000-0000",
  email: "hello@example.com",
  instagram: "@faymap",           // 인스타그램 아이디
  address: "OO시 OO구 OO로 00, 0층",
  hours: "평일 10:00 – 20:00\n토요일 10:00 – 17:00 (일요일 휴무)",
};

// 에센셜 오일 20종 (향기카드)
// featured: '훼이맵이 사랑하는 향' 섹션에 노출
// state / message / tip: 향기카드 진단에서 '지금의 나 / 내게 필요한 것 / 셀프케어' 풀이
const OILS = [
  {
    id: "lavender", emoji: "💜", name: "라벤더", en: "LAVENDER", color: "#cdbde6", family: "floral", featured: true,
    keyword: "편안함 · 안정",
    desc: "가장 사랑받는 아로마 오일. 부드러운 플로럴 향이 긴장을 풀어주고 편안한 휴식과 숙면 분위기를 만들어 줍니다.",
    tags: ["릴렉스", "숙면", "스트레스"],
    state: "긴장이 오래 이어져 몸과 마음이 쉬고 싶다는 신호를 보내고 있어요.",
    message: "애쓰지 않아도 괜찮아요. 지금은 잠시 내려놓고 쉬어 가는 용기가 필요해요.",
    tip: "잠들기 전 베개 모서리에 라벤더 한 방울, 그리고 깊은 호흡 세 번.",
  },
  {
    id: "bergamot", emoji: "🍋", name: "베르가못", en: "BERGAMOT", color: "#f3e3a2", family: "citrus", featured: true,
    keyword: "밝음 · 기분전환",
    desc: "상큼하면서도 은은한 시트러스 향. 가라앉은 기분을 밝게 끌어올려 주고 마음을 가볍게 해 줍니다.",
    tags: ["기분전환", "활력", "우울감"],
    state: "마음 한쪽이 조금 무겁고, 웃을 일이 줄어든 요즘이에요.",
    message: "작은 즐거움을 일부러 찾아 주세요. 기분은 사소한 것에서 다시 밝아져요.",
    tip: "햇볕 드는 창가에서 좋아하는 음료 한 잔과 10분의 여유.",
  },
  {
    id: "peppermint", emoji: "🌱", name: "페퍼민트", en: "PEPPERMINT", color: "#bfe3cf", family: "herb", featured: true,
    keyword: "상쾌함 · 집중",
    desc: "시원하고 청량한 향이 머리를 맑게 해 줍니다. 피곤하거나 집중이 필요할 때 좋은 향이에요.",
    tags: ["집중", "리프레시", "두통 완화"],
    state: "생각이 많아 머리가 꽉 찬 듯하고, 쉽게 지치는 상태예요.",
    message: "해야 할 일을 줄이고, 머리를 환기시킬 틈을 만들어 주세요.",
    tip: "손목에 페퍼민트 향을 살짝 묻히고 바깥 공기를 5분간 마셔 보세요.",
  },
  {
    id: "frankincense", emoji: "🕯️", name: "프랑킨센스", en: "FRANKINCENSE", color: "#e6d3b8", family: "wood", featured: true,
    keyword: "깊은 호흡 · 명상",
    desc: "따뜻하고 깊이 있는 레진 향. 호흡을 깊고 느리게 만들어 주어 명상과 페이셜 케어에 자주 사용됩니다.",
    tags: ["명상", "페이셜", "안정"],
    state: "바쁜 일상 속에서 나 자신과 대화할 시간이 부족했어요.",
    message: "조용히 머무는 시간 속에서 답을 찾을 수 있어요. 호흡을 천천히 해 보세요.",
    tip: "하루 5분, 눈을 감고 들숨과 날숨만 바라보는 명상.",
  },
  {
    id: "rosemary", emoji: "🌿", name: "로즈마리", en: "ROSEMARY", color: "#c9dbc2", family: "herb", featured: true,
    keyword: "맑음 · 활력",
    desc: "허브 특유의 청량하고 쌉쌀한 향. 머리를 맑게 하고 몸에 생기를 불어넣어 줍니다.",
    tags: ["활력", "집중", "두피케어"],
    state: "의욕은 있는데 몸이 따라주지 않아 답답함을 느끼고 있어요.",
    message: "가벼운 움직임으로 몸을 깨우면 마음도 함께 맑아져요.",
    tip: "아침 스트레칭과 함께 로즈마리 향으로 하루를 시작하기.",
  },
  {
    id: "geranium", emoji: "🌸", name: "제라늄", en: "GERANIUM", color: "#f2c7cf", family: "floral", featured: true,
    keyword: "균형 · 여성스러움",
    desc: "장미를 닮은 달콤한 플로럴 향. 감정의 균형을 잡아주고 피부 컨디션 케어에도 사랑받는 오일입니다.",
    tags: ["밸런스", "피부", "감정 안정"],
    state: "감정의 오르내림이 커서 스스로도 지치는 시기예요.",
    message: "흔들리는 나를 탓하지 말고, 균형을 찾아가는 과정임을 믿어 주세요.",
    tip: "오늘의 감정을 짧게 적어 보는 하루 한 줄 일기.",
  },
  {
    id: "orange", emoji: "🍊", name: "스위트 오렌지", en: "SWEET ORANGE", color: "#f8cfa2", family: "citrus", featured: true,
    keyword: "행복 · 따뜻함",
    desc: "누구나 좋아하는 달콤하고 따뜻한 향. 긴장을 풀어주고 기분 좋은 웃음을 되찾아 줍니다.",
    tags: ["행복감", "릴렉스", "아이도 OK"],
    state: "책임감에 웃음이 줄고 어깨가 잔뜩 굳어 있어요.",
    message: "어린아이처럼 단순하게 즐거워해도 괜찮아요.",
    tip: "좋아하는 음악을 틀고 오렌지 향 가득한 공간에서 쉬어 가기.",
  },
  {
    id: "cedarwood", emoji: "🌲", name: "시더우드", en: "CEDARWOOD", color: "#d7c6b0", family: "wood", featured: true,
    keyword: "그라운딩 · 숙면",
    desc: "숲속에 있는 듯한 포근한 나무 향. 마음을 차분히 가라앉혀 주어 잠들기 전 사용하기 좋아요.",
    tags: ["숙면", "그라운딩", "안정"],
    state: "잠이 얕고, 마음이 붕 떠 있는 듯 불안정해요.",
    message: "발을 땅에 딛듯, 일상의 작은 루틴으로 나를 붙잡아 주세요.",
    tip: "잠들기 전 같은 시간에 불을 끄는 나만의 수면 루틴 만들기.",
  },
  {
    id: "rose", emoji: "🌹", name: "로즈", en: "ROSE", color: "#efb8c2", family: "floral",
    keyword: "자기사랑 · 위로",
    desc: "꽃의 여왕이라 불리는 깊고 우아한 향. 나를 아끼고 사랑하는 마음을 일깨워 줍니다.",
    tags: ["자기사랑", "위로", "피부"],
    state: "다른 사람을 챙기느라 정작 나를 돌보지 못했어요.",
    message: "가장 먼저 사랑받아야 할 사람은 바로 나 자신이에요.",
    tip: "나를 위한 작은 선물 하나, 거울 속 나에게 다정한 한마디.",
  },
  {
    id: "ylangylang", emoji: "🌺", name: "일랑일랑", en: "YLANG YLANG", color: "#f5dfa0", family: "floral",
    keyword: "이완 · 감성",
    desc: "이국적이고 달콤한 꽃향. 긴장을 풀고 닫혀 있던 감각을 부드럽게 열어 줍니다.",
    tags: ["이완", "감성", "자신감"],
    state: "늘 긴장한 채로 지내 마음의 문이 조금 닫혀 있어요.",
    message: "감정을 솔직하게 느끼고 표현해도 괜찮아요.",
    tip: "따뜻한 물에 손을 담그고 좋아하는 향을 천천히 음미하기.",
  },
  {
    id: "chamomile", emoji: "🌼", name: "로만 캐모마일", en: "ROMAN CHAMOMILE", color: "#f4e7b5", family: "floral",
    keyword: "진정 · 포근함",
    desc: "사과를 닮은 순하고 포근한 향. 예민해진 마음을 부드럽게 달래 줍니다.",
    tags: ["진정", "숙면", "예민함"],
    state: "작은 일에도 쉽게 예민해지고 마음이 날카로워져 있어요.",
    message: "스스로에게 조금 더 너그러워져 주세요. 충분히 잘하고 있어요.",
    tip: "따뜻한 캐모마일 차 한 잔과 함께 일찍 잠자리에 들기.",
  },
  {
    id: "lemon", emoji: "☀️", name: "레몬", en: "LEMON", color: "#f6ec9c", family: "citrus",
    keyword: "정화 · 산뜻함",
    desc: "밝고 깨끗한 상큼함. 머리를 맑게 하고 공간을 산뜻하게 환기해 줍니다.",
    tags: ["정화", "집중", "리프레시"],
    state: "정리되지 않은 일들이 쌓여 마음이 어수선해요.",
    message: "하나씩 비우고 정리하면 새로운 에너지가 들어올 자리가 생겨요.",
    tip: "책상 위 한 구역만 정리하고, 레몬 향으로 공간을 환기하기.",
  },
  {
    id: "grapefruit", emoji: "🌅", name: "그레이프프루트", en: "GRAPEFRUIT", color: "#f6c1ae", family: "citrus",
    keyword: "가벼움 · 자신감",
    desc: "쌉쌀하면서 경쾌한 시트러스 향. 무거운 기분을 털어내고 몸과 마음을 가볍게 만들어 줍니다.",
    tags: ["활력", "자신감", "기분전환"],
    state: "스스로에 대한 기대가 높아 마음이 무겁고 위축되어 있어요.",
    message: "지금 모습 그대로도 충분히 빛나요. 가볍게 한 걸음만 내디뎌 보세요.",
    tip: "가벼운 산책이나 좋아하는 노래에 맞춰 몸을 흔들어 보기.",
  },
  {
    id: "eucalyptus", emoji: "🍃", name: "유칼립투스", en: "EUCALYPTUS", color: "#b9dcd6", family: "herb",
    keyword: "호흡 · 환기",
    desc: "시원하게 뚫리는 청량한 향. 답답한 숨과 마음을 시원하게 열어 줍니다.",
    tags: ["호흡", "상쾌함", "환기"],
    state: "숨이 턱 막힐 만큼 답답한 상황 속에 있어요.",
    message: "크게 숨을 들이쉬어 보세요. 막힌 곳에 바람이 통하면 길이 보여요.",
    tip: "따뜻한 물에 유칼립투스 한 방울을 떨어뜨려 김을 천천히 들이마시기.",
  },
  {
    id: "teatree", emoji: "🪴", name: "티트리", en: "TEA TREE", color: "#c4ddb8", family: "herb",
    keyword: "보호 · 정화",
    desc: "깨끗하고 강인한 허브 향. 나를 지키는 힘과 맑은 기운을 더해 줍니다.",
    tags: ["정화", "보호", "트러블 케어"],
    state: "바깥의 자극과 사람들 사이에서 많이 소모되어 있어요.",
    message: "나를 지키는 건강한 경계를 세워도 괜찮아요. 거절도 나를 위한 돌봄이에요.",
    tip: "알림을 모두 끄고 나만의 시간을 지키는 '방해 금지' 한 시간.",
  },
  {
    id: "clarysage", emoji: "💫", name: "클라리세이지", en: "CLARY SAGE", color: "#d3c9e4", family: "herb",
    keyword: "직관 · 균형",
    desc: "허브 향이 감도는 따뜻하고 묵직한 향. 복잡한 감정을 정리하고 직관을 깨워 줍니다.",
    tags: ["균형", "직관", "여성 케어"],
    state: "머릿속은 복잡한데 정작 무엇을 원하는지 잘 모르겠어요.",
    message: "생각보다 느낌을 믿어 보세요. 마음은 이미 답을 알고 있어요.",
    tip: "떠오르는 생각을 멈추지 않고 써 내려가는 10분 글쓰기.",
  },
  {
    id: "sandalwood", emoji: "🪵", name: "샌달우드", en: "SANDALWOOD", color: "#e2cbb0", family: "wood",
    keyword: "고요 · 깊은 안정",
    desc: "부드럽고 크리미한 나무 향. 마음을 고요하게 하고 깊은 안정감을 줍니다.",
    tags: ["명상", "안정", "보습"],
    state: "쉴 새 없이 달려오느라 마음이 고요할 틈이 없었어요.",
    message: "속도를 늦춰도 늦지 않아요. 고요함 속에서 더 단단해져요.",
    tip: "조명을 낮추고 따뜻한 차와 함께 아무것도 하지 않는 시간 갖기.",
  },
  {
    id: "vetiver", emoji: "🌾", name: "베티버", en: "VETIVER", color: "#cbbf9f", family: "wood",
    keyword: "그라운딩 · 불안 완화",
    desc: "흙내음 가득한 깊은 뿌리 향. '고요의 오일'이라 불리며 흔들리는 마음을 붙잡아 줍니다.",
    tags: ["그라운딩", "불안", "숙면"],
    state: "걱정과 불안이 꼬리를 물어 마음이 쉽게 흔들려요.",
    message: "모든 걸 통제하지 않아도 괜찮아요. 지금 이 순간에만 집중해 보세요.",
    tip: "흙과 나무를 느낄 수 있는 숲길이나 공원을 천천히 걸어 보기.",
  },
  {
    id: "ginger", emoji: "🫚", name: "진저", en: "GINGER", color: "#efcf9a", family: "spice",
    keyword: "온기 · 용기",
    desc: "따뜻하고 알싸한 향. 몸에 온기를 더하고 앞으로 나아갈 힘을 북돋아 줍니다.",
    tags: ["온기", "용기", "순환"],
    state: "몸이 차고 무기력해서 무언가를 시작할 힘이 부족해요.",
    message: "작은 불씨 하나면 충분해요. 오늘 할 수 있는 한 가지부터 시작해 보세요.",
    tip: "따뜻한 생강차를 마시고 손발을 따뜻하게 감싸 주기.",
  },
  {
    id: "blackpepper", emoji: "⚫", name: "블랙페퍼", en: "BLACK PEPPER", color: "#c9b8ad", family: "spice",
    keyword: "결단 · 추진력",
    desc: "따뜻하고 스파이시한 향. 굳은 몸을 풀어 주고 결단력과 추진력을 더해 줍니다.",
    tags: ["결단력", "근육 이완", "활력"],
    state: "결정을 미루며 같은 자리를 맴돌고 있어요.",
    message: "완벽한 때는 오지 않아요. 지금 내딛는 한 걸음이 길을 만들어요.",
    tip: "미뤄 둔 일 하나를 오늘 끝내고 스스로를 듬뿍 칭찬하기.",
  },
];

// 향 계열별 종합 진단
const FAMILIES = {
  floral: {
    label: "플로럴", emoji: "🌸", program: "아로마 페이셜 케어",
    title: "마음이 다정한 위로를 원하고 있어요",
    desc: "꽃 향기에 끌렸다는 건 감정을 돌보고 따뜻하게 안아 줄 시간이 필요하다는 뜻이에요. 다른 사람보다 나 자신에게 먼저 다정해져 보세요.",
  },
  citrus: {
    label: "시트러스", emoji: "🍊", program: "나만의 블렌딩 클래스",
    title: "가볍고 밝은 에너지가 필요해요",
    desc: "시트러스 향은 무거워진 기분을 환하게 밝혀 줘요. 지금 당신에게는 웃음과 즐거움, 그리고 작은 설렘이 필요해요.",
  },
  herb: {
    label: "허브", emoji: "🌿", program: "헤드 & 숄더 릴렉스",
    title: "머리를 비우고 숨 쉴 틈이 필요해요",
    desc: "허브 향에 끌렸다면 생각과 자극이 너무 많았다는 신호예요. 복잡한 것들을 잠시 내려놓고 맑게 환기하는 시간을 가져 보세요.",
  },
  wood: {
    label: "우디 · 레진", emoji: "🌲", program: "아로마 바디 테라피",
    title: "단단하게 뿌리내릴 휴식이 필요해요",
    desc: "나무와 수지의 향은 흔들리는 마음을 고요히 붙잡아 줘요. 지금은 속도를 늦추고 깊이 쉬며 중심을 되찾을 때예요.",
  },
  spice: {
    label: "스파이스", emoji: "🫚", program: "아로마 바디 테라피",
    title: "몸과 마음에 따뜻한 온기가 필요해요",
    desc: "스파이스 향은 차갑게 식은 에너지에 불을 지펴 줘요. 몸을 따뜻하게 돌보면 다시 나아갈 힘이 생겨요.",
  },
};

// 향기카드 3장의 자리
const SPREAD = [
  { label: "지금의 나", key: "state" },
  { label: "내게 필요한 것", key: "message" },
  { label: "나를 위한 셀프케어", key: "tip" },
];

// 기분별 추천 블렌드
const BLENDS = {
  tired: {
    name: "리프레시 포레스트", oils: ["rosemary", "peppermint", "orange"],
    desc: "지친 몸에 생기를 불어넣는 청량한 블렌드. 맑은 허브향과 달콤한 오렌지가 무거운 몸과 마음을 가볍게 깨워 줍니다.",
    program: "아로마 바디 테라피",
  },
  stress: {
    name: "카밍 가든", oils: ["lavender", "bergamot", "geranium"],
    desc: "복잡한 생각을 내려놓게 하는 부드러운 플로럴 블렌드. 굳어 있던 어깨와 마음이 천천히 풀어지는 걸 느껴 보세요.",
    program: "헤드 & 숄더 릴렉스",
  },
  sleep: {
    name: "딥 슬립 나이트", oils: ["lavender", "cedarwood", "orange"],
    desc: "포근한 나무 향과 라벤더가 하루의 긴장을 감싸 주는 블렌드. 편안한 밤을 위한 준비를 도와드려요.",
    program: "아로마 바디 테라피",
  },
  focus: {
    name: "클리어 마인드", oils: ["peppermint", "rosemary", "frankincense"],
    desc: "머리를 맑게 정돈해 주는 블렌드. 시원한 민트와 깊은 프랑킨센스가 흐트러진 집중력을 모아 줍니다.",
    program: "헤드 & 숄더 릴렉스",
  },
  blue: {
    name: "선샤인 모먼트", oils: ["bergamot", "orange", "geranium"],
    desc: "햇살 같은 시트러스와 달콤한 플로럴의 만남. 가라앉은 기분에 따뜻한 빛을 비춰 주는 블렌드입니다.",
    program: "아로마 페이셜 케어",
  },
  fresh: {
    name: "모닝 브리즈", oils: ["peppermint", "bergamot", "frankincense"],
    desc: "아침 공기처럼 상쾌한 블렌드. 묵은 기분을 털어내고 새롭게 시작하고 싶을 때 추천해요.",
    program: "아로마 페이셜 케어",
  },
};

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const oilById = (id) => OILS.find((o) => o.id === id);
const oilChips = (ids) =>
  ids.map(oilById).map((o) => `<span class="chip">${o.emoji} ${o.name}</span>`).join("");

// 추천 결과를 예약 문의 폼에 미리 채우기
function prefillContact(program, message) {
  $("#program").value = program;
  $("#message").value = message;
}

/* ---------- 연락처 채우기 ---------- */
function fillConfig() {
  $$("[data-config]").forEach((el) => {
    const key = el.dataset.config;
    const value = SITE[key];
    if (!value) return;
    el.textContent = value;
    if (key === "phone") el.href = `tel:${value.replace(/[^0-9+]/g, "")}`;
    if (key === "email") el.href = `mailto:${value}`;
    if (key === "instagram") el.href = `https://instagram.com/${value.replace("@", "")}`;
  });
  $("#year").textContent = new Date().getFullYear();
}

/* ---------- 헤더 / 메뉴 ---------- */
function initHeader() {
  const header = $("#header");
  const nav = $("#nav");
  const menuBtn = $("#menuBtn");
  const toTop = $("#toTop");

  const closeMenu = () => {
    nav.classList.remove("is-open");
    menuBtn.classList.remove("is-open");
    header.classList.remove("menu-open");
    menuBtn.setAttribute("aria-expanded", "false");
  };

  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    menuBtn.classList.toggle("is-open", open);
    header.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  $$("a", nav).forEach((a) => a.addEventListener("click", closeMenu));

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 20);
    toTop.classList.toggle("is-visible", y > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // 현재 섹션 메뉴 강조
  const links = $$("a[href^='#']", nav);
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === `#${entry.target.id}`));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$("main section[id]").forEach((s) => spy.observe(s));
}

/* ---------- 스크롤 등장 효과 ---------- */
function initReveal() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  $$(".reveal").forEach((el) => io.observe(el));
}

/* ---------- 오일 카드 + 모달 ---------- */
function initOils() {
  const grid = $("#oilGrid");
  grid.innerHTML = OILS.filter((o) => o.featured).map(
    (o) => `
      <button class="oil reveal" data-oil="${o.id}" style="--oil-color:${o.color}">
        <span class="oil__emoji">${o.emoji}</span>
        <p class="oil__name">${o.name}</p>
        <p class="oil__en">${o.en}</p>
        <p class="oil__keyword">${o.keyword}</p>
      </button>`
  ).join("");

  const modal = $("#oilModal");
  let lastFocus = null;

  const open = (oil) => {
    lastFocus = document.activeElement;
    $("#modalEmoji").textContent = oil.emoji;
    $("#modalTitle").textContent = oil.name;
    $("#modalEn").textContent = oil.en;
    $("#modalDesc").textContent = oil.desc;
    $("#modalTags").innerHTML = oil.tags.map((t) => `<span class="chip">#${t}</span>`).join("");
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    $(".modal__close", modal).focus();
  };
  const close = () => {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  };

  // 오일 카드와 향기카드 결과 카드 모두 눌러서 상세 보기
  document.addEventListener("click", (e) => {
    const card = e.target.closest("[data-oil]");
    if (card) open(oilById(card.dataset.oil));
  });
  $$("[data-close]", modal).forEach((el) => el.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
}

/* ---------- 향기카드 진단 ---------- */
function initScentCards() {
  const PICK = SPREAD.length;
  const intro = $("#deckIntro");
  const deck = $("#deck");
  const grid = $("#deckGrid");
  const status = $("#deckStatus");
  const reading = $("#reading");
  const spread = $("#spread");
  const summary = $("#readingSummary");
  let picked = [];
  let timers = [];

  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const cardHTML = (oil, attrs = "", style = "") => `
    <button class="scard" style="--c:${oil.color};${style}" ${attrs}>
      <span class="scard__inner">
        <span class="scard__back" aria-hidden="true">❀</span>
        <span class="scard__front">
          <span class="scard__emoji">${oil.emoji}</span>
          <b>${oil.name}</b>
          <small>${oil.en}</small>
          <em>${oil.keyword}</em>
        </span>
      </span>
    </button>`;

  const updateStatus = () => {
    status.innerHTML = picked.length < PICK
      ? `마음이 끌리는 카드를 골라 주세요 <b>${picked.length} / ${PICK}</b>`
      : "카드를 펼치는 중이에요…";
  };

  const deal = () => {
    timers.forEach(clearTimeout);
    timers = [];
    picked = [];
    intro.hidden = true;
    reading.hidden = true;
    summary.hidden = true;
    deck.hidden = false;
    grid.classList.remove("is-done");

    grid.innerHTML = shuffle(OILS)
      .map((oil, i) => cardHTML(oil, `data-pick="${oil.id}" aria-label="향기카드 ${i + 1}번"`, `animation-delay:${i * 35}ms`))
      .join("");
    updateStatus();
  };

  grid.addEventListener("click", (e) => {
    const card = e.target.closest("[data-pick]");
    if (!card || picked.length >= PICK) return;

    const id = card.dataset.pick;
    const idx = picked.indexOf(id);
    if (idx > -1) {
      // 다시 누르면 선택 취소
      picked.splice(idx, 1);
      card.classList.remove("is-picked");
      card.querySelector(".scard__order")?.remove();
      $$(".scard.is-picked", grid).forEach((c) => {
        c.querySelector(".scard__order").textContent = picked.indexOf(c.dataset.pick) + 1;
      });
    } else {
      picked.push(id);
      card.classList.add("is-picked");
      card.insertAdjacentHTML("beforeend", `<span class="scard__order">${picked.length}</span>`);
    }
    updateStatus();

    if (picked.length === PICK) {
      grid.classList.add("is-done");
      timers.push(setTimeout(showReading, 700));
    }
  });

  function showReading() {
    deck.hidden = true;
    reading.hidden = false;
    const oils = picked.map(oilById);

    spread.innerHTML = oils
      .map((oil, i) => `
        <div class="spread-item">
          <span class="spread-item__label">${i + 1}. ${SPREAD[i].label}</span>
          ${cardHTML(oil, `data-oil="${oil.id}" aria-label="${oil.name} 자세히 보기"`)}
          <p class="spread-item__text"><strong>${oil.name}</strong>${oil[SPREAD[i].key]}</p>
        </div>`)
      .join("");
    reading.scrollIntoView({ behavior: "smooth", block: "start" });

    // 한 장씩 뒤집기
    $$(".spread-item", spread).forEach((item, i) => {
      timers.push(setTimeout(() => {
        $(".scard", item).classList.add("is-flipped");
        item.classList.add("is-open");
      }, 600 + i * 700));
    });
    timers.push(setTimeout(() => renderSummary(oils), 600 + PICK * 700 + 300));
  }

  function renderSummary(oils) {
    // 가장 많이 나온 향 계열 (동률이면 '내게 필요한 것' 카드의 계열 우선)
    const counts = {};
    oils.forEach((o) => { counts[o.family] = (counts[o.family] || 0) + 1; });
    const max = Math.max(...Object.values(counts));
    const top = Object.keys(counts).filter((f) => counts[f] === max);
    const familyKey = top.includes(oils[1].family) ? oils[1].family : top[0];
    const family = FAMILIES[familyKey];
    const ids = oils.map((o) => o.id);

    const bars = Object.entries(FAMILIES)
      .map(([key, f]) => {
        const n = counts[key] || 0;
        return `<div class="summary__bar"><span>${f.emoji} ${f.label}</span><i style="--w:${(n / PICK) * 100}%"></i><span>${n}장</span></div>`;
      })
      .join("");

    summary.innerHTML = `
      <p class="summary__family">${family.emoji} 나의 향기 유형 · ${family.label}</p>
      <h3 class="summary__title">${family.title}</h3>
      <p class="summary__desc">${family.desc}</p>
      <div class="summary__bars">${bars}</div>
      <div class="summary__box">
        <div>
          <h4>나를 위한 향기 블렌드</h4>
          <div class="result__oils">${oilChips(ids)}</div>
        </div>
        <div>
          <h4>추천 케어 프로그램</h4>
          <p>${family.program}</p>
        </div>
      </div>
      <div class="summary__actions">
        <a href="#contact" class="btn btn--primary btn--sm" id="cardCta">이 결과로 상담 예약하기</a>
        <button class="btn btn--ghost btn--sm" id="redrawBtn">카드 다시 뽑기</button>
      </div>
      <p class="summary__note">향기카드 진단은 지금의 마음을 돌아보는 도구예요. 방문하시면 직접 향을 맡아 보며 더 자세히 상담해 드릴게요.</p>`;
    summary.hidden = false;

    $("#cardCta").addEventListener("click", () => {
      const names = oils.map((o, i) => `${SPREAD[i].label}: ${o.name}`).join(" / ");
      prefillContact(family.program, `[향기카드 진단 - ${family.label} 유형] ${names}\n이 결과로 상담받고 싶어요.`);
    });
    $("#redrawBtn").addEventListener("click", () => {
      deal();
      $("#cards").scrollIntoView({ behavior: "smooth" });
    });
  }

  $("#shuffleBtn").addEventListener("click", deal);
}

/* ---------- 나의 향 찾기 ---------- */
function initFinder() {
  const result = $("#result");
  let selected = null;

  $("#moodList").addEventListener("click", (e) => {
    const btn = e.target.closest(".mood");
    if (!btn) return;
    $$(".mood").forEach((m) => m.classList.toggle("is-selected", m === btn));

    selected = BLENDS[btn.dataset.mood];
    $("#resultName").textContent = selected.name;
    $("#resultOils").innerHTML = oilChips(selected.oils);
    $("#resultDesc").textContent = `${selected.desc} 추천 프로그램: ${selected.program}`;

    result.hidden = false;
    // 애니메이션 다시 실행
    const card = $(".result__card", result);
    card.style.animation = "none";
    void card.offsetWidth;
    card.style.animation = "";
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  $("#resultCta").addEventListener("click", () => {
    if (!selected) return;
    const names = selected.oils.map((id) => oilById(id).name).join(", ");
    prefillContact(selected.program, `[추천 블렌드: ${selected.name} - ${names}] 이 향으로 받아보고 싶어요.`);
  });
}

/* ---------- 후기 슬라이더 ---------- */
function initSlider() {
  const track = $("#sliderTrack");
  const slides = $$(".review", track);
  const dotsWrap = $("#sliderDots");
  let index = 0;
  let timer;

  dotsWrap.innerHTML = slides.map((_, i) => `<button aria-label="${i + 1}번째 후기"></button>`).join("");
  const dots = $$("button", dotsWrap);

  const go = (i) => {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, j) => d.classList.toggle("is-active", j === index));
  };
  const restart = () => {
    clearInterval(timer);
    timer = setInterval(() => go(index + 1), 5000);
  };

  $("#prevBtn").addEventListener("click", () => { go(index - 1); restart(); });
  $("#nextBtn").addEventListener("click", () => { go(index + 1); restart(); });
  dots.forEach((d, i) => d.addEventListener("click", () => { go(i); restart(); }));

  // 모바일 스와이프
  let startX = null;
  track.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) { go(index + (dx < 0 ? 1 : -1)); restart(); }
    startX = null;
  });

  go(0);
  restart();
}

/* ---------- 예약 문의 폼 ---------- */
function initForm() {
  const form = $("#contactForm");
  const error = $("#formError");
  const date = $("#date");
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  date.min = today.toISOString().split("T")[0];

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const tel = form.tel.value.trim();

    form.name.classList.toggle("is-invalid", !name);
    form.tel.classList.toggle("is-invalid", !/^[0-9\-+\s]{9,}$/.test(tel));

    if (!name) { error.textContent = "성함을 입력해 주세요."; form.name.focus(); return; }
    if (!/^[0-9\-+\s]{9,}$/.test(tel)) { error.textContent = "연락처를 올바르게 입력해 주세요."; form.tel.focus(); return; }
    error.textContent = "";

    const subject = `[훼이맵 예약 문의] ${name} 님 - ${form.program.value}`;
    const body = [
      `성함: ${name}`,
      `연락처: ${tel}`,
      `프로그램: ${form.program.value}`,
      `희망 날짜: ${form.date.value || "미정"}`,
      "",
      "요청사항:",
      form.message.value.trim() || "-",
    ].join("\n");

    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fillConfig();
  initOils();     // 카드를 먼저 만들어야 reveal 대상에 포함됩니다
  initHeader();
  initReveal();
  initScentCards();
  initFinder();
  initSlider();
  initForm();
});
