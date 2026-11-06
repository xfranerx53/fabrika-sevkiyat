/* yz.js — 🤖 YAPAY ZEKÂ ekranı (v132). Mag Pazar gece ajanı her mesai turunda `ai/` altına yazar:
   üretim kuyrukları (aşama başına, aynı formül/renk art arda), vardiya yükü, geciken işler, sevkiyat günü rotası, stok uyarıları.
   Herkes kendi işini görür: şoför rotayı, operatör kendi aşamasının sırasını, yönetici/depo/muhasebe hepsini. Yalnız okur, hiçbir şey yazmaz.
   v137: SEVKİYAT ROTASI artık gece ajanından DEĞİL, ekran açılınca CANLI hazırlanır (rotaKur): sevk edilecekler + bekleyen talimat/tahsilat
   listelenir, şoför işaretler; konum = harita linkindeki koordinat → yoksa kayıtlı sevk adresi → kısa link (maps.app.goo.gl) Cloudflare
   POST /konum ile çözülür (telefonda önbellek). Sıra: fabrikadan çıkıp fabrikaya dönen en kısa tur (≤8 durak tam deneme, fazlası
   en yakın + 2-opt). Fabrika konumu ayarlar/fabrika {lat,lon,url} (yönetici girer). Google linki en çok 10 nokta → fazlası parça parça. */
