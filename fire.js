/* fire.js — (v134) ⚠️ FİRE / ARIZA kaydı.
   Operatör tek ekrandan: «🗑 Fire» (kaç kg, neden) ya da «🔧 Arıza / duruş» (hangi makine, kaç dakika, neden) yazar; 🎤 ile söyleyebilir.
   Veri: uretimOlay/{id} {tur:fire|ariza, asama, makine, isNo, kg, dk, sebep, kim, uid, zaman}. Herkes son 7 günü görür; silme yalnız yönetici.
   Mag Pazar gece ajanı bu kayıtlardan makine/aşama başına fire kg, duruş saati ve fire maliyetini çıkarır (Kazanç Panosu, Fabrika sayfası).
   30 dakikayı geçen arıza yöneticiye bildirim olarak gider. */
(function(){
  var g=function(i){return document.getElementById(i)};
  var e=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
  var AS={ekstruder:"🧵 Ekstruder",baski:"🖨 Baskı",kesim:"✂️ Kesim",depo:"📦 Depo",diger:"• Diğer"};
  var ROL={"Ekstruder Operatörü":"ekstruder","Matbaa Operatörü":"baski","Kesim Operatörü":"kesim","Depo Görevlisi":"depo"};
  var NEDEN={fire:["Ayar / başlangıç firesi","Kopma","Kalınlık-mikron hatası","Baskı hatası","Kesim / kaynak hatası","Rulo sonu","Renk tutmadı"],
    ariza:["Mekanik arıza","Elektrik arızası","Isıtıcı / rezistans","Bıçak / kaynak çubuğu","Elektrik kesintisi","Hammadde bekleme","Kalıp / ayar değişimi"]};
  var tur="fire",tanima=null,son=[];
  var nf=function(n){return(Math.round(n*10)/10).toLocaleString("tr-TR")};
  var R=function(){return(typeof rec!=="undefined"&&rec)||{}},yon=function(){return typeof isAdmin==="function"&&isAdmin()};
  var sayi=function(v){v=String(v||"").replace(",",".").replace(/[^\d.]/g,"");var n=parseFloat(v);return isFinite(n)&&n>0?Math.round(n*100)/100:0};
  function dlg(){var d=g("dFire");if(d)return d;d=document.createElement("dialog");d.id="dFire";d.style.width="min(520px,96vw)";
    d.innerHTML='<h3 style="margin-bottom:6px">⚠️ Fire / Arıza kaydı</h3>'+
      '<div style="display:flex;gap:6px;margin-bottom:8px"><button type="button" class="btn" data-ft="fire" style="flex:1;margin:0">🗑 Fire</button><button type="button" class="btn" data-ft="ariza" style="flex:1;margin:0">🔧 Arıza / duruş</button></div>'+
      '<div class="grid"><div><label for="frAs">Bölüm</label><select id="frAs">'+Object.keys(AS).map(function(k){return'<option value="'+k+'">'+AS[k]+'</option>'}).join("")+'</select></div>'+
      '<div><label for="frMk">Makine</label><input id="frMk" list="frMkL" maxlength="40" placeholder="Örn: Ekstruder 2"><datalist id="frMkL"></datalist></div></div>'+
      '<div class="grid" style="margin-top:6px"><div id="frKgW"><label for="frKg">Fire (kg)</label><input id="frKg" inputmode="decimal" placeholder="0"></div><div id="frDkW" class="hide"><label for="frDk">Duruş (dakika)</label><input id="frDk" inputmode="numeric" placeholder="0"></div>'+
      '<div><label for="frIs">İş emri no (varsa)</label><input id="frIs" list="frIsL" maxlength="20" placeholder="MG-0945"><datalist id="frIsL"></datalist></div></div>'+
      '<label for="frSb" style="margin-top:6px">Neden</label><div id="frCh" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px"></div>'+
      '<div style="display:flex;gap:6px"><textarea id="frSb" rows="2" maxlength="300" style="flex:1" placeholder="Kısaca ne oldu"></textarea><button type="button" class="btn b7" id="frMik" style="width:auto;margin:0">🎤</button></div>'+
      '<div class="err" id="frE"></div>'+
      '<div style="display:flex;gap:8px;margin-top:6px"><button type="button" class="btn b6" id="frNo">Vazgeç</button><button type="button" class="btn b1" id="frOk">Kaydet</button></div>'+
      '<h4 style="margin:14px 0 4px">Son 7 gün</h4><div id="frOz" style="font-size:14px"></div><div id="frL" style="font-size:14px;margin-top:6px"></div>';
    document.body.appendChild(d);
    var durM=function(){if(tanima){try{tanima.stop()}catch(x){}tanima=null}g("frMik").textContent="🎤"};
    d.addEventListener("close",durM);
    g("frNo").onclick=function(){d.close()};
    d.querySelectorAll("[data-ft]").forEach(function(b){b.onclick=function(){turSec(b.dataset.ft)}});
    g("frCh").onclick=function(ev){var b=ev.target.closest("button[data-n]");if(!b)return;var t=g("frSb");t.value=t.value.trim()?t.value.trim()+", "+b.dataset.n:b.dataset.n};
    g("frMik").onclick=function(){if(tanima)return durM();var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!SR){g("frE").textContent="Bu telefonda uygulama içi sesli yazma yok; klavyedeki 🎤 tuşunu kullanın.";return}
      var r=new SR(),t=g("frSb"),bas=t.value?t.value.replace(/\s*$/," "):"";r.lang="tr-TR";r.continuous=true;r.interimResults=true;
      r.onresult=function(ev){var s="";for(var i=0;i<ev.results.length;i++)s+=ev.results[i][0].transcript+(ev.results[i].isFinal?" ":"");t.value=bas+s;
        /* söylenen sayıyı ilgili kutuya da yaz: "20 kilo", "45 dakika" */
        var m=s.match(/(\d+(?:[.,]\d+)?)\s*(kilo|kg)/i);if(m&&tur==="fire"&&!g("frKg").value)g("frKg").value=m[1];
        var d2=s.match(/(\d+)\s*(dakika|dk)/i),sa=s.match(/(\d+(?:[.,]\d+)?)\s*saat/i);if(tur==="ariza"&&!g("frDk").value){if(d2)g("frDk").value=d2[1];else if(sa)g("frDk").value=Math.round(sayi(sa[1])*60)}};
      r.onerror=function(){durM()};r.onend=function(){if(tanima===r)durM()};
      try{r.start();tanima=r;g("frMik").textContent="⏹"}catch(x){}};
    g("frL").onclick=async function(ev){var b=ev.target.closest("button[data-sil]");if(!b||!yon())return;if(!confirm("Bu kayıt silinsin mi?"))return;
      try{await db.ref("uretimOlay/"+b.dataset.sil).remove();liste()}catch(x){toast(errText(x))}};
    g("frOk").onclick=kaydet;
    return d}
  function turSec(t){tur=t;var d=g("dFire");d.querySelectorAll("[data-ft]").forEach(function(b){var on=b.dataset.ft===t;b.className="btn "+(on?(t==="fire"?"b5":"b2"):"b6")});
    g("frKgW").classList.toggle("hide",t!=="fire");g("frDkW").classList.toggle("hide",t!=="ariza");
    g("frCh").innerHTML=NEDEN[t].map(function(n){return'<button type="button" class="btn b6 sm" data-n="'+e(n)+'" style="width:auto;margin:0;padding:4px 8px;font-size:13px">'+e(n)+'</button>'}).join("")}
  async function kaydet(){var E=g("frE");E.textContent="";
    var kg=sayi(g("frKg").value),dk=Math.round(sayi(g("frDk").value)),sb=g("frSb").value.trim().slice(0,300),mk=g("frMk").value.trim().slice(0,40),is=g("frIs").value.trim().toUpperCase().slice(0,20),as=g("frAs").value;
    if(tur==="fire"&&!kg)return E.textContent="Fire miktarını (kg) yazın.";
    if(tur==="ariza"&&!dk)return E.textContent="Duruş süresini (dakika) yazın.";
    if(kg>20000||dk>4320)return E.textContent="Değer çok büyük görünüyor, kontrol edin.";
    var o={tur:tur,asama:as,kim:typeof ad==="function"?ad():"",uid:user.uid,zaman:firebase.database.ServerValue.TIMESTAMP};
    if(tur==="fire")o.kg=kg;else o.dk=dk;if(sb)o.sebep=sb;if(mk)o.makine=mk;if(is)o.isNo=is;
    g("frOk").disabled=true;
    try{await db.ref("uretimOlay").push().set(o);
      try{localStorage.setItem("frMk_"+as,mk)}catch(x){}
      if(tur==="ariza"&&dk>=30&&window.bil)bil(["yon"],{t:"is",ik:"🔧",b:"🔧 Arıza: "+(mk||AS[as]||as)+" — "+dk+" dk duruş",m:[sb,o.kim].filter(Boolean).join(" · ")});
      toast("✓ Kaydedildi");g("frKg").value="";g("frDk").value="";g("frSb").value="";g("frIs").value="";liste()}
    catch(x){E.textContent=errText(x)}
    g("frOk").disabled=false}
  async function liste(){var oz=g("frOz"),L=g("frL");
    try{var v=(await db.ref("uretimOlay").orderByChild("zaman").startAt(Date.now()-7*864e5).once("value")).val()||{};
      son=Object.keys(v).map(function(k){return Object.assign({id:k},v[k])}).sort(function(a,b){return(b.zaman||0)-(a.zaman||0)});
      var fk={},ad2={},mk={};son.forEach(function(x){if(x.tur==="fire")fk[x.asama]=(fk[x.asama]||0)+(+x.kg||0);else{var m=x.makine||AS[x.asama]||x.asama;ad2[m]=(ad2[m]||0)+(+x.dk||0)}if(x.makine)mk[x.makine]=1});
      g("frMkL").innerHTML=Object.keys(mk).map(function(m){return'<option value="'+e(m)+'">'}).join("");
      var fT=Object.keys(fk).reduce(function(a,k){return a+fk[k]},0),dT=Object.keys(ad2).reduce(function(a,k){return a+ad2[k]},0);
      oz.innerHTML=son.length?'<div>🗑 Toplam fire: <b>'+nf(fT)+' kg</b>'+(fT?' ('+Object.keys(fk).map(function(k){return(AS[k]||k).replace(/^\S+\s/,"")+" "+nf(fk[k])}).join(", ")+')':"")+'</div><div>🔧 Toplam duruş: <b>'+nf(dT/60)+' saat</b>'+(dT?' ('+Object.keys(ad2).sort(function(a,b){return ad2[b]-ad2[a]}).slice(0,4).map(function(m){return e(m)+" "+ad2[m]+" dk"}).join(", ")+')':"")+'</div>':'<div class="mut">Son 7 günde kayıt yok.</div>';
      L.innerHTML=son.slice(0,15).map(function(x){return'<div style="border-top:1px solid #e2e8f0;padding:4px 0;display:flex;gap:6px;align-items:flex-start"><div style="flex:1">'+(x.tur==="fire"?"🗑 <b>"+nf(+x.kg||0)+" kg</b> fire":"🔧 <b>"+x.dk+" dk</b> duruş")+" · "+e((AS[x.asama]||x.asama||"").replace(/^\S+\s/,""))+(x.makine?" · "+e(x.makine):"")+(x.isNo?" · "+e(x.isNo):"")+(x.sebep?'<br><span class="mut">'+e(x.sebep)+'</span>':"")+'<br><small class="mut">'+e(x.kim||"")+" · "+new Date(x.zaman||0).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})+'</small></div>'+(yon()?'<button type="button" class="btn b6 sm" data-sil="'+e(x.id)+'" style="width:auto;margin:0">🗑</button>':"")+'</div>'}).join("")}
    catch(x){oz.innerHTML='<div class="mut">Kayıtlar okunamadı: '+e(errText(x))+'</div>';L.innerHTML=""}}
  async function isListesi(){try{var v=(await db.ref("isEmirleri").orderByChild("eklenmeTarihi").limitToLast(80).once("value")).val()||{};
    g("frIsL").innerHTML=Object.keys(v).map(function(k){var x=v[k]||{};return x.no&&x.asama!=="bitti"?'<option value="'+e(x.no)+'">'+e((x.musteri||"")+" · "+(AS[x.asama]||x.asama||""))+'</option>':""}).join("")}catch(x){}}
  function ac(){var d=dlg();turSec("fire");var as=ROL[R().rol]||"ekstruder";g("frAs").value=as;
    var m="";try{m=localStorage.getItem("frMk_"+as)||""}catch(x){}g("frMk").value=m;g("frE").textContent="";g("frSb").value="";g("frKg").value="";g("frDk").value="";g("frIs").value="";
    g("frAs").onchange=function(){var m2="";try{m2=localStorage.getItem("frMk_"+g("frAs").value)||""}catch(x){}g("frMk").value=m2};
    d.showModal();liste();isListesi()}
  function dugme(){if(g("mFire"))return;var ref=document.querySelector('.menuBtn[data-go="uretim"]');if(!ref)return;
    var b=document.createElement("button");b.className="menuBtn";b.id="mFire";b.type="button";b.style.background="#9a3412";
    b.innerHTML='<span class="ic">⚠️</span><div>FİRE / ARIZA<small>Fire kg, makine arızası ve duruş süresi — sesle de yazılır</small></div>';b.onclick=ac;ref.insertAdjacentElement("afterend",b);
    /* şoför menüsünde gerekmez */
    var gz=function(){b.style.display=R().rol==="Sevkiyat Sorumlusu"&&!yon()?"none":""};gz();setInterval(gz,5000)}
  window.fireAc=ac;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",dugme);else dugme();
})();
