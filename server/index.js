const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { ChzzkBridge } = require('./chzzk-bridge');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));
app.use(express.json());

const ORDER = ['CONNECT','LOBBY','ACT1','PIN1','ARCHIVE1','ARCHIVE2','PIN2','PIN3','RITUAL','AFTER','END'];
const VOTE_ACTS = new Set(['PIN1','PIN2','PIN3']);
const CHAT_BLOCKED = new Set(['RITUAL']);

let state = {
  act: 'CONNECT',
  started: false,
  clients: new Set(),
  votes: new Map(),
  nameSeq: 1,
  pin: [],
  chzzk: { connected:false, channelId:null, status:'미연결' }
};

function broadcast(obj){
  const msg = JSON.stringify(obj);
  state.clients.forEach(ws=>{
    if(ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

function setAct(act){
  state.act = act;
  broadcast({ type:'STATE', act: state.act, started: state.started, chzzk: state.chzzk });
}

function system(text){
  broadcast({ type:'CHAT', name:'SYSTEM', text, kind:'sys' });
}

function startGame(){
  state.started = true;
  state.pin = [];
  state.votes.clear();
  system('기록 시작');
  setAct('LOBBY');
  // 로비 잠깐 후 ACT1로
  setTimeout(()=>setAct('ACT1'), 1500);
}

function advance(){
  const idx = ORDER.indexOf(state.act);
  if(idx < 0 || idx >= ORDER.length - 1) return;

  // PIN 결과 반영
  if(VOTE_ACTS.has(state.act)){
    const c={A:0,B:0,C:0};
    state.votes.forEach(v=>{ if(c[v]!==undefined) c[v]++; });
    let w='A'; if(c.B>c[w]) w='B'; if(c.C>c[w]) w='C';
    const map={A:'1',B:'2',C:'3'};
    state.pin.push(map[w]);
    system(`잠금 조각 확보 (${state.pin.length}/3)`);
  }

  state.votes.clear();
  setAct(ORDER[idx + 1]);

  // END 도달 시 자동 해제
  if(state.act === 'END'){
    disconnectChzzk(true);
  }
}

const bridge = new ChzzkBridge();

function connectChzzk(channelInput){
  const ok = bridge.connect(channelInput, {
    onStatus: (s)=>{
      state.chzzk.status = s;
      broadcast({ type:'CHZZK_STATUS', text:s });
    },
    onVote: (choice)=>{
      if(!VOTE_ACTS.has(state.act)) return;
      // 치지직 투표는 조용히 집계(각 유저 구분은 어려우니 "1회성 집계"로)
      state.clients.forEach(ws=>{
        if(!state.votes.has(ws)) state.votes.set(ws, choice);
      });
    }
  });

  state.chzzk.connected = ok;
  state.chzzk.channelId = ok ? bridge.channelId : null;
  broadcast({ type:'CHZZK_STATE', chzzk: state.chzzk });

  return ok;
}

function disconnectChzzk(isAuto=false){
  bridge.disconnect();
  state.chzzk.connected = false;
  state.chzzk.channelId = null;
  state.chzzk.status = isAuto ? '게임 종료로 자동 해제됨' : '해제됨';
  broadcast({ type:'CHZZK_STATE', chzzk: state.chzzk });
}

// 운영자만 호출하는 연결 API (브라우저에서 입력 → 서버가 연결)
app.post('/admin/connect', (req,res)=>{
  const { channel } = req.body || {};
  const ok = connectChzzk(channel);
  if(ok && !state.started){
    // 연결 성공하면 자동 시작
    setAct('LOBBY');
    startGame();
  }
  res.json({ ok, chzzk: state.chzzk });
});

// (선택) 운영자 수동 해제
app.post('/admin/disconnect', (req,res)=>{
  disconnectChzzk(false);
  res.json({ ok:true });
});

// WS
wss.on('connection', (ws)=>{
  ws._name = `복쟈기${state.nameSeq++}`;
  state.clients.add(ws);

  ws.send(JSON.stringify({ type:'STATE', act: state.act, started: state.started, chzzk: state.chzzk }));
  system(`${ws._name} 접속`);

  ws.on('message', (buf)=>{
    try{
      const d = JSON.parse(buf.toString());
      if(d.type === 'CHAT'){
        if(CHAT_BLOCKED.has(state.act)) return;
        const t = String(d.text||'').trim();

        const m = t.match(/^!([ABCabc])$/);
        if(m){
          if(!VOTE_ACTS.has(state.act)){
            system('지금은 판단 구간이 아닙니다.');
            return;
          }
          state.votes.set(ws, m[1].toUpperCase());
          system(`${ws._name} 판단 기록됨`);
          return;
        }

        broadcast({ type:'CHAT', name: ws._name, text: t, kind:'msg' });
      }
    }catch{}
  });

  ws.on('close', ()=>{
    state.clients.delete(ws);
    state.votes.delete(ws);
    system(`${ws._name} 종료`);
  });
});

// 콘솔 Enter = 다음 ACT (보험)
process.stdin.on('data', (buf)=>{
  const s = buf.toString().trim();
  if(!s && state.started) advance();
});

server.listen(3000, ()=>console.log('http://localhost:3000'));

