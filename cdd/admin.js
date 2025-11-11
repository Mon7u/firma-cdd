// Shared utils
const fmt2=(n)=>String(n).padStart(2,'0');
const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${fmt2(d.getMonth()+1)}-${fmt2(d.getDate())}`};
const uuid=()=>{ try { return Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-'); } catch(e){ return 'tok-'+Math.random().toString(36).slice(2)+'-'+Date.now(); } };
const safeStorage=(()=>{ try{ localStorage.setItem('_t','1'); localStorage.removeItem('_t'); return localStorage; }catch(e){ const mem={}; return {getItem:k=>mem[k]??null,setItem:(k,v)=>{mem[k]=String(v)},removeItem:k=>{delete mem[k]}} } })();
const DB_KEY='cdd.meetings.v3';
const db=JSON.parse(safeStorage.getItem(DB_KEY)||'{}');
const save=()=>safeStorage.setItem(DB_KEY, JSON.stringify(db));

// DOM
const createBtn=document.getElementById('create');
const qrBox=document.getElementById('qrBox');
const dlQR=document.getElementById('dlQR');
const openMeet=document.getElementById('openMeet');

// COSTRUZIONE URL **ROBUSTA**
function buildMeetUrl(token){
  // base = cartella dove sta admin.html
  const base = new URL('.', location.href);          // es: http://192.168.1.10/cdd/
  const meet = new URL('meet.html', base);           // es: http://192.168.1.10/cdd/meet.html
  meet.searchParams.set('meet', token);              // ?meet=TOKEN
  return meet.toString();
}

// Crea riunione + QR
createBtn.onclick=()=>{
  const title=document.getElementById('meetTitle').value.trim();
  const when=document.getElementById('meetWhen').value;
  let token=document.getElementById('meetToken').value.trim();
  if(!title||!when){ alert('Compila titolo e data/ora.'); return; }
  if(!token) token=uuid();

  db[token]=db[token]||{meta:{token,title,when,createdAt:new Date().toISOString()}, logs:[]};
  save();

  const meetUrl = buildMeetUrl(token);

  // genera QR con canvas SCALATO (dimensione maggiore)
  qrBox.innerHTML = '';
  const canvas = QRGen(meetUrl, 6); // scale=6 (moduli più grandi)
  qrBox.appendChild(canvas);

  openMeet.href = meetUrl;
  openMeet.textContent = 'Apri pagina firma';

  dlQR.onclick=()=>{
    const a=document.createElement('a');
    a.href=canvas.toDataURL('image/png');
    a.download=`qr_${token}.png`;
    a.click();
  };

  alert('Riunione creata. Distribuisci questo QR ai docenti.');
};

// Crea PDF (stampa)
const makePDF=document.getElementById('makePDF');
const pdfStatus=document.getElementById('pdfStatus');
makePDF.onclick=()=>{
  const token=(document.getElementById('pdfToken').value||'').trim();
  if(!token || !db[token]){ alert('Token non valido o riunione inesistente.'); return; }
  const m=db[token];
  if(!m.logs || m.logs.length===0){ alert('Nessun record presente.'); return; }

  const w=window.open('', '_blank');
  const rows=m.logs.map((r,i)=>`<tr><td>${i+1}</td><td>${r.nome}</td><td>${r.cognome}</td><td>${r.email}</td><td>${r.arrivo||''}</td><td>${r.firma||''}</td><td>${r.sigData?`<img class="sig-img" src="${r.sigData}"/>`:''}</td></tr>`).join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Registro CDD</title>
  <style>body{font-family:Arial,Helvetica,sans-serif;color:#000} h1{margin:0 0 6px} .muted{color:#555;margin:0 0 12px}
  table{width:100%;border-collapse:collapse} th,td{border:1px solid #999;padding:6px;vertical-align:top} img.sig-img{max-height:120px}</style>
  </head><body>
  <h1>Registro CDD – ${m.meta.title||''}</h1>
  <p class="muted">Data/ora: ${new Date(m.meta.when).toLocaleString()} – Token: ${m.meta.token}</p>
  <table><thead><tr><th>#</th><th>Nome</th><th>Cognome</th><th>Email</th><th>Arrivo</th><th>Firma ora</th><th>Firma (immagine)</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <script>window.onload=()=>window.print()</script>
  </body></html>`);
  w.document.close();
  pdfStatus.textContent='PDF generato in una nuova scheda (usa "Salva come PDF").';
};
