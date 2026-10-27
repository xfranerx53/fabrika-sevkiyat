/* ===================== STOK — HAZIR LİSTEYİ TOPLU EKLE (v93) =====================
   Stok ekranındaki «＋ Yeni kalem ekle» düğmesinin yanına «📥 Hazır liste» düğmesi koyar.
   Basınca aşağıdaki kalemler KATEGORİLERİYLE birlikte stokKalem'e eklenir (miktar 0, birim: Kg/Adet/Rulo).
   Aynı isimde kalem zaten varsa atlanır (tekrar basmak güvenlidir). Firebase kuralı değişmez.
   Ortak şeyler (app.js): $, db, user, ad, toast, errText */
(function(){
  var L=[
    ["Hammadde (Granül)","kg",["HDPE ( HIŞIR )","AYPE POLIETILEN F2-12","LLDPE","COMPUANT K1 ( KALSIT )","BOREALİS","MIDYUM ( MDPE)"]],
    ["Konsantre (Masterbatch)","kg",["Konsantre BEYAZ","Konsantre BEYAZ %70","Konsantre KIRMIZI","Konsantre SIYAH","Konsantre MAVI","Konsantre FILDISI","Konsantre SARI","Konsantre ALTIN YALDIZ","Konsantre KAHVE","Konsantre BEJ","Konsantre ORANJ","Konsantre BAKIR","Konsantre KREM"]],
    ["Mürekkep","kg",["Mürekkep BEYAZ","Mürekkep KIRMIZI","Mürekkep KAHVE","Mürekkep MAGENTA","Mürekkep MAVI","Mürekkep SIYAH","Mürekkep TURUNCU","Mürekkep ALTIN YALDIZ","Mürekkep SARI","Mürekkep YESIL","Mürekkep GUMUS YALDIZ","Mürekkep LACİVERT"]],
    ["Vernik","kg",["VERNİK"]],
    ["Çözücü","kg",["METİL PROKSİTOL PM"]],
    ["Palet","adet",["PALET"]],
    ["Baskılı / Baskısız Poşet","adet",["Or. LDPE Baskılı Poşet El Geçme","Or. LDPE Baskılı Poşet Oto. Takviyeli","Or. HDPE Baskısız Torba "]],
    ["Şeffaf Rulo","kg",["Or. LDPE Rulo Şeffaf","Or. HDPE Rulo Şeffaf"]],
    ["Kasa Torbası","adet",["Or. HDPE Kasa Torbası "]],
    ["Rulo Poşet","rulo",["PE Ortaboy Rulo Poşet","PE Büyük Boy Rulo Poşet"]],
    ["PE Rulo","kg",["PE RULO"]],
    ["Shrink","kg",["PE YAPRAK SHRINK","SHRINK TPOF"]],
    ["Streç Film","rulo",["STREÇ FİLM - STRECH NATURAL 17 MİC.","STRECH NATURAL 23 MIC.","PE.GIDA STRECH 8 MİC.(AD)","SUPERPOWER NATURAL 23 MİC.","WRAP STREÇ 8 MİC. 45 CM X 1500M.","WRAP STREÇ 9 MİC. 45 CM X 1500M."]],
    ["PA-PE Vakum Torba","adet",["PA-PE VAKUM TORBA 18X22","PA-PE VAKUM TORBA 20X25","PA-PE VAKUM TORBA 27X37","PA-PE VAKUM TORBA 30X70","PA-PE VAKUM TORBA 40X60","PA-PE VAKUM TORBA 45X65","PA-PE VAKUM TORBA 28X42","PA-PE VAKUM TORBA 45X70","PA-PE VAKUM TORBA 35X50","PA-PE VAKUM TORBA 45X45","PA-PE VAKUM TORBA 20X65","PA-PE VAKUM TORBA 15X27"]],
    ["Çöp Torbası","adet",["PE.ÇÖP TORBASI","ÇÖP TORBASI HANTAL BOY 100X150 800 GR"]],
    ["CPP Rulo","kg",["CPP RULO"]],
    ["OPP Rulo","kg",["OPP RULO"]],
    ["PE Düz Tabaka","kg",["PE Düz Tabaka"]],
    ["Sedefli OPP Bantlı Torba","adet",["Sedefli OPP Bantlı Torba (Ad)"]]
  ];
  var norm=function(s){return String(s||"").trim().replace(/\s+/g," ").toLocaleLowerCase("tr-TR")};
  function say(){var n=0;L.forEach(function(g){n+=g[2].length});return n}
  async function ekle(){
    var bt=$("sListe");
    if(!confirm(say()+" kalem, "+L.length+" ayrı kategoriyle stoka eklensin mi?\n(Zaten var olan isimler atlanır, miktarlar 0 olarak başlar.)"))return;
    bt.disabled=true;
    try{
      var s=await db.ref("stokKalem").once("value"),v=s.val()||{},var_={};
      Object.keys(v).forEach(function(k){var_[norm(v[k]&&v[k].ad)]=1});
      var TS=firebase.database.ServerValue.TIMESTAMP,up={},yeni=0,atla=0;
      L.forEach(function(g){g[2].forEach(function(nm){
        var ad_=nm.trim().replace(/\s+/g," ");
        if(var_[norm(ad_)]){atla++;return}
        var_[norm(ad_)]=1;
        var id=db.ref("stokKalem").push().key,mik={};mik[g[1]]=0;
        up[id]={ad:ad_,kategori:g[0],mik:mik,ekleyen:ad(),ekleyenUid:user.uid,eklenmeTarihi:TS};
        yeni++;
      })});
      if(yeni)await db.ref("stokKalem").update(up);
      toast(yeni+" kalem eklendi"+(atla?", "+atla+" tanesi zaten vardı":""));
    }catch(e){toast("Eklenemedi: "+errText(e))}
    bt.disabled=false;
  }
  function kur(){
    var a=$("sAdd");if(!a||$("sListe"))return;
    var b=document.createElement("button");b.id="sListe";b.type="button";b.className="btn b6";
    b.style.cssText="margin:0;width:auto;padding:0 14px";b.textContent="📥 Hazır liste";
    b.onclick=ekle;a.parentNode.insertBefore(b,$("sCsv"));
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",kur);else kur();
})();
