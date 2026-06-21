# 아이디어별 4시간 MVP 도구 매트릭스 (현장 시제 대응 한 장 종합)

> 목적: 해커톤에서 어떤 시제(현장 문제)가 나오든, 그 자리에서 골라 쓸 아이디어와 "그 MVP를 4시간에 만들 때 실제로 필요한 도구 전부"를 한 장으로 묶는다.
> 종합 출처: 고득점 아이디어뱅크(`09_korea_eval/scorecard-ideas.md`·`build-next.md`·`benchmarks.md`), 인사이더 통과 3종(`10_insider_plan/blueprints/01~03`), 작동 샘플 practice-apps 10종(`practice-apps/README.md` 및 실제 의존성 점검).
> 반입 합법선: 아래는 도구 설치·일반 지식·CDN·키 발급 정보만 담는다. 주제맞춤 완성 앱 코드는 담지 않으며, 당일 빈 새 저장소에서 처음부터 작성한다.
> 정직성 경고: 본 문서의 점수·"한국 공백/미존재" 표기는 원자료의 보수 추정이며, 대외 주장 전 1차 출처로 재검증해야 한다. 데이터셋 ID는 catalog 근거이되 Swagger 동적렌더 등으로 필드가 미확인인 항목은 "당일확인"으로 둔다. 지어내지 않는다.

---

## 1. 공통 스택 (모든 MVP의 기본 — setup.ps1로 이미 설치 가정)

| 도구 | 역할(한 줄) |
|---|---|
| 무프레임워크 HTML/CSS/JS (바닐라) | MVP 본체. practice-apps 10종 전부가 외부 빌드·번들 없이 단일 `index.html`로 작동 — 4시간엔 이게 가장 빠르고 안 깨진다. |
| 정적 서버 (`npx serve` 또는 `python -m http.server`) | localhost(보안 컨텍스트)에서 띄워 PWA 설치·서비스워커·`fetch`가 동작하게 함. file:// 더블클릭으론 SW가 비활성. |
| 브라우저 (Microsoft Edge 기본) | 실행·시연 무대. DevTools로 디버그, 헤드리스 CDP로 스모크테스트. |
| git / gh (GitHub CLI) | 당일 빈 새 저장소 생성·커밋·푸시. 반입 0줄 규정 준수의 증거(커밋 타임라인). |
| 배포: Netlify Drop / GitHub Pages | 폴더 드래그(Netlify Drop) 또는 `gh-pages`로 https 공개 URL 즉시 확보 → PWA 설치·QR 시연 가능. |
| 코딩 에이전트: Claude Code(우선) + Codex | 현장 바이브코딩. Claude Code 주력, Codex 병렬 보조(폴더 격리). |
| 경량 백엔드: Python + FastAPI (또는 Node 1파일) | 필요할 때만. API 키 은닉 + CORS 우회 프록시 + LLM 호출 중계용(아래 2·매트릭스 참조). 정적 앱이면 불필요. |

---

## 2. 자주 쓰는 추가 도구·리소스 (아이디어별 선택) + 조달 방법

