var LG_A="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOIAAAB/CAAAAADXg0GWAAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAAALe0lEQVR42u1acWgTaRb/3WYgA5kjgeRIoIEU0qNCPbIQaKEFC92lLhHq0YMKLtSlBz28o11cEHGX7qFQFz3coy4KPbxlPXRR0UXFSpW6VGmXVixabLGlLTY0wQRTNsEEJ3TKuz9mvkkyk9Sku6tFvt8/mbyZb+Z733vfe7/3ZgAODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODo53CL971xSqapKH1t9pkzWuEI1Z32UNe4iIiHreXQ1bVA3pVXeeUChzsD/oUITEZHRrq1ir/YpdsRuVju14ri7PYcuWVrFbnWXbCxqpRLmRIwcGX5CO06FG55ZVcS8REZ23rdGrsse4r1ARLHRsURWPqPOzE1GZI+rOUgksdG9JFU9qjrpGz8obEBjOU+rRDntVvknP2regih1ERLR2cGKhvxx249t5moXb8cXs3PdxAKjf4/Y2q8LEh9NvX6UQpscf5AkmGoBjQ17E5uOvH32ametJl9FeHU+1U11vm8qo0wjkJHaihUCZowc0LUa7bOaT9n7t7MUtsfXyE0T98HF3eYMPq9G3s7VEHmx7tRV0HNVWumB/BcpM3URE9PNG62F5SERE/rep4kNNRdum2ezZjS8aNq3gm8YjTcXaTYxVnfB1NckVIqK9W0DFusqHdhIRHVEjy0bpb2ST9/+18ERTsb7ikf41IrqmKjtys8V8wfGLGoNbIKInb01DN8trrZU2NiwJBzsx2A1gz2Uj2b0A3P4IAEJDAK7/GYDt40YPZFGUlBlBSkeXluPLQk2dcDsKAHW+6GLGUlMlyJnlVfUeTklQkikAgNUhLQGoF+JSTFaUrP4cZ+1PVkBMFWtfOObWoceBpp9Q3zz1Y/mLc56I6HxecmwrtlNfBHVXAYBQCTL7HYDjBZIj+jNyGLA5CwWHAbgLGPIVAGhd0f/frM8N6UAj0Yu+CmPNDj05ElFVwflWTXoAwH71CcDBUoT9CoIGCdvseVhr6zJI+vWygeEh4HteUO7ohz3WfiIatlWk4rW8LoFmUh3PKMff7EREj/LYkBl2o/ZB+J4ZLzp4nkwL8dQgqTc8pC83OrTA7FwE7xUXRwHc1f99XEBeq9nRf4NI7QPwPoDSLMEbBXCh2dU0xDhWXX+18SKxSTuYmdFlKQCYmcvNoq2zYIzekxmKn6wB5MtlG/EAEdFx+468Sp/GzG5KREQh1BERNQKDzH3YqZe5azqvnLXnBcABxv5omNluRS/T9jL6a0VwjA76tPkQES18x46etfk7Bwd0Rx1eICLaX35rcYWIqPOgaSMYSJOKbubWzIdOTmgHg6xUOQg41eTKeK2+xw+EtHV8qTtlkG0PH2DfkYsNRETsoldtAHwBX8FMVkrmZ7OjegGcmyv0CQRZ3RQMFpZc+BzA7kYommB+kp1iHidasZoCgFpRFbh0N82EZ9UDaRsTyVMs6QGp+wDQqD/Mo/1+fgNAeDpcMBNHspSKxZuMU6seg6TvW43QGIY7bx0D8IGumKxNGsp2Vk83CDXB28mU8y8sp+UycNo4r0iEZcHqB0B9VBGC/aa5ThabsiRUpuKS7NCO5rT1rT78FQAMMPmlPZp8GQDqvBJbfFaQpkPaL7r2AfmtHinXwXM4DA/+Qc/zocm2rw2TS0t5ccgEV7iiiJpOM5/Yd47xVgDo6NX+9R46oZlkFQC8PqZZUIu+sYRmxfngPmP0ZHrNzPuMFfo9vdu77YNTxuV3MQfRfMBAeFCRiqsp1YPGv3rwqeYW20IAmIaJb8OHIqpJVKrV3MCadtrvZZnNp8l4cwez+L/DQYMVF+erBpk7hEp6nFgklQENlZGbKkywsAZbLhm353EPjc/0qAGPcf5RxrDa9rMw+LOJDLCc4XdOGM6MuTvo9WjJC/15bKcyKwbwJQCMhwFk2OKN9A1oR4+PAfjX9ZwVoXll8irz8CTbMC7jdoPCom9SMq68wu63IdRbW7yF0hpfRSp6cOccgKMAgPXdqvCDo+ym32QA4AwAiAXd//kw6+0JkmEDxRKmCCeZtJdEc/6+ay6FVJWM4s/KVvExgJNWfAtM3lElN+4ZYsKl3LOjBc2bZDRZKlL/cD2nCLOZSR+LYLLi1NdGSURdRtOblaayVfwKgGMn7sfASKXqtbk12J1RrQsAUwVUQFD0sCkbbjszbw4foh7B2SjRZbzo2C2jZF+4+CJay1bxMgC0A/+Y0lPs/Qv5F3zCtlkvcGpuDwAwJwy4mY6iYvTBIg+vNvIFr98Y+hOzuv4MPxakjrzNWH5IPUJEa4We0Gqo9zS0+DUGqRPkjpushGs3hMGz10yRsZ0NW9E5++GHxhhrt2hHemTWrOUz3u4FLOWGm38CELqA1ZzoTh7RupS3nkvq7/VJE10JGENJs3mrtDNSIOomDgSNfaTaXcbd3VDCiukK2j5jRLRikOml1ULhNg8QER3eyzJeD0uQj0rWyGvPTaKXGyTBUVY+r+m1kxvuvka9mfCEmfdVBUljHIDX0B/9A9sbH64WyPsBQGT5TRZZBPGW7IopsyaRvMF6N7MNm1zUDnYO9kWOjvcxe09fZb5QyUv6FcZs8r2qWD/PrlbAjRfZful5WNpWetVbjhVHzaKLBf+esObVzfZcx6TSBqVBeJOIaLRIs46u6ZX5yA5W/d9k0WXCNHkslGJ0OTxrMb+g3lvQ8Xk+qAekEfYZQiVN2ABr9OXBSUTUbr6MrgG271jDStshE61a13E02GjYiiHUPX8tDd0P00KMWgJj+RG6Q9NsQO+YXLGU2yoGgBUvgOb7hpDjWvxj4YubnQBm/qTpa8skogD8orPa978w4BRlYfdQFAjtEqxLsxGPx5q1KvHr60DrrsW40LbH9NgvbyhKQ0fdrTOzADo+awDGbyerW7cDi6e+AdAVaN0GIBJePPMAGOgF8J+/AT3HJACJj6Yqf3Gzw1CRtRT0R2ynTR1I0zJaNwgBPj1GMqsOGvp4dr+aA51uwKp1SX31OXZgq2sM2QDA7ffXBtyoDGqyHyvdfXWf3MQmL1Rf/1qCOWDnm/1EQo1TP4dKnK5/qDfbK9fNDsBa180C6QTrNbb73uzHWe6NwlTV002/9wIODJ8NdZ/PxZyLjCaEfG/6S5cB0wcRuhtrjOL4pqZkDJ8DLLHsb/kt3qtv9CXjpxeuegE8fnx/Ml3rSMzGFZvkkBVlta3XAQAnrj7YzCNNy+Jj5MgRXXrjLyktRdnjsxWWDzcH4/30sPPbfCf53oZn139/t1iZ57o3A5zZ8ytN4ZxeM3h/k4+6y/j8vbY3ZHiTdPWvKdhNDVuLKK9bvK6kIqdlAco6LOtA/XbMpCAp6UQKPlltSdh7G2RREq1Z6/tA4ovkICu8IoeGUoDbo0RSgFVQlBIqO9P6q2SLQ0n9chUBv8/r7lV7U4m74Zh0y0wjbIrgca7D7XcpyYxiE5WMLFmyMU9toGopDTGeTMThRHhekaMALBBFUVDSgsc9mdl/BgBO9QK4d2JS8DfVZpfDgt8hyzIgCoil4FQysiKJlqw9HknJrUFXMqMI1ukl2eXzQJYVAen07GS28nCT6/8vAacG9wFI7CoRYRQISgYyBCjrEERkZQXCugjJ4comFFiVDJQsRGdGcSoprCOj9n9WZ4ElADhxaPICIMpph+CokWwSfN50PCaIkl2ajyg1biWVrHLIsmdpelGu3l6XTMoQRCUueWrFWNzmERLxbGr6F6gIANlPfjwtXPqi1MfhWWRTADDlS0MSkE5nrA5RSboSCU8skVGSS8mk4BAUIZI1tc7unPk77n2O752nMDSVjacdonM+LMdW0+FliA6nYymipGqFZFx2CLHV5blZxWtPR1IQMDcZFpdjYnTG63MkozEZWxkqFXUHy6S39jpwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHAUxf8B+V6kPrEx5n8AAAAASUVORK5CYII=",LG_B="data:image/png;base64,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";
(function(){
  var g=function(id){return document.getElementById(id)};
  var CK="lblCfg",cur=null,shared=null,eRef=null,tpl={},tplKey="",hist=[],tok=0;
  /* Ortak etiket ölçüsü: ayarlar/etiket (herkes için aynı) */
  window.etAyarBaslat=function(){window.etAyarDurdur();eRef=db.ref("ayarlar/etiket");
    eRef.on("value",function(sn){shared=sn.val()||null;if(g("lbDlg").open)ortGuncelle()},function(){})};
  window.etAyarDurdur=function(){if(eRef){eRef.off();eRef=null}shared=null};
  function cfgGet(){var d={w:100,h:100,mag:1,qr:1};try{var s=JSON.parse(localStorage.getItem(CK)||"{}");if(s.w>0)d.w=s.w;if(s.h>0)d.h=s.h;if(s.mag===0||s.mag===1)d.mag=s.mag;if(s.qr===0||s.qr===1)d.qr=s.qr}catch(e){}
    if(shared&&shared.w>=20&&shared.h>=20){d.w=shared.w;d.h=shared.h;d.mag=shared.mag===0?0:1}return d}
  function cfgSet(c){try{localStorage.setItem(CK,JSON.stringify(c))}catch(e){}}
  function cfgRead(){var w=parseFloat(String(g("lbW").value).replace(",",".")),h=parseFloat(String(g("lbH").value).replace(",","."));return{w:w>=20?w:100,h:h>=20?h:100,mag:g("lbMag").value==="0"?0:1,qr:g("lbQr").value==="0"?0:1}}
  var T=function(s){return String(s==null?"":s).trim().toLocaleUpperCase("tr-TR")};
  var X=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
  var N=function(n){return Number(n||0).toLocaleString("tr-TR",{maximumFractionDigits:3})};
  var cols=function(e){return Object.values((e&&e.siparis)||{}).filter(Boolean)};
  var nCol=function(e){return Math.max(cols(e).length,1)};
  var live=function(){return(window.isE||[]).find(function(x){return cur&&x.id===cur.id})||cur};

  /* ---- Etiket: işin adı / ÜRÜN / EBAT / KG ---- */
  function row(t,k){return '<div class="lbr">'+(k?'<div class="lbc lbk" data-g="k"><span>'+k+'</span></div>':"")+'<div class="lbc"><span>'+X(T(t))+'</span></div></div>'}
  /* QR: etiketi okutan telefon / okuyucu uygulamayı bu iş emriyle açar */
  var qrMemo={};
  function qrUrl(no){return location.href.split(/[?#]/)[0].replace(/index\.html$/,"")+"?is="+encodeURIComponent(no)}
  function qrSvg(t){if(qrMemo[t])return qrMemo[t];
    var q=new window.QRLib(-1,0);q.addData(t);q.make();var n=q.getModuleCount(),m=2,d="";
    for(var r=0;r<n;r++){var c=0;while(c<n){if(q.isDark(r,c)){var s=c;while(c<n&&q.isDark(r,c))c++;d+="M"+(s+m)+" "+(r+m)+"h"+(c-s)+"v1h-"+(c-s)+"z"}else c++}}
    var z=n+2*m;return qrMemo[t]='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+z+' '+z+'" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet"><rect width="'+z+'" height="'+z+'" fill="#fff"/><path d="'+d+'" fill="#000"/></svg>'}
  function qrRow(c){if(!c.qr||!cur||!cur.no)return"";
    return'<div class="lbq"><div class="qrc">'+qrSvg(qrUrl(cur.no))+'</div><div class="qt"><div class="lbc" data-g="q"><span>İŞ EMRİ NO</span></div><div class="lbc qn"><span>'+X(cur.no)+'</span></div></div></div>'}
  function lblHtml(o,c){
    var kg=o.kg>0?N(o.kg)+" KG":"";
    var h='<div class="lb" style="width:'+c.w+'mm;height:'+(c.h-0.3)+'mm">';
    if(c.mag)h+='<div class="lbh"><div class="lbc blk"><img src="'+LG_A+'" alt=""></div><div class="lbhm"><div class="lbc" data-g="h"><span>MAG AMBALAJ</span></div><div class="lbc" data-g="h"><span>A.Ş.</span></div></div><div class="lbc blk"><img src="'+LG_B+'" alt=""></div></div>';
    h+='<div class="lbx">'+qrRow(c)+row(o.isAdi,"")+row(o.urun,"ÜRÜN")+row(o.ebat,"EBAT")+row(kg,"KG")+'</div>';
    if(c.mag)h+='<div class="lbf"><div class="lbc" data-g="f"><span>Cumhuriyet Mahallesi Meclis Caddesi No:62 Silivri/İSTANBUL</span></div><div class="lbc" data-g="f"><span>info@magambalaj.com</span></div><div class="lbc" data-g="f"><span>www.magambalaj.com</span></div></div>';
    return h+'</div>';
  }
  function fit(root){
    root.querySelectorAll(".lbc").forEach(function(c){
      var s=c.firstElementChild;if(!s||s.tagName==="IMG")return;
      var av=c.clientWidth-parseFloat(getComputedStyle(c).paddingLeft)*2;
      var sz=Math.max(6,Math.floor(c.clientHeight*(c.dataset.g==="f"?0.85:(c.dataset.g==="q"||c.classList.contains("qn")?0.7:0.82))));
      s.style.fontSize=sz+"px";var w=s.offsetWidth;
      if(w>av&&w>0){sz=Math.max(5,Math.floor(sz*av/w));s.style.fontSize=sz+"px";var n=0;while(s.offsetWidth>av&&sz>5&&n++<40){sz--;s.style.fontSize=sz+"px"}}
    });
    ["k","f","h","q"].forEach(function(gr){
      var a=[].slice.call(root.querySelectorAll('[data-g="'+gr+'"]'));if(!a.length)return;
      var m=Math.min.apply(null,a.map(function(c){return parseFloat(c.firstElementChild.style.fontSize)}));
      a.forEach(function(c){c.firstElementChild.style.fontSize=m+"px"});
    });
  }
  function temizle(){var s=g("lbPage");if(s)s.remove();document.body.classList.remove("lblp");var p=g("lprn");p.innerHTML="";p.className=""}

  /* ---- Varsayılanlar (iş emrinden) ---- */
  function defs(e,i){
    var c=cols(e)[i]||{},sv=(e.etiket&&e.etiket["k"+i])||null;
    if(sv)return{isAdi:sv.isAdi||"",urun:sv.urun||"",ebat:sv.ebat||"",kg:sv.kg>0?sv.kg:20,adet:1,yapildi:true};
    var en=String(c.en||"").trim(),boy=String(c.boy||"").trim(),kg=20;
    return{isAdi:T(e.isAdi)||T(e.musteri),urun:T(e.urunAdi)||T(e.stok).replace(/^(OR\.?|ORJ\.?)\s*/,"").replace(/^(LDPE|HDPE|LLDPE|PP)\s*/,""),
      ebat:en&&boy?en+" X "+boy:(en||boy),kg:kg,adet:1,yapildi:false};
  }

  window.etiketAc=function(e){
    try{
      temizle();cur=e;var c=cfgGet(),n=nCol(e),C=cols(e);
      g("lbT").textContent="🏷️ Etiket hazırla — "+(e.no||"");g("lbE").textContent="";
      g("lbW").value=c.w;g("lbH").value=c.h;g("lbMag").value=String(c.mag);g("lbQr").value=String(c.qr);
      var h="";
      for(var i=0;i<n;i++){
        var d=defs(e,i),x=C[i]||{},lab=[i+1+". sütun",x.en,x.boy].filter(function(v){return v!==undefined&&v!==null&&String(v).trim()!==""}).join(" · ");
        h+='<div class="lbrow" data-i="'+i+'" data-y="'+(d.yapildi?1:0)+'"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:16px">'+X(lab)+(x.kg?' · sipariş '+X(N(x.kg))+' kg':'')+'</b><span class="ok" style="font-size:13px;font-weight:800;color:#16a34a">'+(d.yapildi?"✅ hazırlandı":"")+'</span></div>'+
        '<div style="display:grid;grid-template-columns:1fr auto auto;gap:6px;margin-top:8px"><select data-t><option value="">📋 Şablonlar…</option></select><button type="button" class="btn b6 sm" data-sk style="width:auto;margin:0">💾 Kaydet</button><button type="button" class="btn b6 sm" data-ss style="width:auto;margin:0">🗑</button></div>'+
        '<details class="lbHg" style="display:none;margin-top:6px"><summary style="font-size:14px;font-weight:800;cursor:pointer">🕘 Önceki baskılar</summary><div class="lbHl"></div></details>'+
        '<label class="s">İşin adı</label><input data-f="isAdi" maxlength="60" value="'+X(d.isAdi)+'">'+
        '<label class="s">Ürün</label><input data-f="urun" maxlength="60" value="'+X(d.urun)+'">'+
        '<label class="s">Ebat</label><input data-f="ebat" maxlength="40" value="'+X(d.ebat)+'">'+
        '<div><label class="s">KG (koli / paket)</label><input data-f="kg" type="number" inputmode="decimal" min="0" step="any" value="'+d.kg+'"></div>'+
        '<div class="chips"><button type="button" data-kg="15">15</button><button type="button" data-kg="20">20</button><button type="button" data-kg="25">25</button><button type="button" data-kg="30">30</button></div>'+
        '<div class="lbPW"><div class="lbPv"></div></div><div class="qrWarn err"></div>'+
        '<button class="btn b3 lbOne" type="button" style="margin-top:0">🖨️ Bu etiketi bas</button></div>';
      }
      g("lbRows").innerHTML=h;g("lbDlg").showModal();prevAll();ortGuncelle();ekYukle(e);
    }catch(err){console.error("etiket:",err)}
  };
  function readRow(r){var v=function(f){return r.querySelector('[data-f="'+f+'"]').value};
    return{isAdi:v("isAdi").trim(),urun:v("urun").trim(),ebat:v("ebat").trim(),kg:parseFloat(String(v("kg")).replace(",","."))||0,adet:1}}
  function prevRow(r){
    var c=cfgRead(),o=readRow(r),P=r.querySelector(".lbPv"),W=r.querySelector(".lbPW");
    P.style.transform="none";P.innerHTML=lblHtml(o,c);fit(P);
    var pw=c.w*96/25.4,ph=c.h*96/25.4,s=Math.min(1,(W.clientWidth-16)/pw);
    P.style.transform="scale("+s+")";P.style.width=pw+"px";P.style.height=ph+"px";W.style.height=(ph*s+16)+"px";
    var qc=P.querySelector(".qrc"),qw=r.querySelector(".qrWarn");
    if(qw){var mm=qc?qc.offsetHeight*25.4/96:99;/* en az ~22 mm (test: 15 mm okunmuyor) */qw.style.display=qc&&mm<22?"block":"none";if(qc&&mm<22)qw.textContent="⚠️ QR çok küçük kalıyor (≈"+Math.round(mm)+" mm). Okunmayabilir: etiket boyunu büyütün veya QR'ı kapatın."}
  }
  function prevAll(){g("lbRows").querySelectorAll(".lbrow").forEach(prevRow)}
  g("lbDlg").addEventListener("input",function(ev){var r=ev.target.closest(".lbrow");clearTimeout(prevAll.h);prevAll.h=setTimeout(function(){r&&!ev.target.closest("#lbMag,#lbW,#lbH")?prevRow(r):prevAll()},120)});
  g("lbDlg").addEventListener("change",function(ev){if(ev.target.closest("#lbMag,#lbQr"))prevAll()});
  g("lbRows").addEventListener("click",function(ev){
    var b=ev.target.closest("button");if(!b)return;var r=b.closest(".lbrow");if(!r)return;
    if(b.dataset.kg){var k=r.querySelector('[data-f="kg"]');k.value=b.dataset.kg;prevRow(r)}
    else if(b.classList.contains("lbOne"))bas([+r.dataset.i]);
  });
  g("lbNo").onclick=function(){g("lbDlg").close()};
  g("lbAll").onclick=function(){var a=[];for(var i=0;i<nCol(cur);i++)a.push(i);bas(a)};

  /* ---- Yazdır + Firebase'e "etiket hazırlandı" kaydı ---- */
  function bas(idx){
    var c=cfgRead(),err=g("lbE"),rows=g("lbRows").querySelectorAll(".lbrow"),L=[];
    idx.forEach(function(i){var o=readRow(rows[i]);o.i=i;L.push(o)});
    for(var k=0;k<L.length;k++){var o=L[k];
      if(!o.urun&&!o.ebat&&!o.isAdi){err.textContent=(o.i+1)+". sütun etiketi boş.";return}
    }
    err.textContent="";cfgSet(c);
    var P=g("lprn"),out="";P.className="meas";
    L.forEach(function(x){P.innerHTML=lblHtml(x,c);fit(P);out+=P.innerHTML});
    P.innerHTML=out;P.className="";
    var e=live(),up={},sv=(e&&e.etiket)||{},n=nCol(e),done=0;
    L.forEach(function(x){up["etiket/k"+x.i]={isAdi:x.isAdi,urun:x.urun,ebat:x.ebat,kg:x.kg,adet:x.adet,tasarim:c.mag?"markali":"sade",kim:ad(),zaman:firebase.database.ServerValue.TIMESTAMP}});
    for(var i=0;i<n;i++)if(sv["k"+i]||L.some(function(x){return x.i===i}))done++;
    up.etiketYapildi=done>=n;up.etiketsiz=null;
    db.ref("isEmirleri/"+cur.id).update(up).catch(function(er){toast(errText(er))});
    hrkYaz(cur.id,{tur:"etiket",adet:L.length}).catch(function(){});
    L.forEach(function(x){db.ref("etiketGecmis/"+cur.id).push().set({i:x.i,isAdi:x.isAdi,urun:x.urun,ebat:x.ebat,kg:x.kg,tasarim:c.mag?"markali":"sade",w:c.w,h:c.h,kim:ad(),uid:user.uid,zaman:firebase.database.ServerValue.TIMESTAMP}).catch(function(){})});
    rows.forEach(function(r,i){if(L.some(function(x){return x.i===i}))r.querySelector(".ok").textContent="✅ hazırlandı"});
    var st=document.createElement("style");st.id="lbPage";st.textContent="@media print{@page{size:"+c.w+"mm "+c.h+"mm;margin:0}}";document.body.appendChild(st);
    document.body.classList.add("lblp");g("lbDlg").close();
    var t=document.title;document.title=(cur.no||"etiket")+" - etiket";
    window.onafterprint=function(){document.title=t;temizle();window.onafterprint=null};
    setTimeout(function(){window.print()},200);
  }

  /* ---- Şablon / geçmiş / ortak ölçü ---- */
  var slug=function(v){return trn(v).replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,60)||"x"};
  function setRow(r,o){["isAdi","urun","ebat"].forEach(function(f){if(o[f]!=null)r.querySelector('[data-f="'+f+'"]').value=o[f]});
    if(o.kg>0)r.querySelector('[data-f="kg"]').value=o.kg;prevRow(r)}
  function sablonListe(){
    var arr=Object.keys(tpl).map(function(k){return Object.assign({k:k},tpl[k])}).sort(function(a,b){return(a.urun||"").localeCompare(b.urun||"","tr")});
    g("lbRows").querySelectorAll(".lbrow").forEach(function(r){var s=r.querySelector("[data-t]"),cv=s.value;
      s.innerHTML='<option value="">📋 '+X((cur&&cur.musteri)||"Müşteri")+' şablonları ('+arr.length+')…</option>'+arr.map(function(t){return'<option value="'+X(t.k)+'">'+X([t.urun,t.ebat,t.kg>0?t.kg+" kg":""].filter(Boolean).join(" · "))+'</option>'}).join("");
      if(tpl[cv])s.value=cv})}
  function gecmisListe(){
    g("lbRows").querySelectorAll(".lbrow").forEach(function(r){var i=+r.dataset.i,L=hist.filter(function(h){return h.i===i}),box=r.querySelector(".lbHg");
      box.style.display=L.length?"block":"none";box.querySelector("summary").textContent="🕘 Önceki baskılar ("+L.length+")";
      box.querySelector(".lbHl").innerHTML=L.map(function(h){return'<div style="display:flex;justify-content:space-between;gap:6px;align-items:center;padding:5px 0;border-top:1px dashed #cbd5e1;font-size:14px"><span><span style="color:#64748b">'+X(new Date(+h.zaman||0).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"}))+' · '+X(h.kim||"")+'</span><br><b>'+X([h.urun,h.ebat,h.kg>0?h.kg+" kg":""].filter(Boolean).join(" · "))+'</b></span><button type="button" class="btn b6 sm" data-hu="'+hist.indexOf(h)+'" style="width:auto;margin:0;flex:none">↺ Kullan</button></div>'}).join("")})}
  /* Henüz basılmamış sütunlarda, ebadı şablonla aynıysa şablonu otomatik uygula */
  function sablonUygula(){g("lbRows").querySelectorAll('.lbrow[data-y="0"]').forEach(function(r){if(r.dataset.touched)return;
    var eb=trn(r.querySelector('[data-f="ebat"]').value);if(!eb)return;
    var m=Object.keys(tpl).map(function(k){return tpl[k]}).filter(function(t){return trn(t.ebat)===eb}).sort(function(a,b){return(b.zaman||0)-(a.zaman||0)})[0];
    if(m){setRow(r,{isAdi:m.isAdi||null,urun:m.urun,ebat:m.ebat,kg:m.kg});r.querySelector(".ok").textContent="📋 şablondan"}})}
  function ekYukle(e){var my=++tok;tpl={};hist=[];tplKey=slug(e.musteri||"genel");sablonListe();gecmisListe();
    db.ref("etiketSablon/"+tplKey).once("value").then(function(sn){if(my!==tok)return;tpl=sn.val()||{};sablonListe();sablonUygula()}).catch(function(){});
    db.ref("etiketGecmis/"+e.id).once("value").then(function(sn){if(my!==tok)return;var v=sn.val()||{};
      hist=Object.keys(v).map(function(k){return v[k]}).sort(function(a,b){return(b.zaman||0)-(a.zaman||0)}).slice(0,60);gecmisListe()}).catch(function(){})}
  function ortGuncelle(){var c=cfgRead(),o=shared&&shared.w>=20&&shared.h>=20?shared:null,t=g("lbOrt"),b=g("lbOrtBtn");if(!t)return;
    t.textContent=o?"📌 Ortak ölçü: "+N(o.w)+" × "+N(o.h)+" mm · "+(o.mag===0?"Sade":"Markalı")+(o.kim?" (ayarlayan: "+o.kim+")":""):"📌 Henüz ortak ölçü ayarlanmadı (şu an her cihazda ayrı).";
    b.classList.toggle("hide",!!o&&o.w===c.w&&o.h===c.h&&(o.mag===0?0:1)===c.mag)}
  ["input","change"].forEach(function(t){g("lbDlg").addEventListener(t,function(ev){
    if(ev.target.closest("#lbMag,#lbW,#lbH"))ortGuncelle();
    var r=ev.target.closest(".lbrow");if(r&&t==="input"&&ev.target.closest("[data-f]"))r.dataset.touched="1";
    if(t==="change"&&ev.target.matches("[data-t]")&&r){var m=tpl[ev.target.value];if(m){setRow(r,m);r.dataset.touched="1"}}})});
  g("lbOrtBtn").onclick=function(){var c=cfgRead();
    db.ref("ayarlar/etiket").set({w:c.w,h:c.h,mag:c.mag,kim:ad(),zaman:firebase.database.ServerValue.TIMESTAMP}).then(function(){toast("📌 Ortak etiket ölçüsü kaydedildi")}).catch(function(er){toast(errText(er))})};
  g("lbRows").addEventListener("click",function(ev){
    var b=ev.target.closest("button");if(!b)return;var r=b.closest(".lbrow");if(!r)return;
    if(b.hasAttribute("data-hu")){var h=hist[+b.dataset.hu];if(h){setRow(r,h);r.dataset.touched="1";r.querySelector(".ok").textContent="↺ geçmişten"}}
    else if(b.hasAttribute("data-sk")){var o=readRow(r);
      if(!o.urun&&!o.ebat)return toast("Ürün veya ebat yazın.");
      if(!cur||!String(cur.musteri||"").trim())return toast("Bu iş emrinde müşteri adı yok.");
      var key=slug(o.urun+"|"+o.ebat),rec={musteri:cur.musteri,isAdi:o.isAdi,urun:o.urun,ebat:o.ebat,kg:o.kg,ekleyen:ad(),ekleyenUid:user.uid,zaman:firebase.database.ServerValue.TIMESTAMP};
      if(tpl[key]&&tpl[key].ekleyenUid){rec.ekleyenUid=tpl[key].ekleyenUid;rec.ekleyen=tpl[key].ekleyen||rec.ekleyen} /* adım 2: kayıt sahibi değişmez */
      db.ref("etiketSablon/"+tplKey+"/"+key).set(rec).then(function(){tpl[key]=Object.assign({},rec,{zaman:Date.now()});sablonListe();r.querySelector("[data-t]").value=key;toast("📋 Şablon kaydedildi")}).catch(function(er){toast(errText(er))})}
    else if(b.hasAttribute("data-ss")){var k=r.querySelector("[data-t]").value;
      if(!k)return toast("Önce silinecek şablonu seçin.");if(!confirm("Seçili şablon silinsin mi?"))return;
      silCop("etiketSablon/"+tplKey,k,"Etiket şablonu").then(function(){delete tpl[k];sablonListe();toast("Şablon silindi")}).catch(function(er){toast(errText(er))})}
  });

  /* ---- ETİKET → EKSTRUDER geçişi ---- */
  var wE=null;
  window.etiketIleri=function(e){
    if(e.etiketYapildi){var u1={};u1["isEmirleri/"+e.id+"/asama"]="ekstruder";hrkEk(u1,e.id,{tur:"ileri",kimden:"etiket",kime:"ekstruder"});db.ref().update(u1).catch(function(er){toast(errText(er))});return}
    wE=e;var C=cols(e),sv=e.etiket||{},eks=[];
    for(var i=0;i<nCol(e);i++)if(!sv["k"+i]){var x=C[i]||{};eks.push([i+1+".",x.en,x.boy].filter(function(v){return v!==undefined&&v!==null&&String(v).trim()!==""}).join(" "))}
    g("lbWT").textContent="Bu iş emri için etiket yapılmadı"+(eks.length?" ("+eks.join(", ")+" sütun)":"")+". Etiket yapmadan Ekstruder'e geçmek istiyor musunuz?";
    g("lbWarn").showModal();
  };
  g("lbWY").onclick=function(){g("lbWarn").close();if(wE)window.etiketAc(wE)};
  g("lbWX").onclick=function(){g("lbWarn").close()};
  /* Dışarı dokununca kapat */
  ["iDlg","lbDlg","lbWarn"].forEach(function(id){
    var d=document.getElementById(id);if(!d)return;var dn=false;
    var out=function(ev){var r=d.getBoundingClientRect();return ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom};
    d.addEventListener("pointerdown",function(ev){dn=ev.target===d&&out(ev)});
    d.addEventListener("click",function(ev){if(dn&&ev.target===d&&out(ev))d.close();dn=false});
  });
  g("lbWS").onclick=function(){
    g("lbWarn").close();if(!wE)return;
    var u2={};u2["isEmirleri/"+wE.id+"/asama"]="ekstruder";u2["isEmirleri/"+wE.id+"/etiketsiz"]=true;hrkEk(u2,wE.id,{tur:"etiketsiz",kimden:"etiket",kime:"ekstruder"});
    db.ref().update(u2).catch(function(er){toast(errText(er))});
  };
})();
