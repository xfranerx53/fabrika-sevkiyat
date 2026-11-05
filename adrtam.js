/* adrtam.js — 🧩 ADRES TAMAMLAMA + 🗺 UYGULAMA İÇİ HARİTADAN KONUM SEÇME (v138)
   Amaç: sevkiyat rotası ve yapay zekâ YALNIZ kayıtlı adreslerle çalışır; bu ekran kayıtlı olmayanları beraber, elle kaydetmek içindir.
   Hiçbir adres kendiliğinden KAYDEDİLMEZ: konumu kullanıcı haritada işaretler, Kaydet'e kendisi basar.
   Veri: cariler/{120_01_001} (Mikro aktarımı, yönetim işlemi «cari-aktar»), sevkAdresleri/{id} + cariKod + konum {lat,lon,u}
         (u = konumun alındığı harita linki; link değişirse eski konum kullanılmaz), adresGizle/{120_01_001}=true (bu cariye sevkiyat yok).
   Sekmeler: 1) Eşleşme onayı — Mikro carisi ile kayıtlı adres «aynı firma mı?»  2) (v139) WhatsApp'tan — «Mag Adresler» grubundaki konumlar
             (adresOneri/; yönetim işlemi oneri-aktar), onaylanınca adres defterine 3) Adresi olmayan müşteriler (son 1 yıl hareketli) 4) Konumu olmayan
             kayıtlı adresler (WhatsApp'ta benzer adlı konum varsa «💡 Uygula»).  Harita: Leaflet (cdnjs) + OpenStreetMap / Esri uydu; arama (Nominatim) yalnız haritayı oraya götürür.
   Dışa açılan: window.haritaSec({baslik,merkez,ipucu}) → Promise<{lat,lon}|null>, window.adrTamAc(), window.adrKonumRozet(a). */
