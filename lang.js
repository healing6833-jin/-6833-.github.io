/* 언어 선택 — 고른 언어는 쿠키(googtrans)에 저장하고, 한국어가 아닐 때만 구글 번역을 불러온다.
   한국어로 보는 손님은 외부 번역 스크립트를 받지 않으므로 홈페이지 속도에 영향이 없다. */
'use strict';

(function () {
  const select = document.getElementById('lang-select');
  if (!select) return;

  function readLang() {
    const m = document.cookie.match(/(?:^|;\s*)googtrans=\/ko\/([^;]+)/);
    return m ? decodeURIComponent(m[1]) : 'ko';
  }

  function writeLang(lang) {
    const host = location.hostname;
    const expire = lang === 'ko' ? 'expires=Thu, 01 Jan 1970 00:00:00 GMT' : 'max-age=31536000';
    const value = lang === 'ko' ? '' : `/ko/${lang}`;
    // 구글 번역이 도메인 쿠키를 따로 남기기도 해서 두 가지 모두 맞춘다
    document.cookie = `googtrans=${value}; path=/; ${expire}`;
    if (host.includes('.')) document.cookie = `googtrans=${value}; path=/; domain=.${host}; ${expire}`;
  }

  const current = readLang();
  select.value = [...select.options].some((o) => o.value === current) ? current : 'ko';

  select.addEventListener('change', () => {
    writeLang(select.value);
    location.reload();
  });

  if (current === 'ko') return;

  window.googleTranslateElementInit = function () {
    new google.translate.TranslateElement({ pageLanguage: 'ko', autoDisplay: false }, 'google-translate');
  };
  const script = document.createElement('script');
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  document.head.appendChild(script);
})();
