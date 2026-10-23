/* ===================== GRANÜL =====================
   Excel'deki "ZEKERİYA GRANÜL TAKİP" tablosunun programdaki karşılığı. Birden çok granülcü eklenebilir; her birinin kendi defteri vardır.
   Veri yolları:
     granulcular/{id}  : {ad, zaman}
     granulKayit/{id}  : {gid (granülcü id), tarih "YYYY-MM-DD", sn (FİŞ NO), giden, gelen, satis, fire, fiyat, kdv, odeme, aciklama, ekleyen, ekleyenUid, zaman}
   Hesaplar kayıtta SAKLANMAZ, her seferinde şöyle hesaplanır (Excel ile aynı):
     TOPLAM FİYAT = gelen kilo × fiyat        SATIŞ FİYAT = satış kilo × fiyat
     KALAN KG     = Σ giden − Σ gelen − Σ fire
     BAKİYE       = Σ toplam fiyat + Σ KDV − Σ satış fiyat − Σ ödeme   (+ ise granülcüye borcumuz var; − ise alacaklıyız)
   v80: kart görünümü (dar ekran) + tablo (geniş ekran) · işlem türüne göre kayıt düğmeleri · satır satır kalan kg/bakiye · ay filtresi + aylık toplam · WhatsApp özeti
   app.js'teki db, user, rec, isAdmin, modGor, $, esc, fmt, trn, toast, errText, silCop, denetimYaz, xlsxHazir, ad ortak kullanılır. */
