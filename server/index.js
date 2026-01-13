const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

const ORDER = ['LOBBY', 'ACT1', 'ACT2', 'ACT3', 'ACT4', 'END'];

let state = {
  act: 'LOBBY',
  clients: new Set(),
  votes: new Map(), // ws -> 'A' | 'B' | 'C'
  logs: {
    joins: 0,
    leaves: 0,
    acts: {} // act -> { A: n, B: n, C: n, SILENT: n }
  }
};

function resetVotes() {
  state.votes.clear();
}

function ensureActLog(act) {
  if (!state.logs.acts[act]) {
    state.logs.acts[act] = { A: 0, B: 0, C: 0, SILENT: 0 };
  }
}

function broadcast(data) {
  const msg = JSON.stringify(data);
  state.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

function advanceAct(forced = false) {
  const idx = ORDER.indexOf(state.act);
  if (idx < ORDER.length - 1) {
    // 집계 (침묵 포함)
    ensureActLog(state.act);
    state.clients.forEach(ws => {
      const v = state.votes.get(ws);
      if (v === 'A' || v === 'B' || v === 'C') {
        state.logs.acts[state.act][v]++;
      } else {
        state.logs.acts[state.act]['SILENT']++;
      }
    });

    state.act = ORDER[idx + 1];
    resetVotes();
    broadcast({ type: 'STATE', act: state.act });

    if (forced) {
      console.log('[ADMIN] Forced advance ->', state.act);
    } else {
      console.log('ACT ->', state.act);
    }
  }
}

// WebSocket
wss.on('connection', (ws) => {
  state.clients.add(ws);
  state.logs.joins++;

  ws.send(JSON.stringify({
    type: 'STATE',
    act: state.act
  }));

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      if (data.type === 'VOTE') {
        // 첫 입력만 유효
        if (!state.votes.has(ws)) {
          const c = String(data.choice || '').toUpperCase();
          if (['A', 'B', 'C'].includes(c)) {
            state.votes.set(ws, c);
          }
        }
      } else if (data.type === 'DEBUG_NEXT') {
        advanceAct(true);
      }
    } catch (e) {
      // 무시 (게임은 계속)
    }
  });

  ws.on('close', () => {
    state.clients.delete(ws);
    state.votes.delete(ws);
    state.logs.leaves++;
  });
});

// 자동 타이머 (실방에서도 안전)
const ACT_SECONDS = {
  LOBBY: 15,
  ACT1: 25,
  ACT2: 20,
  ACT3: 15,
  ACT4: 10,
};

let timer = null;
function scheduleTimer() {
  clearTimeout(timer);
  const sec = ACT_SECONDS[state.act];
  if (!sec) return;
  timer = setTimeout(() => advanceAct(false), sec * 1000);
}
scheduleTimer();

// 상태 변경 시 타이머 재설정
const _broadcast = broadcast;
broadcast = (data) => {
  _broadcast(data);
  if (data.type === 'STATE') scheduleTimer();
};

// 관리자 보험: 서버 콘솔에서 Enter = 다음 ACT
process.stdin.on('data', () => {
  advanceAct(true);
});

// 엔딩 데이터 요청
app.get('/logs', (req, res) => {
  res.json({
    act: state.act,
    joins: state.logs.joins,
    leaves: state.logs.leaves,
    acts: state.logs.acts,
    connected: state.clients.size
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
