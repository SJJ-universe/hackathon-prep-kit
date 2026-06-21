/* =========================================================================
   components.js — 생활·안전 데모용 주제 중립 렌더 헬퍼 (Window.Components)
   -------------------------------------------------------------------------
   아이디어 비종속. 당일 새 저장소에서 DataLayer(scaffold/data.js)와 엮어
   "공공데이터 → 액션카드" 데모를 30분 안에 만들 수 있게 한다.

   제공
     Components.sourceBadge(source)              -> 출처 배지 HTML ('실시간'/'예시')
     Components.actionCard(card)                 -> 액션카드 HTML
     Components.renderCards(el, cards)           -> el 안에 카드 리스트 렌더
     Components.setLoading(el[, n]) / setError(el, msg) / setEmpty(el, msg)
     Components.a11y.mountToolbar(appEl[, opts]) -> 큰글씨/고대비/음성 토글 바
     Components.a11y.speak(text) / stop()        -> 취약계층 음성 안내(TTS)
     Components.map.embed(el, opts)              -> Kakao JS SDK 지도(키 없으면 플레이스홀더)

   card 데이터 모양 (예시 — 아이디어에 맞게 채움)
     { severity:'warn', badge:'폭염 경보', title:'오늘 35°C, 야외활동 자제',
       action:'가장 가까운 무더위쉼터로', meta:[{label:'거리',value:'320m'}],
       cta:{ label:'경로 보기', href:'#', onClick:fn } }
   ========================================================================= */