(function(){
  var gRef=null,kRef=null,G=[],K=[],sec="",ara="",ay="",sinir=60,mevcut=null,kRefId="",tip="hepsi";
  var TRZ="Europe/Istanbul";
  var AYAD=["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  var TS=function(){return firebase.database.ServerValue.TIMESTAMP};
  var canG=function(){return !!(rec&&rec.onay&&modGor("granul"))};
  var kim=function(){return ad()};
  var bugun=function(){return new Date().toLocaleDateString("en-CA",{timeZone:TRZ})};
  var r2=function(n){return Math.round(n*100)/100};
  var para=function(n){return fmt(n)+" ₺"};
  var kgf=function(n){return fmt(n)+" kg"};
  var bos=function(n){return +n?fmt(n):""}; /* tabloda 0 yerine boş */
  var tarihTR=function(t){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(t||"");return m?m[3]+"."+m[2]+"."+m[1]:(t||"")};
  var ayAd=function(a){var m=/^(\d{4})-(\d{2})$/.exec(a||"");return m?AYAD[+m[2]-1]+" "+m[1]:""};
  var silebilir=function(x){return isAdmin()||(user&&x.ekleyenUid===user.uid)};

  /* "110.059" -> 110059 ; "11.500,50" -> 11500.5 ; "-250" -> -250 */
  function sayi(s){
    s=String(s==null?"":s).trim();if(!s)return 0;
    var neg=/^[-−(]/.test(s);
    s=s.replace(/[^\d.,]/g,"");if(!s)return 0;
    if(s.indexOf(",")>=0){s=s.replace(/\./g,"").replace(",",".")}
    else if(/^\d{1,3}(\.\d{3})+$/.test(s)){s=s.replace(/\./g,"")}
    var n=parseFloat(s);if(!isFinite(n))return 0;
    return r2(neg?-n:n);
  }
  function hesap(x){var fy=+x.fiyat||0;return{top:r2((+x.gelen||0)*fy),sfy:r2((+x.satis||0)*fy)}}
  function topla(L){
    var t={giden:0,gelen:0,satis:0,fire:0,top:0,kdv:0,sfy:0,odeme:0};
    L.forEach(function(x){var h=hesap(x);
      t.giden+=+x.giden||0;t.gelen+=+x.gelen||0;t.satis+=+x.satis||0;t.fire+=+x.fire||0;
      t.top+=h.top;t.kdv+=+x.kdv||0;t.sfy+=h.sfy;t.odeme+=+x.odeme||0});
    Object.keys(t).forEach(function(k){t[k]=r2(t[k])});
    t.kalan=r2(t.giden-t.gelen-t.fire);
    t.bakiye=r2(t.top+t.kdv-t.sfy-t.odeme);
    return t;
  }
  var eskiYeni=function(a,b){return (a.tarih||"").localeCompare(b.tarih||"")||(a.zaman||0)-(b.zaman||0)};
  /* her satırdan sonraki kalan kg ve bakiye (hesap defteri gibi) */
  function kosu(L){
    var kg=0,bk=0,m={};
    L.slice().sort(eskiYeni).forEach(function(x){var h=hesap(x);
      kg+=(+x.giden||0)-(+x.gelen||0)-(+x.fire||0);
      bk+=h.top+(+x.kdv||0)-h.sfy-(+x.odeme||0);
      m[x.id]={kg:r2(kg),bk:r2(bk)}});
    return m;
  }
  var secili=function(){return G.find(function(g){return g.id===sec})||null};
  var bakiyeYazi=function(b){return b>0?"Granülcüye borcunuz":b<0?"Granülcüden alacağınız":"Hesap kapalı (bakiye)"};

  /* ---------- ekran ---------- */
  function chipler(){
    var k=$("grChips");if(!k)return;
    var L=G.slice().sort(function(a,b){return trn(a.ad).localeCompare(trn(b.ad))});
    k.innerHTML=L.map(function(g){return '<button type="button" data-g="'+esc(g.id)+'" class="'+(g.id===sec?"on":"")+'">'+esc(g.ad)+'</button>'}).join("");
    $("grBos").classList.toggle("hide",!!G.length);
    $("grIc").classList.toggle("hide",!secili());
    $("grChipW").classList.toggle("hide",!G.length);
  }
  function oz(){
    var t=topla(K),k=$("grOz"),g=secili();
    var c=function(e,d,s){return '<div style="background:'+s+';border-radius:10px;padding:8px 6px;text-align:center"><div style="font-size:12px;font-weight:800;color:#475569">'+e+'</div><div style="font-size:17px;font-weight:900;color:#0f172a">'+d+'</div></div>'};
    k.innerHTML=
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
        '<div style="background:#fde047;border-radius:12px;padding:12px 8px;text-align:center"><div style="font-size:13px;font-weight:800;color:#713f12">Granülcüde kalan mal</div><div style="font-size:26px;font-weight:900;color:#422006">'+kgf(t.kalan)+'</div></div>'+
        '<div style="background:#1e293b;border-radius:12px;padding:12px 8px;text-align:center"><div style="font-size:13px;font-weight:800;color:#cbd5e1">'+bakiyeYazi(t.bakiye)+'</div><div style="font-size:26px;font-weight:900;color:#fff">'+para(Math.abs(t.bakiye))+'</div></div>'+
      '</div>'+
      (t.kalan<0?'<div style="margin-top:8px;background:#fee2e2;border:1.5px solid #dc2626;color:#991b1b;border-radius:10px;padding:8px 10px;font-weight:700;font-size:14px">⚠ Gelen + fire, gönderilenden '+kgf(-t.kalan)+' fazla görünüyor. Kilo girişlerini kontrol edin.</div>':"")+
      '<details style="margin-top:8px"><summary style="cursor:pointer;font-weight:800;color:#475569;font-size:14px">Ayrıntılı toplamlar</summary>'+
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px">'+
          c("GİDEN",kgf(t.giden),"#dbeafe")+c("GELEN",kgf(t.gelen),"#dcfce7")+c("SATIŞ",kgf(t.satis),"#ede9fe")+
          c("FİRE",kgf(t.fire),"#ffedd5")+c("TOPLAM FİYAT",para(t.top),"#f1f5f9")+c("KDV",para(t.kdv),"#f1f5f9")+
          c("SATIŞ FİYAT",para(t.sfy),"#f1f5f9")+c("ÖDEME",para(t.odeme),"#fef3c7")+c("KAYIT",String(K.length),"#e2e8f0")+
        '</div>'+
        '<div class="sub" style="margin-top:6px">Kalan mal = Giden − Gelen − Fire<br>Bakiye = Toplam fiyat + KDV − Satış fiyat − Ödeme (artı ise borcunuz var)</div>'+
      '</details>';
  }
  /* tek satırın okunur özeti */
  function parcalar(x){
    var h=hesap(x),p=[];
    if(+x.giden>0)p.push(["#2563eb","📤 Gönderilen","<b>"+kgf(x.giden)+"</b>"]);
    if(+x.gelen>0)p.push(["#16a34a","📥 Gelen","<b>"+kgf(x.gelen)+"</b>"+(+x.fiyat>0?" × "+para(x.fiyat)+" = <b>"+para(h.top)+"</b>":"")]);
    if(+x.kdv)p.push(["#16a34a","🧾 KDV","<b>"+para(x.kdv)+"</b>"]);
    if(+x.satis>0)p.push(["#7c3aed","🛒 Satış","<b>"+kgf(x.satis)+"</b>"+(+x.fiyat>0?" × "+para(x.fiyat)+" = <b>"+para(h.sfy)+"</b>":"")]);
    if(+x.fire>0)p.push(["#ea580c","🔥 Fire","<b>"+kgf(x.fire)+"</b>"]);
    if(+x.odeme)p.push(["#d97706","💰 Ödeme","<b>"+para(x.odeme)+"</b>"]);
    return p;
  }
  function kart(x,run){
    var p=parcalar(x),renk=(p[0]&&p[0][0])||"#94a3b8",r=run[x.id]||{kg:0,bk:0};
    var b='<button class="btn b7 sm" data-a="duz" data-id="'+esc(x.id)+'" type="button">✏ Düzenle</button> ';
    if(silebilir(x))b+='<button class="btn b5 sm" data-a="sil" data-id="'+esc(x.id)+'" type="button">🗑 Sil</button>';
    return '<div class="item c" style="border-left-color:'+renk+'">'+
      '<div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"><b style="font-size:17px">'+esc(tarihTR(x.tarih))+'</b>'+(x.sn?'<span class="sub">Fiş no: <b>'+esc(x.sn)+'</b></span>':"")+'</div>'+
      p.map(function(q){return '<div style="font-size:15px;margin-top:3px"><span style="color:'+q[0]+';font-weight:800">'+q[1]+'</span> '+q[2]+'</div>'}).join("")+
      (x.aciklama?'<div style="white-space:pre-wrap;font-size:15px;color:#334155;margin-top:4px">'+esc(x.aciklama)+(x.duzenlemeZaman?' <span style="color:#b45309;font-size:12px">✎ düzeltildi</span>':"")+'</div>':(x.duzenlemeZaman?'<div class="sub" style="color:#b45309">✎ düzeltildi</div>':""))+
      '<div class="sub" style="margin-top:4px;border-top:1px dashed #e2e8f0;padding-top:3px">Bu satırdan sonra → kalan: <b>'+kgf(r.kg)+'</b> · bakiye: <b>'+para(r.bk)+'</b></div>'+
      '<div style="margin-top:6px">'+b+'</div></div>';
  }
  function satir(x,run){
    var h=hesap(x),b="",r=run[x.id]||{kg:0,bk:0};
    b+='<button class="btn b7 sm" data-a="duz" data-id="'+esc(x.id)+'" type="button" title="Düzenle">✏</button> ';
    if(silebilir(x))b+='<button class="btn b5 sm" data-a="sil" data-id="'+esc(x.id)+'" type="button" title="Sil">🗑</button>';
    return '<tr>'+
      '<td class="l" style="font-weight:800">'+esc(tarihTR(x.tarih))+'</td>'+
      '<td>'+esc(x.sn||"")+'</td>'+
      '<td style="color:#2563eb">'+bos(x.giden)+'</td><td style="color:#16a34a">'+bos(x.gelen)+'</td><td style="color:#7c3aed">'+bos(x.satis)+'</td><td style="color:#ea580c">'+bos(x.fire)+'</td>'+
      '<td>'+bos(x.fiyat)+'</td><td>'+bos(h.top)+'</td><td>'+bos(x.kdv)+'</td><td>'+bos(h.sfy)+'</td><td style="color:#d97706">'+bos(x.odeme)+'</td>'+
      '<td style="background:#fefce8;font-weight:700">'+fmt(r.kg)+'</td><td style="background:#f1f5f9;font-weight:700">'+fmt(r.bk)+'</td>'+
      '<td class="l" style="white-space:normal;min-width:140px">'+esc(x.aciklama||"")+(x.duzenlemeZaman?' <span style="color:#b45309;font-size:12px" title="'+esc(x.duzenleyen||"")+'">✎</span>':"")+'</td>'+
      '<td class="l">'+b+'</td></tr>';
  }
  function aylar(){
    var s={};K.forEach(function(x){if(x.tarih)s[x.tarih.slice(0,7)]=1});
    var L=Object.keys(s).sort().reverse(),sel=$("grAy");
    if(ay&&!s[ay])ay="";
    sel.innerHTML='<option value="">Tüm aylar</option>'+L.map(function(a){return '<option value="'+a+'">'+esc(ayAd(a))+'</option>'}).join("");
    sel.value=ay;
  }
  function ayFiltre(){return K.filter(function(x){return !ay||(x.tarih||"").slice(0,7)===ay})}
  function liste(){
    var run=kosu(K);
    var q=trn(ara).trim().split(/\s+/).filter(Boolean);
    var V=ayFiltre().filter(function(x){var h=trn([x.aciklama,x.sn,tarihTR(x.tarih),x.tarih].join(" "));return q.every(function(t){return h.indexOf(t)>=0})});
    V.sort(function(a,b){return eskiYeni(b,a)});
    var goster=V.slice(0,sinir);
    var bosYazi=K.length?"Bu seçime uyan kayıt yok.":"Henüz kayıt yok. Yukarıdaki düğmelerden birine basarak ilk kaydı ekleyin.";
    $("grKart").innerHTML=goster.length?goster.map(function(x){return kart(x,run)}).join(""):'<div class="sub" style="padding:14px 0;text-align:center">'+bosYazi+'</div>';
    $("grTb").innerHTML=goster.length?goster.map(function(x){return satir(x,run)}).join(""):'<tr><td colspan="15" class="l" style="text-align:center;padding:14px;color:#64748b">'+bosYazi+'</td></tr>';
    $("grDaha").classList.toggle("hide",V.length<=sinir);
    $("grDaha").textContent="Daha eski kayıtları göster ("+(V.length-sinir)+" kayıt daha)";
    var ao=$("grAyOz");
    if(ay){var t=topla(ayFiltre());
      ao.classList.remove("hide");
      ao.innerHTML='<b>'+esc(ayAd(ay))+' toplamı</b> <span class="mut">('+ayFiltre().length+' kayıt)</span><div style="margin-top:3px;font-size:15px">📤 Gönderilen <b>'+kgf(t.giden)+'</b> · 📥 Gelen <b>'+kgf(t.gelen)+'</b> · 🔥 Fire <b>'+kgf(t.fire)+'</b> · 🛒 Satış <b>'+kgf(t.satis)+'</b><br>Toplam fiyat <b>'+para(t.top)+'</b> · KDV <b>'+para(t.kdv)+'</b> · 💰 Ödeme <b>'+para(t.odeme)+'</b></div>';
    }else ao.classList.add("hide");
  }
  function ciz(){chipler();if(secili()){oz();aylar();liste()}}

  /* ---------- veri ---------- */
  function kayitDinle(){
    if(kRef){kRef.off();kRef=null}K=[];kRefId="";ay="";
    if(!sec||!secili()){ciz();return}
    kRefId=sec;
    kRef=db.ref("granulKayit").orderByChild("gid").equalTo(sec);
    kRef.on("value",function(s){var v=s.val()||{};K=Object.keys(v).map(function(k){return Object.assign({id:k},v[k])});ciz()},
      function(e){toast("Granül kayıtları okunamadı: "+errText(e)+" (Firebase kuralını güncellediniz mi?)")});
  }
  window.granAc=function(){
    if(!canG())return;
    if(gRef){ciz();return}
    gRef=db.ref("granulcular");
    gRef.on("value",function(s){
      var v=s.val()||{};G=Object.keys(v).map(function(k){return Object.assign({id:k},v[k])});
      var eski=sec;
      if(!sec){try{sec=localStorage.getItem("granSec")||""}catch(e){}}
      if(!secili())sec=G.length?G.slice().sort(function(a,b){return trn(a.ad).localeCompare(trn(b.ad))})[0].id:"";
      if(sec!==kRefId||sec!==eski)kayitDinle();else ciz();
    },function(e){toast("Granülcüler okunamadı: "+errText(e)+" (Firebase kuralını güncellediniz mi?)")});
  };
  window.granKapat=function(){
    if(gRef){gRef.off();gRef=null}if(kRef){kRef.off();kRef=null}
    G=[];K=[];sec="";kRefId="";ay="";
    if($("grTb"))$("grTb").innerHTML="";if($("grKart"))$("grKart").innerHTML="";if($("grChips"))$("grChips").innerHTML="";
  };

  /* ---------- granülcü ekle / yeniden adlandır / sil ---------- */
  var gcMod="yeni";
  function gcAc(m){
    gcMod=m;var g=secili();
    if(m==="duz"&&!g)return;
    $("grCH").textContent=m==="duz"?"✏ Granülcü adını değiştir":"＋ Yeni granülcü";
    $("grCAd").value=m==="duz"?g.ad:"";$("grCE").textContent="";
    $("dGrC").showModal();setTimeout(function(){$("grCAd").focus()},50);
  }
  $("grCEkle").onclick=function(){gcAc("yeni")};
  $("grCBos").onclick=function(){gcAc("yeni")};
  $("grCDuz").onclick=function(){gcAc("duz")};
  $("grCX").onclick=function(){$("dGrC").close()};
  $("grCOk").onclick=async function(){
    var b=this,a=$("grCAd").value.trim().replace(/\s+/g," ");
    if(!a){$("grCE").textContent="Ad yazın.";return}
    if(G.some(function(g){return trn(g.ad)===trn(a)&&!(gcMod==="duz"&&g.id===sec)})){$("grCE").textContent="Bu isimde bir granülcü zaten var.";return}
    b.disabled=true;
    try{
      if(gcMod==="duz"){var g=secili();await db.ref("granulcular/"+g.id+"/ad").set(a.slice(0,60));denetimYaz("granul-ad",a,"Eski ad: "+g.ad,"granulcular",g.id);toast("Ad değiştirildi")}
      else{var r=db.ref("granulcular").push();await r.set({ad:a.slice(0,60),zaman:TS()});sec=r.key;try{localStorage.setItem("granSec",sec)}catch(e){}sinir=60;kayitDinle();toast("Granülcü eklendi")}
      $("dGrC").close();
    }catch(err){$("grCE").textContent=errText(err)}
    b.disabled=false;
  };
  $("grCSil").onclick=async function(){
    var g=secili();if(!g)return;
    if(!isAdmin()){toast("Granülcüyü yalnız yönetici silebilir.");return}
    try{
      var s=await db.ref("granulKayit").orderByChild("gid").equalTo(g.id).limitToFirst(1).once("value");
      if(s.exists()){alert("Bu granülcünün kayıtları var, silinemez.\nÖnce kayıtlarını silin (kayıtlar çöp kutusuna gider).");return}
      if(!confirm(g.ad+" granülcüsü silinsin mi?"))return;
      if(await silCop("granulcular",g.id,"Granülcü: "+g.ad)){sec="";toast("Granülcü silindi")}
    }catch(err){toast(errText(err))}
  };
  $("grChips").onclick=function(e){
    var b=e.target.closest("button[data-g]");if(!b||b.dataset.g===sec)return;
    sec=b.dataset.g;try{localStorage.setItem("granSec",sec)}catch(x){}
    sinir=60;ara="";$("grAra").value="";kayitDinle();
  };

  /* ---------- kayıt penceresi (işlem türüne göre) ---------- */
  var ALAN=[["giden","grGid"],["gelen","grGel"],["satis","grSat"],["fire","grFir"],["fiyat","grFiy"],["kdv","grKdv"],["odeme","grOde"]];
  var TIP={
    gonder:{b:"📤 Mal gönderdim",f:["giden"],ac:"Örn: 2 kamyon hurda gönderildi"},
    gel:{b:"📥 Granül geldi",f:["gelen","fiyat","kdv","fire"],ac:"Örn: renkli granül geldi"},
    odeme:{b:"💰 Ödeme yaptım",f:["odeme"],ac:"Örn: çek verildi, nakit ödeme"},
    satis:{b:"🛒 Satış yaptım",f:["satis","fiyat"],ac:"Örn: renkli hurda satışı"},
    fire:{b:"🔥 Fire yaz",f:["fire"],ac:"Örn: fire düzeltmesi"},
    hepsi:{b:"✏ Kaydı düzenle",f:["giden","gelen","satis","fire","fiyat","kdv","odeme"],ac:"Açıklama"}
  };
  function degerler(){var o={};ALAN.forEach(function(a){o[a[0]]=sayi($(a[1]).value)});return o}
  function onizle(){
    var o=degerler(),h=hesap(o),p=[];
    var kp=+$("grKp").value;
    if(kp>0&&h.top>0&&TIP[tip].f.indexOf("kdv")>=0){var kd=r2(h.top*kp/100);$("grKdv").value=String(kd).replace(".",",");o.kdv=kd}
    if(h.top)p.push("Toplam fiyat: <b>"+para(h.top)+"</b>"+(o.kdv?" + KDV <b>"+para(o.kdv)+"</b> = <b>"+para(h.top+o.kdv)+"</b>":""));
    if(h.sfy)p.push("Satış fiyat: <b>"+para(h.sfy)+"</b>");
    $("grOn").innerHTML=p.length?p.join("<br>"):"";
  }
  function ac(t,x){
    tip=t;mevcut=x||null;var T=TIP[t];
    $("grH").textContent=x?"✏ Kaydı düzenle":T.b+" — "+(secili()?secili().ad:"");
    $("grT").value=x?x.tarih:bugun();$("grSn").value=x?(x.sn||""):"";
    document.querySelectorAll("#dGr [data-f]").forEach(function(d){d.classList.toggle("hide",T.f.indexOf(d.dataset.f)<0)});
    ALAN.forEach(function(a){var v=x?+x[a[0]]:0;$(a[1]).value=v?String(v).replace(".",","):""});
    $("grKp").value="";
    $("grAc").value=x?(x.aciklama||""):"";$("grAc").placeholder=T.ac;$("grE").textContent="";onizle();
    $("dGr").showModal();
    setTimeout(function(){var f=T.f[0],a=ALAN.find(function(z){return z[0]===f});if(a&&!x)$(a[1]).focus()},60);
  }
  $("grB").onclick=function(e){var b=e.target.closest("button[data-t]");if(b&&secili())ac(b.dataset.t,null)};
  $("grX").onclick=function(){$("dGr").close()};
  ALAN.forEach(function(a){$(a[1]).oninput=function(){if(a[0]==="kdv")$("grKp").value="";onizle()}});
  $("grKp").onchange=onizle;
  $("grOk").onclick=async function(){
    var b=this,g=secili();if(!g)return;
    var t=$("grT").value;if(!/^\d{4}-\d{2}-\d{2}$/.test(t)){$("grE").textContent="Tarih seçin.";return}
    var o=degerler(),ac2=$("grAc").value.trim(),sn=$("grSn").value.trim();
    var gorunen=TIP[tip].f;
    ALAN.forEach(function(a){if(gorunen.indexOf(a[0])<0)o[a[0]]=0}); /* görünmeyen alan kaydedilmez */
    if(mevcut)ALAN.forEach(function(a){if(gorunen.indexOf(a[0])<0)o[a[0]]=+mevcut[a[0]]||0});
    var bosMu=!ALAN.some(function(a){return o[a[0]]!==0})&&!ac2;
    if(bosMu){$("grE").textContent="Kilo veya tutar girin.";return}
    b.disabled=true;
    try{
      if(mevcut){
        var p="granulKayit/"+mevcut.id+"/",u={},fark=[];
        u[p+"tarih"]=t;u[p+"sn"]=sn?sn.slice(0,20):null;u[p+"aciklama"]=ac2?ac2.slice(0,200):null;
        ALAN.forEach(function(a){u[p+a[0]]=o[a[0]]!==0?o[a[0]]:null;if((+mevcut[a[0]]||0)!==o[a[0]])fark.push(a[0]+" "+fmt(mevcut[a[0]])+"→"+fmt(o[a[0]]))});
        u[p+"duzenleyen"]=kim().slice(0,100);u[p+"duzenleyenUid"]=user.uid;u[p+"duzenlemeZaman"]=TS();
        await db.ref().update(u);
        denetimYaz("granul-duzenle",g.ad+" · "+tarihTR(mevcut.tarih),fark.join(", "),"granulKayit",mevcut.id);
        toast("✓ Kayıt düzeltildi");
      }else{
        var n={gid:g.id,tarih:t,ekleyen:kim().slice(0,100),ekleyenUid:user.uid,zaman:TS()};
        if(sn)n.sn=sn.slice(0,20);if(ac2)n.aciklama=ac2.slice(0,200);
        ALAN.forEach(function(a){if(o[a[0]]!==0)n[a[0]]=o[a[0]]});
        await db.ref("granulKayit").push(n);
        toast("✓ Kayıt eklendi");
      }
      $("dGr").close();
    }catch(err){$("grE").textContent=errText(err)}
    b.disabled=false;
  };
  function listeTikla(e){
    var b=e.target.closest("button[data-a]");if(!b)return;
    var x=K.find(function(y){return y.id===b.dataset.id});if(!x)return;
    (async function(){
      try{
        if(b.dataset.a==="duz")ac("hepsi",x);
        else if(b.dataset.a==="sil"){
          var g=secili();
          if(!confirm(tarihTR(x.tarih)+" tarihli kayıt silinsin mi?\n(Çöp kutusuna taşınır; yönetici geri yükleyebilir)"))return;
          if(await silCop("granulKayit",x.id,"♻️ "+(g?g.ad:"Granül")+" · "+tarihTR(x.tarih)+(x.giden?" · giden "+fmt(x.giden)+" kg":"")+(x.gelen?" · gelen "+fmt(x.gelen)+" kg":"")+(x.odeme?" · ödeme "+fmt(x.odeme)+" ₺":"")))toast("Kayıt çöp kutusuna taşındı");
        }
      }catch(err){toast(errText(err))}
    })();
  }
  $("grTb").onclick=listeTikla;$("grKart").onclick=listeTikla;
  $("grAra").oninput=function(){ara=this.value;sinir=60;liste()};
  $("grAy").onchange=function(){ay=this.value;sinir=60;liste()};
  $("grDaha").onclick=function(){sinir+=100;liste()};

  /* ---------- WhatsApp özeti ---------- */
  $("grWa").onclick=function(){
    var g=secili();if(!g)return;
    var t=topla(K),L=ayFiltre().sort(eskiYeni);
    var son=ay?L:L.slice(-8);
    var m="♻️ *GRANÜL — "+g.ad+"*\n"+tarihTR(bugun())+"\n\n"+
      "Granülcüde kalan mal: *"+kgf(t.kalan)+"*\n"+
      bakiyeYazi(t.bakiye)+": *"+para(Math.abs(t.bakiye))+"*\n\n"+
      "Toplam: gönderilen "+kgf(t.giden)+", gelen "+kgf(t.gelen)+", fire "+kgf(t.fire)+", ödeme "+para(t.odeme)+"\n";
    if(ay){var ta=topla(L);m+="\n*"+ayAd(ay)+" toplamı:* gönderilen "+kgf(ta.giden)+", gelen "+kgf(ta.gelen)+", fire "+kgf(ta.fire)+", ödeme "+para(ta.odeme)+"\n"}
    if(son.length){
      m+="\n*"+(ay?ayAd(ay)+" hareketleri":"Son hareketler")+":*\n";
      son.forEach(function(x){
        var h=hesap(x),p=[];
        if(+x.giden>0)p.push("gönderilen "+kgf(x.giden));
        if(+x.gelen>0)p.push("gelen "+kgf(x.gelen)+(+x.fiyat>0?" × "+fmt(x.fiyat)+" = "+para(h.top):""));
        if(+x.satis>0)p.push("satış "+kgf(x.satis)+(+x.fiyat>0?" = "+para(h.sfy):""));
        if(+x.fire>0)p.push("fire "+kgf(x.fire));
        if(+x.kdv)p.push("KDV "+para(x.kdv));
        if(+x.odeme)p.push("ödeme "+para(x.odeme));
        m+="• "+tarihTR(x.tarih)+(x.sn?" (fiş "+x.sn+")":"")+": "+(p.join(", ")||"—")+(x.aciklama?" — "+x.aciklama:"")+"\n";
      });
    }
    window.open("https://wa.me/?text="+encodeURIComponent(m.trim()),"_blank");
  };

  /* ---------- Excel'e aktar ---------- */
  $("grXlsx").onclick=async function(){
    var g=secili();if(!g)return;
    var b=this;b.disabled=true;
    try{
      await xlsxHazir();
      var L=K.slice().sort(eskiYeni);
      var t=topla(L);
      var A=[
        ["TOPLAM","",t.giden,t.gelen,t.satis,t.fire,"",t.top,t.kdv,t.sfy,t.odeme,t.kalan,t.bakiye],
        [g.ad.toLocaleUpperCase("tr-TR")+" GRANÜL TAKİP","","","","","","","","","","","^ KALAN KG ^","BAKİYE"],
        ["TARİH","FİŞ NO","GİDEN KİLO","GELEN KİLO","SATIŞ","FİRE","FİYAT","TOPLAM FİYAT","KDV","SATIŞ FİYAT","ÖDEME","AÇIKLAMA"]
      ];
      L.forEach(function(x){var h=hesap(x);
        A.push([tarihTR(x.tarih),x.sn||"",+x.giden||"",+x.gelen||"",+x.satis||"",+x.fire||"",+x.fiyat||"",h.top,+x.kdv||"",h.sfy,+x.odeme||"",x.aciklama||""])});
      var ws=XLSX.utils.aoa_to_sheet(A);
      ws["!cols"]=[{wch:12},{wch:8},{wch:12},{wch:12},{wch:10},{wch:10},{wch:8},{wch:14},{wch:10},{wch:12},{wch:12},{wch:28},{wch:12}];
      var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,g.ad.replace(/[\\\/\?\*\[\]:]/g," ").slice(0,31)||"Granül");
      XLSX.writeFile(wb,"granul-"+trn(g.ad).replace(/[^a-z0-9]+/g,"-")+"_"+bugun()+".xlsx");
    }catch(err){toast(errText(err))}
    b.disabled=false;
  };

  /* ---------- Excel'den al (mevcut Excel tablosunu içeri aktarma) ---------- */
  function tarihCoz(v){
    if(v==null||v==="")return "";
    if(typeof v==="number"&&v>20000&&v<80000){var d=new Date(Math.round((v-25569)*864e5));return d.getUTCFullYear()+"-"+("0"+(d.getUTCMonth()+1)).slice(-2)+"-"+("0"+d.getUTCDate()).slice(-2)}
    var s=String(v).trim(),m=/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/.exec(s);
    if(m)return m[3]+"-"+("0"+m[2]).slice(-2)+"-"+("0"+m[1]).slice(-2);
    m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s);return m?m[1]+"-"+m[2]+"-"+m[3]:"";
  }
  var oku=function(v){return typeof v==="number"?r2(v):sayi(v)};
  function excelCoz(rows){
    var hs=-1,kol={},bas=function(s){return trn(s).replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim()};
    for(var i=0;i<Math.min(rows.length,40)&&hs<0;i++){
      var r=rows[i]||[];
      for(var j=0;j<r.length;j++){if(bas(r[j])==="tarih"){hs=i;break}}
    }
    if(hs<0)return {hata:"«TARİH» başlığı bulunamadı. Excel dosyasında TARİH, GİDEN KİLO, GELEN KİLO... başlıklı satır olmalı."};
    var H=rows[hs],ad2={"tarih":"tarih","s n":"sn","fis no":"sn","fis":"sn","giden kilo":"giden","gelen kilo":"gelen","satis":"satis","fire":"fire","fiyat":"fiyat","toplam fiyat":"top","kdv":"kdv","satis fiyat":"sfy","odeme":"odeme","aciklama":"aciklama"};
    H.forEach(function(h,j){var k=ad2[bas(h)];if(k&&kol[k]==null)kol[k]=j});
    if(kol.giden==null&&kol.gelen==null)return {hata:"GİDEN KİLO / GELEN KİLO sütunları bulunamadı."};
    var out=[],atla=0;
    for(var i2=hs+1;i2<rows.length;i2++){
      var r2_=rows[i2]||[],g=function(k){return kol[k]==null?undefined:r2_[kol[k]]};
      var t=tarihCoz(g("tarih"));
      var o={giden:oku(g("giden")),gelen:oku(g("gelen")),satis:oku(g("satis")),fire:oku(g("fire")),fiyat:oku(g("fiyat")),kdv:oku(g("kdv")),odeme:oku(g("odeme"))};
      var top=oku(g("top")),ac3=String(g("aciklama")==null?"":g("aciklama")).trim();
      if(!o.fiyat&&o.gelen>0&&top>0)o.fiyat=r2(top/o.gelen); /* fiyat sütunu boş ama toplam fiyat varsa fiyatı geri hesapla */
      var bosS=!Object.keys(o).some(function(k){return o[k]!==0})&&!ac3;
      if(bosS)continue;
      if(!t){atla++;continue}
      o.tarih=t;o.sn=String(g("sn")==null?"":g("sn")).trim().slice(0,20);o.aciklama=ac3.slice(0,200);
      out.push(o);
    }
    return {satirlar:out,atla:atla};
  }
  $("grIce").onclick=function(){if(secili())$("grDosya").click()};
  $("grDosya").onchange=async function(){
    var f=this.files&&this.files[0];this.value="";if(!f)return;
    var g=secili();if(!g)return;
    try{
      toast("Excel okunuyor…");await xlsxHazir();
      var wb=XLSX.read(await f.arrayBuffer(),{type:"array"});
      var ws=wb.Sheets[wb.SheetNames[0]];
      var rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:""});
      var c=excelCoz(rows);if(c.hata){alert(c.hata);return}
      var anahtar=function(x){return [x.tarih,+x.giden||0,+x.gelen||0,+x.satis||0,+x.fire||0,+x.fiyat||0,+x.kdv||0,+x.odeme||0,(x.aciklama||"").trim()].join("|")};
      var var_=new Set(K.map(anahtar)),yeni=c.satirlar.filter(function(x){return !var_.has(anahtar(x))});
      var ayni=c.satirlar.length-yeni.length;
      if(!yeni.length){alert("Alınacak yeni satır yok"+(ayni?" ("+ayni+" satır zaten kayıtlı).":"."));return}
      var tt=topla(yeni);
      if(!confirm(g.ad+" defterine "+yeni.length+" satır eklenecek"+(ayni?" ("+ayni+" satır zaten kayıtlı, atlanacak)":"")+(c.atla?" ("+c.atla+" satır tarihsiz, atlanacak)":"")+".\n\nGiden: "+fmt(tt.giden)+" kg · Gelen: "+fmt(tt.gelen)+" kg · Fire: "+fmt(tt.fire)+" kg\nToplam fiyat: "+fmt(tt.top)+" ₺ · KDV: "+fmt(tt.kdv)+" ₺ · Ödeme: "+fmt(tt.odeme)+" ₺\n\nDevam edilsin mi?"))return;
      var kimlik=kim().slice(0,100),say=0;
      for(var i=0;i<yeni.length;i+=200){
        var u={};
        yeni.slice(i,i+200).forEach(function(x){
          var k=db.ref("granulKayit").push().key,n={gid:g.id,tarih:x.tarih,ekleyen:kimlik,ekleyenUid:user.uid,zaman:TS()};
          if(x.sn)n.sn=x.sn;if(x.aciklama)n.aciklama=x.aciklama;
          ["giden","gelen","satis","fire","fiyat","kdv","odeme"].forEach(function(a){if(x[a]!==0)n[a]=x[a]});
          u["granulKayit/"+k]=n;say++;
        });
        await db.ref().update(u);
      }
      denetimYaz("granul-aktar",g.ad,say+" satır Excel'den alındı","granulKayit","");
      toast("✓ "+say+" satır alındı");
    }catch(err){alert("Excel alınamadı: "+(err&&err.message?err.message:errText(err)))}
  };
  window.granTest={sayi:sayi,hesap:hesap,topla:topla,kosu:kosu,excelCoz:excelCoz,tarihCoz:tarihCoz}; /* sadece geliştirici sınaması için */
})();
