import { STORY, ORDER } from './story.js';

const actTitle = document.getElementById('actTitle');
const storyEl = document.getElementById('story');
const hintEl = document.getElementById('hint');
const hostBox = document.getElementById('hostBox');

const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

const channelInput = document.getElementById('channelInput');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const connectStatus = document.getElementById('connectStatus');

let idx = 0;
let act = ORDER[idx];

// ===== 안정화 플래그 =====
let inVoteStage = false;
let voteLocked = false;          // 한 판단 구간 1회만 반영
let lastVoteAt = 0;
const VOTE_COOLDOWN = 300;       // ms

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
  const r = await fetch(url, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(body||{})
  });
  return r.json();
}

// ===== SSE =====
function startEvents(){
  const es = new EventSource('/events');
  es.onmessage = (ev)=>{
    try{
      const { type, payload } = JSON.parse(ev.data);

      if(type === 'status'){
        setStatus(payload.message || (payload.connected?'연결됨':'미연결'), payload.connected);
        if(payload.connected) addChat('SYSTEM', `치지직 연결: ${payload.channelId}`, 'sys');
      }

      if(type === 'vote'){
        // 판단 구간 아닐 때: 완전 무시(조용)
        if(!inVoteStage || voteLocked) return;

        const now = Date.now();
        if(now - lastVoteAt < VOTE_COOLDOWN) return;
        lastVoteAt = now;

        pick(payload.choice, { from:'chzzk' });
      }
    }catch{}
  };
  es.onerror = ()=> setStatus('이벤트 연결 끊김(서버 확인)', false);
}

// ===== 게임 =====
function render(){
  const s = STORY[act];
  actTitle.textContent = s.title;

  storyEl.innerHTML = '';
  (s.text||[]).forEach(t=>{
    const p = document.createElement('p'); p.textContent=t; storyEl.appendChild(p);
  });

  hintEl.innerHTML = '';
  hostBox.innerHTML = '';

  inVoteStage = !!(s.allowVote && s.voteOptions);
  voteLocked = false;

  if(inVoteStage){
    hintEl.innerHTML = `판단 구간 · 시청자: !A !B !C / 호스트 버튼 가능`;
    const card = document.createElement('div');
    card.className = 'kCard';
    card.innerHTML = `<div class="kTitle">호스트 선택</div>`;
    const row = document.createElement('div'); row.className='btnRow';
    ['A','B','C'].forEach(k=>{
      const b=document.createElement('button');
      b.textContent=`${k} 선택`;
      b.onclick=()=>pick(k,{from:'host'});
      row.appendChild(b);
    });
    card.appendChild(row);
    hostBox.appendChild(card);
  }

  const nav=document.createElement('div');
  nav.className='kCard';
  const row2=document.createElement('div'); row2.className='btnRow';
  const next=document.createElement('button'); next.textContent='다음';
  next.onclick=advance;
  row2.appendChild(next); nav.appendChild(row2); hostBox.appendChild(nav);
}

function advance(){
  if(idx < ORDER.length-1){
    idx++; act = ORDER[idx]; render();
  } else {
    addChat('SYSTEM','게임 종료','sys');
  }
}

function pick(choice, { from }){
  if(voteLocked) return;
  voteLocked = true;

  addChat('SYSTEM', `${from==='chzzk'?'치지직':'호스트'} 선택 확정: ${choice}`, 'sys');
  document.body.classList.add('shake');
  setTimeout(()=>document.body.classList.remove('shake'), 200);
  setTimeout(advance, 350);
}

// ===== 로컬 채팅(테스트) =====
sendBtn.onclick=()=>{
  const t=chatInput.value.trim(); if(!t) return;
  addChat('복쟈기(로컬)', t); chatInput.value='';
};
chatInput.addEventListener('keydown',(e)=>{ if(e.key==='Enter') sendBtn.click(); });

// ===== 연결 버튼 =====
connectBtn.onclick=async()=>{
  const ch=channelInput.value.trim();
  if(!ch){ setStatus('채널 URL/ID 입력', false); return; }
  const r=await apiPost('/api/connect',{ channel:ch });
  if(!r.ok) setStatus('연결 실패(입력 확인)', false);
  else setStatus(`연결 요청됨 (${r.channelId})`, true);
};
disconnectBtn.onclick=async()=>{
  await apiPost('/api/disconnect',{}); setStatus('연결 해제됨', false);
};

// start
render();
startEvents();
addChat('SYSTEM','방송 안정화 버전 시작','sys');