| 도구/리소스 | 무엇 | 언제 필요 | 조달(설치/CDN/키) |
|---|---|---|---|
| jsPDF | 클라이언트(브라우저)에서 PDF 생성 — 증거서류·진정서·리포트 | "손에 잡히는 산출물"이 시연 한 방인 앱(한걸음·임금체불 진정서) | CDN: `https://cdnjs.cloudflare.com/ajax/libs/jspdf/3.0.3/jspdf.umd.min.js`(cdnjs 현재 3.0.3) 또는 `https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js`. 설치 0. |
| 한글 폰트 임베드 (NanumGothic.ttf base64) | jsPDF는 기본폰트에 한글이 없어 한글 PDF가 깨짐 → `addFileToVFS`/`addFont` 필요 | jsPDF로 한국어 PDF를 낼 때 필수 | 나눔고딕 TTF(공개·OFL) 받아 base64 임베드. 실패 대비 폴백은 html2canvas. |
| html2canvas | HTML 미리보기를 이미지로 캡처 → 이미지-PDF 폴백(폰트 임베드 실패 시 한글 보존) | jsPDF 한글 임베드가 막힐 때의 2티어 안전망 | CDN: `https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js`(버전 발급일 기준 확인). |
| QRCode 생성 (qrcode.js) | 시연용 QR(설치 링크·결과 공유) 즉석 생성 | 발표장에서 심사위원이 폰으로 바로 열게 할 때 | CDN: `https://cdn.jsdelivr.net/gh/davidshimjs/qrcodejs/qrcode.min.js` 또는 cdnjs `qrcodejs/1.0.0/qrcode.min.js`. |
| Web Audio API | 소리 합성·재생(경보음·메트로놈) | 웨이크520(520Hz 구형파), AED고(100~120bpm CPR 메트로놈) | 브라우저 내장·무설치(`AudioContext`/`createOscillator`). practice-apps에서 실제 사용 확인. |
| Web Speech API | 음성 입력(받아쓰기)·TTS(음성 안내) | 골든타임·한걸음 음성 진술, 디코드 재난문자 음성안내, 고령·저시력 접근성 | 브라우저 내장·무설치(`SpeechRecognition`·`speechSynthesis`). 인식은 Edge/Chrome 권장, 정확도·언어는 당일확인. |
| 진동 (Vibration API) | 촉각 알림 | 웨이크520(청각약자 깨우기) | 브라우저 내장(`navigator.vibrate`). 데스크톱·iOS는 미지원 가능 → 시각/음성과 병행. |
| Geolocation API | 현재 위치 좌표 | 가까운 쉼터/AED/센터·경로 시작점 | 브라우저 내장(`navigator.geolocation`). https/localhost·사용자 동의 필요. practice-apps는 데모상 미사용(주소·샘플로 대체). |
| MediaPipe (자세추정) | 카메라로 관절 추정 → 운동 자세 코칭·횟수 카운트 | 낙상예방 운동 코치(Otago/Stepping On형) | CDN(`@mediapipe/tasks-vision` jsDelivr) + `getUserMedia` 카메라. 모델 로드 시간·정확도 당일확인. 무거운 축. |
| Kakao Maps JS SDK | 지도 표시·지오코딩·간단 경로 | 무장애 보행경로·안심귀가·화재지도·통학로 등 지도형 | developers.kakao.com 앱 생성 → JavaScript 키(즉시·심의 없음) → 사용할 사이트 도메인 등록 필수. localhost·배포 도메인 모두 등록. |
| Kakao Local (REST) | 주소→좌표 지오코딩(서버사이드) | 좌표 변환이 필요한 모든 지도형 — 지오코딩 1순위 | REST 키, 헤더 `Authorization: KakaoAK {키}`. 키 노출 주의 → 서버(프록시)에서 호출. |
| VWorld Geocoder 2.0 | 주소→좌표(국토부, Kakao 대안) | Kakao 한도·차단 대비 백업 | vworld.kr/dev 키(이메일 인증·도메인 등록). 일 한도 표기 혼재(~3만/4만) → 발급 후 확인. |
| data.go.kr OpenAPI | 공개 공공데이터(복지·기상·리콜·재난·시설) | 거의 모든 데이터형 MVP의 핵심 소스 | data.go.kr 통합회원 1계정 → 데이터셋별 "활용신청". 다수 자동승인·즉시. safetydata/식품안전나라는 별도 포털·승인대기 → 대회 전 발급. |
| LLM API (Anthropic/OpenAI) | 자유서술→구조화·의미정합·쉬운말·다국어 | "규칙으론 불가능한 1장면"이 핵심인 AI형(통과 3종·사기챗봇·감염병 등) | console.anthropic.com 키(결제등록 후 즉시). `fetch`로 호출하되 키는 서버 프록시 뒤에 숨김. |
| CORS 우회 미니 프록시 | 브라우저가 data.go.kr/LLM을 직접 호출하면 CORS·키노출로 막힐 때 중계 | data.go.kr·safetydata·식품안전나라를 라이브로 부를 때, LLM 키를 숨길 때 | 당일 코드. FastAPI 1파일(`/api/...`에서 serviceKey 붙여 재요청) 또는 Node 1파일. 캐시 샘플만 쓰면 불필요. |
| 좌표 변환 유틸 | 기상청 격자(nx,ny)·민방위대피소 도분초(DMS)→십진 | 기상(히트네임)·대피소(디코드) 데이터 사용 시 | 변환 공식/표는 공개 — 코드 미리 숙지(완성 앱 아님). |
| PWA 아이콘 생성 (Python Pillow) | 192·512·maskable 아이콘 일괄 생성 | 설치형 PWA로 만들 때(`manifest.webmanifest`) | `pip install pillow`. 단일 이미지→리사이즈 스크립트 당일 작성. |
| 공유마당/공공누리 안심자산 | 저작권 안심 폰트·이미지(상업 사용 가능) | "겉모습 상업용" 인상 + 탈AI 톤 | 공유마당 다운로드. 출처표시 권장. practice-apps `_shared/`가 선례. |

