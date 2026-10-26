/**
 * 훼이맵 장부 웹앱 — 고객관리 서버 코드
 * 장부 Apps Script 프로젝트에 Code.gs와 함께 들어가는 두 번째 파일입니다(ss_ · tz_ · BRAND는 Code.gs 것을 씁니다).
 * 고객관리 화면을 처음 열 때 고객 · 문의 · 고객관리설정 시트 3개를 장부 시트 옆에 만듭니다.
 * [고객관리설정]에 탈리 응답 시트 주소를 넣으면 새 문의가 고객 목록에 쌓입니다.
 */
const SHEET_CUST = '고객';
const SHEET_INQ = '문의';
const CRM_SHEET_SET = '고객관리설정';
const CRM_SHEETS = [SHEET_CUST, SHEET_INQ, CRM_SHEET_SET];

const CUST_HEAD = ['고객번호', '이름', '연락처', '생일(양력)', '달력', '적어 준 생일', '별자리', '추천 오일', '키워드',
  '태어난 시간', '출생지', '알게 된 경로', '상태', '첫 문의일', '최근 연락일', '최근 구입일', '구입 이력', '메모'];
const CI = { id: 0, name: 1, tel: 2, birth: 3, cal: 4, raw: 5, sign: 6, oil: 7, kw: 8, btime: 9, place: 10, src: 11,
  status: 12, first: 13, last: 14, lastBuy: 15, buys: 16, memo: 17 };
const INQ_HEAD = ['문의ID', '접수일시', '고객번호', '이름', '연락처', '상담·프로그램', '희망 날짜', '요청사항', '체험 결과', '처리'];
const QI = { id: 0, at: 1, cust: 2, name: 3, tel: 4, program: 5, wish: 6, msg: 7, note: 8, state: 9 };

const STATUSES = ['신규 문의', '상담중', '구매 고객', '휴면'];
const INQ_STATES = ['새 문의', '연락함', '완료'];
const SET_URL = '탈리 응답 시트 주소';
const SET_LAST = '마지막 가져오기';
const SET_AUTO = '자동 가져오기';

// 별자리 표 — 홈페이지 향기카드(app.js)의 대표 오일과 같습니다. 1월부터 '끝나는 날(월×100+일)' 순서.
const ZODIAC = [
  ['염소자리', '♑', 119, '시더우드', '굳건·기반'],
  ['물병자리', '♒', 218, '유칼립투스', '통찰·확장'],
  ['물고기자리', '♓', 320, '프랑킨센스', '영성·보호'],
  ['양자리', '♈', 419, '로즈마리', '열정·용기'],
  ['황소자리', '♉', 520, '일랑일랑', '여유·향유'],
  ['쌍둥이자리', '♊', 621, '페퍼민트', '환기·호기심'],
  ['게자리', '♋', 722, '스위트 마조람', '위로·포용'],
  ['사자자리', '♌', 822, '스위트 오렌지', '관용·온기'],
  ['처녀자리', '♍', 922, '라벤더', '이완·평온'],
  ['천칭자리', '♎', 1022, '제라늄', '균형·사랑'],
  ['전갈자리', '♏', 1121, '파출리', '심연·몰입'],
  ['사수자리', '♐', 1221, '주니퍼베리', '정화·도약']
];
const NEED_SOLAR = '양력 생일 확인 필요';

/** 고객 시트에서 생일(양력) 칸을 직접 고치면 별자리·오일·키워드를 다시 채웁니다. */
function onEdit(e) {
  if (!e || !e.range) return; // 편집기에서 ▶ 실행으로 눌렀을 때는 할 일이 없음
  const sh = e.range.getSheet();
  if (sh.getName() !== SHEET_CUST || e.range.getRow() < 2) return;
  const c0 = e.range.getColumn(), c1 = c0 + e.range.getNumColumns() - 1;
  if (CI.birth + 1 < c0 || CI.birth + 1 > c1) return;
  const tz = e.source.getSpreadsheetTimeZone();
  const rows = sh.getRange(e.range.getRow(), 1, e.range.getNumRows(), CUST_HEAD.length).getValues();
  sh.getRange(e.range.getRow(), CI.sign + 1, rows.length, 3).setValues(rows.map(function (r) {
    return signCells_(ymd_(r[CI.birth], tz), String(r[CI.cal]));
  }));
}

