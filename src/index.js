// 매일 실행: 기업마당 지원사업 공고 수집 → 필터 → Claude 판단 → 메일 발송 → data/seen.json 갱신
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fetchBizinfo } from './sources/bizinfo.js';
import { filterItems, todayKst } from './filter.js';
import { judgeItems } from './summarize.js';
import { buildMail, sendMail } from './mailer.js';

const SEEN_PATH = fileURLToPath(new URL('../data/seen.json', import.meta.url));
const SEEN_LIMIT = 5000; // 파일이 끝없이 커지지 않도록 최근 ID만 보관
const DRY_RUN = process.env.DRY_RUN === '1';

const SOURCES = [
  ['기업마당', fetchBizinfo],
];

async function loadSeen() {
  try {
    const data = JSON.parse(await readFile(SEEN_PATH, 'utf8'));
    return Array.isArray(data.ids) ? data.ids : [];
  } catch {
    return [];
  }
}

async function saveSeen(ids) {
  const trimmed = ids.slice(-SEEN_LIMIT);
  await writeFile(SEEN_PATH, JSON.stringify({ ids: trimmed }, null, 2) + '\n');
}

async function main() {
  const today = todayKst();
  const seenIds = await loadSeen();
  const seen = new Set(seenIds);
  const notes = [];

  // 1. 수집: 한 곳이 실패해도 나머지는 계속 진행
  const collected = [];
  for (const [name, fetcher] of SOURCES) {
    try {
      const items = await fetcher();
      console.log(`[수집] ${name}: ${items.length}건`);
      collected.push(...items);
    } catch (err) {
      console.error(`[수집] ${name} 건너뜀: ${err.message}`);
      notes.push(`${name} 수집 실패로 이번 메일에서 빠졌습니다 (${err.message})`);
    }
  }

  // 2. 중복·기발송 제거 후 필터
  const unique = [...new Map(collected.map((it) => [it.id, it])).values()];
  const fresh = unique.filter((it) => !seen.has(it.id));
  const candidates = filterItems(fresh, today);
  console.log(`[필터] 신규 ${fresh.length}건 중 ${candidates.length}건 통과`);

  // 3. Claude 판단 ("하"는 제외)
  const { judged, errors } = candidates.length ? await judgeItems(candidates) : { judged: [], errors: 0 };
  if (errors) notes.push(`Claude 판단 실패 ${errors}건은 내일 다시 확인합니다`);
  const picked = judged.filter((it) => it.fit !== '하');
  console.log(`[판단] ${judged.length}건 판단, ${picked.length}건 발송 대상`);

  // 4. 메일 발송
  const mail = buildMail(picked, today, notes);
  if (DRY_RUN) {
    console.log(`\n제목: ${mail.subject}\n\n${mail.text}`);
    return;
  }
  await sendMail(mail);
  console.log(`[메일] 발송 완료: ${mail.subject}`);

  // 5. 판단이 끝난 공고("하" 포함)는 다시 보내지 않도록 기록. 판단 실패분은 다음 날 재시도.
  await saveSeen([...seenIds, ...judged.map((it) => it.id)]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
