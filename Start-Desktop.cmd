@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 이상을 먼저 설치하세요.
  pause
  exit /b 1
)
if not exist node_modules\electron\cli.js (
  call npm.cmd ci
  if errorlevel 1 goto failed
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0windows\Start-App.ps1"
if errorlevel 1 goto failed
exit /b 0
:failed
echo 실행하지 못했습니다. 위 오류와 docs\assignment\RUN.md를 확인하세요.
pause
exit /b 1