(function(){
  var ASAD={etiket:"🏷 Etiket",ekstruder:"🧵 Ekstruder",baski:"🖨 Baskı",kesim:"✂️ Kesim",depo:"📦 Depo"};
  var ROLAS={"Ekstruder Operatörü":["ekstruder"],"Matbaa Operatörü":["baski"],"Kesim Operatörü":["kesim"]};
  function e(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  function ts(t){var d=new Date(t||0);return d.toLocaleDateString("tr-TR")+" "+d.toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}
  function dlg(){var d=document.getElementById("dYz");if(d)return d;d=document.createElement("dialog");d.id="dYz";d.style.cssText="max-width:680px;width:94vw;border:0;border-radius:14px;padding:0";
    d.innerHTML='<div style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5e7eb"><b style="font-size:18px">🤖 Yapay Zekâ — bugünkü iş</b><button type="button" id="yzKap" style="font-size:20px;background:none;border:0">✕</button></div><div id="yzB" style="padding:12px 16px;max-height:75vh;overflow:auto">Yükleniyor…</div>';
    document.body.appendChild(d);d.querySelector("#yzKap").onclick=function(){d.close()};d.addEventListener("close",function(){dinleBirak();ROTA.el=null});return d}
  function kuyrukHtml(q,a){var l=(q&&q[a])||[];if(!l.length)return'<div style="color:#667085">Sırada iş yok.</div>';
    return'<ol style="margin:4px 0 0 18px;padding:0">'+l.map(function(x){return'<li style="margin:4px 0"><b>'+e(x.no)+'</b> — '+e(x.musteri)+' <span style="color:#667085">'+(x.urun?"• "+e(x.urun):"")+(x.kg?" • "+x.kg+" kg":"")+(x.formul?" • "+e(x.formul):"")+(x.renk?" • "+e(x.renk):"")+(x.gun>10?' • <b style="color:#b42318">'+x.gun+' gündür bekliyor</b>':"")+'</span></li>'}).join("")+'</ol>'}
  /* ================= 🚚 SEVKİYAT ROTASI (v137 canlı · v138 anlık güncelleme, konumdan yeniden hesap, yaklaşınca uyarı, bölge, yol üstü alacak) ================= */
  var FAB0={lat:41.069802,lon:28.283961},MAXN=10,ROTA={D:[],fab:null,fabKayit:false,url:"",sec:{},ilk:true,yeni:[],ref:[],A:[],C:{},B:null,el:null,bas:null,aktif:false,izle:null,uyarildi:{},cizZm:null};
  var IK={sevk:"📦",talimat:"📋",tahsilat:"💰"},GRP=[["sevk","📦 Sevk edilecekler"],["talimat","📋 Adresli talimatlar"],["tahsilat","💰 Bekleyen tahsilatlar"]];
  var BOLGE=[["trakya","Trakya (Çerkezköy–Çorlu)",function(k){return k.lon<28.1}],["bati","Silivri–Çatalca",function(k){return k.lon<28.47}],["orta","Büyükçekmece–Esenyurt–Beylikdüzü",function(k){return k.lon<28.72}],["dogu","İstanbul içi",function(){return true}]];
  function bolge(k){if(!k)return null;for(var i=0;i<BOLGE.length;i++)if(BOLGE[i][2](k))return BOLGE[i];return null}
  function nrm(x){return(typeof trn==="function"?trn(x):String(x||"").toLowerCase()).replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim()}
  var GEREKSIZ=/\b(ltd|sti|a s|as|tic|san|ve|ins|paz|sanayi|ticaret|limited|sirketi|anonim|ith|ihr|dis)\b/g;
  function cekirdek(x){return nrm(x).replace(GEREKSIZ," ").replace(/\s+/g," ").trim()}
  function koord(s){s=String(s||"");try{s=decodeURIComponent(s)}catch(e){}
    var ok=function(a,b){var la=+a,lo=+b;return isFinite(la)&&isFinite(lo)&&Math.abs(la)<=90&&Math.abs(lo)<=180&&(la||lo)?{lat:la,lon:lo}:null},m;
    if(m=s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/))return ok(m[1],m[2]);
    if(m=s.match(/[?&](?:q|query|ll|destination|daddr|center|sll)=(?:loc:)?(-?\d{1,2}\.\d+)\s*(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i))return ok(m[1],m[2]);
    if(m=s.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/))return ok(m[1],m[2]);
    if(m=s.match(/\/(-?\d{1,2}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})(?:[\/?#]|$)/))return ok(m[1],m[2]);
    if(m=s.match(/^\s*(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})\s*$/))return ok(m[1],m[2]);
    return null}
  function trk(k){return k&&k.lat>35.5&&k.lat<42.3&&k.lon>25.5&&k.lon<45?k:null}
  function adrKonum(a){if(!a)return null;if(a.konum&&isFinite(+a.konum.lat)&&(!a.haritaUrl||a.konum.u===a.haritaUrl)&&trk(a.konum))return{lat:+a.konum.lat,lon:+a.konum.lon,yer:a.konum.yer||""};return koord(a.haritaUrl)}
  window.adrKonum=adrKonum;
  function km(a,b){var t=Math.PI/180,x=Math.pow(Math.sin((b.lat-a.lat)*t/2),2)+Math.cos(a.lat*t)*Math.cos(b.lat*t)*Math.pow(Math.sin((b.lon-a.lon)*t/2),2);return 12742*Math.asin(Math.sqrt(x))}
  function onbOku(){try{return JSON.parse(localStorage.getItem("yzKonum")||"{}")||{}}catch(e){return{}}}
  function onbYaz(o){try{localStorage.setItem("yzKonum",JSON.stringify(o))}catch(e){}}
  async function sunucuKonum(linkler){var o={};if(!linkler.length)return o;
    try{var u=String((await firebase.database().ref("ayarlar/push/url").once("value")).val()||"").replace(/\/+$/,"");if(!u)return o;
      var t=await firebase.auth().currentUser.getIdToken();
      for(var i=0;i<linkler.length;i+=25){var r=await fetch(u+"/konum",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+t},body:JSON.stringify({u:linkler.slice(i,i+25)})});
        var j=await r.json().catch(function(){return{}});if(j&&j.konum)Object.assign(o,j.konum)}}catch(e){}
    return o}
  window.yzSunucuKonum=sunucuKonum;
  /* v143: Google Maps linkinden konum (kısa link de olur) → {lat,lon,yer?,yaklasik?} ya da null */
  window.linktenKonum=async function(l){l=String(l||"").trim();var k=koord(l);if(k)return k;if(!/^https?:\/\//i.test(l))return null;var o=await sunucuKonum([l]);return trk(o[l])||null};
  async function konumlariBul(liste){
    var c=onbOku(),simdi=Date.now(),sor=[];
    liste.forEach(function(d){if(d.k||!d.harita)return;var k=koord(d.harita);if(k){d.k=k;return}
      var e=c[d.harita];if(e&&trk(e.v)){d.k=e.v;return}if(e&&simdi-e.z<6*36e5)return;if(sor.indexOf(d.harita)<0)sor.push(d.harita)});
    if(sor.length){var o=await sunucuKonum(sor);Object.keys(o).forEach(function(u){c[u]={z:simdi,v:trk(o[u])||null}});
      var ks=Object.keys(c);if(ks.length>400)ks.sort(function(a,b){return c[a].z-c[b].z}).slice(0,ks.length-400).forEach(function(x){delete c[x]});onbYaz(c);
      liste.forEach(function(d){if(!d.k&&d.harita&&c[d.harita]&&c[d.harita].v)d.k=c[d.harita].v})}}
  function adresBul(A,adlar){/* 1) Mikro cari koduyla bağlı adres 2) ad birebir 3) çekirdek ad birebir 4) biri ötekini içeriyor (≥5 harf) */
    var C=ROTA.C||{};
    for(var i=0;i<adlar.length;i++){var q=cekirdek(adlar[i]);if(!q)continue;
      var ck=Object.keys(C).find(function(k){return cekirdek(C[k].ad)===q});if(ck){var bk=A.find(function(a){return a.cariKod===C[ck].kod});if(bk)return bk}}
    var N=A.map(function(a){return[nrm(a.ad),cekirdek(a.ad),a]}).filter(function(x){return x[0]});
    for(i=0;i<adlar.length;i++){var q1=nrm(adlar[i]);if(!q1)continue;var t=N.find(function(x){return x[0]===q1});if(t)return t[2]}
    for(i=0;i<adlar.length;i++){var q2=cekirdek(adlar[i]);if(!q2)continue;t=N.find(function(x){return x[1]===q2});if(t)return t[2]}
    for(i=0;i<adlar.length;i++){q2=cekirdek(adlar[i]);if(q2.length<5)continue;var b=null,bf=1e9;
      N.forEach(function(x){if(x[1].length<5)return;if(x[1].indexOf(q2)>=0||q2.indexOf(x[1])>=0){var f=Math.abs(x[1].length-q2.length);if(f<bf){bf=f;b=x[2]}}});if(b)return b}
    return null}
  window.yzAdresBul=function(ad){return adresBul(ROTA.A.length?ROTA.A:(window.sAdr||[]),[ad])};
  function turUzun(S,E,L){var p=[S].concat(L.map(function(d){return d.k}),[E]),s=0;for(var i=1;i<p.length;i++)s+=km(p[i-1],p[i]);return s}
  function sirala(S,E,L){/* S'den çıkıp E'ye varan en kısa sıra (S=E ise fabrikaya dönüş turu) */
    var n=L.length;if(n<2)return L.slice();
    var P=[S].concat(L.map(function(d){return d.k}),[E]),M=P.map(function(a){return P.map(function(b){return km(a,b)})}),son=n+1,en=null,eu=1e18;
    if(n<=8){var a=[];for(var i=1;i<=n;i++)a.push(i);
      (function per(k){if(k===a.length){var u=M[0][a[0]];for(var j=1;j<a.length;j++)u+=M[a[j-1]][a[j]];u+=M[a[a.length-1]][son];if(u<eu){eu=u;en=a.slice()}return}
        for(var j=k;j<a.length;j++){var t=a[k];a[k]=a[j];a[j]=t;per(k+1);t=a[k];a[k]=a[j];a[j]=t}})(0)}
    else{var kal=[];for(i=1;i<=n;i++)kal.push(i);en=[];var c=0;while(kal.length){kal.sort(function(x,y){return M[c][x]-M[c][y]});c=kal.shift();en.push(c)}
      var yol=[0].concat(en,[son]),iy=true;while(iy){iy=false;for(i=1;i<yol.length-2;i++)for(var j=i+1;j<yol.length-1;j++){
        if(M[yol[i-1]][yol[j]]+M[yol[i]][yol[j+1]]+1e-9<M[yol[i-1]][yol[i]]+M[yol[j]][yol[j+1]]){var r=yol.slice(i,j+1).reverse();yol.splice.apply(yol,[i,r.length].concat(r));iy=true}}}
      en=yol.slice(1,-1)}
    return en.map(function(x){return L[x-1]})}
  function linkler(nok){var o=[];for(var i=0;i<nok.length-1;i+=MAXN-1)o.push("https://www.google.com/maps/dir/"+nok.slice(i,i+MAXN).join("/"));return o}
  function sesli(m){try{if(navigator.vibrate)navigator.vibrate([200,100,200])}catch(e){}if(typeof toast==="function")toast(m)}
  async function telBildir(b,m){try{if(window.Notification&&Notification.permission==="granted"&&navigator.serviceWorker){var r=await navigator.serviceWorker.ready;r.showNotification(b,{body:m,tag:"yzRota",icon:"icon-192.png",vibrate:[200,100,200]})}}catch(e){}}

  /* --- veri: ekran açıkken CANLI dinlenir; yeni durak gelince işaretli eklenir ve uyarılır --- */
  function dinleBirak(){ROTA.ref.forEach(function(x){try{x.off()}catch(e){}});ROTA.ref=[]}
  async function rotaKur(el){if(!el)return;ROTA.el=el;ROTA.ilk=true;ROTA.yeni=[];
    el.innerHTML='<h3 style="margin:14px 0 6px">🚚 Sevkiyat rotası</h3><div style="color:#667085">Duraklar ve konumlar hazırlanıyor…</div>';
    var db=firebase.database(),adm=typeof isAdmin==="function"&&isAdmin();
    try{var f=(await db.ref("ayarlar/fabrika").once("value")).val();ROTA.fabKayit=!!(f&&isFinite(+f.lat)&&isFinite(+f.lon));ROTA.fab=ROTA.fabKayit?{lat:+f.lat,lon:+f.lon}:FAB0;ROTA.url=(f&&f.url)||""}catch(e){ROTA.fab=FAB0;ROTA.fabKayit=false}
    ROTA.C={};try{ROTA.C=(await db.ref("cariler").once("value")).val()||{}}catch(e){}
    ROTA.B=null;try{ROTA.B=(await db.ref("cariBakiye").once("value")).val()||{}}catch(e){ROTA.B=null}
    dinleBirak();var ham={u:null,t:null,h:null,a:null};
    var tetik=function(){if(ham.u&&ham.t&&ham.h&&ham.a){clearTimeout(ROTA.cizZm);ROTA.cizZm=setTimeout(function(){topla(ham)},250)}};
    var bag=function(ref,ad){ROTA.ref.push(ref);ref.on("value",function(s){var o=[];s.forEach(function(c){var v=c.val();if(v){v.__id=c.key;o.push(v)}});ham[ad]=o;tetik()},function(){ham[ad]=[];tetik()})};
    bag(db.ref("urunler").orderByChild("durum").equalTo("sevk_edilecek"),"u");
    bag(db.ref("sevkTalimat").orderByChild("zaman").limitToLast(150),"t");
    bag(db.ref("tahsilatlar").orderByChild("zaman").limitToLast(300),"h");
    bag(db.ref("sevkAdresleri"),"a")}
  async function topla(ham){var uid=(firebase.auth().currentUser||{}).uid,adm=typeof isAdmin==="function"&&isAdmin(),D=[];
    ROTA.A=ham.a||[];
    ham.u.forEach(function(u){D.push({id:"u/"+u.__id,tur:"sevk",ad:u.musteri||"",not:((u.kg?u.kg+" kg ":"")+String(u.urun||"").split("\n")[0]).trim(),kg:+u.kg||0,adres:u.adres||"",harita:u.haritaUrl||"",adresAd:""})});
    ham.t.forEach(function(x){if(x.durum==="yapildi")return;if(!(adm||x.hedefUid==="*"||x.hedefUid===uid||x.atayanUid===uid||!rolSofor()))return;if(!(x.adres||x.haritaUrl||x.adresAd))return;
      D.push({id:"t/"+x.__id,tur:"talimat",ad:x.adresAd||String(x.metin||"Talimat").split("\n")[0].slice(0,40),not:String(x.metin||"").split("\n")[0].slice(0,90),adres:x.adres||"",harita:x.haritaUrl||"",adresAd:x.adresAd||""})});
    ham.h.forEach(function(x){if(x.durum!=="bekliyor")return;D.push({id:"h/"+x.__id,tur:"tahsilat",ad:x.cari||x.adresAd||"",not:String(x.not||"").slice(0,90),adres:x.adres||"",harita:x.haritaUrl||"",adresAd:x.adresAd||""})});
    D.forEach(function(d){d.k=koord(d.harita);var mt=!d.k&&window.musteriTeslim?musteriTeslim(d.adresAd||d.ad,{kendi:d.tur!=="sevk"}):null;/* v142: önce Müşterilerim (sevk → teslim yeri/ambar, diğer → kendi yeri) */
      var a=(mt&&mt.adres)||adresBul(ROTA.A,[d.adresAd,d.ad]);if(!a)return;if(mt&&mt.ambar&&d.tur==="sevk")d.not=(d.not?d.not+" • ":"")+"🚚 "+a.ad+(mt.not?" ("+mt.not+")":"");d.kayit=a.ad;d.cariKod=a.cariKod||"";
      if(!d.adres)d.adres=a.adres||"";if(!d.k){var ak=adrKonum(a);if(ak)d.k=ak;else if(!d.harita||!/^https?:/i.test(d.harita))d.harita=a.haritaUrl||d.harita}});
    await konumlariBul(D);
    D.forEach(function(d,i){d.i=i;if(ROTA.sec[d.id]===undefined){ROTA.sec[d.id]=ROTA.ilk?d.tur==="sevk":true;if(!ROTA.ilk){ROTA.yeni.push(d.ad||"durak");sesli("🚚 Rotaya yeni durak eklendi: "+(d.ad||""));if(ROTA.aktif)telBildir("🚚 Rotaya yeni durak",(d.ad||"")+" — rotayı yeniden hesaplayın")}}d.sec=ROTA.sec[d.id]});
    ROTA.ilk=false;ROTA.D=D;
    if(ROTA.el&&document.body.contains(ROTA.el))ciz(ROTA.el)}
  function rolSofor(){return typeof rec!=="undefined"&&rec&&rec.rol==="Sevkiyat Sorumlusu"&&!(typeof isAdmin==="function"&&isAdmin())}

  /* --- yol üstü alacak (Mikro açık bakiyesi; yalnız yönetici/muhasebe görür) --- */
  function yolUstu(S){if(!ROTA.B||!S.length)return[];var C=ROTA.C||{},var_={};ROTA.D.forEach(function(d){if(d.tur==="tahsilat"&&d.cariKod)var_[d.cariKod]=1;if(d.tur==="tahsilat")var_["ad:"+cekirdek(d.ad)]=1});
    var P=S.filter(function(d){return d.k}).map(function(d){return d.k}).concat([ROTA.fab]),o=[];
    ROTA.A.forEach(function(a){if(!a.cariKod)return;var key=String(a.cariKod).replace(/\./g,"_"),b=ROTA.B[key];if(!b||!(+b.acik>=5000))return;
      if(var_[a.cariKod]||var_["ad:"+cekirdek(a.ad)])return;var k=adrKonum(a);if(!k)return;
      var m=Math.min.apply(null,P.map(function(p){return km(p,k)}));if(m<=3)o.push({a:a,b:b,m:m,ad:(C[key]&&C[key].ad)||a.ad})});
    return o.sort(function(x,y){return y.b.acik-x.b.acik}).slice(0,6)}
  function para(n){return Math.round(+n||0).toLocaleString("tr-TR")+" ₺"}

  function ciz(el){var D=ROTA.D,adm=typeof isAdmin==="function"&&isAdmin(),h='<h3 style="margin:14px 0 6px">🚚 Sevkiyat rotası</h3>';
    h+='<div style="font-size:13px;color:#667085;margin-bottom:6px">Bugün gideceğiniz yerleri işaretleyin, «Rotayı oluştur»a basın. Rota en kısa sırayla dolaşır, fabrikaya döner. Bu ekran açıkken yeni iş gelirse kendiliğinden eklenir.</div>';
    if(ROTA.yeni.length)h+='<div style="background:#fef3c7;border-radius:10px;padding:8px 10px;margin-bottom:6px">🆕 Yeni eklenen: <b>'+e(ROTA.yeni.join(", "))+'</b> — işaretli. Rotayı yeniden oluşturun.</div>';
    if(ROTA.aktif)h+='<div style="background:#dcfce7;border-radius:10px;padding:8px 10px;margin-bottom:6px">🟢 Rota takipte: bir durağa 350 m yaklaşınca o adresteki bütün işler hatırlatılır (uygulama açıkken). <button type="button" class="btn b6 sm" id="yzBit" style="margin-left:6px">🏁 Rotayı bitir</button></div>';
    if(!ROTA.fabKayit)h+='<div style="color:#b42318;font-size:13px">⚠️ Fabrika konumu girilmemiş; geçici bir nokta kullanılıyor.'+(adm?'':' Yöneticiye haber verin.')+'</div>';
    if(adm)h+='<details style="margin:4px 0 8px"><summary style="cursor:pointer;font-size:14px">🏭 Fabrika konumu '+(ROTA.fabKayit?'<span style="color:#16a34a">✓ kayıtlı</span>':'<b style="color:#b42318">girilmemiş</b>')+'</summary><div style="display:flex;gap:6px;margin-top:6px"><input id="yzFab" placeholder="Fabrikanın Google Maps linki ya da 41.07, 28.28" value="'+e(ROTA.url||(ROTA.fabKayit?ROTA.fab.lat+", "+ROTA.fab.lon:""))+'" style="flex:1;min-width:0"><button type="button" class="btn b1 sm" id="yzFabK">Kaydet</button></div><div id="yzFabU" style="font-size:13px;color:#667085"></div></details>';
    if(!D.length)h+='<div style="color:#667085">Sevk edilecek ürün, adresli talimat ya da bekleyen tahsilat yok.</div>';
    else{var S=D.filter(function(d){return d.sec}),kg=S.reduce(function(a,d){return a+(d.kg||0)},0),bs={};
      D.forEach(function(d){var b=bolge(d.k);if(b){bs[b[0]]=bs[b[0]]||{ad:b[1],n:0,s:0};bs[b[0]].n++;if(d.sec)bs[b[0]].s++}});
      var bk=Object.keys(bs);if(bk.length>1)h+='<div style="font-size:13px;margin:4px 0 2px">🧭 Bölgeler: '+bk.map(function(k){return'<button type="button" class="btn b6 sm" data-yzb="'+k+'" style="margin:2px 4px 2px 0">'+e(bs[k].ad)+' ('+bs[k].n+')</button>'}).join("")+'<span style="color:#667085"> — dokununca yalnız o bölge seçilir</span></div>';
      GRP.forEach(function(g){var l=D.filter(function(d){return d.tur===g[0]});if(!l.length)return;
        h+='<div style="font-weight:700;margin:10px 0 2px">'+g[1]+' ('+l.length+')</div>'+l.map(function(d){
          var b=bolge(d.k),dur=d.k?'<span style="color:#16a34a">📍 '+(b?e(b[1]):"konum var")+'</span>':d.adres?'<span style="color:#b45309">⚠️ konum yok — açık adresle aranacak</span>':'<span style="color:#b42318">⚠️ konum yok — haritaya konamaz (Adres tamamlama\'dan kaydedin)</span>';
          return'<label style="display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-bottom:1px solid #f1f5f9;cursor:pointer"><input type="checkbox" data-yzi="'+d.i+'"'+(d.sec?" checked":"")+' style="width:20px;height:20px;margin-top:2px;flex:none"><span><b>'+e(d.ad||"-")+'</b> <span style="color:#667085">'+e(d.not||"")+'</span>'+(d.kayit&&nrm(d.kayit)!==nrm(d.ad)?'<br><small style="color:#667085">Adres defteri: '+e(d.kayit)+'</small>':'')+'<br><small>'+dur+(d.adres?' <span style="color:#667085">• '+e(d.adres)+'</span>':'')+'</small></span></label>'}).join("")});
      h+='<div style="margin-top:8px;font-size:14px">Seçili: <b>'+S.length+'</b> durak'+(kg?' • yük <b>'+Math.round(kg).toLocaleString("tr-TR")+' kg</b>':'')+'</div>';
      h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button type="button" class="btn b6 sm" id="yzHep">Hepsini seç</button><button type="button" class="btn b6 sm" id="yzHic">Seçimi temizle</button></div>'+
        '<button type="button" id="yzRot" style="display:block;width:100%;margin-top:8px;padding:12px 14px;border:0;border-radius:10px;background:#16a34a;color:#fff;font-weight:700;font-size:16px;cursor:pointer">🗺 Fabrikadan rotayı oluştur ve haritada aç</button>'+
        '<button type="button" id="yzRotK" style="display:block;width:100%;margin-top:6px;padding:11px 14px;border:0;border-radius:10px;background:#0f766e;color:#fff;font-weight:700;font-size:15px;cursor:pointer">📍 Bulunduğum yerden yeniden hesapla</button><div id="yzSon"></div>';
      var Y=yolUstu(S);if(Y.length)h+='<div style="margin-top:10px;padding:10px;border-radius:10px;background:#eff6ff"><b>💡 Yol üstünde açık hesabı olan müşteriler</b> <span style="color:#667085;font-size:13px">(Mikro bakiyesi; rotaya en çok 3 km)</span>'+Y.map(function(y){return'<div style="display:flex;justify-content:space-between;gap:6px;align-items:center;padding:6px 0;border-bottom:1px solid #dbeafe"><span><b>'+e(y.ad)+'</b> <span style="color:#667085">'+para(y.b.acik)+' • '+y.m.toFixed(1)+' km</span></span><button type="button" class="btn b4 sm" data-yzt="'+e(y.a.ad)+'">➕ Tahsilat talebi</button></div>'}).join("")+'</div>'}
    el.innerHTML=h;
    el.querySelectorAll("[data-yzi]").forEach(function(c){c.onchange=function(){var d=ROTA.D[+c.dataset.yzi];d.sec=c.checked;ROTA.sec[d.id]=c.checked;ciz(el)}});
    el.querySelectorAll("[data-yzb]").forEach(function(b){b.onclick=function(){ROTA.D.forEach(function(d){var bb=bolge(d.k);d.sec=!!bb&&bb[0]===b.dataset.yzb;ROTA.sec[d.id]=d.sec});ciz(el)}});
    el.querySelectorAll("[data-yzt]").forEach(function(b){b.onclick=function(){talepAc(b.dataset.yzt,b)}});
    var hp=el.querySelector("#yzHep"),hc=el.querySelector("#yzHic");if(hp)hp.onclick=function(){ROTA.D.forEach(function(d){d.sec=true;ROTA.sec[d.id]=true});ciz(el)};if(hc)hc.onclick=function(){ROTA.D.forEach(function(d){d.sec=false;ROTA.sec[d.id]=false});ciz(el)};
    var rb=el.querySelector("#yzRot");if(rb)rb.onclick=function(){ROTA.yeni=[];olustur(el,ROTA.fab,true)};
    var rk=el.querySelector("#yzRotK");if(rk)rk.onclick=function(){ROTA.yeni=[];konumdan(el)};
    var bt=el.querySelector("#yzBit");if(bt)bt.onclick=function(){takipBitir();ciz(el)};
    var fk=el.querySelector("#yzFabK");if(fk)fk.onclick=function(){fabKaydet(el)}}
  async function talepAc(ad,b){if(!confirm(ad+" için tahsilat talebi açılsın mı? Sevkiyat sorumlusuna bildirim gider."))return;b.disabled=true;
    try{var o={cari:String(ad).slice(0,100),talepUid:firebase.auth().currentUser.uid,talepEden:String((rec&&rec.ad)||"?").slice(0,100),zaman:firebase.database.ServerValue.TIMESTAMP,durum:"bekliyor",talepTur:"talep",not:"Rota önerisi (yol üstünde, Mikro açık hesap)",adresAd:String(ad).slice(0,100)};
      await firebase.database().ref("tahsilatlar").push(o);if(window.bil)bil(["sor"],{t:"tahsilat",ik:"💰",b:"💰 Tahsilat talebi: "+o.cari,m:"Yol üstünde — rotaya eklendi",git:"tah"});if(typeof toast==="function")toast("✓ Tahsilat talebi açıldı")}
    catch(er){b.disabled=false;alert("Açılamadı: "+(er&&er.message||er))}}
  function konumdan(el){var out=el.querySelector("#yzSon");if(!navigator.geolocation){out.innerHTML='<div style="color:#b42318">Bu telefonda konum alınamıyor.</div>';return}
    out.innerHTML='<div style="color:#667085;margin-top:6px">📍 Konumunuz alınıyor… (izin isterse «İzin ver» deyin)</div>';
    navigator.geolocation.getCurrentPosition(function(p){ROTA.bas={lat:p.coords.latitude,lon:p.coords.longitude};olustur(el,ROTA.bas,false);if(typeof toast==="function")toast("✓ Rota bulunduğunuz yerden yeniden sıralandı — «Haritada aç»a dokunun")},
      function(er){out.innerHTML='<div style="color:#b42318;margin-top:6px">Konum alınamadı'+(er&&er.code===1?': konum izni kapalı. Telefon ayarlarından bu uygulamaya konum izni verin.':'.')+'</div>'},{enableHighAccuracy:true,timeout:15000,maximumAge:60000})}
  function olustur(el,S,ac){var Se=ROTA.D.filter(function(d){return d.sec}),out=el.querySelector("#yzSon"),F=ROTA.fab,kon=S!==F;
    if(!Se.length){out.innerHTML='<div style="color:#b42318;margin-top:6px">Önce gidilecek durakları işaretleyin.</div>';return}
    var K=sirala(S,F,Se.filter(function(d){return d.k})),M=Se.filter(function(d){return!d.k&&d.adres}),Y=Se.filter(function(d){return!d.k&&!d.adres});
    var ss=S.lat+","+S.lon,fs=F.lat+","+F.lon,nok=[ss].concat(K.map(function(d){return d.k.yer?encodeURIComponent(d.k.yer):d.k.lat+","+d.k.lon}),M.map(function(d){return encodeURIComponent(d.adres)}),[fs]),L=linkler(nok);
    if(nok.length<3){out.innerHTML='<div style="color:#b42318;margin-top:6px">Seçilenlerin hiçbirinin konumu ya da açık adresi yok; harita açılamaz.</div>';return}
    if(ac)window.open(L[0],"_blank","noopener");
    var sira=K.concat(M),h='<div style="margin-top:10px;padding:10px;border-radius:10px;background:#f0fdf4"><b>Gidiş sırası</b> <span style="color:#667085;font-size:13px">(kuş uçuşu ≈ '+Math.round(K.length?turUzun(S,F,K):0)+' km'+(M.length?' + adresle aranan '+M.length+' durak':'')+')</span><ol style="margin:4px 0 0 20px;padding:0"><li style="color:#667085">'+(kon?"📍 Bulunduğunuz yer":"🏭 Fabrikadan çıkış")+'</li>'+
      sira.map(function(d){return'<li>'+(IK[d.tur]||"•")+' <b>'+e(d.ad||"-")+'</b>'+(d.k?"":' <span style="color:#b45309">(adresle)</span>')+'</li>'}).join("")+'<li style="color:#667085">🏭 Fabrikaya dönüş</li></ol>';
    h+=L.map(function(u,i){return'<a href="'+e(u)+'" target="_blank" rel="noopener" style="display:inline-block;margin:8px 6px 0 0;padding:9px 13px;border-radius:10px;background:#16a34a;color:#fff;text-decoration:none;font-weight:700">🗺 '+(L.length>1?"Rota "+(i+1)+". parça":"Haritada aç")+'</a>'}).join("");
    if(L.length>1)h+='<div style="font-size:13px;color:#667085;margin-top:4px">Google Haritalar tek seferde en çok 10 nokta alır; rota parçalara bölündü. Bir parça bitince sıradakini açın.</div>';
    if(M.length)h+='<div style="font-size:13px;color:#b45309;margin-top:4px">⚠️ Konumu olmayan '+M.length+' durak sona eklendi ve Google açık adresle arayacak; yeri yanlış çıkabilir.</div>';
    if(Y.length)h+='<div style="font-size:13px;color:#b42318;margin-top:4px">⚠️ Haritaya konamayanlar (konum da adres de yok): '+Y.map(function(d){return e(d.ad||"-")}).join(", ")+'</div>';
    out.innerHTML=h+'</div>';takipBasla()}
  /* --- yaklaşınca hatırlatma: rota oluşturulunca başlar, uygulama açıkken çalışır --- */
  function takipBasla(){ROTA.aktif=true;if(ROTA.izle!=null||!navigator.geolocation)return;
    try{ROTA.izle=navigator.geolocation.watchPosition(function(p){var k={lat:p.coords.latitude,lon:p.coords.longitude};
      ROTA.D.filter(function(d){return d.sec&&d.k&&!ROTA.uyarildi[d.id]&&km(k,d.k)<0.35}).forEach(function(d){
        var ayni=ROTA.D.filter(function(x){return x.k&&km(x.k,d.k)<0.15});ayni.forEach(function(x){ROTA.uyarildi[x.id]=1});
        var m=ayni.map(function(x){return(IK[x.tur]||"•")+" "+(x.tur==="tahsilat"?"Tahsilat":x.tur==="sevk"?"Teslim: "+(x.not||""):x.not||"Talimat")}).join(" · ");
        sesli("📍 "+(d.kayit||d.ad)+" yakında — "+m);telBildir("📍 "+(d.kayit||d.ad)+" yakında",m)})},function(){},{enableHighAccuracy:true,maximumAge:30000})}catch(er){}}
  function takipBitir(){ROTA.aktif=false;ROTA.uyarildi={};if(ROTA.izle!=null){try{navigator.geolocation.clearWatch(ROTA.izle)}catch(e){}ROTA.izle=null}}
  async function fabKaydet(el){var i=el.querySelector("#yzFab"),u=el.querySelector("#yzFabU"),v=i.value.trim();
    if(!v){u.textContent="Link ya da koordinat yazın.";return}u.textContent="Konum aranıyor…";
    var k=koord(v);if(!k&&/^https?:\/\//i.test(v)){var o=await sunucuKonum([v]);k=o[v]||null}
    if(!k){u.innerHTML='<span style="color:#b42318">Bu linkten konum çıkarılamadı. Google Haritalar\'da fabrikaya basılı tutun, çıkan «41.07…, 28.28…» sayılarını kopyalayıp buraya yapıştırın.</span>';return}
    try{await firebase.database().ref("ayarlar/fabrika").set({lat:Math.round(k.lat*1e6)/1e6,lon:Math.round(k.lon*1e6)/1e6,url:v.slice(0,500),z:firebase.database.ServerValue.TIMESTAMP});
      ROTA.fab=k;ROTA.fabKayit=true;ROTA.url=v;if(typeof toast==="function")toast("✓ Fabrika konumu kaydedildi");ciz(el)}
    catch(er){u.innerHTML='<span style="color:#b42318">Kaydedilemedi: '+e(er&&er.message||er)+'</span>'}}
  window.yzRotaTest={koord:koord,sirala:sirala,linkler:linkler,adresBul:adresBul,turUzun:turUzun,bolge:bolge,ROTA:ROTA};
  async function ac(){var d=dlg();d.showModal();var B=d.querySelector("#yzB");B.textContent="Yükleniyor…";
    try{var s=await firebase.database().ref("ai").once("value").catch(function(){return null}),v=(s&&s.val())||null;
      var rol=(typeof rec!=="undefined"&&rec&&rec.rol)||"",yon=typeof isAdmin==="function"&&isAdmin(),h=v?'<div style="color:#667085;font-size:13px">Son güncelleme: '+ts(v.t)+'</div>':'';
      var sofor=rol==="Sevkiyat Sorumlusu",asl=ROLAS[rol];
      var rotaVar=sofor||yon||rol==="Depo Görevlisi";
      if(rotaVar)h+='<div id="yzRota"></div>';
      if(!v){h+='<div style="color:#667085;margin-top:12px">İş sırası planı henüz yok. Gece ajanı ilk mesai turunda hazırlar.</div>';B.innerHTML=h;if(rotaVar)rotaKur(B.querySelector("#yzRota"));return}
      var gor=asl||(sofor?[]:["etiket","ekstruder","baski","kesim","depo"]);
      if(gor.length){if(!asl&&v.yuk){var y=v.yuk;h+='<h3 style="margin:14px 0 6px">📊 Önümüzdeki iş yükü</h3><div>'+["ekstruder","baski","kesim"].map(function(a){var o=y[a]||{};return ASAD[a]+': <b>'+(o.kg||0)+' kg</b> ≈ '+(o.saat||0)+' saat ('+(o.vardiya||0)+' vardiya)'}).join("<br>")+'</div>'+((v.gecGun||[]).length?'<div style="color:#b42318;margin-top:4px">⏰ 10 günden uzun bekleyen: '+e(v.gecGun.join(", "))+'</div>':"")}
        gor.forEach(function(a){h+='<h3 style="margin:14px 0 6px">'+ASAD[a]+' sırası</h3>'+kuyrukHtml(v.kuyruk,a)});
        if(asl&&asl[0]==="ekstruder")h+='<div style="color:#667085;font-size:13px;margin-top:6px">Sıra, aynı formül ve renkteki işler art arda gelecek şekilde dizildi (daha az geçiş, daha az fire).</div>'}
      if((yon||rol==="Depo Görevlisi"||rol==="Muhasebe")&&(v.stok||[]).length)h+='<h3 style="margin:14px 0 6px">📦 Bitmek üzere olan malzemeler</h3>'+v.stok.map(function(x){return'<div>• <b>'+e(x.ad)+'</b>: '+(x.kalan||0)+' '+e(x.birim)+(x.gun!=null?' — ≈ '+x.gun+' gün yeter':"")+(x.ted?' <span style="color:#667085">('+e(x.ted)+')</span>':"")+'</div>'}).join("");
      if((yon||asl)&&v.fire&&(v.fire.fireKg||v.fire.durusDk)){var fr=v.fire;h+='<h3 style="margin:14px 0 6px">⚠️ Son 7 gün fire / arıza</h3><div>🗑 Fire: <b>'+(fr.fireKg||0)+' kg</b>'+(fr.fireOran!=null?' (üretimin %'+fr.fireOran+"'i)":"")+'<br>🔧 Duruş: <b>'+(fr.durusSaat||0)+' saat</b>'+((fr.enCok||[]).length?'<br><span style="color:#667085">En çok: '+fr.enCok.map(function(x){return e(x.ad)+" ("+e(x.deger)+")"}).join(", ")+'</span>':"")+'</div>'+(fr.oneri?'<div style="margin-top:4px">💡 '+e(fr.oneri)+'</div>':"")}
      B.innerHTML=h;if(rotaVar)rotaKur(B.querySelector("#yzRota"))}catch(err){B.textContent="Açılamadı: "+(err&&err.message||err)}}
  function dugme(){if(document.getElementById("mYz"))return;var ref=document.querySelector('.menuBtn[data-go="is"]');if(!ref)return;
    var b=document.createElement("button");b.className="menuBtn";b.id="mYz";b.type="button";b.style.background="#4c1d95";b.innerHTML='<span class="ic">🤖</span><div>YAPAY ZEKÂ<small>Bugünkü iş sırası, sevkiyat rotası, stok uyarıları</small></div>';b.onclick=ac;ref.parentNode.insertBefore(b,ref)}
  window.yzAc=ac;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",dugme);else dugme();
})();
