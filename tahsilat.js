/* ===================== TAHSİLAT =====================
   WhatsApp "MAG TAHSİLAT" grubunun yerine geçer.
   Ofis: "X'ten ödeme/çek hazır, alınacak" diye TALEP açar (bekliyor).
   Sahadaki kişi: gidip alınca "Tahsil ettim" der; nakit + çek tutarı, makbuz no, makbuz/çek fotoğrafı girer (alindi).
   Sahadaki kişi talep olmadan da doğrudan "alındı" kaydı açabilir (grupta "Doku ambalaj 50.000 nakit alındı" yazmak gibi).
   Veri yolu: tahsilatlar/{id}  (app.js'teki db, user, rec, isAdmin, tahGor, $, esc, fmt, trn, toast, errText, sikistir, fotoHazirla, silCop ortak kullanılır)
   v47: fotoğraflar küçük önizleme + fotoTam (Sevkiyat gibi) · silme çöp kutusuna + denetim · ✏ Düzenle · saatler sunucudan · Muhasebe ("tah" izni) */
(function(){
  var ref=null,offRef=null,off=0,yuk=false,L=[],FM=6,TF=[],mod="talep",mevcut=null,sek="bek",don="bugun",ara="";
  var TS=function(){return firebase.database.ServerValue.TIMESTAMP}; /* kayıt saati: sunucu saati */
  var simdi=function(){return Date.now()+off}; /* "bugün / son 7 gün" hesabı da sunucu saatine göre */
  var TRZ="Europe/Istanbul";
  var canTah=function(){return !!(rec&&rec.onay&&tahGor())}; /* sevkiyat yetkisi olan VEYA "tah" izni olan (Muhasebe) görür; rules.json ile aynı */
  var benimMi=function(x){return !!(user&&x.talepUid===user.uid)};
  var silebilir=function(x){return isAdmin()||benimMi(x)};
  var geriAlabilir=function(x){return isAdmin()||(user&&x.alanUid===user.uid)};
  var duzenleyebilir=geriAlabilir; /* tutarı yalnız tahsil eden veya yönetici düzeltir (rules.json de aynısını zorlar) */
  var zm=function(t){return t?new Date(+t).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",timeZone:TRZ}):""};
  var gunAnahtar=function(t){return new Date(+t).toLocaleDateString("en-CA",{timeZone:TRZ})}; /* 2026-10-14 */
  var para=function(n){return fmt(n)+" ₺"};
  /* "110.059" -> 110059 ; "11.500,50" -> 11500.5 ; "50000" -> 50000 */
  function sayi(s){
    s=String(s||"").replace(/[^\d.,]/g,"");if(!s)return 0;
    if(s.indexOf(",")>=0){s=s.replace(/\./g,"").replace(",",".")}
    else if(/^\d{1,3}(\.\d{3})+$/.test(s)){s=s.replace(/\./g,"")}
    var n=parseFloat(s);return isFinite(n)&&n>0?Math.round(n*100)/100:0;
  }
  var tutar=function(x){return (+x.nakit||0)+(+x.cek||0)};
  var fl=function(x){var v=x.fotolar;return(Array.isArray(v)?v:Object.values(v||{})).filter(function(s){return typeof s==="string"&&s.indexOf("data:image/jpeg;base64,")===0})};
  function fotoHtml(x){var f=fl(x);return f.length?'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px">'+f.map(function(s,i){return '<div class="fth"><img src="'+s+'" alt="Foto '+(i+1)+'" data-z="'+i+'" data-id="'+esc(x.id)+'" style="height:80px"></div>'}).join("")+'</div>':""}

  /* ---------- liste ---------- */
  function donemSinir(){
    var sm=simdi(),bugun=gunAnahtar(sm);
    if(don==="bugun")return function(t){return gunAnahtar(t)===bugun};
    if(don==="7")return function(t){return sm-t<7*864e5};
    if(don==="ay"){var ay=bugun.slice(0,7);return function(t){return gunAnahtar(t).slice(0,7)===ay}}
    return function(){return true};
  }
  function kart(x){
    var bit=x.durum==="alindi",b="";
    if(!bit)b+='<button class="btn b3 sm" style="width:auto;margin:6px 6px 0 0" data-a="al" data-id="'+esc(x.id)+'">✓ Tahsil ettim</button>';
    if(bit&&duzenleyebilir(x))b+='<button class="btn b7 sm" style="width:auto;margin:6px 6px 0 0" data-a="duzenle" data-id="'+esc(x.id)+'">✏ Düzenle</button>';
    if(bit&&geriAlabilir(x))b+='<button class="btn b6 sm" style="width:auto;margin:6px 6px 0 0" data-a="geri" data-id="'+esc(x.id)+'">↩ Geri al</button>';
    if(silebilir(x))b+='<button class="btn b5 sm" style="width:auto;margin:6px 0 0" data-a="sil" data-id="'+esc(x.id)+'">🗑 Sil</button>';
    var tut="";
    if(bit){
      var p=[];if(+x.nakit>0)p.push('💵 Nakit <b>'+para(x.nakit)+'</b>');if(+x.cek>0)p.push('🧾 Çek <b>'+para(x.cek)+'</b>');
      tut='<div style="font-size:16px;margin-top:3px">'+(p.join(" &nbsp;·&nbsp; ")||"—")+(p.length>1?' &nbsp;=&nbsp; <b>'+para(tutar(x))+'</b>':"")+'</div>'+
        (x.makbuzNo?'<div class="sub">Makbuz no: <b>'+esc(x.makbuzNo)+'</b></div>':"");
    }
    return '<div class="item c" style="border-left-color:'+(bit?"#16a34a":"#f59e0b")+'">'+
      '<b style="font-size:17px">'+(bit?"✓ ":"⏳ ")+esc(x.cari)+'</b>'+
      (x.not?'<div style="white-space:pre-wrap;font-size:15px;color:#334155;margin-top:2px">'+esc(x.not)+'</div>':"")+
      '<div class="sub">'+(x.talepTur==="dogrudan"?"kayıt":"talep")+': '+esc(x.talepEden||"-")+' · '+esc(zm(x.zaman))+'</div>'+tut+
      (bit?'<div class="sub" style="color:#16a34a;font-weight:700">Tahsil eden: '+esc(x.alan||"-")+' · '+esc(zm(x.alinmaZaman))+'</div>'+(x.alanNot?'<div class="sub" style="white-space:pre-wrap;color:#334155">'+esc(x.alanNot)+'</div>':"")+(x.duzenlemeZaman?'<div class="sub" style="color:#b45309;font-weight:700">✎ Düzeltildi: '+esc(x.duzenleyen||"-")+' · '+esc(zm(x.duzenlemeZaman))+(x.duzenlemeNot?' — '+esc(x.duzenlemeNot):"")+'</div>':""):"")+
      fotoHtml(x)+(b?'<div>'+b+'</div>':"")+'</div>';
  }
  function ciz(){
    var k=$("tahList");if(!k)return;
    var q=trn(ara).trim().split(/\s+/).filter(Boolean);
    var V=L.filter(function(x){var h=trn([x.cari,x.not,x.makbuzNo,x.talepEden,x.alan,x.alanNot].join(" "));return q.every(function(t){return h.indexOf(t)>=0})});
    var bek=V.filter(function(x){return x.durum!=="alindi"}).sort(function(a,b){return a.zaman-b.zaman});
    var uyar=donemSinir();
    var bit=V.filter(function(x){return x.durum==="alindi"&&uyar(x.alinmaZaman||x.zaman)}).sort(function(a,b){return (b.alinmaZaman||b.zaman)-(a.alinmaZaman||a.zaman)});
    $("tahTB").textContent="⏳ BEKLEYENLER"+(L.filter(function(x){return x.durum!=="alindi"}).length?" ("+L.filter(function(x){return x.durum!=="alindi"}).length+")":"");
    $("tahTA").textContent="✓ ALINANLAR";
    var bn=L.filter(function(x){return x.durum!=="alindi"}).length;$("vtH").textContent="💰 TAHSİLAT"+(bn?" ("+bn+")":"");
    $("tahTB").classList.toggle("on",sek==="bek");$("tahTA").classList.toggle("on",sek==="alin");
    $("tahDonW").classList.toggle("hide",sek!=="alin");
    if(sek==="bek"){
      $("tahOz").classList.add("hide");
      $("tahList").innerHTML=bek.length?bek.map(kart).join(""):'<div class="sub" style="padding:10px 0;text-align:center">Bekleyen tahsilat yok.</div>';
    }else{
      var n=0,c=0;bit.forEach(function(x){n+=+x.nakit||0;c+=+x.cek||0});
      var oz=$("tahOz");oz.classList.remove("hide");
      oz.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:6px 16px;font-size:16px"><span>💵 Nakit: <b>'+para(n)+'</b></span><span>🧾 Çek: <b>'+para(c)+'</b></span><span>Toplam: <b>'+para(n+c)+'</b></span><span class="mut">'+bit.length+' kayıt</span></div>';
      $("tahList").innerHTML=bit.length?bit.map(kart).join(""):'<div class="sub" style="padding:10px 0;text-align:center">Bu dönemde alınan tahsilat yok.</div>';
    }
  }
  window.tahBaslat=function(){
    window.tahDurdur();
    if(!canTah())return;
    offRef=db.ref(".info/serverTimeOffset");offRef.on("value",function(s){off=+s.val()||0});
    ref=db.ref("tahsilatlar").orderByChild("zaman").limitToLast(300);
    ref.on("value",function(s){var v=s.val()||{};L=Object.keys(v).map(function(k){return Object.assign({id:k},v[k])});yuk=true;ciz();if(window.panoYenile)window.panoYenile()},
      function(e){toast("Tahsilat okunamadı: "+errText(e)+" (Firebase kuralını güncellediniz mi?)")});
  };
  /* yönetici panosu (pano.js): bekleyen tahsilatlar; veri henüz gelmediyse null */
  window.tahOzet=function(){return(canTah()&&yuk)?L.filter(function(x){return x.durum!=="alindi"}).sort(function(a,b){return a.zaman-b.zaman}):null};
  window.tahDurdur=function(){if(ref){ref.off();ref=null}if(offRef){offRef.off();offRef=null}L=[];yuk=false;if($("tahList"))$("tahList").innerHTML="";if($("vtH"))$("vtH").textContent="💰 TAHSİLAT"};

  $("tahTB").onclick=function(){sek="bek";ciz()};
  $("tahTA").onclick=function(){sek="alin";ciz()};
  $("tahDon").onchange=function(){don=this.value;ciz()};
  $("tahAra").oninput=function(){ara=this.value;ciz()};

  $("tahList").onclick=async function(e){
    var im=e.target.closest("img[data-z]");
    if(im){var t=L.find(function(y){return y.id===im.dataset.id});if(t&&window.fvAc)window.fvAc(fl(t)[+im.dataset.z]);return}
    var b=e.target.closest("button[data-a]");if(!b)return;
    var id=b.dataset.id,x=L.find(function(y){return y.id===id});if(!x)return;
    try{
      if(b.dataset.a==="al"){ac("al",x)}
      else if(b.dataset.a==="duzenle"){ac("duzenle",x)}
      else if(b.dataset.a==="geri"){
        if(!confirm("Tahsilat tekrar 'bekliyor' durumuna alınsın mı? (Girilen tutar ve fotoğraflar kayıttan kalkar; eski hali çöp kutusuna ve denetim günlüğüne yazılır, yönetici geri yükleyebilir)"))return;
        /* eski hali (tutar + fotoğraf dahil) çöp kutusuna: yönetici "Geri yükle" ile alınmış haline döndürebilir */
        var raw=JSON.parse(JSON.stringify(x));delete raw.id;
        var ck=db.ref("cop").push().key,kim=ad(),g={},p="tahsilatlar/"+id+"/";
        g["cop/"+ck]={yol:"tahsilatlar",id:id,tur:"tahsilatlar",baslik:("↩ Geri alındı: "+x.cari+" · "+para(tutar(x))).slice(0,120),veri:raw,kim:kim.slice(0,100),uid:user.uid,zaman:TS()};
        g["denetim/"+db.ref("denetim").push().key]={tur:"tahsilat-geri",baslik:String(x.cari).slice(0,120),detay:oz(x).slice(0,200),yol:"tahsilatlar",id:id.slice(0,100),kim:kim.slice(0,100),uid:user.uid,zaman:TS()};
        ["nakit","cek","makbuzNo","alan","alanUid","alinmaZaman","alanNot","fotolar","duzenleyen","duzenleyenUid","duzenlemeZaman","duzenlemeNot"].forEach(function(f){g[p+f]=null});
        g[p+"durum"]="bekliyor";
        await db.ref().update(g);toast("Tekrar bekliyor durumuna alındı");
      }else if(b.dataset.a==="sil"&&confirm("Bu tahsilat kaydı silinsin mi?\n(Çöp kutusuna taşınır ve denetim günlüğüne yazılır; yönetici geri yükleyebilir)")){
        var bs=(x.durum==="alindi"?"💰 ":"⏳ ")+x.cari+(x.durum==="alindi"?" · "+para(tutar(x)):"");
        if(await silCop("tahsilatlar",id,bs))toast("Kayıt çöp kutusuna taşındı");
      }
    }catch(err){toast(errText(err))}
  };
  /* "Nakit 1.000 · Çek 500 · Makbuz 123" gibi kısa özet (denetim günlüğü için) */
  function oz(x){var p=[];if(+x.nakit>0)p.push("Nakit "+para(x.nakit));if(+x.cek>0)p.push("Çek "+para(x.cek));if(x.makbuzNo)p.push("Makbuz "+x.makbuzNo);return p.join(" · ")||"-"}

  /* ---------- pencere (talep / tahsil ettim) ---------- */
  function fCiz(){
    $("tahFG").innerHTML=TF.map(function(s,i){return '<div class="fth"><img src="'+s+'" alt="Foto '+(i+1)+'" data-z="'+i+'"><button type="button" class="fx" data-x="'+i+'" aria-label="Kaldır">✖</button></div>'}).join("");
    $("tahFS").textContent=TF.length?TF.length+"/"+FM+" fotoğraf":"";
  }
  $("tahFG").onclick=function(e){
    var x=e.target.closest("[data-x]");if(x){TF.splice(+x.dataset.x,1);fCiz();return}
    var z=e.target.closest("[data-z]");if(z&&window.fvAc)window.fvAc(TF[+z.dataset.z])};
  function fEkle(files){
    Array.prototype.forEach.call(files,function(f){
      var r=new FileReader();
      r.onload=function(){sikistir(r.result,function(d){
        if(TF.length>=FM){toast("En fazla "+FM+" fotoğraf eklenebilir.");return}
        TF.push(d);fCiz()},900)};
      r.readAsDataURL(f)})}
  $("tahGal").onchange=function(e){fEkle(e.target.files);e.target.value=""};
  $("tahCam").onchange=function(e){fEkle(e.target.files);e.target.value=""};

  /* cari adı önerileri: önceki kayıtlar + kayıtlı sevk adresleri */
  function cariListe(){
    var s={},o=[];
    L.forEach(function(x){if(x.cari&&!s[trn(x.cari)]){s[trn(x.cari)]=1;o.push(x.cari)}});
    (window.sAdr||[]).forEach(function(a){if(a.ad&&!s[trn(a.ad)]){s[trn(a.ad)]=1;o.push(a.ad)}});
    return o.sort(function(a,b){return a.localeCompare(b,"tr")});
  }
  function ac(m,x){
    mod=m;mevcut=x||null;TF=[];fCiz();
    $("tahE").textContent="";
    $("tahCari").value=x?x.cari:"";$("tahCari").readOnly=!!x;
    $("tahDl").innerHTML=x?"":cariListe().map(function(c){return '<option value="'+esc(c)+'">'}).join("");
    $("tahNot").value=m==="talep"?(x&&x.not||""):"";
    $("tahNot").placeholder=m==="talep"?"Örn: Çek hazır, sevkiyat uygunluğuna göre alalım · Kaşe imzalı ekstre ile gidilsin":"Not (isteğe bağlı)";
    $("tahNakit").value="";$("tahCek").value="";$("tahMak").value="";
    $("tahAlW").classList.toggle("hide",m==="talep");
    $("tahFW").classList.toggle("hide",m==="duzenle"); /* düzenlemede fotoğraf alanı yok: tutar, makbuz no ve not düzeltilir */
    $("tahH").textContent=m==="talep"?"💰 Yeni Tahsilat Talebi":m==="duzenle"?"✏ Tahsilatı düzenle":(x?"✓ Tahsil ettim":"✓ Tahsilat kaydı");
    $("tahOk").textContent=m==="talep"?"✓ Talep aç":m==="duzenle"?"✓ Değişikliği kaydet":"✓ Kaydet";
    if(m==="duzenle"&&x){
      var gir=function(n){return +n>0?String(n).replace(".",","):""};
      $("tahNakit").value=gir(x.nakit);$("tahCek").value=gir(x.cek);$("tahMak").value=x.makbuzNo||"";$("tahNot").value=x.alanNot||"";
      $("tahNot").placeholder="Not (isteğe bağlı)";
    }
    if(m==="al"&&x&&x.not){$("tahOn").classList.remove("hide");$("tahOn").textContent="Talep notu: "+x.not}else $("tahOn").classList.add("hide");
    $("dTah").showModal();(x?$("tahNakit"):$("tahCari")).focus();
  }
  $("tahYeni").onclick=function(){ac("talep",null)};
  $("tahDog").onclick=function(){ac("al",null)};
  $("tahX").onclick=function(){$("dTah").close()};
  $("tahOk").onclick=async function(){
    var cari=$("tahCari").value.trim().replace(/\s+/g," ");
    if(!cari){$("tahE").textContent="Firma / kişi adını yazın.";return}
    var b=$("tahOk");b.disabled=true;
    try{
      var ad=String((rec&&rec.ad)||"?").slice(0,100);
      if(mod==="talep"){
        var o={cari:cari.slice(0,100),talepUid:user.uid,talepEden:ad,zaman:TS(),durum:"bekliyor",talepTur:"talep"};
        var nt=$("tahNot").value.trim();if(nt)o.not=nt.slice(0,300);
        await db.ref("tahsilatlar").push(o);
        $("dTah").close();toast("✓ Tahsilat talebi açıldı");
      }else{
        var n=sayi($("tahNakit").value),c=sayi($("tahCek").value),mk=$("tahMak").value.trim();
        if(!(n>0)&&!(c>0)){$("tahE").textContent="Nakit veya çek tutarından en az birini yazın.";b.disabled=false;return}
        if(n>1e10||c>1e10){$("tahE").textContent="Tutar çok büyük, kontrol edin.";b.disabled=false;return}
        var an=$("tahNot").value.trim(),u={};
        if(mod==="duzenle"&&mevcut){
          /* tutar düzeltme: eski/yeni değer kayıtta ve denetim günlüğünde kalır */
          var p0="tahsilatlar/"+mevcut.id+"/",E=mevcut,fk=[];
          var fr=function(et,e,y){if((+e||0)!==(+y||0))fk.push(et+" "+((+e>0)?para(e):"—")+" → "+((+y>0)?para(y):"—"))};
          fr("Nakit",E.nakit,n);fr("Çek",E.cek,c);
          if((E.makbuzNo||"")!==mk)fk.push("Makbuz "+(E.makbuzNo||"—")+" → "+(mk||"—"));
          if((E.alanNot||"")!==an)fk.push("Not değişti");
          if(!fk.length){$("tahE").textContent="Değişiklik yapmadınız.";b.disabled=false;return}
          var dz=fk.join(" · ").slice(0,200),ts=TS();
          u[p0+"nakit"]=n>0?n:null;u[p0+"cek"]=c>0?c:null;u[p0+"makbuzNo"]=mk?mk.slice(0,30):null;u[p0+"alanNot"]=an?an.slice(0,300):null;
          u[p0+"duzenleyen"]=ad;u[p0+"duzenleyenUid"]=user.uid;u[p0+"duzenlemeZaman"]=ts;u[p0+"duzenlemeNot"]=dz;
          u["denetim/"+db.ref("denetim").push().key]={tur:"tahsilat-duzenle",baslik:String(E.cari).slice(0,120),detay:dz,yol:"tahsilatlar",id:String(E.id).slice(0,100),kim:ad,uid:user.uid,zaman:ts};
          await db.ref().update(u);
          $("dTah").close();toast("✓ Tahsilat düzeltildi");return;
        }
        /* fotoğraflar: liste için küçük önizleme kayıtta, tam boy fotoğraf fotoTam'da (Sevkiyat ile aynı) */
        var fh=TF.length?await fotoHazirla(TF.slice(0,FM)):[];
        if(mevcut){
          var p="tahsilatlar/"+mevcut.id+"/";
          u[p+"durum"]="alindi";u[p+"nakit"]=n>0?n:null;u[p+"cek"]=c>0?c:null;u[p+"makbuzNo"]=mk?mk.slice(0,30):null;
          u[p+"alan"]=ad;u[p+"alanUid"]=user.uid;u[p+"alinmaZaman"]=TS();u[p+"alanNot"]=an?an.slice(0,300):null;
          fh.forEach(function(f,i){u[p+"fotolar/"+i]=f});
          await db.ref().update(u);
        }else{
          var o2={cari:cari.slice(0,100),talepUid:user.uid,talepEden:ad,zaman:TS(),durum:"alindi",talepTur:"dogrudan",
            alan:ad,alanUid:user.uid,alinmaZaman:TS()};
          if(n>0)o2.nakit=n;if(c>0)o2.cek=c;if(mk)o2.makbuzNo=mk.slice(0,30);if(an)o2.alanNot=an.slice(0,300);
          if(fh.length)o2.fotolar=fh;
          await db.ref("tahsilatlar").push(o2);
        }
        $("dTah").close();toast("✓ Tahsilat kaydedildi");sek="alin";don="bugun";$("tahDon").value="bugun";ciz();
      }
    }catch(err){$("tahE").textContent=errText(err)}
    b.disabled=false;
  };
})();
