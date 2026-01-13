const ws = new WebSocket(`ws://${location.host}`);

const actEl = document.getElementById('act');
const buttonsEl = document.getElementById('buttons');

ws.onmessage = (e) => {
  const data = JSON.parse(e.data);

  if (data.type === 'STATE') {
    renderAct(data.act);
  }
};

function renderAct(act) {
  actEl.textContent = act;
  buttonsEl.innerHTML = '';

  if (act.startsWith('ACT')) {
    ['A', 'B', 'C'].forEach(letter => {
      const btn = document.createElement('button');
      btn.textContent = letter;
      btn.onclick = () => {
        btn.disabled = true;
        btn.textContent = '기록됨';
      };
      buttonsEl.appendChild(btn);
    });
  }

  if (act === 'END') {
    buttonsEl.textContent = '기록을 정리 중입니다…';
  }
}