(function(){
  var $=function(i){return document.getElementById(i)};
  function e(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  function nrm(x){return(typeof trn==="function"?trn(x):String(x||"").toLowerCase()).replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim()}
  var GEREKSIZ=/\b(ltd|sti|a s|as|tic|san|ve|ins|paz|sanayi|ticaret|limited|sirketi|anonim|ith|ihr|dis|mam|gida|ambalaj|plastik|unlu|mamulleri|insaat|pazarlama|tekstil|ekmek|firin|kuruyemis|matbaacilik|ve)\b/g;
  function cek(x){return nrm(x).replace(GEREKSIZ," ").replace(/\b\d+\b/g," ").replace(/\s+/g," ").trim()}
  function benz(a,b){a=cek(a);b=cek(b);if(!a||!b)return 0;if(a===b)return 1;var A=a.split(" "),B=b.split(" "),o=A.filter(function(w){return B.indexOf(w)>=0}).length;
    if(!o)return 0;var ilk=A[0]===B[0]?0.25:0;return Math.min(0.99,o/Math.max(A.length,B.length)+ilk)}
  function konum(a){return window.adrKonum?window.adrKonum(a):null}
  function yaz(){return typeof isAdmin==="function"&&isAdmin()||!!(typeof rec!=="undefined"&&rec&&rec.onay&&(rec.izin&&rec.izin.sevk===true||(!rec.izin||rec.izin.sevk!==false)&&(rec.rol==="Depo Görevlisi"||rec.rol==="Sevkiyat Sorumlusu")))}
  var ST={sek:"es",C:{},G:{},A:[],O:{},q:""};

  /* ---------------- 🗺 harita seçici ---------------- */
  var LY=null;
  function leaflet(){if(window.L&&window.L.map)return Promise.resolve();if(LY)return LY;
    LY=new Promise(function(ok,no){var c=document.createElement("link");c.rel="stylesheet";c.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";document.head.appendChild(c);
      var s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";s.onload=function(){ok()};s.onerror=function(){LY=null;no(new Error("Harita yüklenemedi (internet?)"))};document.head.appendChild(s)});return LY}
  function hDlg(){var d=$("dHarSec");if(d)return d;d=document.createElement("dialog");d.id="dHarSec";d.style.cssText="width:96vw;max-width:760px;border:0;border-radius:14px;padding:0";
    d.innerHTML='<div style="padding:10px 12px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;gap:8px"><b id="hsB" style="font-size:16px"></b><button type="button" id="hsX" style="font-size:20px;background:none;border:0">✕</button></div>'+
      '<div style="padding:8px 12px"><div id="hsI" style="font-size:13px;color:#667085;margin-bottom:6px"></div><div style="display:flex;gap:6px"><input id="hsQ" placeholder="Haritada ara (mahalle, cadde, firma…)" style="flex:1;min-width:0"><button type="button" class="btn b6 sm" id="hsAra">Ara</button><button type="button" class="btn b6 sm" id="hsBen" title="Konumum">📍</button><button type="button" class="btn b6 sm" id="hsKat">🛰 Uydu</button></div><div id="hsSon" style="font-size:13px;margin-top:4px"></div></div>'+
      '<div id="hsMap" style="height:56vh;min-height:300px;background:#e5e7eb"></div>'+
      '<div style="padding:10px 12px;display:flex;gap:8px;align-items:center"><div id="hsK" style="flex:1;font-size:13px;color:#667085">Firmanın kapısına/girişine dokunun; işareti sürükleyip düzeltebilirsiniz.</div><button type="button" class="btn b6" id="hsV" style="width:auto;margin:0">Vazgeç</button><button type="button" class="btn b1" id="hsOk" style="width:auto;margin:0" disabled>✓ Bu konumu kaydet</button></div>';
    document.body.appendChild(d);return d}
  window.haritaSec=async function(o){o=o||{};var d=hDlg();$("hsB").textContent=o.baslik||"Haritadan konum seçin";$("hsI").innerHTML=o.ipucu?"Mikro'daki adres (yalnız ipucu, eski olabilir): <b>"+e(o.ipucu)+"</b>":"";
    $("hsSon").textContent="";$("hsQ").value=o.ara||"";$("hsOk").disabled=true;d.showModal();
    try{await leaflet()}catch(er){$("hsSon").innerHTML='<span style="color:#b42318">'+e(er.message)+'</span>';return new Promise(function(ok){d.querySelector("#hsV").onclick=d.querySelector("#hsX").onclick=function(){d.close();ok(null)}})}
    var L=window.L,el=$("hsMap");el.innerHTML="";var m=L.map(el,{zoomControl:true,attributionControl:true}),secili=null,mk=null;
    var osm=L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}),
        uydu=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{maxZoom:19,attribution:"Esri"}),kat=osm;osm.addTo(m);
    var mer=o.merkez&&isFinite(+o.merkez.lat)?o.merkez:{lat:41.069802,lon:28.283961};m.setView([mer.lat,mer.lon],o.merkez?17:11);
    function koy(ll){secili={lat:Math.round(ll.lat*1e6)/1e6,lon:Math.round(ll.lng*1e6)/1e6};if(!mk){mk=L.marker(ll,{draggable:true}).addTo(m);mk.on("dragend",function(){koy(mk.getLatLng())})}else mk.setLatLng(ll);
      $("hsOk").disabled=false;$("hsK").innerHTML="Seçilen: <b>"+secili.lat+", "+secili.lon+"</b>"}
    if(o.merkez&&o.isaretli)koy({lat:mer.lat,lng:mer.lon});
    m.on("click",function(ev){koy(ev.latlng)});setTimeout(function(){m.invalidateSize()},150);
    $("hsKat").onclick=function(){m.removeLayer(kat);kat=kat===osm?uydu:osm;kat.addTo(m);$("hsKat").textContent=kat===osm?"🛰 Uydu":"🗺 Harita"};
    $("hsBen").onclick=function(){if(!navigator.geolocation)return;navigator.geolocation.getCurrentPosition(function(p){m.setView([p.coords.latitude,p.coords.longitude],18)},function(){$("hsSon").textContent="Konum alınamadı."},{enableHighAccuracy:true,timeout:12000})};
    async function ara(q){if(!q)return;$("hsSon").textContent="Aranıyor…";
      try{var r=await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=tr&accept-language=tr&q="+encodeURIComponent(q));var j=await r.json();
        if(!j.length){$("hsSon").textContent="Bulunamadı; daha kısa yazın (ör. sadece mahalle ve ilçe).";return}
        $("hsSon").innerHTML=j.map(function(x,i){return'<a href="#" data-i="'+i+'" style="display:block;padding:3px 0">'+e(String(x.display_name).slice(0,110))+'</a>'}).join("");
        $("hsSon").querySelectorAll("a").forEach(function(a){a.onclick=function(ev){ev.preventDefault();var x=j[+a.dataset.i];m.setView([+x.lat,+x.lon],17);$("hsSon").textContent="Harita oraya götürüldü — şimdi firmanın tam yerine dokunun."}});
        m.setView([+j[0].lat,+j[0].lon],16)}catch(er){$("hsSon").textContent="Arama yapılamadı."}}
    $("hsAra").onclick=function(){ara($("hsQ").value.trim())};$("hsQ").onkeydown=function(ev){if(ev.key==="Enter"){ev.preventDefault();ara($("hsQ").value.trim())}};
    if(!o.merkez&&o.ara)ara(o.ara);
    return new Promise(function(ok){var bit=function(v){try{m.remove()}catch(x){}d.close();ok(v)};
      $("hsOk").onclick=function(){bit(secili)};$("hsV").onclick=function(){bit(null)};$("hsX").onclick=function(){bit(null)};
      d.addEventListener("close",function kap(){d.removeEventListener("close",kap);ok(null)})})};
  function gUrl(k){return"https://www.google.com/maps?q="+k.lat+","+k.lon}

  /* ---------------- 🧩 adres tamamlama ekranı ---------------- */
  function dlg(){var d=$("dAdrTam");if(d)return d;d=document.createElement("dialog");d.id="dAdrTam";d.style.cssText="width:96vw;max-width:720px;border:0;border-radius:14px;padding:0";
    d.innerHTML='<div style="padding:12px 14px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center"><b style="font-size:17px">🧩 Adres tamamlama</b><button type="button" id="atX" style="font-size:20px;background:none;border:0">✕</button></div>'+
      '<div style="padding:8px 14px"><div id="atBil" style="font-size:13px;color:#667085"></div><div id="atTab" style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0"></div><input id="atQ" placeholder="🔍 Firma ara" style="margin-bottom:6px"></div>'+
      '<div id="atL" style="padding:0 14px 14px;max-height:62vh;overflow:auto"></div>';
    document.body.appendChild(d);d.querySelector("#atX").onclick=function(){d.close()};d.querySelector("#atQ").oninput=function(){ST.q=this.value;ciz()};return d}
  window.adrTamAc=async function(){var d=dlg();d.showModal();$("atL").innerHTML="Yükleniyor…";
    var db=firebase.database();
    try{ST.C=(await db.ref("cariler").once("value")).val()||{}}catch(er){ST.C={}}
    try{ST.G=(await db.ref("adresGizle").once("value")).val()||{}}catch(er){ST.G={}}
    try{ST.O=(await db.ref("adresOneri").once("value")).val()||{}}catch(er){ST.O={}}
    try{var v=(await db.ref("sevkAdresleri").once("value")).val()||{};ST.A=Object.keys(v).map(function(k){return Object.assign({id:k},v[k])})}catch(er){ST.A=(window.sAdr||[]).slice()}
    var z="";try{var ca=(await db.ref("ayarlar/cariAktar").once("value")).val();if(ca&&ca.z)z=new Date(ca.z).toLocaleDateString("tr-TR")}catch(er){}
    $("atBil").innerHTML='Mikro cari listesi: <b>'+Object.keys(ST.C).length+'</b> cari'+(z?' (aktarım '+z+')':'')+' • kayıtlı adres: <b>'+ST.A.length+'</b>. Hiçbir adres kendiliğinden kaydedilmez; konumu haritada siz işaretlersiniz.';
    hesapla();ciz()};
  var H={es:[],yok:[],kon:[],wp:[]};
  function hesapla(){var C=ST.C,A=ST.A,bagli={},bir=Date.now()-400*864e5;
    A.forEach(function(a){if(a.cariKod)bagli[a.cariKod]=a});
    H.es=[];H.yok=[];
    Object.keys(C).forEach(function(k){var c=C[k];if(!c||c.tur!=="m"||bagli[c.kod]||ST.G[k])return;
      var en=null,eb=0;A.forEach(function(a){if(a.cariKod||(a.degil&&a.degil[k]))return;var b=benz(c.ad,a.ad);if(b>eb){eb=b;en=a}});
      if(en&&eb>=0.6)H.es.push({k:k,c:c,a:en,b:eb});else if(!c.son||Date.parse(c.son)>=bir)H.yok.push({k:k,c:c})});
    H.es.sort(function(x,y){return y.b-x.b});H.yok.sort(function(x,y){return String(y.c.son||"").localeCompare(String(x.c.son||""))});
    H.kon=A.filter(function(a){return!konum(a)}).sort(function(x,y){return String(x.ad).localeCompare(String(y.ad),"tr")});
    var O=ST.O||{};H.wp=Object.keys(O).map(function(k){var o=Object.assign({id:k},O[k]),en=null,eb=0;A.forEach(function(a){var b=benz(o.ad,a.ad);if(b>eb){eb=b;en=a}});o.kayitli=eb>=0.75?en:null;return o})
      .sort(function(x,y){return(!!y.konum-!!x.konum)||(!!x.kayitli-!!y.kayitli)||String(y.z||"").localeCompare(String(x.z||""))});
    H.kon.forEach(function(a){a._wp=null;var eb=0;H.wp.forEach(function(o){if(!o.konum)return;var b=benz(a.ad,o.ad);if(b>=0.75&&b>eb){eb=b;a._wp=o}})})}
  function ciz(){var T=[["es","🔗 Eşleşme onayı",H.es.length],["wp","📥 WhatsApp'tan",H.wp.length],["yok","➕ Adresi olmayan müşteriler",H.yok.length],["kon","📍 Konumu olmayan adresler",H.kon.length]];
    $("atTab").innerHTML=T.map(function(t){return'<button type="button" class="btn '+(ST.sek===t[0]?"b1":"b6")+' sm" data-s="'+t[0]+'">'+t[1]+' ('+t[2]+')</button>'}).join("");
    $("atTab").querySelectorAll("[data-s]").forEach(function(b){b.onclick=function(){ST.sek=b.dataset.s;ciz()}});
    var q=nrm(ST.q),f=function(s){return!q||nrm(s).indexOf(q)>=0},h="";
    if(ST.sek==="es"){var L=H.es.filter(function(x){return f(x.c.ad+" "+x.a.ad)});
      h='<div style="font-size:13px;color:#667085;margin-bottom:6px">Mikro\'daki cari ile kayıtlı adres AYNI firma mı? Onaylarsanız bağlanır; tahsilatta ve rotada cari adı her zaman bu adrese gider.</div>'+
        (L.length?L.map(function(x){return'<div style="border:1px solid #e5e7eb;border-radius:10px;padding:8px 10px;margin-bottom:6px"><div>🧾 Mikro: <b>'+e(x.c.ad)+'</b> <span style="color:#667085">'+e([x.c.ilce,x.c.il].filter(Boolean).join(" / "))+'</span></div><div>📍 Kayıtlı: <b>'+e(x.a.ad)+'</b></div><div style="display:flex;gap:6px;margin-top:6px"><button type="button" class="btn b3 sm" data-ev="'+e(x.k)+'" data-id="'+e(x.a.id)+'">✓ Aynı firma</button><button type="button" class="btn b6 sm" data-ha="'+e(x.k)+'" data-id="'+e(x.a.id)+'">✗ Değil</button></div></div>'}).join(""):'<div class="empty">Onay bekleyen eşleşme yok.</div>')}
    else if(ST.sek==="wp"){L=H.wp.filter(function(o){return f(o.ad)}).slice(0,200);
      h='<div style="font-size:13px;color:#667085;margin-bottom:6px">WhatsApp «Mag Adresler» grubunda paylaşılmış konumlar. Doğruysa «Kaydet» deyin (konumu yoksa haritada işaretlersiniz); eski/gereksizse silin. Benzer adı zaten kayıtlı olanlar en altta.</div>'+
        (L.length?L.map(function(o){return'<div style="border:1px solid #e5e7eb;border-radius:10px;padding:8px 10px;margin-bottom:6px"><b>'+e(o.ad||"(adsız konum)")+'</b> <span style="color:#667085;font-size:13px">'+(o.z?e(o.z.split("-").reverse().join(".")):"")+(o.kim?' • '+e(o.kim):'')+'</span><div style="font-size:13px">'+(o.konum?'<span style="color:#16a34a">📍 konumu var</span>':'<span style="color:#b45309">konum linkten çıkmadı — kaydederken haritada işaretleyin</span>')+(o.kayitli?' • <span style="color:#b42318">benzer kayıtlı: '+e(o.kayitli.ad)+'</span>':'')+'</div><div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap"><button type="button" class="btn b1 sm" data-wk="'+e(o.id)+'">✓ Adres defterine kaydet</button><button type="button" class="btn b7 sm" data-wa="'+e(o.id)+'">🗺 Linki aç</button><button type="button" class="btn b6 sm" data-ws="'+e(o.id)+'">🗑 Gereksiz</button></div></div>'}).join("")+(H.wp.length>200?'<div class="empty">İlk 200 gösteriliyor; aramayı kullanın.</div>':''):'<div class="empty">WhatsApp önerisi kalmadı 👍</div>')}
    else if(ST.sek==="yok"){L=H.yok.filter(function(x){return f(x.c.ad)}).slice(0,150);
      h='<div style="font-size:13px;color:#667085;margin-bottom:6px">Son 1 yılda hareketi olan, kayıtlı sevk adresi olmayan müşteriler (en son hareket eden üstte). «Haritadan seç» ile konumu işaretleyip kaydedin; sevkiyat yapılmayanları gizleyin.</div>'+
        (L.length?L.map(function(x){var c=x.c;return'<div style="border:1px solid #e5e7eb;border-radius:10px;padding:8px 10px;margin-bottom:6px"><b>'+e(c.ad)+'</b> <span style="color:#667085;font-size:13px">'+e([c.ilce,c.il].filter(Boolean).join(" / "))+(c.son?' • son hareket '+e(c.son.split("-").reverse().join(".")):'')+'</span>'+(c.adres?'<div style="font-size:13px;color:#667085">Mikro adresi: '+e(c.adres)+'</div>':'')+'<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap"><button type="button" class="btn b1 sm" data-yeni="'+e(x.k)+'">📍 Haritadan seç ve kaydet</button><button type="button" class="btn b6 sm" data-gz="'+e(x.k)+'">🙈 Sevkiyat yok, gizle</button></div></div>'}).join("")+(H.yok.length>150?'<div class="empty">İlk 150 gösteriliyor; aramayı kullanın.</div>':''):'<div class="empty">Hepsi tamam 👍</div>')}
    else{L=H.kon.filter(function(a){return f(a.ad)});
      h='<div style="font-size:13px;color:#667085;margin-bottom:6px">Bu adreslerin harita linkinden konum çıkarılamadı ya da linki yok. Haritada işaretleyin.</div>'+
        (L.length?L.map(function(a){return'<div style="border:1px solid #e5e7eb;border-radius:10px;padding:8px 10px;margin-bottom:6px;display:flex;justify-content:space-between;gap:6px;align-items:center;flex-wrap:wrap"><span><b>'+e(a.ad)+'</b>'+(a.adres?'<br><small style="color:#667085">'+e(a.adres)+'</small>':'')+(a._wp?'<br><small style="color:#16a34a">💡 WhatsApp\'ta konumu var: '+e(a._wp.ad)+'</small>':'')+'</span><span style="display:flex;gap:6px">'+(a._wp?'<button type="button" class="btn b3 sm" data-wu="'+e(a.id)+'">💡 Uygula</button>':'')+'<button type="button" class="btn b1 sm" data-kon="'+e(a.id)+'">📍 Haritadan seç</button></span></div>'}).join(""):'<div class="empty">Bütün kayıtlı adreslerin konumu var 👍</div>')}
    var l=$("atL");l.innerHTML=h;
    l.querySelectorAll("[data-ev]").forEach(function(b){b.onclick=function(){bagla(b.dataset.ev,b.dataset.id,b)}});
    l.querySelectorAll("[data-ha]").forEach(function(b){b.onclick=function(){degil(b.dataset.ha,b.dataset.id,b)}});
    l.querySelectorAll("[data-yeni]").forEach(function(b){b.onclick=function(){yeni(b.dataset.yeni)}});
    l.querySelectorAll("[data-gz]").forEach(function(b){b.onclick=function(){gizle(b.dataset.gz,b)}});
    l.querySelectorAll("[data-wk]").forEach(function(b){b.onclick=function(){wpKaydet(b.dataset.wk,b)}});
    l.querySelectorAll("[data-wa]").forEach(function(b){b.onclick=function(){var o=ST.O[b.dataset.wa];if(o)window.open(o.link,"_blank","noopener")}});
    l.querySelectorAll("[data-ws]").forEach(function(b){b.onclick=function(){wpSil(b.dataset.ws).then(function(){hesapla();ciz()})}});
    l.querySelectorAll("[data-wu]").forEach(function(b){b.onclick=function(){var a=ST.A.find(function(x){return x.id===b.dataset.wu});if(a&&a._wp)wpUygula(a,b)}});
    l.querySelectorAll("[data-kon]").forEach(function(b){b.onclick=function(){var a=ST.A.find(function(x){return x.id===b.dataset.kon});if(a)konumSec(a)}})}
  function izinYok(){alert("Adres kaydetme yetkiniz yok (yönetici, depo ya da sevkiyat).");return true}
  async function bagla(k,id,b){if(!yaz()&&izinYok())return;b.disabled=true;var c=ST.C[k];
    try{await firebase.database().ref("sevkAdresleri/"+id).update({cariKod:c.kod,duzenleyen:String((rec&&rec.ad)||"")});var a=ST.A.find(function(x){return x.id===id});if(a)a.cariKod=c.kod;hesapla();ciz();toast("✓ Bağlandı: "+c.ad)}
    catch(er){b.disabled=false;alert("Kaydedilemedi: "+(er&&er.message||er))}}
  async function degil(k,id,b){b.disabled=true;try{await firebase.database().ref("sevkAdresleri/"+id+"/degil/"+k).set(true);var a=ST.A.find(function(x){return x.id===id});if(a){a.degil=a.degil||{};a.degil[k]=true}hesapla();ciz()}catch(er){b.disabled=false;alert("Kaydedilemedi: "+(er&&er.message||er))}}
  async function gizle(k,b){if(!confirm((ST.C[k]||{}).ad+" listeden gizlensin mi? (Bu müşteriye sevkiyat yapılmıyor)"))return;b.disabled=true;
    try{await firebase.database().ref("adresGizle/"+k).set(true);ST.G[k]=true;hesapla();ciz()}catch(er){b.disabled=false;alert("Kaydedilemedi: "+(er&&er.message||er))}}
  async function yeni(k){if(!yaz()&&izinYok())return;var c=ST.C[k];if(!c)return;
    var p=await window.haritaSec({baslik:"📍 "+c.ad,ipucu:[c.adres,c.ilce,c.il].filter(Boolean).join(", "),ara:[c.ilce,c.il].filter(Boolean).join(" ")});if(!p)return;
    var ad=prompt("Adres defterinde görünecek ad:",c.ad);if(ad===null)return;ad=String(ad).trim()||c.ad;
    var acik=prompt("Açık adres (isteğe bağlı; Mikro'daki yazıldı, düzeltebilirsiniz):",[c.adres,c.ilce,c.il].filter(Boolean).join(", "));
    var u=gUrl(p),o={ad:ad.slice(0,100),haritaUrl:u,konum:{lat:p.lat,lon:p.lon,u:u},cariKod:c.kod,sehir:[c.ilce,c.il].filter(Boolean).join(" / ").slice(0,60),tel:String(c.tel||"").slice(0,40),adres:String(acik||"").trim().slice(0,300),yetkili:"",tel2:"",not:"",
      ekleyen:String((rec&&rec.ad)||"?")+(rec&&rec.rol?" ("+rec.rol+")":""),ekleyenUid:firebase.auth().currentUser.uid,eklenmeTarihi:firebase.database.ServerValue.TIMESTAMP};
    try{var r=firebase.database().ref("sevkAdresleri").push();await r.set(o);ST.A.push(Object.assign({id:r.key},o));hesapla();ciz();toast("✓ Adres kaydedildi: "+o.ad)}catch(er){alert("Kaydedilemedi: "+(er&&er.message||er))}}
  async function konumSec(a){if(!yaz()&&izinYok())return;var k=konum(a);
    var p=await window.haritaSec({baslik:"📍 "+a.ad,merkez:k,isaretli:!!k,ipucu:a.adres||"",ara:a.adres||a.sehir||""});if(!p)return;
    var u=a.haritaUrl&&!k?a.haritaUrl:gUrl(p);
    try{await firebase.database().ref("sevkAdresleri/"+a.id).update({haritaUrl:u,konum:{lat:p.lat,lon:p.lon,u:u},duzenleyen:String((rec&&rec.ad)||"")});a.haritaUrl=u;a.konum={lat:p.lat,lon:p.lon,u:u};hesapla();if($("dAdrTam")&&$("dAdrTam").open)ciz();toast("✓ Konum kaydedildi: "+a.ad)}
    catch(er){alert("Kaydedilemedi: "+(er&&er.message||er))}}
  window.adrKonumSec=konumSec;
  async function wpSil(id){try{await firebase.database().ref("adresOneri/"+id).remove()}catch(er){}delete ST.O[id]}
  function cariBul(ad){var C=ST.C,en=null,eb=0;Object.keys(C).forEach(function(k){var c=C[k];if(!c||c.tur!=="m")return;var b=benz(ad,c.ad);if(b>eb){eb=b;en=c}});return eb>=0.75?en:null}
  async function wpKaydet(id,b){if(!yaz()&&izinYok())return;var o=ST.O[id];if(!o)return;
    var ad=prompt("Adres defterinde görünecek ad:",o.ad||"");if(ad===null)return;ad=String(ad).trim();if(!ad){alert("Ad yazın.");return}
    var k=o.konum&&isFinite(+o.konum.lat)?{lat:+o.konum.lat,lon:+o.konum.lon}:null;
    if(!k){k=await window.haritaSec({baslik:"📍 "+ad,ara:ad});if(!k)return}
    var c=cariBul(ad),bag=c&&confirm("Mikro'daki «"+c.ad+"» carisiyle bağlansın mı?");
    var u=o.link||gUrl(k),x={ad:ad.slice(0,100),haritaUrl:u,konum:{lat:k.lat,lon:k.lon,u:u},sehir:"",tel:"",adres:"",yetkili:"",tel2:"",not:"",
      ekleyen:String((rec&&rec.ad)||"?")+(rec&&rec.rol?" ("+rec.rol+")":""),ekleyenUid:firebase.auth().currentUser.uid,eklenmeTarihi:firebase.database.ServerValue.TIMESTAMP};
    if(bag)x.cariKod=c.kod;
    try{b.disabled=true;var r=firebase.database().ref("sevkAdresleri").push();await r.set(x);ST.A.push(Object.assign({id:r.key},x));await wpSil(id);hesapla();ciz();toast("✓ Adres kaydedildi: "+x.ad)}
    catch(er){b.disabled=false;alert("Kaydedilemedi: "+(er&&er.message||er))}}
  async function wpUygula(a,b){var o=a._wp;if(!confirm("«"+a.ad+"» adresine WhatsApp'taki «"+o.ad+"» konumu yazılsın mı?"))return;b.disabled=true;
    var u=a.haritaUrl||o.link,k={lat:+o.konum.lat,lon:+o.konum.lon,u:u},up={konum:k,duzenleyen:String((rec&&rec.ad)||"")};if(!a.haritaUrl)up.haritaUrl=u;
    try{await firebase.database().ref("sevkAdresleri/"+a.id).update(up);a.konum=k;if(!a.haritaUrl)a.haritaUrl=u;await wpSil(o.id);hesapla();ciz();toast("✓ Konum uygulandı: "+a.ad)}
    catch(er){b.disabled=false;alert("Kaydedilemedi: "+(er&&er.message||er))}}
  window.adrKonumRozet=function(a){return konum(a)?'<span class="badge" style="background:#16a34a">📍 konum ✓</span>':'<span class="badge" style="background:#b45309">⚠ konum yok</span>'};
  function dugme(){var v=$("vAdr"),s=$("aSay");if(!v||!s||$("aTam"))return;var b=document.createElement("button");b.className="btn b4";b.id="aTam";b.style.margin="-4px 0 10px";b.textContent="🧩 Adres tamamlama (Mikro carileri, haritadan konum)";b.onclick=window.adrTamAc;v.insertBefore(b,s)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",dugme);else dugme();
})();
