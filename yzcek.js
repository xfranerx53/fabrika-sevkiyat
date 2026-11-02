/* yzcek.js — (v134) 🧾 Tahsilatta çek / makbuz / dekont fotoğrafını yapay zekâ okur.
   Sahadaki kişi «Tahsil ettim» penceresinde fotoğraf ekleyince (📸 Kamera / 🖼️ Galeri) yapay zekâ belgeyi okur:
   BOŞ olan Nakit / Çek / Makbuz no alanlarını doldurur, çek bilgisini (banka, çek no, vade, keşideci) nota ekler.
   Dolu alana dokunmaz; hiçbir şeyi kendisi kaydetmez — kişi kontrol edip Kaydet'e basar.
   Anahtar: fotookut.js'teki ortak okuma (window.okuAI, `okumaAyar`). Okuyamazsa sessizce geçer, fotoğraf yine eklenir. */
(function(){
  var g=function(i){return document.getElementById(i)};
  var PROMPT=["Bu fotoğraf bir plastik ambalaj fabrikasının (MAG AMBALAJ) müşteriden aldığı ödeme belgesidir: banka çeki, senet, tahsilat makbuzu ya da havale/EFT dekontu.",
    "Belgede YAZANI aynen oku, UYDURMA. Okunamayan alanı boş bırak ve adını \"okunamayan\" listesine yaz. Cevabın SADECE JSON olsun.",
    "tur: cek | senet | makbuz | dekont | diger. Tutarları Türk biçimiyle yaz (örn. 125.000,00). vade: GG.AA.YYYY.",
    "Makbuzda nakit ve çek ayrı yazıyorsa nakit ve cek alanlarına ayrı yaz; tek toplam varsa tutar alanına yaz.",
    "kesideci: çeki/senedi düzenleyen (hesap sahibi) firma ya da kişi. firma: makbuzu/dekontu ödeyen firma adı.",
    "{\"tur\":\"\",\"tutar\":\"\",\"nakit\":\"\",\"cek\":\"\",\"makbuzNo\":\"\",\"cekNo\":\"\",\"banka\":\"\",\"sube\":\"\",\"vade\":\"\",\"kesideci\":\"\",\"firma\":\"\",\"okunamayan\":[]}"].join("\n");
  var temiz=function(v){v=String(v==null?"":v).replace(/\s+/g," ").trim();return/^[-–—]$/.test(v)?"":v};
  function sayi(v){v=temiz(v).replace(/[^\d.,]/g,"");if(!v)return 0;
    if(v.indexOf(".")>-1&&v.indexOf(",")>-1)v=v.lastIndexOf(",")>v.lastIndexOf(".")?v.replace(/\./g,"").replace(",","."):v.replace(/,/g,"");
    else if(/^\d{1,3}(\.\d{3})+$/.test(v))v=v.replace(/\./g,"");else if(/^\d{1,3}(,\d{3})+$/.test(v))v=v.replace(/,/g,"");else v=v.replace(",",".");
    var n=parseFloat(v);return isFinite(n)&&n>0?n:0}
  var yaz=function(n){return String(Math.round(n*100)/100).replace(".",",")};
  function durum(m,h){var d=g("tahYz");if(!d){var fs=g("tahFS");if(!fs)return;d=document.createElement("div");d.id="tahYz";d.style.cssText="font-size:14px;margin-top:4px";fs.insertAdjacentElement("afterend",d)}d.textContent=m||"";d.style.color=h?"#b42318":"#0f766e"}
  var sira=Promise.resolve();
  async function oku(f){
    var aw=g("tahAlW");if(!aw||aw.classList.contains("hide")||!window.okuAI||!window.okuKucult)return;
    var t0=Date.now(),tm=setInterval(function(){durum("🤖 Belge okunuyor… "+Math.round((Date.now()-t0)/1000)+" sn")},500);
    try{
      var b64=await window.okuKucult(f),o=await window.okuAI([{text:PROMPT},{inline_data:{mime_type:"image/jpeg",data:b64}}]);clearInterval(tm);o=o||{};
      var tur=String(o.tur||"").toLowerCase(),nk=sayi(o.nakit),ck=sayi(o.cek),tp=sayi(o.tutar),ya=[];
      if(!nk&&!ck&&tp){if(tur==="cek"||tur==="senet")ck=tp;else nk=tp}
      var N=g("tahNakit"),C=g("tahCek"),M=g("tahMak"),NT=g("tahNot"),CR=g("tahCari");
      if(nk&&N&&!N.value.trim()){N.value=yaz(nk);ya.push("nakit "+yaz(nk)+" ₺")}
      if(ck&&C&&!C.value.trim()){C.value=yaz(ck);ya.push("çek "+yaz(ck)+" ₺")}
      else if(ck&&C&&C.value.trim()&&sayi(C.value)!==ck&&(tur==="cek"||tur==="senet")){C.value=yaz(sayi(C.value)+ck);ya.push("çek toplamı "+C.value+" ₺ (önceki + bu çek)")}
      var mk=temiz(o.makbuzNo);if(mk&&M&&!M.value.trim()){M.value=mk.slice(0,30);ya.push("makbuz no")}
      var fr=temiz(o.firma)||temiz(o.kesideci);if(fr&&CR&&!CR.value.trim()){CR.value=fr.slice(0,100);ya.push("firma")}
      if(tur==="cek"||tur==="senet"){var d=[tur==="senet"?"SENET":"ÇEK",temiz(o.banka)&&("Banka: "+temiz(o.banka)+(temiz(o.sube)?" / "+temiz(o.sube):"")),temiz(o.cekNo)&&("No: "+temiz(o.cekNo)),temiz(o.vade)&&("Vade: "+temiz(o.vade)),temiz(o.kesideci)&&("Keşideci: "+temiz(o.kesideci)),ck&&(yaz(ck)+" ₺")].filter(Boolean).join(" · ");
        if(NT&&NT.value.indexOf(d)<0){NT.value=(NT.value.trim()?NT.value.trim()+"\n":"")+d;ya.push("çek bilgisi nota")}}
      else if(tur==="dekont"&&NT){var dd="DEKONT · "+[temiz(o.banka),tp&&yaz(tp)+" ₺"].filter(Boolean).join(" · ");if(NT.value.indexOf(dd)<0){NT.value=(NT.value.trim()?NT.value.trim()+"\n":"")+dd;ya.push("dekont bilgisi nota")}}
      var ok=Array.isArray(o.okunamayan)?o.okunamayan.map(temiz).filter(Boolean):[];
      durum(ya.length?"✓ Yapay zekâ okudu: "+ya.join(", ")+". Kontrol edip Kaydet'e basın."+(ok.length?" Okunamayan: "+ok.join(", ")+".":""):"ℹ Belgeden yeni bilgi çıkmadı (alanlar zaten dolu ya da okunamadı).",!ya.length&&ok.length)
    }catch(e){clearInterval(tm);var m=String(e&&e.message||e);durum(/anahtar/i.test(m)?"":"ℹ Belge okunamadı ("+m.slice(0,90)+"). Tutarları elle girin.",true)}}
  /* tahsilat.js dosya seçince input'u hemen boşaltıyor; dosyaları ondan ÖNCE (yakalama aşamasında) alıyoruz */
  document.addEventListener("change",function(e){var t=e.target;if(!t||(t.id!=="tahCam"&&t.id!=="tahGal")||!t.files||!t.files.length)return;
    var l=Array.prototype.slice.call(t.files,0,3).filter(function(f){return/^image\//.test(f.type||"image/")});
    l.forEach(function(f){sira=sira.then(function(){return oku(f)})})},true);
  /* pencere her açıldığında eski mesaj silinsin */
  var d=g("dTah");if(d)d.addEventListener("close",function(){durum("")});
})();
