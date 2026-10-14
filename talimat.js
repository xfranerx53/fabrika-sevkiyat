/* ===================== SEVKİYAT TALİMATLARI =====================
   Yönetici / Depo Görevlisi sevkiyat sorumlularına iş (talimat) verir: "A fabrikasından masura alınacak".
   Sevkiyat sorumlusu kendine verilenleri (veya "herkese" verilenleri) görür ve "Yaptım" der.
   Veri yolu: sevkTalimat/{id}  (app.js'teki db, user, rec, isAdmin, $, esc, toast, errText ortak kullanılır) */
(function(){
  var ref=null,L=[],FM=6,TF=[];
  var rolSor=function(){return !!(rec&&rec.rol==="Sevkiyat Sorumlusu")};
  var canAta=function(){return !!(rec&&rec.onay&&(isAdmin()||rec.rol==="Depo Görevlisi"))};
  var benim=function(x){return x.hedefUid==="*"||(user&&x.hedefUid===user.uid)};
  var gorunur=function(x){return canAta()||isAdmin()||!rolSor()||benim(x)};
  var yapabilir=function(x){return isAdmin()||(rolSor()&&benim(x))};
  var silebilir=function(x){return isAdmin()||(user&&x.atayanUid===user.uid&&canAta())};
  var zm=function(t){return t?new Date(+t).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",timeZone:"Europe/Istanbul"}):""};
  var hedefTxt=function(x){return x.hedefUid==="*"?"Tüm sevkiyat sorumluları":(x.hedefAd||"?")};

  var fl=function(x){var v=x.fotolar;return(Array.isArray(v)?v:Object.values(v||{})).filter(function(s){return typeof s==="string"&&s.indexOf("data:image/jpeg;base64,")===0})};
  function fotoHtml(x){var f=fl(x);return f.length?'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px">'+f.map(function(s,i){return '<div class="fth"><img src="'+s+'" alt="Foto '+(i+1)+'" data-z="'+i+'" data-id="'+esc(x.id)+'" style="height:80px"></div>'}).join("")+'</div>':""}
  function kart(x,bitti){
    var b="";
    if(!bitti&&yapabilir(x))b+='<button class="btn b3 sm" style="width:auto;margin:6px 6px 0 0" data-a="yap" data-id="'+esc(x.id)+'">✓ Yaptım</button>';
    if(bitti&&yapabilir(x)&&(isAdmin()||x.yapanUid===(user&&user.uid)))b+='<button class="btn b6 sm" style="width:auto;margin:6px 6px 0 0" data-a="geri" data-id="'+esc(x.id)+'">↩ Geri al</button>';
    if(silebilir(x))b+='<button class="btn b5 sm" style="width:auto;margin:6px 0 0" data-a="sil" data-id="'+esc(x.id)+'">🗑 Sil</button>';
    return '<div class="item c" style="border-left-color:'+(bitti?"#16a34a":"#f59e0b")+'">'+
      '<b style="font-size:17px;white-space:pre-wrap">'+(bitti?"✓ ":"")+esc(x.metin)+'</b>'+
      '<div class="sub">yazan: '+esc(x.atayan||"-")+' · '+esc(zm(x.zaman))+'</div>'+fotoHtml(x)+
      (bitti?'<div class="sub" style="color:#16a34a;font-weight:700">Yapan: '+esc(x.yapan||"-")+' · '+esc(zm(x.yapilmaZaman))+'</div>':'')+
      (b?'<div>'+b+'</div>':'')+'</div>';
  }
  function ciz(){
    var k=$("talKart");if(!k)return;
    var V=L.filter(gorunur),acik=V.filter(function(x){return x.durum!=="yapildi"}).sort(function(a,b){return a.zaman-b.zaman}),
        bit=V.filter(function(x){return x.durum==="yapildi"}).sort(function(a,b){return (b.yapilmaZaman||b.zaman)-(a.yapilmaZaman||a.zaman)}).slice(0,20);
    k.classList.toggle("hide",!(canAta()||V.length));
    $("talYeni").classList.toggle("hide",!canAta());
    $("talH").textContent="📋 TALİMATLAR"+(acik.length?" ("+acik.length+" bekliyor)":"");
    var h=acik.length?acik.map(function(x){return kart(x,false)}).join(""):'<div class="sub" style="padding:6px 0">Bekleyen talimat yok.</div>';
    if(bit.length)h+='<details style="margin-top:6px"><summary style="font-size:13px;font-weight:700;color:#64748b;cursor:pointer">Yapılanlar ('+bit.length+')</summary><div style="margin-top:6px">'+bit.map(function(x){return kart(x,true)}).join("")+'</div></details>';
    $("talList").innerHTML=h;
  }
  window.talBaslat=function(){
    window.talDurdur();
    if(!rec||!rec.onay||!modGor("sevk"))return;
    ref=db.ref("sevkTalimat").orderByChild("zaman").limitToLast(50);
    ref.on("value",function(s){var v=s.val()||{};L=Object.keys(v).map(function(k){return Object.assign({id:k},v[k])});ciz()},
      function(e){var k=$("talKart");if(k)k.classList.add("hide");toast("Talimatlar okunamadı: "+errText(e)+" (Firebase kuralını güncellediniz mi?)")});
  };
  window.talDurdur=function(){if(ref){ref.off();ref=null}L=[];var k=$("talKart");if(k)k.classList.add("hide")};

  $("talList").onclick=async function(e){
    var im=e.target.closest("img[data-z]");
    if(im){var t=L.find(function(y){return y.id===im.dataset.id});if(t&&window.fvAc)window.fvAc(fl(t)[+im.dataset.z]);return}
    var b=e.target.closest("button[data-a]");if(!b)return;
    var id=b.dataset.id,x=L.find(function(y){return y.id===id});if(!x)return;
    try{
      if(b.dataset.a==="yap"){
        var u={};u["sevkTalimat/"+id+"/durum"]="yapildi";u["sevkTalimat/"+id+"/yapan"]=String((rec&&rec.ad)||"?").slice(0,100);u["sevkTalimat/"+id+"/yapanUid"]=user.uid;u["sevkTalimat/"+id+"/yapilmaZaman"]=Date.now();
        await db.ref().update(u);toast("✓ Talimat yapıldı olarak işaretlendi");
      }else if(b.dataset.a==="geri"){
        var g={};g["sevkTalimat/"+id+"/durum"]="bekliyor";g["sevkTalimat/"+id+"/yapan"]=null;g["sevkTalimat/"+id+"/yapanUid"]=null;g["sevkTalimat/"+id+"/yapilmaZaman"]=null;
        await db.ref().update(g);
      }else if(b.dataset.a==="sil"&&confirm("Bu talimat silinsin mi?")){
        await db.ref("sevkTalimat/"+id).remove();toast("Talimat silindi");
      }
    }catch(err){toast(errText(err))}
  };

  function fCiz(){
    $("talFG").innerHTML=TF.map(function(s,i){return '<div class="fth"><img src="'+s+'" alt="Foto '+(i+1)+'" data-z="'+i+'"><button type="button" class="fx" data-x="'+i+'" aria-label="Kaldır">✖</button></div>'}).join("");
    $("talFS").textContent=TF.length?TF.length+"/"+FM+" fotoğraf":"";
  }
  $("talFG").onclick=function(e){
    var x=e.target.closest("[data-x]");if(x){TF.splice(+x.dataset.x,1);fCiz();return}
    var z=e.target.closest("[data-z]");if(z&&window.fvAc)window.fvAc(TF[+z.dataset.z])};
  function fEkle(files){
    Array.prototype.forEach.call(files,function(f){
      var r=new FileReader();
      r.onload=function(){sikistir(r.result,function(d){
        if(TF.length>=FM){toast("En fazla "+FM+" fotoğraf eklenebilir.");return}
        TF.push(d);fCiz()},640)};
      r.readAsDataURL(f)})}
  $("talGal").onchange=function(e){fEkle(e.target.files);e.target.value=""};
  $("talCam").onchange=function(e){fEkle(e.target.files);e.target.value=""};
  $("talYeni").onclick=function(){
    $("talE").textContent="";$("talMetin").value="";TF=[];fCiz();
    $("dTal").showModal();$("talMetin").focus();
  };
  $("talX").onclick=function(){$("dTal").close()};
  $("talOk").onclick=async function(){
    var m=$("talMetin").value.trim();
    if(!m){$("talE").textContent="Talimat metnini yazın.";return}
    var b=$("talOk");b.disabled=true;
    try{
      var o={metin:m.slice(0,500),hedefUid:"*",hedefAd:"Tümü",atayanUid:user.uid,atayan:String((rec&&rec.ad)||"?").slice(0,100),zaman:Date.now(),durum:"bekliyor"};
      if(TF.length)o.fotolar=TF.slice(0,FM);
      await db.ref("sevkTalimat").push(o);
      $("dTal").close();toast("✓ Talimat verildi");
    }catch(err){$("talE").textContent=errText(err)}
    b.disabled=false;
  };
})();
