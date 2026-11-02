/* ===================== FOTOĞRAFTAN İŞ EMRİ DOLDURMA =====================
   Mikro'dan yazdırılan «Üretim İş Takip Formu» fotoğrafı yüklenir, Google Gemini (ücretsiz anahtar)
   formu okur, «Yeni iş emri» penceresindeki alanlar doldurulur. Kullanıcı kontrol edip Kaydet der.
   v115: AYNI düğmelerle Mikro «Çok Dövizli Alınan Sipariş Fişi» ekranı (ekran görüntüsü / ekran fotoğrafı) da okunur;
   belge türünü Gemini ayırt eder (`belge`: takip | mikro). Mikro fişinde seri no DEĞİŞMEZ (otomatik sıradaki kalır).
   Veritabanına yalnız `okumaAyar` yolundan ANAHTAR okunur (yazma: sadece yönetici). Fotoğraf kaydedilmez.
   Kullanılan genel işlevler (app.js): $, toast, db, isE, isAdmin, notSet, errText, bugun, iAc. */
(function(){
  var g=function(i){return document.getElementById(i)};
  var MODELLER=["gemini-flash-latest","gemini-2.5-flash","gemini-2.5-flash-lite"];
  var maske=function(k){k=String(k||"");return k.length>12?k.slice(0,6)+"…"+k.slice(-4):(k?"…":"")};
  var ayar=null;           /* {anahtar, model} */
  var mesgul=false;

  /* v134: müşteri mesajı (yazı, sesli not dökümü, ekran görüntüsü) → takip formu alanları */
  var MESAJ_KURAL=[
    "MESAJ kuralları (belge=mesaj): Müşteri günlük dille yazar: «50 kilo 30x50 şeffaf atlet, 3 renk baskı, cuma lazım» gibi.",
    "- Her farklı ürün/ölçü bir sütundur (en çok 3). kg: miktar kilo ise sayı; adet/koli/paket ise kg BOŞ kalsın ve miktarı uretimNotu'na yaz (örn. «10.000 ADET»).",
    "- en: ölçünün ilk sayısı ya da yazıldığı gibi (30x50 → en 30, boy 50; 42*14*14 → en 42*14*14). mikron: «30 mikron», «30µ» → 30.",
    "- urunAdi: ATLET, TORBA, HIŞIR, ÇÖP TORBASI, JELATİN gibi BÜYÜK harfle. baskiRengi: baskı varsa renk/renk sayısı (örn. «2 RENK KIRMIZI-MAVİ»), yoksa boş. stokAdi: ürünün kısa tanımı (örn. «ŞEFFAF LDPE ATLET»); baskılıysa BASKILI kelimesi geçsin.",
    "- korona: yalnız mesajda geçerse. formul: yalnız mesajda malzeme/renk yazıyorsa (örn. «HD BEYAZ», «LDPE ŞEFFAF»).",
    "- musteri: mesajı yazan firma adı yazıyorsa onu, yoksa boş. spTarihi: bugünün tarihi değil, mesajda sipariş tarihi yoksa boş. termin: «cuma», «15'inde», «haftaya» gibi teslim isteğini GG.AA.YYYY olarak (bugün: "+new Date().toLocaleDateString("tr-TR")+"), yoksa boş.",
    "- Mesajdaki diğer önemli şeyleri (teslim adresi, paketleme, ödeme, özel istek) kısa ve BÜYÜK harfle ilk sütunun uretimNotu'na ekle. Seri no, fiyat ve fx yazma (boş bırak).",
    "- Emin olmadığın şeyi UYDURMA; anlaşılmayanları \"eksik\" alanına kısa liste olarak yaz (örn. [\"mikron\",\"renk\"])."
  ].join("\n");
  var PROMPT=[
    "Bu fotoğraf iki türden biri olabilir: (A) plastik ambalaj fabrikasının (MAG AMBALAJ) «ÜRETİM İŞ TAKİP FORMU» kâğıdı, veya (B) Mikro muhasebe programının «Çok Dövizli Alınan Sipariş Fişi» ekranı (ekran görüntüsü ya da ekranın fotoğrafı).",
    "(C) türü de olabilir: müşterinin sipariş MESAJI (WhatsApp/SMS/e-posta ekran görüntüsü ya da el yazısı not). Bu durumda belge=\"mesaj\" yaz ve (A)'daki alanları mesajdan çıkar (aşağıdaki MESAJ kuralları).",
    "Önce türü belirle: \"belge\" alanına A için \"takip\", B için \"mikro\", C için \"mesaj\" yaz. Yalnız o türün alanlarını doldur, diğerini boş bırak.",
    MESAJ_KURAL,
    "Yazılanları aynen oku. Cevabın SADECE geçerli bir JSON nesnesi olsun, başka hiçbir metin yazma.",
    "(B) MİKRO FİŞİ kuralları: üstte evrak no, tarih, C/H kodu, C/H ismi, ödeme planı, proje; ortadaki tabloda her SATIR bir kalemdir (sütunlar: Cinsi, Kodu, İsmi, Döviz cinsi, Miktar, Br(birim), Birim fiyat, Tutarı, Tesl. tarihi, Açıklama). Kalemleri yukarıdan aşağı en çok 6 satır oku. Sayıları ve tarihleri ekranda yazıldığı gibi yaz (örn. 600,00 ; 14.10.2026). Satırdaki «Döviz cinsi» ve «Birim fiyat» değerini kullan (alttaki toplam kutularını değil). kdvOrani: soldaki «KDV (%)» kutusundaki sayı. Açıklama sütunundaki yazıyı aynen ver (örn. 55 X 95). Görünmeyen/kesik/okunamayan şeyi UYDURMA, boş bırak. Boş satırları alma.",
    "(A) TAKİP FORMU kuralları:",
    "- Formda 3 sütun vardır (soldan sağa 1., 2., 3.). SİPARİŞ MİKTARI, EN, MİKRON, KORONA, NOT (üretim), ÜRÜN ADI, BOY/KAZAN, BASKI RENGİ ve alttaki NOT (baskı-kesim) satırları sütun sütun okunur.",
    "- Kâğıda elle çizilmiş çarpı (X), çizgi veya karalama olabilir: bunları YOK SAY, altındaki basılı yazıyı normal oku.",
    "- Hücre boşsa ya da '-' yazıyorsa \"\" (boş metin) yaz. Görünmeyen veya okunamayan bir şeyi UYDURMA, boş bırak.",
    "- Türkçe karakterleri ve yazılışı olduğu gibi koru (büyük harfle yazıldığı gibi). Seri no örneği: MG-0968.",
    "- kg: yalnızca sayı (birim yazma). mikron: yalnızca sayı (µ işareti yazma, virgül varsa koru: 3,5). en: formda yazıldığı gibi (örn. 22*7*7).",
    "- fiyat: formda «FİYAT :» hücresi varsa içindeki yazıyı aynen yaz (örn. 120₺ veya 3,5 $ +KDV). Hücre yoksa, boşsa ya da '-' ise \"\" yaz.",
    "- spTarihi: formda yazıldığı gibi (örn. 20.10.26). fx: formda yazıldığı gibi (örn. X-PEŞİN).",
    "JSON şeması (sutunlar tam 3 elemanlı, formdaki sütun sırasıyla; mikro.kalemler fişteki satır sayısı kadar):",
    "{\"seriNo\":\"\",\"musteri\":\"\",\"termin\":\"\",\"eksik\":[],\"isAdi\":\"\",\"stokAdi\":\"\",\"spTarihi\":\"\",\"fx\":\"\",\"spNo\":\"\",\"formul\":\"\",\"fiyat\":\"\",",
    "\"sutunlar\":[{\"kg\":\"\",\"en\":\"\",\"mikron\":\"\",\"korona\":\"\",\"uretimNotu\":\"\",\"urunAdi\":\"\",\"boy\":\"\",\"baskiRengi\":\"\",\"baskiNotu\":\"\"},{...},{...}],\"belge\":\"\",\"mikro\":{\"evrakNo\":\"\",\"tarih\":\"\",\"cariKodu\":\"\",\"cariIsmi\":\"\",\"proje\":\"\",\"odemePlani\":\"\",\"kdvOrani\":\"\",\"kalemler\":[{\"kod\":\"\",\"isim\":\"\",\"doviz\":\"\",\"miktar\":\"\",\"birim\":\"\",\"birimFiyat\":\"\",\"teslimTarihi\":\"\",\"aciklama\":\"\"}]}}"
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
        body:JSON.stringify({contents:[{parts:Array.isArray(b64)?b64:[{text:PROMPT},{inline_data:{mime_type:"image/jpeg",data:b64}}]}],generationConfig:gc})});
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

  /* ---- MİKRO «Çok Dövizli Alınan Sipariş Fişi» → iş emri alanları (v115) ---- */
  function ust(v){return temiz(v).toLocaleUpperCase("tr-TR")}
  function fxAyarla(fx){var sx=g("iFx");if(!sx||!fx)return;var bul=null;
    [].forEach.call(sx.options,function(op){if(fold(op.value)===fold(fx))bul=op});
    if(!bul){bul=document.createElement("option");bul.value=bul.textContent=fx;bul.dataset.ek="1";sx.appendChild(bul)}
    sx.value=bul.value;sx.dispatchEvent(new Event("change"))}
  /* Açıklama: "55 X 95" → en 55 / boy 95 · "42*14*14" → en 42*14*14 · "30 MİKRON" → mikron 30 · kalan yazı üretim notuna */
  function aciklamaCoz(a){
    var rest=temiz(a),r={en:"",boy:"",mikron:"",kalan:""};if(!rest)return r;
    var N="(\\d+(?:[.,]\\d+)?)",X="\\s*[xX*×]\\s*";
    var mk=rest.match(new RegExp(N+"\\s*(?:[Mm][İIiı][Kk][Rr][Oo][Nn]|[Mm][İIiı][Cc]|[µμ])"));
    if(mk){r.mikron=mk[1];rest=rest.replace(mk[0]," ")}
    var e3=rest.match(new RegExp(N+X+N+X+N)),e2=!e3&&rest.match(new RegExp(N+X+N));
    if(e3){r.en=e3[1]+"*"+e3[2]+"*"+e3[3];rest=rest.replace(e3[0]," ")}
    else if(e2){r.en=e2[1];r.boy=e2[2];rest=rest.replace(e2[0]," ")}
    r.kalan=rest.replace(/\s+/g," ").replace(/^[\s,;:\-–]+|[\s,;:\-–]+$/g,"");
    return r}
  function mikroDoldur(m){
    var set=function(id,v){var e=g(id);if(e)e.value=v==null?"":v},uy=[];
    var K=(Array.isArray(m.kalemler)?m.kalemler:[]).filter(function(k){return k&&(temiz(k.isim)||temiz(k.kod)||sayi(k.miktar))});
    var K1=K[0]||{};
    if(K.length>3)uy.push("Fişte "+K.length+" kalem var, formda 3 sütun olduğu için ilk 3'ü alındı");
    /* üst alanlar (seri no'ya DOKUNULMAZ: uygulamanın verdiği sıradaki numara kalır) */
    set("iMu",ust(m.cariIsmi));set("iAdi",ust(m.proje));set("iSt",ust(K1.isim));set("iFo","");
    var tr=tarih(m.tarih);if(tr)set("iTr",tr);
    var tm=tarih(K1.teslimTarihi);set("iTermin",(tm&&tr&&tm>tr)?tm:""); /* teslim tarihi sipariş tarihiyle aynıysa Mikro'nun varsayılanıdır → termin yazılmaz (yoksa iş hemen «geciken» görünür) */
    /* F/X + fiyat */
    var kdvO=parseFloat(sayi(m.kdvOrani))||0,fatura=kdvO>0;
    var pl=temiz(m.odemePlani),pn=parseFloat(sayi(pl)),plan=pl?(/^\d+$/.test(pl)?(pn>0?pn+" GÜN":"PEŞİN"):ust(pl)):"PEŞİN";
    fxAyarla((fatura?"F-":"X-")+plan);
    var kgBirim=function(b){b=temiz(b);return!b||/^k\s*\.?\s*g/i.test(b)||/^kilo/i.test(b)};
    var fyE=g("iFy");
    if(fyE){
      var fiy=temiz(K1.birimFiyat);
      if(fiy&&kgBirim(K1.birim)){var fy=fiyatCoz(fiy+" "+(temiz(K1.doviz)||"TL"));
        if(fy.sayi!=null){fyE.value=fy.sayi;var pbE=g("iPb");if(pbE)pbE.value=fy.pb;var kdE=g("iKd");if(kdE)kdE.checked=fatura}
        var fark=K.slice(0,3).some(function(k){return sayi(k.birimFiyat)&&sayi(k.birimFiyat)!==sayi(K1.birimFiyat)});
        if(fark)uy.push("Kalemlerin fiyatları farklı, yalnız 1. kalemin fiyatı yazıldı")}
      else{fyE.value="";if(fiy)uy.push("1. kalemin birimi kg değil, fiyat yazılmadı")}}
    /* sütunlar: her kalem bir sütun */
    var notlar=[];
    [0,1,2].forEach(function(n){var k=K[n],c={kg:"",en:"",mikron:"",korona:"",boy:""};
      if(k){
        var a=aciklamaCoz(k.aciklama),on=K.length>1?(n+1)+". SÜTUN — ":"";
        if(kgBirim(k.birim))c.kg=sayi(k.miktar);
        else if(sayi(k.miktar))notlar.push(on+"SİPARİŞ MİKTARI: "+temiz(k.miktar)+" "+ust(k.birim));
        if(!temiz(k.birim)&&sayi(k.miktar))uy.push("birim okunamadı, kg varsayıldı");
        c.en=a.en;c.boy=a.boy;c.mikron=a.mikron;
        if(a.kalan)notlar.push(on+"AÇIKLAMA: "+a.kalan);
        if(n>0&&ust(k.isim)&&ust(k.isim)!==ust(K1.isim))notlar.push(on+"ÜRÜN: "+ust(k.isim))}
      document.querySelectorAll('#iCols [data-c="'+n+'"]').forEach(function(i){i.value=c[i.dataset.f]||""})});
    notSet("iNtU",notlar.join("\n"));notSet("iNtB","");
    /* baskı-kesim bölümü: «OR. LDPE. BASKILI TORBA» → ürün adı TORBA; BASKILI ise baskılı iş (BASKISIZ değil) */
    var st=ust(K1.isim),son=(st.split(/\s+/).pop()||"").replace(/[^A-ZÇĞİÖŞÜ]/g,"");
    set("iBU",son.length>=3?son:"");set("iRenk","");
    g("iBv").checked=/BASKILI/.test(fold(st));
    var q=g("iNo");if(q)q.dispatchEvent(new Event("input"));
    var yok=[];if(!ust(m.cariIsmi))yok.push("müşteri");
    if(!K.length)yok.push("kalem");
    else if(![0,1,2].some(function(n){return K[n]&&kgBirim(K[n].birim)&&sayi(K[n].miktar)}))yok.push("kg");
    g("iE").textContent="";
    var ref=temiz(m.evrakNo);
    durum("✓ Mikro fişi okundu"+(ref?" ("+ref+")":"")+". Seri no sıradaki numara; iş adı, formül, mikron fişte olmadığından boş. Lütfen kontrol edip Kaydet'e basın."+(yok.length?" Okunamayanlar: "+yok.join(", ")+".":"")+(uy.length?" ⚠️ "+benzersiz(uy).join("; ")+".":""),yok.length>0)}

  /* ---- alanları doldur ---- */
  function doldur(o){
    o=o||{};
    var mkOk=o.mikro&&Array.isArray(o.mikro.kalemler)&&o.mikro.kalemler.length;
    if(o.belge==="mikro"||(mkOk&&!temiz(o.musteri)&&!temiz(o.seriNo)))return mikroDoldur(o.mikro||{});
    var S=Array.isArray(o.sutunlar)?o.sutunlar:[],set=function(id,v){var e=g(id);if(e)e.value=v==null?"":v};
    var mesaj=o.belge==="mesaj";
    var no=mesaj?"":seriNo(o.seriNo);if(no)set("iNo",no);
    if(mesaj){var tm=tarih(o.termin);if(tm)set("iTermin",tm)}
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
    var yok=[];if(!no&&!mesaj)yok.push("seri no");if(!temiz(o.musteri))yok.push("müşteri");
    if(mesaj&&Array.isArray(o.eksik))o.eksik.forEach(function(x){x=temiz(x);if(x&&yok.indexOf(x)<0)yok.push(x)});
    if(!S.some(function(c){return c&&sayi(c.kg)}))yok.push("kg");
    var dupM=no&&typeof isVarMesaj==="function"?isVarMesaj(no):"",dup=!!dupM;
    g("iE").textContent=dupM;
    durum(dup?"⚠️ Okundu ama bu seri no zaten kayıtlı (ayrıntı aşağıda).":(mesaj?"✓ Mesajdan dolduruldu (seri no sıradaki numara). ":"✓ Okundu. ")+"Lütfen alanları kontrol edip Kaydet'e basın."+(yok.length?(mesaj?" Mesajda olmayan/belirsiz: ":" Okunamayanlar: ")+yok.join(", ")+".":""),dup)}

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

  /* ===================== v134: 💬 MESAJDAN / 🎤 SESTEN İŞ EMRİ + 📥 GELEN SİPARİŞLER =====================
     WhatsApp yazısı yapıştırılır ya da konuşularak söylenir → aynı Gemini anahtarıyla (okumaAyar) form doldurulur.
     «Gelen siparişler»: Mag Pazar gece ajanının `aiTaslak/` altına koyduğu müşteri portalı / e-posta / web sitesi siparişleri.
     Hiçbir şey kendiliğinden kaydedilmez: form dolar, kişi kontrol edip Kaydet'e basar. */
  async function okuMetin(metin,ust){
    try{await ayarYukle(false)}catch(e){throw new Error("Ayar okunamadı: "+errText(e))}
    if(!ayar)throw new Error("Yapay zekâ okuma anahtarı girilmemiş. Yönetici 🔑 düğmesinden girsin.");
    var o=await gemini([{text:PROMPT+"\n\nŞu an fotoğraf YOK. Aşağıdaki MESAJ metnini (C) türü olarak işle: belge=\"mesaj\".\nMESAJ:\n"+String(metin).slice(0,6000)}]);
    o=o||{};o.belge="mesaj";if(ust&&ust.musteri&&!temiz(o.musteri))o.musteri=ust.musteri;
    doldur(o);return o}
  window.okuAI=async function(parcalar){await ayarYukle(false);if(!ayar)throw new Error("Yapay zekâ okuma anahtarı girilmemiş (yönetici 🔑).");return gemini(parcalar)};
  window.okuKucult=kucult;

  var tanima=null;
  function msjDlg(){var d=g("dMsj");if(d)return d;d=document.createElement("dialog");d.id="dMsj";d.style.width="min(520px,96vw)";
    d.innerHTML='<h3 style="margin-bottom:4px">💬 Mesajdan iş emri</h3><div class="mut" style="font-size:13px;margin-bottom:6px">Müşterinin WhatsApp / SMS / e-posta mesajını yapıştırın ya da 🎤 ile siparişi söyleyin. Yapay zekâ formu doldurur, siz kontrol edip Kaydet dersiniz.</div>'+
      '<textarea id="msjT" rows="7" style="width:100%;font-size:16px" placeholder="Örn: Selam, 50 kilo 30x50 şeffaf atlet, 2 renk baskı logolu, cumaya lazım. Doku Ambalaj"></textarea>'+
      '<div style="display:flex;gap:6px;margin:6px 0"><button type="button" class="btn b7" id="msjMik" style="flex:1;margin:0">🎤 Konuşarak yaz</button><button type="button" class="btn b3" id="msjYap" style="flex:1;margin:0">📋 Panodan yapıştır</button></div>'+
      '<div id="msjD" style="font-size:14px;color:#475569;min-height:18px"></div>'+
      '<div style="display:flex;gap:8px;margin-top:6px"><button type="button" class="btn b6" id="msjNo">Vazgeç</button><button type="button" class="btn b1" id="msjOk">✨ Oku ve formu doldur</button></div>';
    document.body.appendChild(d);
    var D=function(m,h){var x=g("msjD");x.textContent=m||"";x.style.color=h?"#c1121f":"#475569"};
    var dur=function(){if(tanima){try{tanima.stop()}catch(e){}tanima=null}g("msjMik").textContent="🎤 Konuşarak yaz"};
    g("msjNo").onclick=function(){dur();d.close()};
    d.addEventListener("close",dur);
    g("msjYap").onclick=async function(){try{var t=await navigator.clipboard.readText();if(t){var a=g("msjT");a.value=(a.value?a.value+"\n":"")+t;D("✓ Yapıştırıldı")}else D("Panoda yazı yok.",1)}catch(e){D("Telefon panoya erişime izin vermedi: kutuya basılı tutup «Yapıştır» deyin.",1)}};
    g("msjMik").onclick=function(){
      if(tanima)return dur();
      var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!SR)return D("Bu telefonda uygulama içi sesli yazma yok. Kutuya dokunup klavyedeki 🎤 tuşuyla konuşabilirsiniz.",1);
      var r=new SR(),a=g("msjT"),bas=a.value?a.value.replace(/\s*$/," "):"";r.lang="tr-TR";r.continuous=true;r.interimResults=true;
      r.onresult=function(ev){var son="",ara="";for(var i=0;i<ev.results.length;i++){var t=ev.results[i][0].transcript;if(ev.results[i].isFinal)son+=t+" ";else ara+=t}a.value=bas+son+ara};
      r.onerror=function(ev){D(ev.error==="not-allowed"?"Mikrofon izni verilmedi.":"Ses alınamadı ("+ev.error+").",1);dur()};
      r.onend=function(){if(tanima===r)dur()};
      try{r.start();tanima=r;g("msjMik").textContent="⏹ Bitir";D("🎙 Dinliyorum… siparişi söyleyin, bitince ⏹ Bitir'e basın.")}catch(e){D("Mikrofon açılamadı.",1)}};
    g("msjOk").onclick=async function(){
      dur();var t=g("msjT").value.trim();if(t.length<4)return D("Önce mesajı yazın ya da söyleyin.",1);
      g("msjOk").disabled=true;var t0=Date.now(),tm=setInterval(function(){D("⏳ "+(asamaM||"Okunuyor")+"… "+Math.round((Date.now()-t0)/1000)+" sn")},500);
      try{await okuMetin(t);clearInterval(tm);d.close()}catch(e){clearInterval(tm);D("✖ "+(e&&e.message||e),1)}
      g("msjOk").disabled=false};
    return d}

  /* ---- 📥 gelen siparişler (aiTaslak) ---- */
  var gelenL=[];
  var KYN={portal:"🛒 Müşteri portalı",eposta:"📧 E-posta",site:"🌐 Web sitesi"};
  async function gelenSay(){var b=g("iGelen");if(!b)return;
    try{var v=(await db.ref("aiTaslak").orderByChild("durum").equalTo("yeni").once("value")).val()||{};
      gelenL=Object.keys(v).map(function(k){return Object.assign({id:k},v[k])}).sort(function(a,b){return(b.t||0)-(a.t||0)});
      b.style.display=gelenL.length?"":"none";b.textContent="📥 Gelen siparişler ("+gelenL.length+")"}catch(e){b.style.display="none"}}
  function taslakMetin(x){return[(x.firma?"Firma: "+x.firma:""),(x.kalem||[]).map(function(k){return"- "+[k.urun,k.mik?k.mik+" "+(k.birim||""):"",k.olcu||""].filter(Boolean).join(" ")}).join("\n"),x.not||""].filter(Boolean).join("\n")}
  function gelenAc(){var d=g("dGelen");
    if(!d){d=document.createElement("dialog");d.id="dGelen";d.style.width="min(520px,96vw)";
      d.innerHTML='<h3 style="margin-bottom:6px">📥 Gelen siparişler</h3><div class="mut" style="font-size:13px;margin-bottom:8px">Müşteri portalından, e-postadan ya da web sitesinden gelen talepler. «Forma aktar» deyince yapay zekâ iş emri formunu doldurur; kontrol edip Kaydet dersiniz.</div><div id="glL"></div><button type="button" class="btn b6" id="glNo" style="margin-top:8px">Kapat</button>';
      document.body.appendChild(d);g("glNo").onclick=function(){d.close()};
      g("glL").onclick=async function(ev){var b=ev.target.closest("button[data-gl]");if(!b)return;var x=gelenL.find(function(y){return y.id===b.dataset.id});if(!x)return;
        var isle=function(dr){return db.ref("aiTaslak/"+x.id).update({durum:dr,kim:(typeof ad==="function"?ad():""),zaman:firebase.database.ServerValue.TIMESTAMP}).catch(function(){})};
        if(b.dataset.gl==="gec"){if(!confirm((x.firma||"Bu talep")+" listeden kaldırılsın mı? (iş emri açılmaz)"))return;await isle("gec");gelenSay();b.closest(".glk").remove();return}
        b.disabled=true;b.textContent="⏳ Okunuyor…";
        try{await okuMetin(taslakMetin(x),{musteri:x.firma});await isle("forma");d.close();gelenSay()}
        catch(e){b.disabled=false;b.textContent="✨ Forma aktar";
          /* yapay zekâ yoksa en azından müşteri ve not yazılsın */
          var mu=g("iMu");if(mu&&!mu.value)mu.value=x.firma||"";if(typeof notSet==="function")notSet("iNtU",taslakMetin(x).toLocaleUpperCase("tr-TR"));
          alert("Yapay zekâ okuyamadı: "+(e&&e.message||e)+"\n\nMüşteri adı ve sipariş metni not alanına yazıldı; ölçüleri elle girin.");await isle("forma");d.close();gelenSay()}}}
    var esc2=function(t){return String(t==null?"":t).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
    g("glL").innerHTML=gelenL.length?gelenL.map(function(x){return'<div class="glk" style="border:1px solid #e2e8f0;border-radius:10px;padding:8px;margin-bottom:8px"><div style="font-weight:800">'+esc2(x.firma||"Müşteri")+'</div><div class="mut" style="font-size:13px">'+(KYN[x.kaynak]||"📥")+" · "+new Date(x.t||0).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})+'</div><div style="white-space:pre-wrap;font-size:14px;margin:4px 0">'+esc2(taslakMetin(x).replace(/^Firma: .*\n?/,""))+'</div><div style="display:flex;gap:6px"><button type="button" class="btn b6 sm" data-gl="gec" data-id="'+esc2(x.id)+'" style="flex:1;margin:0">✖ Gerekmez</button><button type="button" class="btn b1 sm" data-gl="al" data-id="'+esc2(x.id)+'" style="flex:2;margin:0">✨ Forma aktar</button></div></div>'}).join(""):'<p class="mut">Bekleyen talep yok.</p>';
    d.showModal()}

  function kur(){
    if(!g("iFoto"))return;
    if(!g("iYzW")){var w=document.createElement("div");w.id="iYzW";w.style.cssText="display:flex;gap:8px;margin-bottom:6px";
      w.innerHTML='<button type="button" class="btn b7" id="iMsj" style="flex:1;margin:0;font-size:16px">💬 Mesajdan / 🎤 sesten</button><button type="button" class="btn b2" id="iGelen" style="flex:1;margin:0;font-size:16px;display:none">📥 Gelen siparişler</button>';
      g("iFotoW").insertAdjacentElement("afterend",w);
      g("iMsj").onclick=function(){var d=msjDlg();g("msjT").value="";g("msjD").textContent="";d.showModal()};
      g("iGelen").onclick=gelenAc}
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
      var yw=g("iYzW");if(yw)yw.style.display=e?"none":"flex";if(!e)gelenSay();
      g("iFotoAyar").style.display=(typeof isAdmin==="function"&&isAdmin())?"":"none";
      durum("Mikro «Çok Dövizli Alınan Sipariş Fişi» ekranını ya da iş takip formunu okutabilirsiniz.");return r}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",kur);else kur();
})();
