/* yzmesaj.js — 💬 MESAJDAN / 🎤 SESTEN TALİMAT ve TAHSİLAT (v138)
   Talimat ve Tahsilat pencerelerine «💬 Mesajdan / 🎤 sesten doldur» ekler. WhatsApp yazısı yapıştırılır ya da söylenir
   («Modi'den çek alınacak», «dönüşte Güneli'ye 20 koli rulo bırak»). Firma YALNIZ KAYITLI SEVK ADRESLERİ içinden seçilir:
   önce yerel eşleme (ad/cari kodu), anahtar okunabiliyorsa Gemini (okumaAyar) aynı listeden seçer; listede yoksa ADRES EKLENMEZ,
   «önce adresi kaydedin» denir. Kaydetmeyi her zaman kullanıcı yapar. Gerekenler: talimat.js window.talAS, tahsilat.js window.tahAS. */
(function(){
  var $=function(i){return document.getElementById(i)};
  function e(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  function nrm(x){return(typeof trn==="function"?trn(x):String(x||"").toLowerCase()).replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim()}
  var GENEL=/\b(ltd|sti|a s|as|tic|san|ve|ins|paz|sanayi|ticaret|limited|sirketi|anonim|ith|ihr|dis|mam|gida|ambalaj|plastik|unlu|mamulleri|firin|kuruyemis|merkez|depo|ambari|ambar|market|adres)\b/g;
  function cek(x){return nrm(x).replace(GENEL," ").replace(/\s+/g," ").trim()}
  function kok(w){return w.length>5?w.slice(0,5):w}
  var YED=[];
  function adresler(){var L=(window.sAdr&&window.sAdr.length)?window.sAdr:YED;return L.filter(function(a){return a&&a.ad})}
  async function adrYukle(){if((window.sAdr&&window.sAdr.length)||YED.length)return;try{var v=(await firebase.database().ref("sevkAdresleri").once("value")).val()||{};YED=Object.keys(v).map(function(k){return Object.assign({id:k},v[k])})}catch(er){}}
  /* yerel eşleme: adın ayırt edici kelimeleri mesajda geçiyor mu (Türkçe ekler için ilk 5 harf) */
  function adaylar(metin){var M=nrm(metin).split(" ").filter(Boolean),A=adresler(),sayi={},o=[];
    var kel=function(a){var W=cek(a.ad).split(" ").filter(function(w){return w.length>=3});return W.length?W:nrm(a.ad).split(" ").filter(function(w){return w.length>=3})};
    var gecer=function(w){return M.some(function(m){return m.indexOf(w)===0||(m.length>=4&&w.indexOf(m)===0)})};
    A.forEach(function(a){kel(a).forEach(function(w){sayi[w]=(sayi[w]||0)+1})});
    A.forEach(function(a){var W=kel(a);if(!W.length)return;var G=W.filter(gecer);if(!G.length)return;
      var b=G.length/W.length+(G.length>1?0.2:0)+(G.some(function(w){return w.length>=4&&sayi[w]===1})?0.5:0);if(b>=0.5)o.push({a:a,b:b})});
    return o.sort(function(x,y){return y.b-x.b})}
  function yerel(metin){var o=adaylar(metin);if(!o.length)return[];return o.filter(function(x){return Math.abs(x.b-o[0].b)<=0.01}).map(function(x){return x.a})}
  function tur(metin){return/\b(cek|cekini|tahsil|odeme|odemesini|para|nakit|havale|senet|alacak|hesap)/.test(nrm(metin))?"tahsilat":"talimat"}
  var ayar=null,ayarDenendi=false;
  async function anahtar(){if(ayarDenendi)return ayar;ayarDenendi=true;try{var v=(await firebase.database().ref("okumaAyar").once("value")).val();if(v&&v.anahtar)ayar={anahtar:String(v.anahtar),model:v.model?String(v.model):""}}catch(er){}return ayar}
  async function gemini(metin){var a=await anahtar();if(!a)return null;var ad=adresler().map(function(x){return x.ad}).slice(0,400);
    var p="Bir ambalaj fabrikasının sevkiyat programısın. Aşağıdaki mesaj şoföre verilecek bir iş. SADECE JSON döndür: {\"tur\":\"talimat\"|\"tahsilat\",\"firma\":\"<listeden birebir ad ya da boş>\",\"metin\":\"<şoför için kısa, net iş cümlesi>\",\"tutar\":<sayı ya da null>}. "+
      "firma MUTLAKA aşağıdaki kayıtlı adres listesinden birebir seçilmeli; mesajdaki firma listede yoksa boş bırak, ASLA uydurma. Çek/ödeme/para almak = tahsilat; mal götürmek/almak, başka işler = talimat.\nKAYITLI ADRESLER:\n"+ad.join("\n")+"\n\nMESAJ:\n"+metin;
    var M=[a.model,"gemini-flash-latest","gemini-2.5-flash","gemini-2.5-flash-lite"].filter(function(m,i,x){return m&&x.indexOf(m)===i}).slice(0,3);
    for(var i=0;i<M.length;i++){try{var ctl=new AbortController(),zt=setTimeout(function(){ctl.abort()},20000);
      var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(M[i])+":generateContent",{method:"POST",signal:ctl.signal,headers:{"Content-Type":"application/json","x-goog-api-key":a.anahtar},
        body:JSON.stringify({contents:[{parts:[{text:p}]}],generationConfig:{temperature:0,responseMimeType:"application/json"}})});clearTimeout(zt);
      if(r.status===403)return null;if(!r.ok)continue;var j=await r.json(),t=((((j.candidates||[])[0]||{}).content||{}).parts||[]).map(function(x){return x.text||""}).join("").replace(/^```(?:json)?/i,"").replace(/```$/,"").trim();
      var o=JSON.parse(t);if(o&&typeof o==="object")return o}catch(er){}}
    return null}
  async function coz(metin){await adrYukle();var Y=yerel(metin),g=null;try{g=await gemini(metin)}catch(er){}
    var A=adresler(),f=null;if(g&&g.firma){f=A.find(function(a){return a.ad===g.firma})||A.find(function(a){return nrm(a.ad)===nrm(g.firma)})||null}
    if(!f&&Y.length===1)f=Y[0];
    return{firma:f,secenek:f?[]:Y.slice(0,5),tur:(g&&g.tur)||tur(metin),metin:(g&&g.metin)||metin.trim(),tutar:g&&g.tutar,yz:!!g}}
  function dinle(ta,b){var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){toast("Bu telefonda ses tanıma yok; klavyedeki 🎤 ile söyleyebilirsiniz.");ta.focus();return}
    var r=new SR();r.lang="tr-TR";r.interimResults=false;r.maxAlternatives=1;b.textContent="🔴 Dinliyorum…";
    r.onresult=function(ev){ta.value=(ta.value?ta.value+" ":"")+ev.results[0][0].transcript};r.onend=function(){b.textContent="🎤 Söyle"};r.onerror=function(){b.textContent="🎤 Söyle"};try{r.start()}catch(er){b.textContent="🎤 Söyle"}}
  function kur(dlgId,onceId,AS,doldur){var d=$(dlgId),o=$(onceId);if(!d||!o||d.querySelector(".yzMsj"))return;if(o.previousElementSibling&&o.previousElementSibling.tagName==="LABEL")o=o.previousElementSibling;
    var k=document.createElement("div");k.className="yzMsj";k.style.cssText="background:#f5f3ff;border-radius:10px;padding:8px;margin:6px 0";
    k.innerHTML='<details><summary style="cursor:pointer;font-weight:700;color:#5b21b6">💬 Mesajdan / 🎤 sesten doldur</summary><textarea rows="3" placeholder="WhatsApp mesajını yapıştırın ya da 🎤 ile söyleyin (ör. Modi\'den çek alınacak)" style="margin-top:6px"></textarea><div style="display:flex;gap:6px"><button type="button" class="btn b6 sm" data-y="ses">🎤 Söyle</button><button type="button" class="btn sm" data-y="doldur" style="background:#7c3aed">✨ Doldur</button></div><div data-y="son" style="font-size:13px;margin-top:6px"></div></details>';
    o.parentNode.insertBefore(k,o);var ta=k.querySelector("textarea"),son=k.querySelector('[data-y="son"]');
    k.querySelector('[data-y="ses"]').onclick=function(){dinle(ta,this)};
    k.querySelector('[data-y="doldur"]').onclick=async function(){var m=ta.value.trim();if(!m){son.textContent="Önce mesajı yazın ya da söyleyin.";return}var b=this;b.disabled=true;son.textContent="Okunuyor…";
      try{var r=await coz(m);doldur(r);var as=AS();
        if(r.firma){if(as)as.doldur({adresAd:r.firma.ad,adres:r.firma.adres||"",haritaUrl:r.firma.haritaUrl||""});
          son.innerHTML='<span style="color:#16a34a">✓ Kayıtlı adres: <b>'+e(r.firma.ad)+'</b></span>'+(r.yz?' <span style="color:#667085">(yapay zekâ)</span>':'')+' — kontrol edip Kaydet\'e basın.'}
        else if(r.secenek.length){son.innerHTML='Birden fazla kayıtlı adres uyuyor, seçin: '+r.secenek.map(function(a,i){return'<button type="button" class="btn b6 sm" data-s="'+i+'" style="margin:2px">'+e(a.ad)+'</button>'}).join("");
          son.querySelectorAll("[data-s]").forEach(function(x){x.onclick=function(){var a=r.secenek[+x.dataset.s];var as2=AS();if(as2)as2.doldur({adresAd:a.ad,adres:a.adres||"",haritaUrl:a.haritaUrl||""});son.innerHTML='<span style="color:#16a34a">✓ Kayıtlı adres: <b>'+e(a.ad)+'</b></span>'}})}
        else{if(as)as.doldur({});son.innerHTML='<span style="color:#b42318">⚠️ Mesajdaki firma kayıtlı sevk adreslerinde bulunamadı; adres EKLENMEDİ. Önce Sevkiyat → Adresler\'den (ya da 🧩 Adres tamamlama) kaydedin, sonra tekrar deneyin.</span>'}
        if(dlgId==="dTal"&&r.tur==="tahsilat")son.innerHTML+='<div style="color:#b45309;margin-top:4px">💰 Bu bir ödeme/çek işi gibi görünüyor; Tahsilat bölümünden «talep» olarak açmak daha doğru olabilir.</div>'}
      catch(er){son.textContent="Okunamadı: "+(er&&er.message||er)}b.disabled=false}}
  function hepsi(){kur("dTal","talMetin",function(){return window.talAS},function(r){$("talMetin").value=String(r.metin||"").slice(0,500)});
    kur("dTah","tahCari",function(){return window.tahAS},function(r){if(r.firma)$("tahCari").value=String(r.firma.ad).slice(0,100);var n=$("tahNot");if(n&&!n.value)n.value=String(r.metin||"").slice(0,300)})}
  window.yzMesajTest={yerel:yerel,tur:tur};
  window.yzMesaj={adaylar:async function(m){await adrYukle();return adaylar(m)},gemini:gemini,dinle:dinle,nrm:nrm,cek:cek};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",hepsi);else hepsi();
})();