> 요점: 위 항목 대부분은 추가 설치가 아니라 CDN 한 줄 또는 키 발급이다. 무거운 별도 설치가 필요한 것은 사실상 MediaPipe(모델·카메라)와 Python/FastAPI·Pillow(로컬 런타임)뿐이다.

---

## 3. 핵심 매트릭스

범례 — 4h난이도: 하/중/상. CORS프록시: N(정적·캐시샘플로 충분) · Y(라이브 OpenAPI 또는 LLM 키 은닉 시 필요) · Y(라이브) (샘플로 시연하면 N). 데이터 ID 뒤 "당일확인"=catalog 미확정·발급 후 필드 확정 필요. 브라우저API 공통값(localStorage·PWA 서비스워커)은 생략.

| 아이디어 (출처) | 분야 | MVP 1~2기능 | 핵심 공개데이터(ID) | 외부 API키(지도/LLM) | 추가 JS라이브러리 | 브라우저 API | CORS프록시 | 배포 | 4h난이도 |
|---|---|---|---|---|---|---|---|---|---|
| 받을자격:실업 (통과①) | 복지/고용 | 퇴사 사연→고용보험법 별표2 정당사유 매핑+원문 인용 / 12개월 시효 D-day | 별표2·제48조 = law.go.kr 공개텍스트(룰표 큐레이션, 라이브 API 0) · 고용복지+센터 15066368 · 지역노동청 15029545 | LLM(매핑·쉬운말) | — (선택 jsPDF 불요) | Web Speech(선택) | Y(LLM 은닉) | localhost+ngrok | 하 |
| 한걸음 (통과②) | 생활안전 | 비정형 진술→6하원칙 시간순 정렬+위험신호 / 증거 메모 PDF(무전송) | 스토킹처벌법 lsiSeq=252483·easylaw csmSeq=1661(공개텍스트) · 경찰청 가정폭력 15037060/15037061(무로그인 파일·키불요) · KOSIS(조회) | LLM(정렬·번역) | jsPDF+나눔고딕, html2canvas(폴백) | Web Speech | Y(LLM 은닉) | localhost+ngrok | 중 |
| 골든타임 (통과③) | 복지 | 사건 자연어→사건유형·발생일 추출+마감 임박순 타임라인 / 제도 상세·신청처 | 중앙복지 15090532 · 지자체복지 15108347 · 보조금24 15113968(자동승인) · 마감=법령 큐레이션 | LLM(추출·의미정합) | — | Web Speech | Y(데이터+LLM) | localhost+ngrok | 중 |
| 히트네임 폭염 (앱·heatname) | 폭염·기후 | 체감온도→폭염등급·대상별 행동 / 가까운 쉼터 | 기상청 단기예보 15084084(라이브 사수 1순위·격자변환) · 무더위쉼터 표준 15013199(위경도 당일확인)·한파쉼터 15139703 | (지도시 Kakao) | — | Geolocation(선택) | Y(라이브) / N(샘플) | 정적+Netlify | 하 |
| 웨이크520 화재 (앱·wake520) | 화재안전 | 경보음 감지/트리거→520Hz 구형파+진동+다국어 음성+큰 글자 깨우기 | 거의 무용(소방청 단독경보기 안내=정적) | — | — | Web Audio·Vibration·(감지시 getUserMedia) | N | 정적+Netlify | 하 |
| 디코드 재난문자 (앱·decode-alert) | 재난 | 재난문자 붙여넣기→유형분류·쉬운말·다국어 요약 / 거주형태별 행동·대피소 | 재난문자 15134001 · 행동요령 15139401 · 대피소 15044951/DSSP-IF-00195(safetydata·DMS변환·공공누리4유형) | LLM(요약·분류) | — | Web Speech(TTS) | Y(데이터+LLM) | localhost+ngrok | 중 |
| 리콜체크 / 바코드 리콜 (앱·recall-check + 고득점11) | 제품·식품안전 | 제품명·바코드·URL→회수여부 판정 / 확인불가 시 정직 거절+1372 | 의약품회수 15059114(자동승인) · 식품회수 15074318=식품안전나라 I0490(별도키·19필드) | LLM(사유 요약·선택) | (바코드 스캔시 zxing/quagga) | (스캔시 getUserMedia) | Y(라이브) / N(샘플) | 정적/프록시 | 하 |
| 받을자격 복지매칭 (앱·welfare-finder) | 복지사각 | 익명 조건 입력→확인해볼 제도 매칭+분수 배지(무로그인) | 중앙복지 15090532·지자체 15108347·보조금24 15113968 | LLM(상황→제도 매핑) | — | — | Y(데이터+LLM) | 정적/프록시 | 하 |
| 안심통학 (앱·safewalk) | 어린이·학교 | 통학로 워킹오딧→구간 위험점수·개선 우선순위 / 최안전(최단 아님) 경로 | KOROAD 어린이보호구역 사고다발(opendata.koroad.or.kr·당일확인) · 생활안전지도 | (지도시 Kakao) | — | Geolocation(선택) | Y(라이브) / N(샘플) | 정적+Netlify | 중 |
| 여기까지 / 무장애 보행경로 (앱·barrierfree + 고득점09) | 교통약자 접근성 | 무장애 동선 구간 점수·약한 고리 / 사진→장애물 AI 분류(턱·계단·점자블록) | 전국장애인편의시설 15100058·15092317 · 지하철 엘베 15098158·15044261 · 무장애여행 15101897 | 지도 Kakao/VWorld · LLM(비전 분류) | — | (사진시 getUserMedia)·Geolocation | Y(데이터+LLM) | 정적/프록시 | 중~상 |
| AED고 (앱·aedgo) | 응급의료 | 단독 AI CPR 코치(메트로놈+음성 단계) / AED 위치·접근성 신뢰 레이어 | AED 표준 15021103 · AED 조회 15000652 | (지도시 Kakao) | — | Web Audio·speechSynthesis·Geolocation | N(코어 오프라인) | 정적+Netlify | 하 |
| 안심귀가 / Safest Way (앱·safehome + 고득점07) | 여성·1인가구 | 안전점수 가중 경로(최단 vs 안전) / 안심 타이머·보호자 공유 | 안전비상벨 표준 15028206 · CCTV·보안등 표준(당일확인) · 경찰청 범죄통계 | 지도 Kakao/VWorld | — | Geolocation | Y(라이브) / N(샘플) | 정적/프록시 | 중 |
| 마음안부 (앱·maeumcheck) | 정신건강 | 기분 체크인 / Stanley-Brown 안전계획 빌더(로컬 저장) / 위기 즉시연결 109 | 정신건강·자살예방센터 위치(당일확인) · 109/1393(정적) | — | — | localStorage(코어)·Geolocation(지도시) | N | 정적+Netlify | 하 |
| 고령운전 인지 자가검사 MOGI (build-next) | 교통·고령운전 | 인지검사 3~4과제(기억·시공간·처리속도)→자동채점·주의/권고 / 검사장 안내 | 도로교통공단 인지검사 항목·TAAS 고령사고통계(당일확인) · 면허시험장·치매안심센터 위치 | (지도시 Kakao) | — | Web Audio·타이머 | N(로컬 채점) | 정적+Netlify | 중 |
| 통합 사기판별 챗봇 (build-next) | 디지털사기 | URL·문자·번호·계좌 붙여넣기→위험도+대응법 카드(무설치·고령친화) | 사기계좌 15021794 · 보이스피싱 현황 15063815 | LLM(문맥 위험분석) | — | — | Y(데이터+LLM) | localhost+ngrok | 하 |
| 화재위험 예측지도 Firebird (build-next) | 화재안전 | 행정동 단위 화재위험 가중합→색상 지도 / 동네 예방 체크 | 소방청 화재통계·건축물대장·인구(당일확인) · 소방서·용수 위치 | 지도 Kakao/VWorld | (지도 Leaflet 대안) | — | Y(데이터) | 정적/프록시 | 중~상 |
| 감염병 조기경보 (build-next) | 감염병·응급 | 공개 뉴스/RSS/ProMED→LLM 분류·요약→주간 모니터링 신호 카드 | KDCA 감염병 발생정보 API(대조용) · 공개 RSS·ProMED 피드 | LLM(분류·요약) | — | — | Y(피드+LLM) | localhost+ngrok | 중 |
| 임금체불 진정서 자동생성 (build-next) | 외국인·노동 | 6~8문항→진정서 PDF(한국어+모국어 병기) / 가까운 노동청 안내 | 고용노동부 진정서 서식·절차(당일확인) · 지방노동관서 위치 | LLM(다국어 문안) | jsPDF+나눔고딕, html2canvas | — | Y(LLM 은닉) | localhost+ngrok | 중 |
| 낙상예방 운동 코치 (build-next) | 노인 돌봄·낙상 | Otago 동작 3~4개 영상+카메라 자세추정 횟수·자세 피드백 / 주간 진척 | 질병청 낙상 예방수칙(정적) · 보건소·경로당 위치(선택) | — | MediaPipe(tasks-vision) | getUserMedia·localStorage | N | 정적/프록시 | 상 |
| 식중독 크라우드 탐지 (build-next) | 식품·리콜 | 증상·장소·시간 신고→지역 군집 시각화 / 의심 다발 지역 카드 | 식약처 식중독 통계(대조) · 식품안전나라 I0490 · 행정구역 좌표 | LLM(신고 분류)·(지도 Kakao) | — | Geolocation(선택) | Y(데이터+LLM) | localhost+ngrok | 중 |

