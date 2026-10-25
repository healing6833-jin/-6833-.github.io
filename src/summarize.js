// 필터를 통과한 공고를 Claude에게 보내 적합도(상/중/하)·이유·마감일·분류를 JSON으로 받는다.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { normalizeDate } from './filter.js';

const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';
const CONCURRENCY = 3;

const Judgement = z.object({
  fit: z.enum(['상', '중', '하']),
  reason: z.string().describe('한 줄 이유 (60자 이내)'),
  deadline: z.string().describe('마감일 YYYY-MM-DD. 상시·예산소진시 등 알 수 없으면 빈 문자열'),
  category: z.enum(['지원사업', '폐교임대', '강사모집']),
});

const SYSTEM = `당신은 공고 적합도 심사자입니다.
신청 주체: 경북 경산의 1인 기업 "훼이맵". 아로마테라피 기반 웰니스 제품 제작·판매, 1:1 아로마 상담,
교육 프로그램을 운영하며, 오프라인 공방·체험 공간(폐교 임대·대부 포함)도 검토 중입니다.

판단 기준:
- 상: 이 기업이 신청 자격을 갖추고 사업 내용과 직접 맞음 (예: 1인·소상공인·여성·창업 지원, 화장품·웰니스·교육·체험 콘텐츠, 경북/대구/경남 소재 폐교 임대)
- 중: 자격은 되지만 활용도가 간접적이거나 조건 확인이 필요함
- 하: 자격이 안 되거나(업종·규모·지역·업력 불일치) 사업과 무관함
강사 모집 공고는 대표가 아로마테라피 전문성으로 강의할 수 있는지로 판단합니다.
  아로마·향기·조향·천연화장품·비누·캔들·디퓨저 만들기, 힐링·스트레스 관리·명상·심리 정서 프로그램,
  웰니스·자기돌봄 교육 등 (평생학습관·문화센터·주민자치센터·복지관·보건소·여성인력개발센터·학교 방과후·
  기업 교육 등). 대구·경북·경남 거창권에서 출강 가능하면 상, 주제가 간접적이면 중, 전혀 다른 분야
  (코딩·어학·체육 등)이거나 자격 요건이 맞지 않으면 하.
category는 폐교·유휴시설 임대/대부 물건이면 "폐교임대", 강사·강의·프로그램 운영자 모집이면 "강사모집",
그 외 지원·모집 공고는 "지원사업".
deadline은 공고에 나온 신청 마감일(YYYY-MM-DD)을 쓰고, 알 수 없으면 빈 문자열로 둡니다.`;

let client;

async function judgeOne(item) {
  client ??= new Anthropic();
  const content = [
    `출처: ${item.source}`,
    `공고명: ${item.title}`,
    `기관: ${item.org}`,
    `기간: ${item.period || '정보 없음'}`,
    `내용: ${item.summary || '정보 없음'}`,
  ].join('\n');

  const res = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    // 안전 분류기가 요청을 거절하면 서버가 기본 대체 모델로 다시 처리한다.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: betaZodOutputFormat(Judgement) },
    system: SYSTEM,
    messages: [{ role: 'user', content }],
  });

  if (res.stop_reason === 'refusal' || !res.parsed_output) {
    throw new Error(`판단 결과 없음 (stop_reason: ${res.stop_reason})`);
  }
  const out = res.parsed_output;
  return {
    ...item,
    fit: out.fit,
    reason: out.reason.trim(),
    deadline: normalizeDate(out.deadline) || item.deadline,
    category: out.category,
  };
}

/**
 * 각 공고에 판단 결과를 붙여 돌려준다.
 * judged: 판단에 성공한 공고 전부("하" 포함, seen 기록용), errors: 실패한 공고 수
 */
export async function judgeItems(items) {
  const judged = [];
  let errors = 0;
  const queue = [...items];

  async function worker() {
    while (queue.length) {
      const item = queue.shift();
      try {
        judged.push(await judgeOne(item));
      } catch (err) {
        errors++;
        console.error(`[Claude] "${item.title}" 판단 실패: ${err.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { judged, errors };
}
