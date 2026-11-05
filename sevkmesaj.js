/* sevkmesaj.js — 💬 MESAJDAN SEVK (v140, DENEME — kullanıcı beğenmezse kaldırılacak: index.html script satırı + sw.js ASSETS + bu dosya)
   Sevkiyat › Hazır ürünler'in üstünde «💬 Mesajdan sevk listesine al». WhatsApp'taki gibi bir sevk mesajı yapıştırılır ya da söylenir
   («Güneli / Orta boy 300kg / Büyük boy 300kg», «Etaş Et … Antalya ambarına bırakılacak»).
   1) Müşteri ve teslim yeri YALNIZ KAYITLI SEVK ADRESLERİNDEN (yzmesaj.js adaylar; ambar/depo/nakliyat adlı aday teslim yeri önerilir).
   2) O müşterinin HAZIR ÜRÜNLERİ listelenir (urunler durum=hazir, müşteri adı benzerliği), işaretlenir.
   3) Araç + sevkiyat sorumlusu seçilip «Sevk listesine al» → durum sevk_edilecek (+ adres/harita teslim yerinden, mesaj nota eklenir), sorumluya bildirim.
   Hazır ürün yoksa: «📋 Talimat olarak gönder» (Talimat penceresi mesajla dolar) ya da İş emirleri › 💬 Mesajdan iş emri önerilir.
   Yeni ürün KAYDI AÇMAZ (sevk kaydı fotoğraf ister, kg iş emrinden gelir). Yetki: sevForm() (ofis/yönetici; şoför değil). */
