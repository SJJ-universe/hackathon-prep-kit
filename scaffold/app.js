/* =========================================================================
   app.js - 범용 유틸 스텁 (주제 로직 없음)
   당일 아이디어 구현은 "여기서부터" 섹션의 TODO에만 추가하세요.
   ========================================================================= */
(function () {
  "use strict";

  /* -----------------------------------------------------------------------
     1) 셀렉터 헬퍼
  ----------------------------------------------------------------------- */
  /** 단일 요소 선택. */
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }
  /** 다중 요소 선택 (배열 반환). */
  function $$(selector, root) {
    return Array.prototype.slice.call(
      (root || document).querySelectorAll(selector)
    );
  }

  /* -----------------------------------------------------------------------
     2) 안전한 텍스트 출력 (XSS 방지)
        외부/사용자 입력을 innerHTML에 넣어야 할 때 반드시 escape 사용.
        가능하면 setText(textContent)를 우선 사용.
  ----------------------------------------------------------------------- */
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, """)
      .replace(/'/g, "'");
  }

  /** 요소의 텍스트를 안전하게 설정. */
  function setText(el, value) {
    if (el) el.textContent = value == null ? "" : String(value);
  }

  /* -----------------------------------------------------------------------
     3) 간단 상태 객체 (구독 가능한 store)
  ----------------------------------------------------------------------- */
  function createStore(initial) {
    var state = Object.assign({}, initial);
    var listeners = [];
    return {
      get: function () {
        return state;
      },
      set: function (patch) {
        state = Object.assign({}, state, patch);
        listeners.forEach(function (fn) {
          fn(state);
        });
      },
      subscribe: function (fn) {
        listeners.push(fn);
        return function () {
          listeners = listeners.filter(function (l) {
            return l !== fn;
          });
        };
      },
    };
  }

  /* -----------------------------------------------------------------------
     4) 토스트
  ----------------------------------------------------------------------- */
  function toast(message, type, durationMs) {
    var root = $("#toast-root");
    if (!root) return;
    var el = document.createElement("div");
    el.className = "toast" + (type ? " toast-" + type : "");
    el.textContent = String(message == null ? "" : message);
    root.appendChild(el);
    // 다음 프레임에 표시 클래스 (전환 트리거)
    requestAnimationFrame(function () {
      el.classList.add("is-visible");
    });
    window.setTimeout(function () {
      el.classList.remove("is-visible");
      window.setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 220);
    }, durationMs || 2400);
  }

  /* -----------------------------------------------------------------------
     5) 결과 렌더 함수 (골격)
        TODO: 계산 결과(데이터 객체)를 받아 #result 안에 표시.
        기본 구현은 안전 출력 예시만 제공. 아이디어에 맞게 교체.
  ----------------------------------------------------------------------- */
  function renderResult(data) {
    var box = $("#result");
    if (!box) return;

    // TODO: 아래는 자리표시 렌더링. 실제 결과 마크업으로 교체할 것.
    if (data == null) {
      box.innerHTML =
        '<p class="muted">아직 결과가 없습니다. 입력 후 실행을 눌러주세요.</p>';
      return;
    }

    // 외부/사용자 값은 escapeHtml로 감싸 안전하게 출력.
    var safe = escapeHtml(typeof data === "string" ? data : JSON.stringify(data));
    box.innerHTML = '<p>' + safe + "</p>";
  }

  /* -----------------------------------------------------------------------
     6) 선택: 서비스워커 등록 가드
        file:// 에서는 등록 불가하므로 http/https 에서만 시도.
        sw.js 파일이 없으면 등록 실패해도 조용히 무시.
  ----------------------------------------------------------------------- */
  function registerServiceWorkerIfPossible(swPath) {
    var isHttp =
      location.protocol === "http:" || location.protocol === "https:";
    if (!isHttp || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(swPath || "./sw.js").catch(function () {
      /* sw.js 미존재 등은 무시 (데모 안전) */
    });
  }

  /* =======================================================================
     여기서부터: 앱 초기화 / 아이디어 로직 (당일 작성)
     아래 store, 핸들러, render 연결만 채우면 동작.
  ======================================================================= */
  var store = createStore({ input: "", result: null });

  function init() {
    var form = $("#app-form");
    var input = $("#primary-input");

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var value = input ? input.value.trim() : "";

        // TODO: [입력 -> 계산] 핵심 로직을 여기에 작성.
        //       예) var output = compute(value);
        //       지금은 입력값을 그대로 결과로 보여주는 자리표시 동작.
        var output = value ? value : null;

        store.set({ input: value, result: output });
        if (!value) {
          toast("입력값이 비어 있습니다.", "warning");
        }
      });
    }

    if (form) {
      form.addEventListener("reset", function () {
        store.set({ input: "", result: null });
      });
    }

    // 상태 변화 -> 결과 렌더 연결
    store.subscribe(function (state) {
      renderResult(state.result);
    });

    // PWA를 쓸 경우에만 의미 있음 (sw.js 추가 후).
    registerServiceWorkerIfPossible();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // 디버깅/확장용 전역 노출 (선택).
  window.App = {
    $: $,
    $$: $$,
    escapeHtml: escapeHtml,
    setText: setText,
    createStore: createStore,
    toast: toast,
    renderResult: renderResult,
    store: store,
  };
})();
