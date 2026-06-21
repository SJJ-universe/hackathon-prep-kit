# 06 Netlify 배포 상세 가이드 (현재 사이트 기준, 2026-06 검증)

심사위원이 자기 폰으로 QR을 찍어 직접 실행하려면 결과물을 **공개 HTTPS 주소**에 올려야 한다. Netlify는 그 일을 가장 빠르게(드래그 한 번) 해 주는 정적 호스트다. 이 문서는 현재(2026-06) Netlify 화면·명령 기준의 단계별 사용법이다. 빠른 요약은 [03 호스팅·심사위원 시연](03_호스팅_심사위원_시연.md)에 있고, 여기서는 그 1순위(L0) 경로(Netlify)를 끝까지 펼친다. 다음 폴백 칸인 **Vercel 미러(L1)·cloudflared 터널(L2)**은 [07 미러·터널 배포 상세 가이드](07_미러_터널_배포_상세가이드.md)를 본다.

> 핵심 사실(검증): 무료 플랜은 2025-09-04부터 **크레딧제**로 바뀌었고 **초과 결제가 없는 하드캡**이다(소진 시 사이트 일시정지). 데모 당일 멈춤을 피하려면 큰 미디어·무거운 Functions를 피하라. UI 메뉴가 "Sites"에서 **"Projects"**로 개명되었다(옛 튜토리얼의 "Site settings" = 지금의 "Project configuration").

---

## 0. 두 경로 — 언제 무엇을 쓰나

| | 경로 A: Netlify Drop | 경로 B: Netlify CLI |
|---|---|---|
| 방식 | 브라우저에 **폴더 드래그** | 터미널 `netlify deploy --prod` |
| 사전 준비 | 없음(무인증 가능) / 로그인 권장 | `netlify-cli` 설치 + 로그인(또는 토큰) |
| 속도 | 수 초 | 첫 로그인 포함 1~2분 |
| 무대 적합 | **현장 1순위**(가장 단순·실패지점 적음) | 반복 재배포·자동화·에이전트에 유리 |
| 영속성 | 로그인 안 하면 **1시간 후 소멸** | 로그인 계정에 영구 보존 |

권장: **현장 본배포는 Drop**(로그인한 상태로), **연습·자동 재배포는 CLI**. 둘 다 준비해 두고, 무대에서는 Drop을 1순위로 둔다.

---

## 경로 A — Netlify Drop (현재 화면 단계별)

### A-1. 먼저 로그인부터 (중요)

무인증으로도 드롭은 되지만, 만들어진 사이트는 **1시간 안에 클레임(회원가입/로그인으로 귀속)하지 않으면 사라진다**(공식 문구: "claim within one hour"). 발표 전에 만든 데모 URL이 발표 도중 사라지면 치명적이다. 그러니:

1. `https://app.netlify.com` 에서 먼저 **로그인**(GitHub 계정으로 가입이 가장 빠름).
2. 그 다음에 드롭한다 → 사이트가 내 팀에 영구 귀속된다.

### A-2. 드롭 절차

1. `https://app.netlify.com/drop` 를 연다(또는 Projects 대시보드 하단의 드롭존).
2. **폴더를 통째로 드래그**한다. (zip 아님 — zip이면 먼저 압축을 풀고 폴더를 드래그. 낱개 파일도 아님.)
   - 빌드형이면 빌드 산출 폴더(`dist` / `build` / `public`)를 드래그.
   - 무빌드 정적이면 `index.html`이 든 폴더.
3. **`index.html`이 폴더 최상위(루트)에 있어야 한다.** 하위폴더 안에 있으면 "Please drop a folder containing an index.html file" 오류 또는 배포 후 404가 난다(가장 흔한 실수).
4. 드롭하면 수 초 내 라이브. **`https://<랜덤단어>.netlify.app`** 형태의 URL이 발급된다.

브라우저/환경: 최신 Chromium 계열 브라우저, 안정적 네트워크, 그리고 **압축 해제 기준 프로젝트 용량의 약 4배 여유 RAM**을 권고한다.

### A-3. 용량 한도 (드래그앤드롭)

- 전체 배포: **50MB 미만**일 때 가장 잘 된다.
- 개별 파일: **10MB 초과 파일은 배포가 멈출 수 있다.**
- 이를 넘으면 Drop 대신 **CLI**(경로 B)를 쓰라고 Netlify가 안내한다. (한글 폰트 base64·동영상 등 큰 자산이 있으면 주의 — 폰트는 서브셋, 동영상은 외부 링크/유튜브 권장.)

