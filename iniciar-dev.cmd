@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

title Prefeitura Digital - ambiente de desenvolvimento

where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado no PATH.
  echo Instale Node 20.19 ou superior: https://nodejs.org
  pause
  exit /b 1
)

if not exist "frontend\node_modules" goto instalar
if not exist "backend\node_modules" goto instalar
goto checar_portas

:instalar
echo Dependencias ausentes. Instalando raiz, frontend e backend...
call npm run install:all
if errorlevel 1 (
  echo [ERRO] Falha ao instalar as dependencias.
  pause
  exit /b 1
)

:checar_portas
set "OCUPADAS="
call :porta_ocupada 3000 && set "OCUPADAS=!OCUPADAS! 3000"
call :porta_ocupada 5173 && set "OCUPADAS=!OCUPADAS! 5173"

if defined OCUPADAS (
  echo [ERRO] Porta^(s^) ja em uso:!OCUPADAS!
  echo Feche os servidores antigos e execute este script novamente.
  pause
  exit /b 1
)

where wt >nul 2>nul
if errorlevel 1 goto janela_unica

echo Abrindo API ^(:3000^) e frontend ^(:5173^) em paineis divididos...
wt -d "%CD%" --title "API :3000" --suppressApplicationTitle cmd /k "npm run dev:api" ; split-pane -V -d "%CD%" --title "WEB :5173" --suppressApplicationTitle cmd /k "npm run dev:web"
exit /b 0

:janela_unica
echo Windows Terminal nao encontrado.
echo Abrindo os dois servidores na mesma janela, com saidas identificadas...
cmd /k "npm run dev"
exit /b 0

:porta_ocupada
netstat -ano | findstr /R /C:":%~1 .*LISTENING" >nul
if errorlevel 1 exit /b 1
exit /b 0
