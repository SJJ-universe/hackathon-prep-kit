# deploy-vercel.ps1 - Vercel 미러 배포 도우미 (Windows PowerShell, 2026-06 명령 기준)
#
# 같은 빌드를 두 번째 벤더(Vercel)에 올려 L1 미러를 만든다(다른 CDN/DNS = 이중화).
# 정적 폴더(index.html 포함)를 그대로 배포한다(프레임워크 없으면 무빌드).
#
# 사용법:
#   PS> .\deploy-vercel.ps1                 # 프리뷰 배포(임시 URL)
#   PS> .\deploy-vercel.ps1 -Prod          # 프로덕션(고정 *.vercel.app)
#   PS> .\deploy-vercel.ps1 -Dir .\dist -Prod
#
# 비대화형(에이전트/CI): 먼저 $env:VERCEL_TOKEN = "토큰" (Account Settings > Tokens)
# 토큰 있으면 --token으로 자동 첨부. Hobby는 비상업·개인용 플랜임에 주의.

param(
  [string]$Dir = ".",
  [switch]$Prod
)

$ErrorActionPreference = "Stop"
$target = Resolve-Path -Path $Dir -ErrorAction SilentlyContinue
if (-not $target) { $target = $Dir }

Write-Host "============================================"
Write-Host " Vercel mirror deploy helper (2026)"
Write-Host " Deploy dir : $target"
Write-Host "============================================"

function Test-Cmd([string]$name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

# index.html 루트 검증
if (-not (Test-Path (Join-Path $target "index.html"))) {
  Write-Host "[warn] index.html NOT found at root of: $target (Vercel may 404)."
}

# 실행기 결정: 전역 vercel 우선, 없으면 npx vercel
$useNpx = $false
if (Test-Cmd "vercel") {
  Write-Host "[info] using global 'vercel'"
} elseif (Test-Cmd "npx") {
  $useNpx = $true
  Write-Host "[info] global 'vercel' not found -> using: npx vercel"
  Write-Host "[hint] faster next time: npm install -g vercel  (needs Node 18+)"
} else {
  Write-Host "[skip] neither 'vercel' nor 'npx' found -> install Node.js (setup.ps1)."
  Write-Host "[hint] or drag-drop at https://vercel.com/drop (login required)."
  Start-Process "https://vercel.com/drop"
  exit 0
}

# 인자 조립
$flags = @("--cwd", "$target", "--yes")
if ($Prod) {
  $flags += "--prod"
  Write-Host "[mode] PRODUCTION (--prod --yes)"
} else {
  Write-Host "[mode] PREVIEW (--yes). Use -Prod for the stable URL."
}
if ($env:VERCEL_TOKEN) {
  $flags += @("--token", $env:VERCEL_TOKEN)
  Write-Host "[auth] VERCEL_TOKEN detected -> non-interactive."
} else {
  Write-Host "[auth] no token env. If not logged in, run first: vercel login"
}

$shown = ($flags | ForEach-Object { if ($_ -eq $env:VERCEL_TOKEN -and $env:VERCEL_TOKEN) { "***" } else { $_ } }) -join " "
Write-Host "[cli] running: vercel $shown"
Write-Host ""

if ($useNpx) {
  & npx --yes vercel @flags
} else {
  & vercel @flags
}