> 패턴: (1) practice-apps 10종은 전부 바닐라 HTML/JS + 내장 샘플 + 서비스워커이며 외부 JS 라이브러리·지도 SDK를 실제로 끌어쓰지 않는다(웨이크520·AED고만 Web Audio 사용). 즉 추가 설치 0으로 작동한다. (2) 인사이더 통과 3종과 LLM형 신규 아이디어는 FastAPI 프록시(키 은닉+CORS)+LLM 키가 추가될 뿐, 프런트는 여전히 경량이다. (3) PDF가 산출물인 앱(한걸음·임금체불)만 jsPDF+한글폰트가 진짜 필수다.

---

## 4. 아이디어별 카드 (상위 12) — 보여줄 1장면 · 도구 체크리스트 · 당일 함정

### 1) 받을자격:실업 (통과①, 만장일치 1위)
- 1장면: 심사위원이 즉석으로 퇴사 사연 한 줄 → 별표2 정당사유에 원문 verbatim 인용 밑줄 + 12개월 시효 D-day가 라이브로 뜬다.
- 체크리스트: LLM 키(프록시 뒤) · 별표2/제48조 공개텍스트 수기 룰표 · 고용복지+센터 15066368 1곳 실번호 · (선택)Web Speech.
- 함정: 라이브 외부 API 0이 강점 — data.go.kr 의존 만들지 말 것. "자격 단정" 금지(출력 화이트리스트). 별표2 헤더 개정일(2024.7.1)·호3의2(괴롭힘) 당일 육안 재확인.

