(function(){
  document.querySelectorAll("dialog").forEach(function(d){
    var v=Array.prototype.find.call(d.querySelectorAll("button"),function(b){return b.textContent.trim()==="Vazgeç"});
    if(!v)return;
    var dis=function(e){var r=d.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom};
    var basla=false;
    d.addEventListener("pointerdown",function(e){basla=e.target===d&&dis(e)});
    d.addEventListener("click",function(e){if(basla&&e.target===d&&dis(e))v.click();basla=false});
  });
  /* Üst çubuk pencereleri (Yönetici, Bildirim, Şifre, İsim): boş alana (karartılmış arka plana) dokununca kapanır */
  ["dAdm","dBild","dSf","dAd","dHes"].forEach(function(id){
    var d=document.getElementById(id);if(!d)return;
    var dis=function(e){var r=d.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom};
    var basla=false;
    d.addEventListener("pointerdown",function(e){basla=e.target===d&&dis(e)});
    d.addEventListener("click",function(e){if(basla&&e.target===d&&dis(e))d.close();basla=false});
  });
})();
