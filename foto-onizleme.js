(function(){
try{
  var box=document.getElementById("fvBox"),im=document.getElementById("fvImg"),dl=document.getElementById("fvDl"),cl=document.getElementById("fvCl");
  var tok=0;
  function ac(src){
    var d=new Date(),z=function(n){return(n<10?"0":"")+n};
    var my=++tok,mm=/#([A-Za-z0-9_-]{20})$/.exec(src||"");
    im.src=src;dl.href=src;
    if(mm&&window.fotoTamGetir){im.style.opacity=".6";window.fotoTamGetir(mm[1]).then(function(f){if(my!==tok)return;im.style.opacity="";if(f){im.src=f;dl.href=f}}).catch(function(){if(my===tok)im.style.opacity=""})}
    dl.setAttribute("download","foto-"+d.getFullYear()+z(d.getMonth()+1)+z(d.getDate())+"-"+z(d.getHours())+z(d.getMinutes())+z(d.getSeconds())+".jpg");
    box.classList.add("on");
  }
  function kapat(){tok++;im.style.opacity="";box.classList.remove("on");im.removeAttribute("src")}
  function tikla(e){
    var t=e.currentTarget;
    e.preventDefault();e.stopPropagation();
    if(t.src)ac(t.src);
  }
  function bagla(){
    var l=document.querySelectorAll(".item img");
    for(var i=0;i<l.length;i++){
      var g=l[i];
      if(g.__fv||g.classList.contains("th"))continue;
      g.__fv=1;g.style.cursor="pointer";
      g.addEventListener("click",tikla);
      var bt=document.createElement("button");
      bt.type="button";bt.textContent="🔍 Büyüt / İndir";
      bt.style.cssText="display:block;width:100%;padding:11px;margin:0 0 8px;border:0;border-radius:8px;background:#0f172a;color:#fff;font-size:17px;font-weight:800;cursor:pointer";
      bt.__src=g;
      bt.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();if(this.__src.src)ac(this.__src.src)});
      g.insertAdjacentElement("afterend",bt);
    }
  }
  window.fvAc=ac;
  bagla();
  new MutationObserver(bagla).observe(document.body,{childList:true,subtree:true});
  setInterval(bagla,1500);
  cl.addEventListener("click",kapat);
  box.addEventListener("click",function(e){if(e.target===box)kapat()});
  document.addEventListener("keydown",function(e){if(e.key==="Escape")kapat()});
}catch(err){console.error("foto görüntüleyici:",err)}

})();
