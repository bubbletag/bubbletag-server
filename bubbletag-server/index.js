const express = require('express');
const webpush = require('web-push');
const cors    = require('cors');
const app     = express();

app.use(cors());
app.use(express.json());

// Web Push VAPID 키 (환경변수로 관리)
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE;
const VAPID_EMAIL   = process.env.VAPID_EMAIL || 'mailto:bubbletag.help@gmail.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

// 구독자 목록 (메모리 — 실제 서비스는 DB 사용)
const subscriptions = new Map();

// ─── 헬스체크 ───
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'BubbleTag Server', version: '1.0.0' });
});

// ─── Web Push 구독 등록 ───
app.post('/subscribe', (req, res) => {
  const { subscription, userId } = req.body;
  if (!subscription || !userId) {
    return res.status(400).json({ error: 'subscription과 userId가 필요해요' });
  }
  subscriptions.set(userId, subscription);
  console.log(`구독 등록: ${userId}`);
  res.json({ success: true });
});

// ─── Gmail Pub/Sub 수신 ───
app.post('/gmail-webhook', async (req, res) => {
  res.sendStatus(200); // 구글에 즉시 응답

  try {
    const message = req.body?.message;
    if (!message) return;

    // Base64 디코딩
    const data = JSON.parse(
      Buffer.from(message.data, 'base64').toString('utf-8')
    );
    const { emailAddress, historyId } = data;
    console.log(`Gmail 알림: ${emailAddress}, historyId: ${historyId}`);

    // 해당 사용자 구독 찾기
    const subscription = subscriptions.get(emailAddress);
    if (!subscription) return;

    // Web Push 발송
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: '📧 새 메일 도착!',
        body:  'Gmail에 새 메일이 왔어요. 클릭해서 확인하세요.',
        url:   'https://mail.google.com',
        type:  'email',
      })
    );
    console.log(`푸시 발송 완료: ${emailAddress}`);
  } catch(e) {
    console.error('Gmail webhook 오류:', e.message);
  }
});

// ─── Gmail Pub/Sub 구독 갱신 (7일마다 필요) ───
app.post('/renew-gmail', async (req, res) => {
  const { accessToken, email } = req.body;
  if (!accessToken || !email) {
    return res.status(400).json({ error: 'accessToken과 email이 필요해요' });
  }

  try {
    const topicName = `projects/${process.env.GOOGLE_PROJECT_ID}/topics/gmail-push`;
    const response  = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/${email}/watch`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicName,
          labelIds: ['INBOX'],
        }),
      }
    );
    const data = await response.json();
    res.json({ success: true, expiration: data.expiration });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── VAPID 공개키 제공 (익스텐션에서 가져감) ───
app.get('/vapid-public-key', (req, res) => {
  res.json({ key: VAPID_PUBLIC });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`BubbleTag 서버 실행 중: http://localhost:${PORT}`);
});

module.exports = app;