### 2) 한걸음 (통과②, 유일하게 엔진이 다른 백업)
- 1장면: 떨리는 진술 한 문장 → 6하원칙 타임라인 자동 정렬(본인 확정) → 무전송 증거 메모 PDF가 손에 잡힌다.
- 체크리스트: jsPDF + 나눔고딕 base64 + html2canvas 폴백(한글 PDF 2티어) · LLM 키 · 스토킹처벌법/easylaw 공개텍스트 · 경찰청 15037060/15037061(무로그인 파일) · Web Speech.
- 함정: 한글 PDF가 단일 리스크 → 30분 게이트로 티어0 성공 또는 티어1 확정. "법률사무 아님"(문서 미작성·죄명 무단정) 30초 선언. "안전" 라벨 출력 불가(거짓 안심 금지).

### 3) 골든타임 (통과③, 노벨티 가장 깨끗)
- 1장면: "어제 잘렸고 애 둘에 월세" → 사건·발생일·가구 추출 + 제도가 마감 임박순으로 한 화면 정렬.
- 체크리스트: LLM 키 · 15090532/15108347/15113968(자동승인) 캐시 200~300건 + 라이브 1건 · 법령 마감 룩업표 · Web Speech.
- 함정: 마감 숫자는 AI 생성 금지·법령 큐레이션만(조문 스냅샷). 상대시간("어제") 해소가 AI load-bearing 증명. 선정기준 산문 여부는 당일 캡처로 확정(아니면 사건 칩 폴백).

