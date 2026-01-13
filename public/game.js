const ws = new WebSocket(`ws://${location.host}`);

const actEl = document.getElementById('act');
const buttonsEl = document.getElementById('buttons');

const url = new URL(location.href);
const DEBUG = url.searchParams.get('mode') === 'debug';

let currentAct = 'LOBBY';
let voted = false;

ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type === 'STATE') {
    currentAct = data.act;
    voted = false;
    render();
  }
};

function render() {
  actEl.textContent = currentAct;
  buttonsEl.innerHTML = '';

  if (currentAct.startsWith('ACT')) {
    ['A', 'B', 'C'].forEach(letter => {
      const btn = document.createElement('button');
      btn.textContent = letter;
      btn.disabled = voted;
      btn.onclick = () => vote(letter, btn);
      buttonsEl.appendChild(btn);
    });
  }

  if (currentAct === 'END') {
    const p = document.createElement('p');
    p.textContent = '기록을 정리 중입니다…';
    buttonsEl.appendChild(p);

    fetch('/logs')
      .then(r => r.json())
      .then(showLogs)
      .catch(() => {});
  }

  if (DEBUG) {
    const dbg = document.createElement('button');
    dbg.textContent = 'DEBUG: 다음 ACT';
    dbg.onclick = () => {
      ws.send(JSON.stringify({ type: 'DEBUG_NEXT' }));
    };
    buttonsEl.appendChild(dbg);
  }
}

function vote(letter, btn) {
  if (voted) return;
  ws.send(JSON.stringify({ type: 'VOTE', choice: letter }));
  voted = true;
  btn.textContent = '기록됨';
  Array.from(buttonsEl.children).forEach(b => b.disabled = true);
}

function showLogs(logs) {
  const box = document.createElement('pre');
  box.style.textAlign = 'left';
  box.style.maxWidth = '600px';
  box.style.margin = '20px auto';
  box.textContent =
`사건 기록

접속 인원(누적): ${logs.joins}
현재 접속: ${logs.connected}
중도 이탈: ${logs.leaves}

ACT별 판단:
${Object.entries(logs.acts).map(([act, v]) =>
  `${act} -> A:${v.A} B:${v.B} C:${v.C} 침묵:${v.SILENT}`
).join('\n')}
`;
  buttonsEl.appendChild(box);
}
