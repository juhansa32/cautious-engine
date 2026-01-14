import { STORY, ORDER } from './story.js';

const actTitle = document.getElementById('actTitle');
const storyEl = document.getElementById('story');
const hintEl = document.getElementById('hint');
const hostBox = document.getElementById('hostBox');

let idx = 0;
let act = ORDER[idx];

// ===== 비밀번호 퍼즐 상태 =====
const PASSWORD_ANSWER = [3, 1, 7, 9];
let passwordInput = [0, 0, 0, 0];
let cursor = 0;

// ===== 공통 =====
function render(){
  const s = STORY[act];
  actTitle.textContent = s.title;
  storyEl.innerHTML = '';
  hintEl.innerHTML = '';
  hostBox.innerHTML = '';

  (s.text || []).forEach(t => {
    const p = document.createElement('p');
    p.textContent = t;
    storyEl.appendChild(p);
  });

  if (s.puzzle === 'PASSWORD') {
    renderPasswordPuzzle();
    return;
  }

  if (s.allowVote) {
    hintEl.textContent = '시청자 판단 구간 (!A !B !C)';
    const card = document.createElement('div');
    card.className = 'kCard';
    const row = document.createElement('div');
    row.className = 'btnRow';

    ['A','B','C'].forEach(k=>{
      const b = document.createElement('button');
      b.textContent = `${k} 선택`;
      b.onclick = next;
      row.appendChild(b);
    });

    card.appendChild(row);
    hostBox.appendChild(card);
    return;
  }

  const nav = document.createElement('div');
  nav.className = 'kCard';
  const btn = document.createElement('button');
  btn.textContent = '다음';
  btn.onclick = next;
  nav.appendChild(btn);
  hostBox.appendChild(nav);
}

function next(){
  idx++;
  act = ORDER[idx];
  render();
}

// ===== 비밀번호 퍼즐 =====
function renderPasswordPuzzle(){
  // 초기화
  passwordInput = [0, 0, 0, 0];
  cursor = 0;

  const wrap = document.createElement('div');
  wrap.style.textAlign = 'center';
  wrap.style.marginTop = '12px';

  const display = document.createElement('div');
  display.style.display = 'flex';
  display.style.justifyContent = 'center';
  display.style.gap = '10px';
  display.style.marginBottom = '14px';

  function redraw(){
    display.innerHTML = '';
    passwordInput.forEach((n, i) => {
      const d = document.createElement('div');
      d.textContent = n;
      d.style.width = '50px';
      d.style.height = '60px';
      d.style.display = 'flex';
      d.style.alignItems = 'center';
      d.style.justifyContent = 'center';
      d.style.fontSize = '28px';
      d.style.border = '2px solid ' + (i === cursor ? '#19d38c' : '#333');
      d.style.borderRadius = '10px';
      display.appendChild(d);
    });
  }

  redraw();

  const controls = document.createElement('div');
  controls.className = 'btnRow';
  controls.style.justifyContent = 'center';

  const btnUp = mkBtn('▲', () => {
    passwordInput[cursor] = (passwordInput[cursor] + 1) % 10;
    redraw();
  });

  const btnDown = mkBtn('▼', () => {
    passwordInput[cursor] = (passwordInput[cursor] + 9) % 10;
    redraw();
  });

  const btnLeft = mkBtn('◀', () => {
    cursor = (cursor + 3) % 4;
    redraw();
  });

  const btnRight = mkBtn('▶', () => {
    cursor = (cursor + 1) % 4;
    redraw();
  });

  const btnOk = mkBtn('확인', checkPassword);

  controls.append(btnUp, btnDown, btnLeft, btnRight, btnOk);

  wrap.append(display, controls);
  hostBox.appendChild(wrap);
}

function mkBtn(label, onClick){
  const b = document.createElement('button');
  b.textContent = label;
  b.onclick = onClick;
  return b;
}

function checkPassword(){
  const ok = PASSWORD_ANSWER.every((v, i) => v === passwordInput[i]);

  document.body.classList.add('shake');
  setTimeout(()=>document.body.classList.remove('shake'), 200);

  if (ok) {
    hintEl.textContent = '봉인이 해제된다…';
    setTimeout(next, 600);
  } else {
    hintEl.textContent = '잘못된 비밀번호다.';
  }
}

// 시작
render();
