@echo off
setlocal
cd /d "%~dp0"
copy /b Ieum-demo.part01+Ieum-demo.part02+Ieum-demo.part03 "Ieum-demo-Setup-0.2.0-x64.exe" >nul
if errorlevel 1 goto failed
powershell -NoProfile -Command "if ((Get-FileHash -LiteralPath 'Ieum-demo-Setup-0.2.0-x64.exe' -Algorithm SHA256).Hash -ne '9bfd786806142f327ef7710d72e4f1cc86b159bc43e8ba83e9694194e82f676b') { exit 1 }"
if errorlevel 1 goto failed
start "" /wait "Ieum-demo-Setup-0.2.0-x64.exe"
exit /b
:failed
echo File assembly or SHA256 verification failed. Please extract all ZIP files and try again.
pause
exit /b 1
