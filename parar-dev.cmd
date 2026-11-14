
@echo off
title Prefeitura Digital - encerrando servidores

echo.
echo ==========================================
echo   ENCERRANDO PREFEITURA DIGITAL
echo ==========================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ports = @(3000,5173); " ^
  "$pids = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in $ports } | Select-Object -ExpandProperty OwningProcess -Unique; " ^
  "if (!$pids) { Write-Host 'Nenhum servidor encontrado nas portas 3000 e 5173.'; exit 0 }; " ^
  "foreach ($procId in $pids) { " ^
  "Write-Host ('Encerrando PID ' + $procId); " ^
  "taskkill.exe /PID $procId /T /F " ^
  "}"

echo.
echo Verificacao final...

timeout /t 2 /nobreak >nul

netstat -ano | findstr /R /C:":3000 .*LISTENING" /C:":5173 .*LISTENING"

if errorlevel 1 (
    echo.
    echo [OK] Portas 3000 e 5173 liberadas.
) else (
    echo.
    echo [AVISO] Ainda existe algum processo escutando nas portas.
)

echo.
pause
