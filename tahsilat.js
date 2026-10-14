/* ===================== TAHSİLAT =====================
   WhatsApp "MAG TAHSİLAT" grubunun yerine geçer.
   Ofis: "X'ten ödeme/çek hazır, alınacak" diye TALEP açar (bekliyor).
   Sahadaki kişi: gidip alınca "Tahsil ettim" der; nakit + çek tutarı, makbuz no, makbuz/çek fotoğrafı girer (alindi).
   Sahadaki kişi talep olmadan da doğrudan "alındı" kaydı açabilir (grupta "Doku ambalaj 50.000 nakit alındı" yazmak gibi).
   Veri yolu: tahsilatlar/{id}  (app.js'teki db, user, rec, isAdmin, modGor, $, esc, fmt, trn, toast, errText, sikistir ortak kullanılır) */
(function(){
  var ref=null,L=[],FM=6,TF=[],mod="talep",mevcut=null,sek="bek",don="bugun",ara="";
  var TRZ="Europe/Istanbul";
  var canTah=function(){return !!(rec&&rec.onay&&modGor("sevk"))}; /* Tahsilat, Sevkiyat bölümünün bir sekmesidir: sevkiyat yetkisi olan görür */
  var benimMi=function(x){return !!(user&&x.talepUid===user.uid)};
  var silebilir=function(x){return isAdmin()||benimMi(x)};
  var geriAlabilir=function(x){return isAdmin()||(user&&x.alanUid===user.uid)};
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
    var simdi=Date.now(),bugun=gunAnahtar(simdi);
    if(don==="bugun")return function(t){return gunAnahtar(t)===bugun};
    if(don==="7")return function(t){return simdi-t<7*864e5};
    if(don==="ay"){var ay=bugun.slice(0,7);return function(t){return gunAnahtar(t).slice(0,7)===ay}}
    return function(){return true};
  }
  function kart(x){
    var bit=x.durum==="alindi",b="";
    if(!bit)b+='<button class="btn b3 sm" style="width:auto;margin:6px 6px 0 0" data-a="al" data-id="'+esc(x.id)+'">✓ Tahsil ettim</button>';
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
      (bit?'<div class="sub" style="color:#16a34a;font-weight:700">Tahsil eden: '+esc(x.alan||"-")+' · '+esc(zm(x.alinmaZaman))+'</div>'+(x.alanNot?'<div class="sub" style="white-space:pre-wrap;color:#334155">'+esc(x.alanNot)+'</div>':""):"")+
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
    ref=db.ref("tahsilatlar").orderByChild("zaman").limitToLast(300);
    ref.on("value",function(s){var v=s.val()||{};L=Object.keys(v).map(function(k){return Object.assign({id:k},v[k])});ciz()},
      function(e){toast("Tahsilat okunamadı: "+errText(e)+" (Firebase kuralını güncellediniz mi?)")});
  };
  window.tahDurdur=function(){if(ref){ref.off();ref=null}L=[];if($("tahList"))$("tahList").innerHTML="";if($("vtH"))$("vtH").textContent="💰 TAHSİLAT"};

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
      else if(b.dataset.a==="geri"){
        if(!confirm("Tahsilat tekrar 'bekliyor' durumuna alınsın mı? (Girilen tutar ve fotoğraflar silinir)"))return;
        var g={},p="tahsilatlar/"+id+"/";
        ["nakit","cek","makbuzNo","alan","alanUid","alinmaZaman","alanNot","fotolar"].forEach(function(f){g[p+f]=null});
        g[p+"durum"]="bekliyor";
        await db.ref().update(g);toast("Tekrar bekliyor durumuna alındı");
      }else if(b.dataset.a==="sil"&&confirm("Bu tahsilat kaydı silinsin mi?")){
        await db.ref("tahsilatlar/"+id).remove();toast("Kayıt silindi");
      }
    }catch(err){toast(errText(err))}
  };

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
    $("tahNot").value=m==="al"?"":(x&&x.not||"");
    $("tahNot").placeholder=m==="talep"?"Örn: Çek hazır, sevkiyat uygunluğuna göre alalım · Kaşe imzalı ekstre ile gidilsin":"Not (isteğe bağlı)";
    $("tahNakit").value="";$("tahCek").value="";$("tahMak").value="";
    $("tahAlW").classList.toggle("hide",m!=="al");
    $("tahH").textContent=m==="talep"?"💰 Yeni Tahsilat Talebi":(x?"✓ Tahsil ettim":"✓ Tahsilat kaydı");
    $("tahOk").textContent=m==="talep"?"✓ Talep aç":"✓ Kaydet";
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
      var simdi=Date.now(),ad=String((rec&&rec.ad)||"?").slice(0,100);
      if(mod==="talep"){
        var o={cari:cari.slice(0,100),talepUid:user.uid,talepEden:ad,zaman:simdi,durum:"bekliyor",talepTur:"talep"};
        var nt=$("tahNot").value.trim();if(nt)o.not=nt.slice(0,300);
        await db.ref("tahsilatlar").push(o);
        $("dTah").close();toast("✓ Tahsilat talebi açıldı");
      }else{
        var n=sayi($("tahNakit").value),c=sayi($("tahCek").value),mk=$("tahMak").value.trim();
        if(!(n>0)&&!(c>0)){$("tahE").textContent="Nakit veya çek tutarından en az birini yazın.";b.disabled=false;return}
        if(n>1e10||c>1e10){$("tahE").textContent="Tutar çok büyük, kontrol edin.";b.disabled=false;return}
        var an=$("tahNot").value.trim(),u={};
        if(mevcut){
          var p="tahsilatlar/"+mevcut.id+"/";
          u[p+"durum"]="alindi";u[p+"nakit"]=n>0?n:null;u[p+"cek"]=c>0?c:null;u[p+"makbuzNo"]=mk?mk.slice(0,30):null;
          u[p+"alan"]=ad;u[p+"alanUid"]=user.uid;u[p+"alinmaZaman"]=simdi;u[p+"alanNot"]=an?an.slice(0,300):null;
          if(TF.length)TF.slice(0,FM).forEach(function(f,i){u[p+"fotolar/"+i]=f});
          await db.ref().update(u);
        }else{
          var o2={cari:cari.slice(0,100),talepUid:user.uid,talepEden:ad,zaman:simdi,durum:"alindi",talepTur:"dogrudan",
            alan:ad,alanUid:user.uid,alinmaZaman:simdi};
          if(n>0)o2.nakit=n;if(c>0)o2.cek=c;if(mk)o2.makbuzNo=mk.slice(0,30);if(an)o2.alanNot=an.slice(0,300);
          if(TF.length)o2.fotolar=TF.slice(0,FM);
          await db.ref("tahsilatlar").push(o2);
        }
        $("dTah").close();toast("✓ Tahsilat kaydedildi");sek="alin";don="bugun";$("tahDon").value="bugun";ciz();
      }
    }catch(err){$("tahE").textContent=errText(err)}
    b.disabled=false;
  };
})();
