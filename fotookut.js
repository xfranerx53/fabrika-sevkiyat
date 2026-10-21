/* ===================== FOTOĞRAFTAN İŞ EMRİ DOLDURMA =====================
   Mikro'dan yazdırılan «Üretim İş Takip Formu» fotoğrafı yüklenir, Google Gemini (ücretsiz anahtar)
   formu okur, «Yeni iş emri» penceresindeki alanlar doldurulur. Kullanıcı kontrol edip Kaydet der.
   Veritabanına yalnız `okumaAyar` yolundan ANAHTAR okunur (yazma: sadece yönetici). Fotoğraf kaydedilmez.
   Kullanılan genel işlevler (app.js): $, toast, db, isE, isAdmin, notSet, errText, bugun, iAc. */
(function(){
  var g=function(i){return document.getElementById(i)};
  var MODELLER=["gemini-flash-latest","gemini-2.5-flash"];
  var ayar=null;           /* {anahtar, model} */
  var mesgul=false;

  var PROMPT=[
    "Bu fotoğraf bir plastik ambalaj fabrikasının «ÜRETİM İŞ TAKİP FORMU» kâğıdıdır (MAG AMBALAJ).",
    "Formdaki YAZILANLARI aynen oku. Cevabın SADECE geçerli bir JSON nesnesi olsun, başka hiçbir metin yazma.",
    "Kurallar:",
    "- Formda 3 sütun vardır (soldan sağa 1., 2., 3.). SİPARİŞ MİKTARI, EN, MİKRON, KORONA, NOT (üretim), ÜRÜN ADI, BOY/KAZAN, BASKI RENGİ ve alttaki NOT (baskı-kesim) satırları sütun sütun okunur.",
    "- Kâğıda elle çizilmiş çarpı (X), çizgi veya karalama olabilir: bunları YOK SAY, altındaki basılı yazıyı normal oku.",
    "- Hücre boşsa ya da '-' yazıyorsa \"\" (boş metin) yaz. Görünmeyen veya okunamayan bir şeyi UYDURMA, boş bırak.",
    "- Türkçe karakterleri ve yazılışı olduğu gibi koru (büyük harfle yazıldığı gibi). Seri no örneği: MG-0968.",
    "- kg: yalnızca sayı (birim yazma). mikron: yalnızca sayı (µ işareti yazma, virgül varsa koru: 3,5). en: formda yazıldığı gibi (örn. 22*7*7).",
    "- spTarihi: formda yazıldığı gibi (örn. 20.10.26). fx: formda yazıldığı gibi (örn. X-PEŞİN).",
    "JSON şeması (sutunlar tam 3 elemanlı, formdaki sütun sırasıyla):",
    "{\"seriNo\":\"\",\"musteri\":\"\",\"isAdi\":\"\",\"stokAdi\":\"\",\"spTarihi\":\"\",\"fx\":\"\",\"spNo\":\"\",\"formul\":\"\",",
    "\"sutunlar\":[{\"kg\":\"\",\"en\":\"\",\"mikron\":\"\",\"korona\":\"\",\"uretimNotu\":\"\",\"urunAdi\":\"\",\"boy\":\"\",\"baskiRengi\":\"\",\"baskiNotu\":\"\"},{...},{...}]}"
  ].join("\n");

  function durum(m,hata){var d=g("iFotoD");if(!d)return;d.textContent=m||"";d.style.color=hata?"#c1121f":"#475569"}

  /* ---- yardımcılar ---- */
  function temiz(v){v=String(v==null?"":v).replace(/\s+/g," ").trim();return(v==="-"||v==="—"||v==="–")?"":v}
  function fold(s){return String(s||"").toUpperCase().replace(/İ/g,"I").replace(/Ş/g,"S").replace(/Ğ/g,"G").replace(/Ü/g,"U").replace(/Ö/g,"O").replace(/Ç/g,"C").replace(/\s+/g,"")}
  function sayi(v){ /* Türkçe sayı biçimi → "150" / "1500" / "3.5" (type=number alanı için) */
    v=temiz(v).replace(/[^\d.,]/g,"");if(!v)return"";
    if(v.indexOf(".")>-1&&v.indexOf(",")>-1)v=v.replace(/\./g,"").replace(",",".");
    else if(/^\d{1,3}(\.\d{3})+$/.test(v))v=v.replace(/\./g,"");
    else v=v.replace(",",".");
    var n=parseFloat(v);return isFinite(n)&&n>0?String(n):""}
  function seriNo(v){v=temiz(v).toUpperCase();var m=v.match(/MG\s*[-–]?\s*(\d{3,6})/);return m?"MG-"+m[1]:v}
  function tarih(v){var m=temiz(v).match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/);if(!m)return"";
    var y=+m[3];if(y<100)y+=2000;var p=function(n){return String(n).padStart(2,"0")};
    var a=+m[2],d=+m[1];if(a<1||a>12||d<1||d>31)return"";return y+"-"+p(a)+"-"+p(d)}
  function benzersiz(a){var s={},o=[];a.forEach(function(x){x=temiz(x);var k=fold(x);if(x&&!s[k]){s[k]=1;o.push(x)}});return o}

  /* ---- fotoğrafı küçült (en uzun kenar 1600 px, JPEG) ---- */
  function kucult(file){return new Promise(function(ok,no){
    var url=URL.createObjectURL(file),im=new Image();
    im.onload=function(){
      var w=im.naturalWidth,h=im.naturalHeight,k=Math.min(1,1600/Math.max(w,h)),cv=document.createElement("canvas");
      cv.width=Math.round(w*k);cv.height=Math.round(h*k);cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);
      URL.revokeObjectURL(url);var d=cv.toDataURL("image/jpeg",0.88);ok(d.slice(d.indexOf(",")+1))};
    im.onerror=function(){URL.revokeObjectURL(url);no(new Error("Fotoğraf açılamadı. JPG veya PNG deneyin."))};
    im.src=url})}

  /* ---- Gemini çağrısı ---- */
  async function gemini(b64){
    var modeller=ayar.model?[ayar.model].concat(MODELLER):MODELLER,sonHata=null;
    for(var i=0;i<modeller.length;i++){
      var ac=new AbortController(),zt=setTimeout(function(){ac.abort()},60000);
      try{
        var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(modeller[i])+":generateContent",{
          method:"POST",signal:ac.signal,
          headers:{"Content-Type":"application/json","x-goog-api-key":ayar.anahtar},
          body:JSON.stringify({contents:[{parts:[{text:PROMPT},{inline_data:{mime_type:"image/jpeg",data:b64}}]}],
            generationConfig:{temperature:0,responseMimeType:"application/json"}})});
        clearTimeout(zt);
        if(r.status===404){sonHata=new Error("Model bulunamadı ("+modeller[i]+")");continue}
        if(!r.ok){var t="";try{t=(await r.json()).error.message||""}catch(e){}
          if(r.status===429)throw new Error("Ücretsiz okuma limiti doldu. Biraz bekleyip tekrar deneyin (günlük limit gece sıfırlanır).");
          if(r.status===400&&/API key/i.test(t))throw new Error("API anahtarı geçersiz. Yönetici 🔑 düğmesinden anahtarı yeniden girsin.");
          if(r.status===403)throw new Error("Anahtarın bu sitede/ülkede kullanımına izin yok (403). "+t.slice(0,120));
          throw new Error("Okuma hatası ("+r.status+"). "+t.slice(0,120))}
        var j=await r.json(),p=j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts;
        var tx=(p||[]).map(function(x){return x.text||""}).join("").trim();
        if(!tx)throw new Error("Fotoğraftan sonuç alınamadı. Formu daha net ve düz çekip tekrar deneyin.");
        tx=tx.replace(/^```(?:json)?/i,"").replace(/```$/,"").trim();
        return JSON.parse(tx);
      }catch(e){clearTimeout(zt);
        if(e&&e.name==="AbortError")throw new Error("Okuma zaman aşımına uğradı. Tekrar deneyin.");
        if(e instanceof SyntaxError)throw new Error("Okunan metin anlaşılamadı. Tekrar deneyin.");
        throw e}
    }
    throw sonHata||new Error("Model bulunamadı.")}

  /* ---- alanları doldur ---- */
  function doldur(o){
    var S=Array.isArray(o.sutunlar)?o.sutunlar:[],set=function(id,v){var e=g(id);if(e)e.value=v==null?"":v};
    var no=seriNo(o.seriNo);if(no)set("iNo",no);
    set("iMu",temiz(o.musteri));set("iAdi",temiz(o.isAdi));set("iSt",temiz(o.stokAdi));set("iFo",temiz(o.formul));
    var t=tarih(o.spTarihi);if(t)set("iTr",t);
    var fx=temiz(o.fx);
    if(fx){var sx=g("iFx"),bul=null;[].forEach.call(sx.options,function(op){if(fold(op.value)===fold(fx))bul=op});
      if(!bul){bul=document.createElement("option");bul.value=bul.textContent=fx.toUpperCase();bul.dataset.ek="1";sx.appendChild(bul)}
      sx.value=bul.value;sx.dispatchEvent(new Event("change"))}
    [0,1,2].forEach(function(n){var c=S[n]||{};
      var v={kg:sayi(c.kg),en:temiz(c.en),mikron:temiz(c.mikron).replace(/[µμu]\s*$/i,"").trim(),korona:temiz(c.korona),boy:temiz(c.boy)};
      document.querySelectorAll('#iCols [data-c="'+n+'"]').forEach(function(i){i.value=v[i.dataset.f]||""})});
    var notU=benzersiz(S.map(function(c){return c&&c.uretimNotu})),notB=benzersiz(S.map(function(c){return c&&c.baskiNotu}));
    notSet("iNtU",notU.join("\n"));notSet("iNtB",notB.join("\n"));
    var ad=benzersiz(S.map(function(c){return c&&c.urunAdi}))[0]||"",renk=benzersiz(S.map(function(c){return c&&c.baskiRengi}))[0]||"";
    set("iBU",ad);set("iRenk",renk);
    g("iBv").checked=/BASKILI/i.test(temiz(o.stokAdi))||!!renk;
    var q=g("iNo");if(q)q.dispatchEvent(new Event("input")); /* QR güncellensin */
    var yok=[];if(!no)yok.push("seri no");if(!temiz(o.musteri))yok.push("müşteri");
    if(!S.some(function(c){return c&&sayi(c.kg)}))yok.push("kg");
    var dup=no&&typeof isE!=="undefined"&&isE.some(function(x){return x.no===no});
    g("iE").textContent=dup?"Bu seri no ("+no+") zaten kayıtlı. Aynı iş emrini tekrar eklemeyin.":"";
    durum(dup?"⚠️ Okundu ama bu seri no zaten kayıtlı.":"✓ Okundu. Lütfen alanları kontrol edip Kaydet'e basın."+(yok.length?" Okunamayanlar: "+yok.join(", ")+".":""),dup)}

  /* ---- anahtar ---- */
  async function ayarYukle(zorla){
    if(ayar&&!zorla)return ayar;
    var s=await db.ref("okumaAyar").once("value"),v=s.val();
    ayar=v&&v.anahtar?{anahtar:String(v.anahtar),model:v.model?String(v.model):""}:null;return ayar}

  function ayarAc(){
    g("okKey").value="";g("okModel").value=(ayar&&ayar.model)||"";g("okE").textContent="";
    g("dOkAyar").showModal()}

  async function tikla(){
    if(mesgul)return;
    try{await ayarYukle(false)}catch(e){return durum("Ayar okunamadı: "+errText(e),true)}
    if(!ayar){
      if(typeof isAdmin==="function"&&isAdmin()){durum("Önce ücretsiz okuma anahtarı girilmeli.",true);return ayarAc()}
      return durum("Fotoğraftan okuma henüz kurulmamış. Yöneticiden anahtar girmesini isteyin.",true)}
    g("iFotoDosya").value="";g("iFotoDosya").click()}

  async function secildi(){
    var f=g("iFotoDosya").files[0];if(!f||mesgul)return;
    mesgul=true;g("iFoto").disabled=true;durum("⏳ Fotoğraf okunuyor… (10-20 sn sürebilir)");
    try{var b=await kucult(f),o=await gemini(b);doldur(o)}
    catch(e){durum("✖ "+(e&&e.message?e.message:String(e)),true)}
    mesgul=false;g("iFoto").disabled=false}

  function kur(){
    if(!g("iFoto"))return;
    g("iFoto").onclick=tikla;g("iFotoDosya").onchange=secildi;
    g("iFotoAyar").onclick=async function(){try{await ayarYukle(true)}catch(e){}ayarAc()};
    g("okVazgec").onclick=function(){g("dOkAyar").close()};
    g("okKaydet").onclick=async function(){
      var k=g("okKey").value.trim(),m=g("okModel").value.trim(),E=g("okE");
      if(!k&&!(ayar&&ayar.anahtar))return E.textContent="Anahtarı yapıştırın.";
      if(k&&!/^[\w.-]{20,120}$/.test(k))return E.textContent="Anahtar biçimi geçersiz görünüyor (boşluk/harf hatası olabilir).";
      if(m&&!/^[\w.-]{3,60}$/.test(m))return E.textContent="Model adı geçersiz.";
      g("okKaydet").disabled=true;
      try{var yeni={anahtar:k||ayar.anahtar};if(m)yeni.model=m;
        await db.ref("okumaAyar").set(yeni);ayar={anahtar:yeni.anahtar,model:m||""};
        g("dOkAyar").close();durum("✓ Anahtar kaydedildi. Şimdi fotoğraf seçebilirsiniz.");toast("Anahtar kaydedildi")}
      catch(e){E.textContent=errText(e)}
      g("okKaydet").disabled=false};
    /* iAc sarmalayıcı: yalnız YENİ iş emrinde düğme görünsün; açılışta mesaj temizlensin */
    var eski=window.iAc;
    if(typeof eski==="function")window.iAc=function(e){
      var r=eski.apply(this,arguments);
      g("iFotoW").style.display=e?"none":"flex";
      g("iFotoAyar").style.display=(typeof isAdmin==="function"&&isAdmin())?"":"none";
      durum("");return r}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",kur);else kur();
})();
