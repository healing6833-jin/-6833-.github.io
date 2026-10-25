// 네이버 SMTP로 공고 메일을 보낸다. 앱이 읽을 데이터 블록이 깨지지 않도록 본문은 일반 텍스트로만 보낸다.
import nodemailer from 'nodemailer';

const DEFAULT_TO = ['infor423@naver.com', 'healing6833@gmail.com'];
const SECTIONS = [
  ['폐교임대', '■ 폐교 임대'],
  ['지원사업', '■ 지원사업'],
  ['강사모집', '■ 강사 모집'],
];

// 마감일 빠른 순, 마감일 없는 공고(상시 등)는 맨 뒤
function byDeadline(a, b) {
  if (!a.deadline) return b.deadline ? 1 : 0;
  if (!b.deadline) return -1;
  return a.deadline.localeCompare(b.deadline);
}

/** notes: 수집 실패 등 본문 끝(데이터 블록 앞)에 붙일 안내 문구 */
export function buildMail(items, today, notes = []) {
  const [, mm, dd] = today.split('-');
  const subject = `[훼이맵 공고] ${mm}/${dd} 신규 ${items.length}건`;
  const sorted = [...items].sort(byDeadline);

  const lines = [];
  if (!items.length) {
    lines.push('오늘 신규 공고 없음', '');
  } else {
    for (const [category, heading] of SECTIONS) {
      const group = sorted.filter((it) => it.category === category);
      lines.push(`${heading} (${group.length}건)`, '');
      if (!group.length) lines.push('  해당 없음', '');
      group.forEach((it, i) => {
        lines.push(
          `${i + 1}. ${it.title}`,
          `   기관: ${it.org || '-'}`,
          `   마감: ${it.deadline || '상시/미정'}`,
          `   적합도: ${it.fit}`,
          `   이유: ${it.reason}`,
          `   링크: ${it.url}`,
          '',
        );
      });
    }
  }

  const data = {
    date: today,
    items: sorted.map((it) => ({
      category: it.category,
      title: it.title,
      org: it.org,
      deadline: it.deadline,
      fit: it.fit,
      reason: it.reason,
      url: it.url,
    })),
  };
  if (notes.length) lines.push(...notes.map((n) => `※ ${n}`), '');
  lines.push('===HWAYMAP_DATA===', JSON.stringify(data), '===HWAYMAP_END===');

  return { subject, text: lines.join('\n') };
}

export async function sendMail({ subject, text }) {
  const user = process.env.NAVER_SMTP_USER;
  const pass = process.env.NAVER_SMTP_PASS;
  if (!user || !pass) throw new Error('NAVER_SMTP_USER / NAVER_SMTP_PASS가 설정되지 않았습니다');

  // 네이버는 보내는 주소가 로그인 계정과 같아야 한다. 아이디만 넣었으면 @naver.com을 붙인다.
  const from = user.includes('@') ? user : `${user}@naver.com`;
  const to = process.env.MAIL_TO ? process.env.MAIL_TO.split(',').map((s) => s.trim()) : DEFAULT_TO;

  const transporter = nodemailer.createTransport({
    host: 'smtp.naver.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  await transporter.sendMail({ from: `훼이맵 공고봇 <${from}>`, to, subject, text });
}
