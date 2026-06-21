#!/usr/bin/env node
/* =========================================================================
   check-data.mjs — 대회 전 데이터 사전점검 + 스냅샷 프리페치 (무설치, Node만)
   -------------------------------------------------------------------------
   하는 일 (집에서 1회 실행 권장)
     1) data/catalog.json 의 각 API를 .env 키로 실제 1회 호출
     2) 응답 상태 / JSON 여부 / 데이터 행수 / CORS 헤더 유무를 표로 출력
     3) 성공한 응답을 data/snapshots/<id>.json 으로 저장
        → 당일 라이브가 막혀도 프록시가 이 스냅샷으로 자동 폴백(=데모 안전망)

   실행
     node tools/check-data.mjs                # 전체
     node tools/check-data.mjs kma-vilage-fcst taas-oldman   # 특정 id만

   결과 판정
     LIVE  = 라이브 호출 성공 + 데이터 있음 (라이브 사수 후보)
     EMPTY = 호출은 됐으나 데이터 0행 (파라미터/기간 조정 필요)
     NOKEY = .env 에 해당 키 없음 (키 발급/입력 필요)
     IDTODO= endpoint 에 확정 안 된 serviceId (__CONFIRM__) → 포털에서 확인
     FAIL  = 네트워크/오류 (HTTP 상태·메시지 참고)
   ========================================================================= */

import http from "node:http";
import https from "node:https";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "..");
const CATALOG_PATH = join(ROOT, "data", "catalog.json");
const SNAP_DIR = join(ROOT, "data", "snapshots");
const ENV_PATH = join(ROOT, ".env");

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (line.trim().startsWith("#")) continue;
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const v = m[2].replace(/^["']|["']$/g, "");
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadEnv(ENV_PATH);

/* {{DATE}}, {{DATE-1}}, {{DATE-7}} → YYYYMMDD */
function subTokens(val) {
  return String(val).replace(/\{\{DATE(-(\d+))?\}\}/g, (_, __, days) => {
    const d = new Date();
    if (days) d.setDate(d.getDate() - Number(days));
    return d.toISOString().slice(0, 10).replace(/-/g, "");
  });
}

function getNested(obj, path) {
  if (!path) return obj;
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function fetchRaw(urlStr, headers = {}) {
  return new Promise((res) => {
    let u;
    try { u = new URL(urlStr); } catch (e) { return res({ ok: false, err: "URL 오류: " + e.message }); }
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.request(u, { method: "GET", headers: { "User-Agent": "prep-kit/check-data", ...headers }, timeout: 10000 }, (r) => {
      let data = "";
      r.setEncoding("utf8");
      r.on("data", (c) => (data += c));
      r.on("end", () => res({ ok: true, status: r.statusCode, body: data, headers: r.headers }));
    });
    req.on("timeout", () => { req.destroy(); res({ ok: false, err: "timeout(10s)" }); });
    req.on("error", (e) => res({ ok: false, err: e.message }));
    req.end();
  });
}

function buildUrl(api) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(api.params || {})) sp.set(k, subTokens(v));
  for (const [k, v] of Object.entries(api.sampleQuery || {})) sp.set(k, subTokens(v));
  let qs = sp.toString();
  const headers = {};
  const auth = api.auth || {};
  if (auth.type === "serviceKey") {
    const raw = process.env[api.envKey];
    if (raw) {
      const enc = process.env[api.envKey + "_ENCODED"] === "true";
      const val = enc ? raw : encodeURIComponent(raw);
      qs = (qs ? qs + "&" : "") + (auth.param || "serviceKey") + "=" + val;
    }
  } else if (auth.type === "header") {
    const raw = process.env[api.envKey];
    if (raw) headers[auth.header || "Authorization"] = (auth.headerTemplate || "{key}").replace("{key}", raw);
  }
  const url = api.endpoint + (qs ? (api.endpoint.includes("?") ? "&" : "?") + qs : "");
  return { url, headers };
}

function countRows(body, responsePath) {
  try {
    const json = JSON.parse(body);
    const node = getNested(json, responsePath);
    if (Array.isArray(node)) return node.length;
    if (node && typeof node === "object") return 1;
    return 0;
  } catch { return -1; } // -1 = JSON 아님(XML 등)
}

const PAD = (s, n) => (String(s) + " ".repeat(n)).slice(0, n);

async function main() {
  if (!existsSync(CATALOG_PATH)) { console.error("catalog.json 없음:", CATALOG_PATH); process.exit(1); }
  if (!existsSync(SNAP_DIR)) mkdirSync(SNAP_DIR, { recursive: true });
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  const only = process.argv.slice(2);
  const apis = (catalog.apis || []).filter((a) => only.length === 0 || only.includes(a.id));

  if (!existsSync(ENV_PATH)) console.log("주의: .env 없음 → 키 필요한 API는 NOKEY로 표시됩니다.\n");

  console.log(PAD("ID", 20), PAD("승인", 10), PAD("판정", 7), PAD("행수", 6), PAD("CORS", 6), "비고");
  console.log("-".repeat(86));

  const rows = [];
  for (const api of apis) {
    let verdict, rowCount = "", corsTag = "", note = "";

    if ((api.endpoint || "").includes("__CONFIRM")) {
      verdict = "IDTODO"; note = "포털에서 serviceId 확정 후 endpoint 교체";
    } else if ((api.auth || {}).type !== "none" && api.envKey && !process.env[api.envKey]) {
      verdict = "NOKEY"; note = `.env 의 ${api.envKey} 필요`;
    } else {
      const { url, headers } = buildUrl(api);
      const r = await fetchRaw(url, headers);
      if (!r.ok) { verdict = "FAIL"; note = r.err; }
      else {
        const aco = r.headers["access-control-allow-origin"];
        corsTag = aco ? "있음" : "없음";
        const n = countRows(r.body, api.responsePath);
        if (n === -1) { verdict = (r.status === 200 ? "EMPTY" : "FAIL"); note = `JSON아님(상태 ${r.status}) ${r.body.slice(0, 70).replace(/\s+/g, " ")}`; }
        else if (n === 0) { verdict = "EMPTY"; note = `상태 ${r.status}, 데이터 0 (파라미터/기간 확인)`; rowCount = 0; }
        else { verdict = "LIVE"; rowCount = n; note = `상태 ${r.status}`; }
        // 응답 저장 (FAIL이어도 디버그용으로 남김)
        try { writeFileSync(join(SNAP_DIR, `${api.id}.json`), r.body); } catch (e) { note += " [스냅저장실패]"; }
      }
    }
    rows.push({ api, verdict });
    console.log(PAD(api.id, 20), PAD(api.approval, 10), PAD(verdict, 7), PAD(rowCount, 6), PAD(corsTag, 6), note);
  }

  console.log("-".repeat(86));
  const live = rows.filter((r) => r.verdict === "LIVE");
  console.log(`\nLIVE ${live.length}개 → 스냅샷 저장: ${SNAP_DIR}`);
  if (live.length) console.log("라이브 사수 후보(우선순위 낮은 숫자=먼저):",
    live.map((r) => r.api).sort((a, b) => (a.priority || 9) - (b.priority || 9)).map((a) => a.id).join(", "));
  const todo = rows.filter((r) => ["NOKEY", "IDTODO", "EMPTY", "FAIL"].includes(r.verdict));
  if (todo.length) console.log("확인 필요:", todo.map((r) => `${r.api.id}(${r.verdict})`).join(", "));
  console.log("\n팁: LIVE 1종만 당일 실호출로 '라이브 증명'하고, 나머지는 스냅샷+'예시' 배지로 정직하게 보여주세요.");
}
main();