### 4) 히트네임 폭염 (앱, 라이브 사수 안정)
- 1장면: 내 위치 체감온도 → 폭염 N단계 + 대상별 행동카드 + 지금 운영중 쉼터.
- 체크리스트: 기상청 15084084(자동승인) · 격자 변환 코드 · 무더위쉼터 15013199(위경도 당일확인) · (선택)Geolocation.
- 함정: 격자(nx,ny) 변환 누락이 1순위 버그. 쉼터 좌표 오류·야간 미운영 → 운영시간 필터. 단순 쉼터지도는 네이버맵과 중복 → 개인 맞춤 위험지수로 차별화.

### 5) 웨이크520 화재 (앱, 무설치 최강)
- 1장면: 경보음 트리거 → 화면 점멸 + 진동 + 520Hz 구형파 + "불이야 대피하세요" 음성 + 큰 '화재' 글자.
- 체크리스트: Web Audio(오실레이터) · Vibration · speechSynthesis. 외부 데이터·키·라이브러리 0.
- 함정: 마이크 상시청취의 배터리·오탐·iOS 진동 미지원을 데모에서 정직하게(데모는 톤 트리거로). 하드웨어 보급은 한국이 두꺼움 → "폰만으로 깨우기 증폭"으로 포지셔닝.

### 6) 디코드 재난문자 (앱)
- 1장면: 재난문자 붙여넣기 → 쉬운 한국어·다국어 요약 + 거주형태별(반지하 등) 정반대 행동 + 가까운 대피소.
- 체크리스트: LLM 키 · 재난문자 15134001·행동요령 15139401·대피소 15044951(safetydata, 사전발급·DMS변환) · Web Speech TTS · 프록시.
- 함정: safetydata는 승인대기·공공누리 4유형(상업·변경 금지) → 출처표시 필수. 송출앱은 중복 감점 → "받은 문자를 행동으로 디코딩"만.

### 7) 리콜체크 / 바코드 리콜 (앱+고득점, 단일 최강 후보)
- 1장면: 제품명/바코드/오픈마켓 URL → 회수 여부 즉시 판정 + 사유 쉬운 요약, 매칭 없으면 "확인 안 됨·1372"로 정직 거절.
- 체크리스트: 의약품 15059114(자동승인) · 식품 I0490(식품안전나라 별도키) · (바코드 카메라 스캔시 zxing/quagga + getUserMedia) · 프록시.
- 함정: 환각 금지 — 매칭 실패를 "안전"으로 말하지 말 것. 식품안전나라 키는 data.go.kr 키와 다름(사전발급). 정부 소비자24와 차별 = 오픈마켓 유통 사각·소급 알림.

### 8) 여기까지 / 무장애 보행경로 (앱+고득점, 형평 배점 최상)
- 1장면: 사진 업로드 → 비전 LLM이 "계단/턱/경사로/점자블록/폭협착" 분류 → 지도 핀+신뢰도(Project Sidewalk 한국판).
- 체크리스트: LLM(비전) 키 · 전국장애인편의시설 15100058/15092317 · 지하철 엘베 15098158 · 지도 Kakao(도메인 등록) · 프록시.
- 함정: 전국 풀 라우팅은 4h 불가 → 한 동네 회랑 step-free vs 최단 비교로 축소. 서울동행맵·카카오맵과 중복 → AI 사진 검증으로 차별화.

### 9) AED고 (앱, 가장 안전한 승부수)
- 1장면: 신고 후 폰만으로 100~120bpm 메트로놈 + 음성 단계 CPR 코치 + 접근가능 AED 길안내.
- 체크리스트: Web Audio(메트로놈) · speechSynthesis · AED 15021103/15000652 · Geolocation · (지도시 Kakao).
- 함정: 단순 AED 지도는 포화·대폭 감점 → "접근가능성 신뢰 레이어"+"단독 코치"로. 119 디스패치 연동(시민 responder)은 4h 비현실 → 금지.

### 10) 통합 사기판별 챗봇 (build-next, AI 시연 임팩트)
- 1장면: 의심 문자/URL/번호 붙여넣기 → 공공 사기DB 매칭 + LLM 문맥 분석 → 위험/주의/안전 + 다음 행동 카드(큰 글씨).
- 체크리스트: LLM 키 · 사기계좌 15021794 · 보이스피싱 15063815 · 프록시.
- 함정: 통화 인터셉트는 OS 권한 한계로 불가(과장 금지). 통신3사·시티즌코난과 "탐지"로 붙으면 중복 → "무설치·무로그인 단일 창구"로.

