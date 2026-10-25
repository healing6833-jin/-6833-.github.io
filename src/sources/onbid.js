// 차세대 온비드 부동산 물건목록 조회 (공공데이터포털 "한국자산관리공사_차세대 온비드 부동산 물건목록 조회서비스")
// 상세기능 getRlstCltrList2. 처분방식 0002(임대) 물건 중 물건명에 폐교·학교가 들어간 것만 가져온다.
// 공공데이터포털에서 요청주소가 바뀌면 ONBID_API_URL 환경변수로 덮어쓸 수 있다.
import { XMLParser } from 'fast-xml-parser';
import { normalizeDate } from '../filter.js';

const API_URL =
  process.env.ONBID_API_URL ||
  'https://apis.data.go.kr/B010003/OnbidRlstListSrvc2/getRlstCltrList2';
const PAGE_SIZE = 100;
const MAX_PAGES = 3;

// 폐교는 대부분 공유재산(교육청 소유)이지만 국유·기타일반재산으로 나오기도 해서 전부 조회한다.
const PROPERTY_TYPES = '0007,0010,0005,0004,0002,0003,0006,0008,0011,0013';
// 물건명이 "구 OO초등학교"처럼 폐교라는 말 없이 올라오는 경우도 잡는다.
const NAME_QUERIES = ['폐교', '학교'];
const SCHOOL_RE = /폐교|학교|분교|분장/;

// 공공데이터포털은 인코딩 키(%2B…)와 디코딩 키를 함께 준다. 어느 쪽을 넣어도 동작하게 한다.
function encodeServiceKey(key) {
  return /%[0-9A-Fa-f]{2}/.test(key) ? key : encodeURIComponent(key);
}

function toArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

// 응답 필드 이름이 문서와 조금 달라도 동작하도록, 후보 이름 중 값이 있는 첫 번째를 쓴다.
function pick(r, ...names) {
  for (const n of names) {
    if (r[n] !== undefined && r[n] !== null && r[n] !== '') return String(r[n]).trim();
  }
  return '';
}

function pickByPattern(r, re) {
  const key = Object.keys(r).find((k) => re.test(k) && r[k]);
  return key ? String(r[key]).trim() : '';
}

function parseBody(text) {
  let doc;
  try {
    doc = JSON.parse(text);
  } catch {
    doc = new XMLParser({ parseTagValue: false }).parse(text);
  }
  // 인증키 오류 등은 OpenAPI_ServiceResponse 형태로 온다.
  const fault = doc.OpenAPI_ServiceResponse?.cmmMsgHeader;
  if (fault) throw new Error(`온비드 오류: ${fault.returnAuthMsg || fault.errMsg}`);

  const root = doc.response ?? doc;
  const header = root.header ?? {};
  const code = String(header.resultCode ?? '00');
  if (!['00', '0', '000'].includes(code)) {
    throw new Error(`온비드 오류 ${code}: ${header.resultMsg}`);
  }
  const body = root.body ?? {};
  const items = Array.isArray(body.items) ? body.items : toArray(body.items?.item);
  if (!root.body && !root.header) {
    throw new Error(`온비드 응답 형식을 알 수 없습니다: ${text.slice(0, 200)}`);
  }
  return { items, total: Number(body.totalCount || 0) };
}

async function fetchPage(key, params, pageNo) {
  const query = new URLSearchParams({
    pageNo: String(pageNo),
    numOfRows: String(PAGE_SIZE),
    resultType: 'json',
    ...params,
  });
  const url = `${API_URL}?serviceKey=${encodeServiceKey(key)}&${query}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`온비드 HTTP ${res.status}`);
  return parseBody(await res.text());
}

async function fetchAll(key, params) {
  const rows = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { items, total } = await fetchPage(key, params, page);
    rows.push(...items);
    if (items.length < PAGE_SIZE || rows.length >= total) break;
  }
  return rows;
}

export async function fetchOnbid() {
  const key = process.env.ONBID_SERVICE_KEY;
  if (!key) throw new Error('ONBID_SERVICE_KEY가 설정되지 않았습니다');

  const rows = [];
  for (const name of NAME_QUERIES) {
    // 수의계약 가능/불가 물건을 모두 본다.
    for (const pvctTrgtYn of ['N', 'Y']) {
      rows.push(
        ...(await fetchAll(key, {
          prptDivCd: PROPERTY_TYPES,
          dspsMthodCd: '0002',
          bidDivCd: '0001',
          pvctTrgtYn,
          onbidCltrNm: name,
        })),
      );
    }
  }

  const items = rows.map((r) => {
    const title = pick(r, 'onbidCltrNm', 'cltrNm');
    const mgmtNo = pick(r, 'cltrMngNo', 'cltrMnmtNo');
    const cdtnNo = pick(r, 'pbctCdtnNo');
    const address =
      pick(r, 'cltrAddr', 'ldnmAdrs', 'nmrdAdrs', 'lctnAddr') ||
      [pick(r, 'lctnSdnm'), pick(r, 'lctnSggnm'), pick(r, 'lctnEmdNm')].filter(Boolean).join(' ');
    const org = pick(r, 'orgNm') || '온비드';
    const bidStart = pick(r, 'bidPrdYmdStart', 'bidBgngDt', 'bidBgngDtm') || pickByPattern(r, /^bid.*(Start|Bgng)/i);
    const bidEnd = pick(r, 'bidPrdYmdEnd', 'bidEndDt', 'bidEndDtm', 'bidClsDtm') || pickByPattern(r, /^bid.*(End|Cls)/i);
    const price = pick(r, 'lowstBidPrc');
    return {
      // 같은 물건이 공매조건만 바뀌어 다시 올라오면 새 공고로 본다.
      id: `onbid:${mgmtNo || title}:${cdtnNo}`,
      source: '온비드',
      category: '폐교임대',
      title,
      org: mgmtNo ? `${org} (물건관리번호 ${mgmtNo})` : org,
      period: [bidStart, bidEnd].filter(Boolean).join(' ~ '),
      deadline: normalizeDate(bidEnd),
      // 차세대 온비드는 물건 상세 주소 형식이 공개되어 있지 않아 첫 화면으로 연결하고 물건관리번호를 함께 적는다.
      url: 'https://www.onbid.co.kr',
      summary: [
        address,
        pick(r, 'prptDivNm'),
        pick(r, 'dspsMthodNm'),
        pick(r, 'cltrUsgSclsCtgrNm', 'cltrUsgMclsCtgrNm'),
        price && `최저입찰가 ${Number(price).toLocaleString('ko-KR')}원`,
      ]
        .filter(Boolean)
        .join(' / '),
      regionText: `${address} ${title} ${org}`,
      text: [title, address, org].filter(Boolean).join(' '),
    };
  });

  // 두 검색어·수의계약 여부로 겹쳐 받은 물건은 하나로 합친다.
  return [...new Map(items.filter((it) => SCHOOL_RE.test(it.title)).map((it) => [it.id, it])).values()];
}
