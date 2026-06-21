#!/usr/bin/env python3
# =========================================================================
#  proxy.py — 무설치 CORS 우회 프록시 (Python 표준 라이브러리만, pip 불필요)
#  -------------------------------------------------------------------------
#  Node가 없는 노트북용 대안. proxy.mjs 와 동일하게 동작한다.
#
#  실행
#    python scaffold/proxy.py            # 기본 8088
#    set PORT=9000 && python scaffold/proxy.py     (Windows cmd)
#    $env:PORT=9000; python scaffold/proxy.py      (PowerShell)
#
#  엔드포인트: /health  /catalog  /api/<id>?<params>  /snap/<id>
#  .env: 루트 .env (DATA_GO_KR_KEY / SAFETYDATA_KEY / KAKAO_REST_KEY,
#        Encoding 키면 <ENVKEY>_ENCODED=true)
# =========================================================================
import json, os, sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs, urlencode, quote
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CATALOG_PATH = os.path.join(ROOT, "data", "catalog.json")
SNAP_DIR = os.path.join(ROOT, "data", "snapshots")
ENV_PATH = os.path.join(ROOT, ".env")
PORT = int(os.environ.get("PORT", "8088"))

def load_env(path):
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if line.strip().startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            k = k.strip(); v = v.strip().strip('"').strip("'")
            if k and os.environ.get(k) is None:
                os.environ[k] = v

def load_catalog():
    try:
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        sys.stderr.write("catalog.json 로드 실패: %s\n" % e)
        return {"apis": []}

def find_api(cat, _id):
    for a in cat.get("apis", []):
        if a.get("id") == _id:
            return a
    return None

def read_snap(_id):
    p = os.path.join(SNAP_DIR, _id + ".json")
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            return f.read()
    return None

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):  # 조용히
        pass

    def _send(self, status, body, extra=None):
        if not isinstance(body, (str, bytes)):
            body = json.dumps(body, ensure_ascii=False)
        if isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        for k, v in CORS.items():
            self.send_header(k, v)
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        for k, v in CORS.items():
            self.send_header(k, v)
        self.end_headers()

    def do_GET(self):
        u = urlparse(self.path)
        path = u.path

        if path == "/health":
            return self._send(200, {"ok": True, "port": PORT})
        if path == "/catalog":
            if not os.path.exists(CATALOG_PATH):
                return self._send(404, {"error": "catalog.json 없음"})
            with open(CATALOG_PATH, "r", encoding="utf-8") as f:
                return self._send(200, f.read())

        if path.startswith("/snap/"):
            _id = path[len("/snap/"):]
            snap = read_snap(_id)
            if snap is None:
                return self._send(404, {"error": "스냅샷 없음: " + _id})
            return self._send(200, snap, {"X-Data-Source": "snapshot"})

        if path.startswith("/api/"):
            _id = path[len("/api/"):]
            cat = load_catalog()
            api = find_api(cat, _id)
            if not api:
                return self._send(404, {"error": "알 수 없는 API id: " + _id})

            # 기본 params + 요청 쿼리 병합 (요청 우선)
            merged = {}
            for k, v in (api.get("params") or {}).items():
                merged[k] = v
            for k, vs in parse_qs(u.query, keep_blank_values=True).items():
                merged[k] = vs[-1]
            qs = urlencode(merged)

            headers = {"User-Agent": "prep-kit/proxy.py"}
            auth = api.get("auth") or {}
            if auth.get("type") == "serviceKey":
                env_name = api.get("envKey", "DATA_GO_KR_KEY")
                raw = os.environ.get(env_name)
                if raw:
                    encoded = os.environ.get(env_name + "_ENCODED") == "true"
                    val = raw if encoded else quote(raw, safe="")
                    param = auth.get("param", "serviceKey")
                    qs = (qs + "&" if qs else "") + param + "=" + val
            elif auth.get("type") == "header":
                raw = os.environ.get(api.get("envKey", ""))
                if raw:
                    tmpl = auth.get("headerTemplate", "{key}")
                    headers[auth.get("header", "Authorization")] = tmpl.replace("{key}", raw)

            sep = "&" if "?" in api["endpoint"] else "?"
            target = api["endpoint"] + (sep + qs if qs else "")
            try:
                req = Request(target, headers=headers)
                with urlopen(req, timeout=8) as r:
                    data = r.read()
                return self._send(200, data, {"X-Data-Source": "live"})
            except HTTPError as e:
                # 공공API는 에러도 본문으로 주는 경우 → 그대로 전달
                try:
                    body = e.read()
                except Exception:
                    body = b""
                return self._send(e.code, body or {"error": "upstream %d" % e.code}, {"X-Data-Source": "live"})
            except (URLError, Exception) as e:
                snap = read_snap(_id)
                if snap is not None:
                    return self._send(200, snap, {"X-Data-Source": "snapshot", "X-Live-Error": str(e)})
                return self._send(502, {"error": "업스트림 실패, 스냅샷 없음", "detail": str(e), "target": target})

        return self._send(404, {"error": "경로 없음", "hint": "/health /catalog /api/<id> /snap/<id>"})

def main():
    load_env(ENV_PATH)
    os.makedirs(SNAP_DIR, exist_ok=True)
    n = len(load_catalog().get("apis", []))
    print("[proxy.py] http://localhost:%d  (catalog: %d개 API)" % (PORT, n))
    print("[proxy.py] 예) /api/<id>?<params> · /snap/<id> · /catalog · /health")
    if not os.path.exists(ENV_PATH):
        print("[proxy.py] 주의: %s 없음 → 키 필요한 라이브 호출은 폴백/실패" % ENV_PATH)
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()

if __name__ == "__main__":
    main()
