/* =========================================================================
   data.js — 앱쪽 데이터 레이어 (주제 비종속 범용 헬퍼)
   -------------------------------------------------------------------------
   라이브 프록시 → 실패 시 스냅샷으로 자동 폴백하고, 출처(실시간/예시)를
   같이 돌려준다. 런북의 "라이브 사수 1종 + 나머지 예시 배지" 패턴 구현.

   사용 (당일, app.js 의 [입력→계산] 자리에서)
     const r = await DataLayer.load("kma-vilage-fcst", { nx: 60, ny: 127 });
     if (r.ok) {
       const items = DataLayer.getPath(r.data, "response.body.items.item");
       renderBadge(DataLayer.sourceLabel(r.source));   // "실시간" 또는 "예시"
       // ... items 렌더
     }

   프록시 주소 바꾸기:  window.DATA_PROXY = "http://localhost:9000";  // data.js 로드 전
   ========================================================================= */
(function () {
  "use strict";

  var PROXY = (typeof window !== "undefined" && window.DATA_PROXY) || "http://localhost:8088";
  // 프록시 없이 정적 스냅샷만 쓸 때의 경로(served 폴더에 snapshots/ 복사 시).
  var STATIC_SNAP = (typeof window !== "undefined" && window.DATA_SNAP_BASE) || "./snapshots";

  function qs(params) {
    if (!params) return "";
    var parts = [];
    Object.keys(params).forEach(function (k) {
      if (params[k] == null) return;
      parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
    });
    return parts.length ? "?" + parts.join("&") : "";
  }

  function parseMaybe(text) {
    try { return JSON.parse(text); } catch (e) { return text; } // XML 등은 문자열로
  }

  function getPath(obj, path) {
    if (!path) return obj;
    return path.split(".").reduce(function (o, k) {
      return o == null ? undefined : o[k];
    }, obj);
  }

  function sourceLabel(source) {
    return source === "live" ? "실시간" : "예시";
  }

  /* 한 곳을 fetch 해서 {ok, status, source, data, raw} 로 정규화 */
  function tryFetch(url, source) {
    return fetch(url, { headers: { Accept: "application/json" } }).then(function (res) {
      return res.text().then(function (text) {
        var hdr = res.headers.get("X-Data-Source");
        return {
          ok: res.ok,
          status: res.status,
          source: hdr || source,
          data: parseMaybe(text),
          raw: text,
        };
      });
    });
  }

  /**
   * load(id, params, opts)
   *   1) 프록시 /api/<id> (라이브, 실패 시 프록시가 스냅샷으로 폴백)
   *   2) 프록시 자체가 안 뜬 경우 → 프록시 /snap/<id>
   *   3) 그래도 실패 → 정적 ./snapshots/<id>.json
   * 반환: { ok, source:"live"|"snapshot", data, raw, error? }
   */
  function load(id, params, opts) {
    opts = opts || {};
    var proxy = opts.proxy || PROXY;
    var liveUrl = proxy + "/api/" + encodeURIComponent(id) + qs(params);

    return tryFetch(liveUrl, "live")
      .then(function (r) {
        if (r.ok) return r;
        throw new Error("proxy status " + r.status);
      })
      .catch(function () {
        // 프록시 미기동 등 → 프록시 스냅샷
        return tryFetch(proxy + "/snap/" + encodeURIComponent(id), "snapshot").then(function (r) {
          if (r.ok) return r;
          throw new Error("snap proxy fail");
        });
      })
      .catch(function () {
        // 최후: 정적 스냅샷
        return tryFetch(STATIC_SNAP + "/" + encodeURIComponent(id) + ".json", "snapshot");
      })
      .catch(function (e) {
        return { ok: false, source: "none", data: null, raw: "", error: String(e && e.message || e) };
      });
  }

  var api = { load: load, getPath: getPath, sourceLabel: sourceLabel, proxy: PROXY };
  if (typeof window !== "undefined") window.DataLayer = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
