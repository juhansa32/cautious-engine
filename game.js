import { STORY, ORDER } from './story.js';

const actTitle = document.getElementById('actTitle');
const subTitle = document.getElementById('subTitle');
const storyEl = document.getElementById('story');
const hintEl = document.getElementById('hint');
const hostBox = document.getElementById('hostBox');

const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

let idx = 0;
let act = ORDER[idx];

const collected = [];
const collectedSet = new Set();

function addChat(name, text, kind='msg'){
  const div = document.createElement('div');
  div.className = kind === 'sys' ? 'sys' : (kind === 'chant' ? 'chantMsg' : '');
  div.textContent = `[${name}] ${text}`;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function collectHidden(){
  const s = STORY[act];
  if(!s?.hiddenChant) return;
  if(collectedSet.has(s.hiddenChant)) return;
  collectedSet.add(s.hiddenChant);
  collected.push(s.hiddenChant);
  addChat('SYSTEM', '숨겨진 문구를 회수했다.', 'sys');
}

function render(){
  const s = STORY[act];
  actTitle.textContent = s.title;
  if (subTitle) subTitle.textContent = `Pages 데모 · 진행 ${idx+1}/${ORDER.length}`;

  storyEl.innerHTML = '';
  (s.text || []).forEach(line=>{
    const p = document.createElement('p');
    p.textContent = line;
    storyEl.appendChild(p);
  });

  hintEl.innerHTML = '';

  // 호스트 UI
  hostBox.innerHTML = '';

  // 회수 문구 패널
  const chantPanel = document.createElement('div');
  chantPanel.className = 'chantPanel';
  chantPanel.innerHTML = `<div class="kTitle">회수한 퇴마 문구 (${collected.length})</div>
  <div class="small dim">클릭하면 퇴마 입력칸에 복사됩니다.</div>`;

  if(collected.length === 0){
    const it = document.createElement('div');
    it.className = 'chantItem dim';
    it.textContent = '아직 회수한 문구가 없다.';
    chantPanel.appendChild(it);
  } else {
    collected.slice(-8).forEach(t=>{
      const it = document.createElement('div');
      it.className = 'chantItem';
      it.textContent = t;
      it.onclick = ()=>{
        const box = document.getElementById('chantInput');
        if(box) box.value = t;
      };
      chantPanel.appendChild(it);
    });
  }
  hostBox.appendChild(chantPanel);

  // PIN 구간 버튼
  if(s.allowVote && s.voteOptions){
    hintEl.innerHTML =
      `판단 구간(호스트 전용)<br>`+
      `A: ${s.voteOptions.A}<br>`+
      `B: ${s.voteOptions.B}<br>`+
      `C: ${s.voteOptions.C}`;

    const card = document.createElement('div');
    card.className = 'kCard';
    card.innerHTML = `<div class="kTitle">호스트 선택</div>
      <div class="kDesc">선택은 휴복님만 가능합니다. (조수 채팅 영향 없음)</div>`;

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

  // RITUAL 입력창
  if(act === 'RITUAL'){
    const card = document.createElement('div');
    card.className = 'kCard';
    card.innerHTML = `<div class="kTitle">퇴마 문구 전송(데모)</div>
    <div class="kDesc">권장: 1/3 → 2/3 → 3/3 → (선택) 강화형</div>`;

    const row = document.createElement('div');
    row.className = 'btnRow';

    const input = document.createElement('input');
    input.id = 'chantInput';
    input.placeholder = '회수 문구 클릭 or 직접 입력';
    input.style.flex = '1';

    const btn = document.createElement('button');
    btn.textContent = '전송';
    btn.onclick = ()=>sendChant();

    row.appendChild(input);
    row.appendChild(btn);
    card.appendChild(row);
    hostBox.appendChild(card);
  }

  // 다음 버튼
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

  // 채팅
  chatInput.disabled = false;
  sendBtn.disabled = false;

  collectHidden();
}

function advance(){
  if(idx < ORDER.length - 1){
    idx++;
    act = ORDER[idx];
    render();
  } else {
    addChat('SYSTEM', '데모 종료', 'sys');
  }
}

function pick(choice){
  addChat('SYSTEM', `호스트 판단 확정: ${choice}`, 'sys');
  document.body.classList.add('shake');
  setTimeout(()=>document.body.classList.remove('shake'), 250);
  setTimeout(advance, 350);
}

function sendChant(){
  const box = document.getElementById('chantInput');
  if(!box) return;
  const text = box.value.trim();
  if(!text) return;

  addChat('휴복(단장)', text, 'chant');
  addChat('SYSTEM', '봉인 안정화 중…', 'sys');

  document.body.classList.add('shake');
  setTimeout(()=>document.body.classList.remove('shake'), 250);
  box.value = '';
}

sendBtn.onclick = ()=>{
  const t = chatInput.value.trim();
  if(!t) return;
  addChat('복쟈기', t, 'msg');
  chatInput.value = '';
};
chatInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') sendBtn.click(); });

render();
addChat('SYSTEM', 'GitHub Pages 데모 시작', 'sys');
