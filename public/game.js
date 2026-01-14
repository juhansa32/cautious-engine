import { STORY } from './story.js';

const actTitle = document.getElementById('actTitle');
const storyEl = document.getElementById('story');

const connectPanel = document.getElementById('connectPanel');
const channelInput = document.getElementById('channelInput');
const connectBtn = document.getElementById('connectBtn');
const connectStatus = document.getElementById('connectStatus');

const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const hintEl = document.getElementById('hint');

const ws = new WebSocket(`ws://${location.host}`);

let act = 'CONNECT';
let started = false;
let chzzk = { connected:false, channelId:null, status:'미연결' };

function render(){
  const s = STORY[act] || { title: act, text: [] };
  actTitle.textContent = s.title || act;

  storyEl.innerHTML = '';
  (s.text || []).forEach(line=>{
    const p = document.createElement('p');
    p.textContent = line;
    storyEl.appendChild(p);
  });

  // CONNECT 화면은 act가 CONNECT일 때만
  connectPanel.style.display = (act === 'CONNECT') ? 'block' : 'none';

  // 채팅 잠금
  const canChat = s.allowChat !== false;
  chatInput.disabled = !canChat;
  sendBtn.disabled = !canChat;

  // 힌트 (A/B/C 의미 표시)
  if(s.allowVote && s.voteOptions){
    hintEl.innerHTML =
      `판단 구간<br>`+
      `A: ${s.voteOptions.A}<br>`+
      `B: ${s.voteOptions.B}<br>`+
      `C: ${s.voteOptions.C}<br>`+
      `치지직 채팅으로 <b>!A</b> <b>!B</b> <b>!C</b>`;
  } else if(!started && act === 'CONNECT') {
    hintEl.textContent = '채널을 등록하면 자동으로 시작됩니다.';
  } else if(!canChat){
    hintEl.textContent = '퇴마 의식 중(침묵)';
  } else {
    hintEl.textContent = '';
  }

  // 상태 표시
  connectStatus.textContent = `상태: ${chzzk.status || '미연결'}`;
}

function addChat(name, text, kind='msg'){
  const div = document.createElement('div');
  div.className = kind === 'sys' ? 'sys' : '';
  div.textContent = `[${name}] ${text}`;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

ws.onmessage = (e)=>{
  const d = JSON.parse(e.data);

  if(d.type === 'STATE'){
    act = d.act;
    started = !!d.started;
    chzzk = d.chzzk || chzzk;
    render();
  }

  if(d.type === 'CHZZK_STATE'){
    chzzk = d.chzzk || chzzk;
    render();
  }

  if(d.type === 'CHZZK_STATUS'){
    chzzk.status = d.text;
    render();
  }

  if(d.type === 'CHAT'){
    addChat(d.name, d.text, d.kind);
  }
};

connectBtn.onclick = async ()=>{
  const channel = channelInput.value.trim();
  if(!channel){
    connectStatus.textContent = '상태: 채널 URL/ID를 입력하세요';
    return;
  }
  connectBtn.disabled = true;
  connectStatus.textContent = '상태: 연결 시도 중...';

  try{
    const res = await fetch('/admin/connect', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ channel })
    });
    const json = await res.json();
    chzzk = json.chzzk || chzzk;
  }catch{
    chzzk.status = '연결 요청 실패';
  }finally{
    connectBtn.disabled = false;
    render();
  }
};

sendBtn.onclick = sendChat;
chatInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') sendChat(); });

function sendChat(){
  const t = chatInput.value.trim();
  if(!t) return;
  ws.send(JSON.stringify({ type:'CHAT', text:t }));
  chatInput.value='';
}

render();
// (중략: 기존 코드 그대로 두고)

// ✅ 퇴마 문구 전송 (연출 포함)
async function sendChant(){
  const box = document.getElementById('chantInput');
  if(!box) return;
  const text = box.value.trim();
  if(!text) return;

  try{
    const res = await fetch('/admin/chant', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ token: hostToken, text })
    });
    const json = await res.json();
    if(!json.ok){
      addChat('SYSTEM', `전송 실패: ${json.error}`, 'sys');
    } else {
      box.value = '';

      // ✅ 화면 흔들림 연출
      document.body.classList.add('shake');
      setTimeout(()=>document.body.classList.remove('shake'), 250);
    }
  }catch{
    addChat('SYSTEM', '전송 요청 실패', 'sys');
  }
}
