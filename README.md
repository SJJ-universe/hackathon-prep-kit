# 해커톤 부트킷 (Windows 원샷 개발환경)

새 노트북이나 대회 제공 PC(둘 다 Windows)에서 코딩 도구를 한 번에 설치하고,
에이전트(Claude Code / Codex)가 이 저장소를 열자마자 동일한 방식으로 바이브코딩을 시작하게 만드는 키트입니다.

---

## 에이전트 최초 실행 (필수)

이 저장소를 열면 다른 무엇보다 먼저 아래 한 줄을 실행해 모든 도구를 한 번에 설치하라.
설치가 끝나기 전에는 코드 작업을 시작하지 말 것.

로컬(이미 클론했거나 파일을 받은 경우):

```
powershell -NoProfile -ExecutionPolicy Bypass -File ./setup.ps1
```

원격(아직 클론 안 함 / 빈 PC — 이 저장소 기준 URL 그대로 실행):

```
irm https://raw.githubusercontent.com/SJJ-universe/hackathon-prep-kit/main/setup.ps1 | iex
```

비개발자/더블클릭용: `bootstrap.cmd` 를 더블클릭해도 동일하게 설치됩니다.

설치 후 검증 섹션에서 `git / node / npm / python / gh / netlify` 등의 버전이 출력되면 정상입니다.
일부 CLI가 NOT FOUND 면 새 터미널을 열고(PATH 갱신) 다시 확인하세요.

> 처음 켠 PC라 에이전트(Claude CLI)조차 없다면: 먼저 [`guides/04_에이전트_부트스트랩.md`](guides/04_에이전트_부트스트랩.md)로 Claude CLI를 설치·인증·실행한 뒤, 그 에이전트에게 위 한 줄(setup.ps1)을 맡기세요. 사람이 직접 setup.ps1을 돌려도 Claude를 포함한 전체가 설치됩니다.

---

## 무엇이 설치되나

핵심 도구(winget, 검증된 ID):

- Git (`Git.Git`)
- Node.js LTS (`OpenJS.NodeJS.LTS`)
- Python 3.12 (`Python.Python.3.12`)
- Visual Studio Code (`Microsoft.VisualStudioCode`)
- GitHub CLI / gh (`GitHub.cli`)
- Edge 는 Windows 기본 탑재이므로 제외

전역 CLI(npm, 검증된 패키지):

- `serve` — 정적 사이트/SPA 로컬 서빙
- `netlify-cli` — 당일 결과물 즉시 호스팅(`netlify deploy`)
- `@anthropic-ai/claude-code` — Claude Code CLI
- `@openai/codex` — Codex CLI
- 선택(주석 처리, 필요 시 해제): `vercel`, `http-server`

Python 패키지(pip, 선택, `--user`):

- `requests`(공공데이터 API 호출), `pillow`(아이콘/이미지 생성)

---

## 폴더 구조

```
.
├─ setup.ps1        # 원샷 설치 스크립트(멱등). 진입점.
├─ bootstrap.cmd    # 더블클릭 실행용 런처
├─ README.md        # 이 문서
├─ AGENTS.md        # Codex/일반 에이전트용 작업 규약
├─ CLAUDE.md        # Claude Code용 작업 규약
├─ .gitignore
├─ guides/
│   ├─ 00_사전준비_체크리스트.md        # 대회 전 계정·API키·도구 발급 체크
│   ├─ 01_당일_런북.md                 # 0~4시간 분단위 진행
│   ├─ 02_분야별_고득점_빌드카드.md      # 시제 분야별 추천 아이디어·데이터
│   ├─ 03_호스팅_심사위원_시연.md        # Netlify Drop / gh-pages / 로컬 + QR
│   ├─ 04_에이전트_부트스트랩.md         # Claude CLI 우선 설치·PATH·인증·실행(에이전트 띄우기)
│   └─ 05_아이디어별_MVP_도구매트릭스.md  # 아이디어별 데이터·키·라이브러리·브라우저API·배포 종합
└─ scaffold/        # 아이디어 비종속 일반 템플릿(빈 정적/웹 보일러플레이트). 당일 복사해 출발
```

- `guides/` 와 `scaffold/` 에는 주제와 무관한 일반 자료만 둔다(도구·데이터·절차·일반 템플릿).
- 두 폴더는 "당일 빠른 출발용 재료"일 뿐, 완성 앱이 아니다.

---

## 반입 규칙 경고 (필독)

- 이 부트킷에는 도구 설치 / 일반 템플릿 / 데이터·계정 사전발급 / 지식만 담는다.
- 주제맞춤 완성 앱 코드는 절대 담지 않는다. 대회 당일 빈 새 저장소에서 처음부터 작성한다.
- `scaffold/` 의 모든 것은 반드시 아이디어 비종속 일반 템플릿이어야 한다.
- 당일 산출물은 새 저장소에 두고, 이 부트킷은 환경/지식 공급원으로만 쓴다.

---

## 당일 4시간 흐름 요약

- 0:00~0:20 — `setup.ps1` 실행으로 환경 구축 + 빈 새 저장소 생성(`gh repo create`)
- 0:20~0:40 — 미션 분석, 핵심 기능 1~2개로 범위 확정(욕심 금지)
- 0:40~2:30 — `scaffold/` 일반 템플릿에서 출발해 MVP 구현
- 2:30~3:15 — 실데이터(공공데이터 API) / AI 기능 연동
- 3:15~3:45 — 배포: `netlify deploy`(또는 `vercel`)로 라이브 URL 확보
- 3:45~4:00 — 데모 시나리오 점검, 스크린샷/제출 문구 정리, 최종 검증

---

## 필요 계정 / 키 (사전 준비 한 줄 요약)

- GitHub 계정(`gh auth login` 로그인) — 새 저장소 생성/푸시
- Netlify 또는 Vercel 계정 — 결과물 호스팅
- 공공데이터포털(data.go.kr) 인증키 — 실데이터 호출용(사전 발급 권장)
- (선택) Claude / OpenAI 로그인 또는 API 키 — 코딩 에이전트 및 앱 내 AI 기능용
