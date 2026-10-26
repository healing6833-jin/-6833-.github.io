/**
 * 훼이맵 장부 웹앱 — 서버 코드
 * 빈 구글 시트의 [확장 프로그램 → Apps Script]에 붙여 넣으면,
 * 웹앱을 처음 열 때 장부 시트 9개(장부·입출금일보·부가세집계 등)를 자동으로 만듭니다.
 */
const SHEET_BOOK = '장부';
const SHEET_SET = '기초설정';
const SHEET_ITEM = '품목·재고';
const FIRST_ROW = 5;
const LAST_ROW = 1004;
const ITEM_FIRST = 5;
const ITEM_LAST = 204;
const OUR_SHEETS = ['사용안내', '입출금일보', '장부', '부가세집계', '월별손익', '월간입출금', '재고입출고', '품목·재고', '기초설정'];

/** 웹앱 주소 뒤에 ?page=crm 을 붙이면 고객관리 화면(Crm.html), 없으면 장부 화면(Index.html). */
function doGet(e) {
  const crm = e && e.parameter && e.parameter.page === 'crm';
  return HtmlService.createHtmlOutputFromFile(crm ? 'Crm' : 'Index')
    .setTitle(crm ? '훼이맵 고객관리' : '훼이맵 장부')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** 장부 ↔ 고객관리 화면을 오가는 링크에 쓰는 웹앱 주소 */
function appUrl() { return ScriptApp.getService().getUrl(); }

function onOpen() {
  SpreadsheetApp.getUi().createMenu('훼이맵 장부')
    .addItem('장부 시트 만들기', 'setupLedger')
    .addSeparator()
    .addItem('고객관리 시트 만들기', 'setupCrm')
    .addItem('탈리 문의 지금 가져오기', 'importTally')
    .addToUi();
}

function ss_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('이 스크립트는 구글 시트에서 [확장 프로그램 → Apps Script]로 만들어야 합니다.');
  return ss;
}
function tz_() { return ss_().getSpreadsheetTimeZone(); }
function list_(sheet, a1) {
  return sheet.getRange(a1).getValues().map(function (r) { return r[0]; }).filter(function (v) { return v !== ''; }).map(String);
}

/** 화면에 필요한 모든 데이터를 한 번에 돌려줍니다. 장부 시트가 없으면 먼저 만듭니다. */
function getData() {
  ensureSheets_();
  const ss = ss_();
  const tz = tz_();
  const set = ss.getSheetByName(SHEET_SET);
  const book = ss.getSheetByName(SHEET_BOOK);
  const item = ss.getSheetByName(SHEET_ITEM);

  const accounts = set.getRange('B11:C20').getValues()
    .filter(function (r) { return r[0] !== ''; })
    .map(function (r) { return { name: String(r[0]), opening: Number(r[1]) || 0 }; });

  const entries = [];
  book.getRange(FIRST_ROW, 1, LAST_ROW - FIRST_ROW + 1, 15).getValues().forEach(function (r, i) {
    if (!(r[0] instanceof Date) || r[7] === '') return;
    entries.push({
      row: FIRST_ROW + i,
      date: Utilities.formatDate(r[0], tz, 'yyyy-MM-dd'),
      kind: String(r[1]), desc: String(r[2]), party: String(r[3]), title: String(r[4]),
      evidence: String(r[5]), tax: String(r[6]), total: Number(r[7]) || 0,
      vat: r[8] === '' ? null : Number(r[8]),
      from: String(r[11]), to: String(r[12]), nodeduct: r[13] === 'Y', memo: String(r[14])
    });
  });

  const items = item.getRange('A5:N204').getValues()
    .filter(function (r) { return r[0] !== ''; })
    .map(function (r) {
      return { code: String(r[0]), name: String(r[1]), unit: String(r[3]), stock: Number(r[8]) || 0, safe: r[12] === '' ? null : Number(r[12]), status: String(r[13]) };
    });

  return {
    bizName: String(set.getRange('C3').getValue() || '훼이맵'),
    year: Number(set.getRange('C7').getValue()) || new Date().getFullYear(),
    accounts: accounts,
    kinds: list_(set, 'F11:F16'),
    titles: list_(set, 'H11:H35'),
    evidences: list_(set, 'J11:J15'),
    taxes: list_(set, 'L11:L13'),
    entries: entries,
    items: items,
    goal: Number(PropertiesService.getDocumentProperties().getProperty('monthlyGoal')) || 0,
    receiptReady: !!PropertiesService.getScriptProperties().getProperty(GEMINI_KEY_PROP),
    today: Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd')
  };
}

/** 장부의 첫 빈 줄에 거래 한 건을 적습니다. 자동 계산 열(J·K, P~X)은 건드리지 않습니다. */
function addEntry(e) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) throw new Error('날짜 형식이 올바르지 않습니다.');
  const total = Number(e.total);
  if (!(total > 0)) throw new Error('금액을 입력하세요.');
  const kinds = list_(ss_().getSheetByName(SHEET_SET), 'F11:F16');
  if (kinds.indexOf(e.kind) < 0) throw new Error('구분이 올바르지 않습니다.');

  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);
  try {
    const book = ss_().getSheetByName(SHEET_BOOK);
    const dates = book.getRange(FIRST_ROW, 1, LAST_ROW - FIRST_ROW + 1, 1).getValues();
    let idx = -1;
    for (let i = 0; i < dates.length; i++) { if (dates[i][0] === '') { idx = i; break; } }
    if (idx < 0) throw new Error('장부 1,000줄이 모두 찼습니다. 시트에서 줄을 늘려 주세요.');
    const row = FIRST_ROW + idx;
    const transfer = e.kind === '계좌이체';
    const vat = e.vat === '' || e.vat === null || e.vat === undefined ? '' : Number(e.vat);
    book.getRange(row, 1, 1, 9).setValues([[
      Utilities.parseDate(e.date, tz_(), 'yyyy-MM-dd'), e.kind, e.desc || '', e.party || '',
      transfer ? '' : (e.title || ''), transfer ? '' : (e.evidence || ''), transfer ? '' : (e.tax || ''), total, vat
    ]]);
    book.getRange(row, 12, 1, 4).setValues([[e.from || '', transfer ? (e.to || '') : '', e.nodeduct ? 'Y' : '', e.memo || '']]);
    return row;
  } finally {
    lock.releaseLock();
  }
}

