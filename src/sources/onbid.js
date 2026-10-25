// 온비드 물건정보 조회 (공공데이터포털 "한국자산관리공사_온비드 물건정보조회서비스")
// 처분방식 0002(임대·대부) + 물건명에 "폐교"가 들어간 물건만 가져온다.
// 공공데이터포털에서 오퍼레이션 주소가 바뀌면 ONBID_API_URL 환경변수로 덮어쓸 수 있다.
import { XMLParser } from 'fast-xml-parser';
import { normalizeDate } from '../filter.js';

const API_URL =
  process.env.ONBID_API_URL ||
  'http://openapi.onbid.co.kr/openapi/services/ThingInfoInquireSvc/getUnifyUsageCltr';
const PAGE_SIZE = 100;
const MAX_PAGES = 3;

// 공공데이터포털은 인코딩 키(%2B…)와 디코딩 키를 함께 준다. 어느 쪽을 넣어도 동작하게 한다.
function encodeServiceKey(key) {
  return /%[0-9A-Fa-f]{2}/.test(key) ? key : encodeURIComponent(key);
}

function toArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

async function fetchPage(key, pageNo) {
  const params = new URLSearchParams({
    numOfRows: String(PAGE_SIZE),
    pageNo: String(pageNo),
    DPSL_MTD_CD: '0002',
    CLTR_NM: '폐교',
  });
  const url = `${API_URL}?serviceKey=${encodeServiceKey(key)}&${params}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`온비드 HTTP ${res.status}`);

  const xml = await res.text();
  const doc = new XMLParser({ parseTagValue: false }).parse(xml);
  // 인증키 오류 등은 OpenAPI_ServiceResponse 형태로 온다.
  const fault = doc.OpenAPI_ServiceResponse?.cmmMsgHeader;
  if (fault) throw new Error(`온비드 오류: ${fault.returnAuthMsg || fault.errMsg}`);

  const header = doc.response?.header;
  if (!header) throw new Error(`온비드 응답 형식을 알 수 없습니다: ${xml.slice(0, 200)}`);
  if (header.resultCode && header.resultCode !== '00') {
    throw new Error(`온비드 오류 ${header.resultCode}: ${header.resultMsg}`);
  }
  const body = doc.response.body ?? {};
  return { items: toArray(body.items?.item), total: Number(body.totalCount || 0) };
}

export async function fetchOnbid() {
  const key = process.env.ONBID_SERVICE_KEY;
  if (!key) throw new Error('ONBID_SERVICE_KEY가 설정되지 않았습니다');

  const rows = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { items, total } = await fetchPage(key, page);
    rows.push(...items);
    if (items.length < PAGE_SIZE || rows.length >= total) break;
  }

  return rows
    .filter((r) => r.CLTR_NM && String(r.CLTR_NM).includes('폐교'))
    // API가 처분방식 조건을 무시하는 경우를 대비해 한 번 더 거른다.
    .filter((r) => !r.DPSL_MTD_NM || /임대|대부/.test(r.DPSL_MTD_NM))
    .map((r) => {
      const address = r.NMRD_ADRS || r.LDNM_ADRS || '';
      const mgmtNo = r.CLTR_MNMT_NO || '';
      const org = r.ORG_NM || r.EXCT_ORG_NM || r.RQST_ORG_NM || '온비드';
      const price = r.MIN_BID_PRC ? `최저입찰가 ${Number(r.MIN_BID_PRC).toLocaleString('ko-KR')}원` : '';
      return {
        // 같은 물건이 회차만 바뀌어 다시 올라오면 새 공고로 본다.
        id: `onbid:${r.CLTR_NO || mgmtNo}:${r.PBCT_NO || ''}`,
        source: '온비드',
        category: '폐교임대',
        title: String(r.CLTR_NM).trim(),
        org: mgmtNo ? `${org} (물건관리번호 ${mgmtNo})` : org,
        period: [r.PBCT_BEGN_DTM, r.PBCT_CLS_DTM].filter(Boolean).join(' ~ '),
        deadline: normalizeDate(r.PBCT_CLS_DTM),
        url:
          r.CLTR_NO && r.PLNM_NO && r.PBCT_NO
            ? `https://www.onbid.co.kr/op/cta/cltrdtl/collateralRealEstateDetail.do?cltrNo=${r.CLTR_NO}&plnmNo=${r.PLNM_NO}&pbctNo=${r.PBCT_NO}`
            : 'https://www.onbid.co.kr',
        summary: [address, r.DPSL_MTD_NM, r.GOODS_NM, price].filter(Boolean).join(' / '),
        regionText: `${address} ${r.CLTR_NM} ${org}`,
        text: [r.CLTR_NM, address, org, r.GOODS_NM].filter(Boolean).join(' '),
      };
    });
}
