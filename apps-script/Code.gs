/**
 * 멤버십 자체폼 문의서 → 구글 시트 [멤버십_자체폼] 탭 자동 저장
 *
 * ⚠️ 시트의 [확장 프로그램 → Apps Script]에 넣지 마세요. (기존 자동 입력 코드와 충돌 방지)
 *    가구 랜딩과 마찬가지로 script.google.com 에서 [새 프로젝트]로 따로 만드세요.
 *
 * 사용법
 * 1. https://script.google.com → [새 프로젝트] (이름 예: 멤버십_자체폼)
 * 2. 기본 코드를 지우고 이 파일 내용을 붙여넣은 뒤 저장
 * 3. 편집기에서 testConnection 을 한 번 실행 → 권한 승인 (탭이 없으면 자동으로 만들어요)
 * 4. [배포] → [새 배포] → 유형: 웹 앱 / 실행 계정: 나 / 액세스 권한: 모든 사용자
 * 5. 나온 "웹 앱 URL"을 js/main.js 의 SHEET_URL 에 붙여넣기
 */

// 저장할 스프레드시트 (광고테스트). 다른 시트에 모으려면 ID만 바꾸세요.
var SPREADSHEET_ID = '1WvKNQxoDLCTHDoH2yrgE3WFRByIuLpqgn2LZvFI331U';

// 저장할 탭 이름 (없으면 자동 생성). 생성 후 탭 이름을 바꿀 거라면
// 탭 주소의 gid 숫자를 TARGET_GID 에 넣어두면 이름이 바뀌어도 계속 같은 탭에 저장돼요.
var TARGET_NAME = '멤버십_자체폼';
var TARGET_GID = 0; // 0 = 이름으로만 찾기

// 새 문의 알림 메일을 받을 주소 (비워두면 메일 안 보냄). 바꾼 뒤엔 [배포 관리]에서 새 버전으로 업데이트.
var NOTIFY_EMAIL = '';

var HEADERS = [
  ['receivedAt', '접수시각'],
  ['page', '페이지'],
  ['source', '알게 된 경로'],
  ['name', '이름'],
  ['phone', '연락처'],
  ['email', '이메일'],
  ['age', '나이'],
  ['sido', '시·도'],
  ['sigungu', '시·군·구'],
  ['field', '관심 분야'],
  ['reason', '지원 이유'],
  ['agreePrivacy', '개인정보동의'],
  ['agreeMarketing', '마케팅동의'],
  ['device', '기기'],
  ['utm_source', '유입(utm_source)'],
  ['utm_medium', '매체(utm_medium)'],
  ['utm_campaign', '캠페인(utm_campaign)'],
  ['utm_content', '콘텐츠(utm_content)'],
  ['utm_term', '키워드(utm_term)'],
  ['referrer', '이전 페이지'],
  ['url', '접수 페이지 주소']
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var p = (e && e.parameter) || {};
    if (!p.name || !p.phone) return out_({ ok: false, error: 'missing' });

    var sheet = getSheet_();
    p.receivedAt = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    var row = HEADERS.map(function (h) {
      var max = h[0] === 'reason' ? 1000 : 500;
      var v = p[h[0]] == null ? '' : String(p[h[0]]).slice(0, max);
      // 수식으로 해석되는 값 차단, 전화번호 앞자리 0 유지
      if (/^[=+\-@]/.test(v) || h[0] === 'phone') v = "'" + v;
      return v;
    });
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL,
        '[새 문의] ' + (p.page || '') + ' - ' + p.name + ' (' + (p.field || '') + ')',
        HEADERS.map(function (h, i) { return h[1] + ': ' + String(row[i]).replace(/^'/, ''); }).join('\n'));
    }
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// 브라우저로 웹 앱 URL을 열었을 때 연결 확인용
function doGet() {
  var name = '';
  try { name = getSheet_().getName(); } catch (err) { name = '탭을 찾지 못함: ' + err; }
  return out_({ ok: true, message: '멤버십 문의서 수집 웹 앱 정상 동작 중', tab: name });
}

// 배포 전에 편집기에서 한 번 실행: 권한 승인 + 탭 생성/연결 확인
function testConnection() {
  var sheet = getSheet_();
  Logger.log('연결된 탭: ' + sheet.getName() + ' / gid: ' + sheet.getSheetId() + ' / 마지막 행: ' + sheet.getLastRow());
}

function getSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = null;
  if (TARGET_GID) {
    var all = ss.getSheets();
    for (var i = 0; i < all.length; i++) {
      if (all[i].getSheetId() === TARGET_GID) { sheet = all[i]; break; }
    }
  }
  if (!sheet) sheet = ss.getSheetByName(TARGET_NAME);
  if (!sheet) sheet = ss.insertSheet(TARGET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS.map(function (h) { return h[1]; }));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#FFCD4A');
    sheet.setColumnWidth(11, 360); // 지원 이유 열 넓게
  }
  return sheet;
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