/** 화면에서 본 거래와 같은 줄인지 확인한 뒤, 입력 칸만 지웁니다(수식은 남김). */
function deleteEntry(row, check) {
  row = Number(row);
  if (!(row >= FIRST_ROW && row <= LAST_ROW)) throw new Error('잘못된 줄 번호입니다.');
  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);
  try {
    const book = ss_().getSheetByName(SHEET_BOOK);
    const r = book.getRange(row, 1, 1, 8).getValues()[0];
    const same = r[0] instanceof Date &&
      Utilities.formatDate(r[0], tz_(), 'yyyy-MM-dd') === check.date &&
      String(r[2]) === check.desc && Number(r[7]) === Number(check.total);
    if (!same) throw new Error('시트 내용이 바뀌었습니다. 새로고침 후 다시 시도하세요.');
    book.getRange(row, 1, 1, 9).clearContent();
    book.getRange(row, 12, 1, 4).clearContent();
    return true;
  } finally {
    lock.releaseLock();
  }
}

function setGoal(amount) {
  const n = Math.max(0, Math.round(Number(amount) || 0));
  PropertiesService.getDocumentProperties().setProperty('monthlyGoal', String(n));
  return n;
}

// =====================================================================
// 영수증 사진 → Gemini가 읽어서 입력칸 채우기
// =====================================================================
const GEMINI_KEY_PROP = 'GEMINI_API_KEY';
const GEMINI_MODEL = 'gemini-2.5-flash';

/** 화면에서 붙여 넣은 Gemini API 키를 스크립트 속성에 저장합니다. 키는 화면으로 다시 돌려주지 않습니다. */
function setGeminiKey(key) {
  key = String(key || '').trim();
  if (!/^[\w-]{30,}$/.test(key)) throw new Error('API 키 형식이 아닙니다. AI Studio에서 복사한 키 전체를 붙여 넣으세요.');
  PropertiesService.getScriptProperties().setProperty(GEMINI_KEY_PROP, key);
  return true;
}

/**
 * 영수증 사진(base64 JPEG)을 읽어 날짜·상호·금액·결제수단·증빙·계정과목을 돌려줍니다.
 * 장부에 바로 적지 않고, 화면이 입력칸만 채운 뒤 사장님이 확인하고 저장합니다.
 */
function readReceipt(base64, mime) {
  const key = PropertiesService.getScriptProperties().getProperty(GEMINI_KEY_PROP);
  if (!key) throw new Error('Gemini API 키가 없습니다. 영수증 칸의 [API 키 넣기]에서 먼저 저장하세요.');
  if (!base64 || base64.length > 8 * 1024 * 1024) throw new Error('사진이 비었거나 너무 큽니다.');

  const titles = list_(ss_().getSheetByName(SHEET_SET), 'H11:H35');
  const prompt = [
    '한국 영수증(카드 매출전표·현금영수증·간이영수증·세금계산서) 사진입니다. 아로마 공방 사업자 장부에 적을 값만 JSON으로 답하세요.',
    '- date: 거래일 yyyy-MM-dd. 연도가 없으면 ' + Utilities.formatDate(new Date(), tz_(), 'yyyy') + '년. 안 보이면 빈 문자열.',
    '- party: 가게 상호(지점명 포함, 30자 이내).',
    '- desc: 산 물건을 짧게 (예: "택배비", "A4용지 외 2건").',
    '- total: 최종 결제 금액(부가세 포함, 숫자만). 취소 영수증이면 0.',
    '- vat: 영수증에 적힌 부가세 금액. 없으면 0.',
    '- tax: "과세" 또는 "면세" (부가세가 없고 면세 품목이면 면세).',
    '- pay: "카드" | "현금" | "계좌이체" | "모름".',
    '- evidence: "신용카드"(카드 매출전표) | "현금영수증"(지출증빙/소득공제) | "세금계산서" | "계산서" | "간이영수증".',
    '- title: 다음 계정과목 중 가장 알맞은 하나 → ' + titles.join(', '),
    '- note: 확인이 필요한 점(흐림, 금액 여러 개 등)이 있으면 한 줄로. 없으면 빈 문자열.'
  ].join('\n');

  const res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-goog-api-key': key },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      contents: [{ parts: [{ inline_data: { mime_type: mime || 'image/jpeg', data: base64 } }, { text: prompt }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            date: { type: 'STRING' }, party: { type: 'STRING' }, desc: { type: 'STRING' },
            total: { type: 'NUMBER' }, vat: { type: 'NUMBER' }, tax: { type: 'STRING' },
            pay: { type: 'STRING' }, evidence: { type: 'STRING' }, title: { type: 'STRING' }, note: { type: 'STRING' }
          },
          required: ['date', 'party', 'desc', 'total', 'vat', 'tax', 'pay', 'evidence', 'title', 'note']
        }
      }
    })
  });
  const code = res.getResponseCode();
  if ((code === 400 || code === 403) && /API.?key|PERMISSION_DENIED/i.test(res.getContentText())) throw new Error('Gemini가 키를 받지 않았습니다. API 키를 다시 넣어 주세요. (' + code + ')');
  if (code === 429) throw new Error('Gemini 무료 사용량을 잠시 넘었습니다. 1분 뒤 다시 시도하세요.');
  if (code !== 200) throw new Error('Gemini 응답 오류 ' + code + '. 잠시 뒤 다시 시도하세요.');
  const body = JSON.parse(res.getContentText());
  const text = body.candidates && body.candidates[0] && body.candidates[0].content && body.candidates[0].content.parts[0].text;
  if (!text) throw new Error('영수증을 읽지 못했습니다. 밝은 곳에서 영수증 전체가 나오게 다시 찍어 주세요.');
  return JSON.parse(text);
}

// =====================================================================
// 장부 시트 자동 만들기
// =====================================================================
const BRAND = '#1D2147';
const GOLD = '#A9843F';
const INPUT_BG = '#FFF7D6';
const CALC_BG = '#F2F2F2';
const SECTION_BG = '#EFE8DC';
const MONEY = '#,##0;[Red]-#,##0;"-"';
const DATE_FMT = 'yyyy-mm-dd';

function ensureSheets_() {
  const ss = ss_();
  const have = OUR_SHEETS.filter(function (n) { return ss.getSheetByName(n); });
  if (have.length === OUR_SHEETS.length) return false;
  if (have.length) {
    throw new Error('장부 시트 중 일부(' + have.join(', ') + ')만 있습니다. 새 구글 시트에서 다시 시작해 주세요.');
  }
  setupLedger();
  return true;
}

/** 빈 구글 시트에 훼이맵 장부 시트 9개를 만듭니다. 이미 있으면 아무것도 하지 않습니다. */
function setupLedger() {
  const ss = ss_();
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    if (OUR_SHEETS.some(function (n) { return ss.getSheetByName(n); })) return false;
    ss.setSpreadsheetTimeZone('Asia/Seoul');
    const blanks = ss.getSheets().filter(function (s) { return s.getLastRow() === 0 && s.getLastColumn() === 0; });
    const sh = {};
    OUR_SHEETS.forEach(function (name, i) { sh[name] = ss.insertSheet(name, i); });
    blanks.forEach(function (s) { ss.deleteSheet(s); });

    buildSettings_(sh['기초설정']);
    buildBook_(sh['장부']);
    buildDaily_(sh['입출금일보']);
    buildVat_(sh['부가세집계']);
    buildPL_(sh['월별손익']);
    buildMonthly_(sh['월간입출금']);
    buildItems_(sh['품목·재고']);
    buildMoves_(sh['재고입출고']);
    buildGuide_(sh['사용안내']);
    ss.setActiveSheet(sh['사용안내']);
    SpreadsheetApp.flush();
    return true;
  } finally {
    lock.releaseLock();
  }
}

