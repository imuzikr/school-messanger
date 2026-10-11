@echo off
setlocal
cd /d "%~dp0"
if not exist "Ieum-0.2.26.part01" goto missing
if not exist "Ieum-0.2.26.part02" goto missing
copy /y /b "Ieum-0.2.26.part01"+"Ieum-0.2.26.part02" "Ieum-Deadline-Demo-0.2.26-win-x64.zip"
if errorlevel 1 goto failed
powershell -NoProfile -Command "$p='Ieum-Deadline-Demo-0.2.26-win-x64.zip'; if ((Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLower() -ne 'e7e7e553882542185de227f83bc7c3df2b2a81c7d0fd2c11e4e13eacacb6c011') { Write-Error 'Checksum mismatch'; exit 1 }"
if errorlevel 1 goto failed
echo ZIP created and SHA-256 verified.
if exist "app\Ieum-Deadline-Demo-0.2.26-win-x64\Ieum-Deadline-Demo.exe" goto launch
powershell -NoProfile -Command "Expand-Archive -LiteralPath 'Ieum-Deadline-Demo-0.2.26-win-x64.zip' -DestinationPath 'app'"
if errorlevel 1 goto failed
:launch
start "" "app\Ieum-Deadline-Demo-0.2.26-win-x64\Ieum-Deadline-Demo.exe"
pause
exit /b 0
:missing
echo Extract the entire downloaded ZIP into a folder first.
pause
exit /b 1
:failed
echo Could not assemble or verify the ZIP. Please download the complete ZIP again.
pause
exit /b 1
