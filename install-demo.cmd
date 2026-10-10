@echo off
setlocal
cd /d "%~dp0"
echo Ieum Window Demo v0.2.1 - makeup notices and temporary schedules
:check_running
tasklist /FI "IMAGENAME eq Ieum Window Demo.exe" /NH 2>nul | find /I "Ieum Window Demo.exe" >nul
if errorlevel 1 goto assemble
echo Please exit the old demo from its tray menu, then press any key.
pause >nul
goto check_running
:assemble
copy /b Ieum-demo.part01+Ieum-demo.part02+Ieum-demo.part03 "Ieum-demo-Setup-0.2.1-x64.exe" >nul
if errorlevel 1 goto failed
powershell -NoProfile -Command "if ((Get-FileHash -LiteralPath 'Ieum-demo-Setup-0.2.1-x64.exe' -Algorithm SHA256).Hash -ne '11ebe60abe0ddf59afe698d5a3ff6835c2572bf4c005c00f7bd0b3222c0091d5') { exit 1 }"
if errorlevel 1 goto failed
start "" /wait "Ieum-demo-Setup-0.2.1-x64.exe"
if errorlevel 1 goto failed
echo Open the updated desktop shortcut. The main screen must show v0.2.1.
pause
exit /b 0
:failed
echo File assembly, verification or installation failed. Extract the entire new ZIP and retry.
pause
exit /b 1