// ---------- 공통 도우미 ----------
function fit_(sh, rows, cols) {
  if (sh.getMaxRows() < rows) sh.insertRowsAfter(sh.getMaxRows(), rows - sh.getMaxRows());
  if (sh.getMaxColumns() < cols) sh.insertColumnsAfter(sh.getMaxColumns(), cols - sh.getMaxColumns());
}
function widths_(sh, arr) { arr.forEach(function (w, i) { sh.setColumnWidth(i + 1, w); }); }
function title_(sh, a1, text, sub) {
  const c = sh.getRange(a1);
  c.setValue(text).setFontSize(16).setFontWeight('bold').setFontColor(BRAND);
  if (sub) c.offset(1, 0).setValue(sub).setFontColor('#666666');
}
function header_(sh, row, col, labels) {
  sh.getRange(row, col, 1, labels.length).setValues([labels])
    .setBackground(BRAND).setFontColor('#FFFFFF').setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  sh.setRowHeight(row, 38);
}
function section_(sh, a1, text) { sh.getRange(a1).setValue(text).setFontSize(12).setFontWeight('bold').setFontColor(GOLD); }
function box_(range, bg, fmt) {
  range.setBorder(true, true, true, true, true, true, '#D9D9D9', SpreadsheetApp.BorderStyle.SOLID);
  if (bg) range.setBackground(bg);
  if (fmt) range.setNumberFormat(fmt);
  return range;
}
/** first~last 행에 행마다 다른 수식을 한 번에 넣습니다. */
function colFormula_(sh, col, first, last, fn, fmt) {
  const arr = [];
  for (let r = first; r <= last; r++) arr.push(['=' + fn(r)]);
  return box_(sh.getRange(first, col, arr.length, 1).setFormulas(arr), CALC_BG, fmt);
}
function f_(sh, a1, formula, fmt, bg) {
  return box_(sh.getRange(a1).setFormula('=' + formula), bg === undefined ? CALC_BG : bg, fmt);
}
function listRule_(sh, a1) {
  return SpreadsheetApp.newDataValidation().requireValueInRange(sh.getParent().getSheetByName(SHEET_SET).getRange(a1), true)
    .setAllowInvalid(true).build();
}
const J_ = function (col) { return "'장부'!$" + col + '$' + FIRST_ROW + ':$' + col + '$' + LAST_ROW; };
function SUMIFS_(sum) {
  const pairs = Array.prototype.slice.call(arguments, 1);
  return 'SUMIFS(' + J_(sum) + ',' + pairs.map(function (p) { return J_(p[0]) + ',' + p[1]; }).join(',') + ')';
}
const WD_ = function (x) { return 'CHOOSE(WEEKDAY(' + x + '),"일","월","화","수","목","금","토")'; };
const colL_ = function (n) { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };

// ---------- 기초설정 ----------
function buildSettings_(sh) {
  fit_(sh, 40, 18);
  widths_(sh, [16, 150, 130, 300, 16, 100, 16, 150, 16, 100, 16, 90, 16, 90, 16, 100, 16, 100]);
  title_(sh, 'B1', '기초설정', '처음 한 번 입력하세요. 계좌 이름과 계정과목은 바꿔도 되지만, (고정) 목록은 수식이 쓰므로 바꾸지 마세요.');
  const info = [['상호', '훼이맵(FateMap)'], ['대표자', ''], ['사업자등록번호', ''], ['과세유형', '일반과세자'], ['장부 연도', new Date().getFullYear()]];
  box_(sh.getRange(3, 2, info.length, 1).setValues(info.map(function (r) { return [r[0]]; })).setFontWeight('bold'));
  box_(sh.getRange(3, 3, info.length, 1).setValues(info.map(function (r) { return [r[1]]; })), INPUT_BG);
  sh.getRange('C6').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(sh.getRange('R11:R12'), true).build());

  header_(sh, 10, 2, ['계좌·결제수단', '시작 잔액(원)', '메모']);
  const accts = [
    ['사업용 통장', 0, '장부를 시작하는 날의 실제 잔액을 넣으세요.'],
    ['사업용 카드', 0, '카드 사용은 마이너스로 쌓이고, 카드대금 결제(계좌이체)로 0이 됩니다.'],
    ['현금', 0, '시작하는 날의 현금'],
    ['스마트스토어 정산', 0, '판매했지만 아직 통장에 안 들어온 금액'],
    ['와디즈 정산', 0, '펀딩 정산 전 금액'],
    ['', '', ''], ['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']
  ];
  box_(sh.getRange(11, 2, 10, 3).setValues(accts), INPUT_BG);
  sh.getRange('C11:C20').setNumberFormat(MONEY);

  const lists = [
    [6, '거래구분(고정)', ['매출', '매입', '비용', '기타입금', '기타출금', '계좌이체'], CALC_BG],
    [8, '계정과목', ['상품매출', '제품매출', '펀딩매출(와디즈)', '기타수입', '상품매입', '원재료매입', '포장재·용기',
      '판매수수료', '광고선전비', '운반비', '지급수수료', '통신비', '소모품비', '도서인쇄비', '교육훈련비', '임차료',
      '수도광열비', '여비교통비', '차량유지비', '복리후생비', '접대비', '세금과공과', '이자비용', '대표자 입금·인출', '기타'], INPUT_BG],
    [10, '증빙(고정)', ['세금계산서', '계산서', '신용카드', '현금영수증', '기타'], CALC_BG],
    [12, '과세구분(고정)', ['과세', '면세', '영세'], CALC_BG],
    [14, '재고구분(고정)', ['입고', '출고', '조정'], CALC_BG],
    [16, '품목구분', ['완제품', '원료', '용기·포장', '부자재'], INPUT_BG],
    [18, '과세유형(고정)', ['일반과세자', '간이과세자'], CALC_BG]
  ];
  lists.forEach(function (l) {
    header_(sh, 10, l[0], [l[1]]);
    box_(sh.getRange(11, l[0], l[2].length, 1).setValues(l[2].map(function (v) { return [v]; })), l[3]);
  });
}

