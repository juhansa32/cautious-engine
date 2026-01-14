const WebSocket = require('ws');

function extractChannelId(input){
  const s = String(input||'').trim();
  const m =
    s.match(/chzzk\.naver\.com\/live\/([a-zA-Z0-9_-]+)/) ||
    s.match(/live\/([a-zA-Z0-9_-]+)/);
  if(m) return m[1];
  if(/^[a-zA-Z0-9_-]{6,}$/.test(s)) return s;
  return null;
}

class ChzzkBridge{
  constructor({ debug=false } = {}){
    this.ws = null;
    this.channelId = null;
    this.debug = debug;
  }

  isConnected(){
    return !!this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  connect(channelInput, { onStatus, onVote }){
    this.disconnect();

    const id = extractChannelId(channelInput);
    if(!id){
      onStatus?.('채널 URL/ID 인식 실패');
      return false;
    }
    this.channelId = id;

    try{
      const ws = new WebSocket(`wss://live.chzzk.naver.com/chat/${id}`);
      this.ws = ws;

      ws.on('open', ()=> onStatus?.(`연결 성공 (${id})`));
      ws.on('close', ()=> onStatus?.('연결 종료'));
      ws.on('error', (e)=> onStatus?.(`오류: ${e.message}`));

      ws.on('message', (buf)=>{
        try{
          const raw = buf.toString();
          if(this.debug) console.log('[CHZZK RAW]', raw);

          const msg = JSON.parse(raw);
          const text =
            String(msg?.content || msg?.message || '').trim();

          // !A / !B / !C 만 인식 (대소문자/공백 허용)
          const m = text.match(/^!\s*([ABCabc])\s*$/);
          if(m){
            onVote?.(m[1].toUpperCase());
          }
        }catch(e){
          if(this.debug) console.log('[CHZZK PARSE FAIL]');
        }
      });

      return true;
    }catch(e){
      onStatus?.('연결 실패');
      return false;
    }
  }

  disconnect(){
    try{ this.ws?.close(); }catch{}
    this.ws = null;
    this.channelId = null;
  }
}

module.exports = { ChzzkBridge, extractChannelId };