### A-4. 고정된 URL로 이름 바꾸기 (현재 메뉴 경로)

랜덤 URL은 QR·카카오맵 도메인 등록에 불편하다. **공유 전에 한 번** 이름을 바꿔 고정 슬러그를 만든다.

- 현재 경로: **사이트 클릭 → Project configuration → General → Project details → "Manage project name"** (구 라벨: Site configuration → Site details → "Change site name").
- 입력 후 저장하면 즉시 **`https://<새이름>.netlify.app`** 로 바뀐다.
- 주의: **옛 랜덤 URL은 새 주소로 리다이렉트되지 않는다.** 그러니 QR을 만들고 공유하기 **전에** 먼저 개명할 것.

### A-5. 업데이트 재배포 (같은 사이트 유지)

코드를 고친 뒤에는 **그 사이트의 Deploys 페이지 하단 드롭존**에 새 산출 폴더를 다시 드래그한다(Production deploys 영역). 같은 URL/슬러그를 유지한 채 새 배포가 시작된다.

- 함정: 일반 `app.netlify.com/drop` 페이지에 다시 드롭하면 **새 사이트(새 랜덤 URL)**가 생긴다 — 업데이트할 때는 그러지 말 것.

---

## 경로 B — Netlify CLI (현재 명령 기준)

### B-1. 설치

```
npm install -g netlify-cli
```

- 현재 버전대: **netlify-cli v26.x**, **Node.js 20.12.2 이상** 필요(키트 `setup.ps1`의 Node LTS면 충족).
- 실행 바이너리 이름은 **`netlify`**. 설치 확인: `netlify --version`.
- 전역설치가 막히면 일회성으로 `npx netlify-cli <명령>` 도 가능.

### B-2. 인증 — 두 방식

대화형(브라우저 OAuth):
```
netlify login
```
브라우저가 열려 "Netlify CLI" 권한을 허용하면 토큰이 로컬에 저장된다(Windows: `AppData\Roaming\netlify\Config\config.json`).

비대화형(CI / 에이전트 — 브라우저 못 띄울 때): 환경변수로 토큰을 주면 `netlify login`을 건너뛴다.
```
# PowerShell
$env:NETLIFY_AUTH_TOKEN = "토큰값"
```
개인 액세스 토큰(PAT) 발급 경로(현재 UI): **User settings → Applications → Personal access tokens** (바로가기: `https://app.netlify.com/user/applications#personal-access-tokens`) → **New access token** → 이름·만료 설정 → **Generate token** → 복사해 `NETLIFY_AUTH_TOKEN`으로 보관.

### B-3. 배포 명령 (현재)

```
netlify deploy                         # 드래프트 배포 -> 임시 미리보기 URL
netlify deploy --prod                  # 프로덕션(실 URL)로 배포
netlify deploy --prod --dir=dist       # 배포할 폴더 지정
netlify deploy --prod --dir=. --no-build   # 무빌드 순수 정적 한 줄
netlify deploy --site <이름또는ID> --prod  # 특정 사이트로 배포
```

주요 플래그(모두 현재 유효): `--prod`(프로덕션), `--dir`(배포 폴더), `--site`(대상 사이트), `--no-build`(빌드 단계 생략 — 순수 HTML 폴더에 필수), `--alias`(예측 가능한 미리보기 URL, 최대 37자), `--message`, `--allow-anonymous`(무로그인 배포·드래프트).

첫 실행 때 폴더가 사이트에 연결돼 있지 않으면, **기존 사이트 선택 / 새 사이트 생성**을 물어보고 이후 그 폴더를 연결해 둔다.

### B-4. 새 사이트에 비대화형으로 올리기 (에이전트/CI)

가장 단순한 길은 링크 단계를 건너뛰고 deploy가 사이트를 만들게 하는 것:
```
$env:NETLIFY_AUTH_TOKEN = "토큰값"
netlify deploy --prod --dir=. --no-build --site my-demo-name
```
명시적으로 만들고 올리려면:
```
netlify sites:create --name my-demo-name
netlify deploy --prod --dir=. --no-build
```

> 키트에는 이 경로를 감싼 도우미 `scaffold/deploy-netlify.ps1` 이 있다. 한 줄로 Drop 페이지를 열거나 CLI 배포를 시도한다(설치·인증 점검 포함). 사용법은 아래 "한 줄 배포" 참고.