// ---------- 장부 ----------
function buildBook_(sh) {
  fit_(sh, LAST_ROW, 24);
  widths_(sh, [95, 80, 220, 120, 120, 90, 70, 105, 95, 100, 85, 125, 125, 60, 200, 90, 90, 55, 55, 55, 65, 90, 95, 95]);
  title_(sh, 'A1', '간편장부 — 매출 · 매입 · 비용 · 입출금',
    '노란 칸만 입력합니다(웹앱으로 입력해도 됩니다). 합계금액은 부가세 포함 금액이고, 과세 거래의 부가세는 자동으로 1/11 계산됩니다.');
  header_(sh, 4, 1, ['일자', '구분', '거래내용', '거래처', '계정과목', '증빙', '과세구분', '합계금액\n(VAT포함)',
    '부가세\n직접입력(선택)', '공급가액\n(자동)', '부가세\n(자동)', '계좌·결제수단', '이체 받는 계좌\n(계좌이체만)', '불공제\n(Y)', '비고',
    '(자동)입금', '(자동)출금', '(자동)연도', '(자동)분기', '(자동)월', '(자동)일보번호', '(자동)공제\n매입세액', '(자동)공제\n매입공급가', '(자동)비용\n인식액']);
  sh.setFrozenRows(4);
  sh.setFrozenColumns(1);
  const n = LAST_ROW - FIRST_ROW + 1;
  box_(sh.getRange(FIRST_ROW, 1, n, 9), INPUT_BG);
  box_(sh.getRange(FIRST_ROW, 12, n, 4), INPUT_BG);
  sh.getRange(FIRST_ROW, 1, n, 1).setNumberFormat(DATE_FMT);
  sh.getRange(FIRST_ROW, 8, n, 2).setNumberFormat(MONEY);

  const dv = function (col, a1) { sh.getRange(FIRST_ROW, col, n, 1).setDataValidation(listRule_(sh, a1)); };
  dv(2, 'F11:F16'); dv(5, 'H11:H35'); dv(6, 'J11:J15'); dv(7, 'L11:L13'); dv(12, 'B11:B20'); dv(13, 'B11:B20');
  sh.getRange(FIRST_ROW, 14, n, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Y'], true).setAllowInvalid(true).build());

  const cond = function (r) {
    return 'AND(OR(B' + r + '="매입",B' + r + '="비용"),N' + r + '<>"Y",OR(F' + r + '="세금계산서",F' + r + '="신용카드",F' + r + '="현금영수증"),H' + r + '<>"")';
  };
  colFormula_(sh, 10, FIRST_ROW, LAST_ROW, function (r) { return 'IF(H' + r + '="","",H' + r + '-K' + r + ')'; }, MONEY);
  colFormula_(sh, 11, FIRST_ROW, LAST_ROW, function (r) { return 'IF(H' + r + '="","",IF(I' + r + '<>"",I' + r + ',IF(G' + r + '="과세",ROUND(H' + r + '/11,0),0)))'; }, MONEY);
  colFormula_(sh, 16, FIRST_ROW, LAST_ROW, function (r) { return 'IF(AND(OR(B' + r + '="매출",B' + r + '="기타입금"),H' + r + '<>""),H' + r + ',0)'; }, MONEY);
  colFormula_(sh, 17, FIRST_ROW, LAST_ROW, function (r) { return 'IF(AND(OR(B' + r + '="매입",B' + r + '="비용",B' + r + '="기타출금"),H' + r + '<>""),H' + r + ',0)'; }, MONEY);
  colFormula_(sh, 18, FIRST_ROW, LAST_ROW, function (r) { return 'IF(A' + r + '="","",YEAR(A' + r + '))'; }, '0');
  colFormula_(sh, 19, FIRST_ROW, LAST_ROW, function (r) { return 'IF(A' + r + '="","",ROUNDUP(MONTH(A' + r + ')/3,0))'; }, '0');
  colFormula_(sh, 20, FIRST_ROW, LAST_ROW, function (r) { return 'IF(A' + r + '="","",MONTH(A' + r + '))'; }, '0');
  colFormula_(sh, 21, FIRST_ROW, LAST_ROW, function (r) { return 'IF(OR(A' + r + '="",A' + r + "<>'입출금일보'!$C$3),\"\",COUNTIF(A$" + FIRST_ROW + ':A' + r + ",'입출금일보'!$C$3))"; }, '0');
  colFormula_(sh, 22, FIRST_ROW, LAST_ROW, function (r) { return 'IF(' + cond(r) + ',K' + r + ',0)'; }, MONEY);
  colFormula_(sh, 23, FIRST_ROW, LAST_ROW, function (r) { return 'IF(' + cond(r) + ',J' + r + ',0)'; }, MONEY);
  colFormula_(sh, 24, FIRST_ROW, LAST_ROW, function (r) { return 'IF(AND(OR(B' + r + '="매입",B' + r + '="비용"),H' + r + '<>""),H' + r + '-V' + r + ',0)'; }, MONEY);
  sh.getRange(FIRST_ROW, 16, n, 9).setFontColor('#888888');
}

// ---------- 입출금일보 ----------
function buildDaily_(sh) {
  fit_(sh, 72, 11);
  widths_(sh, [16, 140, 105, 190, 105, 105, 105, 105, 100, 180, 160]);
  title_(sh, 'B1', '훼이맵 입출금 일보');
  box_(sh.getRange('B3').setValue('기준일자').setFontWeight('bold'));
  f_(sh, 'C3', 'TODAY()', DATE_FMT, INPUT_BG).setFontWeight('bold');
  f_(sh, 'D3', 'IF(C3="","",' + WD_('C3') + '&"요일")');
  sh.getRange('E3').setValue('← 다른 날짜를 적으면 그날 일보가 됩니다 (지우면 다시 오늘)').setFontColor('#888888');
  ['작성', '확인'].forEach(function (t, i) {
    box_(sh.getRange(2, 10 + i).setValue(t).setHorizontalAlignment('center'), SECTION_BG);
    box_(sh.getRange(3, 10 + i, 2, 1).merge());
  });

  section_(sh, 'B5', '① 계좌별 잔액');
  header_(sh, 6, 2, ['계좌·결제수단', '전일잔액', '당일입금', '당일출금', '당일잔액', '메모']);
  const d = '$C$3';
  const rows = [];
  for (let i = 0; i < 10; i++) {
    const r = 7 + i, s = 11 + i, acc = '$B' + r;
    const inB = SUMIFS_('P', ['L', acc], ['A', '"<"&' + d]) + '+' + SUMIFS_('H', ['B', '"계좌이체"'], ['M', acc], ['A', '"<"&' + d]);
    const outB = SUMIFS_('Q', ['L', acc], ['A', '"<"&' + d]) + '+' + SUMIFS_('H', ['B', '"계좌이체"'], ['L', acc], ['A', '"<"&' + d]);
    rows.push([
      "=IF('기초설정'!B" + s + '="","",\'기초설정\'!B' + s + ')',
      '=IF(B' + r + '="","",IF(\'기초설정\'!C' + s + '="",0,\'기초설정\'!C' + s + ')+' + inB + '-(' + outB + '))',
      '=IF(B' + r + '="","",' + SUMIFS_('P', ['L', acc], ['A', d]) + '+' + SUMIFS_('H', ['B', '"계좌이체"'], ['M', acc], ['A', d]) + ')',
      '=IF(B' + r + '="","",' + SUMIFS_('Q', ['L', acc], ['A', d]) + '+' + SUMIFS_('H', ['B', '"계좌이체"'], ['L', acc], ['A', d]) + ')',
      '=IF(B' + r + '="","",C' + r + '+D' + r + '-E' + r + ')'
    ]);
  }
  box_(sh.getRange(7, 2, 10, 5).setFormulas(rows), CALC_BG);
  sh.getRange(7, 3, 10, 4).setNumberFormat(MONEY);
  box_(sh.getRange(7, 7, 10, 1), INPUT_BG);
  box_(sh.getRange('B17:G17').setValues([['합계', '=SUM(C7:C16)', '=SUM(D7:D16)', '=SUM(E7:E16)', '=SUM(F7:F16)', '']]), SECTION_BG, null).setFontWeight('bold');
  sh.getRange('C17:F17').setNumberFormat(MONEY);

  section_(sh, 'B19', '② 거래 요약');
  header_(sh, 20, 2, ['구분', '당일', '월누계 (1일~기준일)', '연누계 (1/1~기준일)']);
  const kinds = ['매출', '매입', '비용', '기타입금', '기타출금', '계좌이체'];
  const sum = kinds.map(function (k) {
    const kk = '"' + k + '"';
    return [k === '계좌이체' ? '계좌이체 (잔액 합계 변동 없음)' : k,
      '=' + SUMIFS_('H', ['B', kk], ['A', d]),
      '=' + SUMIFS_('H', ['B', kk], ['A', '">="&DATE(YEAR(' + d + '),MONTH(' + d + '),1)'], ['A', '"<="&' + d]),
      '=' + SUMIFS_('H', ['B', kk], ['A', '">="&DATE(YEAR(' + d + '),1,1)'], ['A', '"<="&' + d])];
  });
  box_(sh.getRange(21, 2, 6, 4).setValues(sum), CALC_BG);
  box_(sh.getRange('B27:E27').setValues([['순입출 (입금 − 출금)', '=C21+C24-C22-C23-C25', '=D21+D24-D22-D23-D25', '=E21+E24-E22-E23-E25']]), SECTION_BG).setFontWeight('bold');
  sh.getRange('C21:E27').setNumberFormat(MONEY);

  section_(sh, 'B29', '③ 당일 거래 내역');
  sh.getRange('F29').setValue('당일 거래 건수').setFontWeight('bold');
  f_(sh, 'G29', 'COUNTIF(' + J_('A') + ',' + d + ')', '0"건"');
  sh.getRange('H29').setFormula('=IF(G29>40,"40건이 넘는 거래는 장부 시트에서 확인하세요","")').setFontColor('#C00000');
  header_(sh, 30, 2, ['번호', '구분', '거래내용', '거래처', '계정과목', '입금', '출금', '이체', '계좌', '비고']);
  const lines = [];
  for (let n = 1; n <= 40; n++) {
    const r = 30 + n;
    const m = 'MATCH($B' + r + ',' + J_('U') + ',0)';
    const ix = function (col) { return 'INDEX(' + J_(col) + ',' + m + ')'; };
    lines.push([n,
      '=IFERROR(' + ix('B') + '&"","")', '=IFERROR(' + ix('C') + '&"","")', '=IFERROR(' + ix('D') + '&"","")', '=IFERROR(' + ix('E') + '&"","")',
      '=IFERROR(' + ix('P') + ',"")', '=IFERROR(' + ix('Q') + ',"")',
      '=IFERROR(IF(' + ix('B') + '="계좌이체",' + ix('H') + ',0),"")',
      '=IFERROR(' + ix('L') + '&IF(' + ix('B') + '="계좌이체"," → "&' + ix('M') + ',""),"")',
      '=IFERROR(' + ix('O') + '&"","")']);
  }
  box_(sh.getRange(31, 2, 40, 10).setValues(lines), CALC_BG);
  sh.getRange(31, 2, 40, 1).setHorizontalAlignment('center');
  sh.getRange(31, 7, 40, 3).setNumberFormat(MONEY);
}

// ---------- 부가세집계 ----------
function buildVat_(sh) {
  fit_(sh, 40, 9);
  widths_(sh, [16, 300, 110, 110, 110, 110, 115, 115, 115]);
  title_(sh, 'B1', '부가세 집계 (일반과세자 기준)', '장부 시트에서 자동으로 모입니다. 신고 전에 홈택스 조회 자료와 꼭 대조하세요.');
  sh.getRange('B3').setValue('연도').setFontWeight('bold');
  f_(sh, 'C3', "'기초설정'!C7", '0').setFontColor('#008000');
  sh.getRange('D3').setValue('과세유형').setFontWeight('bold');
  f_(sh, 'E3', "'기초설정'!C6").setFontColor('#008000');
  sh.getRange('F3').setFormula('=IF(E3="간이과세자","※ 간이과세자는 업종별 부가가치율로 계산하므로 이 표의 세액과 다릅니다.","")').setFontColor('#C00000');
  header_(sh, 5, 2, ['항목', '1분기\n(1~3월)', '2분기\n(4~6월)', '3분기\n(7~9월)', '4분기\n(10~12월)', '1기 확정\n(1~6월)', '2기 확정\n(7~12월)', '연간']);

  const Q = function (sum, conds) { return function (q) { return SUMIFS_.apply(null, [sum, ['R', '$C$3'], ['S', q]].concat(conds)); }; };
  const plus = function () { const fs = Array.prototype.slice.call(arguments); return function (q) { return fs.map(function (g) { return g(q); }).join('+'); }; };
  const sale = function (ev) { return Q('J', [['B', '"매출"'], ['G', '"과세"'], ['F', '"' + ev + '"']]); };
  const saleT = function (ev) { return Q('K', [['B', '"매출"'], ['G', '"과세"'], ['F', '"' + ev + '"']]); };
  const r0 = 6;
  const rows = [
    ['[매출]', null, 'sec'],
    ['과세 · 세금계산서 발급분 — 공급가액', sale('세금계산서')],
    ['과세 · 세금계산서 발급분 — 세액', saleT('세금계산서')],
    ['과세 · 신용카드·현금영수증 — 공급가액', plus(sale('신용카드'), sale('현금영수증'))],
    ['과세 · 신용카드·현금영수증 — 세액', plus(saleT('신용카드'), saleT('현금영수증'))],
    ['과세 · 기타(정규증빙 외) — 공급가액', sale('기타')],
    ['과세 · 기타(정규증빙 외) — 세액', saleT('기타')],
    ['영세율 매출 — 공급가액', Q('J', [['B', '"매출"'], ['G', '"영세"']])],
    ['면세 매출 — 공급가액 (참고)', Q('J', [['B', '"매출"'], ['G', '"면세"']])],
    ['매출세액 합계 (A)', 'A', 'total'],
    ['[매입]', null, 'sec'],
    ['세금계산서 수취분 (공제) — 공급가액', Q('W', [['F', '"세금계산서"']])],
    ['세금계산서 수취분 (공제) — 세액', Q('V', [['F', '"세금계산서"']])],
    ['신용카드·현금영수증 (공제) — 공급가액', plus(Q('W', [['F', '"신용카드"']]), Q('W', [['F', '"현금영수증"']]))],
    ['신용카드·현금영수증 (공제) — 세액', plus(Q('V', [['F', '"신용카드"']]), Q('V', [['F', '"현금영수증"']]))],
    ['공제받을 매입세액 합계 (B)', 'B', 'total'],
    ['공제 안 되는 매입세액 (참고: 불공제·증빙 없음)', 'NP'],
    ['면세 매입(계산서) — 공급가액 (참고)', plus(Q('J', [['B', '"매입"'], ['F', '"계산서"']]), Q('J', [['B', '"비용"'], ['F', '"계산서"']]))],
    ['납부(환급) 예상세액 (A − B)', 'PAY', 'grand']
  ];
  const rA = r0 + 9, rB = r0 + 15;
  const grid = rows.map(function (row, i) {
    const r = r0 + i, g = row[1];
    if (row[2] === 'sec') return [row[0], '', '', '', '', '', '', ''];
    const qs = ['C', 'D', 'E', 'F'].map(function (col, qi) {
      const q = qi + 1;
      if (g === 'A') return '=' + col + (r0 + 2) + '+' + col + (r0 + 4) + '+' + col + (r0 + 6);
      if (g === 'B') return '=' + col + (r0 + 12) + '+' + col + (r0 + 14);
      if (g === 'NP') return '=' + Q('K', [['B', '"매입"']])(q) + '+' + Q('K', [['B', '"비용"']])(q) + '-' + col + rB;
      if (g === 'PAY') return '=' + col + rA + '-' + col + rB;
      return '=' + g(q);
    });
    return [row[0]].concat(qs, ['=C' + r + '+D' + r, '=E' + r + '+F' + r, '=G' + r + '+H' + r]);
  });
  box_(sh.getRange(r0, 2, rows.length, 8).setValues(grid), CALC_BG, null);
  sh.getRange(r0, 3, rows.length, 7).setNumberFormat(MONEY);
  rows.forEach(function (row, i) {
    const rg = sh.getRange(r0 + i, 2, 1, 8);
    if (row[2] === 'sec') rg.setBackground(SECTION_BG).setFontWeight('bold');
    if (row[2] === 'total') rg.setBackground(SECTION_BG).setFontWeight('bold');
    if (row[2] === 'grand') rg.setBackground('#FCE4D6').setFontWeight('bold');
  });
  const notes = [
    '읽는 법',
    '· 납부(환급) 예상세액이 마이너스이면 환급 예상입니다.',
    '· 매입세액은 세금계산서·신용카드·현금영수증 증빙이 있고, 장부의 [불공제] 칸이 비어 있는 매입·비용만 공제로 계산합니다.',
    '· 접대비, 비영업용 승용차 관련, 사업과 무관한 지출은 증빙이 있어도 공제되지 않으니 장부에서 [불공제]에 Y를 넣으세요.',
    '· 스마트스토어·와디즈 매출은 판매자센터·정산서의 결제수단별(카드·현금영수증·기타) 금액으로 나눠 입력하면 신고서 칸과 맞습니다.',
    '· 신용카드매출전표 발행세액공제, 의제매입세액공제, 예정고지 세액 등은 반영하지 않았습니다.',
    '· 개인 일반과세자 확정신고: 1기 7월 25일, 2기 다음 해 1월 25일. 최종 신고 전 세무사 또는 홈택스로 확인하세요.'
  ];
  sh.getRange(r0 + rows.length + 1, 2, notes.length, 1).setValues(notes.map(function (t) { return [t]; })).setFontColor('#555555');
  sh.getRange(r0 + rows.length + 1, 2).setFontWeight('bold').setFontColor(GOLD);
  sh.setFrozenRows(5);
}

// ---------- 월별손익 ----------
function buildPL_(sh) {
  fit_(sh, 40, 15);
  widths_(sh, [16, 180].concat(new Array(12).fill(90), [105]));
  title_(sh, 'B1', '월별 손익 (간편장부 기준)', '매출은 공급가액, 매입·비용은 공제받는 부가세를 뺀 금액입니다. 재고 증감은 반영하지 않습니다.');
  sh.getRange('B3').setValue('연도').setFontWeight('bold');
  f_(sh, 'C3', "'기초설정'!C7", '0').setFontColor('#008000');
  const months = []; for (let m = 1; m <= 12; m++) months.push(m + '월');
  header_(sh, 5, 2, ['항목'].concat(months, ['연간 합계']));
  const L = function (m) { return colL_(2 + m); };
  const lines = [
    ['매출 (공급가액)', function (m) { return SUMIFS_('J', ['B', '"매출"'], ['R', '$C$3'], ['T', m]); }],
    ['매입 (상품·원재료 등)', function (m) { return SUMIFS_('X', ['B', '"매입"'], ['R', '$C$3'], ['T', m]); }],
    ['비용 (판관비)', function (m) { return SUMIFS_('X', ['B', '"비용"'], ['R', '$C$3'], ['T', m]); }],
    ['이익 (매출 − 매입 − 비용)', function (m) { return L(m) + '6-' + L(m) + '7-' + L(m) + '8'; }]
  ];
  const top = lines.map(function (l, i) {
    const r = 6 + i, row = [l[0]];
    for (let m = 1; m <= 12; m++) row.push('=' + l[1](m));
    row.push('=SUM(C' + r + ':N' + r + ')');
    return row;
  });
  box_(sh.getRange(6, 2, 4, 14).setValues(top), CALC_BG);
  sh.getRange(6, 3, 4, 13).setNumberFormat(MONEY);
  sh.getRange(9, 2, 1, 14).setBackground('#FCE4D6').setFontWeight('bold');

  section_(sh, 'B11', '계정과목별 (매출 계정은 공급가액, 나머지는 비용 인식액)');
  header_(sh, 12, 2, ['계정과목'].concat(months, ['연간 합계']));
  const acc = [];
  for (let i = 0; i < 25; i++) {
    const r = 13 + i, s = 11 + i, row = ["=IF('기초설정'!H" + s + '="","",\'기초설정\'!H' + s + ')'];
    for (let m = 1; m <= 12; m++) {
      row.push('=IF($B' + r + '="","",' + SUMIFS_('J', ['E', '$B' + r], ['B', '"매출"'], ['R', '$C$3'], ['T', m]) + '+' + SUMIFS_('X', ['E', '$B' + r], ['R', '$C$3'], ['T', m]) + ')');
    }
    row.push('=IF($B' + r + '="","",SUM(C' + r + ':N' + r + '))');
    acc.push(row);
  }
  box_(sh.getRange(13, 2, 25, 14).setValues(acc), CALC_BG);
  sh.getRange(13, 3, 25, 13).setNumberFormat(MONEY);
  sh.setFrozenRows(5);
  sh.setFrozenColumns(2);
}

// ---------- 월간입출금 ----------
function buildMonthly_(sh) {
  fit_(sh, 40, 9);
  widths_(sh, [16, 95, 50, 105, 105, 105, 105, 115, 125]);
  title_(sh, 'B1', '월간 일자별 입출금 현황', '연도와 월을 바꾸면 그 달의 매일 입금·출금과 마감잔액(전체 계좌 합계)이 나옵니다. 계좌이체는 제외합니다.');
  sh.getRange('B3').setValue('연도').setFontWeight('bold');
  f_(sh, 'C3', "'기초설정'!C7", '0', INPUT_BG);
  sh.getRange('D3').setValue('월').setFontWeight('bold').setHorizontalAlignment('right');
  f_(sh, 'E3', 'MONTH(TODAY())', '0"월"', INPUT_BG);
  header_(sh, 5, 2, ['일자', '요일', '입금', '출금', '순증감', '매출 (합계)', '매입·비용 (합계)', '마감잔액\n(전체 계좌)']);
  const base = "SUM('기초설정'!$C$11:$C$20)";
  const rows = [];
  for (let k = 1; k <= 31; k++) {
    const r = 5 + k, b = 'B' + r;
    rows.push([
      '=IF(' + k + '<=DAY(EOMONTH(DATE($C$3,$E$3,1),0)),DATE($C$3,$E$3,' + k + '),"")',
      '=IF(' + b + '="","",' + WD_(b) + ')',
      '=IF(' + b + '="","",' + SUMIFS_('P', ['A', b]) + ')',
      '=IF(' + b + '="","",' + SUMIFS_('Q', ['A', b]) + ')',
      '=IF(' + b + '="","",D' + r + '-E' + r + ')',
      '=IF(' + b + '="","",' + SUMIFS_('H', ['B', '"매출"'], ['A', b]) + ')',
      '=IF(' + b + '="","",' + SUMIFS_('H', ['B', '"매입"'], ['A', b]) + '+' + SUMIFS_('H', ['B', '"비용"'], ['A', b]) + ')',
      '=IF(' + b + '="","",' + base + '+' + SUMIFS_('P', ['A', '"<="&' + b]) + '-' + SUMIFS_('Q', ['A', '"<="&' + b]) + ')'
    ]);
  }
  box_(sh.getRange(6, 2, 31, 8).setFormulas(rows), CALC_BG);
  sh.getRange(6, 2, 31, 1).setNumberFormat(DATE_FMT);
  sh.getRange(6, 3, 31, 1).setHorizontalAlignment('center');
  sh.getRange(6, 4, 32, 6).setNumberFormat(MONEY);
  box_(sh.getRange('B37:I37').setValues([['월 합계', '', '=SUM(D6:D36)', '=SUM(E6:E36)', '=SUM(F6:F36)', '=SUM(G6:G36)', '=SUM(H6:H36)', '']]), SECTION_BG).setFontWeight('bold');
  const rg = sh.getRange('B6:C36');
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$C6="일"').setFontColor('#C00000').setRanges([rg]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$C6="토"').setFontColor('#1F4E99').setRanges([rg]).build()
  ]);
  sh.setFrozenRows(5);
}

