(function(){
  var g=function(i){return document.getElementById(i)};
  var low=function(x){return String(x==null?"":x).toLocaleLowerCase("tr-TR")};
  var done=function(e){return e.asama==="bitti"||e.aktarildi};
  function hay(e){var c="";try{c=icols(e).map(function(x){x=x&&typeof x==="object"?x:{};return[x.en,x.boy,x.mikron,x.korona,x.kg].join(" ")}).join(" ")}catch(z){}
    return low([e.no,e.musteri,e.isAdi,e.stok,e.urunAdi,e.fx,e.formul,e.renk,c].join(" "))}
  function liste(){
    var w=low(g("gQ").value).split(/\s+/).filter(Boolean),a=g("gD1").value,b=g("gD2").value;
    var L=(window.isE||[]).filter(function(e){if(!done(e))return false;var h=hay(e),t=e.spTarih||"";
      return w.every(function(k){return h.indexOf(k)>-1})&&(!a||t>=a)&&(!b||t<=b)});
    g("gSum").textContent=L.length+" tamamlanan iş emri"+(L.length>60?" (ilk 60 gösteriliyor, aramayı daraltın)":"");
    var T=function(v){return v==null||typeof v==="object"?"":String(v)};
    try{g("gtL").innerHTML=L.length?L.slice(0,60).map(function(e){
      var C="";
      try{C=icols(e).map(function(c){c=c&&typeof c==="object"?c:{};return[T(c.en),T(c.boy)].filter(Boolean).join(" x ")+(T(c.mikron)?" · "+T(c.mikron)+"µ":"")+(+c.kg>0?" · "+fmt(c.kg)+" kg":"")}).join(" | ")}catch(x){C=""}
      return '<button type="button" class="item" data-id="'+esc(T(e.id))+'" style="display:block;width:100%;text-align:left;margin:6px 0;cursor:pointer;border:1.5px solid #cbd5e1;background:#fff;color:#0f172a"><b style="font-size:17px">'+esc(T(e.musteri)||"-")+(T(e.isAdi)?" — "+esc(T(e.isAdi)):"")+'</b><div style="font-size:14px;color:#475569;margin-top:2px">'+esc(T(e.no))+" · "+esc(T(e.stok))+'</div><div style="font-size:14px;color:#0369a1;font-weight:700;margin-top:2px">'+esc(C)+'</div></button>'}).join(""):'<div class="empty">Tamamlanmış iş emri bulunamadı.</div>';}catch(x){g("gtL").innerHTML='<div class="empty">Liste hatası: '+esc(x&&x.message)+'</div>'}
  }
  g("iGet").onclick=function(){g("gQ").value="";g("gD1").value="";g("gD2").value="";liste();g("gDlg").showModal()};
  ["gQ","gD1","gD2"].forEach(function(i){g(i).addEventListener("input",liste);g(i).addEventListener("change",liste)});
  g("gX").onclick=function(){g("gDlg").close()};
  g("gtL").onclick=function(ev){
    var b=ev.target.closest("button[data-id]");if(!b)return;
    var src=(window.isE||[]).find(function(e){return e.id===b.dataset.id});if(!src)return;
    var c={};["musteri","isAdi","stok","fx","formul","notU","baskiVar","urunAdi","renk","notB","siparis","fiyat","kdvDahil"].forEach(function(k){if(src[k]!==undefined)c[k]=src[k]});
    g("gDlg").close();g("iDlg").close();
    iAc(c);iEdit=null;
    g("iT").textContent="Yeni iş emri";g("iGet").style.display="";
    g("iNo").value=iNext();g("iTr").value=bugun();iQrGuncelle();
    toast("Bilgiler getirildi: "+(src.no||""));
  };
  var d=g("gDlg"),dn=false,out=function(ev){var r=d.getBoundingClientRect();return ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom};
  d.addEventListener("pointerdown",function(ev){dn=ev.target===d&&out(ev)});
  d.addEventListener("click",function(ev){if(dn&&ev.target===d&&out(ev))d.close();dn=false});
})();