### 11) 임금체불 진정서 자동생성 (build-next, PDF 산출물)
- 1장면: 6~8문항 입력 → 진정서 PDF(한국어+모국어 병기)가 즉석 생성 + 가까운 노동청.
- 체크리스트: jsPDF + 나눔고딕 + html2canvas · LLM(다국어) · 노동관서 위치·표준 서식(당일확인).
- 함정: "초안 보조, 제출 전 검토" 한정(법적 책임). 다국어 법률용어 정밀도 → 고정 룩업 우선. 한글+베트남어 폰트 임베드 확인.

### 12) 고령운전 인지 자가검사 MOGI (build-next, 시의성 최상)
- 1장면: 기억·시공간·처리속도 3~4과제를 집에서 수행 → 자동채점 → "주의/권고" + 가까운 검사장.
- 체크리스트: 로컬 채점 로직(JS) · Web Audio/타이머 · TAAS 통계 시각화 · 검사장·치매안심센터 위치 · (선택 LLM 약).
- 함정: "의학적 진단 아님" 디스클레이머 필수. 공공데이터 비중 약함 → TAAS 통계 시각화로 데이터 배점 보강. 공식검사 연계는 협조 필요.

---

## 5. 시제 분야 → 이 아이디어/도구 빠른 인덱스

| 시제 키워드(현장 문제) | 1순위 아이디어 | 결정 도구(핵심) |
|---|---|---|
| 복지·수급·받을 수 있는 돈 | 골든타임 · welfare-finder | 15090532/15108347/15113968(자동승인) + LLM + 프록시 |
| 실업급여·퇴사·고용 | 받을자격:실업 | law.go.kr 별표2 공개텍스트 + LLM (라이브 API 0) |
| 행정문서·마감·고지서 해독 | 골든타임/며칠남았어요 계열 | (OCR시)비전 LLM + 붙여넣기 폴백 + 법령 큐레이션 |
| 폭염·한파·기후 | 히트네임 · 1km² 체감온도 | 기상청 15084084(격자변환) + 쉼터 15013199/15139703 |
| 화재·경보·청각약자 | 웨이크520 · 화재위험 지도 | Web Audio+Vibration / 소방통계+지도 SDK |
| 재난문자·대피·다국어 | 디코드 | 재난문자 15134001·대피소(safetydata) + LLM + TTS |
| 제품·식품·리콜·바코드 | 리콜체크 | 의약품 15059114 + 식품 I0490 + (스캔)카메라 |
| 식중독·집단발병 | 식중독 크라우드 탐지 | 식약처 통계 + I0490 + LLM 분류 |
| 보이스피싱·사기·디지털안전 | 통합 사기판별 챗봇 | 사기계좌 15021794·15063815 + LLM |
| 교통약자·휠체어·접근성 | 여기까지/무장애 보행경로 | 편의시설 15100058 + 비전 LLM + 지도 |
| 어린이·통학로 | 안심통학 | KOROAD 사고다발(당일확인) + 지도 가중치 |
| 여성·밤길·1인가구 | 안심귀가/Safest Way | 안전비상벨 15028206 + 범죄통계 + 지도 라우팅 |
| 응급·심정지·AED | AED고 | AED 15021103 + Web Audio + Geolocation |
| 노인·낙상·돌봄 | 낙상 운동 코치 | MediaPipe + getUserMedia (무거운 축) |
| 고령운전 | MOGI 자가검사 | 로컬 채점 + TAAS 시각화 |
| 정신건강·자살예방 | 마음안부 | 안전계획 빌더(localStorage) + 109 연결 |
| 외국인·이주민·임금체불 | 임금체불 진정서 | jsPDF+한글폰트 + 다국어 LLM |
| 감염병·역학 조기경보 | 감염병 조기경보 | 공개 RSS/ProMED + KDCA API + LLM |
| 스토킹·교제폭력·증거 | 한걸음 | jsPDF+나눔고딕 + 경찰청 15037060 + LLM |

---

## 6. 부록

### 6-A. 도구 → 조달 방법 일람

