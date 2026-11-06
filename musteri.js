/* musteri.js — 👥 MÜŞTERİLERİM (v142)
   Ana menüde «👥 MÜŞTERİLERİM» (yönetici + ofis/depo = sevForm; şoför ve operatör görmez). Bütün müşteriler tek listede:
   Mikro carileri (cariler/, tur m) + Mikro'da olmayan elle eklenenler (musteriler/{push}). Her müşteri için:
     • KENDİ KONUMU: haritadan seçilir/değiştirilir (açık adres yazısı değil) → bir sevk adresi kaydı (sevkAdresleri, cariKod ile bağlı).
     • TESLİM YERİ: «Kendi adresi» ya da «Ambar / başka adres» (kayıtlı sevk adreslerinden; yeni ambar haritadan eklenir) + teslim notu.
   Veri: musteriler/{120_01_050 | push} {ad, cariKod?, kendiId?, teslimId?, teslimNot?, yetkili?, tel?, not?, z, duzenleyen}.
   ÇÖZÜCÜ (her yerde aynı): window.musteriBul(ad) → müşteri; window.musteriTeslim(ad,{kendi}) → {musteri, adres(sevkAdresleri kaydı), ambar, not}.
   Kullanan yerler: iş emri formu (müşteri listesi + teslim yeri bilgisi), iş emri → depo aktarımı (urunler adres/harita/adresAd),
   «Sevk listesine al» (adres boşsa doldurur), 🤖 rota (sevk: teslim yeri; tahsilat/talimat: müşterinin kendi yeri).
   Adres değişirse yalnız buradan değiştirilir; rota her açılışta güncel kaydı kullanır. */
