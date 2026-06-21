# Static App Scaffold

대회 당일, 빈 새 저장소에서 곧바로 시작할 수 있는 무프레임워크(바닐라) 정적 앱 골격입니다.
주제에 종속되지 않은 일반 템플릿이며, MVP 1~2개 기능만 빠르게 얹는 데 최적화되어 있습니다.

## 반입 규칙 주의 (중요)

- 이 스캐폴드는 일반 골격일 뿐, 주제 맞춤 로직은 들어있지 않습니다.
- 아이디어 구현 코드는 반드시 대회 당일, 빈 새 저장소에서 작성하세요.
- 파일 안의 `TODO` 표시 지점에만 로직을 채우는 방식으로 사용합니다.

## 구성

- `index.html` : 헤더 / 메인(입력 영역, 결과 영역) / 푸터. 시맨틱 마크업 + 접근성 기본.
- `app.css` : 디자인 토큰(색·간격·타이포·라운드·그림자) + 범용 컴포넌트(버튼·카드·인풋·뱃지·토스트).
- `app.js` : 셀렉터 헬퍼, 안전 출력(escape), 간단 상태 store, 결과 렌더 골격, 서비스워커 가드.
- `serve.ps1` : 로컬 정적 서버 실행 + 브라우저 자동 오픈.
- `deploy-netlify.ps1` : Netlify Drop 안내 + CLI 배포(`-Dir`/`-SiteName`/`-DropOnly`/`-Draft`). 상세는 [`../guides/06_Netlify_배포_상세가이드.md`](../guides/06_Netlify_배포_상세가이드.md).
- `netlify.toml` : SPA 404 방지 리다이렉트 + 기본 보안 헤더(제너릭). 빌드형이면 publish만 조정.
- `deploy-vercel.ps1` : Vercel 미러 배포(L1, `-Dir`/`-Prod`). 상세는 [`../guides/07_미러_터널_배포_상세가이드.md`](../guides/07_미러_터널_배포_상세가이드.md).
- `tunnel-cloudflared.ps1` : 로컬 서버 + cloudflared quick tunnel(L2, `-Dir`/`-Port`). 공개 HTTPS로 폰에서 카메라/위치 동작.
- `vercel.json` : Vercel용 SPA rewrites 템플릿(제너릭).
- `deploy-ghpages.ps1` : gh CLI로 저장소 생성 → 푸시 → Pages 활성화.

## 빠른 시작 (당일 흐름)

1. 새 저장소에 이 파일들을 복사한다.
2. 로컬 확인:
   ```powershell
   .\serve.ps1
   ```
   기본 `http://localhost:8137` 로 열립니다. (http로 열어야 fetch/서비스워커 정상 동작)
3. 아이디어 구현은 다음 세 곳의 `TODO`에만 추가:
   - `index.html` : 입력 컨트롤, 결과 마크업
   - `app.js` : `submit` 핸들러의 [입력 → 계산], `renderResult()` [결과 표시]
   - `app.css` : 필요 시 `--color-accent` 등 토큰만 조정
4. 배포(둘 중 하나):
   ```powershell
   .\deploy-netlify.ps1          # 가장 빠름(브라우저 Drop) + CLI
   .\deploy-ghpages.ps1 -Repo my-demo
   ```

## MVP 원칙

- 기능은 1~2개로 좁힌다. "입력 → 계산 → 결과"가 한 화면에서 끝나게 한다.
- 외부 의존성을 최소화한다(프레임워크/빌드 없음 → 어떤 PC에서도 즉시 실행).
- 사용자/외부 입력은 항상 `escapeHtml`로 감싸 안전하게 출력한다.

## 1줄 데모 원칙

- 심사위원에게 보여줄 핵심 동작을 한 문장으로 말할 수 있어야 한다.
  예: "이 값을 넣으면 이 결과가 즉시 나옵니다." (그 한 동작이 끊김 없이 되게 만든다.)
