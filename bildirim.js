/* ===================== KİŞİYE ÖZEL BİLDİRİMLER (v122) =====================
   Bir kullanıcının yaptığı işlem, o işten ETKİLENEN kişilere bildirim olarak düşer (🔔).
   Veri: bildirim/{kanal}/{anahtar} = {t:tür, b:başlık, m:metin, ik:ikon, git:gidilecek yer, r:kayıt no/id, k:kimden(ad), ku:kimden uid, z:sunucu saati}
         Aynı bildirim birden çok kanala AYNI anahtarla yazılır; okuyan taraf anahtara göre tekilleştirir.
         bildirimOku/{uid} = {son: en son okunan zaman, kapat:{tür:true}}  (okundu bilgisi + kapatılan konular; kişiye özel, tüm cihazlarda aynı)
   Kanallar (rules.json'daki okuma izinleriyle birebir):
     u_<uid>  : yalnız o kişi            genel : herkes (duyurular)          yon : yöneticiler
     as_etiket/as_ekstruder/as_baski/as_kesim/as_depo : o aşamayı ilerletebilenler
     sevk : sevkiyat yetkisi olanlar     sor : Sevkiyat Sorumluları          muh : tahsilat («tah») yetkisi olanlar (Muhasebe)
     stok : stok yetkisi olanlar         granul : granül yetkisi olanlar
   Yönetici tüm kanalları dinler (kendi u_ kanalı dahil). Kişi kendi yaptığı işin bildirimini görmez.
   Telefon bildirimi: uygulama açıkken / arka plandayken (Android'de kısa süre) telefonun bildirim alanına düşer.
   Uygulama tamamen KAPALIYKEN bildirim için sunucu tarafı (FCM + Blaze) gerekir — kurulmadı (PROJE-NOTLARI Bölüm 9).
   app.js'ten kullanılanlar: db, user, rec, ad, isAdmin, modGor, asamaYap, tahGor, isVeriGor, esc, fmt, toast, errText, $, ASL, asOrd, icols,
   isBulId, qrIsle, modSec, vTabSet, show, terminGun, dur, norm, mevTxt, stokWa, waUrl, bAyar, bYaz, kullanicilar listesi (yönetici) */