(function(){
  var $=function(i){return document.getElementById(i)};
  function e(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  function nrm(x){return(typeof trn==="function"?trn(x):String(x||"").toLowerCase()).replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim()}
  var GN=/\b(ltd|sti|st|a s|as|tic|san|ve|ins|paz|sanayi|ticaret|limited|sirketi|anonim|ith|ihr|dis|mam|gida|ambalaj|plastik|unlu|mamulleri|mamuleri|insaat|pazarlama|tekstil|ekmek|firin|kuruyemis|matbaacilik|end|urn|amb|tem|urunleri|tur|grup|group|depo|ambar|ambari|x)\b/g;
  function cek(x){return nrm(x).replace(GN," ").replace(/\b\d+\b/g," ").replace(/\s+/g," ").trim()}
  function benz(a,b){a=cek(a);b=cek(b);if(!a||!b)return 0;if(a===b)return 1;var A=a.split(" "),B=b.split(" ");
    var es=function(w,x){return w===x||(w.length>=4&&x.length>=4&&(w.indexOf(x)===0||x.indexOf(w)===0))};
    var o=A.filter(function(w){return B.some(function(x){return es(w,x)})}).length;if(!o)return 0;
    var ilk=es(A[0],B[0])&&A[0].length>=4;return Math.min(0.99,(o/Math.min(A.length,B.length))*0.6+(ilk?0.35:0)+(o>=2?0.1:0))}
  var V={M:{},C:{},B:null,A:{},hazir:false,ref:[]};
  var AMB=/ambar|nakliy|kargo|lojistik|antrepo|depo|trans/;
  function izin(){return typeof user!=="undefined"&&user&&typeof rec!=="undefined"&&rec&&rec.onay===true&&(typeof isAdmin==="function"&&isAdmin()||typeof sevForm==="function"&&sevForm())}
  function yaz(){return typeof isAdmin==="function"&&isAdmin()||!!(rec&&rec.onay&&(rec.izin&&rec.izin.sevk===true||(!rec.izin||rec.izin.sevk!==false)&&(rec.rol==="Depo Görevlisi"||rec.rol==="Sevkiyat Sorumlusu")))}
  function konum(a){return a&&window.adrKonum?window.adrKonum(a):null}
  /* ---------- veri (girişten sonra canlı) ---------- */
  function bagla(){if(V.ref.length||!izin())return;var db=firebase.database(),on=function(p,f){var r=db.ref(p);V.ref.push(r);r.on("value",function(s){f(s.val()||{});V.hazir=true;if($("dMus")&&$("dMus").open)liste()},function(){f({})})};
    on("musteriler",function(v){V.M=v});on("cariler",function(v){V.C=v});on("sevkAdresleri",function(v){V.A=v});
    db.ref("cariBakiye").once("value").then(function(s){V.B=s.val()||{}},function(){V.B=null})}
  function birak(){V.ref.forEach(function(r){try{r.off()}catch(x){}});V.ref=[];V.hazir=false}
  /* tüm müşteriler: Mikro (tur m) + elle */
  function hepsi(){var o=[],C=V.C,M=V.M;
    Object.keys(C).forEach(function(k){var c=C[k];if(c&&c.tur==="m")o.push({key:k,ad:(M[k]&&M[k].ad)||c.ad,kod:c.kod,c:c,m:M[k]||{}})});
    Object.keys(M).forEach(function(k){if(C[k])return;var m=M[k];if(m&&m.ad)o.push({key:k,ad:m.ad,kod:m.cariKod||"",c:null,m:m})});
    return o}
  function adr(id){return id&&V.A[id]?Object.assign({id:id},V.A[id]):null}
  function kendi(x){if(!x)return null;var a=adr(x.m.kendiId);if(a)return a;if(!x.kod)return null;var en=null;
    Object.keys(V.A).forEach(function(id){var b=V.A[id];if(b&&b.cariKod===x.kod){var o=Object.assign({id:id},b);if(!en||(!konum(en)&&konum(o)))en=o}});return en}
  function teslim(x){var t=adr(x&&x.m.teslimId);return t||kendi(x)}
  window.musteriBul=function(ad){if(!ad)return null;var L=hepsi(),q=cek(ad),n=nrm(ad);if(!q&&!n)return null;
    var t=L.find(function(x){return nrm(x.ad)===n})||L.find(function(x){return x.c&&nrm(x.c.ad)===n})||L.find(function(x){return cek(x.ad)===q});if(t)return t;
    var en=null,eb=0;L.forEach(function(x){var b=benz(ad,x.ad);if(b>eb){eb=b;en=x}});return eb>=0.75?en:null};
  window.musteriTeslim=function(ad,o){var x=window.musteriBul(ad);if(!x)return null;var k=kendi(x),t=o&&o.kendi?k:teslim(x);
    return{musteri:x,adres:t,ambar:!!(t&&k&&t.id!==k.id)||!!(t&&!k&&x.m.teslimId),not:x.m.teslimNot||""}};
  window.musteriTeslimAlan=function(ad){var r=window.musteriTeslim(ad);if(!r||!r.adres)return{adres:"",haritaUrl:""};var a=r.adres;
    return{adres:String(a.adres||a.ad||"").slice(0,300)+(r.not?" — "+r.not:""),haritaUrl:String(a.haritaUrl||"").slice(0,500),adresAd:String(a.ad||"").slice(0,100)}};
  /* ---------- liste ---------- */
  var F={q:"",f:"aktif"};
  function dlg(){var d=$("dMus");if(d)return d;d=document.createElement("dialog");d.id="dMus";d.style.cssText="width:96vw;max-width:760px;border:0;border-radius:14px;padding:0";
    d.innerHTML='<div style="padding:12px 14px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center"><b style="font-size:18px">👥 Müşterilerim</b><span><button type="button" class="btn b1 sm" id="musYeni" style="width:auto;margin:0 8px 0 0">➕ Yeni müşteri</button><button type="button" id="musX" style="font-size:20px;background:none;border:0">✕</button></span></div>'+
      '<div style="padding:8px 14px"><input id="musQ" placeholder="🔍 Müşteri ara"><div id="musF" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"></div><div id="musS" style="font-size:13px;color:#667085;margin-top:4px"></div></div><div id="musL" style="padding:0 14px 14px;max-height:66vh;overflow:auto"></div>';
    document.body.appendChild(d);$("musX").onclick=function(){d.close()};$("musQ").oninput=function(){F.q=this.value;liste()};$("musYeni").onclick=yeniMus;return d}
  window.musAc=function(){if(!izin()){toast("Bu bölüm yönetici ve ofis içindir.");return}bagla();var d=dlg();d.showModal();$("musL").innerHTML=V.hazir?"":"Yükleniyor…";liste()};
  function durum(x){var k=kendi(x),t=teslim(x),kk=konum(k);return{k:k,kk:kk,t:t,tk:konum(t),amb:!!(t&&(!k||t.id!==k.id))}}
  function liste(){if(!$("musL"))return;var bir=Date.now()-400*864e5,L=hepsi().map(function(x){x.d=durum(x);return x}),q=nrm(F.q);
    var FL=[["aktif","Son 1 yıl aktif"],["eksik","📍 Konumu eksik"],["ambar","🚚 Ambara teslim"],["hepsi","Hepsi"]];
    var say=function(f){return L.filter(function(x){return filt(x,f)}).length};
    function filt(x,f){if(f==="eksik")return!x.d.tk;if(f==="ambar")return x.d.amb;if(f==="aktif")return!x.c||!x.c.son||Date.parse(x.c.son)>=bir;return true}
    $("musF").innerHTML=FL.map(function(f){return'<button type="button" class="btn '+(F.f===f[0]?"b1":"b6")+' sm" data-f="'+f[0]+'">'+f[1]+' ('+say(f[0])+')</button>'}).join("");
    $("musF").querySelectorAll("[data-f]").forEach(function(b){b.onclick=function(){F.f=b.dataset.f;liste()}});
    var G=L.filter(function(x){return filt(x,F.f)&&(!q||nrm(x.ad+" "+(x.c&&x.c.ad||"")+" "+(x.c&&x.c.ilce||"")).indexOf(q)>=0)}).sort(function(a,b){return String(a.ad).localeCompare(String(b.ad),"tr")});
    $("musS").textContent=G.length+" müşteri • yeşil: teslim yerinin konumu var, kırmızı: haritadan seçilmeli";
    $("musL").innerHTML=G.slice(0,400).map(function(x){var d=x.d,c=x.c||{};
      return'<div data-k="'+e(x.key)+'" style="border:1px solid #e5e7eb;border-left:5px solid '+(d.tk?"#16a34a":"#dc2626")+';border-radius:10px;padding:8px 10px;margin-bottom:6px;cursor:pointer"><b>'+e(x.ad)+'</b> <span style="color:#667085;font-size:13px">'+e([c.ilce,c.il].filter(Boolean).join(" / "))+(x.kod?"":" • Mikro'da yok")+'</span><div style="font-size:13px">'+
        (d.amb?'🚚 Teslim: <b>'+e(d.t.ad)+'</b>'+(d.tk?"":' <span style="color:#dc2626">(konum yok)</span>'):d.kk?'<span style="color:#16a34a">📍 Kendi adresine teslim</span>':'<span style="color:#dc2626">📍 Konum seçilmemiş</span>')+(x.m.teslimNot?' • '+e(x.m.teslimNot):'')+'</div></div>'}).join("")+(G.length>400?'<div class="empty">İlk 400 gösteriliyor; arayın.</div>':'')+(G.length?'':'<div class="empty">Kayıt yok.</div>');
    $("musL").querySelectorAll("[data-k]").forEach(function(r){r.onclick=function(){detay(r.dataset.k)}})}
  /* ---------- müşteri kartı ---------- */
  function bul(key){return hepsi().find(function(x){return x.key===key})}
  function ambarlar(){return Object.keys(V.A).map(function(id){return Object.assign({id:id},V.A[id])}).filter(function(a){return a&&a.ad}).sort(function(a,b){var x=AMB.test(nrm(a.ad))?0:1,y=AMB.test(nrm(b.ad))?0:1;return x-y||String(a.ad).localeCompare(String(b.ad),"tr")})}
  function ddlg(){var d=$("dMusD");if(d)return d;d=document.createElement("dialog");d.id="dMusD";d.style.cssText="width:96vw;max-width:620px;border:0;border-radius:14px;padding:0";document.body.appendChild(d);return d}
  function detay(key){var x=bul(key);if(!x)return;x.d=durum(x);var c=x.c||{},m=x.m,d=ddlg(),adm=typeof isAdmin==="function"&&isAdmin(),b=V.B&&V.B[key];
    var gl=function(k){return k?'<a href="https://www.google.com/maps?q='+k.lat+','+k.lon+'" target="_blank" rel="noopener">🗺 Haritada gör</a>':''};
    var amb=ambarlar(),tId=m.teslimId||"";
    d.innerHTML='<div style="padding:12px 14px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;gap:8px"><b style="font-size:17px">'+e(x.ad)+'</b><button type="button" id="mdX" style="font-size:20px;background:none;border:0">✕</button></div><div style="padding:10px 14px;max-height:78vh;overflow:auto">'+
      (x.c?'<div style="background:#f8fafc;border-radius:10px;padding:8px 10px;font-size:14px"><b>🧾 Mikro</b> '+e(c.kod)+'<br>'+e(c.ad)+(c.adres?'<br><span style="color:#667085">'+e(c.adres)+'</span>':'')+(c.ilce||c.il?'<br>'+e([c.ilce,c.il].filter(Boolean).join(" / ")):'')+(c.tel?'<br>☎ '+e(c.tel):'')+(c.son?'<br>Son hareket: '+e(c.son.split("-").reverse().join("."))+(c.sonTur?' ('+e(c.sonTur)+')':''):'')+(b?'<br>💰 Açık hesap: <b>'+Math.round(+b.acik||0).toLocaleString("tr-TR")+' ₺</b>'+(+b.cek?' • çek '+Math.round(+b.cek).toLocaleString("tr-TR")+' ₺':''):'')+'</div>':'<div style="color:#667085;font-size:13px">Mikro\'da kaydı yok (elle eklenmiş müşteri).</div>')+
      '<h4 style="margin:12px 0 4px">📍 Müşterinin kendi konumu</h4>'+(x.d.k?'<div>'+e(x.d.k.ad)+' — '+(x.d.kk?'<span style="color:#16a34a">konum ✓</span> '+gl(x.d.kk):'<span style="color:#dc2626">konum yok</span>')+'</div>':'<div style="color:#dc2626">Seçilmemiş</div>')+
      '<div style="display:flex;gap:6px;margin-top:6px"><input id="mdL" placeholder="🔗 Google Maps linkini yapıştırın" style="flex:1;min-width:0;margin:0"><button type="button" class="btn b3 sm" id="mdLk" style="width:auto;margin:0">Linkten kaydet</button></div><div id="mdLs" style="font-size:12px"></div>'+
      '<button type="button" class="btn b6 sm" id="mdKon" style="margin-top:6px">📍 '+(x.d.kk?'Konumu haritadan değiştir':'Haritadan seç')+'</button>'+
      '<h4 style="margin:14px 0 4px">🚚 Teslim yeri</h4><label style="display:flex;gap:6px;align-items:center"><input type="radio" name="mdT" value="k"'+(tId?'':' checked')+' style="width:auto"> Müşterinin kendi adresi</label><label style="display:flex;gap:6px;align-items:center"><input type="radio" name="mdT" value="a"'+(tId?' checked':'')+' style="width:auto"> Ambar / başka adres</label>'+
      '<div id="mdA" style="'+(tId?'':'display:none')+'"><input id="mdAq" placeholder="🔍 Ambar ara" style="margin:4px 0"><select id="mdAs" size="6" style="height:auto">'+amb.map(function(a){return'<option value="'+e(a.id)+'"'+(a.id===tId?" selected":"")+'>'+(konum(a)?"📍 ":"⚠ ")+e(a.ad)+'</option>'}).join("")+'</select><button type="button" class="btn b6 sm" id="mdAy" style="margin-top:4px">➕ Listede yok: yeni ambar/adres haritadan ekle</button></div>'+
      '<label style="margin-top:8px">Teslim notu (ör. «Antalya ambarına, alıcı adı …», «sabah 9\'dan önce»)</label><input id="mdN" value="'+e(m.teslimNot||"")+'">'+
      '<h4 style="margin:14px 0 4px">☎ İletişim ve not</h4><input id="mdY" placeholder="Yetkili kişi" value="'+e(m.yetkili||"")+'"><input id="mdTel" placeholder="Telefon" value="'+e(m.tel||c.tel||"")+'" style="margin-top:6px"><textarea id="mdNot" rows="2" placeholder="Not" style="margin-top:6px">'+e(m.not||"")+'</textarea>'+
      '<div id="mdE" style="color:#b42318;font-size:13px"></div><div style="display:flex;gap:8px;margin-top:10px"><button type="button" class="btn b6" id="mdV" style="margin:0">Vazgeç</button><button type="button" class="btn b1" id="mdK" style="margin:0">💾 Kaydet</button></div></div>';
    d.showModal();
    $("mdX").onclick=$("mdV").onclick=function(){d.close()};
    d.querySelectorAll('[name="mdT"]').forEach(function(r){r.onchange=function(){$("mdA").style.display=r.value==="a"&&r.checked?"":"none"}});
    $("mdAq").oninput=function(){var q=nrm(this.value);Array.prototype.forEach.call($("mdAs").options,function(o){o.hidden=!!q&&nrm(o.textContent).indexOf(q)<0})};
    $("mdAy").onclick=async function(){var ad=prompt("Ambar / adres adı (ör. Akdeniz Nakliyat Antalya Ambarı):","");if(!ad)return;
      var l=prompt("Google Maps linkini yapıştırın (boş bırakırsanız harita açılır):",""),p=null;if(l&&l.trim()){p=window.linktenKonum?await window.linktenKonum(l):null;if(!p)alert("Linkten konum çıkmadı; haritadan seçin.")}
      if(!p){l="";p=await window.haritaSec({baslik:"📍 "+ad,ara:ad});if(!p)return}
      var id=await adresYaz(null,{ad:ad.trim().slice(0,100)},p,l);if(id){var o=document.createElement("option");o.value=id;o.textContent="📍 "+ad;o.selected=true;$("mdAs").insertBefore(o,$("mdAs").firstChild)}};
    $("mdLk").onclick=async function(){if(!yaz()){alert("Konum değiştirme yetkiniz yok.");return}var l=$("mdL").value.trim(),S=$("mdLs");if(!l){S.textContent="Linki yapıştırın.";return}S.textContent="Konum aranıyor…";
      var p=window.linktenKonum?await window.linktenKonum(l):null;
      if(!p){if(!/^https?:\/\//i.test(l)){S.innerHTML='<span style="color:#b42318">Geçerli bir link değil.</span>';return}
        var k0=x.d.k,db=firebase.database();try{var id0=k0&&k0.id;if(id0)await db.ref("sevkAdresleri/"+id0).update({haritaUrl:l.slice(0,500),konum:null,duzenleyen:String((rec&&rec.ad)||"")});
          else{var r0=db.ref("sevkAdresleri").push();await r0.set({ad:x.ad.slice(0,100),haritaUrl:l.slice(0,500),cariKod:x.kod||null,sehir:"",tel:"",adres:"",yetkili:"",tel2:"",not:"",ekleyen:String((rec&&rec.ad)||"?"),ekleyenUid:firebase.auth().currentUser.uid,eklenmeTarihi:firebase.database.ServerValue.TIMESTAMP});id0=r0.key;await musYaz(x,{kendiId:id0})}
          toast("✓ Link kaydedildi; konum bu gece otomatik bulunacak");detay(key)}catch(er){S.textContent="Kaydedilemedi: "+(er&&er.message||er)}return}
      var k=x.d.k,id=await adresYaz(k&&k.id,{ad:k?k.ad:x.ad,cariKod:x.kod||undefined},p,l);if(!id)return;if(!k||k.id!==id)await musYaz(x,{kendiId:id});
      toast("✓ Konum kaydedildi"+(p.yer?": "+p.yer:""));detay(key)};
    $("mdKon").onclick=async function(){if(!yaz()){alert("Konum değiştirme yetkiniz yok.");return}var k=x.d.k,kk=x.d.kk;
      var p=await window.haritaSec({baslik:"📍 "+x.ad+" — kendi konumu",merkez:kk,isaretli:!!kk,ipucu:c.adres?[c.adres,c.ilce,c.il].filter(Boolean).join(", "):"",ara:kk?"":[c.ilce,c.il].filter(Boolean).join(" ")||x.ad});if(!p)return;
      var id=await adresYaz(k&&k.id,{ad:k?k.ad:x.ad,cariKod:x.kod||undefined},p);if(!id)return;
      if(!k||k.id!==id)await musYaz(x,{kendiId:id});toast("✓ Konum kaydedildi");detay(key)};
    $("mdK").onclick=async function(){var t=d.querySelector('[name="mdT"]:checked').value,sec=$("mdAs").value;
      if(t==="a"&&!sec){$("mdE").textContent="Teslim edilecek ambarı/adresi seçin.";return}
      var o={teslimId:t==="a"?sec:null,teslimNot:$("mdN").value.trim().slice(0,200),yetkili:$("mdY").value.trim().slice(0,100),tel:$("mdTel").value.trim().slice(0,40),not:$("mdNot").value.trim().slice(0,500)};
      if(await musYaz(x,o)){d.close();toast("✓ Kaydedildi: "+x.ad);liste()}}}
  async function adresYaz(id,o,p,link){var u=String(link||"").trim().slice(0,500)||"https://www.google.com/maps?q="+p.lat+","+p.lon,db=firebase.database(),kn={lat:p.lat,lon:p.lon,u:u};if(p.yer)kn.yer=String(p.yer).slice(0,200);if(p.yaklasik)kn.yaklasik=true;
    try{if(id){await db.ref("sevkAdresleri/"+id).update({haritaUrl:u,konum:kn,duzenleyen:String((rec&&rec.ad)||"")});return id}
      var r=db.ref("sevkAdresleri").push(),x={ad:o.ad,haritaUrl:u,konum:kn,sehir:"",tel:"",adres:"",yetkili:"",tel2:"",not:"",ekleyen:String((rec&&rec.ad)||"?")+(rec&&rec.rol?" ("+rec.rol+")":""),ekleyenUid:firebase.auth().currentUser.uid,eklenmeTarihi:firebase.database.ServerValue.TIMESTAMP};
      if(o.cariKod)x.cariKod=o.cariKod;await r.set(x);return r.key}catch(er){alert("Kaydedilemedi: "+(er&&er.message||er));return null}}
  async function musYaz(x,o){var v=Object.assign({},x.m,o,{ad:String(x.ad).slice(0,100),z:firebase.database.ServerValue.TIMESTAMP,duzenleyen:String((rec&&rec.ad)||"").slice(0,100)});
    if(x.kod)v.cariKod=x.kod;Object.keys(v).forEach(function(k){if(v[k]===undefined||v[k]===""||v[k]===null)delete v[k]});
    try{await firebase.database().ref("musteriler/"+x.key).set(v);x.m=v;return true}catch(er){var E=$("mdE");if(E)E.textContent="Kaydedilemedi: "+(er&&er.message||er);else alert("Kaydedilemedi: "+(er&&er.message||er));return false}}
  async function yeniMus(){var ad=prompt("Müşteri adı (Mikro'da olmayan müşteri):","");if(!ad||!ad.trim())return;ad=ad.trim();
    var v=window.musteriBul(ad);if(v&&!confirm("«"+v.ad+"» zaten var. Yine de yeni müşteri açılsın mı?")){detay(v.key);return}
    var r=firebase.database().ref("musteriler").push();try{await r.set({ad:ad.slice(0,100),z:firebase.database.ServerValue.TIMESTAMP,duzenleyen:String((rec&&rec.ad)||"").slice(0,100)});V.M[r.key]={ad:ad};liste();detay(r.key)}catch(er){alert("Kaydedilemedi: "+(er&&er.message||er))}}
  /* ---------- iş emri formu: müşteri listesi + teslim yeri bilgisi ---------- */
  function isEmriKur(){var i=$("iMu");if(!i||i.dataset.mus)return;i.dataset.mus="1";var dl=document.createElement("datalist");dl.id="musDl";document.body.appendChild(dl);i.setAttribute("list","musDl");i.setAttribute("autocomplete","off");
    var b=document.createElement("div");b.id="iMuT";b.style.cssText="font-size:12px;margin-top:3px";i.parentNode.appendChild(b);
    var gun=function(){if(!V.hazir)bagla();dl.innerHTML=hepsi().slice(0,600).map(function(x){return'<option value="'+e(x.ad)+'">'}).join("");var v=i.value.trim();if(!v){b.innerHTML="";return}
      var r=window.musteriTeslim(v);if(!r){b.innerHTML='<span style="color:#b45309">⚠ Müşterilerim\'de bulunamadı — listeden seçin</span>';return}
      b.innerHTML=r.adres?(konum(r.adres)?'<span style="color:#16a34a">🚚 Teslim: '+e(r.adres.ad)+(r.ambar?' (ambar)':'')+' 📍</span>':'<span style="color:#b45309">🚚 Teslim: '+e(r.adres.ad)+' — konum yok</span>'):'<span style="color:#dc2626">📍 Teslim yeri seçilmemiş</span> <a href="#" id="iMuAc">ayarla</a>';
      var a=$("iMuAc");if(a)a.onclick=function(ev){ev.preventDefault();window.musAc();setTimeout(function(){detay(r.musteri.key)},300)}};
    i.addEventListener("input",gun);i.addEventListener("focus",gun);i.addEventListener("change",gun)}
  /* ---------- menü kartı ---------- */
  function dugme(){var g=izin();var b=$("mMus");if(!b){var ref=$("mYz")||document.querySelector('.menuBtn[data-go="is"]');if(!ref)return;
      b=document.createElement("button");b.className="menuBtn";b.id="mMus";b.type="button";b.style.background="#0e7490";b.innerHTML='<span class="ic">👥</span><div>MÜŞTERİLERİM<small>Bütün müşteriler, konum ve teslim yeri (ambar)</small></div>';b.onclick=window.musAc;ref.parentNode.insertBefore(b,ref.nextSibling)}
    b.classList.toggle("hide",!g);if(g){bagla();isEmriKur()}else if(!(typeof user!=="undefined"&&user))birak()}
  window.musteriTest={benz:benz,cek:cek,V:V,hepsi:hepsi};
  document.addEventListener("click",function(){setTimeout(dugme,80)},true);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",dugme);else dugme();
  setInterval(dugme,4000);
})();
