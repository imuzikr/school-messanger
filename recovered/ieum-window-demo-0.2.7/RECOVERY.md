# app.asar 0.2.7 복구 소스

2026-10-10에 설치된 Ieum Window Demo 0.2.7의 app.asar에서 추출했습니다. 앱 소스와 원본 리소스 23개는 추출본과 바이트 단위로 동일합니다. 원본 app.asar, 전체 추출본, 소스 백업 ZIP은 로컬에 보존되어 있으며 Git에 넣지 않았습니다.

기존 저장소의 기본 브랜치 `codex/window-demo-download`와 기준 커밋 `1b5a3f4b0c1448ce32e44d510bce48531127edaf`를 먼저 확인했습니다. 기존 설치 파일, README, 설치 스크립트, 해시 목록을 유지하고 이 새 하위 폴더만 추가했습니다. 새 커밋에는 기존 배포 파일의 변경·삭제가 없습니다.

## 파일 목록

| 범위 | 수 | 내용 |
| --- | ---: | --- |
| desktop/ | 7 | Electron 메인·preload, 서버·관리자 화면 |
| server/ | 2 | HTTPS/SQLite 서버, 일과표 모듈 |
| js/ | 3 | 앱 화면, 서버 연결, 알림 |
| css/ | 3 | 디자인 토큰, 컴포넌트, 데스크톱 스타일 |
| data/ | 1 | 데모 예시 데이터 |
| assets/ | 5 | 폰트·라이선스, 아이콘, NSIS 설치 스크립트 |
| 루트 | 2 | index.html, package.json |

`recovery-notes/included-files.csv`는 23개 소스 파일과 SHA-256을, `excluded-files.csv`는 제외한 node_modules 파일 551개와 사유를 기록합니다. `all-files.txt`는 ASAR 전체 574개 파일 목록입니다. 이 문서와 .gitignore, .gitattributes 및 검증 기록은 복구 작업에서 새로 추가한 파일입니다. .gitattributes는 이 하위 폴더의 줄바꿈 자동 변환을 막아 복구 바이트를 보존합니다.

비밀값·인증 파일·런타임 데이터, node_modules, 빌드 산출물은 새 커밋에서 제외했습니다. 폰트와 아이콘은 앱에서 참조하는 원본 리소스입니다. 개인키, 공급자 토큰, JWT, 인증정보 URL, 비밀번호·토큰 리터럴과 camelCase 인증정보를 검사하고 인증 관련 참조를 검토했습니다. 하드코딩된 비밀값은 발견하지 못했습니다. 패턴 검사만으로 임의 형식·암호화·난독화된 비밀값의 부재를 보증할 수는 없습니다.

## 실행 확인 결과

- Node.js v24.21.0에서 JS/CJS 10개 전체의 `node --check` 통과.
- 복구 소스로 실행한 브라우저 데모에서 '먼저 둘러보기' 진입, v0.2.7 조직도, 내 캘린더 화면 전환 확인. 브라우저 콘솔 오류 없음. 실제 서버 연결과 Electron IPC 검증은 이 브라우저 검사에 포함하지 않음.
- 복구된 server/index.cjs를 로컬 127.0.0.1의 임시 HTTPS 서버로 기동. 임의 생성한 테스트 비밀번호와 별도 SQLite 데이터 경로 사용. health, login, bootstrap, sync(빈 작업), logout 모두 HTTP 200, 관리자 인증과 초기 데이터 반환 확인. 실험용 인증서·키·DB·토큰은 커밋하지 않음.
- 서버 테스트의 의존성은 로컬 추출본의 node_modules를 NODE_PATH로 참조했으며, 의존성 폴더는 커밋하지 않음. 깨끗한 환경에서 npm 의존성을 새로 설치하는 검증은 수행하지 않음.
- Windows Electron 44.7.0 런타임을 복사하여 복구 소스를 demo 역할 및 별도 사용자 데이터로 실행 시도. 복사본의 디렉터리 ACL이 Electron 샌드박스 읽기를 차단하여 창 실행 확인에 실패. 원본 설치본이나 Windows 권한은 변경하지 않음. 따라서 복구 소스의 데스크톱 실행 성공은 아직 검증되지 않음.
- 실제 PC 간 메시지 전달, 서버/클라이언트 전체 흐름, 설치 프로그램 재빌드, 자동 실행은 검증하지 않음.

## 실행 조건과 방법

복구 package.json에는 `desktop/main.cjs` 진입점과 @peculiar/x509 2.1.0, reflect-metadata 0.2.2만 있습니다. npm scripts, Electron 개발 의존성, lockfile, 원래 빌드 설정은 ASAR에 없으므로 `npm start`와 설치 프로그램 재빌드는 바로 사용할 수 없습니다.

브라우저 데모는 이 폴더를 정적 HTTP 서버로 제공한 뒤 index.html의 '먼저 둘러보기'를 누르면 실행됩니다. 정적 서버는 Git이나 이 복구본에 포함하지 않았습니다.

Electron 개발 실행은 Node.js/npm과 호환되는 Electron 설치가 있는 환경에서 다음과 같이 시도할 수 있습니다. 이 절차는 참고용이며 이 환경에서 끝까지 검증되지는 않았습니다.

```powershell
# 이 RECOVERY.md가 있는 폴더에서 실행
npm install
npm install --no-save electron@44.7.0
$env:IEUM_ROLE = 'demo'
$env:IEUM_TEST_DATA_DIR = Join-Path $env:TEMP 'ieum-recovery-demo'
npx --no-install electron .
```

개발 실행은 package.json의 ieumRole보다 IEUM_ROLE을 사용하며, 생략하면 client 역할입니다. server 역할은 IEUM_ROLE을 server로 지정하고 관리자 설정 화면에서 계정을 직접 설정해야 합니다. 서버 모듈은 node:sqlite를 지원하는 런타임과 npm 의존성이 필요하며, `node server/index.cjs`만으로 서버가 자동 시작되지는 않습니다. `startServer`를 호출하는 프로그램 또는 Electron 서버 역할을 사용해야 합니다.
