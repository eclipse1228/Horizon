(function () {
  'use strict';

  /** Replace ⭐️ N/10 with a colored badge in h2, h3, and li elements */
  function processScoreBadges() {
    var scoreRe = /⭐️\s*(\d+(?:\.\d+)?)\/10/;
    var targets = document.querySelectorAll('.main-content h2, .main-content h3, .main-content li');
    targets.forEach(function (el) {
      var m = el.innerHTML.match(scoreRe);
      if (!m) return;
      var score = parseFloat(m[1]);
      var tier;
      if (score >= 9) tier = 'high';
      else if (score >= 7) tier = 'good';
      else if (score >= 5) tier = 'mid';
      else tier = 'low';
      el.innerHTML = el.innerHTML.replace(
        scoreRe,
        '<span class="score-badge" data-tier="' + tier + '">' + m[1] + '</span>'
      );
    });
  }

  /** Add semantic classes to tag lines, source lines, and background paragraphs */
  function markSemanticElements() {
    var paragraphs = document.querySelectorAll('.main-content p');
    paragraphs.forEach(function (p) {
      var text = p.textContent.trim();

      // Tag line: starts with Tags, 标签, or 태그
      if (/^(Tags|标签|태그)\s*:/.test(text)) {
        p.classList.add('tag-line');
        return;
      }

      // Source line: pattern like "source · site · date"
      if (/^(rss|reddit|github|hackernews|hn|telegram)\s*·/i.test(text)) {
        p.classList.add('source-line');
        return;
      }
    });
  }

  /** Set up EN / 中文 / 한국어 language toggle */
  function setupLanguageToggle() {
    var toggle = document.createElement('div');
    toggle.className = 'lang-toggle';

    var btnEn = document.createElement('button');
    btnEn.textContent = 'EN';
    btnEn.type = 'button';

    var btnZh = document.createElement('button');
    btnZh.textContent = '中文';
    btnZh.type = 'button';

    var btnKo = document.createElement('button');
    btnKo.textContent = '한국어';
    btnKo.type = 'button';

    toggle.appendChild(btnEn);
    toggle.appendChild(btnZh);
    toggle.appendChild(btnKo);
    document.body.insertBefore(toggle, document.body.firstChild);

    var saved = null;
    try { saved = localStorage.getItem('horizon-lang'); } catch (e) { /* noop */ }
    var currentLang = saved === 'en' || saved === 'ko' ? saved : 'zh';

    var sections = {
      en: document.getElementById('lang-en'),
      zh: document.getElementById('lang-zh'),
      ko: document.getElementById('lang-ko'),
    };

    function updateButtons(lang) {
      btnEn.classList.toggle('active', lang === 'en');
      btnZh.classList.toggle('active', lang === 'zh');
      btnKo.classList.toggle('active', lang === 'ko');
    }

    function showSection(lang) {
      Object.keys(sections).forEach(function (key) {
        var section = sections[key];
        if (!section) return;
        section.classList.toggle('hidden', key !== lang);
      });
    }

    function switchArticleLang(lang) {
      var path = window.location.pathname.replace(/\/$/, '');
      var suffixes = ['-en', '-zh', '-ko'];
      var currentSuffix = null;
      suffixes.forEach(function (suffix) {
        if (new RegExp(suffix + '(?:\\.html)?$').test(path)) {
          currentSuffix = suffix;
        }
      });
      if (!currentSuffix) return;
      var targetSuffix = '-' + lang;
      if (currentSuffix === targetSuffix) return;
      var target = path.replace(
        new RegExp(currentSuffix + '(?:\\.html)?$'),
        targetSuffix + (path.endsWith('.html') ? '.html' : '')
      );
      window.location.href = target;
    }

    function setLang(lang) {
      currentLang = lang;
      updateButtons(lang);
      try { localStorage.setItem('horizon-lang', lang); } catch (e) { /* noop */ }
      if (sections.en && sections.zh && sections.ko) {
        showSection(lang);
      } else {
        switchArticleLang(lang);
      }
    }

    btnEn.addEventListener('click', function () { setLang('en'); });
    btnZh.addEventListener('click', function () { setLang('zh'); });
    btnKo.addEventListener('click', function () { setLang('ko'); });

    updateButtons(currentLang);
    if (sections.en && sections.zh && sections.ko) {
      showSection(currentLang);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    processScoreBadges();
    markSemanticElements();
    setupLanguageToggle();
  });
})();