// ---------- 품목·재고 ----------
function buildItems_(sh) {
  fit_(sh, ITEM_LAST + 3, 14);
  widths_(sh, [75, 210, 85, 50, 70, 75, 75, 75, 80, 85, 85, 100, 70, 80]);
  title_(sh, 'A1', '품목 · 현재고', '품목을 먼저 등록하세요. 입고·출고·조정은 [재고입출고] 시트에 적으면 현재고가 자동으로 바뀝니다.');
  header_(sh, 4, 1, ['품목코드', '품목명', '구분', '단위', '기초재고', '입고 합계\n(자동)', '출고 합계\n(자동)', '조정 합계\n(자동)', '현재고\n(자동)', '매입단가', '판매단가', '재고금액\n(자동)', '안전재고', '상태\n(자동)']);
  sh.setFrozenRows(4);
  sh.setFrozenColumns(2);
  const n = ITEM_LAST - ITEM_FIRST + 1;
  [[1, 5], [10, 2], [13, 1]].forEach(function (p) { box_(sh.getRange(ITEM_FIRST, p[0], n, p[1]), INPUT_BG); });
  sh.getRange(ITEM_FIRST, 3, n, 1).setDataValidation(listRule_(sh, 'P11:P14'));
  sh.getRange(ITEM_FIRST, 5, n, 1).setNumberFormat('#,##0');
  sh.getRange(ITEM_FIRST, 10, n, 2).setNumberFormat(MONEY);
  sh.getRange(ITEM_FIRST, 13, n, 1).setNumberFormat('#,##0');
  const M = function (col) { return "'재고입출고'!$" + col + '$' + FIRST_ROW + ':$' + col + '$' + LAST_ROW; };
  const k = function (r, kind) { return 'SUMIFS(' + M('E') + ',' + M('B') + ',$A' + r + ',' + M('D') + ',"' + kind + '")'; };
  colFormula_(sh, 6, ITEM_FIRST, ITEM_LAST, function (r) { return 'IF($A' + r + '="","",' + k(r, '입고') + ')'; }, '#,##0');
  colFormula_(sh, 7, ITEM_FIRST, ITEM_LAST, function (r) { return 'IF($A' + r + '="","",' + k(r, '출고') + ')'; }, '#,##0');
  colFormula_(sh, 8, ITEM_FIRST, ITEM_LAST, function (r) { return 'IF($A' + r + '="","",' + k(r, '조정') + ')'; }, '#,##0;[Red]-#,##0;"-"');
  colFormula_(sh, 9, ITEM_FIRST, ITEM_LAST, function (r) { return 'IF($A' + r + '="","",IF(E' + r + '="",0,E' + r + ')+F' + r + '-G' + r + '+H' + r + ')'; }, '#,##0;[Red]-#,##0;0');
  colFormula_(sh, 12, ITEM_FIRST, ITEM_LAST, function (r) { return 'IF($A' + r + '="","",I' + r + '*IF(J' + r + '="",0,J' + r + '))'; }, MONEY);
  colFormula_(sh, 14, ITEM_FIRST, ITEM_LAST, function (r) { return 'IF(OR($A' + r + '="",M' + r + '=""),"",IF(I' + r + '<=M' + r + ',"발주필요","정상"))'; }).setHorizontalAlignment('center');
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('발주필요').setFontColor('#C00000').setBackground('#FDE2E2').setBold(true)
      .setRanges([sh.getRange(ITEM_FIRST, 14, n, 1)]).build()
  ]);
  sh.getRange(ITEM_LAST + 2, 11).setValue('재고금액 합계').setFontWeight('bold');
  f_(sh, 'L' + (ITEM_LAST + 2), 'SUM(L' + ITEM_FIRST + ':L' + ITEM_LAST + ')', MONEY);
}

