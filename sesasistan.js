/* ===================== SESLİ ASİSTAN (v94) =====================
   🎤 düğmesine basılır, kullanıcı konuşur (telefonun kendi ses tanıması yazıya çevirir), yazı Google Gemini'ye gider;
   Gemini cümleyi aşağıdaki ACT listesindeki İŞLEMLERDEN birine eşler, uygulama o işlemi kendisi yapar.
   Gemini hiçbir veriye dokunmaz; sadece "hangi işlem" der. Her işlem uygulamanın kendi yetki kontrolünden geçer.
   Anahtar: fotookut.js ile aynı (`okumaAyar`). Anahtarı okuyamayan kullanıcıda (veya limit dolunca) basit kelime eşlemesi çalışır.
   Yeni komut eklemek = ACT'a bir satır + PROMPT'taki listeye bir satır.
   Kullanılan genel işlevler (app.js): $, toast, db, rec, isE, modSec, modGor, tahGor, canIsAc, isVeriGor, show, menuOk,
   qrAsamayaGit, qrAc, esc. */
(function(){
  var g=function(i){return document.getElementById(i)};
  var bekle=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
  var ayar=null,ayarDenendi=false,dinliyor=false,sr=null,mesgul=false,kapatZm=null;

  /* ---- metin yardımcıları ---- */
  function kat(s){return String(s==null?"":s).toLocaleLowerCase("tr-TR").replace(/ı/g,"i").replace(/ş/g,"s").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ö/g,"o").replace(/ç/g,"c").replace(/[^a-z0-9 \-]/g," ").replace(/\s+/g," ").trim()}
  function gorunur(el){return !!el&&el.offsetParent!==null&&!el.disabled}
  function e2(s){return typeof esc==="function"?esc(s):String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}

  /* ---- ekran geçişi ---- */
  var YOK="Bu işlem için yetkiniz yok ya da bu ekran sizde kapalı.";
  function git(mod,tab){
    menuOk=true;modSec(mod);show("vApp");window.scrollTo(0,0);
    if(tab){var b=document.querySelector('#vtabs button[data-v="'+tab+'"]');if(b&&gorunur(b))b.click()}}
  function tahMod(){return modGor("sevk")?"sevk":"tah"}

  /* ---- İŞLEM LİSTESİ: id → {a: açıklama (Gemini'ye giden), f: yapan işlev (metin döndürür)} ---- */
  var ACT={
    git_menu:{a:"Ana menüye dön",f:function(){menuOk=false;show("vMenu");window.scrollTo(0,0);if(window.panoGoster)window.panoGoster();return"Ana menü"}},
    git_sevkiyat:{a:"Sevkiyatlar ekranını aç (hazır ürünler, sevk edilecekler, sevk edilenler)",f:function(){if(!modGor("sevk"))return YOK;git("sevk","sev");return"Sevkiyat açıldı"}},
    git_adresler:{a:"Sevk adresleri listesini aç",f:function(){if(!modGor("sevk"))return YOK;git("sevk","adr");return"Sevk adresleri açıldı"}},
    git_talimat:{a:"Talimatlar ekranını aç",f:function(){if(!tahGor())return YOK;git(tahMod(),"tal");return"Talimatlar açıldı"}},
    git_tahsilat:{a:"Tahsilat (para tahsilatı, bekleyen/alınan) ekranını aç",f:function(){if(!tahGor())return YOK;git(tahMod(),"tah");return"Tahsilat açıldı"}},
    git_stok:{a:"Stok ekranını aç (kalemler, siparişler, tedarikçiler)",f:function(){if(!modGor("stok"))return YOK;git("stok");return"Stok açıldı"}},
    git_isemirleri:{a:"İş emirleri ekranını aç (liste, etiket hazırlama)",f:function(){if(!modGor("is"))return YOK;git("is");return"İş emirleri açıldı"}},
    git_uretim:{a:"Üretim ekranını aç (ekstruder, baskı, kesim aşamaları)",f:function(){if(!modGor("uretim"))return YOK;git("uretim");return"Üretim açıldı"}},
    git_raporlar:{a:"Raporlar ekranını aç",f:function(){if(!modGor("rap"))return YOK;git("rap");return"Raporlar açıldı"}},
    git_granul:{a:"Granül ekranını aç",f:function(){if(!modGor("granul"))return YOK;git("granul");return"Granül açıldı"}},
    git_dosyalar:{a:"Dosyalar ekranını aç",f:function(){if(!modGor("dos"))return YOK;git("dos");return"Dosyalar açıldı"}},
    yeni_is_emri:{a:"YENİ İŞ EMRİ aç (boş iş emri formu penceresi)",f:function(){
      if(!modGor("is")||!canIsAc())return"Yeni iş emrini sadece muhasebe, depo görevlisi ve yönetici açabilir.";
      git("is");var b=g("iAdd");if(!gorunur(b))return YOK;b.click();return"Yeni iş emri penceresi açıldı"}},
    yeni_adres:{a:"YENİ SEVK ADRESİ ekle (adres ekleme penceresi)",f:function(){
      if(!modGor("sevk"))return YOK;git("sevk","adr");var b=g("aAdd");if(!gorunur(b))return YOK;b.click();return"Yeni adres penceresi açıldı"}},
    yeni_kalem:{a:"YENİ STOK KALEMİ ekle (kalem ekleme penceresi)",f:function(){
      if(!modGor("stok"))return YOK;git("stok");var t=document.querySelector('#stabs button[data-s="kal"]');if(t&&gorunur(t))t.click();
      var b=g("sAdd");if(!gorunur(b))return YOK;b.click();return"Yeni kalem penceresi açıldı"}},
    is_emri_bul:{a:"Belirli bir iş emrini / müşterinin üretim formunu BUL ve aç. «arama» alanına müşteri adı, iş adı veya seri no yaz (örn. «inan makina», «MG-0961»). Kullanıcı sadece sayı söylerse MG-sayı yaz.",f:bul}
  };

  /* ---- iş emri bulma ---- */
  async function bul(r){
    var q=kat(r.arama);if(!q)return"Hangi iş emrini arayayım? Örn: «İnan Makina üretim formu nerede».";
    if(!isVeriGor())return"İş emirlerine erişim yetkiniz yok.";
    git(modGor("is")?"is":"uretim");
    for(var i=0;i<15&&!(isE&&isE.length);i++)await bekle(200);
    var w=q.split(" ").filter(Boolean);
    var L=(isE||[]).filter(function(e){var h=kat([e.no,e.musteri,e.isAdi,e.stok,e.urunAdi].join(" "));return w.every(function(k){return h.indexOf(k)>-1})});
    if(!L.length)return"«"+r.arama+"» için iş emri bulunamadı (son yüklenen iş emirleri arasında arandı).";
    if(L.length===1){ac(L[0]);return"Bulundu: "+(L[0].no||"")+" · "+(L[0].musteri||"")}
    var N=L.slice(0,8);window.__sesL=N;
    return{liste:N,mesaj:L.length+" iş emri bulundu"+(L.length>8?" (ilk 8 gösteriliyor)":"")+". Birini seçin:"}}
  function ac(e){try{qrAsamayaGit(e)}catch(x){}qrAc(e)}

  /* ---- Gemini ---- */
  function prompt(metin){
    var L=Object.keys(ACT).map(function(k){return"- "+k+": "+ACT[k].a}).join("\n");
    return["Sen MAG AMBALAJ plastik ambalaj fabrikasının stok/sevkiyat/iş emri uygulamasının sesli asistanısın.",
      "Kullanıcı telefona Türkçe konuştu; ses tanıma yazıyı bozmuş olabilir (yanlış harf, bitişik kelime). Anlamına bak.",
      "Cümleyi AŞAĞIDAKİ işlemlerden TAM BİRİNE eşle. Listede olmayan işlem UYDURMA.",
      "Cevap SADECE geçerli JSON: {\"islem\":\"işlem_id\",\"arama\":\"\",\"yanit\":\"\"}",
      "- islem: listedeki id. Hiçbirine uymuyorsa \"yok\".",
      "- arama: yalnız is_emri_bul için; diğerlerinde \"\".",
      "- yanit: yalnız islem \"yok\" ise, kısa ve sade Türkçe (örn. bu komutu henüz yapamadığını söyle).",
      "İşlemler:",L,
      "Şu an açık ekran: "+(typeof panel!=="undefined"?panel:"?"),
      "Kullanıcının cümlesi: «"+metin+"»"].join("\n")}

  function dusunme(m){
    if(/gemini-3/.test(m)||/latest/.test(m))return[{thinkingLevel:"low"},{thinkingBudget:0},null];
    if(/2\.5/.test(m))return[{thinkingBudget:0},null];
    return[null]}
  async function tek(model,dusun,metin){
    var ac=new AbortController(),zt=setTimeout(function(){ac.abort()},12000);
    var gc={temperature:0,responseMimeType:"application/json"};if(dusun)gc.thinkingConfig=dusun;
    try{
      var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent",{
        method:"POST",signal:ac.signal,headers:{"Content-Type":"application/json","x-goog-api-key":ayar.anahtar},
        body:JSON.stringify({contents:[{parts:[{text:prompt(metin)}]}],generationConfig:gc})});
      if(r.ok){var j=await r.json();clearTimeout(zt);
        var p=j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts;
        return{ok:1,tx:(p||[]).map(function(x){return x.text||""}).join("").trim()}}
      var t="";try{t=(await r.json()).error.message||""}catch(e){}
      clearTimeout(zt);return{st:r.status,t:t}
    }catch(e){clearTimeout(zt);return{st:(e&&e.name==="AbortError")?"zaman":"ag"}}}
  async function gemini(metin){
    var ls="";try{ls=localStorage.getItem("okSon")||""}catch(e){}
    var M=[ayar.model,ls,"gemini-flash-latest","gemini-2.5-flash","gemini-2.5-flash-lite"].filter(function(m,i,a){return m&&a.indexOf(m)===i}).slice(0,3);
    for(var i=0;i<M.length;i++){
      var cf=dusunme(M[i]),sn=null;
      for(var c=0;c<cf.length;c++){
        sn=await tek(M[i],cf[c],metin);
        if(sn.ok||!(sn.st===400&&c<cf.length-1&&!/API key/i.test(sn.t||"")))break}
      if(sn.ok){
        var tx=sn.tx.replace(/^```(?:json)?/i,"").replace(/```$/,"").trim();
        try{var o=JSON.parse(tx);if(o&&typeof o==="object")return o}catch(e){}
        continue}
      if(sn.st===403||(sn.st===400&&/API key/i.test(sn.t||"")))throw new Error("anahtar");
      if(sn.st==="ag")throw new Error("ag")}
    throw new Error("gemini")}

  /* ---- yedek: basit kelime eşlemesi (anahtar yok / limit doldu / internet kötü) ---- */
  function yerel(metin){
    var t=kat(metin),has=function(){return Array.prototype.every.call(arguments,function(k){return t.indexOf(k)>-1})};
    if(has("yeni")&&(has("is emri")||has("is ac")||has("is ekle")))return{islem:"yeni_is_emri"};
    if(has("yeni")&&has("adres"))return{islem:"yeni_adres"};
    if(has("yeni")&&has("kalem"))return{islem:"yeni_kalem"};
    var mg=t.match(/mg\s*-?\s*(\d{3,6})/);if(mg)return{islem:"is_emri_bul",arama:"MG-"+mg[1]};
    var S=[["adres","git_adresler"],["talimat","git_talimat"],["tahsilat","git_tahsilat"],["stok","git_stok"],["sevkiyat","git_sevkiyat"],["is emri","git_isemirleri"],["uretim","git_uretim"],["rapor","git_raporlar"],["granul","git_granul"],["dosya","git_dosyalar"],["menu","git_menu"],["ana ekran","git_menu"]];
    var hit=null;for(var i=0;i<S.length;i++)if(t.indexOf(S[i][0])>-1){hit=S[i];break}
    var a=t.replace(hit?hit[0]:"@@","").replace(/\b(nerede|nerde|bul|bulur musun|ara|goster|gosterir misin|acar misin|ac|git|gec|ekrani|ekran|sayfasi|sayfa|bolumu|bolum|forma|formu|uretim|is takip|is emri|emri|bana|lutfen|benim|var mi|beni|goturur musun|lari|leri|ni|i)\b/g," ").replace(/\s+/g," ").trim();
    if(hit&&!a)return{islem:hit[1]};
    if(a&&/\b(nerede|nerde|bul|ara|goster|forma|formu)\b/.test(t))return{islem:"is_emri_bul",arama:a};
    if(hit)return{islem:hit[1]};
    return{islem:"yok"}}

  /* ---- arayüz ---- */
  function stil(){
    var s=document.createElement("style");
    s.textContent="#sesB{position:fixed;right:14px;bottom:18px;width:60px;height:60px;border-radius:50%;border:0;margin:0;padding:0;font-size:28px;background:#0f766e;color:#fff;box-shadow:0 3px 10px rgba(0,0,0,.35);z-index:9000;cursor:pointer;display:none}"+
      "#sesB.on{background:#c82333;animation:sesN 1s infinite}@keyframes sesN{50%{transform:scale(1.1)}}"+
      "#sesP{position:fixed;left:10px;right:10px;bottom:90px;max-width:440px;margin-left:auto;background:#fff;color:#0f172a;border:2px solid #0f766e;border-radius:14px;padding:12px;z-index:9001;box-shadow:0 4px 18px rgba(0,0,0,.35);display:none}"+
      "#sesP .sd{font-weight:800;font-size:16px}#sesP .st{color:#475569;font-size:15px;margin:4px 0;word-break:break-word}#sesP .sr{font-size:15px;margin-top:4px}"+
      "#sesP .sx{position:absolute;top:6px;right:8px;background:none;border:0;font-size:22px;width:auto;height:auto;margin:0;padding:2px 6px;color:#475569;cursor:pointer}"+
      "#sesP .si{display:flex;gap:6px;margin-top:8px}#sesP input{flex:1;min-width:0;font-size:16px;padding:8px;border:1.5px solid #cbd5e1;border-radius:8px}"+
      "#sesP .sg{width:auto;margin:0;padding:0 14px;min-height:44px}#sesP .sl{display:block;width:100%;text-align:left;margin:5px 0;padding:8px;border:1.5px solid #cbd5e1;background:#fff;color:#0f172a;border-radius:8px;font-size:15px;cursor:pointer}";
    document.head.appendChild(s)}
  function kur(){
    stil();
    var b=document.createElement("button");b.id="sesB";b.type="button";b.textContent="🎤";b.setAttribute("aria-label","Sesli komut");document.body.appendChild(b);
    var p=document.createElement("div");p.id="sesP";
    p.innerHTML='<button class="sx" id="sesX" type="button" aria-label="Kapat">✕</button><div class="sd" id="sesD"></div><div class="st" id="sesT"></div><div class="sr" id="sesR"></div>'+
      '<div class="si"><input id="sesI" type="text" placeholder="veya yazın: yeni iş emri aç" autocomplete="off"><button class="btn b2 sg" id="sesG" type="button">Gönder</button></div>';
    document.body.appendChild(p);
    b.onclick=function(){dinliyor?durdur():basla()};
    g("sesX").onclick=kapat;
    g("sesG").onclick=function(){var v=g("sesI").value.trim();if(v){durdur();calistir(v)}};
    g("sesI").addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();g("sesG").click()}});
    g("sesR").onclick=function(ev){var x=ev.target.closest("button[data-i]");if(!x)return;var e=(window.__sesL||[])[+x.dataset.i];if(e){ac(e);kapat()}};
    setInterval(gorBelirle,1500);gorBelirle()}
  function gorBelirle(){
    var ok=false;try{ok=!!(rec&&rec.onay===true)&&(!g("vMenu").classList.contains("hide")||!g("vApp").classList.contains("hide"))}catch(e){}
    g("sesB").style.display=ok?"block":"none";if(!ok&&g("sesP").style.display==="block")kapat()}
  function yaz(d,t,r,html){
    g("sesP").style.display="block";
    if(d!=null)g("sesD").textContent=d;if(t!=null)g("sesT").textContent=t;
    if(r!=null){if(html)g("sesR").innerHTML=r;else g("sesR").textContent=r}}
  function kapat(){clearTimeout(kapatZm);durdur();g("sesP").style.display="none"}

  /* ---- dinleme ---- */
  function durdur(){dinliyor=false;g("sesB").classList.remove("on");try{if(sr)sr.stop()}catch(e){}sr=null}
  function basla(){
    if(mesgul)return;clearTimeout(kapatZm);
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    yaz("","","");g("sesI").value="";
    if(!SR){yaz("Bu tarayıcı sesi yazıya çeviremiyor","","Aşağıya komutu yazabilirsiniz (Chrome kullanırsanız mikrofon çalışır).");return}
    try{
      sr=new SR();sr.lang="tr-TR";sr.interimResults=true;sr.continuous=false;sr.maxAlternatives=1;
      var son="";
      sr.onresult=function(e){var t="";for(var i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;son=t;yaz(null,"«"+t+"»",null)};
      sr.onerror=function(e){dinliyor=false;g("sesB").classList.remove("on");
        var m=e&&e.error==="not-allowed"?"Mikrofon izni verilmedi. Tarayıcı ayarlarından bu site için mikrofona izin verin.":e&&e.error==="no-speech"?"Ses duyulmadı. Tekrar deneyin.":e&&e.error==="network"?"Ses tanıma için internet gerekli.":"Ses alınamadı ("+(e&&e.error)+").";
        yaz("",null,m)};
      sr.onend=function(){var was=dinliyor;dinliyor=false;g("sesB").classList.remove("on");sr=null;if(was&&son.trim())calistir(son.trim())};
      sr.start();dinliyor=true;g("sesB").classList.add("on");yaz("🎤 Dinliyorum… konuşun","","")
    }catch(e){dinliyor=false;yaz("Mikrofon başlatılamadı","",String(e&&e.message||e))}}

  /* ---- komutu çalıştır ---- */
  async function ayarYukle(){
    if(ayar||ayarDenendi)return;
    try{var v=(await db.ref("okumaAyar").once("value")).val();ayar=v&&v.anahtar?{anahtar:String(v.anahtar),model:v.model?String(v.model):""}:null}
    catch(e){ayar=null;ayarDenendi=true}}
  async function calistir(metin){
    if(mesgul)return;mesgul=true;
    try{
      yaz("⏳ Anlaşılıyor…","«"+metin+"»","");
      await ayarYukle();
      var r=null,not="";
      if(ayar){try{r=await gemini(metin)}catch(e){not=e&&e.message==="anahtar"?" (anahtar geçersiz, basit eşleme kullanıldı)":" (yapay zekâya ulaşılamadı, basit eşleme kullanıldı)"}}
      else not=" (basit eşleme)";
      if(!r)r=yerel(metin);
      var a=ACT[r.islem];
      if(!a){yaz("🤔 Anlayamadım",null,(r.yanit||"Bu komutu henüz yapamıyorum.")+" Örnek: «yeni iş emri aç», «yeni adres ekle», «İnan Makina üretim formu nerede».");return}
      var s=await a.f(r);
      if(s&&typeof s==="object"){
        yaz("🔎 "+s.mesaj,null,s.liste.map(function(e,i){return'<button type="button" class="sl" data-i="'+i+'"><b>'+e2(e.no||"")+"</b> · "+e2(e.musteri||"-")+(e.isAdi?" — "+e2(e.isAdi):"")+"</button>"}).join(""),true);return}
      var ok=!/yetki|bulunamadı|Hangi|erişim|sadece/i.test(s||"");
      yaz((ok?"✓ ":"⚠️ ")+(s||"Tamam")+not,null,"");
      if(ok)kapatZm=setTimeout(kapat,1600)
    }catch(e){yaz("Hata",null,String(e&&e.message||e))}
    finally{mesgul=false}}

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",kur);else kur();
})();
