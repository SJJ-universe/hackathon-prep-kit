# deploy-netlify.ps1 - Netlify 배포 도우미 (Windows PowerShell)
# 두 가지 경로를 안내합니다.
#   A) Netlify Drop : 무인증, 가장 빠름 (브라우저에 폴더 드래그앤드롭)
#   B) Netlify CLI  : npx netlify deploy --dir . --prod (사전 netlify login 필요)
#
# 사용법:
#   PS> .\deploy-netlify.ps1            # 안내 + CLI 시도(로그인 되어있으면)
#   PS> .\deploy-netlify.ps1 -DropOnly  # Drop 안내만 (CLI 실행 안 함)

param(
  [switch]$DropOnly
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "============================================"
Write-Host " Netlify deploy helper"
Write-Host " Dir : $root"
Write-Host "============================================"
Write-Host ""
Write-Host "[A] Netlify Drop (no login, fastest)"
Write-Host "    1) open https://app.netlify.com/drop"
Write-Host "    2) drag-and-drop this folder onto the page"
Write-Host "    3) a public URL is issued in seconds"
Write-Host ""

# Drop 페이지를 자동으로 열어줌 (가장 빠른 경로 우선 노출).
Start-Process "https://app.netlify.com/drop"

if ($DropOnly) {
  Write-Host "[done] Drop page opened. DropOnly mode -> skipping CLI."
  exit 0
}

Write-Host "[B] Netlify CLI (needs prior: npx netlify login)"
Write-Host "    command: npx netlify deploy --dir . --prod"
Write-Host ""

function Test-Command([string]$name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

if (-not (Test-Command "npx")) {
  Write-Host "[skip] npx not found -> install Node.js to use CLI path."
  Write-Host "[hint] use the Netlify Drop page that just opened instead."
  exit 0
}

Set-Location $root
Write-Host "[cli] running: npx netlify deploy --dir . --prod"
Write-Host "[cli] if not logged in, run first: npx netlify login"
# 로그인되어 있지 않으면 CLI가 자체적으로 안내/실패하므로 그대로 위임.
npx --yes netlify deploy --dir . --prod
