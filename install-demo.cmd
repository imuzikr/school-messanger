@echo off
setlocal
cd /d "%~dp0"
if not exist "Ieum-0.2.55.part01" goto missing
if not exist "Ieum-0.2.55.part02" goto missing
if not exist "Ieum-0.2.56-update.zip" goto missing
copy /y /b "Ieum-0.2.55.part01"+"Ieum-0.2.55.part02" "Ieum-Base-0.2.55-win-x64.zip"
if errorlevel 1 goto failed
powershell -NoProfile -Command "$ErrorActionPreference='Stop'; if ((Get-FileHash -LiteralPath 'Ieum-Base-0.2.55-win-x64.zip' -Algorithm SHA256).Hash.ToLower() -ne 'bb821d3e8c83141d62171f863b66254a9888fb6f2c06d31151147835fc893be5') { throw 'Base checksum mismatch' }; if ((Get-FileHash -LiteralPath 'Ieum-0.2.56-update.zip' -Algorithm SHA256).Hash.ToLower() -ne '3316f35db19a208cacdfd4582b05f787c6fbfb499f009597441a760873d3b396') { throw 'Update checksum mismatch' }"
if errorlevel 1 goto failed
powershell -NoProfile -Command "$ErrorActionPreference='Stop'; $target='app-0.2.56/Ieum-Deadline-Demo-0.2.56-win-x64'; if (!(Test-Path -LiteralPath $target)) { Expand-Archive -LiteralPath 'Ieum-Base-0.2.55-win-x64.zip' -DestinationPath 'app-0.2.56' -Force; Rename-Item -LiteralPath 'app-0.2.56/Ieum-Deadline-Demo-0.2.55-win-x64' -NewName 'Ieum-Deadline-Demo-0.2.56-win-x64' }; Expand-Archive -LiteralPath 'Ieum-0.2.56-update.zip' -DestinationPath $target -Force; $v=Get-Content -LiteralPath ($target+'/resources/app/package.json') -Raw | ConvertFrom-Json; if ($v.version -ne '0.2.56') { throw 'Version mismatch' }"
if errorlevel 1 goto failed
start "" "app-0.2.56\Ieum-Deadline-Demo-0.2.56-win-x64\Ieum-Deadline-Demo.exe"
exit /b 0
:missing
echo Extract the entire downloaded ZIP into a folder first.
pause
exit /b 1
:failed
echo Could not assemble or verify the demo. Close the running demo and try again.
pause
exit /b 1
