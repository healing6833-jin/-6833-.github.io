// 지역·키워드·제외어·마감일 필터와 날짜 유틸

export const KEYWORDS = [
  '아로마', '맞춤형화장품', '화장품', '웰니스', '헬스케어', '힐링', '심리',
  '1인 창조기업', '소상공인', '여성기업', '창업', '크라우드펀딩', '판로', '콘텐츠',
  '교육서비스', '체험', '공방', '폐교', '폐교 임대', '폐교 활용', '폐교 대부',
  '유휴시설', '빈집',
];

export const EXCLUDE_WORDS = ['제조설비', '반도체', '수출바우처', '농업기계'];

// 포함 지역: 이 중 하나라도 언급되면 통과
const ALLOWED_REGIONS = [/대구/, /경북|경상북도/, /경산/, /경남|경상남도/, /거창/, /경상권|영남/];

// 그 외 시·도: 허용 지역 언급 없이 이것만 있으면 지역 한정 공고로 보고 제외
// "경기"(경기 침체), "대전"(대전환)처럼 일반 단어와 겹치는 이름은 지명으로 쓰인 경우만 잡는다.
const OTHER_REGIONS = [
  /서울/, /부산/, /인천/, /광주/, /대전(?!환)/, /울산/, /세종(?:시|특별)/,
  /경기도|\[경기\]|경기(?=지역|권|북부|남부|도내)/,
  /강원/, /충북|충남|충청/, /전북|전남|전라/, /제주/,
];
const OTHER_REGION_TAGS = new Set([
  '서울', '부산', '인천', '광주', '대전', '울산', '세종', '경기', '강원',
  '충북', '충남', '전북', '전남', '제주',
]);

const compact = (s) => String(s || '').replace(/\s+/g, '');

/** "20241231", "202412311800", "2024.12.31", "2024-12-31 18:00" → "2024-12-31" (모르면 "") */
export function normalizeDate(v) {
  const m = String(v || '').match(/(20\d{2})[-./]?(\d{2})[-./]?(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
}

/** "2024-01-01 ~ 2024-01-31"처럼 기간이 들어간 문자열에서 마지막 날짜(마감일)를 뽑는다. */
export function lastDateIn(v) {
  const all = String(v || '').match(/20\d{2}[-./]?\d{2}[-./]?\d{2}/g);
  return all ? normalizeDate(all[all.length - 1]) : '';
}

/** 오늘 날짜(KST) YYYY-MM-DD */
export function todayKst(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(date);
}

export function regionOk(item) {
  const text = item.regionText || `${item.title} ${item.org}`;
  const tags = item.tags || [];
  const all = `${text} ${tags.join(' ')}`;
  if (ALLOWED_REGIONS.some((re) => re.test(all))) return true;
  if (OTHER_REGIONS.some((re) => re.test(text))) return false;
  if (tags.some((t) => OTHER_REGION_TAGS.has(t))) return false;
  return true; // 지역 언급이 없거나 "전국"이면 전국 대상으로 본다
}

export function keywordOk(item) {
  const text = compact(`${item.title} ${item.text}`);
  if (EXCLUDE_WORDS.some((w) => text.includes(compact(w)))) return false;
  return KEYWORDS.some((w) => text.includes(compact(w)));
}

export function notExpired(item, today = todayKst()) {
  return !item.deadline || item.deadline >= today;
}

export function filterItems(items, today = todayKst()) {
  return items.filter((it) => notExpired(it, today) && regionOk(it) && keywordOk(it));
}
