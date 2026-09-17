@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   Pathlight - starting the app
echo ============================================
echo.

if not exist node_modules (
  echo Installing dependencies - this only happens once...
  call npm install
  if errorlevel 1 goto :error
  echo.
)

echo Building the production app...
call npm run build
if errorlevel 1 goto :error
echo.

echo Starting the server - your browser will open automatically once it's ready.
echo Close THIS window to stop Pathlight.
echo.

start "" /min powershell -NoProfile -Command "for ($i=0; $i -lt 60; $i++) { try { Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3000 -TimeoutSec 1 | Out-Null; Start-Process 'http://localhost:3000'; break } catch { Start-Sleep -Seconds 1 } }"

call npm run start
goto :eof

:error
echo.
echo Something went wrong during install or build - see the messages above.
pause