function today_() { return Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd'); }

// ---------- 날짜 · 별자리 · 연락처 ----------

/** 날짜 값(Date 또는 '1990-08-30', '1990.8.30', '19900830' 같은 글자)을 'yyyy-MM-dd'로 바꿉니다. 아니면 ''. */
function ymd_(v, tz) {
  if (v instanceof Date) return isNaN(v) ? '' : Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  const m = String(v || '').trim().match(/^(\d{4})\D?(\d{1,2})\D?(\d{1,2})/);
  if (!m) return '';
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const t = new Date(y, mo - 1, d);
  if (t.getFullYear() !== y || t.getMonth() !== mo - 1 || t.getDate() !== d) return '';
  return y + '-' + ('0' + mo).slice(-2) + '-' + ('0' + d).slice(-2);
}
function toDate_(s) { return s ? Utilities.parseDate(s, tz_(), 'yyyy-MM-dd') : ''; }

function zodiac_(ymd) {
  const md = Number(ymd.slice(5, 7)) * 100 + Number(ymd.slice(8, 10));
  for (let i = 0; i < ZODIAC.length; i++) { if (md <= ZODIAC[i][2]) return ZODIAC[i]; }
  return ZODIAC[0];
}

/** [별자리, 추천 오일, 키워드] 세 칸. 음력 생일만 있으면 양력 확인 안내를 넣습니다. */
function signCells_(birth, cal) {
  if (birth) { const z = zodiac_(birth); return [z[0], z[3], z[4]]; }
  return [cal === '음력' ? NEED_SOLAR : '', '', ''];
}

/** 연락처를 숫자만 남겨 비교합니다. +82 10… 은 010… 으로. */
function phoneKey_(s) {
  let d = String(s || '').replace(/\D/g, '');
  if (d.indexOf('82') === 0 && d.length >= 11) d = '0' + d.slice(2);
  return d;
}
function phoneFmt_(s) {
  const d = phoneKey_(s);
  if (/^01\d{8,9}$/.test(d)) return d.slice(0, 3) + '-' + d.slice(3, d.length - 4) + '-' + d.slice(-4);
  return String(s || '').trim();
}

// ---------- 시트 읽기 · 쓰기 ----------

function custSheet_() { return ss_().getSheetByName(SHEET_CUST); }
function inqSheet_() { return ss_().getSheetByName(SHEET_INQ); }
function rowsOf_(sh, width) {
  const n = sh.getLastRow() - 1;
  return n > 0 ? sh.getRange(2, 1, n, width).getValues() : [];
}
function findRow_(rows, id) {
  for (let i = 0; i < rows.length; i++) { if (String(rows[i][0]) === String(id)) return i; }
  return -1;
}
function nextCustId_(rows) {
  let max = 0;
  rows.forEach(function (r) { const n = Number(String(r[CI.id]).replace(/\D/g, '')); if (n > max) max = n; });
  return 'C' + ('000' + (max + 1)).slice(-4);
}

function setting_(label) {
  const sh = ss_().getSheetByName(CRM_SHEET_SET);
  const v = sh.getRange('A1:B12').getValues();
  for (let i = 0; i < v.length; i++) { if (v[i][0] === label) return { cell: sh.getRange(i + 1, 2), value: v[i][1] }; }
  throw new Error('[고객관리설정] 시트에서 "' + label + '" 칸을 찾을 수 없습니다.');
}

function lock_(fn) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/** 화면에 필요한 모든 데이터를 한 번에 돌려줍니다. 시트가 없으면 먼저 만듭니다. */
function getCrmData() {
  crmEnsure_();
  const tz = tz_();
  const customers = rowsOf_(custSheet_(), CUST_HEAD.length).filter(function (r) { return r[CI.id] !== ''; }).map(function (r) {
    return {
      id: String(r[CI.id]), name: String(r[CI.name]), tel: String(r[CI.tel]), birth: ymd_(r[CI.birth], tz),
      cal: String(r[CI.cal]), raw: r[CI.raw] instanceof Date ? ymd_(r[CI.raw], tz) : String(r[CI.raw]),
      sign: String(r[CI.sign]), oil: String(r[CI.oil]), kw: String(r[CI.kw]),
      btime: r[CI.btime] instanceof Date ? Utilities.formatDate(r[CI.btime], tz, 'HH:mm') : String(r[CI.btime]),
      place: String(r[CI.place]), src: String(r[CI.src]), status: String(r[CI.status]),
      first: ymd_(r[CI.first], tz), last: ymd_(r[CI.last], tz), lastBuy: ymd_(r[CI.lastBuy], tz),
      buys: String(r[CI.buys]), memo: String(r[CI.memo])
    };
  });
  const inquiries = rowsOf_(inqSheet_(), INQ_HEAD.length).filter(function (r) { return r[QI.id] !== ''; }).map(function (r) {
    return {
      id: String(r[QI.id]), at: r[QI.at] instanceof Date ? Utilities.formatDate(r[QI.at], tz, 'yyyy-MM-dd HH:mm') : String(r[QI.at]),
      cust: String(r[QI.cust]), name: String(r[QI.name]), tel: String(r[QI.tel]), program: String(r[QI.program]),
      wish: r[QI.wish] instanceof Date ? ymd_(r[QI.wish], tz) : String(r[QI.wish]),
      msg: String(r[QI.msg]), note: String(r[QI.note]), state: String(r[QI.state])
    };
  });
  const last = setting_(SET_LAST).value;
  return {
    customers: customers,
    inquiries: inquiries,
    tallyUrl: String(setting_(SET_URL).value || ''),
    lastImport: last instanceof Date ? Utilities.formatDate(last, tz, 'yyyy-MM-dd HH:mm') : '',
    autoImport: hasAutoTrigger_(),
    today: today_()
  };
}

// ---------- 고객 ----------

/** 고객 한 명을 새로 만들거나(id 없음) 고칩니다. 별자리·오일은 생일(양력)로 다시 계산합니다. */
function saveCustomer(c) {
  const name = String(c.name || '').trim();
  if (!name) throw new Error('이름을 입력하세요.');
  const birth = c.birth ? ymd_(c.birth, tz_()) : '';
  if (c.birth && !birth) throw new Error('생일 날짜가 올바르지 않습니다.');
  if (c.status && STATUSES.indexOf(c.status) < 0) throw new Error('상태 값이 올바르지 않습니다.');

  return lock_(function () {
    const sh = custSheet_();
    const rows = rowsOf_(sh, CUST_HEAD.length);
    const key = phoneKey_(c.tel);
    if (key) {
      const dup = rows.filter(function (r) { return phoneKey_(r[CI.tel]) === key && String(r[CI.id]) !== String(c.id || ''); })[0];
      if (dup) throw new Error('같은 연락처의 고객이 있습니다: ' + dup[CI.id] + ' ' + dup[CI.name]);
    }
    let i = c.id ? findRow_(rows, c.id) : -1;
    if (c.id && i < 0) throw new Error('고객을 찾을 수 없습니다. 새로고침 후 다시 시도하세요.');
    let r;
    if (i < 0) {
      const t = toDate_(today_());
      r = CUST_HEAD.map(function () { return ''; });
      r[CI.id] = nextCustId_(rows);
      r[CI.cal] = '양력';
      r[CI.status] = '신규 문의';
      r[CI.first] = t;
      r[CI.last] = t;
      rows.push(r);
      i = rows.length - 1;
    } else {
      r = rows[i];
    }
    r[CI.name] = name;
    r[CI.tel] = phoneFmt_(c.tel);
    r[CI.birth] = toDate_(birth);
    if (birth && r[CI.cal] !== '음력') r[CI.raw] = birth;
    const s = signCells_(birth, String(r[CI.cal]));
    r[CI.sign] = s[0]; r[CI.oil] = s[1]; r[CI.kw] = s[2];
    r[CI.btime] = String(c.btime || '');
    r[CI.place] = String(c.place || '');
    r[CI.src] = String(c.src || '');
    if (c.status) r[CI.status] = c.status;
    r[CI.memo] = String(c.memo || '');
    sh.getRange(i + 2, 1, 1, CUST_HEAD.length).setValues([r]);
    return String(r[CI.id]);
  });
}

/** 구입 한 건을 구입 이력에 덧붙이고, 상태를 '구매 고객'으로 바꿉니다. */
function addPurchase(id, date, text) {
  const d = ymd_(date, tz_());
  if (!d) throw new Error('구입 날짜를 입력하세요.');
  text = String(text || '').trim();
  if (!text) throw new Error('구입 내용을 입력하세요.');
  return lock_(function () {
    const sh = custSheet_();
    const rows = rowsOf_(sh, CUST_HEAD.length);
    const i = findRow_(rows, id);
    if (i < 0) throw new Error('고객을 찾을 수 없습니다.');
    const r = rows[i];
    const tz = tz_();
    r[CI.buys] = (r[CI.buys] ? r[CI.buys] + '\n' : '') + d + ' ' + text;
    if (d > ymd_(r[CI.lastBuy], tz)) r[CI.lastBuy] = toDate_(d);
    if (d > ymd_(r[CI.last], tz)) r[CI.last] = toDate_(d);
    r[CI.status] = '구매 고객';
    sh.getRange(i + 2, 1, 1, CUST_HEAD.length).setValues([r]);
    return true;
  });
}

/** 고객과 그 고객의 문의 기록을 지웁니다(개인정보 보유 기간이 지났을 때). 이름이 맞아야 지웁니다. */
function deleteCustomer(id, name) {
  return lock_(function () {
    const sh = custSheet_();
    const rows = rowsOf_(sh, CUST_HEAD.length);
    const i = findRow_(rows, id);
    if (i < 0 || String(rows[i][CI.name]) !== String(name)) throw new Error('시트 내용이 바뀌었습니다. 새로고침 후 다시 시도하세요.');
    sh.deleteRow(i + 2);
    const q = inqSheet_();
    const inq = rowsOf_(q, INQ_HEAD.length);
    for (let k = inq.length - 1; k >= 0; k--) { if (String(inq[k][QI.cust]) === String(id)) q.deleteRow(k + 2); }
    return true;
  });
}

// ---------- 문의 ----------

/** 문의 처리 상태를 바꿉니다. 연락했으면 고객의 최근 연락일도 오늘로. */
function setInquiryState(inqId, state) {
  if (INQ_STATES.indexOf(state) < 0) throw new Error('처리 상태가 올바르지 않습니다.');
  return lock_(function () {
    const q = inqSheet_();
    const inq = rowsOf_(q, INQ_HEAD.length);
    const k = findRow_(inq, inqId);
    if (k < 0) throw new Error('문의를 찾을 수 없습니다.');
    q.getRange(k + 2, QI.state + 1).setValue(state);
    if (state === '새 문의') return true;
    const sh = custSheet_();
    const rows = rowsOf_(sh, CUST_HEAD.length);
    const i = findRow_(rows, inq[k][QI.cust]);
    if (i >= 0) {
      const r = rows[i];
      r[CI.last] = toDate_(today_());
      if (r[CI.status] === '신규 문의') r[CI.status] = '상담중';
      sh.getRange(i + 2, 1, 1, CUST_HEAD.length).setValues([r]);
    }
    return true;
  });
}

// ---------- 탈리 가져오기 ----------

function setTallyUrl(url) {
  url = String(url || '').trim();
  if (url) {
    try { SpreadsheetApp.openByUrl(url).getSheets(); } catch (e) {
      throw new Error('그 주소의 시트를 열 수 없습니다. 탈리가 만든 구글 시트의 주소(docs.google.com/spreadsheets/…)인지 확인하세요.');
    }
  }
  setting_(SET_URL).cell.setValue(url);
  return url;
}

/** 탈리 응답 시트의 머리글에서 각 항목이 몇 번째 칸인지 찾습니다. 질문 문구가 조금 바뀌어도 찾도록 낱말로 비교합니다. */
function tallyCols_(head) {
  const h = head.map(function (x) { return String(x).trim().toLowerCase(); });
  function find(keys, exact) {
    for (let i = 0; i < h.length; i++) {
      for (let k = 0; k < keys.length; k++) { if (exact ? h[i] === keys[k] : h[i].indexOf(keys[k]) >= 0) return i; }
    }
    return -1;
  }
  return {
    id: find(['submission id']), at: find(['submitted at']),
    name: find(['성함', '이름']), tel: find(['연락처', '전화']),
    program: find(['원하시는', '프로그램']), hiddenProgram: find(['program'], true),
    wish: find(['희망 날짜', '희망날짜']), birth: find(['생년월일']), cal: find(['달력']),
    btime: find(['태어난 시간']), place: find(['출생지']), msg: find(['요청사항']),
    src: find(['어떻게 알고']), note: find(['note'], true)
  };
}

/** 탈리 응답 중 아직 가져오지 않은 것만 [문의]에 넣고, 연락처로 고객을 찾아 없으면 새로 만듭니다. */
function importTally() {
  crmEnsure_();
  const url = String(setting_(SET_URL).value || '').trim();
  if (!url) throw new Error('[고객관리설정] 시트(또는 웹앱 고객관리의 [설정] 탭)에 탈리 응답 시트 주소를 먼저 넣어 주세요.');
  let src;
  try { src = SpreadsheetApp.openByUrl(url); } catch (e) {
    throw new Error('탈리 응답 시트를 열 수 없습니다. 주소를 확인하세요.');
  }
  const values = src.getSheets()[0].getDataRange().getValues();
  const srcTz = src.getSpreadsheetTimeZone();
  const col = tallyCols_(values[0] || []);
  if (col.id < 0 || col.name < 0 || col.tel < 0) {
    throw new Error('탈리 응답 시트에서 Submission ID · 성함 · 연락처 칸을 찾지 못했습니다. 탈리가 만든 시트가 맞는지 확인하세요.');
  }
  const get = function (r, i) { return i < 0 || r[i] === '' || r[i] == null ? '' : r[i]; };
  const text = function (r, i) {
    const v = get(r, i);
    return v instanceof Date ? Utilities.formatDate(v, srcTz, 'yyyy-MM-dd') : String(v).trim();
  };

  return lock_(function () {
    const tz = tz_();
    const q = inqSheet_();
    const seen = {};
    rowsOf_(q, 1).forEach(function (r) { seen[String(r[0])] = true; });
    const sh = custSheet_();
    const rows = rowsOf_(sh, CUST_HEAD.length);
    const byPhone = {};
    rows.forEach(function (r, i) { const k = phoneKey_(r[CI.tel]); if (k) byPhone[k] = i; });

    const newInq = [];
    let newCust = 0;
    values.slice(1).forEach(function (r) {
      const id = text(r, col.id);
      if (!id || seen[id]) return;
      seen[id] = true;
      const name = text(r, col.name);
      const tel = text(r, col.tel);
      const at = get(r, col.at);
      let when = at instanceof Date ? at : new Date(String(at).replace(' ', 'T'));
      if (isNaN(when)) when = new Date();
      const day = Utilities.formatDate(when, tz, 'yyyy-MM-dd');

      const cal = text(r, col.cal).indexOf('음력') >= 0 ? '음력' : '양력';
      const rawBirth = text(r, col.birth);
      const birthYmd = get(r, col.birth) instanceof Date ? ymd_(get(r, col.birth), srcTz) : ymd_(rawBirth, tz);
      const solar = cal === '양력' ? birthYmd : '';

      const key = phoneKey_(tel);
      let i = key && byPhone[key] !== undefined ? byPhone[key] : -1;
      let c;
      if (i < 0) {
        c = CUST_HEAD.map(function () { return ''; });
        c[CI.id] = nextCustId_(rows);
        c[CI.name] = name;
        c[CI.tel] = phoneFmt_(tel);
        c[CI.status] = '신규 문의';
        c[CI.first] = toDate_(day);
        rows.push(c);
        i = rows.length - 1;
        if (key) byPhone[key] = i;
        newCust++;
      } else {
        c = rows[i];
        if (c[CI.status] === '휴면') c[CI.status] = '신규 문의';
      }
      // 비어 있는 칸만 채웁니다(사장님이 고친 값은 그대로 둠).
      if (rawBirth && !c[CI.raw]) {
        c[CI.cal] = cal;
        c[CI.raw] = (cal === '음력' ? '음력 ' : '') + (birthYmd || rawBirth);
        if (solar && !c[CI.birth]) c[CI.birth] = toDate_(solar);
        const s = signCells_(ymd_(c[CI.birth], tz), cal);
        c[CI.sign] = s[0]; c[CI.oil] = s[1]; c[CI.kw] = s[2];
      }
      if (!c[CI.btime]) c[CI.btime] = text(r, col.btime);
      if (!c[CI.place]) c[CI.place] = text(r, col.place);
      if (!c[CI.src]) c[CI.src] = text(r, col.src);
      if (day > ymd_(c[CI.last], tz)) c[CI.last] = toDate_(day);

      newInq.push([id, when, c[CI.id], name, phoneFmt_(tel), text(r, col.program) || text(r, col.hiddenProgram),
        text(r, col.wish), text(r, col.msg), text(r, col.note), '새 문의']);
    });

    if (rows.length) sh.getRange(2, 1, rows.length, CUST_HEAD.length).setValues(rows);
    if (newInq.length) {
      newInq.sort(function (a, b) { return a[1] - b[1]; });
      q.getRange(q.getLastRow() + 1, 1, newInq.length, INQ_HEAD.length).setValues(newInq);
    }
    setting_(SET_LAST).cell.setValue(new Date());
    return { added: newInq.length, newCustomers: newCust };
  });
}

/** 15분마다 탈리 문의를 가져오는 자동 실행을 켜거나 끕니다. */
function setAutoImport(on) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'autoImport') ScriptApp.deleteTrigger(t);
  });
  if (on) ScriptApp.newTrigger('autoImport').timeBased().everyMinutes(15).create();
  setting_(SET_AUTO).cell.setValue(on ? '켜짐 (15분마다)' : '꺼짐');
  return !!on;
}
function hasAutoTrigger_() {
  return ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'autoImport'; });
}
function autoImport() {
  if (!String(setting_(SET_URL).value || '').trim()) return;
  importTally();
}

