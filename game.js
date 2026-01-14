import { STORY, ORDER } from './story.js';

const actTitle = document.getElementById('actTitle');
const storyEl = document.getElementById('story');
const hintEl = document.getElementById('hint');
const hostBox = document.getElementById('hostBox');

const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

// connect UI
const channelInput = document.getElementById('channelInput');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const connectStatus = document.getElementById('connectStatus');

let idx = 0;
let act = ORDER[idx];

let inVoteStage = false; // 판단 구간인지
let lastVoteTs = 0;      // 도배 방지용(선택적)

function addChat(name, text, kind='msg'){
  const div = document.createElement('div');
  div.className = kind === 'sys' ? 'sys' : (kind === 'chant' ? 'chantMsg' : '');
  div.textContent = `[${name}] ${text}`;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function setStatus(msg, connected){
  connectStatus.textContent = `상태: ${msg}`;
  disconnectBtn.disabled = !connected;
}

async function apiPost(url, body){
  const res = await fetch(url, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(body || {})
  });
  return res.json();
}

// ===== SSE 이벤트 수신 (status / vote) =====
function startEventStream(){
  const es = new EventSource('/events');
  es.onmessage = (ev) => {
    try{
      const { type, payload } = JSON.parse(ev.data);

      if(type === 'status'){
        setStatus(payload.message || (payload.connected ? '연결됨' : '미연결'), payload.connected);
        if(payload.connected){
          addChat('SYSTEM', `치지직 연결: ${payload.channelId}`, 'sys');
        }
      }

      if(type === 'vote'){
        // 판단 구간이 아닐 때는 무시
        if(!inVoteStage){
          addChat('SYSTEM', `치지직 투표 수신(!${payload.choice}) - 현재는 판단 구간이 아님`, 'sys');
          return;
        }

        // 도배 방지(선택): 너무 빠르게 여러 번 오면 0.2초 간격으로만 처리
        const now = Date.now();
        if(now - lastVoteTs < 200) return;
        lastVoteTs = now;

        addChat('SYSTEM', `치지직 투표: !${payload.choice}`, 'sys');
        // 게임에 반영: 호스트 선택과 동일하게 처리
        pick(payload.choice);
      }
    }catch{}
  };

  es.onerror = () => {
    // SSE 끊겼을 때 안내 (서버 꺼졌을 가능성)
    setStatus('이벤트 연결 끊김(서버 확인 필요)', false);
  };
}

// ===== 게임 렌더 =====
function render(){
  const s = STORY[act];
  actTitle.textContent = s.title;

  storyEl.innerHTML = '';
  (s.text || []).forEach(line=>{
    const p = document.createElement('p');
    p.textContent = line;
    storyEl.appendChild(p);
  });

  hintEl.innerHTML = '';
  hostBox.innerHTML = '';

  inVoteStage = !!(s.allowVote && s.voteOptions);

  if(inVoteStage){
    hintEl.innerHTML =
      `판단 구간<br>`+
      `치지직 채팅: !A / !B / !C (시청자)<br>`+
      `호스트도 버튼으로 선택 가능`;

    const card = document.createElement('div');
    card.className = 'kCard';
    card.innerHTML = `<div class="kTitle">호스트 선택</div>
      <div class="kDesc">시청자: 치지직 채팅으로 !A !B !C / 호스트: 아래 버튼</div>`;

    const row = document.createElement('div');
    row.className = 'btnRow';
    ['A','B','C'].forEach(k=>{
      const b = document.createElement('button');
      b.textContent = `${k} 선택`;
      b.onclick = ()=>pick(k);
      row.appendChild(b);
    });
    card.appendChild(row);
    hostBox.appendChild(card);
  }

  // 다음 진행 버튼(호스트)
  const nav = document.createElement('div');
  nav.className = 'kCard';
  nav.innerHTML = `<div class="kTitle">진행</div><div class="kDesc">다음 스테이지로 진행합니다.</div>`;
  const row2 = document.createElement('div');
  row2.className = 'btnRow';
  const next = document.createElement('button');
  next.textContent = '다음';
  next.onclick = ()=>advance();
  row2.appendChild(next);
  nav.appendChild(row2);
  hostBox.appendChild(nav);
}

function advance(){
  if(idx < ORDER.length - 1){
    idx++;
    act = ORDER[idx];
    render();
  } else {
    addChat('SYSTEM', '게임 종료', 'sys');
  }
}

function pick(choice){
  // 여기서 choice는 A/B/C
  addChat('SYSTEM', `선택 확정: ${choice}`, 'sys');

  // 연출(흔들림)
  document.body.classList.add('shake');
  setTimeout(()=>document.body.classList.remove('shake'), 250);

  // 방송 템포용: 선택 후 자동 다음
  setTimeout(advance, 400);
}

// ===== 로컬 채팅(테스트용) =====
sendBtn.onclick = ()=>{
  const t = chatInput.value.trim();
  if(!t) return;
  addChat('복쟈기(로컬)', t, 'msg');
  chatInput.value = '';
};
chatInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') sendBtn.click(); });

// ===== 연결 버튼 =====
connectBtn.onclick = async ()=>{
  const channel = channelInput.value.trim();
  if(!channel){
    setStatus('채널 URL/ID를 입력하세요', false);
    return;
  }
  const r = await apiPost('/api/connect', { channel });
  if(!r.ok){
    setStatus('연결 실패(입력 확인)', false);
  } else {
    setStatus(`연결 요청됨 (${r.channelId})`, true);
  }
};

disconnectBtn.onclick = async ()=>{
  await apiPost('/api/disconnect', {});
  setStatus('연결 해제됨', false);
};

// 시작
render();
startEventStream();
addChat('SYSTEM', '방송용 로컬 버전 시작', 'sys');