---

## SPA 404 방지 (새로고침 시 빈 화면/404)

클라이언트 라우터를 쓰면 하위경로 새로고침 때 404가 난다. 모든 경로를 앱 셸로 보내는 캐치올 리라이트를 둔다(단일 화면 정적이면 불필요).

방법 A — `_redirects` 파일(확장자 없음). **배포(publish) 폴더 루트**에 둔다. Vite/CRA면 `public/`에 두면 빌드가 산출 폴더로 복사한다.
```
/*    /index.html   200
```
방법 B — `netlify.toml`(저장소 루트):
```
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```
`200`이면 **리라이트**(주소창 URL 유지, SPA 라우터가 처리). 이 파일이 **실제 배포된 산출물 안**에 들어가야 효과가 있다(저장소에만 있고 빌드에 안 들어가면 무효). Drop으로 올릴 때도 드래그하는 폴더 안에 `_redirects`가 있어야 한다.

---

## 고정/커스텀 도메인 + 카카오맵 도메인 등록 경고

- 커스텀 도메인: **Project overview → Domain management → Add a domain** → "Add a domain you already own"(또는 구매).
- 고정 `*.netlify.app` 서브도메인: A-4의 이름 변경으로 확정(공유 전 한 번).
- **카카오맵 직격 주의:** Kakao JavaScript SDK는 웹 도메인 화이트리스트를 강제한다. **최종 배포 오리진**(예: `https://my-demo-name.netlify.app` 또는 커스텀 도메인)을 **Kakao Developers → 내 애플리케이션 → 앱 설정 → 플랫폼 → Web → 사이트 도메인**에 등록해야 한다. 랜덤 미리보기 서브도메인과 개명/커스텀 도메인은 서로 다른 오리진이다 — **실제 배포할 도메인을 등록**하지 않으면 심사위원 폰에서 지도가 조용히 "도메인 미등록" 오류로 깨진다. localhost(개발용)와 배포 도메인을 **둘 다** 등록해 두는 것이 안전.

---

## Netlify Functions — API 키 숨기기 / CORS 프록시

브라우저에서 외부 공개 API를 직접 부르면 CORS 또는 키 노출 문제가 난다. 키가 필요한 호출은 서버리스 함수 뒤로 숨긴다(정적 사이트 그대로 유지하면서).

- 폴더: `netlify/functions/` (기본).
- 프런트 호출 경로: `/.netlify/functions/<함수이름>`.
- **현재 시그니처(중요 변경):** 옛 `export const handler = async (event) => { return { statusCode, body } }`(AWS Lambda 스타일)는 **폐지 예정(2027-07-01 이후 배포 거부)**. 2026 기준 권장형:

```
// netlify/functions/proxy.mjs
export default async (req, context) => {
  const key = process.env.MY_API_KEY;          // 서버에서만 읽힘(브라우저 노출 안 됨)
  const upstream = await fetch("https://api.example.com/data?key=" + key);
  const data = await upstream.json();
  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    },
  });
};
```
프런트: `fetch('/.netlify/functions/proxy')` — 키가 브라우저에 닿지 않고, 함수 응답이 CORS도 해결한다.

- 환경변수 설정 경로(현재): **Project configuration → Environment variables**(구 "Site configuration"). 함수에서 `process.env.MY_API_KEY`로 읽는다. **절대 프런트 번들에 키를 넣지 말 것.**
- 무료 플랜 함수는 **동기 실행 10초 제한**. 무거운 작업/대용량 응답은 피한다.

> 더 단순한 대안: 키가 필요 없는 시연이라면, 데모용 응답을 **사전 캐시 JSON**(`/mock/<입력>.json`)으로 번들에 동봉하고 `라이브 → 실패 시 캐시`로 폴백한다(함수조차 불필요). 라이브 API가 막혀도 심사위원에겐 에러 대신 데이터가 보인다.

---

## 무료 플랜 한도 (2026, 크레딧제)

2025-09-04 이후 가입 계정은 크레딧제다. 그 전 계정은 레거시 한도(대역폭 100GB/월 + 빌드 300분/월).

