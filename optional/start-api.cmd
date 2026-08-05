@echo off
setlocal
cd /d "%~dp0services\barcode-api"
if not exist ".env" copy ".env.example" ".env" >nul
if not exist "node_modules" call npm install
call npm run dev
