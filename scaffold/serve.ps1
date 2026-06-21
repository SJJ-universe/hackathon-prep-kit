# serve.ps1 - 로컬 정적 서버 실행 (Windows PowerShell)
# 사용법:  PS> .\serve.ps1   또는   PS> .\serve.ps1 -Port 8137
# 우선순위: 1) npx http-server  2) python -m http.server (폴백)
# file:// 가 아닌 http:// 로 열어야 fetch / 서비스워커가 정상 동작합니다.

param(
  [int]$Port = 8137
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$url = "http://localhost:$Port"

function Test-Command([string]$name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

Write-Host "============================================"
Write-Host " Static dev server"
Write-Host " Dir : $root"
Write-Host " URL : $url"
Write-Host "============================================"

# 브라우저는 약간의 지연 후 열어 서버가 먼저 기동되게 함.
Start-Job -ScriptBlock {
  param($u)
  Start-Sleep -Seconds 2
  Start-Process $u
} -ArgumentList $url | Out-Null

Set-Location $root

if (Test-Command "npx") {
  Write-Host "[serve] using: npx http-server"
  Write-Host "[serve] press Ctrl+C to stop"
  # -c-1: 캐시 비활성(개발 편의), -o 생략(위에서 직접 오픈)
  npx --yes http-server -p $Port -c-1 .
}
elseif (Test-Command "python") {
  Write-Host "[serve] http-server not found, using: python -m http.server"
  Write-Host "[serve] press Ctrl+C to stop"
  python -m http.server $Port
}
elseif (Test-Command "py") {
  Write-Host "[serve] using: py -m http.server"
  Write-Host "[serve] press Ctrl+C to stop"
  py -m http.server $Port
}
else {
  Write-Host "[error] neither npx nor python found."
  Write-Host "[error] install Node.js (https://nodejs.org) or Python (https://python.org)."
  exit 1
}