- **월 300 크레딧 — 하드캡**(자동충전·초과결제 없음, 소진 시 사이트 일시정지).
- 동시 빌드 1, 프로젝트 최대 500개.
- 웹 대역폭 20크레딧/GB(전부 대역폭에 쓰면 ≈15GB/월).
- 프로덕션 배포 15크레딧/회(≈20회/월) — 연습 재배포를 너무 자주 돌리지 말 것.
- 웹 요청 2크레딧/1만 요청. 함수 컴퓨트 10크레딧/GB-시간(+10초 타임아웃).
- 크레딧은 **공용 풀**이라 위 수치는 동시 최대가 아니라 상호 배타적 상한이다.

해커톤 데모 규모(심사위원 몇 명이 잠깐 접속)에서는 한도가 문제되지 않는다. 다만 **하드캡**이라 바이럴/대용량 미디어는 데모 도중 사이트를 멈출 수 있으니 피한다.

---

## 흔한 함정 (2025–2026)

- **메뉴 개명**: "Sites" → **"Projects"**. 옛 튜토리얼의 "Site settings / Build & deploy"는 지금의 "Project configuration" 메뉴. 환경변수도 "Project configuration → Environment variables".
- **재배포 후 옛 화면**: 배포 시 엣지 캐시는 자동 무효화되지만 빌드 의존성 캐시가 옛 산출물을 물고 올 수 있다 → **Deploys → Trigger deploy → "Clear cache and deploy site"**. 브라우저 쪽은 강력새로고침(Ctrl+F5)/시크릿창.
- **자산 경로**: `*.netlify.app` 루트 배포(Drop 포함)에서는 **절대경로 `/assets/...`가 안전**하다. GitHub Pages용으로 `base: '/repo/'`를 남겨두면 깨진다 → 루트 Netlify 배포는 Vite `base: '/'` 또는 상대경로.
- **익명 Drop 1시간 소멸**: A-1 참고 — 발표용은 반드시 로그인 후 드롭.
- **HTTPS 필요 기능**: Netlify는 https라 위치정보·카메라·클립보드·서비스워커가 정상 동작한다(로컬 http LAN과 다름). 단 권한 팝업은 **실제 폰**에서 한 번 확인.

---

## 배포 직후 스모크 (30초)

```
# 1) 200 OK + 본문 확인 (PowerShell)
curl.exe -I https://<사이트>.netlify.app
# 2) 핵심 자산 1개가 실제로 받아지는지
curl.exe -s -o NUL -w "%{http_code}\n" https://<사이트>.netlify.app/app.js
```
- **다른 기기**(휴대폰)에서 **셀룰러(와이파이 끄고)**로 URL을 직접 열어 본다 → 5초 내 인터랙티브.
- 핵심 한 동작(입력 → 실호출/결과 → 출처칩)이 그 자리에서 돈다.
- HTTPS 필요 기능이면 권한 팝업이 뜨고 동작한다.

---

## QR 만들기 (오프라인 권장)

```
npx qrcode "https://<사이트>.netlify.app" -o qr.png
```
- 발급된 PNG를 슬라이드 + **종이 카드** 양쪽에 둔다(현장 망 불안 대비, 라이브 렌더 QR 금지).
- 고대비·충분한 크기로, 두 대의 폰으로 스캔 테스트.

---

## 한 줄 배포 (키트 스캐폴드)

```powershell
# Drop 페이지 열기 + (로그인돼 있으면) CLI 프로덕션 배포 시도
.\deploy-netlify.ps1

# Drop 안내만 (CLI 실행 안 함)
.\deploy-netlify.ps1 -DropOnly

# 폴더/사이트 지정 무빌드 배포
.\deploy-netlify.ps1 -Dir .\dist -SiteName my-demo-name
```

---

## 출처 (당일 1회 재확인 권장 — UI 라벨/한도는 변동될 수 있음)

- Netlify Drop 퀵스타트: https://docs.netlify.com/start/quickstarts/netlify-drop-quickstart/
- 배포 만들기(익명 1시간 클레임): https://docs.netlify.com/deploy/create-deploys/
- CLI 시작하기: https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/
- deploy 명령 레퍼런스: https://cli.netlify.com/commands/deploy/
- 리다이렉트 옵션(_redirects/netlify.toml): https://docs.netlify.com/manage/routing/redirects/redirect-options/
- Functions 시작하기(현대 시그니처): https://docs.netlify.com/build/functions/get-started/
- Lambda 호환(구 handler 폐지): https://docs.netlify.com/build/functions/lambda-compatibility/
- 크레딧제 요금/한도: https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/
