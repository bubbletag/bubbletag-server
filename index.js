const express = require('express');
const cors    = require('cors');
const app     = express();

app.use(cors());
app.use(express.json());

// 알림 저장소 (메모리)
const notifications = new Map();

// ─── 헬스체크 ───
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'BubbleTag Server', version: '1.0.0' });
});

// ─── Gmail Pub/Sub 수신 ───
app.post('/gmail-webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const message = req.body?.message;
    if (!message) return;
    const data = JSON.parse(Buffer.from(message.data, 'base64').toString('utf-8'));
    const { emailAddress } = data;
    console.log(`Gmail 알림: ${emailAddress}`);
    if (!notifications.has(emailAddress)) notifications.set(emailAddress, []);
    notifications.get(emailAddress).push({
      id:    Date.now(),
      title: '📧 새 메일 도착!',
      body:  'Gmail에 새 메일이 왔어요!',
      type:  'email',
      url:   'https://mail.google.com',
      time:  Date.now(),
    });
  } catch(e) {
    console.error('Gmail webhook 오류:', e.message);
  }
});

// ─── 익스텐션이 30초마다 알림 가져가기 ───
app.get('/notifications/:email', (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const notifs = notifications.get(email) || [];
  notifications.delete(email);
  res.json({ notifications: notifs });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`BubbleTag 서버: http://localhost:${PORT}`));
module.exports = app;
