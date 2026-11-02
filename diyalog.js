(function(){
  /* v130: Tüm pencereler (sonradan oluşturulanlar dahil — ADET & MALİYET gibi) boş alana (karartılmış arka plana) dokununca kapanır.
     «Vazgeç» düğmesi olan pencerede Vazgeç'e basılmış gibi davranır; üst çubuk pencereleri doğrudan kapanır. */
  var dis=function(d,e){var r=d.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom};
  /* v133: Yapay Zekâ (✕) dahil HER pencere kapanır: önce Vazgeç/İptal, yoksa Kapat/✕/Geç düğmesine basılmış gibi; hiçbiri yoksa doğrudan kapatılır. */
  var SIRA=["Vazgeç","İptal","Kapat","✕","×","✖","Geç"];
  var vazgec=function(d){var bl=Array.prototype.filter.call(d.querySelectorAll("button"),function(b){return b.offsetParent!==null||b.getClientRects().length});
    for(var i=0;i<SIRA.length;i++){var f=bl.find(function(b){return b.textContent.trim()===SIRA[i]});if(f)return f}return null};
  var basla=null;
  document.addEventListener("pointerdown",function(e){var d=e.target;basla=(d&&d.tagName==="DIALOG"&&d.open&&dis(d,e))?d:null},true);
  document.addEventListener("click",function(e){
    var d=e.target,b=basla;basla=null;
    if(!d||d!==b||d.tagName!=="DIALOG"||!d.open||!dis(d,e))return;
    var v=vazgec(d);
    if(v)v.click();else d.close();
  },true);
})();
