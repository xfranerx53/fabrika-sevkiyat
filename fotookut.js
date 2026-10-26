/* ===================== FOTOĞRAFTAN İŞ EMRİ DOLDURMA =====================
   Mikro'dan yazdırılan «Üretim İş Takip Formu» fotoğrafı yüklenir, Google Gemini (ücretsiz anahtar)
   formu okur, «Yeni iş emri» penceresindeki alanlar doldurulur. Kullanıcı kontrol edip Kaydet der.
   Veritabanına yalnız `okumaAyar` yolundan ANAHTAR okunur (yazma: sadece yönetici). Fotoğraf kaydedilmez.
   Kullanılan genel işlevler (app.js): $, toast, db, isE, isAdmin, notSet, errText, bugun, iAc. */
(function(){
  var g=function(i){return document.getElementById(i)};
  var MODELLER=["gemini-flash-latest","gemini-2.5-flash","gemini-2.5-flash-lite"];
  var maske=function(k){k=String(k||"");return k.length>12?k.slice(0,6)+"…"+k.slice(-4):(k?"…":"")};
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
    "- fiyat: formda «FİYAT :» hücresi varsa içindeki yazıyı aynen yaz (örn. 120₺ veya 3,5 $ +KDV). Hücre yoksa, boşsa ya da '-' ise \"\" yaz.",
    "- spTarihi: formda yazıldığı gibi (örn. 20.10.26). fx: formda yazıldığı gibi (örn. X-PEŞİN).",
    "JSON şeması (sutunlar tam 3 elemanlı, formdaki sütun sırasıyla):",
    "{\"seriNo\":\"\",\"musteri\":\"\",\"isAdi\":\"\",\"stokAdi\":\"\",\"spTarihi\":\"\",\"fx\":\"\",\"spNo\":\"\",\"formul\":\"\",\"fiyat\":\"\",",
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
  var listeOnb=null;
  var bekle=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
  /* Anahtarın gerçekten kullanabildiği Gemini "flash" modellerini Google'dan sorar (model adları zamanla değişir/kalkar) */
  async function modelListesi(){
    if(listeOnb)return listeOnb;
    var ac=new AbortController(),zt=setTimeout(function(){ac.abort()},8000),out=[];
    try{
      var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",{signal:ac.signal,headers:{"x-goog-api-key":ayar.anahtar}});
      clearTimeout(zt);
      if(r.ok){var j=await r.json();
        (j.models||[]).forEach(function(m){
          var ad=String(m.name||"").replace(/^models\//,"");
          if(!/^gemini-/.test(ad)||!/flash/i.test(ad))return;
          if(/image|tts|live|audio|embed|native|robot|computer|veo|imagen/i.test(ad))return;
          if((m.supportedGenerationMethods||[]).indexOf("generateContent")<0)return;
          out.push(ad)});
        var puan=function(a){var v=(a.match(/(\d+(?:\.\d+)?)/)||[0,0])[1];return(/preview|exp/i.test(a)?100:0)+(/lite/i.test(a)?50:0)-parseFloat(v||0)};
        out.sort(function(x,y){return puan(x)-puan(y)})}
    }catch(e){clearTimeout(zt)}
    if(out.length)listeOnb=out;
    return out}

  var asamaM="";
  /* Yeni Gemini modelleri varsayılan olarak uzun "düşünüyor" (1 dk+). Okuma için düşünmeyi kıs; model bu ayarı tanımazsa (400) ayarsız dene. */
  function dusunmeAyari(m){
    if(/gemini-3/.test(m)||/latest/.test(m))return[{thinkingLevel:"low"},{thinkingBudget:0},null];
    if(/2\.5/.test(m))return[{thinkingBudget:0},null];
    return[null]}

  async function tek(model,dusun,b64){
    var ac=new AbortController(),zt=setTimeout(function(){ac.abort()},40000);
    var gc={temperature:0,responseMimeType:"application/json"};if(dusun)gc.thinkingConfig=dusun;
    try{
      var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent",{
        method:"POST",signal:ac.signal,
        headers:{"Content-Type":"application/json","x-goog-api-key":ayar.anahtar},
        body:JSON.stringify({contents:[{parts:[{text:PROMPT},{inline_data:{mime_type:"image/jpeg",data:b64}}]}],generationConfig:gc})});
      if(r.ok){var j=await r.json();clearTimeout(zt);
        var p=j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts;
        return{ok:1,tx:(p||[]).map(function(x){return x.text||""}).join("").trim()}}
      var t="";try{t=(await r.json()).error.message||""}catch(e){}
      clearTimeout(zt);return{st:r.status,t:t}
    }catch(e){clearTimeout(zt);return{st:(e&&e.name==="AbortError")?"zaman":"ag"}}}

  /* Aynı anda en fazla 3 model: ilki hemen, cevap 12 sn'de gelmezse sıradaki de başlar; ilk başarılı cevap kazanır (bir model takılırsa beklemeyiz) */
  function yarisma(adaylar,b64){return new Promise(function(res){
    var sonuc=[],bitti=0,cik=false,sonraki=0,zm=null;
    function dene(i){
      (async function(){
        var cf=dusunmeAyari(adaylar[i]),sn=null;
        for(var c=0;c<cf.length;c++){
          asamaM="Okunuyor ("+adaylar[i]+")";
          sn=await tek(adaylar[i],cf[c],b64);
          if(sn.ok||!(sn.st===400&&c<cf.length-1&&!/API key/i.test(sn.t||"")))break}
        return sn})().then(function(sn){
        if(cik)return;sonuc[i]=sn;bitti++;
        if(sn.ok){cik=true;clearTimeout(zm);try{localStorage.setItem("okSon",adaylar[i])}catch(e){}return res({ok:1,sn:sn})}
        if(bitti>=adaylar.length){cik=true;clearTimeout(zm);return res({sonuc:sonuc})}
        ileri()})}
    function ileri(){clearTimeout(zm);if(cik||sonraki>=adaylar.length)return;dene(sonraki++);zm=setTimeout(ileri,12000)}
    ileri()})}

  async function gemini(b64){
    asamaM="Model listesi alınıyor";
    var liste=await modelListesi(),adaylar=[];
    var ls=function(k){try{return localStorage.getItem(k)||""}catch(e){return""}};
    var ys=function(k,v){try{localStorage.setItem(k,v)}catch(e){}};
    var dolu={};try{dolu=JSON.parse(ls("okDolu")||"{}")}catch(e){dolu={}}
    var simdi=Date.now(),ekle=function(m){if(m&&adaylar.indexOf(m)<0)adaylar.push(m)};
    /* Sıra: yöneticinin yazdığı model, bu cihazda en son çalışan model, hızlı (lite) modeller, sonra diğerleri. Bugünkü limiti dolan modeller atlanır. */
    var hepsi=liste.length?liste.slice():MODELLER.slice();
    var lite=hepsi.filter(function(m){return/lite/i.test(m)}),normal=hepsi.filter(function(m){return!/lite/i.test(m)});
    if(ayar.model&&(!liste.length||liste.indexOf(ayar.model)>=0))ekle(ayar.model);
    var son=ls("okSon");if(son&&hepsi.indexOf(son)>=0)ekle(son);
    lite.slice(0,2).concat(normal.slice(0,3)).forEach(ekle);
    var uygun=adaylar.filter(function(m){return!(dolu[m]&&dolu[m]>simdi)});
    if(uygun.length)adaylar=uygun;
    adaylar=adaylar.slice(0,4);
    var hatalar=[],yogun=false,zamanasimi=false,kota=false,gunluk=false,bekleSn=0,gMesaj="",sifir=false;
    for(var tur=0;tur<2;tur++){
      hatalar=[];yogun=false;zamanasimi=false;kota=false;gunluk=false;bekleSn=0;var sadece5xx=true;
      var R=await yarisma(adaylar,b64);
      if(R.ok){
        var tx=R.sn.tx;
        if(!tx)throw new Error("Fotoğraftan sonuç alınamadı. Formu daha net ve düz çekip tekrar deneyin.");
        tx=tx.replace(/^```(?:json)?/i,"").replace(/```$/,"").trim();
        try{return JSON.parse(tx)}catch(e){throw new Error("Okunan metin anlaşılamadı. Tekrar deneyin.")}}
      for(var i=0;i<adaylar.length;i++){
        var sn=R.sonuc[i];if(!sn)continue;
        var st=sn.st,t=sn.t||"";
        if(st===404){hatalar.push(adaylar[i]+": yok");continue}
        if(st===500||st===502||st===503||st===504){hatalar.push(adaylar[i]+": "+st);yogun=true;continue}
        if(st==="zaman"){hatalar.push(adaylar[i]+": zaman aşımı");zamanasimi=true;sadece5xx=false;continue}
        if(st==="ag")throw new Error("Google'a bağlanılamadı. İnternet bağlantısını kontrol edin.");
        if(st===429){kota=true;sadece5xx=false;if(/PerDay|per day/i.test(t)){gunluk=true;try{var dd=JSON.parse(localStorage.getItem("okDolu")||"{}");dd[adaylar[i]]=Date.now()+3*3600*1000;localStorage.setItem("okDolu",JSON.stringify(dd))}catch(e){}}if(/limit:\s*0\b/i.test(t))sifir=true;if(!gMesaj)gMesaj=t.replace(/\s+/g," ").slice(0,170);var mm=t.match(/retry in ([\d.]+)\s*s/i);if(mm)bekleSn=Math.max(bekleSn,Math.ceil(+mm[1]));hatalar.push(adaylar[i]+": limit"+(/PerDay|per day/i.test(t)?" (günlük)":"")+(mm?" ("+Math.ceil(+mm[1])+" sn)":""));continue}
        if(st===400&&/API key/i.test(t))throw new Error("API anahtarı geçersiz. Yönetici 🔑 düğmesinden anahtarı yeniden girsin.");
        if(st===403)throw new Error("Anahtarın bu sitede/ülkede kullanımına izin yok (403). "+t.slice(0,120));
        hatalar.push(adaylar[i]+": "+st+" "+t.slice(0,80));continue}
      if(!(yogun&&sadece5xx)||tur===1)break;
      asamaM="Google yoğun, tekrar deneniyor";await bekle(4000)
    }
    var ek=" ("+hatalar.join(", ")+")";
    if(kota&&!yogun&&!zamanasimi&&sifir)throw new Error("Bu anahtarın projesinde ücretsiz okuma kotası 0 görünüyor; beklemek çözmez. AI Studio'da faturalamayı açmak veya farklı bir Google hesabından yeni anahtar almak gerekir. Google'ın mesajı: "+gMesaj+ek);
    if(kota&&!yogun&&!zamanasimi&&gMesaj)ek+=" Google: "+gMesaj;
    if(kota&&!yogun&&!zamanasimi)throw new Error(gunluk||!bekleSn?"Ücretsiz Gemini okuma limiti doldu. Günlük limit Türkiye saatiyle yaklaşık 10:00'da (kış saatinde 11:00) sıfırlanır. Limit modele göre ayrı sayılır; yönetici 🔑 penceresinden başka bir modelin adını yazabilir."+ek:"Dakikalık okuma limiti doldu. "+bekleSn+" saniye sonra tekrar deneyin."+ek);
    throw new Error((yogun?"Google okuma sunucusu şu an yoğun. Birkaç saniye sonra tekrar deneyin. Anahtar sorunu değil.":zamanasimi?"Okuma zaman aşımına uğradı. Tekrar deneyin.":"Uygun okuma modeli bulunamadı.")+ek)}

  /* "120₺", "3,5 $ +KDV", "1.250,50 TL" gibi yazıyı sayı + para birimi + KDV bilgisine çevirir */
  function fiyatCoz(v){
    var m=String(v==null?"":v),r={sayi:null,pb:"TRY",kdv:false};
    var n=m.match(/\d[\d.,]*/);if(!n)return r;
    var x=n[0].replace(/[.,]+$/,"");
    if(x.indexOf(".")>=0&&x.indexOf(",")>=0)x=x.replace(/\./g,"").replace(",",".");
    else if(x.indexOf(",")>=0)x=x.replace(",",".");
    else if(/^\d{1,3}(\.\d{3})+$/.test(x))x=x.replace(/\./g,"");
    var f=parseFloat(x);if(!(f>0))return r;
    r.sayi=String(f).replace(".",",");
    if(/\$|USD|DOLAR/i.test(m))r.pb="USD";else if(/€|EUR/i.test(m))r.pb="EUR";
    r.kdv=/\+\s*KDV|KDV\s*HAR[İI]?[ÇC]/i.test(m);
    return r}

  /* ---- alanları doldur ---- */
  function doldur(o){
    var S=Array.isArray(o.sutunlar)?o.sutunlar:[],set=function(id,v){var e=g(id);if(e)e.value=v==null?"":v};
    var no=seriNo(o.seriNo);if(no)set("iNo",no);
    set("iMu",temiz(o.musteri));set("iAdi",temiz(o.isAdi));set("iSt",temiz(o.stokAdi));set("iFo",temiz(o.formul));
    var t=tarih(o.spTarihi);if(t)set("iTr",t);
    var fy=fiyatCoz(o.fiyat);   /* kâğıtta fiyat yoksa (fiyatsız imalat nüshası) mevcut değere dokunma */
    if(fy.sayi!=null){set("iFy",fy.sayi);var pbE=g("iPb");if(pbE)pbE.value=fy.pb;var kdE=g("iKd");if(kdE)kdE.checked=fy.kdv}
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
    var mv=g("okMevcut");if(mv)mv.textContent=ayar&&ayar.anahtar?"Kayıtlı anahtar: "+maske(ayar.anahtar)+" · model: "+(ayar.model||"otomatik"):"Kayıtlı anahtar yok. Aşağıya yapıştırıp Kaydet'e basın.";
    g("okKey").value="";g("okModel").value=(ayar&&ayar.model)||"";g("okE").textContent="";
    g("dOkAyar").showModal()}

  async function tikla(kam){
    if(mesgul)return;
    try{await ayarYukle(false)}catch(e){return durum("Ayar okunamadı: "+errText(e),true)}
    if(!ayar){
      if(typeof isAdmin==="function"&&isAdmin()){durum("Önce ücretsiz okuma anahtarı girilmeli.",true);return ayarAc()}
      return durum("Fotoğraftan okuma henüz kurulmamış. Yöneticiden anahtar girmesini isteyin.",true)}
    var i=g(kam?"iFotoKam":"iFotoDosya");i.value="";i.click()}

  async function secildi(e){
    var f=e&&e.target&&e.target.files&&e.target.files[0];if(!f||mesgul)return;
    mesgul=true;g("iFoto").disabled=true;g("iFotoGal").disabled=true;
    var t0=Date.now();asamaM="Fotoğraf hazırlanıyor";
    var tmr=setInterval(function(){durum("⏳ "+asamaM+"… "+Math.round((Date.now()-t0)/1000)+" sn")},500);
    durum("⏳ "+asamaM+"…");
    try{var b=await Promise.race([kucult(f),bekle(15000).then(function(){throw new Error("Fotoğraf hazırlanamadı (15 sn). Başka bir fotoğraf deneyin.")})]),o=await gemini(b);clearInterval(tmr);doldur(o)}
    catch(e){clearInterval(tmr);durum("✖ "+(e&&e.message?e.message:String(e)),true)}
    mesgul=false;g("iFoto").disabled=false;g("iFotoGal").disabled=false}

  function kur(){
    if(!g("iFoto"))return;
    g("iFoto").onclick=function(){tikla(true)};g("iFotoGal").onclick=function(){tikla(false)};
    g("iFotoKam").onchange=secildi;g("iFotoDosya").onchange=secildi;
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
        g("dOkAyar").close();durum("✓ Anahtar kaydedildi ("+maske(yeni.anahtar)+"). Şimdi fotoğraf seçebilirsiniz.");toast("Anahtar kaydedildi: "+maske(yeni.anahtar))}
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
