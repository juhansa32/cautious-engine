const path = require('path');
const express = require('express');
const { ChzzkBridge } = require('./chzzk-bridge');

const app = express();
app.use(express.json());

// ===== 정적 파일 서빙 (public 폴더) =====
app.use(express.static(path.join(__dirname, '..', 'public')));

// ===== 치지직 브릿지 =====
const bridge = new ChzzkBridge();

// SSE(서버 → 브라우저 이벤트 푸시) 클라이언트들
const sseClients = new Set();

function sseBroadcast(type, payload) {
  const data = JSON.stringify({ type, payload, ts: Date.now() });
  for (const res of sseClients) {
    try {
      res.write(`data: ${data}\n\n`);
    } catch {}
  }
}

// ===== SSE 연결 엔드포인트 =====
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // 연결 직후 현재 상태 전송
  sseBroadcast('status', {
    connected: bridge.isConnected(),
    channelId: bridge.channelId || null,
    message: bridge.isConnected()
      ? `연결됨 (${bridge.channelId})`
      : '미연결'
  });

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// ===== 연결 API =====
app.post('/api/connect', (req, res) => {
  const { channel } = req.body || {};
  const ok = bridge.connect(channel, {
    onStatus: (msg) => {
      sseBroadcast('status', {
        connected: bridge.isConnected(),
        channelId: bridge.channelId || null,
        message: msg
      });
    },
    onVote: (choice) => {
      sseBroadcast('vote', { choice }); // { choice: 'A'|'B'|'C' }
    }
  });

  res.json({
    ok,
    connected: bridge.isConnected(),
    channelId: bridge.channelId || null
  });
});

// ===== 연결 해제 API =====
app.post('/api/disconnect', (req, res) => {
  bridge.disconnect();
  sseBroadcast('status', {
    connected: false,
    channelId: null,
    message: '연결 해제됨'
  });
  res.json({ ok: true });
});

// ===== 상태 조회 API =====
app.get('/api/status', (req, res) => {
  res.json({
    connected: bridge.isConnected(),
    channelId: bridge.channelId || null
  });
});

// ===== 서버 종료 시 정리 =====
process.on('SIGINT', () => {
  try { bridge.disconnect(); } catch {}
  process.exit(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