(function(){
  var ASAMALAR=["etiket","ekstruder","baski","kesim","depo"];
  var TUR=[["is","🆕 İş emri (yeni · düzenleme · silme)"],["asama","🏭 Üretim aşamaları (işin size gelmesi, biten işler)"],["sevk","🚚 Sevkiyat (size verilen sevk, teslim, hazır ürün)"],
    ["talimat","📋 Talimatlar"],["tahsilat","💰 Tahsilat"],["stok","📦 Stok & sipariş"],["granul","♻️ Granül"],["hesap","👤 Hesap & yetkiler"],["duyuru","📢 Duyurular"]];
  var TURAD={};TUR.forEach(function(x){TURAD[x[0]]=x[1]});
  var TS=function(){return firebase.database.ServerValue.TIMESTAMP};
  var ks=function(s,n){return String(s==null?"":s).slice(0,n)};
  var asAd=function(a){return String((ASL&&ASL[a])||a||"").replace(/^\S+\s/,"")}; /* "🏭 EKSTRUDER" -> "EKSTRUDER" */
  var me=function(){return user&&user.uid};
  /* başlıktaki baştaki emoji (ikon ayrıca gösterildiği için ekranda tekrar etmesin) */
  var sade=function(b){return String(b||"").replace(/^(\S+)\s+/,function(m,x){return /[\u2190-\u2BFF\uD83C-\uDBFF]/.test(x)?"":m})};

  /* ---------------- GÖNDERME ---------------- */
  /* kanallar: ["sor","u_xyz",...]  o: {t,b,m,ik,git,r}. Hata olursa sessiz (asıl işlemi asla bozmaz). */
  function bil(kanallar,o){
    try{
      if(!user||!rec||rec.onay!==true||!o||!o.b)return;
      var seen={},L=[];(kanallar||[]).forEach(function(c){
        if(!c||seen[c])return;seen[c]=1;
        if(c==="u_"+me())return;                          /* kendime bildirim yok */
        if(/^u_(undefined|null|)$/.test(c))return;
        if(!/^(u_[A-Za-z0-9]{6,64}|as_(etiket|ekstruder|baski|kesim|depo)|sevk|sor|muh|stok|granul|yon|genel)$/.test(c))return;
        L.push(c)});
      if(!L.length)return;
      var key=db.ref("bildirim").push().key,v={t:ks(o.t||"genel",12),b:ks(o.b,120),k:ks((rec&&rec.ad)||"?",100),ku:me(),z:TS()};
      if(o.m)v.m=ks(o.m,400);if(o.ik)v.ik=ks(o.ik,8);if(o.git)v.git=ks(o.git,20);if(o.r)v.r=ks(o.r,100);
      L.forEach(function(c){try{db.ref("bildirim/"+c+"/"+key).set(v).catch(function(){})}catch(e){}});
      pushYolla(L,{t:v.t,b:v.b,m:v.m||"",ik:v.ik||"",git:v.git||"",r:v.r||"",key:key});
    }catch(e){}
  }
  window.bil=bil;

  /* ---- İş emri olayları: app.js hrkEk() her iş emri hareketinde bilHrk'i çağırır; bildirim, kayıt BAŞARIYLA yazılınca gider ---- */
  var BEK=new WeakMap();
  try{
    var RP=firebase.database.Reference.prototype,oUp=RP.update;
    RP.update=function(v){
      var p=oUp.apply(this,arguments),q=v&&typeof v==="object"?BEK.get(v):null;
      if(q&&p&&typeof p.then==="function"){BEK.delete(v);p.then(function(){q.forEach(function(f){try{f()}catch(e){}})},function(){})}
      return p};
  }catch(e){}
  function isOzet(e){var kg=0;try{kg=icols(e).reduce(function(a,c){return a+(+c.kg||0)},0)}catch(x){}
    return [e.musteri,e.isAdi,kg?fmt(kg)+" kg":""].filter(Boolean).join(" · ")}
  window.bilHrk=function(up,id,o){
    try{
      if(!o||!o.tur)return;
      var y=up["isEmirleri/"+id],e=null;
      if(y&&typeof y==="object")e=Object.assign({id:id},y);
      else{var b0=(typeof isBulId==="function")?isBulId(id):null;if(b0)e=Object.assign({},b0)}
      if(!e)return;
      var p="isEmirleri/"+id+"/";Object.keys(up).forEach(function(k){if(k.indexOf(p)===0){var f=k.slice(p.length);if(f.indexOf("/")<0)e[f]=up[k]}});
      var no=e.no||"İş emri",oz=isOzet(e),eu=e.ekleyenUid?"u_"+e.ekleyenUid:"",G="is",R=no,L=[];
      var t=o.tur;
      if(t==="olustur")L.push([["as_etiket","yon"],{t:"is",ik:"🆕",b:"🆕 Yeni iş emri "+no,m:oz+(e.baskiVar?" · 🖨️ Baskılı":"")+(e.termin?" · Termin "+trTarih(e.termin):"")}]);
      else if(t==="ileri"||t==="etiketsiz"){
        if(o.kime==="bitti")L.push([["sevk","yon",eu],{t:"asama",ik:"✅",b:"✅ "+no+" üretimi bitti — depoya girdi",m:[e.musteri,(o.kg!=null?fmt(o.kg)+" kg":""),(o.paket?fmt(o.paket)+" paket":"")].filter(Boolean).join(" · ")+" · Hazır ürünlere aktarılmayı bekliyor"}]);
        else if(ASAMALAR.indexOf(o.kime)>=0){
          L.push([["as_"+o.kime],{t:"asama",ik:"📥",b:"📥 "+no+" → "+asAd(o.kime)+" aşamasına geldi",m:oz+(o.kimden?" · "+asAd(o.kimden)+" tamamlandı":"")+(t==="etiketsiz"?" · ⚠️ etiketsiz geçti":"")}]);
          if(t==="etiketsiz")L.push([["yon"],{t:"asama",ik:"⚠️",b:"⚠️ "+no+" etiket yapılmadan "+asAd(o.kime)+"'e geçti",m:oz}]);
        }}
      else if(t==="geri")L.push([["as_"+o.kime,"as_"+o.kimden,"yon"],{t:"asama",ik:"↩️",b:"↩️ "+no+" geri alındı: "+asAd(o.kimden)+" → "+asAd(o.kime),m:oz}]);
      else if(t==="duzenle"){var a=o.kime||e.asama,K=[eu];if(ASAMALAR.indexOf(a)>=0)K.push("as_"+a);if(o.kimden&&o.kimden!==a&&ASAMALAR.indexOf(o.kimden)>=0)K.push("as_"+o.kimden);
        L.push([K,{t:"is",ik:"✏️",b:"✏️ "+no+" iş emri düzenlendi",m:oz+" · şu an: "+asAd(a)+(o.kimden&&o.kimden!==a?" (aşama "+asAd(o.kimden)+" → "+asAd(a)+")":"")}])}
      else if(t==="aktar"){G="sev:hazir";L.push([["sevk","yon"],{t:"sevk",ik:"📦",b:"📦 Sevke hazır: "+(e.musteri||no),m:no+(o.kg!=null?" · "+fmt(o.kg)+" kg":"")+(o.paket?" · "+fmt(o.paket)+" paket":"")}])}
      if(!L.length)return;
      var gonder=function(){L.forEach(function(x){x[1].git=x[1].git||G;x[1].r=R;bil(x[0],x[1])})};
      BEK.set(up,(BEK.get(up)||[]).concat([gonder]));
    }catch(err){}
  };
  function trTarih(s){var p=String(s||"").split("-");return p.length===3?p[2]+"."+p[1]+"."+p[0]:s}

  /* ---- Hesap/yetki değişikliği: art arda yapılan değişiklikler 15 sn içinde tek bildirimde toplanır ---- */
  var hsB={};
  window.bilHesap=function(uid,txt){
    if(!uid||uid===me())return;
    var h=hsB[uid]||(hsB[uid]={L:[],tm:null});if(h.L.indexOf(txt)<0)h.L.push(txt);
    clearTimeout(h.tm);h.tm=setTimeout(function(){var L=h.L;delete hsB[uid];
      bil(["u_"+uid],{t:"hesap",ik:"👤",b:"👤 Hesap yetkileriniz güncellendi",m:L.join(" · ")+" — değişiklik ekranınıza hemen yansır.",git:"hes"})},15000)};
  window.addEventListener("beforeunload",function(){Object.keys(hsB).forEach(function(u){var h=hsB[u];clearTimeout(h.tm);bil(["u_"+u],{t:"hesap",ik:"👤",b:"👤 Hesap yetkileriniz güncellendi",m:h.L.join(" · "),git:"hes"})})});

  /* ---------------- DİNLEME ---------------- */
  function kanallarim(){
    if(!user||!rec||rec.onay!==true)return[];
    if(isAdmin())return["u_"+me(),"genel","yon","sevk","sor","muh","stok","granul"].concat(ASAMALAR.map(function(a){return"as_"+a}));
    var K=["u_"+me(),"genel"];
    ASAMALAR.forEach(function(a){if(asamaYap(a))K.push("as_"+a)});
    if(modGor("sevk"))K.push("sevk");
    if(rec.rol==="Sevkiyat Sorumlusu")K.push("sor");
    if(modGor("tah"))K.push("muh");
    if(modGor("stok"))K.push("stok");
    if(modGor("granul"))K.push("granul");
    return K}
  var refs=[],D={},hazir={},hata={},okRef=null,son=0,kapat={},okVar=false,imza="",goruldu={},ilkTm=null,bekleyenKey=null,basladi=false,okHata="";
  var LISTE=[];
  function durdur(){refs.forEach(function(r){try{r.off()}catch(e){}});refs=[];D={};hazir={};hata={};LISTE=[];goruldu={};
    if(okRef){okRef.off();okRef=null}if(pushRef){pushRef.off();pushRef=null}son=0;kapat={};okVar=false;imza="";basladi=false;okHata="";ilkTm=null;rozet()}
  window.bilDurdur=durdur;
  function baslat(){
    durdur();if(!user||!rec||rec.onay!==true)return;basladi=true;
    okRef=db.ref("bildirimOku/"+me());
    okRef.on("value",function(s){var v=s.val();okVar=true;
      if(!s.exists()){try{okRef.child("son").set(TS()).catch(function(){})}catch(e){}son=Date.now()} /* ilk kez: eski bildirimler «okunmuş» sayılır */
      else{son=+(v&&v.son)||0;kapat=(v&&v.kapat)||{}}
      birles();if($("dBild").open)ciz()},function(e){okHata=errText(e);son=Date.now();birles()});
    var K=kanallarim();imza=K.join(",");
    K.forEach(function(c){
      var r=db.ref("bildirim/"+c).orderByChild("z").limitToLast(40);
      r.on("value",function(s){D[c]=s.val()||{};var ilk=!hazir[c];hazir[c]=true;delete hata[c];birles(ilk?c:null)},
        function(e){hata[c]=errText(e);hazir[c]=true;birles()});
      refs.push(r)});
    pushBaslat();
    if(isAdmin())setTimeout(temizle,30000);
    setTimeout(gunlukHatirlat,9000);
    if(!localStorage.getItem("bilIpucu")&&"Notification" in window&&Notification.permission==="default")
      setTimeout(function(){toast("🔔 Bildirimleri telefonda görmek için: 🔔 > «Telefon bildirimlerini aç»");try{localStorage.setItem("bilIpucu","1")}catch(e){}},6000);
  }
  window.bilBaslat=baslat;
  /* yetki/rol değişince kanallar değişir: yeniden abone ol */
  window.bilKanalKontrol=function(){if(!basladi)return;var K=kanallarim().join(",");if(K!==imza){baslat();setTimeout(function(){pushKur(false)},4000)}};

  function birles(ilkKanal){
    var M={};
    Object.keys(D).forEach(function(c){var v=D[c];Object.keys(v).forEach(function(k){var x=v[k];if(!x||typeof x!=="object")return;
      if(x.ku===me())return;
      if(!M[k])M[k]=Object.assign({key:k,kn:[c]},x);else M[k].kn.push(c)})});
    var L=Object.keys(M).map(function(k){return M[k]}).sort(function(a,b){return(+b.z||0)-(+a.z||0)}).slice(0,100);
    /* yeni gelenleri uyar: kanalın ilk yüklemesinde değil, sonradan gelenlerde */
    var hepsiHazir=Object.keys(hazir).length>=imza.split(",").filter(Boolean).length;
    L.forEach(function(x){
      if(goruldu[x.key])return;goruldu[x.key]=1;
      if(!hepsiHazir||ilkKanal&&x.kn.length===1&&x.kn[0]===ilkKanal)return;
      if(+x.z>son&&!kapat[x.t])uyar(x)});
    LISTE=L;rozet();
    if(hepsiHazir&&bekleyenKey!=null){var k=bekleyenKey;bekleyenKey=null;setTimeout(function(){bilAcKey(k)},300)}
    if(hepsiHazir&&!ilkTm){ilkTm=1;var n=okunmamis().length;if(n&&!document.hidden)setTimeout(function(){pop({ik:"🔔",b:n+" okunmamış bildiriminiz var",m:"Görmek için dokunun",key:""})},1500)}
    if($("dBild")&&$("dBild").open)ciz();
  }
  function okunmamis(){return LISTE.filter(function(x){return +x.z>son&&!kapat[x.t]})}
  function rozet(){
    var n=user?okunmamis().length:0,t=n>99?"99+":String(n);
    ["bBellN","mBellN"].forEach(function(id){var b=$(id);if(b){b.textContent=t;b.classList.toggle("hide",!n)}});
    try{if(navigator.setAppBadge){if(n)navigator.setAppBadge(n).catch(function(){});else navigator.clearAppBadge().catch(function(){})}}catch(e){}
  }

  /* ---------------- KAPALIYKEN BİLDİRİM: Cloudflare sunucusu (v123, cloudflare/bildirim-worker.js) ----------------
     Sunucu adresi ayarlar/push/url (yönetici 🔔 > ⚙️'den girer). Telefon izin verince tarayıcının push aboneliği
     sunucuya kaydedilir; her bildirim bil() ile sunucuya da gönderilir, sunucu ilgili telefonlara iletir (sw.js «push»). */
  var PUSH="",pushRef=null,pushDurum="";
  var pjDec=function(s){s=String(s).replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";var t=atob(s),o=new Uint8Array(t.length);for(var i=0;i<t.length;i++)o[i]=t.charCodeAt(i);return o};
  var pjEnc=function(b){b=new Uint8Array(b);var s="";for(var i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
  function pushDestek(){return !!(window.PushManager&&navigator.serviceWorker&&"Notification" in window)}
  function pushAktif(){try{return localStorage.getItem("pushOk")==="1"&&localStorage.getItem("pushUid")===me()}catch(e){return false}}
  async function pushIstek(yol,govde){
    if(!PUSH||!auth.currentUser)throw new Error("sunucu yok");
    var t=await auth.currentUser.getIdToken();
    var r=await fetch(PUSH+yol,{method:"POST",headers:{"Authorization":"Bearer "+t,"Content-Type":"application/json"},body:JSON.stringify(govde||{})});
    var j={};try{j=await r.json()}catch(e){}
    if(!r.ok)throw new Error(j.hata||("sunucu hatası "+r.status));return j}
  function pushYolla(L,o){if(!PUSH)return;try{var g=Object.assign({kanallar:L},o);pushIstek("/gonder",g).catch(function(){})}catch(e){}}
  var pushMesgul=false;
  async function pushKur(zorla){
    if(pushMesgul||!PUSH||!user||!pushDestek()||Notification.permission!=="granted")return;
    pushMesgul=true;
    try{
      var reg=await navigator.serviceWorker.ready;
      var vr=await fetch(PUSH+"/vapid");if(!vr.ok)throw new Error("sunucuya ulaşılamadı");
      var pub=(await vr.json()).pub;
      var sub=await reg.pushManager.getSubscription();
      if(sub&&sub.options&&sub.options.applicationServerKey&&pjEnc(sub.options.applicationServerKey)!==pub){try{await sub.unsubscribe()}catch(e){}sub=null}
      if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:pjDec(pub)});
      var j=sub.toJSON(),im=[j.endpoint,me(),kanallarim().join(","),Object.keys(kapat).sort().join(","),PUSH].join("|"),gun=new Date().toISOString().slice(0,10);
      var eski="";try{eski=localStorage.getItem("pushImza")||""}catch(e){}
      if(zorla||eski!==im+"|"+gun.slice(0,8)){
        await pushIstek("/abone",{sub:j,cihaz:(navigator.userAgent||"").replace(/^Mozilla\/5.0 /,"").slice(0,80),kapat:Object.keys(kapat)});
        try{localStorage.setItem("pushImza",im+"|"+gun.slice(0,8));localStorage.setItem("pushOk","1");localStorage.setItem("pushUid",me())}catch(e){}
      }
      pushDurum="ok";
    }catch(e){pushDurum="hata: "+((e&&e.message)||e);try{localStorage.setItem("pushOk","0")}catch(x){}}
    pushMesgul=false;telDurum()}
  /* çıkışta bu telefonun aboneliği kaldırılır (başkası girerse eski kişinin bildirimi gelmesin) */
  document.addEventListener("click",function(e){
    if(!e.target.closest||!e.target.closest("[data-out]"))return;
    try{localStorage.removeItem("pushImza");localStorage.setItem("pushOk","0")}catch(x){}
    try{var ep="";if(navigator.serviceWorker)navigator.serviceWorker.getRegistration().then(function(r){return r&&r.pushManager.getSubscription()}).then(function(s){if(!s)return;ep=s.endpoint;
      if(PUSH)pushIstek("/sil",{endpoint:ep}).catch(function(){});return s.unsubscribe()}).catch(function(){})}catch(x){}},true);
  function pushBaslat(){
    if(pushRef){pushRef.off();pushRef=null}
    pushRef=db.ref("ayarlar/push/url");
    pushRef.on("value",function(s){var u=String(s.val()||"").trim().replace(/\/+$/,"");PUSH=/^https:\/\//.test(u)?u:"";var i=$("bdPushU");if(i&&document.activeElement!==i)i.value=PUSH;
      if(PUSH)setTimeout(function(){pushKur(false)},3000);else pushDurum="";telDurum()},function(){PUSH="";telDurum()})}

  /* ---------------- UYARI (ekranda + telefonda) ---------------- */
  function sesAcik(){try{return localStorage.getItem("bilSes")!=="0"}catch(e){return true}}
  function bip(){try{var C=window.AudioContext||window.webkitAudioContext;if(!C)return;var a=bip.c||(bip.c=new C());if(a.state==="suspended")a.resume();
    var o=a.createOscillator(),g=a.createGain(),t=a.currentTime;o.type="sine";o.frequency.setValueAtTime(880,t);o.frequency.setValueAtTime(1175,t+.12);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.25,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.35);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+.4)}catch(e){}}
  function telBildir(x){
    try{
      if(!("Notification" in window)||Notification.permission!=="granted")return false;
      var opt={body:x.m||"",icon:"icon-192.png",badge:"icon-192.png",tag:x.key||"fabrika",renotify:true,data:{k:x.key||""},vibrate:[200,100,200]};
      if(navigator.serviceWorker&&navigator.serviceWorker.getRegistration){
        navigator.serviceWorker.getRegistration().then(function(r){if(r&&r.showNotification)r.showNotification(x.b,opt);else new Notification(x.b,opt)}).catch(function(){try{new Notification(x.b,opt)}catch(e){}})}
      else new Notification(x.b,opt);
      return true}catch(e){return false}}
  var popEl=null,popTm=null;
  function pop(x){
    if(!popEl){popEl=document.createElement("div");popEl.id="bilPop";if("showPopover" in HTMLElement.prototype)popEl.setAttribute("popover","manual");document.body.appendChild(popEl);
      popEl.onclick=function(){var k=popEl.dataset.k;kapatPop();if(k)bilAcKey(k);else panelAc()}}
    popEl.dataset.k=x.key||"";
    popEl.innerHTML='<span class="bpi">'+esc(x.ik||"🔔")+'</span><span class="bpm"><b>'+esc(sade(x.b))+'</b>'+(x.m?'<small>'+esc(x.m)+'</small>':"")+'</span><span class="bpx">✕</span>';
    try{if(popEl.showPopover){if(popEl.matches(":popover-open"))popEl.hidePopover();popEl.showPopover()}}catch(e){}
    popEl.classList.add("on");clearTimeout(popTm);popTm=setTimeout(kapatPop,7000)}
  function kapatPop(){if(!popEl)return;popEl.classList.remove("on");try{if(popEl.hidePopover&&popEl.matches(":popover-open"))popEl.hidePopover()}catch(e){}}
  function uyar(x){
    if(document.hidden){if(pushAktif())return; /* sunucu bu bildirimi telefona zaten gönderiyor (sw.js) */
      if(!telBildir(x))try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}}
    else{pop(x);try{navigator.vibrate&&navigator.vibrate([150,80,150])}catch(e){}if(sesAcik())bip()}
  }

  /* ---------------- GİT (bildirime dokununca ilgili ekran) ---------------- */
  function git(x){
    var g=String(x.git||""),d=$("dBild");if(d&&d.open)d.close();kapatPop();
    var ac=function(m){menuOk=true;modSec(m);show("vApp");window.scrollTo(0,0)};
    try{
      if(g==="is"&&x.r){if(isVeriGor())qrIsle(x.r);else toast("İş emirlerine erişim yetkiniz yok.");return}
      if(g.indexOf("sev")===0){if(!modGor("sevk"))return toast("Sevkiyat bölümüne erişim yetkiniz yok.");ac("sevk");vTabSet("sev");
        var t=g.split(":")[1];if(t){var b=document.querySelector('#tabs button[data-t="'+t+'"]');if(b)b.click()}return}
      if(g==="tal"||g==="tah"){if(!tahGor())return toast("Bu bölüme erişim yetkiniz yok.");ac(modGor("sevk")?"sevk":"tah");vTabSet(g);return}
      if(g==="stok"||g==="sip"){if(!modGor("stok"))return toast("Stok bölümüne erişim yetkiniz yok.");ac("stok");if(g==="sip"&&typeof sTabSet==="function")sTabSet("sip");return}
      if(g==="granul"){if(!modGor("granul"))return toast("Granül bölümüne erişim yetkiniz yok.");ac("granul");return}
      if(g==="dos"){if(!modGor("dos"))return toast("Dosyalar bölümüne erişim yetkiniz yok.");ac("dos");return}
      if(g==="hes"){var h=document.querySelector("[data-hes]");if(h)h.click();return}
    }catch(e){toast(errText(e))}
  }
  function bilAcKey(k){var x=LISTE.find(function(y){return y.key===k});if(x){okuIsaretle(+x.z);git(x)}else panelAc()}
  /* telefon bildirimine dokunulunca (sw.js mesajı veya #bil= adresi) */
  try{if(navigator.serviceWorker)navigator.serviceWorker.addEventListener("message",function(ev){var d=ev.data||{};if(d.bil!==undefined){if(LISTE.length)bilAcKey(d.bil);else bekleyenKey=d.bil}})}catch(e){}
  try{var hm=String(location.hash||"").match(/[#&]bil=([^&]*)/);if(hm){bekleyenKey=decodeURIComponent(hm[1]);history.replaceState(null,"",location.pathname+location.search)}}catch(e){}

  function okuIsaretle(z){
    z=Math.max(+z||0,son);if(!user||z<=son)return;son=z;rozet();
    try{db.ref("bildirimOku/"+me()+"/son").set(z).catch(function(){})}catch(e){}}
  function hepsiOku(){var z=LISTE.reduce(function(a,x){return Math.max(a,+x.z||0)},0);if(z>son)okuIsaretle(z);else rozet()}

  /* ---------------- PANEL ---------------- */
  var acikSon=0;
  var zmn=function(t){if(!t)return"";var d=new Date(+t),n=new Date(),g=Math.floor((n-d)/6e4);
    if(g<1)return"az önce";if(g<60)return g+" dk önce";if(d.toDateString()===n.toDateString())return"bugün "+d.toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"});
    var y=new Date(n);y.setDate(n.getDate()-1);if(d.toDateString()===y.toDateString())return"dün "+d.toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"});
    return d.toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})};
  var sekme="tum";
  function ciz(){
    var d=$("bdL");if(!d)return;
    var V=LISTE.filter(function(x){return !kapat[x.t]}),yeni=V.filter(function(x){return +x.z>acikSon});
    var G=sekme==="yeni"?yeni:V;
    $("bdTY").textContent="Okunmamış"+(yeni.length?" ("+yeni.length+")":"");
    document.querySelectorAll("#bdTabs button").forEach(function(b){b.classList.toggle("on",b.dataset.s===sekme)});
    var uy=[];
    var hk=Object.keys(hata);if(hk.length)uy.push('<div class="note" style="margin:0 0 8px">⚠️ Bazı bildirimler okunamadı ('+esc(hk.join(", "))+'). '+(isAdmin()?"Firebase kurallarının (rules.json) son halini yayınladınız mı?":"Yöneticinize haber verin.")+'</div>');
    if(okHata)uy.push('<div class="note" style="margin:0 0 8px">⚠️ Okundu bilgisi kaydedilemiyor: '+esc(okHata)+'</div>');
    $("bdUy").innerHTML=uy.join("");
    d.innerHTML=G.length?G.map(function(x){var y=+x.z>acikSon;
      return '<button type="button" class="bli'+(y?" yeni":"")+'" data-k="'+esc(x.key)+'"><span class="bik">'+esc(x.ik||"🔔")+'</span><span class="bim"><b>'+esc(sade(x.b))+'</b>'+(x.m?'<span class="sub">'+esc(x.m)+'</span>':"")+'<span class="who">'+esc(x.k||"")+(x.k?" · ":"")+esc(zmn(x.z))+'</span></span>'+(y?'<span class="bnk"></span>':"")+'</button>'}).join("")
      :'<p class="mut" style="margin:6px 0 10px">'+(sekme==="yeni"?"Okunmamış bildirim yok.":"Henüz bildirim yok. Sizi ilgilendiren bir şey olduğunda burada görünür.")+'</p>';
    telDurum();
  }
  function panelAc(){
    var d=$("dBild");if(!d)return;
    acikSon=son;sekme=okunmamis().length?"yeni":"tum";
    ciz();katCiz();$("bdSes").checked=sesAcik();$("bdDuy").classList.toggle("hide",!isAdmin());
    try{var A=bAyar();$("bdTel").value=A.tel;$("bdOner").checked=A.oner}catch(e){}
    if(!d.open)d.showModal();
    hepsiOku();hatirlatCiz();
  }
  window.bilPanelAc=panelAc;
  $("bBell").onclick=panelAc;
  {var mb=$("mBell");if(mb)mb.onclick=panelAc}
  $("bdNo").onclick=function(){$("dBild").close()};
  $("bdTabs").onclick=function(e){var b=e.target.closest("button[data-s]");if(!b)return;sekme=b.dataset.s;ciz()};
  $("bdL").onclick=function(e){var b=e.target.closest("[data-k]");if(!b)return;var x=LISTE.find(function(y){return y.key===b.dataset.k});if(x)git(x)};
  $("bdOku").onclick=function(){acikSon=Date.now()+864e5;hepsiOku();ciz();toast("✓ Hepsi okundu")};
  $("bdSes").onchange=function(){try{localStorage.setItem("bilSes",this.checked?"1":"0")}catch(e){}if(this.checked)bip()};
  /* konu aç/kapat (kişiye özel, sunucuda) */
  function katCiz(){
    $("bdKat").innerHTML=TUR.map(function(x){return '<label class="chip" style="display:flex;padding:6px 10px;font-size:14px;margin:4px 0"><input type="checkbox" data-kt="'+x[0]+'"'+(kapat[x[0]]?"":" checked")+' style="width:auto;margin:0 8px 0 0"> '+esc(x[1])+'</label>'}).join("")}
  $("bdKat").onchange=function(e){var c=e.target.closest("input[data-kt]");if(!c||!user)return;var t=c.dataset.kt;
    if(c.checked)delete kapat[t];else kapat[t]=true;rozet();ciz();
    db.ref("bildirimOku/"+me()+"/kapat/"+t).set(c.checked?null:true).catch(function(er){toast(errText(er))});
    if(PUSH)setTimeout(function(){pushKur(false)},500)};
  /* telefon bildirimi izni */
  function telDurum(){
    var el=$("bdTelD"),bt=$("bdTelAc"),uy=$("bdTelUy");if(!el)return;
    var dest="Notification" in window&&!!navigator.serviceWorker,st=dest?Notification.permission:"yok";
    el.textContent=st==="granted"?"✅ Açık (bu cihazda)":st==="denied"?"⛔ Engellenmiş":st==="yok"?"Bu tarayıcı desteklemiyor":"Kapalı";
    bt.classList.toggle("hide",st!=="default");
    uy.innerHTML=st==="denied"?"Telefon ayarlarından izin verin: Chrome > ⋮ > Ayarlar > Site ayarları > Bildirimler > bu site > İzin ver. (Ana ekrandaki uygulama ise: uzun basın > Uygulama bilgisi > Bildirimler.)"
      :st==="yok"?"iPhone'da: siteyi Safari'den «Ana Ekrana Ekle» ile kurup oradan açınca desteklenir (iOS 16.4+)."
      :st==="granted"?(!PUSH?"Uygulama açıkken veya arka plandayken bildirim telefonun üst çubuğuna düşer. Kapalıyken gelmesi için yöneticinin bildirim sunucusu adresini girmesi gerekir."
        :!pushDestek()?"Bu tarayıcı kapalıyken bildirimi desteklemiyor (iPhone'da ana ekrana ekleyip oradan açın)."
        :pushDurum==="ok"?"✅ Uygulama KAPALIYKEN de bildirim gelir (bu telefon sunucuya kayıtlı).":pushDurum?"⚠️ Kapalıyken bildirim kurulamadı: "+esc(pushDurum):"Sunucuya kaydediliyor…"):"";
    var sb=$("bdSina");if(sb)sb.classList.toggle("hide",!(PUSH&&st==="granted"&&pushDurum==="ok"));
    var pw=$("bdPushW");if(pw)pw.classList.toggle("hide",!isAdmin());
    var top=$("bdTelTop");if(top)top.classList.toggle("hide",st!=="default");
  }
  function izinIste(){
    if(!("Notification" in window))return toast("Bu tarayıcı bildirim desteklemiyor.");
    Notification.requestPermission().then(function(p){telDurum();if(p==="granted"){toast("✓ Telefon bildirimleri açıldı");telBildir({b:"🔔 Bildirimler açık",m:"Size gelen işler burada görünecek.",key:""});pushKur(true)}else toast("Bildirim izni verilmedi.")})}
  $("bdTelAc").onclick=izinIste;
  /* yönetici: sunucu adresi */
  $("bdPushK").onclick=function(){
    if(!isAdmin())return;var u=$("bdPushU").value.trim().replace(/\/+$/,"");
    if(u&&!/^https:\/\/[^\s\/]+(\/[^\s]*)?$/.test(u))return toast("Adres https:// ile başlamalı (örn. https://mag-bildirim.xxx.workers.dev)");
    db.ref("ayarlar/push").set(u?{url:u.slice(0,200)}:null).then(function(){toast(u?"✓ Sunucu adresi kaydedildi":"Sunucu adresi silindi");if(u)fetch(u+"/").then(function(r){return r.text()}).then(function(t){toast(t.slice(0,90));setTimeout(function(){pushKur(true)},500)}).catch(function(){toast("⚠️ Sunucuya ulaşılamadı, adresi kontrol edin")})}).catch(function(er){toast("⚠️ Kaydedilemedi: "+errText(er)+" (Firebase kuralları yayınlandı mı?)")})};
  $("bdSina").onclick=function(){var u=$("bdTelUy"),yaz=function(t){toast(t);if(u)u.textContent=t};yaz("Gönderiliyor…");
    pushIstek("/sina",{}).then(function(j){yaz(j.ok?"✓ Deneme bildirimi gönderildi ("+j.gonderilen+"/"+j.kayitli+" cihaz). Gelmediyse: Windows/telefon bildirim ayarlarında Chrome'a izin verildiğini kontrol edin.":"⚠️ "+(j.hata||"gönderilemedi")+(j.kayitli?" ("+j.kayitli+" kayıtlı cihaz, hiçbirine ulaşılamadı)":""))}).catch(function(e){yaz("⚠️ "+e.message)})};
  {var tt=$("bdTelTop");if(tt)tt.onclick=izinIste}

  /* ---------------- HATIRLATMALAR (anlık hesaplanır, kayıt tutulmaz) ---------------- */
  async function hatirlatmalar(){
    var H=[];
    try{
      if(isVeriGor()){
        var st=isAdmin()?ASAMALAR:ASAMALAR.filter(asamaYap),gec=[],bug=[];
        for(var i=0;i<st.length;i++){var s=await db.ref("isEmirleri").orderByChild("asama").equalTo(st[i]).once("value"),v=s.val()||{};
          Object.keys(v).forEach(function(k){var e=Object.assign({id:k},v[k]),g=terminGun(e);if(g===null)return;if(g>0)gec.push([e,g]);else if(g===0)bug.push(e)})}
        gec.sort(function(a,b){return b[1]-a[1]});
        if(gec.length)H.push({ik:"⏰",b:gec.length+" geciken iş emri"+(isAdmin()?"":" (sizin aşamanızda)"),m:gec.slice(0,5).map(function(x){return x[0].no+" · "+(x[0].musteri||"-")+" · "+x[1]+" gün · "+asAd(x[0].asama)}).join("\n"),git:"is",r:gec[0][0].no});
        if(bug.length)H.push({ik:"📅",b:bug.length+" iş emrinin termini BUGÜN",m:bug.slice(0,5).map(function(e){return e.no+" · "+(e.musteri||"-")+" · "+asAd(e.asama)}).join("\n"),git:"is",r:bug[0].no});
      }
    }catch(e){}
    try{
      if(rec&&rec.rol==="Sevkiyat Sorumlusu"||isAdmin()){
        var tl=window.talOzet&&window.talOzet();if(tl&&tl.length)H.push({ik:"📋",b:tl.length+" bekleyen talimat",m:tl.slice(0,4).map(function(x){return "• "+String(x.metin||"").split("\n")[0].slice(0,60)}).join("\n"),git:"tal"});
        var th=window.tahOzet&&window.tahOzet();if(th&&th.length)H.push({ik:"💰",b:th.length+" bekleyen tahsilat talebi",m:th.slice(0,4).map(function(x){return "• "+(x.cari||"-")}).join("\n"),git:"tah"});
      }
      if(rec&&rec.rol==="Sevkiyat Sorumlusu"&&typeof urunler!=="undefined"){
        var bn=urunler.filter(function(u){return u.durum==="sevk_edilecek"&&u.sevkSorumluUid===me()});
        if(bn.length)H.push({ik:"🚚",b:"Size verilmiş "+bn.length+" sevkiyat bekliyor",m:bn.slice(0,4).map(function(u){return "• "+(u.musteri||"-")+" · "+fmt(u.kg)+" kg"}).join("\n"),git:"sev:sevk_edilecek"});
      }
    }catch(e){}
    var SK=[];
    try{
      if(modGor("stok")){
        SK=(typeof sKalem!=="undefined"&&sKalem.length)?sKalem:[];
        if(!SK.length){var x=await db.ref("stokKalem").once("value"),v2=x.val()||{};SK=Object.keys(v2).map(function(k){return Object.assign({id:k},v2[k])})}
        SK=SK.filter(function(k){return dur(k)!=="ok"}).sort(function(a,b){return(a.ad||"").localeCompare(b.ad||"","tr")});
        if(SK.length)H.push({ik:"⚠️",b:SK.length+" stok kalemi azaldı / tükendi",m:SK.slice(0,6).map(function(k){return "• "+(k.ad||"-")+": "+mevTxt(k)+(dur(k)==="no"?" (TÜKENDİ)":"")}).join("\n"),git:"stok",stok:true});
      }
    }catch(e){}
    try{if(isAdmin()&&window.bkDbT!==undefined){var g=Math.floor((Date.now()-(+window.bkDbT||0))/864e5);if(!window.bkDbT||g>=3)H.push({ik:"💾",b:window.bkDbT?"Son yedek "+g+" gün önce":"Henüz yedek alınmamış",m:"Yönetici paneli > Yedekleme",git:""})}}catch(e){}
    hatirlatmalar.SK=SK;
    return H}
  async function hatirlatCiz(){
    var el=$("bdH");if(!el)return;el.innerHTML='<p class="mut" style="font-size:13px">Hatırlatmalar hazırlanıyor…</p>';
    var H=await hatirlatmalar();if(!$("dBild").open)return;
    el.innerHTML=H.length?'<div class="shd" style="margin-top:6px">📌 HATIRLATMALAR</div>'+H.map(function(x,i){return '<button type="button" class="bli hat" data-h="'+i+'"><span class="bik">'+esc(x.ik)+'</span><span class="bim"><b>'+esc(x.b)+'</b>'+(x.m?'<span class="sub" style="white-space:pre-line">'+esc(x.m)+'</span>':"")+'</span></button>'+(x.stok?'<button type="button" class="btn b3 sm" data-wstok="1" style="width:auto;margin:-2px 0 8px">📲 Stok listesini WhatsApp\'a gönder</button>':"")}).join(""):"";
    el.onclick=function(e){var w=e.target.closest("[data-wstok]");if(w){window.open(waUrl(stokWa(hatirlatmalar.SK||[])),"_blank");return}
      var b=e.target.closest("[data-h]");if(!b)return;var x=H[+b.dataset.h];if(x&&x.git)git(x)};
  }
  /* günde bir kez, açılışta: «bugün sizi bekleyenler» özeti */
  async function gunlukHatirlat(){
    try{
      if(!user||!rec||rec.onay!==true)return;
      var gun=new Date().toISOString().slice(0,10),ak="bilHat_"+me();
      if(localStorage.getItem(ak)===gun)return;
      var H=(await hatirlatmalar()).filter(function(x){return x.ik!=="💾"});
      localStorage.setItem(ak,gun);
      if(!H.length)return;
      var x={ik:"📌",b:"Günün hatırlatması",m:H.map(function(h){return h.b}).join(" · "),key:""};
      if(document.hidden)telBildir(x);else pop(x);
    }catch(e){}
  }

  /* ---------------- DUYURU (yönetici) ---------------- */
  var duyK={};
  $("bdDuy").onclick=async function(){
    if(!isAdmin())return;$("duyE").textContent="";$("duyM").value="";$("duyB").value="";
    var s=$("duyH");s.innerHTML='<option value="genel">📢 Herkes</option>';
    try{var x=await db.ref("kullanicilar").once("value"),v=x.val()||{};duyK=v;
      Object.keys(v).filter(function(k){return v[k]&&v[k].onay&&k!==me()}).sort(function(a,b){return String(v[a].ad||"").localeCompare(String(v[b].ad||""),"tr")})
        .forEach(function(k){var o=document.createElement("option");o.value="u_"+k;o.textContent="👤 "+(v[k].ad||v[k].kullanici||"?")+(v[k].rol?" · "+v[k].rol:"");s.appendChild(o)})}catch(e){}
    $("dDuy").showModal();$("duyB").focus()};
  $("duyX").onclick=function(){$("dDuy").close()};
  $("duyOk").onclick=function(){
    var b=$("duyB").value.trim(),m=$("duyM").value.trim(),h=$("duyH").value;
    if(!b){$("duyE").textContent="Başlık yazın.";return}
    bil([h],{t:"duyuru",ik:"📢",b:"📢 "+b,m:m});
    $("dDuy").close();toast("✓ Duyuru gönderildi")};

  /* ---------------- WhatsApp özeti (eski «Hepsini WhatsApp'a gönder») ---------------- */
  $("bdAll").onclick=function(){
    var t=[],O=LISTE.filter(function(x){return +x.z>Date.now()-864e5&&!kapat[x.t]});
    if(O.length)t.push(O.map(function(x){return x.b+(x.m?" — "+x.m:"")}).join("\n"));
    if(hatirlatmalar.SK&&hatirlatmalar.SK.length)t.push(stokWa(hatirlatmalar.SK));
    if(!t.length)return toast("Gönderilecek bildirim yok (son 24 saat).");
    window.open(waUrl("📋 *MAG AMBALAJ — Özet*\n"+t.join("\n\n")),"_blank")};
  $("bdTel").oninput=function(){bYaz("bildTel",$("bdTel").value.trim())};
  $("bdOner").onchange=function(){bYaz("bildOner",$("bdOner").checked?"1":"0")};

  /* ---------------- Yönetici: 45 günden eski bildirimleri temizle (günde bir, bu cihazdan) ---------------- */
  async function temizle(){
    try{
      if(!isAdmin())return;var gun=new Date().toISOString().slice(0,10);if(localStorage.getItem("bilTemiz")===gun)return;localStorage.setItem("bilTemiz",gun);
      var K=kanallarim().filter(function(c){return c.indexOf("u_")!==0});
      try{var x=await db.ref("kullanicilar").once("value");Object.keys(x.val()||{}).forEach(function(u){K.push("u_"+u)})}catch(e){}
      var sinir=Date.now()-45*864e5,up={},n=0;
      for(var i=0;i<K.length;i++){try{var s=await db.ref("bildirim/"+K[i]).orderByChild("z").endAt(sinir).limitToFirst(300).once("value");
        Object.keys(s.val()||{}).forEach(function(k){up["bildirim/"+K[i]+"/"+k]=null;n++})}catch(e){}}
      if(n)await db.ref().update(up);
    }catch(e){}
  }
})();
