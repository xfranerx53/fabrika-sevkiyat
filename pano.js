/* ===================== YÖNETİCİ PANOSU — GÜNÜN ÖZETİ (v81) =====================
   Yönetici girişte menünün üstünde tek ekranda görür:
   geciken iş emirleri · bugün termini olanlar · sevk edilecekler · bekleyen tahsilat · bekleyen talimat ·
   onay bekleyen kullanıcılar · kritik stok · yedek durumu.
   Her kartın "git" düğmesi ilgili bölümü açar. Veriler:
   - iş emirleri: isEmirleri (asama indeksi, yalnız açık aşamalar) · sevk edilecek: urunler (durum indeksi)
   - tahsilat / talimat: tahsilat.js ve talimat.js'in zaten açık olan canlı dinleyicileri (ek okuma yok)
   - kullanıcılar: kullanicilar (yalnız yönetici okur) · stok: stokKalem · yedek: ayarlar/yedek
   Ortak şeyler (app.js): $, esc, fmt, db, isAdmin, terminGun, ASL, ARACLAR, dur, mevTxt, errText, toast, modSec, vTabSet, show */
(function(){
  var S={is:null,urun:null,stok:null,kul:null,yedek:0,yedekKim:"",yedekBoyut:"",hata:{}};
  var yedekRef=null,kulRef=null,tm=null,sonYuk=0,obs=null,yukluyor=false,LIM=5;
  var TRZ="Europe/Istanbul";
  var zm=function(t){return t?new Date(+t).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",timeZone:TRZ}):""};
  var menuAcik=function(){var m=$("vMenu");return !!m&&!m.classList.contains("hide")};
  var penAcik=function(){var d=$("dPano");return !!(d&&d.open)};
  var gorunuyor=function(){return menuAcik()||penAcik()}; /* menüde rozet ya da pencere açıkken yenile */
  var kes=function(s,n){s=String(s||"");return s.length>n?s.slice(0,n-1)+"…":s};
  var liste=function(v){return Object.keys(v||{}).map(function(k){return Object.assign({id:k},v[k])})};

  /* ---------- veri ---------- */
  function yukle(zorla){
    if(!isAdmin())return;
    var t=Date.now();
    if(yukluyor&&t-sonYuk<20000)return;
    if(!zorla&&t-sonYuk<30000){ciz();return}
    sonYuk=t;yukluyor=true;
    var bt=$("pnYn");if(bt)bt.disabled=true;
    var asm=["etiket","ekstruder","baski","kesim","depo"];
    var p1=Promise.all(asm.map(function(a){return db.ref("isEmirleri").orderByChild("asama").equalTo(a).once("value")}))
      .then(function(r){var l=[];r.forEach(function(s){l=l.concat(liste(s.val()))});S.is=l;delete S.hata.is})
      .catch(function(e){S.hata.is=errText(e)});
    var p2=db.ref("urunler").orderByChild("durum").equalTo("sevk_edilecek").once("value")
      .then(function(s){S.urun=liste(s.val());delete S.hata.urun})
      .catch(function(e){S.hata.urun=errText(e)});
    var p3=db.ref("stokKalem").once("value")
      .then(function(s){S.stok=liste(s.val());delete S.hata.stok})
      .catch(function(e){S.hata.stok=errText(e)});
    return Promise.all([p1,p2,p3]).then(function(){
      yukluyor=false;if(bt)bt.disabled=false;
      var z=$("pnZaman");if(z)z.textContent="Güncelleme: "+new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit",timeZone:TRZ});
      ciz();
    });
  }

  /* ---------- görünüm ---------- */
  function kart(o){
    var bas='<span>'+o.ik+' '+esc(o.baslik)+'</span>';
    if(o.hata)return '<div class="pnK" data-r="tu"><div class="pnT">'+bas+'</div><div class="sub">Okunamadı: '+esc(o.hata)+'</div></div>';
    if(o.n===null)return '<div class="pnK" data-r="gr"><div class="pnT">'+bas+'</div><div class="sub">Yükleniyor…</div></div>';
    if(!o.n)return '<div class="pnOk">✓ '+esc(o.bos)+'</div>';
    var h='<div class="pnK" data-r="'+o.renk+'"><div class="pnT">'+bas+'<b class="pnN">'+o.n+'</b></div>';
    o.satir.slice(0,LIM).forEach(function(x){h+='<div class="pnR"><div>'+esc(x.a)+'</div><small>'+esc(x.b||"")+'</small></div>'});
    if(o.satir.length>LIM)h+='<div class="pnR"><small>+ '+(o.satir.length-LIM)+' tane daha…</small></div>';
    return h+'<button type="button" class="pnG" data-g="'+o.git+'">'+esc(o.gitTxt)+' ›</button></div>';
  }

  function yedekKart(){
    var t=+S.yedek||0,g=t?Math.floor((Date.now()-t)/864e5):null,renk,mesaj;
    if(!t){renk="kr";mesaj="⚠ Henüz kayıtlı bir yedek yok. Yedek alın."}
    else if(g>=7){renk="kr";mesaj="⚠ Son yedek "+g+" gün önce ("+zm(t)+"). Yeni yedek alın."}
    else if(g>=3){renk="tu";mesaj="Son yedek "+g+" gün önce ("+zm(t)+"). Yakında yenileyin."}
    else{renk="ye";mesaj="✓ Son yedek: "+zm(t)+(g?" ("+g+" gün önce)":" (bugün)")}
    var kim=(t&&S.yedekKim)?" · "+S.yedekKim+(S.yedekBoyut?" · "+S.yedekBoyut:""):"";
    return '<div class="pnK" data-r="'+renk+'"><div class="pnT"><span>💾 Yedek durumu</span></div><div class="sub" style="font-size:14px">'+esc(mesaj+kim)+'</div>'+
      '<div class="pnBt"><button type="button" class="pnG" data-y="1">⬇ Yedek al (fotoğraflı)</button><button type="button" class="pnG" data-y="0">⬇ Hızlı (fotoğrafsız)</button></div>'+
      '<small class="pnIp">Her gün otomatik yedek için: Firebase Konsolu › Realtime Database › Backups (Blaze planı).</small></div>';
  }

  function ciz(){
    var box=$("pnBody");if(!box||!isAdmin())return;
    var isl=S.is||[],gec=[],bug=[];
    isl.forEach(function(e){var g=terminGun(e);if(g===null)return;if(g>0)gec.push({e:e,g:g});else if(g===0)bug.push({e:e,g:g})});
    gec.sort(function(a,b){return b.g-a.g});
    var isSatir=function(x){return{a:(x.e.no||"-")+" · "+(x.e.musteri||"-"),b:(x.g>0?x.g+" gün gecikti":"bugün teslim")+" · "+(ASL[x.e.asama]||x.e.asama)+(x.e.isAdi?" · "+kes(x.e.isAdi,28):"")}};
    var tah=window.tahOzet?window.tahOzet():null,tal=window.talOzet?window.talOzet():null;
    var kul=S.kul?S.kul.filter(function(k){return k.onay!==true}):null;
    var stk=S.stok?S.stok.filter(function(k){return dur(k)!=="ok"}).sort(function(a,b){var x=dur(a)==="no"?0:1,y=dur(b)==="no"?0:1;return x-y||String(a.ad||"").localeCompare(String(b.ad||""),"tr")}):null;
    var ur=S.urun?S.urun.slice().sort(function(a,b){return (+a.eklenmeTarihi||0)-(+b.eklenmeTarihi||0)}):null;
    var yedekEski=!(+S.yedek)||(Date.now()-(+S.yedek))>=7*864e5;

    var dikkat=(gec.length?1:0)+(tah&&tah.length?1:0)+(tal&&tal.length?1:0)+(kul&&kul.length?1:0)+(stk&&stk.length?1:0)+(yedekEski?1:0);
    var ms=$("mPanoS");if(ms)ms.textContent=dikkat?"⚠ "+dikkat+" konu dikkatinizi bekliyor":"Günün özeti, kullanıcılar, yedekleme";
    var h='<div class="pnOz" data-r="'+(dikkat?"kr":"ye")+'">'+(dikkat?"⚠ "+dikkat+" konu dikkatinizi bekliyor":"✓ Her şey yolunda")+'</div>';

    h+=kart({ik:"👤",baslik:"Onay bekleyen kullanıcılar",bos:"Onay bekleyen kullanıcı yok",hata:S.hata.kul,n:kul?kul.length:null,renk:"kr",git:"usr",gitTxt:"Kullanıcıları yönet",
      satir:(kul||[]).map(function(k){return{a:(k.ad||"-")+" · "+(k.rol||"-"),b:"@"+(k.kullanici||"-")}})});
    h+=kart({ik:"⏰",baslik:"Geciken iş emirleri",bos:"Geciken iş emri yok",hata:S.hata.is,n:S.is?gec.length:null,renk:"kr",git:"is",gitTxt:"İş emirlerine git",satir:gec.map(isSatir)});
    h+=kart({ik:"📅",baslik:"Bugün termini olan işler",bos:"Bugün termini olan iş yok",hata:S.hata.is,n:S.is?bug.length:null,renk:"ma",git:"is",gitTxt:"İş emirlerine git",satir:bug.map(isSatir)});
    h+=kart({ik:"🚚",baslik:"Sevk edilecekler",bos:"Sevk listesi boş",hata:S.hata.urun,n:ur?ur.length:null,renk:"tu",git:"sevk",gitTxt:"Sevkiyata git",
      satir:(ur||[]).map(function(u){return{a:(u.musteri||"-")+" · "+fmt(u.kg)+" kg",b:(ARACLAR[u.arac]||"araç seçilmedi")+(u.sevkSorumlu?" · "+u.sevkSorumlu:"")}})});
    h+=kart({ik:"💰",baslik:"Bekleyen tahsilat",bos:"Bekleyen tahsilat yok",n:tah?tah.length:null,renk:"tu",git:"tah",gitTxt:"Tahsilata git",
      satir:(tah||[]).map(function(x){return{a:x.cari||"-",b:(x.not?kes(x.not,50)+" · ":"")+zm(x.zaman)}})});
    h+=kart({ik:"📋",baslik:"Bekleyen talimat",bos:"Bekleyen talimat yok",n:tal?tal.length:null,renk:"tu",git:"tal",gitTxt:"Talimatlara git",
      satir:(tal||[]).map(function(x){return{a:kes(x.metin,60),b:"→ "+(x.hedefUid==="*"?"Tüm sorumlular":(x.hedefAd||"?"))+" · "+zm(x.zaman)}})});
    h+=kart({ik:"⚠️",baslik:"Kritik stok",bos:"Kritik stok yok",hata:S.hata.stok,n:stk?stk.length:null,renk:"kr",git:"stok",gitTxt:"Stoğa git",
      satir:(stk||[]).map(function(k){return{a:(k.ad||"-")+(k.ebat?" · "+k.ebat:""),b:mevTxt(k)+" — "+(dur(k)==="no"?"TÜKENDİ":"azalıyor")}})});
    h+=yedekKart();
    box.innerHTML=h;
  }

  /* ---------- gezinme ---------- */
  function acPano(){var d=$("dPano");if(!d||!isAdmin())return;ciz();yukle(false);if(!d.open)d.showModal()}
  function git(k){
    if(k==="usr"){$("bAdm").click();return}
    var d=$("dPano");if(d&&d.open)d.close();
    menuOk=true;
    if(k==="is")modSec("is");
    else if(k==="sevk"){modSec("sevk");vTabSet("sev")}
    else if(k==="tal"){modSec("sevk");vTabSet("tal")}
    else if(k==="tah"){modSec("sevk");vTabSet("tah")}
    else if(k==="stok")modSec("stok");
    show("vApp");window.scrollTo(0,0);
  }
  function yedekAl(foto){var c=$("bkFoto"),b=$("bkJson");if(!b)return;if(c)c.checked=!!foto;b.click();var d=$("pnBkDurum");if(d)d.classList.remove("hide")}

  /* ---------- yaşam döngüsü (app.js bildBaslat / bildDurdur çağırır) ---------- */
  window.panoBaslat=function(){
    window.panoDurdur();
    var mp=$("mPano");if(!mp)return;
    if(!isAdmin()){mp.classList.add("hide");return}
    mp.classList.remove("hide");
    try{
      kulRef=db.ref("kullanicilar");
      kulRef.on("value",function(s){var v=s.val()||{};S.kul=Object.keys(v).map(function(k){var x=v[k]||{};return{uid:k,ad:x.ad,kullanici:x.kullanici,rol:x.rol,onay:x.onay}});delete S.hata.kul;ciz()},
        function(e){S.hata.kul=errText(e);ciz()});
      yedekRef=db.ref("ayarlar/yedek");
      yedekRef.on("value",function(s){var v=s.val()||{};S.yedek=+v.zaman||0;S.yedekKim=v.kim||"";S.yedekBoyut=v.boyut||"";window.bkDbT=S.yedek;
        try{if(typeof bkSonGoster==="function")bkSonGoster()}catch(e){}ciz()},function(){});
    }catch(e){}
    var bd=$("bkDurum");
    if(bd&&window.MutationObserver){obs=new MutationObserver(function(){var d=$("pnBkDurum");if(d){d.innerHTML=bd.innerHTML;d.classList.toggle("hide",!bd.textContent)}});obs.observe(bd,{childList:true,characterData:true,subtree:true})}
    tm=setInterval(function(){if(gorunuyor()&&!document.hidden)yukle(true)},120000);
    ciz();yukle(true);
  };
  window.panoDurdur=function(){
    if(kulRef){kulRef.off();kulRef=null}if(yedekRef){yedekRef.off();yedekRef=null}
    if(tm){clearInterval(tm);tm=null}if(obs){obs.disconnect();obs=null}
    S={is:null,urun:null,stok:null,kul:null,yedek:0,yedekKim:"",yedekBoyut:"",hata:{}};sonYuk=0;yukluyor=false;
    var d=$("dPano");if(d&&d.open)d.close();var mp=$("mPano");if(mp)mp.classList.add("hide");var ms=$("mPanoS");if(ms)ms.textContent="Günün özeti, kullanıcılar, yedekleme";var b=$("pnBody");if(b)b.innerHTML="";
  };
  window.panoGoster=function(){if(isAdmin())yukle(false)};   /* menüye dönülünce */
  window.panoYenile=function(){if(isAdmin())ciz()}; /* tahsilat / talimat canlı güncellemesi */

  document.addEventListener("click",function(e){
    if(e.target.closest("#mPano")){acPano();return}
    var box=$("dPano");if(!box||!box.contains(e.target))return;
    if(e.target.closest("#pnKapat")){box.close();return}
    if(e.target.closest("#pnYon")){$("bAdm").click();return}
    var y=e.target.closest("[data-y]");if(y){yedekAl(y.dataset.y==="1");return}
    var g=e.target.closest("[data-g]");if(g){git(g.dataset.g);return}
    if(e.target.closest("#pnYn"))yukle(true);
  });
  document.addEventListener("visibilitychange",function(){if(!document.hidden&&gorunuyor()&&isAdmin())yukle(false)});
})();
