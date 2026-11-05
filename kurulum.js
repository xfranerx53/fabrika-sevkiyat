/* kurulum.js — 🧭 PROGRAM SAĞLIĞI / KURULUM DURUMU (v138, yalnız yönetici, Yönetici Paneli'nin en altında)
   Programın «dört dörtlük» çalışması için eksikleri tek kartta gösterir: adreslerin konumu ve Mikro eşleşmesi, Mikro cari listesinin
   yaşı, telefon bildirimi açmayanlar, fabrika konumu, yapay zekâ anahtarı, uzun süredir aşamada bekleyen iş emirleri.
   Yalnız okur; düzeltme düğmeleri ilgili ekranı açar. Sonuç 2 dk önbellekte tutulur (pano sık yenilenir). */
(function(){
  function e(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  var son=null,zm=0,calisiyor=null;
  async function hesap(){var db=firebase.database(),o=[],g=function(p){return db.ref(p).once("value").then(function(s){return s.val()}).catch(function(){return undefined})};
    var x=await Promise.all([g("sevkAdresleri"),g("cariler"),g("adresGizle"),g("ayarlar/cariAktar"),g("ayarlar/fabrika"),g("okumaAyar"),g("kullanicilar"),g("ai/gecGun")]);
    var A=x[0]||{},C=x[1]||{},G=x[2]||{},CA=x[3],F=x[4],OK=x[5],K=x[6]||{},GG=Array.isArray(x[7])?x[7]:Object.values(x[7]||{});
    var AL=Object.keys(A).map(function(k){return A[k]}),kon=AL.filter(function(a){return!(window.adrKonum&&window.adrKonum(a))}).length,bagli={};AL.forEach(function(a){if(a&&a.cariKod)bagli[a.cariKod]=1});
    var bir=Date.now()-400*864e5,eks=Object.keys(C).filter(function(k){var c=C[k];return c&&c.tur==="m"&&!bagli[c.kod]&&!G[k]&&(!c.son||Date.parse(c.son)>=bir)}).length;
    o.push({ok:!kon&&!eks,ik:"📍",b:"Sevk adresleri",m:AL.length+" kayıtlı adres"+(kon?" • ⚠ "+kon+" adresin konumu yok":" • hepsinin konumu var")+(eks?" • ⚠ Mikro'da hareketli "+eks+" müşteri adres defterine bağlı değil":""),bt:kon||eks?["🧩 Adres tamamlama","adr"]:null});
    var cg=CA&&CA.z?Math.floor((Date.now()-CA.z)/864e5):null;
    o.push({ok:cg!==null&&cg<=35,ik:"🧾",b:"Mikro cari listesi",m:cg===null?"Hiç aktarılmadı":"Son aktarım "+(cg?cg+" gün önce":"bugün")+" ("+(CA.n||0)+" cari)"+(cg>35?" — Mikro'dan güncel cari, adres ve risk listesini gönderin":"")});
    o.push({ok:!!(F&&F.lat),ik:"🏭",b:"Fabrika konumu (rota başlangıcı)",m:F&&F.lat?"Kayıtlı":"Girilmemiş — 🤖 Yapay Zekâ › Sevkiyat rotası › Fabrika konumu"});
    o.push({ok:!!(OK&&OK.anahtar),ik:"🤖",b:"Yapay zekâ anahtarı (Gemini)",m:OK&&OK.anahtar?"Var — mesajdan iş emri/talimat, fotoğraftan okuma, sesli asistan çalışır":"Yok — mesaj/fotoğraf okuma yalnız basit eşlemeyle çalışır"});
    if(GG.length)o.push({ok:false,ik:"⏰",b:"Uzun süredir bekleyen iş emirleri",m:GG.length+" iş 10 günden uzun aynı aşamada: "+GG.slice(0,6).join(", ")});
    var on=Object.keys(K).filter(function(u){return K[u]&&K[u].onay===true&&K[u].kullanici!=="magajan"});
    try{var L=((await window.pushIstekG("/liste",{}))||{}).liste||[],var_={};L.forEach(function(a){if(a.son>0)var_[a.uid]=1});
      var yok=on.filter(function(u){return!var_[u]}).map(function(u){return K[u].ad||K[u].kullanici||"?"});
      o.push({ok:!yok.length,ik:"🔔",b:"Telefon bildirimleri",m:(on.length-yok.length)+"/"+on.length+" kişide çalışıyor"+(yok.length?" • açmayan: "+yok.slice(0,8).join(", ")+(yok.length>8?"…":"")+" — bu kişiler menüde 🔔 › «Telefon bildirimlerini aç»a bassın":"")})}
    catch(er){o.push({ok:false,ik:"🔔",b:"Telefon bildirimleri",m:"Bildirim sunucusuna ulaşılamadı ("+e(er&&er.message||er)+")"})}
    return o}
  window.kurulumCiz=async function(el){if(!el||!(typeof isAdmin==="function"&&isAdmin()))return;
    if(!son||Date.now()-zm>120000){if(!calisiyor)calisiyor=hesap().then(function(o){son=o;zm=Date.now();calisiyor=null;return o},function(){calisiyor=null;return son||[]});el.innerHTML='<div class="pnK" data-r="gr"><div class="pnT"><span>🧭 Program sağlığı</span></div><div class="sub">Kontrol ediliyor…</div></div>';await calisiyor}
    if(!document.body.contains(el))return;var o=son||[],eks=o.filter(function(x){return!x.ok}).length;
    el.innerHTML='<div class="pnK" data-r="'+(eks?"tu":"ye")+'"><div class="pnT"><span>🧭 Program sağlığı — kurulum durumu</span><b class="pnN">'+(eks?eks+" eksik":"✓")+'</b></div>'+
      o.map(function(x,i){return'<div class="pnR"><div>'+(x.ok?"✅":"⚠️")+" "+x.ik+" <b>"+e(x.b)+'</b></div><small>'+e(x.m)+'</small>'+(x.bt?'<div><button type="button" class="pnG" data-kur="'+x.bt[1]+'">'+e(x.bt[0])+' ›</button></div>':'')+'</div>'}).join("")+'</div>';
    el.querySelectorAll("[data-kur]").forEach(function(b){b.onclick=function(ev){ev.stopPropagation();if(b.dataset.kur==="adr"&&window.adrTamAc){var d=document.getElementById("dPano");if(d&&d.open)d.close();adrTamAc()}}})};
})();
