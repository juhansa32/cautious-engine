const path = require('path');
const express = require('express');
const { ChzzkBridge } = require('./chzzk-bridge');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// debug=false 권장 (방송 중 콘솔 노이즈 ↓)
const bridge = new ChzzkBridge({ debug:false });

const sseClients = new Set();

function sse(type, payload){
  const data = JSON.stringify({ type, payload, ts: Date.now() });
  for(const res of sseClients){
    try{ res.write(`data: ${data}\n\n`); }catch{}
  }
}

app.get('/events', (req, res)=>{
  res.setHeader('Content-Type','text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control','no-cache, no-transform');
  res.setHeader('Connection','keep-alive');
  res.flushHeaders?.();

  sse('status', {
    connected: bridge.isConnected(),
    channelId: bridge.channelId || null,
    message: bridge.isConnected() ? `연결됨 (${bridge.channelId})` : '미연결'
  });

  sseClients.add(res);
  req.on('close', ()=> sseClients.delete(res));
});

app.post('/api/connect', (req, res)=>{
  const { channel } = req.body || {};
  const ok = bridge.connect(channel, {
    onStatus: (msg)=>{
      sse('status', {
        connected: bridge.isConnected(),
        channelId: bridge.channelId || null,
        message: msg
      });
    },
    onVote: (choice)=>{
      sse('vote', { choice });
    }
  });
  res.json({ ok, connected: bridge.isConnected(), channelId: bridge.channelId || null });
});

app.post('/api/disconnect', (req, res)=>{
  bridge.disconnect();
  sse('status', { connected:false, channelId:null, message:'연결 해제됨' });
  res.json({ ok:true });
});

app.get('/api/status', (req, res)=>{
  res.json({ connected: bridge.isConnected(), channelId: bridge.channelId || null });
});

process.on('SIGINT', ()=>{
  try{ bridge.disconnect(); }catch{}
  process.exit(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server: http://localhost:${PORT}`));
