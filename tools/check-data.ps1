# check-data.ps1 — check-data.mjs 실행 래퍼 (Node 우선, 없으면 안내)
# 사용:  .\tools\check-data.ps1            (전체)
#        .\tools\check-data.ps1 kma-vilage-fcst taas-oldman   (특정 id)
param([Parameter(ValueFromRemainingArguments = $true)] [string[]] $Ids)

$root = Split-Path -Parent $PSScriptRoot
$script = Join-Path $PSScriptRoot "check-data.mjs"

$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
    Write-Host "[check-data] node 로 실행..." -ForegroundColor Cyan
    & node $script @Ids
    exit $LASTEXITCODE
}

Write-Host "[check-data] node 를 찾지 못했습니다." -ForegroundColor Yellow
Write-Host "  - 옵션 A: setup.ps1 로 Node 설치 후 다시 실행"
Write-Host "  - 옵션 B: Python 만 있는 경우 → scaffold\proxy.py 를 띄우고"
Write-Host "            브라우저/curl 로 /api/<id> 를 한 번씩 호출해 스냅샷을 만드세요:"
Write-Host "            python scaffold\proxy.py" -ForegroundColor Gray
Write-Host "            (프록시는 라이브 응답을 그대로 전달합니다. 저장은 check-data(node)가 담당)"
exit 1
