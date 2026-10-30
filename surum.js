/* ===================== YENİ SÜRÜM UYARISI (v122) =====================
   Telefonda açık kalan uygulama, siteye yeni sürüm yüklendiğinde bunu fark etmez (eski dosyalarla çalışmaya devam eder).
   Bu dosya 10 dakikada bir ve uygulamaya geri dönülünce sunucudaki index.html'e bakar; sürüm numarası büyümüşse
   altta «🆕 Yeni sürüm hazır — Yenile» şeridi çıkar. Bekleyen (gönderilmemiş) kayıt varsa yenilemeden önce sorar. */
(function(){
  var s=document.querySelector('script[src*="app.js?v="]'),m=s&&String(s.getAttribute("src")).match(/v=(\d+)/);
  if(!m||typeof fetch!=="function")return;
  var V=+m[1],son=0,el=null;
  function goster(n){
    if(el)return;
    el=document.createElement("div");el.id="surumBan";
    if("showPopover" in HTMLElement.prototype)el.setAttribute("popover","manual");
    el.innerHTML='<span>🆕 Uygulamanın yeni sürümü hazır (v'+n+').</span>';
    var b=document.createElement("button");b.type="button";b.textContent="⟳ Şimdi yenile";
    b.onclick=function(){
      try{var d=window.bagDurum&&window.bagDurum();if(d&&d.bekleyen>0&&!confirm("Gönderilmemiş "+d.bekleyen+" kayıt var. Yenilerseniz kaybolabilir. Yine de yenilensin mi?"))return}catch(e){}
      location.href=location.pathname+"?t="+Date.now()+location.hash};
    var k=document.createElement("button");k.type="button";k.textContent="Sonra";k.className="sn";
    k.onclick=function(){try{el.hidePopover&&el.hidePopover()}catch(e){}el.remove();el=null;son=Date.now()+30*6e4};
    el.appendChild(b);el.appendChild(k);document.body.appendChild(el);
    try{el.showPopover&&el.showPopover()}catch(e){}
  }
  function kontrol(){
    if(Date.now()-son<4*6e4||el)return;son=Date.now();
    fetch("index.html?t="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.text():""}).then(function(t){
      var x=String(t).match(/app\.js\?v=(\d+)/);if(x&&+x[1]>V)goster(+x[1])}).catch(function(){});
  }
  setTimeout(kontrol,20000);
  setInterval(kontrol,10*6e4);
  document.addEventListener("visibilitychange",function(){if(!document.hidden)kontrol()});
})();
