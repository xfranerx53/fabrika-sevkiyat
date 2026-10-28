/* ===================== BİÇİMLİ EXCEL (.xlsx) YAZICI (v110) =====================
   Kütüphane/internet gerektirmez. Başlık, renkli tablo başlığı, kenarlık, sayı/₺ biçimi,
   sütun genişliği, dondurulmuş başlık satırı, filtre ve yazdırma ayarı olan gerçek .xlsx üretir.
   Kullanım:
     var s=xlsxYaz.sayfa("Özet",[30,16,40],"BAŞLIK","alt başlık");
     s.bolum("GENEL ÖZET"); s.baslikSatir(["A","B","C"]); s.satir([{v:"x",s:"txt"},{v:5,s:"int"}]);
     xlsxYaz.indir("dosya-adi",[s]);
   Hücre: düz değer (yazı/sayı) ya da {v:değer, s:"stil"}. Stiller: txt int num tl pct (+ "Z" = şeritli satır),
   tot totInt totNum totTl, kl kvInt kvNum kvTl kvTxt, note, warn, sect, hdr, hdrL, title, sub. */
(function(){
  var enc=new TextEncoder();
  /* ---------- ZIP (sıkıştırmasız) ---------- */
  var CT=(function(){var t=[],c,n,k;for(n=0;n<256;n++){c=n;for(k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
  function crc32(b){var c=0xFFFFFFFF;for(var i=0;i<b.length;i++)c=CT[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
  function zip(files){
    var d=new Date(),dt=((d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1))&0xFFFF,
        dd=(((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate())&0xFFFF;
    var loc=[],cen=[],off=0,toplam=0;
    files.forEach(function(f){
      var ad=enc.encode(f.ad),v=f.veri,crc=crc32(v);
      var h=new DataView(new ArrayBuffer(30));
      h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);
      h.setUint16(10,dt,true);h.setUint16(12,dd,true);h.setUint32(14,crc,true);h.setUint32(18,v.length,true);h.setUint32(22,v.length,true);
      h.setUint16(26,ad.length,true);h.setUint16(28,0,true);
      loc.push(new Uint8Array(h.buffer),ad,v);
      var c=new DataView(new ArrayBuffer(46));
      c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);
      c.setUint16(12,dt,true);c.setUint16(14,dd,true);c.setUint32(16,crc,true);c.setUint32(20,v.length,true);c.setUint32(24,v.length,true);
      c.setUint16(28,ad.length,true);c.setUint16(30,0,true);c.setUint16(32,0,true);c.setUint16(34,0,true);c.setUint16(36,0,true);c.setUint32(38,0,true);c.setUint32(42,off,true);
      cen.push(new Uint8Array(c.buffer),ad);
      off+=30+ad.length+v.length;toplam++});
    var cs=0;cen.forEach(function(x){cs+=x.length});
    var e=new DataView(new ArrayBuffer(22));
    e.setUint32(0,0x06054b50,true);e.setUint16(8,toplam,true);e.setUint16(10,toplam,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
    var parts=loc.concat(cen,[new Uint8Array(e.buffer)]),len=0;parts.forEach(function(p){len+=p.length});
    var out=new Uint8Array(len),p=0;parts.forEach(function(x){out.set(x,p);p+=x.length});return out}

  /* ---------- Yardımcılar ---------- */
  var xe=function(s){return String(s==null?"":s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")};
  var kol=function(i){var s="";i++;while(i>0){var m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s};
  var sayfaAdi=function(a,i){a=String(a||"Sayfa"+(i+1)).replace(/[\[\]:*?\/\\]/g," ").trim().slice(0,31);return a||"Sayfa"+(i+1)};

  /* ---------- Stil kayıt defteri ---------- */
  var C={lac:"FF1E3A5F",mavi:"FF2563EB",acik:"FFDBEAFE",gri:"FFF1F5F9",seri:"FFF8FAFC",kenar:"FFCBD5E1",metin:"FF0F172A",soluk:"FF64748B",sari:"FFFFF7D6",kehr:"FF854D0E"};
  var FONT={
    n:'<font><sz val="11"/><color rgb="'+C.metin+'"/><name val="Calibri"/><family val="2"/></font>',
    b:'<font><b/><sz val="11"/><color rgb="'+C.metin+'"/><name val="Calibri"/><family val="2"/></font>',
    w:'<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>',
    t:'<font><b/><sz val="16"/><color rgb="'+C.lac+'"/><name val="Calibri"/><family val="2"/></font>',
    s:'<font><i/><sz val="10"/><color rgb="'+C.soluk+'"/><name val="Calibri"/><family val="2"/></font>',
    m:'<font><b/><sz val="12"/><color rgb="'+C.lac+'"/><name val="Calibri"/><family val="2"/></font>',
    k:'<font><b/><sz val="13"/><color rgb="'+C.lac+'"/><name val="Calibri"/><family val="2"/></font>',
    u:'<font><sz val="10"/><color rgb="'+C.kehr+'"/><name val="Calibri"/><family val="2"/></font>'};
  var FILL={lac:C.lac,acik:C.acik,gri:C.gri,seri:C.seri,sari:C.sari};
  var ince=function(r){return'<'+r+' style="thin"><color rgb="'+C.kenar+'"/></'+r+'>'};
  var BORD={
    kutu:'<border>'+ince("left")+ince("right")+ince("top")+ince("bottom")+'<diagonal/></border>',
    tot:'<border>'+ince("left")+ince("right")+'<top style="medium"><color rgb="'+C.lac+'"/></top>'+ince("bottom")+'<diagonal/></border>',
    alt:'<border><left/><right/><top/><bottom style="medium"><color rgb="'+C.mavi+'"/></bottom><diagonal/></border>'};
  var NF={int:3,num:4,tl:'#,##0.00\\ "₺"',pct:'0.0"%"'};
  /* ad → {f:yazı tipi, fill, b:kenarlık, nf, h:hizalama, w:kaydır} ; z:true → şeritli satır varyantı olabilir */
  var SP={
    title:{f:"t",h:"left"},sub:{f:"s",h:"left"},sect:{f:"m",fill:"acik",b:"alt",h:"left"},
    hdr:{f:"w",fill:"lac",b:"kutu",h:"center",w:1},hdrL:{f:"w",fill:"lac",b:"kutu",h:"left",w:1},
    txt:{f:"n",b:"kutu",h:"left",z:1},txtW:{f:"n",b:"kutu",h:"left",w:1,z:1},
    int:{f:"n",b:"kutu",nf:"int",h:"right",z:1},num:{f:"n",b:"kutu",nf:"num",h:"right",z:1},
    tl:{f:"n",b:"kutu",nf:"tl",h:"right",z:1},pct:{f:"n",b:"kutu",nf:"pct",h:"right",z:1},
    tot:{f:"b",fill:"gri",b:"tot",h:"left"},totInt:{f:"b",fill:"gri",b:"tot",nf:"int",h:"right"},
    totNum:{f:"b",fill:"gri",b:"tot",nf:"num",h:"right"},totTl:{f:"b",fill:"gri",b:"tot",nf:"tl",h:"right"},totPct:{f:"b",fill:"gri",b:"tot",nf:"pct",h:"right"},
    kl:{f:"b",fill:"seri",b:"kutu",h:"left"},kvInt:{f:"k",b:"kutu",nf:"int",h:"right"},kvNum:{f:"k",b:"kutu",nf:"num",h:"right"},
    kvTl:{f:"k",b:"kutu",nf:"tl",h:"right"},kvTxt:{f:"k",b:"kutu",h:"right"},ac:{f:"n",b:"kutu",h:"left",w:1},
    note:{f:"s",h:"left",w:1},warn:{f:"u",fill:"sari",h:"left",w:1}};
  function Defter(){
    var self=this;self.fonts=[];self.fills=['<fill><patternFill patternType="none"/></fill>','<fill><patternFill patternType="gray125"/></fill>'];
    self.bords=['<border><left/><right/><top/><bottom/><diagonal/></border>'];self.nfs=[];self.xfs=[];self.map={};
    var ekle=function(a,x){var i=a.indexOf(x);if(i<0){a.push(x);i=a.length-1}return i};
    self.fonts.push(FONT.n);
    self.xfs.push('<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>');
    self.idx=function(ad){
      if(self.map[ad]!=null)return self.map[ad];
      var z=false,k=ad;if(/Z$/.test(ad)&&SP[ad.slice(0,-1)]&&SP[ad.slice(0,-1)].z){z=true;k=ad.slice(0,-1)}
      var sp=SP[k]||SP.txt,fi=ekle(self.fonts,FONT[sp.f||"n"]),fl=0,bo=0,nf=0;
      var fillAd=sp.fill||(z?"seri":null);
      if(fillAd)fl=ekle(self.fills,'<fill><patternFill patternType="solid"><fgColor rgb="'+FILL[fillAd]+'"/><bgColor indexed="64"/></patternFill></fill>');
      if(sp.b)bo=ekle(self.bords,BORD[sp.b]);
      if(sp.nf){var v=NF[sp.nf];if(typeof v==="number")nf=v;else{var j=self.nfs.indexOf(v);if(j<0){self.nfs.push(v);j=self.nfs.length-1}nf=164+j}}
      var x='<xf numFmtId="'+nf+'" fontId="'+fi+'" fillId="'+fl+'" borderId="'+bo+'" xfId="0"'+(nf?' applyNumberFormat="1"':'')+' applyFont="1"'+(fl?' applyFill="1"':'')+(bo?' applyBorder="1"':'')+' applyAlignment="1"><alignment horizontal="'+(sp.h||"left")+'" vertical="center"'+(sp.w?' wrapText="1"':'')+'/></xf>';
      self.xfs.push(x);return(self.map[ad]=self.xfs.length-1)};
    self.xml=function(){
      return'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        +(self.nfs.length?'<numFmts count="'+self.nfs.length+'">'+self.nfs.map(function(f,i){return'<numFmt numFmtId="'+(164+i)+'" formatCode="'+xe(f)+'"/>'}).join("")+'</numFmts>':"")
        +'<fonts count="'+self.fonts.length+'">'+self.fonts.join("")+'</fonts><fills count="'+self.fills.length+'">'+self.fills.join("")+'</fills>'
        +'<borders count="'+self.bords.length+'">'+self.bords.join("")+'</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        +'<cellXfs count="'+self.xfs.length+'">'+self.xfs.join("")+'</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'}}

  /* ---------- Sayfa oluşturucu ---------- */
  function Sayfa(ad,gen,baslik,alt){
    this.ad=ad;this.gen=gen.slice();this.n=gen.length;this.rows=[];this.merges=[];this.ht={};this.dondur=0;this.filtre=null;
    if(baslik){this._ekle([{v:baslik,s:"title"}],30,true)}
    if(alt){this._ekle([{v:alt,s:"sub"}],18,true)}
    if(baslik||alt)this.bos()}
  Sayfa.prototype={
    _ekle:function(h,ht,birles){this.rows.push(h);var r=this.rows.length;if(ht)this.ht[r]=ht;if(birles&&this.n>1)this.merges.push("A"+r+":"+kol(this.n-1)+r);return r},
    bos:function(){return this._ekle([],8)},
    bolum:function(t){var s=[{v:t,s:"sect"}];for(var i=1;i<this.n;i++)s.push({v:"",s:"sect"});return this._ekle(s,22)},
    baslikSatir:function(a,sol){var self=this;var r=this._ekle(a.map(function(t,i){return{v:t,s:(sol&&sol.indexOf(i)>=0)?"hdrL":"hdr"}}),30);this.dondur=r;this._hdr=r;return r},
    satir:function(h,ht){return this._ekle(h,ht)},
    not:function(t,tur,ht){var s=[{v:t,s:tur||"note"}];for(var i=1;i<this.n;i++)s.push({v:"",s:tur||"note"});return this._ekle(s,ht||(Math.ceil(String(t).length/(this.gen.reduce(function(a,b){return a+b},0)*1.1))*15+4),true)},
    filtreAyarla:function(ilk,son){this.filtre="A"+ilk+":"+kol(this.n-1)+son}};

  function sayfaXml(sf,defter){
    var son=sf.rows.length,mx=sf.n;
    var x='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
      +'<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:'+kol(Math.max(mx-1,0))+Math.max(son,1)+'"/>'
      +'<sheetViews><sheetView workbookViewId="0" showGridLines="0"'+(sf.dondur?'':'')+'>'+(sf.dondur?'<pane ySplit="'+sf.dondur+'" topLeftCell="A'+(sf.dondur+1)+'" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft"/>':'')+'</sheetView></sheetViews>'
      +'<sheetFormatPr defaultRowHeight="16"/><cols>'+sf.gen.map(function(w,i){return'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>'}).join("")+'</cols><sheetData>';
    sf.rows.forEach(function(h,ri){
      var r=ri+1,ht=sf.ht[r];
      x+='<row r="'+r+'"'+(ht?' ht="'+ht+'" customHeight="1"':'')+'>';
      h.forEach(function(c,ci){
        if(c==null)c="";if(typeof c!=="object")c={v:c};
        var st=defter.idx(c.s||(typeof c.v==="number"?"num":"txt")),ref=kol(ci)+r,v=c.v;
        if(typeof v==="number"&&isFinite(v))x+='<c r="'+ref+'" s="'+st+'"><v>'+v+'</v></c>';
        else if(v===""||v==null||(typeof v==="number"))x+='<c r="'+ref+'" s="'+st+'"/>';
        else x+='<c r="'+ref+'" s="'+st+'" t="inlineStr"><is><t xml:space="preserve">'+xe(v)+'</t></is></c>'});
      x+='</row>'});
    x+='</sheetData>'+(sf.filtre?'<autoFilter ref="'+sf.filtre+'"/>':'')
      +(sf.merges.length?'<mergeCells count="'+sf.merges.length+'">'+sf.merges.map(function(m){return'<mergeCell ref="'+m+'"/>'}).join("")+'</mergeCells>':'')
      +'<pageMargins left="0.4" right="0.4" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>'
      +'<pageSetup paperSize="9" orientation="'+(sf.gen.reduce(function(a,b){return a+b},0)>95?'landscape':'portrait')+'" fitToWidth="1" fitToHeight="0"/>'
      +'<headerFooter><oddFooter>&amp;L&amp;8MAG AMBALAJ&amp;R&amp;8Sayfa &amp;P / &amp;N</oddFooter></headerFooter></worksheet>';
    return x}

  /* ---------- Çalışma kitabı ---------- */
  function bytes(sayfalar){
    var def=new Defter(),adlar=[],P='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    sayfalar.forEach(function(s,i){var a=sayfaAdi(s.ad,i),k=a,j=2;while(adlar.indexOf(k)>=0)k=a.slice(0,28)+" "+(j++);s._ad=k;adlar.push(k)});
    var sh=sayfalar.map(function(s){return sayfaXml(s,def)});
    var dn="";sayfalar.forEach(function(s,i){if(s.filtre){var p=s.filtre.split(":"),f=function(a){var m=a.match(/^([A-Z]+)(\d+)$/);return"$"+m[1]+"$"+m[2]};
      dn+='<definedName name="_xlnm._FilterDatabase" localSheetId="'+i+'" hidden="1">\''+xe(s._ad.replace(/'/g,"''"))+'\'!'+f(p[0])+':'+f(p[1])+'</definedName>'}});
    var files=[
      {ad:"[Content_Types].xml",x:P+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        +sayfalar.map(function(s,i){return'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'}).join("")
        +'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'},
      {ad:"_rels/.rels",x:P+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
      {ad:"xl/workbook.xml",x:P+'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>'
        +sayfalar.map(function(s,i){return'<sheet name="'+xe(s._ad)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>'}).join("")+'</sheets>'+(dn?'<definedNames>'+dn+'</definedNames>':'')+'</workbook>'},
      {ad:"xl/_rels/workbook.xml.rels",x:P+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        +sayfalar.map(function(s,i){return'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>'}).join("")
        +'<Relationship Id="rId'+(sayfalar.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
      {ad:"xl/styles.xml",x:def.xml()}];
    sh.forEach(function(x,i){files.push({ad:"xl/worksheets/sheet"+(i+1)+".xml",x:x})});
    return zip(files.map(function(f){return{ad:f.ad,veri:enc.encode(f.x)}}))}

  function indir(dosya,sayfalar){
    var b=bytes(sayfalar),blob=new Blob([b],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=String(dosya).replace(/[\\\/:*?"<>|]+/g,"-")+".xlsx";
    document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},4000)}

  /* Düz satır listesinden ([{sütun:değer}]) biçimli sayfa: başlık + alt başlık + renkli tablo + filtre + dondurma */
  function jsonSayfa(ad,satirlar,baslik,alt){
    var k=satirlar.length?Object.keys(satirlar[0]):[];
    var gen=k.map(function(h){var m=String(h).length+3;satirlar.forEach(function(r){var l=String(r[h]==null?"":r[h]).length+2;if(l>m)m=l});return Math.max(10,Math.min(46,m))});
    var s=new Sayfa(ad,gen.length?gen:[12],baslik,alt);
    s.baslikSatir(k,[0]);var ilk=s.rows.length+1;
    satirlar.forEach(function(r,i){var z=i%2?"Z":"";
      s.satir(k.map(function(h){var v=r[h];if(v==null)v="";
        if(typeof v==="number")return{v:v,s:(Number.isInteger(v)?"int":"num")+z};return{v:v,s:"txt"+z}}))});
    if(satirlar.length)s.filtreAyarla(ilk-1,ilk+satirlar.length-1);
    return s}

  window.xlsxYaz={sayfa:function(ad,gen,baslik,alt){return new Sayfa(ad,gen,baslik,alt)},jsonSayfa:jsonSayfa,bytes:bytes,indir:indir};
})();
