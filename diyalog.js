(function(){
  /* v130: Tüm pencereler (sonradan oluşturulanlar dahil — ADET & MALİYET gibi) boş alana (karartılmış arka plana) dokununca kapanır.
     «Vazgeç» düğmesi olan pencerede Vazgeç'e basılmış gibi davranır; üst çubuk pencereleri doğrudan kapanır. */
  var UST={dAdm:1,dBild:1,dSf:1,dAd:1,dHes:1};
  var dis=function(d,e){var r=d.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom};
  var vazgec=function(d){return Array.prototype.find.call(d.querySelectorAll("button"),function(b){return b.textContent.trim()==="Vazgeç"})};
  var basla=null;
  document.addEventListener("pointerdown",function(e){var d=e.target;basla=(d&&d.tagName==="DIALOG"&&d.open&&dis(d,e))?d:null},true);
  document.addEventListener("click",function(e){
    var d=e.target,b=basla;basla=null;
    if(!d||d!==b||d.tagName!=="DIALOG"||!d.open||!dis(d,e))return;
    var v=vazgec(d);
    if(v)v.click();else if(UST[d.id])d.close();
  },true);
})();