// ---------- 재고입출고 ----------
function buildMoves_(sh) {
  fit_(sh, LAST_ROW, 9);
  widths_(sh, [95, 80, 210, 60, 70, 90, 100, 150, 220]);
  title_(sh, 'A1', '재고 입출고', '입고=들어온 수량, 출고=판매·사용, 조정=파손·샘플·실사 차이(줄면 마이너스). 판매 매출은 [장부]에 따로 적습니다.');
  header_(sh, 4, 1, ['일자', '품목코드', '품목명 (자동)', '구분', '수량', '단가', '금액 (자동)', '거래처 · 판매채널', '비고']);
  sh.setFrozenRows(4);
  const n = LAST_ROW - FIRST_ROW + 1;
  [[1, 2], [4, 3], [8, 2]].forEach(function (p) { box_(sh.getRange(FIRST_ROW, p[0], n, p[1]), INPUT_BG); });
  sh.getRange(FIRST_ROW, 1, n, 1).setNumberFormat(DATE_FMT);
  sh.getRange(FIRST_ROW, 5, n, 1).setNumberFormat('#,##0;[Red]-#,##0');
  sh.getRange(FIRST_ROW, 6, n, 1).setNumberFormat(MONEY);
  const items = sh.getParent().getSheetByName(SHEET_ITEM);
  sh.getRange(FIRST_ROW, 2, n, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(items.getRange(ITEM_FIRST, 1, ITEM_LAST - ITEM_FIRST + 1, 1), true).setAllowInvalid(true).build());
  sh.getRange(FIRST_ROW, 4, n, 1).setDataValidation(listRule_(sh, 'N11:N13'));
  const IT = function (col) { return "'품목·재고'!$" + col + '$' + ITEM_FIRST + ':$' + col + '$' + ITEM_LAST; };
  colFormula_(sh, 3, FIRST_ROW, LAST_ROW, function (r) { return 'IF(B' + r + '="","",IFERROR(INDEX(' + IT('B') + ',MATCH(B' + r + ',' + IT('A') + ',0)),"코드 없음"))'; });
  colFormula_(sh, 7, FIRST_ROW, LAST_ROW, function (r) { return 'IF(OR(E' + r + '="",F' + r + '=""),"",E' + r + '*F' + r + ')'; }, MONEY);
}

