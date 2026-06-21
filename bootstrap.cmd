@echo off
REM bootstrap.cmd - double-click launcher for setup.ps1
REM This file is ASCII-only on purpose (Korean text in a .cmd breaks cmd parsing).
REM See README.md for the Korean guide.

echo ================================================================
echo  Hackathon Dev Bootstrap
echo  Launching setup.ps1 ...
echo ================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"

echo.
echo ----------------------------------------------------------------
echo  Bootstrap script finished. Review the summary above.
echo ----------------------------------------------------------------
pause
