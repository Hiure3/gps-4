@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo Instale o Node.js 22 em https://nodejs.org e abra este arquivo de novo. & pause & exit /b 1)
call npm install
call npm run dist
echo.
echo Pronto. O instalador esta na pasta "release".
pause
