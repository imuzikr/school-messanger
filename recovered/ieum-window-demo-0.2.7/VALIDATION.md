# 검증 기록 · 0.2.9

2026-10-11 한국 시간. Linux 관리형 작업 환경에서 수행했습니다.

- 작업 시작 브랜치 `recovery/app-asar-0.2.7-20261010`, 기준 커밋 `3276a8bb2d7b899fdf5f8a882cd766f98c637deb`, 미커밋 변경 없음. 구현 브랜치 `feature/offline-message-deadlines`.
- 복구 브랜치 RECOVERY.md를 먼저 읽었습니다. 저장소 루트의 기존 설치/분할 파일과 README·설치 스크립트·SHA256SUMS, 기존 RECOVERY.md와 recovery-notes 전체를 기준 브랜치와 바이트 비교하여 동일함을 확인했습니다.
- Node.js 24에서 새 의존성 설치 성공, package-lock.json 추가. `npm test`: 정규식/날짜/데모 중복 테스트 19개와 실제 HTTPS/SQLite 통합 테스트 1개, 총 20개 통과.
- 정규식 검증: 한국 자정 경계, 내일·모레·다음 주(월요일 시작), 월 일·연도 지정, 윤년/연말, 12시간제·24시간제, 명시 시간 우선, 기본 12:05/16:00, 대상 날짜 임시 일과표 우선, 잘못된 날짜/시간/발송시각, 여러 문장, 삭제 후 중복 방지.
- HTTPS 통합: 발신자(관리자)/수신자 별도 계정, 서버가 기록한 발송 시각, 대화·쪽지 자동 등록, 발신자와 수신자 각각 등록, 수신자 쪽지의 일정 링크, 시작 시간 없음, 반복/동시 재시도, 삭제 후 재전송, 일과표 변경, 잘못된 배치의 전체 롤백, 예약 발송 전 미등록·전달 후 등록, 서버 재시작 후 중복 없음, 타인 일정 삭제 거부.
- 기존 server-smoke 검사도 통과: health/login/bootstrap/sync/logout와 SQLite 재시작 보존.
- Chromium/Playwright: 먼저 둘러보기 → 내 캘린더 → 메시지 일정 체험 → 한국 발송시각/본문 입력 → 12:05 마감 확인. 같은 수신 체험 재실행 및 페이지 새로고침에도 등록 수 유지. 화면에 날짜·마감 표시. 페이지 오류 없음.
- Electron 44.7.0 Linux/Playwright: 자동 데모 진입, preload bridge, IPC로 독립 캘린더 창 생성, 메시지 일정 체험 등록, 메인 창 유지. 조직도 반·담임 버튼 없음, 설정에서 반·담임 진입 유지, 반·담임/일정 체험 모달의 X 아이콘 클릭 후 닫힘 확인. 클라우드 컨테이너에서는 OS sandbox를 비활성화하여 실행했으며 배포 설정은 변경하지 않았습니다.
- Windows x64 데모: 공식 Electron 44.7.0 Windows 런타임의 SHA-256을 공식 SHASUMS256.txt와 비교 검증했습니다. ZIP CRC 검사, Windows PE32+ x64 실행 파일, demo 역할, 모든 포함 JS/CSS/desktop/server/data/assets 파일이 최종 소스와 바이트 단위로 동일함을 확인했습니다. ZIP 해시는 release/SHA256SUMS.txt에 있습니다.
- 실제 Windows 실행·설치·서명/SmartScreen 검증과 실제 학교 PC 사이의 연결 검증은 이 Linux 환경에서 수행하지 않았습니다. 제공물은 설치 프로그램이 아닌 무설치 ZIP 데모입니다. 실제 교내 서버/클라이언트 배포에는 서버 의존성이 포함된 별도 배포 빌드가 필요합니다.

## 재검증

이 폴더에서 `npm install && npm test`. UI 검사에는 별도 Playwright 설치, Chromium과 (Electron 검사의 경우) Electron 44.7.0 및 DISPLAY가 필요합니다. 정적 HTTP 서버를 127.0.0.1:8000에 시작하고 `node tests/browser-deadlines.cjs`를 실행합니다. Electron 검사는 `IEUM_ROLE=demo node tests/electron-deadlines.cjs`로 실행합니다. 브라우저 검사의 Chromium 실행 경로는 `/usr/bin/chromium`입니다.
