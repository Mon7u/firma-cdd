// Utilities
const $=(q)=>document.querySelector(q);
const fmt2=(n)=>String(n).padStart(2,'0');
const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${fmt2(d.getMonth()+1)}-${fmt2(d.getDate())}`};
const nowTime=()=>{const d=new Date();return `${fmt2(d.getHours())}:${fmt2(d.getMinutes())}:${fmt2(d.getSeconds())}`};
const safeStorage=(()=>{ try{ localStorage.setItem('_t','1'); localStorage.removeItem('_t'); return localStorage; }catch(e){ const mem={}; return {getItem:k=>mem[k]??null,setItem:(k,v)=>{mem[k]=String(v)},removeItem:k=>{delete mem[k]}} } })();
const DB_KEY='cdd.meetings.v3';
const qs=(k)=>new URL(location.href).searchParams.get(k)||'';
const token=(qs('meet')||'').trim();
if(!token){ alert('Token mancante. Apri questa pagina tramite QR.'); }
const db=JSON.parse(safeStorage.getItem(DB_KEY)||'{}');

// load meta if present
const meetInfo=document.getElementById('meetInfo');
if(db[token]&&db[token].meta){ const m=db[token].meta; meetInfo.textContent=`${m.title||'Riunione'} — ${new Date(m.when).toLocaleString()} — token ${m.token}`; }

const emailOK=(e)=>/@ittsrimini\.edu\.it$/i.test(e) && /^[a-zàèéìòù]+\.[a-zàèéìòù]+@ittsrimini\.edu\.it$/i.test(e);

// signature pad
const pad=$('#pad'); const ctx=pad.getContext('2d');
let drawing=false, hasInk=false;
const px=(ev)=>{ const r=pad.getBoundingClientRect(); const x=(ev.touches?ev.touches[0].clientX:ev.clientX)-r.left; const y=(ev.touches?ev.touches[0].clientY:ev.clientY)-r.top; const sx=pad.width/r.width, sy=pad.height/r.height; return {x:x*sx,y:y*sy}; };
const start=(e)=>{ drawing=true; hasInk=true; const p=px(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); e.preventDefault(); };
const move=(e)=>{ if(!drawing) return; const p=px(e); ctx.lineWidth=2; ctx.lineCap='round'; ctx.strokeStyle='#fff'; ctx.lineTo(p.x,p.y); ctx.stroke(); e.preventDefault(); };
const end=()=>{ drawing=false; };
pad.onmousedown=start; pad.onmousemove=move; window.onmouseup=end;
pad.ontouchstart=start; pad.ontouchmove=move; pad.ontouchend=end;

document.getElementById('clear').onclick=()=>{ ctx.clearRect(0,0,pad.width,pad.height); hasInk=false; };

document.getElementById('submit').onclick=()=>{
  const nome=$('#nome').value.trim();
  const cognome=$('#cognome').value.trim();
  const email=$('#email').value.trim().toLowerCase();
  const status=$('#status');
  if(!nome||!cognome||!email){ status.textContent='Compila tutti i campi'; return; }
  if(!emailOK(email)){ status.textContent='Email non valida (nome.cognome@ittsrimini.edu.it)'; return; }
  if(!hasInk){ status.textContent='Inserisci la firma'; return; }
  const sigData=pad.toDataURL('image/png');
  const key=todayKey(); const arrivo=nowTime(); const firma=arrivo;
  db[token]=db[token]||{meta:{token}, logs:[]};
  db[token].logs.push({data:key,nome,cognome,email,arrivo,firma,sigData});
  safeStorage.setItem(DB_KEY, JSON.stringify(db));
  status.textContent='Registrato! Grazie.';
  // reset opzionale
  // setTimeout(()=>{ location.reload(); }, 1200);
};
