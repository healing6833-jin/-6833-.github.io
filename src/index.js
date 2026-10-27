// 매일 실행: 기업마당 지원사업 공고 수집 → 필터 → Claude 판단 → 메일 발송 → data/seen.json 갱신
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fetchBizinfo } from './sources/bizinfo.js';
import { filterItems, todayKst } from './filter.js';
import { judgeItems } from './summarize.js';
import { buildMail, sendMail } from './mailer.js';

const SEEN_PATH = fileURLToPath(new URL('../data/seen.json', import.meta.url));
const SEEN_LIMIT = 5000; // 파일이 끝없이 커지지 않도록 최근 ID만 보관
// 모바일 확인 페이지(notices.html)가 읽는 공고 목록
const NOTICES_PATH = fileURLToPath(new URL('../data/notices.json', import.meta.url));
const UNDATED_KEEP_DAYS = 60; // 마감일 없는(상시) 공고를 페이지에 남겨 두는 기간
const DRY_RUN = process.env.DRY_RUN === '1';
// 수동 실행은 오늘 이미 보냈어도 다시 보낸다.
const FORCE = process.env.FORCE_RUN === '1';
// 아침 예약 실행 중 마지막 회차. 수집이 실패해도 이때는 실패 안내 메일을 보낸다.
const FINAL_ATTEMPT = process.env.FINAL_ATTEMPT === '1';

const SOURCES = [
  ['기업마당', fetchBizinfo],
];

async function loadSeen() {
  try {
    const data = JSON.parse(await readFile(SEEN_PATH, 'utf8'));
    return { ids: Array.isArray(data.ids) ? data.ids : [], lastSent: data.lastSent || '' };
  } catch {
    return { ids: [], lastSent: '' };
  }
}

// lastSent: 메일을 보낸 마지막 날짜. 같은 날 예약 실행이 여러 번 돌아도 메일은 한 번만 간다.
async function saveSeen(ids, lastSent) {
  const trimmed = ids.slice(-SEEN_LIMIT);
  await writeFile(SEEN_PATH, JSON.stringify({ lastSent, ids: trimmed }, null, 2) + '\n');
}

function daysBetween(from, to) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

// 오늘 보낸 공고를 기존 목록에 더하고, 마감이 지났거나 오래된 상시 공고는 뺀다.
async function saveNotices(picked, today) {
  let old = [];
  try {
    old = JSON.parse(await readFile(NOTICES_PATH, 'utf8')).items ?? [];
  } catch {
    // 첫 실행이면 빈 목록에서 시작
  }
  const added = picked.map((it) => ({
    category: it.category,
    title: it.title,
    org: it.org,
    deadline: it.deadline,
    fit: it.fit,
    reason: it.reason,
    url: it.url,
    added: today,
  }));
  const items = [...new Map([...old, ...added].map((it) => [it.url, it])).values()].filter((it) =>
    it.deadline ? it.deadline >= today : daysBetween(it.added, today) <= UNDATED_KEEP_DAYS,
  );
  await writeFile(NOTICES_PATH, JSON.stringify({ updated: today, items }, null, 2) + '\n');
}

async function main() {
  const today = todayKst();
  const { ids: seenIds, lastSent } = await loadSeen();
  if (lastSent === today && !FORCE && !DRY_RUN) {
    console.log(`[건너뜀] 오늘(${today}) 메일은 이미 보냈습니다`);
    return;
  }
  const seen = new Set(seenIds);
  const notes = [];
  let failedSources = 0;

  // 1. 수집: 한 곳이 실패해도 나머지는 계속 진행
  const collected = [];
  for (const [name, fetcher] of SOURCES) {
    try {
      const items = await fetcher();
      console.log(`[수집] ${name}: ${items.length}건`);
      collected.push(...items);
    } catch (err) {
      console.error(`[수집] ${name} 건너뜀: ${err.message}`);
      failedSources++;
      notes.push(`${name} 수집 실패로 이번 메일에서 빠졌습니다 (${err.message})`);
    }
  }

  // 모든 수집처가 실패하면 빈 메일 대신 다음 예약 실행에서 다시 시도한다.
  if (failedSources === SOURCES.length && !FINAL_ATTEMPT && !FORCE && !DRY_RUN) {
    console.log('[수집] 모두 실패해 메일을 보내지 않고 다음 예약 실행에서 다시 시도합니다');
    return;
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
  // 수집에 실패한 날은 lastSent를 남기지 않아, 이후 수동 실행 등으로 다시 받을 수 있게 한다.
  await saveSeen([...seenIds, ...judged.map((it) => it.id)], failedSources ? lastSent : today);
  await saveNotices(picked, today);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
