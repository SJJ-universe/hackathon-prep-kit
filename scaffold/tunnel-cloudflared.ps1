# tunnel-cloudflared.ps1 - 로컬 정적 서버 + cloudflared Quick Tunnel (Windows PowerShell)
#
# 내 노트북의 정적 폴더를 공개 HTTPS(https://<랜덤>.trycloudflare.com)로 즉시 노출한다(L2).
# 무가입·무로그인·인터스티셜 없음. HTTPS라 카메라/위치 등 보안컨텍스트 API가 폰에서 작동.
# 대회장 와이파이 대신 '내 폰 핫스팟'에 노트북을 물려 자기 회선으로 서빙하라.
#
# 사용법:
#   PS> .\tunnel-cloudflared.ps1                    # ./ 를 8137에 서빙 + 터널
#   PS> .\tunnel-cloudflared.ps1 -Dir .\dist -Port 8137
#
# 주의: 이 창과 새로 뜬 서버 창을 둘 다 열어 둬야 한다(하나 닫으면 데모/URL 죽음).
#       절전 끄기(관리자): powercfg /change standby-timeout-ac 0; 덮개닫기=아무것도안함.

param(
  [string]$Dir = ".",
  [int]$Port = 8137
)

$ErrorActionPreference = "Stop"
$target = Resolve-Path -Path $Dir -ErrorAction SilentlyContinue
if (-not $target) { $target = (Resolve-Path ".").Path }

Write-Host "============================================"
Write-Host " cloudflared quick tunnel helper (2026)"
Write-Host " Serve dir : $target"
Write-Host " Port      : $Port"
Write-Host "============================================"

function Test-Cmd([string]$name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

if (-not (Test-Path (Join-Path $target "index.html"))) {
  Write-Host "[warn] index.html NOT found at root of: $target"
}

# cloudflared 존재 확인
if (-not (Test-Cmd "cloudflared")) {
  Write-Host "[error] 'cloudflared' not found."
  Write-Host "        install: winget install -e --id Cloudflare.cloudflared"
  Write-Host "        (then open a NEW terminal and re-run)"
  exit 1
}

# 1) 정적 서버를 새 창에서 기동 (serve > python 순)
$serveCmd = $null
if (Test-Cmd "serve") {
  $serveCmd = "serve `"$target`" -l $Port"
} elseif (Test-Cmd "npx") {
  $serveCmd = "npx --yes serve `"$target`" -l $Port"
} elseif (Test-Cmd "python") {
  $serveCmd = "python -m http.server $Port --directory `"$target`""
} else {
  Write-Host "[error] no static server (serve/npx/python). Install Node or Python (setup.ps1)."
  exit 1
}

Write-Host "[1/2] starting static server in a NEW window:"
Write-Host "      $serveCmd"
Start-Process powershell -ArgumentList "-NoExit", "-NoProfile", "-Command", $serveCmd | Out-Null
Start-Sleep -Seconds 2

# 2) 이 창에서 터널 실행 (config.yaml 있으면 Quick Tunnel 시작 안 됨에 주의)
Write-Host "[2/2] starting cloudflared quick tunnel (HTTPS public URL below)..."
Write-Host "      keep BOTH windows open. URL changes on each run."
Write-Host ""
& cloudflared tunnel --url ("http://localhost:" + $Port)
