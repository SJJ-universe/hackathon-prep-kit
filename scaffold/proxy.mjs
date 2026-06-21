#!/usr/bin/env node
/* =========================================================================
   proxy.mjs — 무설치(zero-dependency) CORS 우회 프록시  (Node 내장 모듈만)
   -------------------------------------------------------------------------
   왜 필요한가
     - data.go.kr / safetydata 등 공공 API는 보통 CORS 헤더가 없어
       브라우저 fetch가 막힌다. 또 serviceKey를 프런트에 노출하면 안 된다.
     - 이 프록시가 중간에서 serviceKey를 붙여 재요청하고, 응답에 CORS 헤더를
       달아 돌려준다. 라이브 호출 실패 시 사전 스냅샷으로 자동 폴백한다.

   실행 (어떤 노트북이든 Node만 있으면 됨, npm install 불필요)
     node scaffold/proxy.mjs            # 기본 포트 8088
     PORT=9000 node scaffold/proxy.mjs

   엔드포인트
     GET /health            → { ok:true }
     GET /catalog           → data/catalog.json 그대로 (앱이 메타 조회)
     GET /api/<id>?<params> → 카탈로그의 해당 API를 serviceKey 붙여 실호출.
                              실패하면 data/snapshots/<id>.json 로 폴백.
     GET /snap/<id>         → 스냅샷만 강제로 반환(오프라인 데모용).

   .env (루트의 .env.example 참고) — 키는 절대 커밋하지 말 것(.gitignore 처리됨)
     DATA_GO_KR_KEY=...        # data.go.kr 일반 인증키 (Decoding 키 권장)
     SAFETYDATA_KEY=...        # safetydata.go.kr 키
     KAKAO_REST_KEY=...        # Kakao REST 키 (Authorization 헤더)
     # 인코딩(Encoding) 키를 넣었다면 이중인코딩 방지를 위해:
     DATA_GO_KR_KEY_ENCODED=true
   ========================================================================= */

import http from "node:http";
import https from "node:https";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, ".."); // scaffold/ → 저장소 루트
const CATALOG_PATH = join(ROOT, "data", "catalog.json");
const SNAP_DIR = join(ROOT, "data", "snapshots");
const ENV_PATH = join(ROOT, ".env");
const PORT = Number(process.env.PORT || 8088);

