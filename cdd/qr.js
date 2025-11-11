// Minimal QR generator -> returns <canvas> with QR
// PATCH: aggiunto parametro scale per disegnare moduli più grandi (default 6)
(function(){
  function QRByte(data){ this.mode=4; this.data=data; this.parsedData=[];
    for(let i=0;i<data.length;i++){
      const c=data.charCodeAt(i);
      if(c>65535){ this.parsedData.push(240|(c&1835008)>>18,128|(c&258048)>>12,128|(c&4032)>>6,128|(c&63)); }
      else if(c>2047){ this.parsedData.push(224|(c&61440)>>12,128|(c&4032)>>6,128|(c&63)); }
      else if(c>127){ this.parsedData.push(192|(c&1984)>>6,128|(c&63)); }
      else { this.parsedData.push(c); }
    }
    this.getLength=()=>this.parsedData.length;
    this.write=(bb)=>{ for(let i=0;i<this.parsedData.length;i++) bb.put(this.parsedData[i],8); };
  }
  function BitBuffer(){ this.buffer=[]; this.length=0;
    this.put=(num,len)=>{ for(let i=0;i<len;i++) this.putBit(((num>>(len-i-1))&1)===1) };
    this.putBit=(bit)=>{ const n=Math.floor(this.length/8); if(this.buffer.length<=n) this.buffer.push(0);
      if(bit) this.buffer[n]|=128>>(this.length%8); this.length++; };
  }
  const PAT=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50]];
  const RS=()=>[{totalCount:26,dataCount:19}];
  const createBytes=(typeNumber,ec,rs,bb)=>{
    const t=bb.buffer.slice(0), out=[];
    for(let i=0;i<rs.length;i++){
      const u=rs[i]; const data=new Array(u.dataCount);
      for(let d=0; d<u.dataCount; d++) data[d]=t[d]&255;
      out.push(...data); t.splice(0,u.dataCount);
    }
    return out;
  };
  function QRCode(n,ecl){
    this.typeNumber=n; this.ecLevel=ecl; this.modules=null; this.moduleCount=0; this.dataList=[];
    this.addData=(d)=>{ this.dataList.push(new QRByte(d)); };
    this.isDark=(r,c)=>this.modules[r][c];
    this.getModuleCount=()=>this.moduleCount;
    this.make=()=>{
      this.moduleCount=4*this.typeNumber+17;
      this.modules=Array.from({length:this.moduleCount},()=>Array(this.moduleCount).fill(null));
      const pos=PAT[this.typeNumber-1];
      const pp=(row,col)=>{
        for(let r=-1;r<=7;r++){
          if(row+r<=-1||this.moduleCount<=row+r) continue;
          for(let c=-1;c<=7;c++){
            if(col+c<=-1||this.moduleCount<=col+c) continue;
            this.modules[row+r][col+c]=(r>=0&&r<=6&&(c===0||c===6))||(c>=0&&c<=6&&(r===0||r===6))||(r>=2&&r<=4&&c>=2&&c<=4);
          }
        }
      };
      pp(0,0); pp(this.moduleCount-7,0); pp(0,this.moduleCount-7);
      for(let i=8;i<this.moduleCount-8;i++){
        if(this.modules[i][6]==null) this.modules[i][6]=(i%2===0);
        if(this.modules[6][i]==null) this.modules[6][i]=(i%2===0);
      }
      if(pos){
        for(const i of pos){ for(const j of pos){
          if(this.modules[i][j]==null){
            for(let r=-2;r<=2;r++){
              for(let c=-2;c<=2;c++){
                this.modules[i+r][j+c]=(r===-2||r===2||c===-2||c===2||(r===0&&c===0));
              }
            }
          }
        } }
      }
      const bb=new BitBuffer();
      for(const d of this.dataList){ bb.put(4,4); bb.put(d.getLength(),8); d.write(bb);}
      const bytes=createBytes(this.typeNumber,this.ecLevel,RS(),bb);
      let inc=true;
      for(let col=this.moduleCount-1; col>0; col-=2){
        if(col===6) col--;
        for(let row=0; row<this.moduleCount; row++){
          const rr=inc ? this.moduleCount-1-row : row;
          for(let c=0;c<2;c++){
            if(this.modules[rr][col-c]==null){
              const idx=((rr+col)%8);
              const bIndex=Math.floor((rr*this.moduleCount+(col-c))/8);
              const dark=(bIndex<bytes.length) ? (((bytes[bIndex]>>>idx)&1)===1) : false;
              this.modules[rr][col-c]=dark;
            }
          }
        }
        inc=!inc;
      }
    };
  }

  // QRGen(text, scale=6): genera canvas con moduli "grossi"
  window.QRGen=function(text, scale=6){
    const q=new QRCode(4,1); q.addData(text); q.make();
    const n=q.getModuleCount();
    const size = n * scale;
    const cv=document.createElement('canvas');
    cv.width=size; cv.height=size;
    const ctx=cv.getContext('2d');
    ctx.fillStyle='#fff';
    ctx.fillRect(0,0,size,size);
    ctx.fillStyle='#000';
    for(let r=0;r<n;r++){
      for(let c=0;c<n;c++){
        if(q.isDark(c,r)){ ctx.fillRect(r*scale, c*scale, scale, scale); }
      }
    }
    return cv;
  };
})();
