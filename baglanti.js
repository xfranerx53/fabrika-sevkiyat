/* ===================== BAĞLANTI DURUMU + KAYIT GÜVENLİĞİ (v81) =====================
   1) Sol altta küçük bir durum etiketi: ● Çevrimiçi / ● Bağlantı yok / ● Gönderiliyor (n)
   2) Bağlantı koparsa üstte kırmızı şerit çıkar ("kayıtlar internet gelince gönderilir, uygulamayı kapatmayın")
   3) Her kayıt işlemi (set / update / remove / transaction) izlenir:
        - 8 saniyede sunucuya ulaşmazsa turuncu şerit: "Kayıt gönderiliyor… sayfayı kapatmayın"
        - sunucu reddederse: "⚠ Kaydedilemedi: …" uyarısı (sessizce kaybolmaz)
        - gönderilmemiş kayıt varken sayfa kapatılmaya çalışılırsa tarayıcı uyarır
   Not: Firebase, bağlantı yokken yapılan kayıtları telefonun belleğinde bekletir ve internet gelince kendisi gönderir.
   Uygulama KAPATILIRSA bekleyen kayıtlar kaybolur; bu yüzden şerit "kapatmayın" der.
   Kullanılan ortak şeyler (app.js): db, toast, errText, $ */
(function(){
  var R=null;
  try{R=firebase.database.Reference.prototype}catch(e){}
  var bagli=true,kesik=false,bekle=0,gec=0,tmKesik=null,oncekiKesik=false;
  var pop=("showPopover" in HTMLElement.prototype);

  var chip=document.createElement("div");chip.id="bagChip";
  var ban=document.createElement("div");ban.id="bagBanner";
  if(pop){chip.setAttribute("popover","manual");ban.setAttribute("popover","manual")}
  document.body.appendChild(chip);document.body.appendChild(ban);

  function ac(el,one){if(!pop)return;try{var a=el.matches(":popover-open");if(a&&one)el.hidePopover();if(!a||one)el.showPopover()}catch(e){}}
  function kapat(el){if(!pop){el.style.display="none";return}try{if(el.matches(":popover-open"))el.hidePopover()}catch(e){}}

  function ciz(){
    var ic,cls;
    if(kesik&&bekle>0){ic="● Bağlantı yok · "+bekle+" kayıt bekliyor";cls="kr"}
    else if(kesik){ic="● Bağlantı yok";cls="kr"}
    else if(bekle>0){ic="● Gönderiliyor ("+bekle+")";cls="tu"}
    else{ic="● Çevrimiçi";cls="ye"}
    chip.className=cls;chip.textContent=ic;
    if(pop)ac(chip,false);else chip.style.display="";

    var goster=kesik||(bekle>0&&gec>0);
    if(goster){
      var m;
      if(kesik)m=bekle>0
        ?"⚠ İnternet yok. "+bekle+" kayıt telefonda bekliyor; internet gelince otomatik gönderilir. Uygulamayı KAPATMAYIN."
        :"📴 İnternet yok. Ekrandaki bilgiler güncel olmayabilir. Yaptığınız kayıtlar internet gelince gönderilir; o zamana kadar uygulamayı kapatmayın.";
      else m="⏳ Kayıt gönderiliyor ("+bekle+")… bağlantı yavaş. Sayfayı kapatmayın.";
      ban.className=kesik?"kr":"tu";
      ban.innerHTML="";
      var sp=document.createElement("span");sp.textContent=m;ban.appendChild(sp);
      var b=document.createElement("button");b.type="button";b.textContent="↻ Yeniden dene";
      b.onclick=yenidenDene;ban.appendChild(b);
      if(kesik){var b2=document.createElement("button");b2.type="button";b2.textContent="⟳ Sayfayı yenile";b2.onclick=function(){if(bekle>0&&!confirm("Gönderilmemiş "+bekle+" kayıt var, sayfa yenilenirse kaybolur. Yine de yenilensin mi?"))return;sayfaYenile()};ban.appendChild(b2)}
      if(pop)ac(ban,!oncekiKesik);else ban.style.display="block";
    }else{kapat(ban)}
    oncekiKesik=goster;
  }

  /* Yeni bağlantı kur: eski (ölü) soketi bırakıp sıfırdan bağlanır. Bekleyen kayıtlar kaybolmaz, bağlanınca gider. */
  var sonCyc=0,dene=0;
  function cevir(zorla){
    var n=Date.now();if(!zorla&&n-sonCyc<2500)return;sonCyc=n;
    try{db.goOffline();setTimeout(function(){try{db.goOnline()}catch(e){}},400)}catch(e){}
  }
  /* Sunucuya hiç ulaşılıyor mu? (cevap ne olursa olsun ulaşıldı demektir; sadece ağ hatası = ulaşılamıyor) */
  function sunucuVar(){
    var u="";try{u=CFG.databaseURL}catch(e){}
    if(!u||typeof fetch!=="function")return Promise.resolve(false);
    return fetch(u+"/.json?shallow=true&limitToFirst=1",{mode:"no-cors",cache:"no-store"}).then(function(){return true},function(){return false});
  }
  /* WebSocket takılıyorsa (Wi-Fi <-> mobil veri geçişinde olur) uzun-sorgu kipine geç; sonraki açılışlarda baştan kullanılır */
  function uzunSorgu(){
    try{firebase.database.INTERNAL.forceLongPolling()}catch(e){}
    try{localStorage.setItem("fbPoll","1")}catch(e){}
    cevir(true);
  }
  function yenidenDene(){
    toast("Yeniden bağlanılıyor…");
    cevir(true);
    setTimeout(function(){
      if(bagli)return;
      sunucuVar().then(function(ok){if(ok&&!bagli){toast("Bağlantı yolu değiştiriliyor…");uzunSorgu()}else if(!ok&&!bagli)toast("Sunucuya ulaşılamıyor. İnternetinizi kontrol edin.")});
    },5000);
  }
  function sayfaYenile(){
    var u=location.pathname+"?t="+Date.now();
    try{location.href=u}catch(e){location.reload()}
  }

  /* Bekçi: bağlantı kopukken ama telefon "internet var" diyorsa kendiliğinden yeniden bağlanmayı dener */
  setInterval(function(){
    if(bagli){dene=0;return}
    if(navigator.onLine===false)return;
    dene++;
    if(dene<=3){cevir();return}                       /* ilk ~12 sn: yeni bağlantı dene */
    if(dene===4){sunucuVar().then(function(ok){if(ok&&!bagli)uzunSorgu()});return}  /* sunucuya ulaşılıyor ama bağlanmıyor -> uzun-sorgu */
    if(dene%2===0)cevir();                           /* sonra 8 sn'de bir dene */
  },4000);

  /* --- bağlantı durumu --- */
  function kesikAyarla(v){
    if(v){ /* kopma: kısa kopmalarda şerit çıkmasın diye 3 sn bekle (internet tamamen yoksa hemen) */
      if(tmKesik)return;
      tmKesik=setTimeout(function(){tmKesik=null;if(!bagli||navigator.onLine===false){kesik=true;ciz()}},navigator.onLine===false?300:3000);
    }else{
      if(tmKesik){clearTimeout(tmKesik);tmKesik=null}
      if(kesik){kesik=false;toast(bekle>0?"✓ Bağlantı geri geldi, kayıtlar gönderiliyor…":"✓ Bağlantı geri geldi")}
      ciz();
    }
  }
  try{
    db.ref(".info/connected").on("value",function(s){bagli=s.val()===true;kesikAyarla(!bagli)});
  }catch(e){}
  window.addEventListener("offline",function(){bagli=false;kesikAyarla(true)});
  /* Ağ değişince (Wi-Fi <-> mobil veri, internet geri geldi, uygulamaya dönüldü) eski soketi bırakıp yeniden bağlan */
  window.addEventListener("online",function(){dene=0;cevir(true);setTimeout(cevir,3000)});
  window.addEventListener("pageshow",function(e){if(e.persisted){dene=0;cevir(true)}});
  document.addEventListener("visibilitychange",function(){if(!document.hidden){dene=0;cevir()}});
  try{var cn=navigator.connection||navigator.mozConnection||navigator.webkitConnection;if(cn&&cn.addEventListener)cn.addEventListener("change",function(){dene=0;cevir(true);setTimeout(cevir,3000)})}catch(e){}

  /* --- kayıt işlemlerini izle --- */
  function sessiz(ref){try{return /\/ayarlar\/yedek$/.test(String(ref.toString()))}catch(e){return false}}
  function izle(ref,p){
    if(!p||typeof p.then!=="function")return p;
    var bitti=false,geciktiMi=false;bekle++;
    var tm=setTimeout(function(){if(!bitti){geciktiMi=true;gec++;ciz()}},8000);
    function son(ok,e){
      if(bitti)return;bitti=true;clearTimeout(tm);bekle=Math.max(0,bekle-1);
      if(geciktiMi)gec=Math.max(0,gec-1);
      if(!ok&&!sessiz(ref))toast("⚠ Kaydedilemedi: "+errText(e)+" — lütfen tekrar deneyin.");
      else if(ok&&geciktiMi&&bekle===0)toast("✓ Bekleyen kayıtlar gönderildi");
      ciz();
    }
    p.then(function(){son(true)},function(e){son(false,e)});
    ciz();
    return p;
  }
  if(R){
    ["set","update","remove","transaction"].forEach(function(m){
      var o=R[m];if(typeof o!=="function")return;
      R[m]=function(){var p=o.apply(this,arguments);return izle(this,p)};
    });
  }

  window.addEventListener("beforeunload",function(e){
    if(bekle>0){e.preventDefault();e.returnValue="Gönderilmemiş kayıtlar var. Kapatırsanız kaybolur.";return e.returnValue}
  });

  window.bagDurum=function(){return{bagli:!kesik,bekleyen:bekle}};
  ciz();
})();
