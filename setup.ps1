# setup.ps1
# 새 Windows 노트북 / 대회 제공 PC를 0부터 한 번에 세팅하는 원샷 설치 스크립트(멱등 실행).
# 하는 일: winget으로 핵심 도구 설치 -> npm 전역 CLI 설치 -> pip 패키지(선택) -> 끝에 버전 검증/요약.
# 콘솔에 찍는 메시지는 전부 ASCII 영문만 사용한다(Windows 콘솔 코드페이지 모지바케 방지).
# 한국어 설명은 오직 주석(#)에만 둔다.
#
# 반입 합법선: 이 스크립트는 '도구 설치 / 일반 지식'만 담는다. 주제맞춤 완성 앱 코드는 담지 않는다.
# 대회 당일 빈 새 저장소에서 작성한다.
#
# 사용한 winget ID / npm 패키지는 모두 웹 검색으로 현존을 확인했다(아래 각 섹션 주석 참조).

$ErrorActionPreference = 'Continue'        # 한 패키지가 실패해도 멈추지 않고 끝까지 진행
$ProgressPreference    = 'SilentlyContinue' # 진행바 잡음 줄이기

$script:Summary = @()

function Test-Command {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Update-SessionPath {
  # 설치 직후 새로 깔린 명령을 같은 세션에서 인식하도록 Machine + User PATH 를 병합 반영
  $machine = [System.Environment]::GetEnvironmentVariable('Path','Machine')
  $user    = [System.Environment]::GetEnvironmentVariable('Path','User')
  $merged  = @($machine, $user) | Where-Object { $_ -and $_.Trim() -ne '' }
  $env:Path = ($merged -join ';')
}

function Test-WingetInstalled {
  param([string]$Id)
  try {
    winget list -e --id $Id 2>$null | Out-Null
    return ($LASTEXITCODE -eq 0)
  } catch { return $false }
}

function Install-WingetPkg {
  # 패키지별 try/catch. 실패해도 계속. user 스코프 우선 -> 실패 시 스코프 미지정 재시도.
  param(
    [Parameter(Mandatory)][string]$Id,
    [Parameter(Mandatory)][string]$Name
  )
  Write-Host ""
  Write-Host "==> Installing: $Name  [$Id]"
  if (Test-WingetInstalled $Id) {
    Write-Host "    Already installed. Skipping."
    $script:Summary += [pscustomobject]@{ Component = $Name; Result = 'OK (already installed)' }
    return
  }
  $base = @('-e','--id', $Id, '--accept-package-agreements','--accept-source-agreements','--disable-interactivity')
  $code = 1
  try {
    # 1차: user 스코프(관리자 권한 없이도 설치 시도)
    Write-Host "    Trying user scope..."
    winget install $base --scope user
    $code = $LASTEXITCODE
    if ($code -ne 0) {
      # 2차: 스코프 미지정 재시도(해당 패키지가 user 스코프를 지원하지 않는 경우)
      Write-Host "    Retrying without scope..."
      winget install $base
      $code = $LASTEXITCODE
    }
  } catch {
    Write-Host "    ERROR: $($_.Exception.Message)"
  }
  if ($code -eq 0 -or (Test-WingetInstalled $Id)) {
    Write-Host "    Done: $Name"
    $script:Summary += [pscustomobject]@{ Component = $Name; Result = 'OK' }
  } else {
    Write-Host "    FAILED: $Name (exit $code)"
    $script:Summary += [pscustomobject]@{ Component = $Name; Result = "FAILED (exit $code)" }
  }
}

function Install-NpmPkg {
  param([Parameter(Mandatory)][string]$Pkg, [string]$Label)
  if (-not $Label) { $Label = $Pkg }
  Write-Host ""
  Write-Host "==> npm i -g $Pkg"
  if (-not (Test-Command npm)) {
    Write-Host "    SKIP: npm not found on PATH."
    $script:Summary += [pscustomobject]@{ Component = "npm: $Label"; Result = 'SKIPPED (no npm)' }
    return
  }
  try {
    npm install -g $Pkg
    if ($LASTEXITCODE -eq 0) {
      Write-Host "    Done: $Label"
      $script:Summary += [pscustomobject]@{ Component = "npm: $Label"; Result = 'OK' }
    } else {
      Write-Host "    FAILED: $Label (exit $LASTEXITCODE)"
      $script:Summary += [pscustomobject]@{ Component = "npm: $Label"; Result = "FAILED (exit $LASTEXITCODE)" }
    }
  } catch {
    Write-Host "    ERROR: $Label - $($_.Exception.Message)"
    $script:Summary += [pscustomobject]@{ Component = "npm: $Label"; Result = 'ERROR' }
  }
}

function Show-Version {
  param([string]$Label, [string]$Cmd, [string[]]$VerArgs)
  try {
    if (Test-Command $Cmd) {
      $out = & $Cmd @VerArgs 2>$null | Select-Object -First 1
      if (-not $out) { $out = '(installed)' }
      Write-Host ("  {0,-16}: {1}" -f $Label, $out)
    } else {
      Write-Host ("  {0,-16}: NOT FOUND" -f $Label)
    }
  } catch {
    Write-Host ("  {0,-16}: (version check error)" -f $Label)
  }
}

# ---------------------------------------------------------------------------
Write-Host "================================================================"
Write-Host " Hackathon Dev Bootstrap - one-shot installer"
Write-Host "================================================================"

# 관리자 권한 확인. 관리자가 아니면 user 스코프 우선 설치(안내만 하고 계속 진행).
$isAdmin = $false
try {
  $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
} catch {}
if ($isAdmin) {
  Write-Host "[info] Running as Administrator."
} else {
  Write-Host "[info] Not Administrator. Will prefer user-scope installs."
  Write-Host "[info] If a package needs machine scope, re-run inside an elevated PowerShell."
}

# winget 존재 확인. 없으면 Microsoft Store 의 'App Installer' 설치 후 재실행 안내.
if (-not (Test-Command winget)) {
  Write-Host ""
  Write-Host "[error] 'winget' was not found on this PC."
  Write-Host "        Install 'App Installer' from the Microsoft Store, then re-run this script."
  Write-Host "        Store page: https://apps.microsoft.com/detail/9NBLGGH4NNS1"
  Write-Host ""
  exit 1
}
Write-Host "[ok] winget is available."

# winget 소스 갱신(실패해도 계속)
try {
  Write-Host "[info] Updating winget sources..."
  winget source update | Out-Null
} catch {}

Write-Host ""
Write-Host "---- Step 1/4: Core tools (winget) ----"
# 검증된 winget ID 만 사용(웹 검색으로 현존 확인):
#   Git.Git / OpenJS.NodeJS.LTS / Python.Python.3.12 / Microsoft.VisualStudioCode / GitHub.cli
#   Cloudflare.cloudflared (L2 데모 폴백: 로컬 서버를 공개 HTTPS로 노출하는 quick tunnel)
# Edge 는 Windows 에 기본 탑재되어 있으므로 설치 제외(의도적 생략).
Install-WingetPkg -Id 'Git.Git'                    -Name 'Git'
Install-WingetPkg -Id 'OpenJS.NodeJS.LTS'          -Name 'Node.js LTS'
Install-WingetPkg -Id 'Python.Python.3.12'         -Name 'Python 3.12'
Install-WingetPkg -Id 'Microsoft.VisualStudioCode' -Name 'Visual Studio Code'
Install-WingetPkg -Id 'GitHub.cli'                 -Name 'GitHub CLI (gh)'
Install-WingetPkg -Id 'Cloudflare.cloudflared'     -Name 'cloudflared (tunnel)'

# PATH 갱신 후 node / npm 인식 보강
Update-SessionPath
$nodeDir = Join-Path $env:ProgramFiles 'nodejs'
if ((Test-Path $nodeDir) -and ($env:Path -notlike "*$nodeDir*")) { $env:Path = "$env:Path;$nodeDir" }
$npmBin = Join-Path $env:APPDATA 'npm'
if ((Test-Path $npmBin) -and ($env:Path -notlike "*$npmBin*")) { $env:Path = "$env:Path;$npmBin" }

Write-Host ""
Write-Host "---- Step 2/4: Global CLIs (npm) ----"
if (Test-Command npm) {
  # 검증된 npm 패키지만 본설치(웹 검색으로 npm 레지스트리 현존 확인):
  #   serve                 -> vercel/serve, 정적 사이트/SPA 로컬 서빙
  #   netlify-cli           -> 'netlify deploy' 로 당일 결과물 호스팅(L0)
  #   vercel                -> 다른 벤더 미러 호스팅(L1, 'vercel --prod')
  #   @anthropic-ai/claude-code -> Claude Code CLI (공식 npm 패키지)
  #   @openai/codex         -> Codex CLI (공식 npm 패키지)
  Install-NpmPkg -Pkg 'serve'                     -Label 'serve (static server)'
  Install-NpmPkg -Pkg 'netlify-cli'               -Label 'netlify-cli'
  Install-NpmPkg -Pkg 'vercel'                    -Label 'vercel'
  Install-NpmPkg -Pkg '@anthropic-ai/claude-code' -Label 'Claude Code CLI'
  Install-NpmPkg -Pkg '@openai/codex'             -Label 'Codex CLI'

  # 선택(주석 해제 시 설치):
  #   http-server  : serve 대체 정적 서버               -> Install-NpmPkg -Pkg 'http-server' -Label 'http-server'
  # 참고: Claude Code 는 네이티브 설치기(irm https://claude.ai/install.ps1 | iex)도 있으나,
  #       오프라인/일관성을 위해 검증된 npm 패키지로 설치한다.
} else {
  Write-Host "[warn] npm not found after Node install in THIS session."
  Write-Host "[warn] Open a NEW terminal and re-run this script to add the global CLIs."
  $script:Summary += [pscustomobject]@{ Component = 'npm globals'; Result = 'SKIPPED (npm missing in session)' }
}

# 방금 설치된 전역 CLI 를 같은 세션에서 인식하도록 npm 전역 bin 재확인
$npmBin = Join-Path $env:APPDATA 'npm'
if ((Test-Path $npmBin) -and ($env:Path -notlike "*$npmBin*")) { $env:Path = "$env:Path;$npmBin" }

Write-Host ""
Write-Host "---- Step 3/4: Python packages (pip, optional) ----"
# 선택 설치: requests(공공데이터 API 호출) / pillow(아이콘/이미지 생성). --user 로 권한 없이 설치.
if (Test-Command python) {
  try {
    python -m pip install --user --upgrade pip | Out-Null
    python -m pip install --user requests pillow
    if ($LASTEXITCODE -eq 0) {
      Write-Host "    Done: requests, pillow"
      $script:Summary += [pscustomobject]@{ Component = 'pip: requests, pillow'; Result = 'OK' }
    } else {
      Write-Host "    FAILED: pip packages (exit $LASTEXITCODE)"
      $script:Summary += [pscustomobject]@{ Component = 'pip: requests, pillow'; Result = "FAILED (exit $LASTEXITCODE)" }
    }
  } catch {
    Write-Host "    ERROR: pip - $($_.Exception.Message)"
    $script:Summary += [pscustomobject]@{ Component = 'pip: requests, pillow'; Result = 'ERROR' }
  }
} else {
  Write-Host "[warn] python not found in THIS session. Open a NEW terminal and re-run for the pip step."
  $script:Summary += [pscustomobject]@{ Component = 'pip packages'; Result = 'SKIPPED (no python)' }
}

Write-Host ""
Write-Host "---- Step 4/4: Verification (versions) ----"
Show-Version -Label 'git'     -Cmd 'git'     -VerArgs @('--version')
Show-Version -Label 'node'    -Cmd 'node'    -VerArgs @('--version')
Show-Version -Label 'npm'     -Cmd 'npm'     -VerArgs @('--version')
Show-Version -Label 'python'  -Cmd 'python'  -VerArgs @('--version')
Show-Version -Label 'gh'      -Cmd 'gh'      -VerArgs @('--version')
Show-Version -Label 'code'    -Cmd 'code'    -VerArgs @('--version')
Show-Version -Label 'serve'   -Cmd 'serve'   -VerArgs @('--version')
Show-Version -Label 'netlify' -Cmd 'netlify' -VerArgs @('--version')
Show-Version -Label 'vercel'  -Cmd 'vercel'  -VerArgs @('--version')
Show-Version -Label 'cloudflared' -Cmd 'cloudflared' -VerArgs @('--version')
Show-Version -Label 'claude'  -Cmd 'claude'  -VerArgs @('--version')
Show-Version -Label 'codex'   -Cmd 'codex'   -VerArgs @('--version')

Write-Host ""
Write-Host "================================================================"
Write-Host " Install Summary"
Write-Host "================================================================"
foreach ($row in $script:Summary) {
  Write-Host ("  {0,-28} {1}" -f $row.Component, $row.Result)
}
Write-Host ""
Write-Host "[done] Bootstrap finished."
Write-Host "[hint] If some CLIs show NOT FOUND, open a NEW terminal (PATH refresh) and run them again."
Write-Host "[note] Edge is preinstalled on Windows, so it is skipped by design."
