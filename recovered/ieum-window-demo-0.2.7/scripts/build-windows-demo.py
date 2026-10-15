"""Build an offline portable demo from a checksum-verified Electron runtime.
Usage: python3 scripts/build-windows-demo.py RUNTIME.zip SHASUMS256.txt
"""
import hashlib,json,shutil,sys,zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
runtime=Path(sys.argv[1]);sums=Path(sys.argv[2])
expected=next(line.split()[0] for line in sums.read_text(encoding='utf-8').splitlines() if line.split()[-1].lstrip('*')==runtime.name)
assert hashlib.sha256(runtime.read_bytes()).hexdigest()==expected,'Electron checksum mismatch'
version=json.loads((root/'package.json').read_text(encoding='utf-8'))['version']
out=root/'release';out.mkdir(exist_ok=True)
stage=out/f'Ieum-Deadline-Demo-{version}-win-x64'
assert not stage.exists(),'Preserving existing build; select a clean output directory'
stage.mkdir()
with zipfile.ZipFile(runtime) as z:z.extractall(stage)
(stage/'electron.exe').rename(stage/'Ieum-Deadline-Demo.exe')
app=stage/'resources'/'app';app.mkdir()
for folder in ['js','css','data','assets','desktop','server']:shutil.copytree(root/folder,app/folder)
for name in ['index.html','package.json','DEADLINES.md','DUTIES.md','VALIDATION.md']:shutil.copy2(root/name,app/name)
# demo role never imports server dependencies or opens a server connection.
(stage/'resources'/'default_app.asar').unlink(missing_ok=True)
(stage/'START-DEMO.cmd').write_bytes(b'@echo off\r\ncd /d "%~dp0"\r\nstart "" "Ieum-Deadline-Demo.exe"\r\n')
(stage/'READ-ME.txt').write_text('이음 마감 일정 데모 '+version+'\n\nZIP을 모두 풀고 Ieum-Deadline-Demo.exe 또는 START-DEMO.cmd를 실행하세요.\nWindows 10/11 x64용 무설치 데모입니다. Node.js 설치나 서버 연결은 필요 없습니다.\n내 캘린더 → 메시지 일정 체험에서 수신 메시지를 입력하세요.\n실제 교내 서버에 연결하지 않는 예시 데이터 데모입니다.\n서명되지 않은 빌드이며 Windows 실행 검증은 별도로 필요합니다.\n기존 설치본을 덮어쓰지 않습니다.\n',encoding='utf-8-sig')
archive=Path(shutil.make_archive(str(stage),'zip',out,stage.name))
hashvalue=hashlib.sha256(archive.read_bytes()).hexdigest()
(out/'SHA256SUMS.txt').write_text(hashvalue+'  '+archive.name+'\n')
print(archive);print('SHA256:',hashvalue)