(function(){
  var $=function(i){return document.getElementById(i)};
  function e(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  function Y(){return window.yzMesaj}
  function benz(a,b){var c=Y().cek;a=c(a);b=c(b);if(!a||!b)return 0;if(a===b)return 1;var A=a.split(" "),B=b.split(" "),o=A.filter(function(w){return B.some(function(x){return x===w||(w.length>=4&&x.indexOf(w)===0)||(x.length>=4&&w.indexOf(x)===0)})}).length;
    return o?Math.min(0.99,o/Math.min(A.length,B.length)*0.8+(A[0]===B[0]?0.2:0)):0}
  var AMBAR=/ambar|depo|nakliy|kargo|antrepo|lojistik/;
  var ST={m:"",ad:[],mus:null,yer:null,U:[],sec:{},sor:[]};
  function izin(){return typeof sevForm==="function"&&sevForm()&&typeof user!=="undefined"&&user}
  function dlg(){var d=$("dSevMsj");if(d)return d;d=document.createElement("dialog");d.id="dSevMsj";d.style.cssText="width:96vw;max-width:640px;border:0;border-radius:14px;padding:0;max-height:92vh";
    d.innerHTML='<div style="padding:12px 14px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center"><b style="font-size:17px">💬 Mesajdan sevk <span style="font-size:12px;color:#7c3aed">(deneme)</span></b><button type="button" id="smX" style="font-size:20px;background:none;border:0">✕</button></div>'+
      '<div style="padding:10px 14px;overflow:auto;max-height:80vh"><textarea id="smT" rows="5" placeholder="WhatsApp\'taki sevk mesajını yapıştırın ya da 🎤 ile söyleyin.&#10;Örn: Güneli&#10;Orta boy 300kg&#10;Büyük boy 300kg"></textarea>'+
      '<div style="display:flex;gap:6px"><button type="button" class="btn b6 sm" id="smSes">🎤 Söyle</button><button type="button" class="btn sm" id="smOk" style="background:#7c3aed">✨ Oku</button></div><div id="smS" style="margin-top:8px"></div></div>';
    document.body.appendChild(d);$("smX").onclick=function(){d.close()};$("smSes").onclick=function(){Y().dinle($("smT"),this)};$("smOk").onclick=oku;return d}
  window.sevMsjAc=function(){if(!izin()){toast("Mesajdan sevk yalnız ofis/yönetici içindir.");return}var d=dlg();$("smT").value="";$("smS").innerHTML="";d.showModal();$("smT").focus()};
  async function oku(){var m=$("smT").value.trim(),S=$("smS");if(!m){S.textContent="Önce mesajı yazın.";return}ST.m=m;S.textContent="Okunuyor…";
    var A=await Y().adaylar(m);ST.ad=A.map(function(x){return x.a});
    var g=null;try{g=await Y().gemini(m)}catch(er){}if(g&&g.firma){var f=ST.ad.find(function(a){return a.ad===g.firma})||(window.sAdr||[]).find(function(a){return a.ad===g.firma});if(f&&ST.ad.indexOf(f)<0)ST.ad.unshift(f)}
    var mus=ST.ad.filter(function(a){return!AMBAR.test(Y().nrm(a.ad))}),yer=ST.ad.filter(function(a){return AMBAR.test(Y().nrm(a.ad))});
    ST.mus=mus[0]||ST.ad[0]||null;ST.yer=(/birak|teslim|ambar|depo/.test(Y().nrm(m))&&yer[0])||ST.mus;
    ST.U=[];try{(await firebase.database().ref("urunler").orderByChild("durum").equalTo("hazir").once("value")).forEach(function(c){var u=c.val();if(u){u.id=c.key;ST.U.push(u)}})}catch(er){}
    try{var v=(await firebase.database().ref("sevkSorumlulari").once("value")).val()||{};ST.sor=Object.keys(v).map(function(k){return{uid:k,ad:String((v[k]&&v[k].ad)||"?")}}).sort(function(a,b){return a.ad.localeCompare(b.ad,"tr")})}catch(er){ST.sor=[]}
    ST.sec={};ciz()}
  function eslesen(){if(!ST.mus)return[];var q=[ST.mus.ad];return ST.U.map(function(u){return{u:u,b:Math.max.apply(null,q.map(function(x){return benz(u.musteri,x)}))}}).filter(function(x){return x.b>=0.6}).sort(function(a,b){return b.b-a.b}).map(function(x){return x.u})}
  function ciz(){var S=$("smS"),h="",sec=function(id,v,L,bos){return'<select id="'+id+'" style="margin:2px 0 6px">'+(bos?'<option value="">'+bos+'</option>':'')+L.map(function(a,i){return'<option value="'+i+'"'+(a===v?" selected":"")+'>'+e(a.ad)+'</option>'}).join("")+'</select>'};
    var AL=(window.sAdr&&window.sAdr.length?window.sAdr:ST.ad).slice().sort(function(a,b){return String(a.ad).localeCompare(String(b.ad),"tr")});
    if(!ST.ad.length)h+='<div style="color:#b42318">⚠️ Mesajda kayıtlı bir sevk adresi bulunamadı. Aşağıdan seçin; listede yoksa önce Adresler › 🧩 Adres tamamlama\'dan kaydedin.</div>';
    h+='<label style="font-size:13px">Müşteri (kayıtlı adreslerden)</label>'+sec("smMus",ST.mus,AL,"— seçin —");
    h+='<label style="font-size:13px">Teslim yeri (ambar ise ambarı seçin)</label>'+sec("smYer",ST.yer,AL,"— müşterinin adresi —");
    var E=eslesen(),D=ST.U.filter(function(u){return E.indexOf(u)<0});
    if(E.length){E.forEach(function(u){if(ST.sec[u.id]===undefined)ST.sec[u.id]=true});
      h+='<div style="font-weight:700;margin:8px 0 2px">📦 Bu müşterinin hazır ürünleri ('+E.length+')</div>'+E.map(satir).join("")}
    else h+='<div style="background:#fef3c7;border-radius:10px;padding:8px 10px;margin:8px 0">Bu müşteri için <b>hazır ürün yok</b>. Üretilecekse: İş emirleri › 💬 Mesajdan iş emri. Şoföre iş olarak gitsin: <button type="button" class="btn b6 sm" id="smTal">📋 Talimat olarak gönder</button></div>';
    if(D.length)h+='<details style="margin-top:6px"><summary style="cursor:pointer;font-size:13px;color:#667085">Diğer hazır ürünler ('+D.length+')</summary>'+D.map(satir).join("")+'</details>';
    if(ST.U.length){h+='<div style="display:flex;gap:6px;margin-top:8px"><select id="smArac" style="flex:1"><option value="">Araç seçin</option>'+Object.keys(ARACLAR).map(function(k){return'<option value="'+k+'">'+e(ARACLAR[k])+'</option>'}).join("")+'</select>'+
        '<select id="smSor" style="flex:1"><option value="">Sevkiyat sorumlusu</option>'+ST.sor.map(function(x,i){return'<option value="'+i+'">'+e(x.ad)+'</option>'}).join("")+'</select></div>'+
        '<button type="button" class="btn b2" id="smAl" style="margin-top:6px">🚚 Seçilenleri sevk listesine al</button><div id="smE" style="color:#b42318;font-size:13px"></div>'}
    S.innerHTML=h;
    $("smMus").onchange=function(){ST.mus=this.value===""?null:AL[+this.value];ST.sec={};ciz()};$("smYer").onchange=function(){ST.yer=this.value===""?null:AL[+this.value]};
    S.querySelectorAll("[data-su]").forEach(function(c){c.onchange=function(){ST.sec[c.dataset.su]=c.checked}});
    var t=$("smTal");if(t)t.onclick=talimat;var a=$("smAl");if(a)a.onclick=function(){al(AL)}}
  function satir(u){var k=(+u.kg||0)?(typeof fmt==="function"?fmt(u.kg):u.kg)+" kg":"";return'<label style="display:flex;gap:8px;align-items:flex-start;padding:6px 0;border-bottom:1px solid #f1f5f9"><input type="checkbox" data-su="'+e(u.id)+'"'+(ST.sec[u.id]?" checked":"")+' style="width:20px;height:20px;flex:none"><span><b>'+e(u.musteri||"-")+'</b> <span style="color:#667085">'+e(String(u.urun||"").split("\n")[0])+(k?" • "+k:"")+(u.isEmriNo?" • "+e(u.isEmriNo):"")+'</span></span></label>'}
  function talimat(){var d=$("dSevMsj"),m=ST.m,y=ST.yer||ST.mus;d.close();var b=document.querySelector('[data-v="tal"]');if(b)b.click();
    setTimeout(function(){var y1=$("talYeni")||document.querySelector('#vTal .btn.b1, [data-a="talYeni"]');if(y1)y1.click();setTimeout(function(){if($("dTal")&&$("dTal").open){$("talMetin").value=m.slice(0,500);if(y&&window.talAS)talAS.doldur({adresAd:y.ad,adres:y.adres||"",haritaUrl:y.haritaUrl||""})}else toast("Talimatlar › «Yeni talimat» ile açın; mesajı yapıştırın.")},350)},350)}
  async function al(AL){var ids=Object.keys(ST.sec).filter(function(k){return ST.sec[k]}),ar=$("smArac").value,sx=ST.sor[+$("smSor").value],E=$("smE");
    if(!ids.length){E.textContent="En az bir hazır ürün işaretleyin.";return}if(!ARACLAR[ar]){E.textContent="Aracı seçin.";return}if($("smSor").value===""||!sx){E.textContent="Sevkiyat sorumlusunu seçin.";return}
    var y=ST.yer||ST.mus,not="📩 "+ST.m.replace(/\s*\n+\s*/g," / ").slice(0,250),b=$("smAl");b.disabled=true;
    try{var up={};ids.forEach(function(id){var u=ST.U.find(function(x){return x.id===id});if(!u)return;var p="urunler/"+id+"/";
        up[p+"durum"]="sevk_edilecek";up[p+"teslimEden"]=null;up[p+"arac"]=ar;up[p+"sevkSorumlu"]=sx.ad;up[p+"sevkSorumluUid"]=sx.uid;
        if(y){up[p+"adres"]=String(y.adres||y.ad||"").slice(0,300);up[p+"haritaUrl"]=String(y.haritaUrl||"").slice(0,500)}
        up[p+"not"]=((u.not?String(u.not)+"\n":"")+not).slice(0,500)});
      await firebase.database().ref().update(up);
      if(window.bil)bil(["u_"+sx.uid],{t:"sevk",ik:"🚚",b:"🚚 Size sevkiyat verildi: "+((ST.mus&&ST.mus.ad)||"-"),m:ids.length+" kalem · "+ARACLAR[ar]+(y&&y!==ST.mus?" · teslim: "+y.ad:""),git:"sev:sevk_edilecek"});
      $("dSevMsj").close();toast("✓ "+ids.length+" kalem sevk listesine alındı")}
    catch(er){b.disabled=false;E.textContent="Kaydedilemedi: "+(typeof errText==="function"?errText(er):er)}}
  /* düğme: Sevkiyat › sekmelerin üstünde, yalnız sevk modülünde ve ofis/yöneticiye */
  function dugme(){var t=$("tabs");if(!t)return;var b=$("bSevMsj");if(!b){b=document.createElement("button");b.id="bSevMsj";b.type="button";b.className="btn";b.style.cssText="background:#7c3aed;margin:0 0 8px";b.textContent="💬 Mesajdan sevk listesine al (deneme)";b.onclick=window.sevMsjAc;t.parentNode.insertBefore(b,t)}
    var g=typeof mod!=="undefined"&&mod==="sevk"&&izin()&&!t.closest(".hide");b.classList.toggle("hide",!g)}
  document.addEventListener("click",function(){setTimeout(dugme,60)},true);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",dugme);else dugme();
  setTimeout(dugme,1500);
})();