(function () {
  "use strict";

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  var SEV = { safe: 1, info: 1, warn: 1, alert: 1, danger: 1 };
  function sev(s) { return SEV[s] ? s : "info"; }

  /* ---- 출처 배지 ---- */
  function sourceBadge(source) {
    var src = source === "live" ? "live" : (source === "none" ? "example" : source || "example");
    var label = src === "live" ? "실시간" : "예시";
    return '<span class="c-badge" data-src="' + esc(src) + '"><span class="d"></span>' + label + "</span>";
  }

  /* ---- 액션카드 ---- */
  var ARROW =
    '<svg class="arr" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function actionCard(card) {
    card = card || {};
    var meta = (card.meta || [])
      .map(function (m) {
        return '<div class="m"><span class="l">' + esc(m.label) + '</span><span class="v">' + esc(m.value) + "</span></div>";
      })
      .join("");
    var cta = "";
    if (card.cta && card.cta.label) {
      var tag = card.cta.href ? "a" : "button";
      var href = card.cta.href ? ' href="' + esc(card.cta.href) + '"' : ' type="button"';
      cta = "<" + tag + ' class="c-cta"' + href + " data-cta>" + esc(card.cta.label) + "</" + tag + ">";
    }
    return (
      '<article class="c-card" data-sev="' + esc(sev(card.severity)) + '">' +
      (card.badge ? '<span class="c-chip">' + esc(card.badge) + "</span>" : "") +
      '<h3 class="c-card-title">' + esc(card.title) + "</h3>" +
      (card.action ? '<p class="c-action">' + ARROW + "<span><b>" + esc(card.action) + "</b></span></p>" : "") +
      (meta ? '<div class="c-meta">' + meta + "</div>" : "") +
      cta +
      "</article>"
    );
  }

  /* ---- 리스트/상태 렌더 ---- */
  function ensureList(el) {
    var list = el.querySelector(".c-list");
    if (!list) { list = document.createElement("div"); list.className = "c-list"; el.innerHTML = ""; el.appendChild(list); }
    return list;
  }
  function renderCards(el, cards, opts) {
    opts = opts || {};
    if (!cards || !cards.length) return setEmpty(el, opts.emptyText);
    el.innerHTML = '<div class="c-list">' + cards.map(actionCard).join("") + "</div>";
    // CTA onClick 연결
    (cards || []).forEach(function (c, i) {
      if (c.cta && typeof c.cta.onClick === "function") {
        var node = el.querySelectorAll(".c-card")[i];
        var btn = node && node.querySelector("[data-cta]");
        if (btn) btn.addEventListener("click", function (e) { if (!c.cta.href) e.preventDefault(); c.cta.onClick(c, e); });
      }
    });
    return el;
  }
  function setLoading(el, n) {
    var skel = "";
    for (var i = 0; i < (n || 3); i++) skel += '<div class="c-skel"></div>';
    el.innerHTML = '<div class="c-list">' + skel + "</div>";
  }
  function setEmpty(el, msg) {
    el.innerHTML = '<div class="c-empty">' + esc(msg || "표시할 항목이 없습니다.") + "</div>";
  }
  function setError(el, msg) {
    el.innerHTML = '<div class="c-error">' + esc(msg || "데이터를 불러오지 못했습니다. 잠시 후 다시 시도하세요.") + "</div>";
  }

  /* ---- 접근성(취약계층) 모드: 큰 글씨 / 고대비 / 음성 ---- */
  var a11y = (function () {
    function speak(text) {
      try {
        if (!("speechSynthesis" in window)) return false;
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(String(text || ""));
        u.lang = "ko-KR"; u.rate = 0.98;
        var ko = (window.speechSynthesis.getVoices() || []).find(function (v) { return /ko/i.test(v.lang); });
        if (ko) u.voice = ko;
        window.speechSynthesis.speak(u);
        return true;
      } catch (e) { return false; }
    }
    function stop() { try { window.speechSynthesis.cancel(); } catch (e) {} }

    function mountToolbar(appEl, opts) {
      opts = opts || {};
      var bar = document.createElement("div");
      bar.className = "c-tools";
      function mk(label, cls) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "c-tool"; b.textContent = label;
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function () {
          var on = appEl.classList.toggle(cls);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        return b;
      }
      bar.appendChild(mk(opts.largeLabel || "큰 글씨", "a11y-lg"));
      bar.appendChild(mk(opts.contrastLabel || "고대비", "a11y-hc"));
      if (opts.voiceTextEl || opts.getVoiceText) {
        var vb = document.createElement("button");
        vb.type = "button"; vb.className = "c-tool"; vb.textContent = opts.voiceLabel || "음성 안내";
        vb.addEventListener("click", function () {
          var t = opts.getVoiceText ? opts.getVoiceText()
            : (opts.voiceTextEl && opts.voiceTextEl.textContent) || "";
          speak(t);
        });
        bar.appendChild(vb);
      }
      return bar;
    }
    return { speak: speak, stop: stop, mountToolbar: mountToolbar };
  })();

  /* ---- 지도 임베드 (Kakao Maps JS SDK; 키 없으면 플레이스홀더) ---- */
  var map = (function () {
    var loading = null;
    function loadSdk(jsKey) {
      if (window.kakao && window.kakao.maps) return Promise.resolve(window.kakao);
      if (loading) return loading;
      loading = new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = "https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=" + encodeURIComponent(jsKey);
        s.onload = function () { window.kakao.maps.load(function () { resolve(window.kakao); }); };
        s.onerror = function () { reject(new Error("Kakao SDK 로드 실패")); };
        document.head.appendChild(s);
      });
      return loading;
    }
    function placeholder(el, msg) {
      el.classList.add("c-map");
      el.innerHTML = '<div class="c-map-ph">' + esc(msg || "지도 자리 — window.KAKAO_JS_KEY 설정 시 실제 지도") + "</div>";
    }
    function embed(el, opts) {
      opts = opts || {};
      var jsKey = opts.jsKey || (typeof window !== "undefined" && window.KAKAO_JS_KEY);
      if (!jsKey) { placeholder(el, opts.placeholderText); return Promise.resolve(null); }
      el.classList.add("c-map"); el.innerHTML = "";
      var center = opts.center || { lat: 37.5666, lng: 126.9784 }; // 서울시청 기본
      return loadSdk(jsKey).then(function (kakao) {
        var m = new kakao.maps.Map(el, {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level: opts.level || 5,
        });
        (opts.markers || []).forEach(function (mk) {
          new kakao.maps.Marker({ map: m, position: new kakao.maps.LatLng(mk.lat, mk.lng), title: mk.title || "" });
        });
        return m;
      }).catch(function () { placeholder(el, "지도 로드 실패 — 키/도메인 등록 확인"); return null; });
    }
    return { embed: embed };
  })();

  var api = {
    esc: esc,
    sourceBadge: sourceBadge,
    actionCard: actionCard,
    renderCards: renderCards,
    setLoading: setLoading,
    setEmpty: setEmpty,
    setError: setError,
    a11y: a11y,
    map: map,
  };
  if (typeof window !== "undefined") window.Components = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
