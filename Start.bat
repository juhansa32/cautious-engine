@echo off
chcp 65001 >nul
title 귀환하지 않은 퇴마 - 방송용 (로컬 실행)
cd /d "%~dp0"

echo ==================================
echo   현재 폴더: %cd%
echo ==================================

echo.
echo [1/3] Node 버전 확인...
node -v
if errorlevel 1 (
  echo.
  echo [오류] Node.js가 설치되어 있지 않거나 PATH에 없습니다.
  echo 해결: https://nodejs.org 에서 LTS 설치 후 재부팅/재로그인
  echo.
  pause
  exit /b 1
)

echo.
echo [2/3] npm 버전 확인...
npm -v
if errorlevel 1 (
  echo.
  echo [오류] npm이 실행되지 않습니다. Node.js 재설치가 필요할 수 있습니다.
  pause
  exit /b 1
)

echo.
echo [3/3] 서버 시작 (npm start)...
echo (처음 1회는 npm install 필요할 수 있음)
echo.
npm start

echo.
echo [종료] 서버가 종료되었습니다.
pause
