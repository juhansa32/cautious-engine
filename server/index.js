const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

let state = {
  act: 'LOBBY',
  clients: new Set(),
};

wss.on('connection', (ws) => {
  state.clients.add(ws);

  ws.send(JSON.stringify({
    type: 'STATE',
    act: state.act,
  }));

  ws.on('close', () => {
    state.clients.delete(ws);
  });
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  state.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

// 테스트용: 10초마다 ACT 넘어가기
setInterval(() => {
  const order = ['LOBBY', 'ACT1', 'ACT2', 'ACT3', 'ACT4', 'END'];
  const idx = order.indexOf(state.act);
  if (idx < order.length - 1) {
    state.act = order[idx + 1];
    broadcast({ type: 'STATE', act: state.act });
    console.log('ACT ->', state.act);
  }
}, 10000);

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
