// 기업마당 정책정보 API (https://www.bizinfo.go.kr → 활용정보 → 정책정보 개방 → API 신청)
// 응답 형식: { "jsonArray": [ { pblancId, pblancNm, pblancUrl, jrsdInsttNm, excInsttNm,
//   reqstBeginEndDe, bsnsSumryCn, hashtags, trgetNm, ... } ] }
import { lastDateIn } from '../filter.js';

const API_URL = process.env.BIZINFO_API_URL || 'https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do';
const BASE_URL = 'https://www.bizinfo.go.kr';

// HTML 태그·엔티티를 걷어내 필터와 Claude 판단에 쓸 평문으로 만든다.
function stripHtml(s = '') {
  return String(s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchBizinfo() {
  const key = process.env.BIZINFO_API_KEY;
  if (!key) throw new Error('BIZINFO_API_KEY가 설정되지 않았습니다');

  const params = new URLSearchParams({
    crtfcKey: key,
    dataType: 'json',
    searchCnt: process.env.BIZINFO_SEARCH_CNT || '200',
  });
  const res = await fetch(`${API_URL}?${params}`, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`기업마당 HTTP ${res.status}`);

  const body = await res.text();
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    throw new Error(`기업마당 응답이 JSON이 아닙니다: ${body.slice(0, 200)}`);
  }
  const rows = data.jsonArray ?? data.items ?? [];
  if (!Array.isArray(rows)) throw new Error('기업마당 응답에 jsonArray가 없습니다');

  return rows
    .filter((r) => r.pblancId && r.pblancNm)
    .map((r) => {
      const summary = stripHtml(r.bsnsSumryCn).slice(0, 1500);
      const url = r.pblancUrl
        ? r.pblancUrl.startsWith('http') ? r.pblancUrl : BASE_URL + r.pblancUrl
        : `${BASE_URL}/web/lay1/bbs/S1T122C128/AS/74/view.do?pblancId=${r.pblancId}`;
      return {
        id: `bizinfo:${r.pblancId}`,
        source: '기업마당',
        category: '지원사업',
        title: stripHtml(r.pblancNm),
        org: [r.jrsdInsttNm, r.excInsttNm].filter(Boolean).join(' / '),
        period: r.reqstBeginEndDe || '',
        deadline: lastDateIn(r.reqstBeginEndDe),
        url,
        summary,
        // 지역 판별용: 공고명·기관명 + 해시태그(지역명이 해시태그로 붙는 경우가 많다)
        regionText: `${r.pblancNm} ${r.jrsdInsttNm || ''} ${r.excInsttNm || ''}`,
        tags: String(r.hashtags || '').split(',').map((t) => t.trim()).filter(Boolean),
        // 키워드 판별용 텍스트
        text: [r.pblancNm, r.hashtags, r.trgetNm, r.jrsdInsttNm, r.excInsttNm, summary]
          .filter(Boolean)
          .join(' '),
      };
    });
}
