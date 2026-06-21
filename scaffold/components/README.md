# 생활안전 데모 컴포넌트 (주제 비종속)

슬라이드3 라이브 데모를 빠르게 만들기 위한 **재사용 UI 패턴**. deck-starter 와 같은 Civic Safety OS 팔레트라, `<iframe>` 으로 박으면 덱과 일체감이 난다.

> 반입 규칙: 여기 있는 건 액션카드/리스트/배지/지도/접근성 모드의 **일반 패턴**일 뿐, 완성 주제 앱이 아니다. 주제 데이터·로직은 당일 새 저장소에서 채운다.

## 파일

- `civic.css` — 토큰 + 컴포넌트 스타일. `.c-app` 스코프(다른 페이지 비침범).
- `components.js` — `window.Components` 렌더 헬퍼(액션카드·배지·상태·접근성·지도).
- `preview.html` — 샘플 데이터로 컴포넌트를 한눈에 보는 미리보기(키 없이 더블클릭).

## 미리보기

`preview.html` 더블클릭(또는 `scaffold/serve.ps1` 후 접속). 큰글씨/고대비/음성 토글, 카드/로딩/빈/에러 상태, 지도 플레이스홀더를 바로 확인.

---

## 10분 배선 레시피 (당일, 새 저장소에서)

목표: **공공데이터 1종 → 액션카드**. 라이브 사수 1종만 실호출, 나머지는 스냅샷.

1. 새 저장소에 `scaffold/` 를 복사. `data/catalog.json`, `data/snapshots/`, `scaffold/proxy.mjs` 도 함께.
2. 프록시 + 정적서버 기동: `node scaffold/proxy.mjs` (8088) / `scaffold/serve.ps1`.
3. `index.html` `<head>` 에 컴포넌트 로드:
   ```html
   <link rel="stylesheet" href="./components/civic.css" />
   <script src="./data.js" defer></script>
   <script src="./components/components.js" defer></script>
   ```
4. 본문에 `.c-app` 컨테이너 + 결과 영역:
   ```html
   <main class="c-app" id="app">
     <div class="c-topbar"><div class="c-title">서비스명</div><span id="badge"></span></div>
     <div id="result"></div>
   </main>
   ```
5. `app.js` 의 [입력 → 계산] 자리에서 DataLayer 와 엮는다:
   ```js
   const el = document.getElementById("result");
   Components.setLoading(el);
   const r = await DataLayer.load("kma-warn", { stnId: 108 });          // catalog id
   document.getElementById("badge").innerHTML = Components.sourceBadge(r.source); // 실시간/예시
   const rows = DataLayer.getPath(r.data, "response.body.items.item") || [];
   const cards = rows.map(toCard);                                       // ↓ 주제 변환(당일 작성)
   cards.length ? Components.renderCards(el, cards) : Components.setEmpty(el);

   function toCard(x) {            // 공공데이터 1행 → 액션카드 1장
     return {
       severity: "warn",
       badge: x.title || "안내",
       title: "필요한 한 줄 메시지",
       action: "지금 해야 할 한 가지",
       meta: [{ label: "지역", value: x.stnId }],
       cta: { label: "음성 안내", onClick: c => Components.a11y.speak(c.title + ". " + c.action) },
     };
   }
   ```

6. 취약계층 모드 바(큰글씨/고대비/음성):
   ```js
   const app = document.getElementById("app");
   app.querySelector(".c-topbar").appendChild(
     Components.a11y.mountToolbar(app, { getVoiceText: () => "현재 안내 메시지" })
   );
   ```

7. (선택) 지도: `Components.map.embed(el, { center, markers })`.
   Kakao Maps **JS SDK** 는 CORS 면제라 브라우저에서 바로 된다 — `window.KAKAO_JS_KEY` 설정 + 도메인(localhost) 등록 필요. 키 없으면 플레이스홀더로 폴백.

## 핵심 원칙

- **라이브 사수 1종만** 실호출(권장: 기상청, 즉시승인). 나머지는 스냅샷 + ‘예시’ 배지.
- 외부/사용자 값은 컴포넌트가 자동 escape. 직접 `innerHTML` 에 넣지 말 것.
- 색은 의미다: safe(시안)=정상/안전, warn·alert(앰버)=주의/경보, danger(레드)=위험.
