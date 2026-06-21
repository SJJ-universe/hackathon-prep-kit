# deploy-netlify.ps1 - Netlify 배포 도우미 (Windows PowerShell, 2026-06 명령 기준)
#
# 두 경로:
#   A) Netlify Drop : 브라우저에 폴더 드래그앤드롭 (가장 빠름). 발표용은 로그인 후 드롭 권장
#                     (무로그인 사이트는 1시간 내 클레임 안 하면 소멸).
#   B) Netlify CLI  : netlify deploy --prod --dir <폴더> --no-build  (사전 netlify login 또는 토큰)
#
# 사용법:
#   PS> .\deploy-netlify.ps1                         # Drop 페이지 열기 + CLI 프로덕션 배포 시도
#   PS> .\deploy-netlify.ps1 -DropOnly               # Drop 안내만 (CLI 실행 안 함)
#   PS> .\deploy-netlify.ps1 -Dir .\dist             # 배포 폴더 지정
#   PS> .\deploy-netlify.ps1 -SiteName my-demo-name  # 특정 사이트(고정 슬러그)로 배포
#   PS> .\deploy-netlify.ps1 -Draft                  # 프로덕션 대신 드래프트(미리보기) 배포
#
# 비대화형(에이전트/CI): 먼저 $env:NETLIFY_AUTH_TOKEN = "토큰" 설정 후 -SiteName 지정.

param(
  [string]$Dir = ".",
  [string]$SiteName = "",
  [switch]$DropOnly,
  [switch]$Draft
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$target = Resolve-Path -Path $Dir -ErrorAction SilentlyContinue
if (-not $target) { $target = $Dir }

Write-Host "============================================"
Write-Host " Netlify deploy helper (2026)"
Write-Host " Deploy dir : $target"
Write-Host "============================================"
Write-Host ""
Write-Host "[A] Netlify Drop (drag-and-drop, fastest)"
Write-Host "    1) open https://app.netlify.com  -> LOG IN first (anon site dies in 1 hour)"
Write-Host "    2) open https://app.netlify.com/drop"
Write-Host "    3) drag the FOLDER (index.html must be at its ROOT). zip -> unzip first."
Write-Host "    4) a public https://<name>.netlify.app URL is issued in seconds"
Write-Host "    5) rename for a stable slug: Project configuration > General > Manage project name"
Write-Host ""

# 가장 빠른 경로를 우선 노출: Drop 페이지를 자동으로 연다.
Start-Process "https://app.netlify.com/drop"

if ($DropOnly) {
  Write-Host "[done] Drop page opened. DropOnly mode -> skipping CLI."
  exit 0
}

function Test-Cmd([string]$name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

# index.html 루트 검증 (Drop/CLI 공통 실패원인 #1 사전 차단)
$indexPath = Join-Path $target "index.html"
if (-not (Test-Path $indexPath)) {
  Write-Host "[warn] index.html NOT found at root of: $target"
  Write-Host "[warn] Netlify needs index.html at the deploy folder root (else 404)."
}

Write-Host ""
Write-Host "[B] Netlify CLI"

# 실행기 결정: 전역 netlify 우선, 없으면 npx netlify-cli
$runner = $null
if (Test-Cmd "netlify") {
  $runner = "netlify"
} elseif (Test-Cmd "npx") {
  $runner = "npx --yes netlify-cli"
  Write-Host "[info] global 'netlify' not found -> using: npx netlify-cli"
  Write-Host "[hint] faster next time: npm install -g netlify-cli  (needs Node 20.12+)"
} else {
  Write-Host "[skip] neither 'netlify' nor 'npx' found -> install Node.js (setup.ps1)."
  Write-Host "[hint] use the Netlify Drop page that just opened instead."
  exit 0
}

# 인증 상태 힌트
if ($env:NETLIFY_AUTH_TOKEN) {
  Write-Host "[auth] NETLIFY_AUTH_TOKEN detected -> non-interactive deploy."
} else {
  Write-Host "[auth] no token env. If not logged in, CLI will prompt. To log in first:"
  Write-Host "       netlify login"
}

# 배포 명령 조립
$flags = @("deploy", "--dir", "$target", "--no-build")
if ($Draft) {
  Write-Host "[mode] DRAFT deploy (preview URL)"
} else {
  $flags += "--prod"
  Write-Host "[mode] PRODUCTION deploy (--prod)"
}
if ($SiteName) {
  $flags += @("--site", $SiteName)
  Write-Host "[site] target site: $SiteName"
}

$cmdline = "$runner " + ($flags -join " ")
Write-Host "[cli] running: $cmdline"
Write-Host ""

# 실행 (로그인 안 됐으면 CLI가 자체 안내/프롬프트)
if ($runner -eq "netlify") {
  & netlify @flags
} else {
  & npx --yes netlify-cli @flags
}
