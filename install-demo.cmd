@echo off
setlocal
cd /d "%~dp0"
if not exist "Ieum-0.2.18.part01" goto missing
if not exist "Ieum-0.2.18.part02" goto missing
copy /y /b "Ieum-0.2.18.part01"+"Ieum-0.2.18.part02" "Ieum-Deadline-Demo-0.2.18-win-x64.zip"
if errorlevel 1 goto failed
powershell -NoProfile -Command "$p='Ieum-Deadline-Demo-0.2.18-win-x64.zip'; if ((Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLower() -ne 'bbbbb1d6e2df64a9b44d911cda45917b22a54fca8f76d9505d736df0284ef11f') { Write-Error 'Checksum mismatch'; exit 1 }"
if errorlevel 1 goto failed
echo ZIP created and SHA-256 verified.
if exist "app\Ieum-Deadline-Demo-0.2.18-win-x64\Ieum-Deadline-Demo.exe" goto launch
powershell -NoProfile -Command "Expand-Archive -LiteralPath 'Ieum-Deadline-Demo-0.2.18-win-x64.zip' -DestinationPath 'app'"
if errorlevel 1 goto failed
:launch
start "" "app\Ieum-Deadline-Demo-0.2.18-win-x64\Ieum-Deadline-Demo.exe"
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
