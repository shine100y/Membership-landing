/* =========================================================
   설정: 구글 앱스 스크립트 배포 후 나온 "웹 앱 URL"을 SHEET_URL에 붙여넣으세요.
   비어 있으면 테스트 모드(실제 전송 없이 완료 화면만 표시)로 동작합니다.
   ========================================================= */
var SHEET_URL = '';
var PAGE_NAME = '멤버십';

/* 클래리티 이벤트 기록 (클래리티가 없거나 막혀 있어도 오류 없이 넘어감) */
function track(name) {
  try { if (typeof window.clarity === 'function') window.clarity('event', name); } catch (e) {}
}

(function () {
  'use strict';

  /* ---------- 유입경로(utm) 기억 ---------- */
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var params = new URLSearchParams(location.search);
  var store = {};
  try { store = JSON.parse(sessionStorage.getItem('lp_utm_m') || '{}'); } catch (e) {}
  UTM_KEYS.forEach(function (k) { if (params.get(k)) store[k] = params.get(k); });
  if (!store.referrer && document.referrer) store.referrer = document.referrer;
  try { sessionStorage.setItem('lp_utm_m', JSON.stringify(store)); } catch (e) {}
  try {
    if (typeof window.clarity === 'function') {
      window.clarity('set', 'page', PAGE_NAME);
      ['utm_source', 'utm_campaign', 'utm_content'].forEach(function (k) { if (store[k]) window.clarity('set', k, store[k]); });
    }
  } catch (e) {}

  /* ---------- 하단 고정 버튼: 문의 폼이 보이면 숨김 ---------- */
  var dock = document.getElementById('dock');
  var applySec = document.getElementById('apply');
  /* 첫 화면 문의 버튼이 보일 때도 숨겨서 버튼이 겹치지 않게 함 */
  var heroCta = document.querySelector('.hero__cta');
  if ('IntersectionObserver' in window && dock && applySec) {
    var seen = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { seen.set(en.target, en.isIntersecting); });
      var hide = false; seen.forEach(function (v) { if (v) hide = true; });
      dock.classList.toggle('is-hidden', hide);
    }, { rootMargin: '0px 0px -30% 0px' });
    io.observe(applySec);
    if (heroCta) io.observe(heroCta);
  }

  /* ---------- 폼 ---------- */
  var form = document.getElementById('applyForm');
  if (!form) return;
  var sido = document.getElementById('f-sido');
  var sigungu = document.getElementById('f-sigungu');
  var phone = document.getElementById('f-phone');
  var email = document.getElementById('f-email');
  var reason = document.getElementById('f-reason');
  var reasonCount = document.getElementById('reasonCount');
  var agreeAll = document.getElementById('agreeAll');
  var agreePrivacy = document.getElementById('agreePrivacy');
  var agreeMarketing = document.getElementById('agreeMarketing');
  var submitBtn = document.getElementById('submitBtn');
  var statusEl = document.getElementById('formStatus');
  var doneBox = document.getElementById('doneBox');
  var REASON_MIN = 10;
  var started = false;
  form.addEventListener('focusin', function () { if (!started) { started = true; track('apply_start'); } });

  /* utm_source로 '알게 된 경로' 미리 선택 (본인이 바꿀 수 있음) */
  var SOURCE_MAP = { youtube: '유튜브', yt: '유튜브', blog: '블로그', naver_blog: '블로그',
    instagram: 'SNS', insta: 'SNS', facebook: 'SNS', meta: 'SNS', threads: 'SNS', tiktok: 'SNS',
    naver: '검색', google: '검색', daum: '검색' };
  var guess = SOURCE_MAP[String(store.utm_source || '').toLowerCase()];
  if (guess) {
    var pre = form.querySelector('input[name="source"][value="' + guess + '"]');
    if (pre) pre.checked = true;
  }

  Object.keys(window.REGIONS || {}).forEach(function (name) {
    sido.add(new Option(name, name));
  });
  sido.addEventListener('change', function () {
    sigungu.length = 1;
    var list = (window.REGIONS || {})[sido.value] || [];
    list.forEach(function (n) { sigungu.add(new Option(n, n)); });
    sigungu.disabled = !list.length;
    if (list.length === 1) sigungu.value = list[0];
  });

  phone.addEventListener('input', function () {
    var d = phone.value.replace(/\D/g, '').slice(0, 11);
    if (d.length < 4) phone.value = d;
    else if (d.length < 8) phone.value = d.slice(0, 3) + '-' + d.slice(3);
    else if (d.length === 10) phone.value = d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
    else phone.value = d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
  });

  reason.addEventListener('input', function () { reasonCount.textContent = reason.value.length; });

  agreeAll.addEventListener('change', function () {
    agreePrivacy.checked = agreeMarketing.checked = agreeAll.checked;
  });
  [agreePrivacy, agreeMarketing].forEach(function (c) {
    c.addEventListener('change', function () {
      agreeAll.checked = agreePrivacy.checked && agreeMarketing.checked;
    });
  });

  function setErr(key, msg, el) {
    var p = form.querySelector('.err[data-for="' + key + '"]');
    if (p) p.textContent = msg || '';
    if (el) el.classList.toggle('is-invalid', !!msg);
    return !msg;
  }

  function validate() {
    var ok = true, first = null;
    function check(cond, key, msg, el) {
      var good = setErr(key, cond ? '' : msg, el);
      if (!good) { ok = false; if (!first) first = el || form.querySelector('[data-for="' + key + '"]'); }
    }
    check(!!form.querySelector('input[name="source"]:checked'), 'source', '알게 된 경로를 선택해주세요.', document.getElementById('sourceGroup'));
    var name = form.elements['name'].value.trim();
    check(name.length >= 2, 'name', '이름을 입력해주세요.', form.elements['name']);
    check(/^01[016789]-?\d{3,4}-?\d{4}$/.test(phone.value), 'phone', '휴대폰 번호를 정확히 입력해주세요. 예: 010-1234-5678', phone);
    var em = email.value.trim();
    check(!em || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em), 'email', '이메일 형식을 확인해주세요. (선택 항목이라 비워두셔도 돼요)', email);
    var age = parseInt(form.elements['age'].value, 10);
    check(age >= 19 && age <= 75, 'age', '나이를 숫자로 입력해주세요. (19~75)', form.elements['age']);
    check(sido.value && sigungu.value, 'region', '시·도와 시·군·구를 모두 선택해주세요.', sido.value ? sigungu : sido);
    check(!!form.querySelector('input[name="field"]:checked'), 'field', '관심 있는 배송 분야를 선택해주세요.', form.querySelector('.picks'));
    check(reason.value.trim().length >= REASON_MIN, 'reason', '지원 이유를 ' + REASON_MIN + '자 이상 적어주세요. 자세할수록 상담이 정확해져요.', reason);
    check(agreePrivacy.checked, 'agree', '개인정보 수집 및 이용에 동의해야 문의할 수 있어요.', null);
    if (first) {
      var target = first.matches && first.matches('input,select,textarea') ? first : first.querySelector && first.querySelector('input');
      first.scrollIntoView({ block: 'center' });
      if (target && target.focus) target.focus({ preventScroll: true });
    }
    return ok;
  }

  /* 선택하면 해당 오류 문구 바로 지우기 */
  form.addEventListener('change', function (e) {
    var n = e.target.name;
    if (n === 'source') setErr('source', '', document.getElementById('sourceGroup'));
    if (n === 'field') setErr('field', '', form.querySelector('.picks'));
    if (n === 'agreePrivacy' && e.target.checked) setErr('agree', '');
  });

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    statusEl.textContent = '';
    if (form.elements['website'].value) return; // 스팸 봇
    if (!validate()) return;

    var data = {
      page: PAGE_NAME,
      source: form.querySelector('input[name="source"]:checked').value,
      name: form.elements['name'].value.trim(),
      phone: phone.value,
      email: email.value.trim(),
      age: form.elements['age'].value,
      sido: sido.value,
      sigungu: sigungu.value,
      field: form.querySelector('input[name="field"]:checked').value,
      reason: reason.value.trim(),
      agreePrivacy: agreePrivacy.checked ? 'Y' : 'N',
      agreeMarketing: agreeMarketing.checked ? 'Y' : 'N',
      device: window.matchMedia('(min-width:900px)').matches ? 'PC' : '모바일',
      url: location.href.split('#')[0]
    };
    UTM_KEYS.concat(['referrer']).forEach(function (k) { data[k] = store[k] || ''; });

    submitBtn.disabled = true;
    submitBtn.textContent = '보내는 중…';

    var finish = function () {
      track('apply_submit');
      form.hidden = true;
      doneBox.hidden = false;
      doneBox.focus();
      doneBox.scrollIntoView({ block: 'center' });
    };

    if (!SHEET_URL) { // 테스트 모드
      console.info('[테스트 모드] 전송될 데이터:', data);
      setTimeout(finish, 500);
      return;
    }

    fetch(SHEET_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: new URLSearchParams(data)
    }).then(finish).catch(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = '멤버십 문의하기';
      statusEl.textContent = '전송에 실패했어요. 인터넷 연결을 확인한 뒤 다시 눌러주세요.';
    });
  });
})();

/* ---------- 회사 소개 영상: 소리 켜기/끄기, 재생 기록 ---------- */
(function () {
  'use strict';
  var v = document.getElementById('promoVideo');
  var btn = document.getElementById('promoSound');
  if (!v || !btn) return;
  var played = false;
  v.addEventListener('playing', function () { if (!played) { played = true; track('promo_play'); } });
  btn.addEventListener('click', function () {
    var on = v.muted;
    v.muted = !on;
    if (on) {
      try { v.currentTime = 0; } catch (e) {}
      var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
      track('promo_sound_on');
    }
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = on ? '소리 끄기' : '소리 켜기';
  });
  /* 화면 밖으로 나가면 멈춤 (데이터·배터리 절약) */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else v.pause();
    }, { threshold: 0.25 }).observe(v);
  }
})();
