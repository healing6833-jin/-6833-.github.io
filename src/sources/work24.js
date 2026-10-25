// 고용24(옛 워크넷) 채용정보 OpenAPI에서 아로마테라피로 맡을 수 있는 강사 모집 공고를 찾는다.
// 응답 형식(XML): <wantedRoot><total/><wanted><wantedAuthNo/><company/><title/><region/>
//   <closeDt/><wantedInfoUrl/>...</wanted></wantedRoot>
// 오퍼레이션 주소가 바뀌면 WORK24_API_URL 환경변수로 덮어쓸 수 있다.
import { XMLParser } from 'fast-xml-parser';

const API_URL =
  process.env.WORK24_API_URL ||
  'https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do';
const PAGE_SIZE = 100;

// 아로마테라피 전문성으로 강의할 수 있는 주제. 하나씩 검색해 합친다.
const SEARCH_KEYWORDS = [
  '아로마', '향기', '조향', '천연화장품', '천연비누', '캔들', '디퓨저',
  '힐링', '웰니스', '스트레스', '명상',
];

// 검색 결과 중 실제 강사·강의 모집만 남긴다 (마사지 테라피스트 구인 등은 제외).
const INSTRUCTOR_RE = /강사|강의|교사|지도사|교육|트레이너|체험 ?프로그램/;

function toArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

/** closeDt 예: "25-12-31", "2025-12-31", "채용시까지 25-12-31", "채용시까지" → "2025-12-31" 또는 "" */
function parseCloseDate(v) {
  const s = String(v || '');
  let m = s.match(/(20\d{2})[-./]?(\d{2})[-./]?(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/\b(\d{2})-(\d{2})-(\d{2})\b/);
  return m ? `20${m[1]}-${m[2]}-${m[3]}` : '';
}

async function search(key, keyword) {
  const params = new URLSearchParams({
    authKey: key,
    callTp: 'L',
    returnType: 'XML',
    startPage: '1',
    display: String(PAGE_SIZE),
    keyword,
  });
  const res = await fetch(`${API_URL}?${params}`, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`고용24 HTTP ${res.status}`);

  const xml = await res.text();
  const doc = new XMLParser({ parseTagValue: false }).parse(xml);
  const root = doc.wantedRoot;
  if (!root) throw new Error(`고용24 응답 형식을 알 수 없습니다: ${xml.slice(0, 200)}`);
  if (root.messageCd || root.error) {
    throw new Error(`고용24 오류: ${root.message || root.error || root.messageCd}`);
  }
  return toArray(root.wanted);
}

export async function fetchWork24() {
  const key = process.env.WORK24_API_KEY;
  if (!key) throw new Error('WORK24_API_KEY가 설정되지 않았습니다');

  const rows = new Map();
  for (const keyword of SEARCH_KEYWORDS) {
    for (const r of await search(key, keyword)) {
      if (r.wantedAuthNo) rows.set(r.wantedAuthNo, r);
    }
  }

  return [...rows.values()]
    .filter((r) => INSTRUCTOR_RE.test(`${r.title} ${r.jobsNm || ''}`))
    .map((r) => {
      const address = [r.region, r.basicAddr].filter(Boolean).join(' ');
      return {
        id: `work24:${r.wantedAuthNo}`,
        source: '고용24',
        category: '강사모집',
        title: String(r.title).trim(),
        org: r.company || '',
        period: [r.regDt, r.closeDt].filter(Boolean).join(' ~ '),
        deadline: parseCloseDate(r.closeDt),
        url:
          r.wantedInfoUrl ||
          `https://www.work24.go.kr/wk/a/b/1500/empDetailAuthView.do?wantedAuthNo=${r.wantedAuthNo}`,
        summary: [address, r.sal && `${r.salTpNm || ''} ${r.sal}`.trim(), r.holidayTpNm, r.career]
          .filter(Boolean)
          .join(' / '),
        regionText: `${address} ${r.company || ''}`,
        text: [r.title, r.jobsNm, r.company, address].filter(Boolean).join(' '),
      };
    });
}