| 도구 | 조달 |
|---|---|
| Python / Node / git / gh / serve | winget(또는 사전 setup.ps1). `npx serve`, `python -m http.server 8137` |
| Pillow (아이콘) | `pip install pillow` |
| FastAPI 프록시 | `pip install fastapi uvicorn` (또는 Node `http` 1파일) |
| jsPDF | cdnjs `.../jspdf/3.0.3/jspdf.umd.min.js` · unpkg `jspdf@latest` |
| html2canvas | cdnjs `.../html2canvas/1.4.1/html2canvas.min.js` (버전 발급일 확인) |
| qrcode.js | jsDelivr `gh/davidshimjs/qrcodejs/qrcode.min.js` · cdnjs `qrcodejs/1.0.0` |
| MediaPipe | jsDelivr `@mediapipe/tasks-vision`(버전 확인) |
| 지도 Leaflet(대안) | unpkg `leaflet`(OSM 타일·무키, 라우팅은 별도) |
| Web Audio/Speech/Vibration/Geolocation | 브라우저 내장·무설치·무키 |
| data.go.kr 키 | data.go.kr 통합회원 → 데이터셋 활용신청(다수 자동승인 즉시) |
| safetydata 키(재난문자·행동요령·대피소) | safetydata.go.kr 회원→이용신청(승인 대기 — 사전 발급), serviceKey K 대문자 주의 |
| 식품안전나라 키(식품회수 I0490) | foodsafetykorea.go.kr 별도 발급(data.go.kr 키 아님) |
| Kakao JavaScript/REST 키 | developers.kakao.com 앱 생성 → JavaScript/REST 키(즉시) → 사이트 도메인 등록 필수 |
| VWorld 키 | vworld.kr/dev 이메일 인증·도메인 등록 |
| LLM 키(Claude) | console.anthropic.com 결제등록 후 즉시. `fetch`→서버 프록시 뒤 은닉 |
| 나눔고딕 TTF(PDF 한글) | 공개 OFL 폰트 다운로드 후 base64 임베드 |
| 공유마당/공공누리 폰트·이미지 | 공유마당 다운로드(출처표시 권장) |

### 6-B. 요점

- 대부분의 MVP는 추가 설치 0(공통 스택 + CDN 한 줄 + 키 발급)으로 만들어진다. practice-apps 10종은 외부 라이브러리·지도 SDK·라이브 API 없이 바닐라 + 내장 샘플 + 서비스워커만으로 작동했다.
- 무거운 별도 설치가 필요한 경우만 별도 표기 대상이다: MediaPipe(모델·카메라, 낙상 코치) · Python/FastAPI·Pillow(로컬 런타임). 그 외(jsPDF·html2canvas·qrcode·MediaPipe까지)는 전부 CDN으로 끝난다.
- 키는 사전 발급이 안전선: data.go.kr(자동승인 즉시)는 당일도 가능하나, safetydata·식품안전나라·Kakao·VWorld·Claude는 승인대기·결제등록이 있어 대회 전 발급해 `.env`에 둔다(저장소 커밋 금지).
- 라이브 사수 1순위 = 기상청 단기예보 15084084(자동승인·표준 REST). 지오코딩 1순위 = Kakao Local. 둘로 "실제로 도는 것"을 증명하고 나머지는 캐시 샘플+더미로 운영한다.
- CORS·키노출이 걸리면 FastAPI/Node 미니 프록시 1파일을 당일 작성(완성 앱 코드 아님)한다. 정적·캐시 샘플로만 시연하면 프록시 없이도 성립한다.
- 좌표 함정 2개(기상청 격자 nx,ny / 대피소 도분초 DMS)는 변환 코드를 미리 숙지한다.

### 6-C. 출처 (도구 사실 확인, 2026-06 웹검색)

- jsPDF: [cdnjs](https://cdnjs.com/libraries/jspdf), [npm](https://www.npmjs.com/package/jspdf)
- qrcode.js(davidshimjs): [GitHub](https://github.com/davidshimjs/qrcodejs), [cdnjs](https://cdnjs.com/libraries/qrcodejs)
- Kakao Maps JS SDK 키·도메인 등록: [Kakao Developers 시작하기](https://developers.kakao.com/docs/latest/ko/javascript/getting-started), [지도 Web API 가이드](https://apis.map.kakao.com/web/guide/)
- 공공데이터셋 ID·키·발급 절차: 본 키트 `04_data/catalog.md`·`04_data/keys-ready.md`(data.go.kr·safetydata·식품안전나라·VWorld·Kakao 검증분). 위경도 컬럼·DSSP-IF 번호·필드명 등 "당일확인" 항목은 발급 후 1건 응답으로 확정.
