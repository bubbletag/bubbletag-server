# BubbleTag Server

Gmail Push Notification 서버 — Vercel 배포용

## 환경변수 설정 (Vercel Dashboard)

| 변수명 | 설명 |
|--------|------|
| `VAPID_PUBLIC` | Web Push 공개키 |
| `VAPID_PRIVATE` | Web Push 비밀키 |
| `VAPID_EMAIL` | mailto:bubbletag.help@gmail.com |
| `GOOGLE_PROJECT_ID` | Google Cloud 프로젝트 ID |

## API 엔드포인트

- `GET /` — 헬스체크
- `POST /subscribe` — Web Push 구독 등록
- `POST /gmail-webhook` — Gmail Pub/Sub 수신
- `POST /renew-gmail` — Gmail 구독 갱신
- `GET /vapid-public-key` — VAPID 공개키 조회
