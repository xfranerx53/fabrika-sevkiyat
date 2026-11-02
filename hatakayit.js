/* hatakayit.js — Uygulamada çıkan hataları ve kullanıcıya gösterilen hata mesajlarını sessizce kaydeder (v131).
   Telefonda biriktirir (localStorage, en çok 40), giriş yapılmışsa 20 sn'de bir Firebase `hata/` altına gönderir.
   Amaç: kullanıcı anlatmadan Claude'un hatayı görüp çözebilmesi. Yalnız yönetici okur (rules.json). Şifre/fotoğraf yazılmaz. */
(function(){
  var K="fab_hata",V=((document.currentScript&&document.currentScript.src||"").match(/v=(\d+)/)||[])[1]||"";
  function oku(){try{return JSON.parse(localStorage.getItem(K))||[]}catch(e){return[]}}
  function cihaz(){var u=navigator.userAgent||"";return(/Android/.test(u)?"Android":/iPhone|iPad/.test(u)?"iOS":/Windows/.test(u)?"Windows":/Mac/.test(u)?"Mac":"diger")+" "+(/Edg\//.test(u)?"Edge":/Chrome\//.test(u)?"Chrome":/Safari\//.test(u)?"Safari":/Firefox\//.test(u)?"Firefox":"")+(matchMedia&&matchMedia("(display-mode: standalone)").matches?" (uygulama)":"")}
  function ekle(tur,m,s){try{m=String(m==null?"":m).replace(/\s+/g," ").trim().slice(0,400);if(!m)return;var l=oku(),son=l[l.length-1];
    if(son&&son.m===m&&Date.now()-son.t<120000){son.n=(son.n||1)+1}else l.push({t:Date.now(),tur:tur,m:m,s:String(s||"").slice(0,800),v:V,ekran:(document.querySelector(".view:not([hidden]),[id^=v].show")||{}).id||"",cihaz:cihaz()});
    localStorage.setItem(K,JSON.stringify(l.slice(-40)))}catch(e){}}
  window.hataKaydet=ekle;
  window.addEventListener("error",function(e){if(!e.message)return;ekle("hata",e.message+(e.filename?" @"+String(e.filename).split("/").pop().split("?")[0]+":"+e.lineno+":"+e.colno:""),e.error&&e.error.stack)});
  window.addEventListener("unhandledrejection",function(e){var r=e.reason||{};ekle("hata",(r.code?r.code+" ":"")+(r.message||String(r)),r.stack)});
  var A=window.alert;window.alert=function(m){ekle("uyari",m);return A.apply(this,arguments)};
  function sar(){/* kullanıcıya gösterilen hata metinleri (app.js errText) */
    if(typeof window.errText==="function"&&!window.errText.__s){var o=window.errText;window.errText=function(e){ekle("mesaj",(e&&e.code?e.code+" ":"")+(e&&e.message||e),e&&e.stack);return o.apply(this,arguments)};window.errText.__s=1}}
  function gonder(){try{sar();if(!window.firebase||!firebase.apps.length)return;var u=firebase.auth().currentUser;if(!u)return;var l=oku();if(!l.length)return;
    localStorage.setItem(K,"[]");l.forEach(function(o){o.u=u.uid;firebase.database().ref("hata").push(o).catch(function(){})})}catch(e){}}
  window.addEventListener("load",function(){sar();setTimeout(gonder,8000)});setInterval(gonder,20000);
})();