/* ---- 아주 단순한 .env 로더 (이미 있는 process.env 는 덮지 않음) ---- */
function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    let v = m[2].replace(/^["']|["']$/g, "");
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadEnv(ENV_PATH);

function loadCatalog() {
  if (!existsSync(CATALOG_PATH)) return { apis: [] };
  try { return JSON.parse(readFileSync(CATALOG_PATH, "utf8")); }
  catch (e) { console.error("catalog.json 파싱 실패:", e.message); return { apis: [] }; }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function send(res, status, body, extra = {}) {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...CORS, ...extra,
  });
  res.end(payload);
}

/* serviceKey 를 쿼리에 안전하게 부착.
   - 기본: env 키를 1회 encodeURIComponent (Decoding 키 가정).
   - <ENVKEY>_ENCODED=true 면 이미 인코딩된 키로 보고 그대로 부착(이중인코딩 방지). */
function appendServiceKey(qs, api) {
  const auth = api.auth || {};
  if (auth.type !== "serviceKey") return qs;
  const envName = api.envKey || "DATA_GO_KR_KEY";
  const raw = process.env[envName];
  if (!raw) return qs; // 키 없으면 그대로(상위에서 폴백 처리)
  const encoded = process.env[envName + "_ENCODED"] === "true";
  const val = encoded ? raw : encodeURIComponent(raw);
  const param = auth.param || "serviceKey";
  return qs ? `${qs}&${param}=${val}` : `${param}=${val}`;
}

/* 업스트림 GET (http/https 자동) */
function upstreamGet(urlStr, headers = {}) {
  return new Promise((res, rej) => {
    const u = new URL(urlStr);
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.request(
      u,
      { method: "GET", headers: { "User-Agent": "hackathon-prep-kit/proxy", ...headers }, timeout: 8000 },
      (r) => {
        let data = "";
        r.setEncoding("utf8");
        r.on("data", (c) => (data += c));
        r.on("end", () => res({ status: r.statusCode, body: data, ctype: r.headers["content-type"] || "" }));
      }
    );
    req.on("timeout", () => req.destroy(new Error("upstream timeout")));
    req.on("error", rej);
    req.end();
  });
}

function readSnap(id) {
  const p = join(SNAP_DIR, `${id}.json`);
  if (!existsSync(p)) return null;
  try { return readFileSync(p, "utf8"); } catch { return null; }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }
  if (path === "/health") return send(res, 200, { ok: true, port: PORT });
  if (path === "/catalog") {
    if (!existsSync(CATALOG_PATH)) return send(res, 404, { error: "catalog.json 없음" });
    return send(res, 200, readFileSync(CATALOG_PATH, "utf8"));
  }

  // /snap/<id>
  let m = path.match(/^\/snap\/([\w-]+)$/);
  if (m) {
    const snap = readSnap(m[1]);
    if (snap == null) return send(res, 404, { error: `스냅샷 없음: ${m[1]}` });
    return send(res, 200, snap, { "X-Data-Source": "snapshot" });
  }

  // /api/<id>
  m = path.match(/^\/api\/([\w-]+)$/);
  if (m) {
    const id = m[1];
    const catalog = loadCatalog(); // 매 요청 재로딩 → 카탈로그 수정 즉시 반영
    const api = (catalog.apis || []).find((a) => a.id === id);
    if (!api) return send(res, 404, { error: `알 수 없는 API id: ${id}` });

    // 기본 파라미터(api.params) + 요청 쿼리 병합 (요청이 우선)
    const merged = new URLSearchParams();
    for (const [k, v] of Object.entries(api.params || {})) merged.set(k, v);
    for (const [k, v] of url.searchParams.entries()) merged.set(k, v);
    let qs = merged.toString();
    qs = appendServiceKey(qs, api); // serviceKey 는 인코딩 제어 위해 수동 부착

    const headers = {};
    if ((api.auth || {}).type === "header" && api.envKey && process.env[api.envKey]) {
      const tmpl = api.auth.headerTemplate || "{key}";
      headers[api.auth.header || "Authorization"] = tmpl.replace("{key}", process.env[api.envKey]);
    }

    const target = api.endpoint + (qs ? (api.endpoint.includes("?") ? "&" : "?") + qs : "");
    try {
      const up = await upstreamGet(target, headers);
      // 일부 공공API는 에러도 200+XML 로 준다 → 본문 그대로 전달, 출처표기
      return send(res, up.status || 200, up.body, {
        "X-Data-Source": "live",
        "X-Upstream-Status": String(up.status || ""),
      });
    } catch (e) {
      const snap = readSnap(id);
      if (snap != null) return send(res, 200, snap, { "X-Data-Source": "snapshot", "X-Live-Error": e.message });
      return send(res, 502, { error: "업스트림 실패, 스냅샷도 없음", detail: e.message, target });
    }
  }

  return send(res, 404, { error: "경로 없음", hint: "/health /catalog /api/<id> /snap/<id>" });
});

server.listen(PORT, () => {
  const n = loadCatalog().apis?.length || 0;
  console.log(`[proxy] http://localhost:${PORT}  (catalog: ${n}개 API)`);
  console.log(`[proxy] 예) /api/<id>?<params> · /snap/<id> · /catalog · /health`);
  if (!existsSync(ENV_PATH)) console.log(`[proxy] 주의: ${ENV_PATH} 없음 → 키가 필요한 라이브 호출은 폴백/실패`);
});
