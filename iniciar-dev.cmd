@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

title Prefeitura Digital - ambiente de desenvolvimento

rem Uso: iniciar-dev.cmd [local]
rem   (sem argumento) expoe na rede local para testar no celular
rem   local           escuta apenas neste computador

if /i "%~1"=="local" (
  set "WEB_SCRIPT=npm run dev:web"
  set "TITULO_WEB=WEB :5173"
  set "MODO=local (somente este computador)"
) else (
  set "WEB_SCRIPT=npm run dev:web:lan"
  set "TITULO_WEB=WEB :5173 (LAN)"
  set "MODO=rede local (celular na mesma Wi-Fi)"
)

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

echo Modo: !MODO!
if /i not "%~1"=="local" (
  echo.
  node "scripts\ip-local.mjs" 5173
  echo.
  echo Se o celular nao conectar, libere o firewall ^(PowerShell como Administrador^):
  echo   .\scripts\liberar-firewall.ps1
  echo   ^(regras limitadas a sub-rede local; rede marcada como Publica tambem e coberta^)
  echo.
  echo Aviso: em http:// na rede local o Service Worker NAO registra.
  echo Sem offline e sem instalacao como app; o fluxo de telas e API funciona normalmente.
  echo.
)

where wt >nul 2>nul
if errorlevel 1 goto janela_unica

echo Abrindo API ^(:3000^) e frontend ^(:5173^) em paineis divididos...
wt -d "%CD%" --title "API :3000" --suppressApplicationTitle cmd /k "npm run dev:api" ; split-pane -V -d "%CD%" --title "!TITULO_WEB!" --suppressApplicationTitle cmd /k "!WEB_SCRIPT!"
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
