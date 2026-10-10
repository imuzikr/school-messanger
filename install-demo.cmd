@echo off
setlocal
cd /d "%~dp0"
if not exist "Ieum-0.2.10.part01" goto missing
if not exist "Ieum-0.2.10.part02" goto missing
copy /b "Ieum-0.2.10.part01"+"Ieum-0.2.10.part02" "Ieum-Deadline-Demo-0.2.10-win-x64.zip"
if errorlevel 1 goto failed
powershell -NoProfile -Command "$p='Ieum-Deadline-Demo-0.2.10-win-x64.zip'; if ((Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLower() -ne '049878d3a72eb532a3776d87d0eb1ac94f6cbdb705fddc693de77c18d6560c43') { Write-Error 'Checksum mismatch'; exit 1 }"
if errorlevel 1 goto failed
echo ZIP created and SHA-256 verified.
if exist "app\Ieum-Deadline-Demo-0.2.10-win-x64\Ieum-Deadline-Demo.exe" goto launch
powershell -NoProfile -Command "Expand-Archive -LiteralPath 'Ieum-Deadline-Demo-0.2.10-win-x64.zip' -DestinationPath 'app'"
if errorlevel 1 goto failed
:launch
start "" "app\Ieum-Deadline-Demo-0.2.10-win-x64\Ieum-Deadline-Demo.exe"
pause
exit /b 0
:missing
echo Extract the entire downloaded ZIP into a folder first.
pause
exit /b 1
:failed
echo Could not assemble or verify the ZIP. Please download both parts again.
pause
exit /b 1
