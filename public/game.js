import { STORY, ORDER } from './story.js';

const actTitle = document.getElementById('actTitle');
const storyEl = document.getElementById('story');
const hintEl = document.getElementById('hint');
const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const hostBox = document.getElementById('hostBox');

let idx = 0;
let collected = [];

function log(name, text, cls='') {
  const div = document.createElement('div');
  if (cls) div.className = cls;
  div.textContent = `[${name}] ${text}`;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function render() {
  const key = ORDER[idx];
  const s = STORY[key];

  actTitle.textContent = s.title;
  storyEl.innerHTML = '';
  s.text.forEach(t=>{
    const p = document.createElement('p');
    p.textContent = t;
    storyEl.appendChild(p);
  });

  hintEl.textContent = '';

  if (s.choices) {
    hintEl.textContent = '호스트 선택';
    hostBox.innerHTML = '';
    s.choices.forEach(c=>{
      const b = document.createElement('button');
      b.textContent = c;
      b.onclick = ()=>{
        log('SYSTEM', `선택: ${c}`, 'sys');
        next();
      };
      hostBox.appendChild(b);
    });
  } else {
    hostBox.innerHTML = '';
    const b = document.createElement('button');
    b.textContent = '다음';
    b.onclick = next;
    hostBox.appendChild(b);
  }

  if (s.chant && !collected.includes(s.chant)) {
    collected.push(s.chant);
    log('SYSTEM', '퇴마 문구를 회수했다.', 'sys');
  }

  if (key === 'RITUAL') {
    collected.forEach(t=>{
      log('휴복(단장)', t, 'chant');
    });
  }
}

function next() {
  if (idx < ORDER.length - 1) {
    idx++;
    render();
  }
}

sendBtn.onclick = ()=>{
  if (!chatInput.value.trim()) return;
  log('복쟈기', chatInput.value);
  chatInput.value = '';
};

render();
log('SYSTEM', '체험판 시작', 'sys');
