/* 👤 Hesabım penceresi (isim, şifre, yazı boyutu, çıkış) + yönetici «Yeni kullanıcı hesabı aç».
   app.js'teki $, db, auth, rec, user, isAdmin, ROLLER, mail, sifreHz, CFG, toast, errText, denetimYaz, kullanicilar ortak kullanılır.
   Bu dosya app.js'ten SONRA yüklenir. */
(function(){
  /* ---------- Hesabım ---------- */
  var dH=$("dHes");
  function hesYb(){var v=window.yaziBoyut?window.yaziBoyut.oku():"0";
    document.querySelectorAll("#hesYb [data-yb]").forEach(function(b){b.classList.toggle("on",b.dataset.yb===v)})}
  function hesAc(){
    var b=$("hesBilgi");
    if(b)b.textContent=(rec&&rec.ad?rec.ad:"")+(rec&&rec.rol?" · "+rec.rol:"")+(isAdmin()?" · Yönetici":"");
    hesYb();dH.showModal()}
  document.querySelectorAll("[data-hes]").forEach(function(b){b.addEventListener("click",hesAc)});
  /* pencerenin içindeki işlemler önce bu pencereyi kapatır (yoksa açılan diğer pencere/giriş ekranı altında kalır) */
  ["bAd","bSf"].forEach(function(id){$(id).addEventListener("click",function(){dH.close()})});
  dH.querySelectorAll("[data-out]").forEach(function(b){b.addEventListener("click",function(){dH.close()})});
  $("hesKapat").onclick=function(){dH.close()};
  $("hesYb").addEventListener("click",function(e){var b=e.target.closest("[data-yb]");if(!b)return;
    window.yaziBoyut.ayarla(b.dataset.yb);hesYb()});

  /* ---------- Yönetici: yeni kullanıcı hesabı ---------- */
  var dY=$("dYeni"),yE=$("yE"),yOk=$("yOk");
  function yTemizle(){["yAd","yKa","ySi"].forEach(function(i){$(i).value=""});
    $("yRo").innerHTML='<option value="">— rol seçin —</option>'+ROLLER.map(function(r){return"<option>"+esc(r)+"</option>"}).join("");
    yE.textContent="";yOk.classList.add("hide");yOk.textContent=""}
  $("uYeni").onclick=function(){if(!isAdmin())return;yTemizle();dY.showModal();$("yAd").focus()};
  $("yIptal").onclick=function(){dY.close();kullanicilar()};

  /* Giriş yapmış yöneticiyi çıkarmadan hesap açmak için ikinci (geçici) bir Firebase uygulaması kullanılır. */
  async function hesapAc(n,k,p,r){
    var app2=firebase.apps.find(function(a){return a.name==="hesapAc"})||firebase.initializeApp(CFG,"hesapAc");
    var a2=app2.auth(),uid=null;
    try{await a2.setPersistence(firebase.auth.Auth.Persistence.NONE)}catch(_){}
    try{
      try{var c=await a2.createUserWithEmailAndPassword(mail(k),sifreHz(p));uid=c.user.uid}
      catch(e){
        /* önceki denemede hesap açılıp kayıt yazılamadıysa: aynı şifreyle girip kaydı tamamla */
        if(e.code!=="auth/email-already-in-use")throw e;
        var c2;try{c2=await a2.signInWithEmailAndPassword(mail(k),sifreHz(p))}catch(_){throw e}
        uid=c2.user.uid;
        var ex=await db.ref("kullanicilar/"+uid).once("value");if(ex.exists())throw e}
      await db.ref("kullanicilar/"+uid).set({ad:n,kullanici:k,rol:r,onay:true,yonetici:false})
    }finally{try{await a2.signOut()}catch(_){}}
    denetimYaz("kullanici",n,"Yönetici hesap açtı: @"+k+" · "+r,"kullanicilar",uid);
    return uid}

  $("yKaydet").onclick=async function(){
    if(!isAdmin())return;
    var n=$("yAd").value.trim(),k=$("yKa").value.trim().toLowerCase(),p=$("ySi").value,r=$("yRo").value;
    yE.textContent="";yOk.classList.add("hide");
    if(!n){yE.textContent="Ad soyad yazın.";return}
    if(!/^[a-z0-9._-]{3,20}$/.test(k)){yE.textContent="Kullanıcı adı 3-20 karakter olmalı (harf, rakam, . _ -).";return}
    if(p.length<6){yE.textContent="Şifre en az 6 karakter olmalı.";return}
    if(!r||ROLLER.indexOf(r)<0){yE.textContent="Rol seçin.";return}
    var b=$("yKaydet");b.disabled=true;b.textContent="Hesap açılıyor...";
    try{
      await hesapAc(n,k,p,r);
      yOk.innerHTML="✓ Hesap açıldı ve onaylandı.<br><b>Kullanıcı adı:</b> "+esc(k)+"<br><b>Şifre:</b> "+esc(p)+"<br><small>Bunu kişiye iletin. Şifreyi sonra 👤 Hesabım'dan kendisi değiştirebilir.</small>";
      yOk.classList.remove("hide");
      ["yAd","yKa","ySi"].forEach(function(i){$(i).value=""});$("yRo").value="";
      kullanicilar();
    }catch(e){yE.textContent=errText(e)}
    b.disabled=false;b.textContent="Hesabı aç";
  };
})();
