/* ===================== ÜRETİM RAPORLARI (biten işler · aşama/operatör süreleri) =====================
   Veri: isEmirleri (asama=bitti sorgusu) ve isHareket (aşama geçiş kayıtları). Yetki: yönetici veya Raporlar izni.
   Excel için app.js'teki xlsxHazir() kullanılır. */
(function(){
  var g=function(i){return document.getElementById(i)};
  var mod="biten",sonSatir=null,sonDosya="",sonDonem="",yuk=0;
  var DAY=864e5;
  var rapGor=function(){try{return isAdmin()||modGor("rap")}catch(e){return false}};
  var pad=function(n){return String(n).padStart(2,"0")};
  var bas=function(s){return Date.parse(s+"T00:00:00+03:00")};
  var son=function(s){return Date.parse(s+"T23:59:59.999+03:00")};
  var gunEkle=function(s,n){return trIso(Date.parse(s+"T12:00:00+03:00")+n*DAY)};
  function aralik(){
    var v=g("irS").value,bg=trIso(Date.now()),wd=new Date(Date.parse(bg+"T12:00:00+03:00")).getUTCDay(),pt=gunEkle(bg,-((wd+6)%7));
    if(v==="hafta")return[pt,bg];
    if(v==="gecenhafta")return[gunEkle(pt,-7),gunEkle(pt,-1)];
    var ay1=bg.slice(0,8)+"01";
    if(v==="ay")return[ay1,bg];
    if(v==="gecenay"){var sonG=gunEkle(ay1,-1);return[sonG.slice(0,8)+"01",sonG]}
    var a=g("irD1").value,b=g("irD2").value;if(a&&b&&a>b){var t=a;a=b;b=t}
    return[a||b||bg,b||a||bg]}
  var tarSaat=function(t){return t?new Date(t).toLocaleString("tr-TR",{timeZone:TRZ,day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"-"};
  var tarGun=function(s){var p=String(s||"").split("-");return p.length===3?p[2]+"."+p[1]+"."+p[0]:s};
  function sureTxt(ms){if(!(ms>=0))return"-";var dk=Math.round(ms/6e4),d=Math.floor(dk/1440),sa=Math.floor((dk%1440)/60),m=dk%60;
    return(d?d+" gün ":"")+(sa?sa+" sa ":"")+((m||(!d&&!sa))?m+" dk":"")}
  var kgTop=function(e){return Math.round(icols(e).reduce(function(a,c){return a+(parseFloat(String(c.kg).replace(",","."))||0)},0)*1000)/1000};
  var bitisZ=function(e){return(e.log&&e.log.depo&&+e.log.depo.zaman)||+e.aktarTarih||+e.eklenmeTarihi||0};
  var tablo=function(bas_,satir){return'<table class="irt"><thead><tr>'+bas_.map(function(h){return'<th>'+esc(h)+'</th>'}).join("")+'</tr></thead><tbody>'+
    satir.map(function(r){return'<tr>'+r.map(function(c){return'<td>'+esc(c)+'</td>'}).join("")+'</tr>'}).join("")+'</tbody></table>'};
  var chips=function(a){return'<div class="irch">'+a.map(function(x){return'<div><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></div>'}).join("")+'</div>'};

  /* ---------- 1) Biten işler ---------- */
  async function bitenRapor(a,b){
    var s=await db.ref("isEmirleri").orderByChild("asama").equalTo("bitti").once("value"),v=s.val()||{};
    var A=bas(a),B=son(b),L=Object.keys(v).map(function(k){return Object.assign({id:k},v[k])})
      .filter(function(e){var z=bitisZ(e);return z>=A&&z<=B}).sort(function(x,y){return bitisZ(y)-bitisZ(x)});
    var topS=0,topU=0,topP=0,topSure=0,nSure=0;
    var X=L.map(function(e){var d=(e.log&&e.log.depo)||{},sk=kgTop(e),uk=+d.kg||0,pk=+d.paket||0,z=bitisZ(e),sure=z&&e.eklenmeTarihi?z-e.eklenmeTarihi:NaN;
      topS+=sk;topU+=uk;topP+=pk;if(sure>=0){topSure+=sure;nSure++}
      return{"Seri no":e.no||"","Müşteri":e.musteri||"","İşin adı":e.isAdi||"","Stok adı":e.stok||"","Sipariş (kg)":sk,"Üretilen (kg)":uk,"Paket":pk,
        "Baskılı":e.baskiVar?"Evet":"Hayır","Termin":e.termin?tarGun(e.termin):"","Açılış":tarSaat(e.eklenmeTarihi),"Bitiş":tarSaat(z),"Toplam süre":sureTxt(sure),
        "Açan":e.ekleyen||"","Depoya giren":d.kim||""}});
    sonSatir={sayfalar:[["Biten işler",X]]};sonDosya="biten-isler_"+a+"_"+b;
    g("irSon").innerHTML=chips([[L.length,"biten iş emri"],[fmt(topS)+" kg","sipariş"],[fmt(topU)+" kg","üretilen"],[fmt(topP),"paket"]].concat(nSure?[[sureTxt(topSure/nSure),"ort. süre"]]:[]));
    g("irL").innerHTML=L.length?tablo(["Seri no","Müşteri","İş","Üretilen kg","Bitiş","Süre"],X.map(function(r){return[r["Seri no"],r["Müşteri"],r["İşin adı"],fmt(r["Üretilen (kg)"]),r["Bitiş"],r["Toplam süre"]]})):'<div class="empty">Bu dönemde biten iş emri yok.</div>'}

  /* ---------- 2) Aşama / operatör süreleri ---------- */
  async function sureRapor(a,b){
    var A=bas(a),B=son(b);
    var rs=await Promise.all([db.ref("isHareket").once("value"),db.ref("isEmirleri").orderByChild("eklenmeTarihi").startAt(A-150*DAY).once("value")]);
    var H=rs[0].val()||{},E=rs[1].val()||{},K=[];
    Object.keys(H).forEach(function(id){
      var ev=Object.values(H[id]||{}).filter(function(x){return x&&+x.zaman}).sort(function(x,y){return x.zaman-y.zaman}),st=null,gir=null;
      ev.forEach(function(x){
        if(x.tur==="olustur"){st=x.kime||"etiket";gir=+x.zaman}
        else if((x.tur==="ileri"||x.tur==="etiketsiz")&&x.kimden){
          if(gir&&st===x.kimden&&+x.zaman>=A&&+x.zaman<=B&&+x.zaman>=gir)K.push({id:id,asama:x.kimden,kim:x.kim||"-",gir:gir,cik:+x.zaman,sure:+x.zaman-gir});
          st=x.kime;gir=+x.zaman}
        else if((x.tur==="geri"||x.tur==="duzenle")&&x.kime){st=x.kime;gir=+x.zaman}})});
    var G={};
    K.forEach(function(k){var e=E[k.id]||{},kg=e.siparis?kgTop(e):0,key=k.asama+"|"+k.kim;
      var o=G[key]||(G[key]={asama:k.asama,kim:k.kim,n:0,sure:0,kg:0});o.n++;o.sure+=k.sure;o.kg+=kg;k.no=e.no||k.id;k.kgv=kg;k.musteri=e.musteri||""});
    var sira=["etiket","ekstruder","baski","kesim","depo"],R=Object.values(G).sort(function(x,y){return(sira.indexOf(x.asama)-sira.indexOf(y.asama))||(y.n-x.n)});
    var ozet=R.map(function(o){var sa=o.sure/36e5;return{"Aşama":(ASL[o.asama]||o.asama),"Operatör":o.kim,"İş sayısı":o.n,"Ortalama süre":sureTxt(o.sure/o.n),"Toplam süre":sureTxt(o.sure),"Toplam sipariş (kg)":Math.round(o.kg),"kg / saat":sa>0&&o.kg>0?Math.round(o.kg/sa*10)/10:""}});
    var det=K.sort(function(x,y){return x.cik-y.cik}).map(function(k){return{"Seri no":k.no,"Müşteri":k.musteri,"Aşama":ASL[k.asama]||k.asama,"Operatör":k.kim,"Aşamaya giriş":tarSaat(k.gir),"Aşamadan çıkış":tarSaat(k.cik),"Süre":sureTxt(k.sure),"Sipariş (kg)":k.kgv}});
    sonSatir={sayfalar:[["Özet",ozet],["Detay",det]]};sonDosya="asama-sureleri_"+a+"_"+b;
    g("irSon").innerHTML=chips([[K.length,"aşama geçişi"],[R.length,"aşama/operatör"]])+'<div class="irnot">Süre = işin o aşamada geçirdiği toplam zaman (bekleme dahil, yalnızca makine süresi değil).</div>';
    g("irL").innerHTML=ozet.length?tablo(["Aşama","Operatör","İş","Ort. süre","Toplam","kg/saat"],ozet.map(function(r){return[r["Aşama"],r["Operatör"],r["İş sayısı"],r["Ortalama süre"],r["Toplam süre"],r["kg / saat"]]})):'<div class="empty">Bu dönemde tamamlanan aşama kaydı yok.</div>'}

  async function yukle(){
    if(!rapGor()){g("irL").innerHTML='<div class="empty">Bu raporlar için yetkiniz yok.</div>';return}
    var my=++yuk,ar=aralik(),a=ar[0],b=ar[1];sonSatir=null;sonDonem=tarGun(a)+" – "+tarGun(b);
    g("irSon").textContent="Yükleniyor… ("+tarGun(a)+" – "+tarGun(b)+")";g("irL").innerHTML="";
    try{if(mod==="biten")await bitenRapor(a,b);else await sureRapor(a,b);
      if(my!==yuk)return;g("irSon").insertAdjacentHTML("afterbegin",'<div class="irdon">📅 '+tarGun(a)+' – '+tarGun(b)+'</div>')}
    catch(e){if(my!==yuk)return;g("irSon").innerHTML='<b style="color:#e71d36">Rapor alınamadı: '+esc(errText(e))+'</b>'}}

  function ac(){if(!rapGor()){toast("Raporlar için yetkiniz yok.");return}g("dIR").showModal();yukle()}
  var ab=g("irAc1");if(ab)ab.onclick=ac;g("irX").onclick=function(){g("dIR").close()};
  g("irT").onclick=function(ev){var b=ev.target.closest("button[data-r]");if(!b)return;mod=b.dataset.r;
    document.querySelectorAll("#irT button").forEach(function(x){x.classList.toggle("on",x===b)});yukle()};
  g("irS").onchange=function(){g("irO").style.display=g("irS").value==="ozel"?"flex":"none";yukle()};
  g("irD1").onchange=yukle;g("irD2").onchange=yukle;
  g("irXl").onclick=async function(){
    if(!sonSatir||!sonSatir.sayfalar.some(function(s){return s[1].length})){toast("İndirilecek veri yok.");return}
    try{
      var X=window.xlsxYaz,sf=sonSatir.sayfalar.filter(function(s){return s[1].length});
      if(X){ /* biçimli Excel (xlsx-yaz.js) */
        var bsl=mod==="biten"?"Biten işler raporu":"Aşama ve operatör süreleri raporu",alt="Dönem: "+sonDonem+"  ·  Hazırlanma: "+tarSaat(Date.now());
        X.indir(sonDosya,sf.map(function(s){return X.jsonSayfa(s[0],s[1],bsl+(sf.length>1?" — "+s[0]:""),alt)}));toast("Excel dosyası indirildi");return}
      toast("Excel hazırlanıyor…");await xlsxHazir();var wb=XLSX.utils.book_new();
      sf.forEach(function(s){XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(s[1]),s[0])});
      XLSX.writeFile(wb,sonDosya+".xlsx")}catch(e){toast(errText(e))}};
  /* Dışarı dokununca kapat */
  (function(){var d=g("dIR"),dn=false,out=function(ev){var r=d.getBoundingClientRect();return ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom};
    d.addEventListener("pointerdown",function(ev){dn=ev.target===d&&out(ev)});d.addEventListener("click",function(ev){if(dn&&ev.target===d&&out(ev))d.close();dn=false})})();
  /* Rapor düğmelerini yalnızca yetkililere göster (isListele çağırır) */
  window.irGoster=function(){var v=rapGor();["irAc1"].forEach(function(i){var b=g(i);if(b)b.classList.toggle("hide",!v)})};
})();