// ---------- 사용안내 ----------
function buildGuide_(sh) {
  fit_(sh, 60, 3);
  widths_(sh, [16, 190, 720]);
  title_(sh, 'B1', '훼이맵 장부 · 입출금 일보', '부가세 · 재고 · 매일 입출금을 한 파일에서 관리합니다. 웹앱으로 입력하면 이 시트들에 바로 적힙니다.');
  section_(sh, 'B4', '칸 색깔');
  sh.getRange('B5:C7').setValues([['노란 칸', '직접 입력하는 칸'], ['회색 칸', '자동 계산 (수정하지 마세요)'], ['초록 글씨', '다른 시트에서 가져온 값']]);
  sh.getRange('B5').setBackground(INPUT_BG).setFontWeight('bold');
  sh.getRange('B6').setBackground(CALC_BG).setFontWeight('bold');
  sh.getRange('B7').setBackground(CALC_BG).setFontWeight('bold').setFontColor('#008000');
  const blocks = [
    ['시작하기', [
      ['1. 기초설정', '계좌·결제수단 이름과 장부를 시작하는 날의 잔액을 적습니다.'],
      ['2. 품목·재고', '판매 상품·원료·용기를 품목코드와 함께 등록하고, 기초재고와 안전재고(이 수량 이하면 "발주필요")를 적습니다.']
    ]],
    ['매일 할 일', [
      ['거래 입력', '웹앱 [오늘의 기록]에서 저장하거나, [장부] 시트에 한 줄씩 적습니다.'],
      ['재고 입력', '물건이 들어오거나 나가면 [재고입출고]에 적습니다.'],
      ['일보 확인', '[입출금일보]는 기본으로 오늘 날짜를 보여 줍니다. 기준일자 칸에 다른 날짜를 적으면 그날 일보가 됩니다.']
    ]],
    ['이럴 땐 이렇게 적어요', [
      ['스마트스토어·와디즈 판매', '매출 / 계좌 "스마트스토어 정산"(또는 "와디즈 정산") / 증빙은 결제수단(신용카드·현금영수증·기타)별로.'],
      ['정산금이 통장에 들어올 때', '구분 "계좌이체" / 스마트스토어 정산 → 사업용 통장. 수수료는 따로 "비용·판매수수료" 한 줄.'],
      ['사업용 카드로 결제', '매입 또는 비용 / 계좌 "사업용 카드". 카드대금이 통장에서 빠질 때는 계좌이체(사업용 통장 → 사업용 카드).'],
      ['대표자 돈을 넣거나 뺄 때', '기타입금 / 기타출금, 계정과목 "대표자 입금·인출". 손익과 부가세에 들어가지 않습니다.'],
      ['면세 상품·계산서', '과세구분 "면세" → 부가세 0으로 계산됩니다.'],
      ['공제 안 되는 지출', '접대비 등은 증빙이 있어도 [불공제]에 Y를 넣습니다.']
    ]],
    ['주의', [
      ['세무 신고', '이 장부는 정리와 집계용입니다. 실제 신고는 홈택스에서 하거나 세무사에게 맡기고, 신고 전 금액을 대조하세요.'],
      ['고정 목록', '기초설정의 거래구분·증빙·과세구분·재고구분 이름은 수식이 쓰므로 바꾸지 마세요.'],
      ['시트 이름', '시트 이름을 바꾸면 웹앱과 수식이 동작하지 않습니다.']
    ]]
  ];
  let r = 9;
  blocks.forEach(function (b) {
    section_(sh, 'B' + r, b[0]); r++;
    sh.getRange(r, 2, b[1].length, 2).setValues(b[1]).setVerticalAlignment('top').setWrap(true);
    sh.getRange(r, 2, b[1].length, 1).setFontWeight('bold');
    r += b[1].length + 1;
  });
}
