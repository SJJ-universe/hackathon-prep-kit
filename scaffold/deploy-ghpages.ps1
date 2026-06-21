# deploy-ghpages.ps1 - GitHub Pages 배포 도우미 (Windows PowerShell)
# gh CLI로 저장소 생성 -> 푸시 -> Pages 활성화까지 수행합니다.
# 사전 준비:  gh auth login  (한 번만)
#
# 사용법:
#   PS> .\deploy-ghpages.ps1 -Repo my-demo
#   PS> .\deploy-ghpages.ps1 -Repo my-demo -Private
#
# 참고: 정적 사이트(이 스캐폴드)는 루트(/)에 index.html 이 있으므로
#       기본 브랜치의 root 폴더를 Pages 소스로 지정합니다.

param(
  [Parameter(Mandatory = $true)][string]$Repo,
  [switch]$Private,
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

function Test-Command([string]$name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

Write-Host "============================================"
Write-Host " GitHub Pages deploy helper"
Write-Host " Dir  : $root"
Write-Host " Repo : $Repo"
Write-Host "============================================"

if (-not (Test-Command "git")) {
  Write-Host "[error] git not found -> install Git for Windows."
  exit 1
}
if (-not (Test-Command "gh")) {
  Write-Host "[error] gh CLI not found -> install GitHub CLI (https://cli.github.com)."
  exit 1
}

Set-Location $root

# 1) 로컬 git 초기화 (이미 repo면 건너뜀)
if (-not (Test-Path (Join-Path $root ".git"))) {
  Write-Host "[git] init + first commit"
  git init -b $Branch
  git add -A
  git commit -m "init: static scaffold"
}
else {
  Write-Host "[git] existing repo -> commit pending changes"
  git add -A
  git commit -m "update: deploy" 2>$null
  if (-not $?) { Write-Host "[git] nothing to commit (ok)" }
}

# 2) 가시성 플래그
$visibility = "--public"
if ($Private) { $visibility = "--private" }

# 3) GitHub 저장소 생성 + 푸시 (이미 있으면 remote만 연결 후 푸시)
$ghUser = (gh api user --jq ".login")
$fullName = "$ghUser/$Repo"
Write-Host "[gh] target repo: $fullName"

$exists = $false
gh repo view $fullName 1>$null 2>$null
if ($?) { $exists = $true }

if ($exists) {
  Write-Host "[gh] repo exists -> ensuring remote + push"
  git remote remove origin 2>$null
  git remote add origin "https://github.com/$fullName.git"
  git push -u origin $Branch
}
else {
  Write-Host "[gh] creating repo and pushing"
  gh repo create $Repo $visibility --source "." --remote "origin" --push
}

# 4) GitHub Pages 활성화 (기본 브랜치의 root 폴더)
Write-Host "[gh] enabling Pages (branch=$Branch, path=/)"
# 생성 시도 -> 이미 있으면 업데이트(PUT)로 폴백
gh api -X POST "repos/$fullName/pages" -f "source[branch]=$Branch" -f "source[path]=/" 1>$null 2>$null
if (-not $?) {
  gh api -X PUT "repos/$fullName/pages" -f "source[branch]=$Branch" -f "source[path]=/" 1>$null 2>$null
}

# 5) 결과 URL 안내 (반영까지 1-2분 소요될 수 있음)
$pagesUrl = "https://$ghUser.github.io/$Repo/"
Write-Host "============================================"
Write-Host "[done] pushed and Pages requested."
Write-Host "[url ] $pagesUrl"
Write-Host "[note] first publish can take 1-2 minutes."
Write-Host "[note] if not enabled, set it in: repo Settings > Pages"
Write-Host "============================================"
Start-Process $pagesUrl