// =====================================================================
// 고객관리 시트 자동 만들기
// =====================================================================
const GOLD_SOFT = '#F3E6C4';

function crmEnsure_() {
  const ss = ss_();
  const have = CRM_SHEETS.filter(function (n) { return ss.getSheetByName(n); });
  if (have.length === CRM_SHEETS.length) return false;
  if (have.length) {
    throw new Error('고객관리 시트 중 일부(' + have.join(', ') + ')만 있습니다. 같은 이름의 다른 시트가 있다면 이름을 바꿔 주세요.');
  }
  setupCrm();
  return true;
}

/** 장부 시트 뒤에 고객 · 문의 · 고객관리설정 시트를 만듭니다. 이미 있으면 아무것도 하지 않습니다. */
function setupCrm() {
  const ss = ss_();
  return lock_(function () {
    if (CRM_SHEETS.some(function (n) { return ss.getSheetByName(n); })) return false;
    const n = ss.getNumSheets();
    const cust = ss.insertSheet(SHEET_CUST, n);
    const inq = ss.insertSheet(SHEET_INQ, n + 1);
    const set = ss.insertSheet(CRM_SHEET_SET, n + 2);

    crmHeader_(cust, CUST_HEAD, [70, 80, 120, 100, 50, 120, 120, 110, 90, 80, 90, 100, 80, 95, 95, 95, 260, 220]);
    ['birth', 'first', 'last', 'lastBuy'].forEach(function (k) { cust.getRange(2, CI[k] + 1, 999, 1).setNumberFormat('yyyy-mm-dd'); });
    // 연락처 · 적어 준 생일 · 시간은 글자 그대로 둡니다(앞자리 0이나 날짜 자동 변환 방지).
    [CI.tel, CI.raw, CI.btime].forEach(function (k) { cust.getRange(2, k + 1, 999, 1).setNumberFormat('@'); });
    cust.getRange(2, CI.status + 1, 999, 1).setDataValidation(crmRule_(STATUSES));
    cust.getRange(2, CI.cal + 1, 999, 1).setDataValidation(crmRule_(['양력', '음력']));
    cust.getRange(2, CI.sign + 1, 999, 3).setBackground('#F2F2F2');
    cust.getRange(2, CI.buys + 1, 999, 2).setWrap(true);
    cust.getRange(1, CI.sign + 1).setNote('생일(양력)을 넣으면 자동으로 채워집니다. 직접 고치지 마세요.');

    crmHeader_(inq, INQ_HEAD, [150, 130, 70, 80, 120, 180, 100, 260, 260, 80]);
    inq.getRange(2, QI.at + 1, 999, 1).setNumberFormat('yyyy-mm-dd hh:mm');
    [QI.id, QI.tel, QI.wish].forEach(function (k) { inq.getRange(2, k + 1, 999, 1).setNumberFormat('@'); });
    inq.getRange(2, QI.state + 1, 999, 1).setDataValidation(crmRule_(INQ_STATES));
    inq.getRange(2, QI.msg + 1, 999, 2).setWrap(true);

    set.getRange('A1').setValue('훼이맵 고객관리 — 설정').setFontSize(14).setFontWeight('bold').setFontColor(BRAND);
    set.getRange('A3:B5').setValues([[SET_URL, ''], [SET_LAST, ''], [SET_AUTO, '꺼짐']]);
    set.getRange('A3:A5').setFontWeight('bold');
    set.getRange('B3').setBackground('#FFF7D6');
    set.getRange('B4').setNumberFormat('yyyy-mm-dd hh:mm');
    set.getRange('A7:A12').setValues([
      ['사용 안내'],
      ['· 탈리 → 폼 → Integrations → Google Sheets 로 만든 응답 시트의 주소를 B3에 넣거나, 웹앱 고객관리 화면의 [설정] 탭에서 넣으세요.'],
      ['· [고객] 시트의 생일(양력)을 고치면 별자리 · 추천 오일 · 키워드가 자동으로 바뀝니다.'],
      ['· 음력 생일 고객은 별자리 칸에 "' + NEED_SOLAR + '"가 뜹니다. 양력으로 바꿔 생일(양력) 칸에 넣어 주세요.'],
      ['· 개인정보 보유 기간: 상담 종료 후 1년 이내 파기 (탈리 동의 문구 기준). 웹앱 홈의 "보관 기간 지남"에서 확인하세요.'],
      ['· 이 시트와 웹앱은 "나만" 볼 수 있게 두세요.']
    ]);
    set.getRange('A7').setFontWeight('bold').setFontColor(BRAND);
    set.setColumnWidth(1, 160);
    set.setColumnWidth(2, 520);

    SpreadsheetApp.flush();
    return true;
  });
}

function crmHeader_(sh, head, widths) {
  sh.getRange(1, 1, 1, head.length).setValues([head])
    .setBackground(BRAND).setFontColor('#FFFFFF').setFontWeight('bold').setVerticalAlignment('middle');
  sh.setFrozenRows(1);
  sh.setRowHeight(1, 30);
  widths.forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.setTabColor(GOLD_SOFT);
}
function crmRule_(arr) { return SpreadsheetApp.newDataValidation().requireValueInList(arr, true).setAllowInvalid(false).build(); }
