/* ===================== ADET & MALİYET HESAPLAMA (v129, yalnız yönetici) =====================
   Finansın Excel'i (MALİYET_TABLOSU.XLSX) yerine: kur, hammadde, reçete, aylık gider, ürün kartı → maliyet ve fiyat.
   Veri: maliyet/ayar · maliyet/kur · maliyet/hammadde/{id} · maliyet/recete/{id} · maliyet/gider/{YYYY-MM} · maliyet/urun/{id}
   rules.json: maliyet = yalnız onaylı yönetici okur/yazar.
   HESAP (kg başına, KDV hariç ₺):
     hammadde  = Σ oran% × fiyat × kur ÷ (KDV dahil işaretliyse 1+KDV%)
     fire      = (hammadde + boya/baskı/diğer ₺/kg) × fire%
     gider     = elektrik + genel gider ₺/kg (ürün/ayar) — ya da «aylık gerçek»: o ayın giderleri ÷ o ayın üretim kg'ı
     paket     = (koli + masura + bıçak + diğer ₺/paket) ÷ paketin net kg'ı
     MALİYET   = hammadde + ek ₺/kg + fire + gider + paket
     +KDV fiyat (faturalı) = maliyet × (1+kâr%F)        (müşteriye ayrıca KDV eklenir)
     X fiyat (faturasız)   = maliyet × (1+KDV yükü%) × (1+kâr%X)   (Excel'deki «KDV %10» + ×1,2 mantığı)
     gramaj(g) = (en + körük toplamı) × boy × kat × mikron(tek kat) × yoğunluk ÷ 10000 × (1+düzeltme%)
     yoğunluk  = 1 ÷ Σ(oran ÷ yoğunluk)  (reçeteden kendiliğinden)
   app.js'ten: db, user, rec, isAdmin, $, esc, fmt, toast, errText, xlsxYaz */
(function(){
  var REF={},A={},K={},H={},R={},G={},U={},sekme="urun",acik=false,isKg=null;
  var TS=function(){return firebase.database.ServerValue.TIMESTAMP};
  var n=function(v){if(v==null||v==="")return 0;var s=String(v).trim().replace(/\s/g,"");if(/,/.test(s)){s=s.replace(/\./g,"").replace(",",".")}var x=parseFloat(s);return isFinite(x)?x:0};
  var nb=function(v){return v==null||String(v).trim()===""?null:n(v)}; /* boş = null (genel ayarı kullan) */
  var f2=function(x,d){return Number(x||0).toLocaleString("tr-TR",{minimumFractionDigits:d==null?2:d,maximumFractionDigits:d==null?2:d})};
  var tl=function(x,d){return f2(x,d)+" ₺"};
  var gir=function(x){return x==null||x===""?"":String(x).replace(".",",")};
  var VARS={kurTur:"efektif",kdv:20,kdvYuk:10,elektrik:10,genel:20,giderKaynak:"sabit",giderAy:""};
  var ay=function(){var a=Object.assign({},VARS,A||{});return a};
  var GIDER_K=[["elektrik","⚡ Elektrik"],["dogalgaz","🔥 Doğalgaz / su"],["personel","👷 Personel (maaş + SGK)"],["kira","🏭 Kira"],["nakliye","🚚 Nakliye / yakıt"],["bakim","🔧 Bakım / onarım / yedek parça"],["diger","📎 Diğer genel giderler"]];
  var TUR=[["adet","Poşet / torba / çanta (ölçüden adet)"],["paket","Rulo / streç / kg bazlı (paket net kg)"]];

  /* ---------- kur ---------- */
  function kur(pb){if(pb==="TRY"||!pb)return 1;var k=(K||{})[pb]||{},t=ay().kurTur;return +(t==="doviz"?(k.doviz||k.efektif):(k.efektif||k.doviz))||0}
  function hFiyatTL(h){if(!h)return 0;var a=ay();return (+h.fiyat||0)*kur(h.pb)/(h.kdvDahil?(1+a.kdv/100):1)}
  /* ---------- reçete ---------- */
  function recHesap(rid){var r=R[rid];if(!r)return{tl:0,yog:0.93,top:0,eksik:true};var tl_=0,inv=0,top=0,eks=false;
    Object.keys(r.b||{}).forEach(function(hid){var o=+r.b[hid]||0,h=H[hid];if(!h||o<=0){if(o>0)eks=true;return}top+=o;tl_+=o/100*hFiyatTL(h);inv+=o/100/(+h.yog||0.93)});
    return{tl:tl_,yog:inv>0?(top/100)/inv:0.93,top:top,eksik:eks}}
  /* ---------- aylık gider ---------- */
  function giderAy(a){var g=G[a];if(!g)return null;var top=GIDER_K.reduce(function(s,k){return s+(+((g.k||{})[k[0]])||0)},0),kg=+g.kgElle||+g.kgOto||0;return{top:top,kg:kg,tlKg:kg>0?top/kg:0}}
  /* ---------- ürün hesabı ---------- */
  function hesap(u){
    var a=ay(),r=recHesap(u.recete),o={uyar:[]};
    if(!R[u.recete])o.uyar.push("Reçete seçilmedi");else if(Math.abs(r.top-100)>0.01)o.uyar.push("Reçete oranları toplamı %"+f2(r.top,1)+" (100 olmalı)");
    if(r.eksik)o.uyar.push("Reçetedeki bir hammadde silinmiş");
    if(!kur("USD"))o.uyar.push("Kur girilmemiş");
    o.yog=r.yog;o.ham=r.tl;
    o.ek=(+u.boya||0)+(+u.baski||0)+(+u.ekDiger||0);
    o.fire=(o.ham+o.ek)*(+u.fire||0)/100;
    var gm=a.giderKaynak==="aylik"?giderAy(a.giderAy):null;
    if(gm&&gm.tlKg>0){o.elektrik=0;o.genel=gm.tlKg;o.giderNot="aylık gerçek ("+a.giderAy+")"}
    else{o.elektrik=u.elektrik!=null?+u.elektrik:+a.elektrik;o.genel=u.genel!=null?+u.genel:+a.genel;o.giderNot=a.giderKaynak==="aylik"?"⚠ seçili ayın gideri yok, sabit değer":"sabit"}
    if(u.tur==="adet"){
      o.gramaj=((+u.en||0)+(+u.koruk||0))*(+u.boy||0)*(+u.kat||2)*(+u.mikron||0)*o.yog/10000*(1+(+u.duz||0)/100);
      o.adetKg=o.gramaj>0?1000/o.gramaj:0;
      o.paketKg=(+u.paketAdet||0)*o.gramaj/1000;
      if(!(o.gramaj>0))o.uyar.push("Ölçü eksik: gramaj hesaplanamadı");
    }else{o.paketKg=+u.paketKg||0}
    var pk=(+u.koli||0)+(+u.masura||0)+(+u.bicak||0)+(+u.pDiger||0);
    o.paketTop=pk;o.paket=o.paketKg>0?pk/o.paketKg:0;
    if(pk>0&&!(o.paketKg>0))o.uyar.push("Paket gideri var ama paketin net kg'ı yok");
    o.mal=o.ham+o.ek+o.fire+o.elektrik+o.genel+o.paket;
    o.fF=o.mal*(1+(+u.marjF||0)/100);o.fFk=o.fF*(1+a.kdv/100);
    o.fX=o.mal*(1+a.kdvYuk/100)*(1+(+u.marjX||0)/100);
    o.usd=kur("USD");o.eur=kur("EUR");
    return o}
  window.malHesap=hesap; /* sınama için */

  /* ---------- veri ---------- */
  var YOL=["ayar","kur","hammadde","recete","gider","urun"];
  function baglan(){kapat();YOL.forEach(function(p){var r=db.ref("maliyet/"+p);REF[p]=r;r.on("value",function(s){var v=s.val()||{};
      if(p==="ayar")A=v;else if(p==="kur")K=v;else if(p==="hammadde")H=v;else if(p==="recete")R=v;else if(p==="gider")G=v;else U=v;ciz()},function(e){$("malIc").innerHTML='<p class="err">Okunamadı: '+esc(errText(e))+' — Firebase kurallarının son halini (rules.json) yayınladınız mı?</p>'})});
    setTimeout(kurOto,1500)}
  function kapat(){YOL.forEach(function(p){if(REF[p]){REF[p].off();delete REF[p]}})}
  window.malAc=function(){if(!isAdmin()){toast("Bu bölüm yalnız yöneticiye açık.");return}acik=true;baglan()};
  window.malKapat=function(){acik=false;kapat()};
  var yaz=function(p,v){return db.ref("maliyet/"+p).set(v).catch(function(e){toast("Kaydedilemedi: "+errText(e));throw e})};

  /* ---------- kur: Cloudflare sunucusu üzerinden TCMB ---------- */
  async function sunucu(){try{var s=await db.ref("ayarlar/push/url").once("value");return String(s.val()||"").replace(/\/+$/,"")}catch(e){return""}}
  async function kurGetir(sessiz){
    var u=await sunucu();if(!u){if(!sessiz)toast("Bildirim sunucusu adresi girilmemiş; kuru elle girin.");return}
    try{var r=await fetch(u+"/kur"),j=await r.json();if(!j.ok)throw new Error(j.hata||"kur alınamadı");
      await yaz("kur",{USD:j.USD,EUR:j.EUR,tarih:j.tarih,kaynak:"TCMB",z:TS()});if(!sessiz)toast("✓ TCMB kurları alındı ("+j.tarih+")")}
    catch(e){if(!sessiz)toast("⚠️ TCMB kuru alınamadı: "+e.message+" — Cloudflare'deki kod v129 mu? Kuru elle de girebilirsiniz.")}}
  function kurOto(){if(!acik)return;var z=+(K&&K.z)||0;if(K&&K.kaynak==="elle")return;if(Date.now()-z>6*3600e3)kurGetir(true)}

  /* ---------- çizim ---------- */
  var SK=[["urun","🧮 Ürünler"],["liste","📋 Fiyat listesi"],["ham","🧪 Hammadde & reçete"],["gider","🏭 Giderler"],["ayar","⚙️ Kur & ayarlar"]];
  function ciz(){
    if(!acik)return;var el=$("malIc");if(!el)return;
    $("malTabs").innerHTML=SK.map(function(s){return '<button type="button" data-s="'+s[0]+'" class="'+(s[0]===sekme?"on":"")+'">'+s[1]+'</button>'}).join("");
    var a=ay(),kb='<div class="mlKur">💱 $ '+f2(kur("USD"),4)+' · € '+f2(kur("EUR"),4)+' <span class="mut">('+esc(K&&K.tarih||"kur yok")+' · '+(a.kurTur==="doviz"?"döviz satış":"efektif satış")+(K&&K.kaynak?" · "+esc(K.kaynak):"")+')</span> · Gider: '+(a.giderKaynak==="aylik"?"aylık gerçek "+esc(a.giderAy||"?"):"sabit")+'</div>';
    var bos=!Object.keys(H).length&&!Object.keys(U).length;
    var h=kb+(bos?'<div class="note" style="margin:8px 0">Henüz veri yok. <button type="button" class="btn b3 sm" id="malTohum" style="width:auto;margin:6px 0 0">📥 Excel\'deki değerlerle başlat</button><div class="mut" style="font-size:13px">Hammaddeler (HDPE 1,85 $ …), 7 reçete ve Excel\'deki örnek ürünler yüklenir; sonra dilediğiniz gibi değiştirin.</div></div>':"");
    h+=sekme==="urun"?cizUrun():sekme==="liste"?cizListe():sekme==="ham"?cizHam():sekme==="gider"?cizGider():cizAyar();
    el.innerHTML=h;
    var t=$("malTohum");if(t)t.onclick=tohum;
  }
  var gruplu=function(){var L=Object.keys(U).map(function(k){return Object.assign({id:k},U[k])});L.sort(function(a,b){return String(a.grup||"").localeCompare(String(b.grup||""),"tr")||String(a.ad||"").localeCompare(String(b.ad||""),"tr")});return L};
  function cizUrun(){
    var L=gruplu(),son="",h='<button type="button" class="btn b1" data-mu="yeni" style="margin:8px 0">＋ Yeni ürün / hızlı hesap</button>';
    if(!L.length)return h+'<div class="empty">Ürün kartı yok.</div>';
    L.forEach(function(u){var o=hesap(u);if((u.grup||"")!==son){son=u.grup||"";h+='<div class="shd">'+esc(son||"DİĞER")+'</div>'}
      h+='<button type="button" class="mlU" data-mu="'+esc(u.id)+'"><b>'+esc(u.ad||"-")+'</b><span>Maliyet <b>'+tl(o.mal)+'</b>/kg · +KDV '+tl(o.fF)+' · X '+tl(o.fX)+(u.tur==="adet"&&o.gramaj>0?' · '+f2(o.gramaj,2)+' g · '+f2(o.adetKg,0)+' adet/kg':'')+'</span>'+(o.uyar.length?'<em>⚠ '+esc(o.uyar.join(" · "))+'</em>':'')+'</button>'});
    return h}
  function cizListe(){
    var L=gruplu();if(!L.length)return'<div class="empty">Ürün yok.</div>';
    var h='<div style="display:flex;gap:6px;margin:8px 0"><button type="button" class="btn b3 sm" id="malXls" style="width:auto;margin:0">📥 Excel\'e aktar</button></div><div class="mlTw"><table class="mlT"><thead><tr><th>Ürün</th><th>Maliyet ₺/kg</th><th>+KDV ₺/kg</th><th>X ₺/kg</th><th>+KDV $/kg</th><th>X $/kg</th><th>Adet/kg</th><th>+KDV ₺/adet</th><th>Paket</th><th>+KDV ₺/paket</th><th>X ₺/paket</th></tr></thead><tbody>',son="";
    L.forEach(function(u){var o=hesap(u);if((u.grup||"")!==son){son=u.grup||"";h+='<tr class="g"><td colspan="11">'+esc(son||"DİĞER")+'</td></tr>'}
      h+='<tr><td>'+esc(u.ad)+'</td><td>'+f2(o.mal)+'</td><td><b>'+f2(o.fF)+'</b></td><td><b>'+f2(o.fX)+'</b></td><td>'+(o.usd?f2(o.fF/o.usd,3):"-")+'</td><td>'+(o.usd?f2(o.fX/o.usd,3):"-")+'</td><td>'+(o.adetKg?f2(o.adetKg,0):"-")+'</td><td>'+(o.gramaj?f2(o.fF*o.gramaj/1000,4):"-")+'</td><td>'+(o.paketKg?f2(o.paketKg,2)+" kg":"-")+'</td><td>'+(o.paketKg?f2(o.fF*o.paketKg):"-")+'</td><td>'+(o.paketKg?f2(o.fX*o.paketKg):"-")+'</td></tr>'});
    setTimeout(function(){var b=$("malXls");if(b)b.onclick=xls},0);
    return h+'</tbody></table></div><div class="mut" style="font-size:12px">+KDV = faturalı fiyat (üstüne KDV eklenir). X = faturasız fiyat. Kur ve hammadde fiyatı değişince liste kendiliğinden güncellenir.</div>'}
  function cizHam(){
    var h='<div class="shd">🧪 HAMMADDE FİYATLARI</div>';
    var HL=Object.keys(H).map(function(k){return Object.assign({id:k},H[k])}).sort(function(a,b){return(+a.sira||0)-(+b.sira||0)||String(a.ad).localeCompare(String(b.ad),"tr")});
    h+=HL.map(function(x){return '<button type="button" class="mlU" data-mh="'+esc(x.id)+'"><b>'+esc(x.ad)+'</b><span>'+f2(x.fiyat,3)+' '+esc(x.pb||"USD")+'/kg · '+(x.kdvDahil?"KDV dahil":"KDV hariç")+' · yoğunluk '+f2(x.yog,2)+' → <b>'+tl(hFiyatTL(x))+'</b>/kg (KDV hariç)</span></button>'}).join("")||'<div class="empty">Hammadde yok.</div>';
    h+='<button type="button" class="btn b6" data-mh="yeni">＋ Hammadde ekle</button>';
    h+='<div class="shd" style="margin-top:12px">🧾 REÇETELER (KARIŞIMLAR)</div>';
    var RL=Object.keys(R).map(function(k){return Object.assign({id:k},R[k])}).sort(function(a,b){return String(a.ad).localeCompare(String(b.ad),"tr")});
    h+=RL.map(function(x){var r=recHesap(x.id),t=Object.keys(x.b||{}).filter(function(k){return +x.b[k]>0}).map(function(k){return(H[k]?H[k].ad:"?")+" %"+f2(x.b[k],0)}).join(" · ");
      return '<button type="button" class="mlU" data-mr="'+esc(x.id)+'"><b>'+esc(x.ad)+'</b><span>'+esc(t)+' → <b>'+tl(r.tl)+'</b>/kg · yoğunluk '+f2(r.yog,3)+'</span>'+(Math.abs(r.top-100)>0.01?'<em>⚠ toplam %'+f2(r.top,1)+'</em>':'')+'</button>'}).join("")||'<div class="empty">Reçete yok.</div>';
    return h+'<button type="button" class="btn b6" data-mr="yeni">＋ Reçete ekle</button>'}
  function cizGider(){
    var a=ay(),h='<div class="mut" style="font-size:13px;margin:6px 0">Her ayın giderlerini girin; program o ay depoya giren üretim kg\'ına böler ve kg başı gerçek gideri bulur. «Kur & ayarlar»dan «aylık gerçek» seçilirse ürün maliyetlerinde bu kullanılır.</div>';
    var AL=Object.keys(G).sort().reverse();
    h+=AL.map(function(m){var g=giderAy(m);return '<button type="button" class="mlU" data-mg="'+esc(m)+'"><b>'+esc(ayAd(m))+(a.giderKaynak==="aylik"&&a.giderAy===m?" ✅ kullanılıyor":"")+'</b><span>Toplam '+tl(g.top,0)+' · üretim '+f2(g.kg,0)+' kg → <b>'+tl(g.tlKg)+'/kg</b></span></button>'}).join("")||'<div class="empty">Henüz ay girilmedi.</div>';
    return h+'<button type="button" class="btn b6" data-mg="yeni">＋ Ay ekle</button>'}
  var AYLAR=["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  var ayAd=function(m){var p=String(m).split("-");return (AYLAR[+p[1]-1]||p[1])+" "+p[0]};
  function cizAyar(){
    var a=ay(),k=K||{};
    var ayOpt=Object.keys(G).sort().reverse().map(function(m){return'<option value="'+esc(m)+'"'+(m===a.giderAy?" selected":"")+'>'+esc(ayAd(m))+'</option>'}).join("");
    return '<div class="shd">💱 KUR</div><div class="grid"><div><label>$ (USD) efektif satış</label><input id="mkUe" inputmode="decimal" value="'+gir(k.USD&&k.USD.efektif)+'"></div><div><label>$ döviz satış</label><input id="mkUd" inputmode="decimal" value="'+gir(k.USD&&k.USD.doviz)+'"></div><div><label>€ (EUR) efektif satış</label><input id="mkEe" inputmode="decimal" value="'+gir(k.EUR&&k.EUR.efektif)+'"></div><div><label>€ döviz satış</label><input id="mkEd" inputmode="decimal" value="'+gir(k.EUR&&k.EUR.doviz)+'"></div></div>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn b3" id="mkTcmb" style="width:auto">🌐 TCMB\'den güncelle</button><button type="button" class="btn b6" id="mkElle" style="width:auto">💾 Elle girdiğim kuru kaydet</button></div>'
      +'<div class="mut" style="font-size:12px">Kur kaynağı: '+esc(k.kaynak||"-")+' · '+esc(k.tarih||"")+'. TCMB kuru her açılışta 6 saatten eskiyse kendiliğinden yenilenir (elle girildiyse yenilenmez).</div>'
      +'<label style="margin-top:8px">Hangi kur kullanılsın?</label><select id="maKt"><option value="efektif"'+(a.kurTur==="efektif"?" selected":"")+'>Efektif satış (Excel\'deki gibi)</option><option value="doviz"'+(a.kurTur==="doviz"?" selected":"")+'>Döviz satış</option></select>'
      +'<div class="shd" style="margin-top:12px">🧾 KDV</div><div class="grid"><div><label>KDV oranı %</label><input id="maKdv" inputmode="decimal" value="'+gir(a.kdv)+'"></div><div><label>Faturasız (X) satışta maliyete eklenen KDV yükü %</label><input id="maKy" inputmode="decimal" value="'+gir(a.kdvYuk)+'"></div></div>'
      +'<div class="shd" style="margin-top:12px">🏭 GİDER</div><label>Gider nereden alınsın?</label><select id="maGk"><option value="sabit"'+(a.giderKaynak!=="aylik"?" selected":"")+'>Sabit ₺/kg (aşağıdaki değerler; ürün kartında değiştirilebilir)</option><option value="aylik"'+(a.giderKaynak==="aylik"?" selected":"")+'>Aylık gerçek (Giderler sekmesindeki seçili ay)</option></select>'
      +'<label>Aylık gerçek için ay</label><select id="maGa"><option value="">— ay seçin —</option>'+ayOpt+'</select>'
      +'<div class="grid"><div><label>Elektrik ₺/kg (sabit)</label><input id="maEl" inputmode="decimal" value="'+gir(a.elektrik)+'"></div><div><label>Genel gider ₺/kg (sabit)</label><input id="maGe" inputmode="decimal" value="'+gir(a.genel)+'"></div></div>'
      +'<button type="button" class="btn b1" id="maKaydet">💾 Ayarları kaydet</button>'}

  /* ---------- tıklamalar ---------- */
  $("malTabs").onclick=function(e){var b=e.target.closest("button[data-s]");if(!b)return;sekme=b.dataset.s;ciz()};
  $("malIc").onclick=function(e){
    var b=e.target.closest("[data-mu],[data-mh],[data-mr],[data-mg],#mkTcmb,#mkElle,#maKaydet");if(!b)return;
    if(b.dataset.mu)return urunAc(b.dataset.mu==="yeni"?null:b.dataset.mu);
    if(b.dataset.mh)return hamAc(b.dataset.mh==="yeni"?null:b.dataset.mh);
    if(b.dataset.mr)return recAc(b.dataset.mr==="yeni"?null:b.dataset.mr);
    if(b.dataset.mg)return giderAc(b.dataset.mg==="yeni"?null:b.dataset.mg);
    if(b.id==="mkTcmb")return kurGetir(false);
    if(b.id==="mkElle"){var ue=n($("mkUe").value),ud=n($("mkUd").value),ee=n($("mkEe").value),ed=n($("mkEd").value);
      if(!(ue||ud)||!(ee||ed))return toast("Dolar ve euro kurunu girin.");
      return yaz("kur",{USD:{efektif:ue||ud,doviz:ud||ue},EUR:{efektif:ee||ed,doviz:ed||ee},tarih:new Date().toLocaleDateString("tr-TR"),kaynak:"elle",z:TS()}).then(function(){toast("✓ Kur kaydedildi")})}
    if(b.id==="maKaydet"){var v={kurTur:$("maKt").value,kdv:n($("maKdv").value),kdvYuk:n($("maKy").value),giderKaynak:$("maGk").value,giderAy:$("maGa").value,elektrik:n($("maEl").value),genel:n($("maGe").value)};
      if(v.giderKaynak==="aylik"&&!v.giderAy)return toast("Aylık gerçek için bir ay seçin (önce Giderler sekmesinden ay ekleyin).");
      return yaz("ayar",v).then(function(){toast("✓ Ayarlar kaydedildi")})}
  };

  /* ---------- ortak pencere ---------- */
  var dlg=document.createElement("dialog");dlg.id="dMal";dlg.style.width="min(560px,96vw)";document.body.appendChild(dlg);
  function pencere(baslik,govde,kaydet,sil,sonra){
    dlg.innerHTML='<h3 style="margin-bottom:8px">'+esc(baslik)+'</h3><div id="mdG">'+govde+'</div><div class="err" id="mdE"></div><div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">'+(sil?'<button type="button" class="btn b5" id="mdSil" style="width:auto">🗑️ Sil</button>':'')+'<button type="button" class="btn b6" id="mdX">Vazgeç</button><button type="button" class="btn b1" id="mdOk">💾 Kaydet</button></div>';
    $("mdX").onclick=function(){dlg.close()};
    $("mdOk").onclick=async function(){$("mdE").textContent="";try{var m=await kaydet();if(m===false)return;dlg.close();toast("✓ Kaydedildi")}catch(e){$("mdE").textContent=e.message||errText(e)}};
    if(sil)$("mdSil").onclick=async function(){if(!confirm("Silinsin mi?"))return;try{await sil();dlg.close();toast("Silindi")}catch(e){$("mdE").textContent=errText(e)}};
    if(sonra)sonra();dlg.showModal()}
  var alan=function(id,et,v,ek){return '<div><label for="'+id+'">'+et+'</label><input id="'+id+'" inputmode="decimal" value="'+esc(gir(v))+'"'+(ek||"")+'></div>'};
  var yazi=function(id,et,v){return '<div class="full"><label for="'+id+'">'+et+'</label><input id="'+id+'" value="'+esc(v||"")+'"></div>'};
  var yeniId=function(p){return db.ref("maliyet/"+p).push().key};

  /* ---------- hammadde ---------- */
  function hamAc(id){var x=id?H[id]:{pb:"USD",kdvDahil:true,yog:0.92};
    pencere(id?"Hammadde: "+x.ad:"Yeni hammadde",'<div class="grid">'+yazi("mhAd","Ad",x.ad)+alan("mhF","Fiyat (kg başı)",x.fiyat)+'<div><label>Para birimi</label><select id="mhPb">'+["USD","EUR","TRY"].map(function(p){return'<option'+(p===(x.pb||"USD")?" selected":"")+'>'+p+'</option>'}).join("")+'</select></div>'
      +'<div class="full"><label class="chip" style="display:flex"><input type="checkbox" id="mhK"'+(x.kdvDahil?" checked":"")+' style="width:auto;margin:0 8px 0 0"> Bu fiyat KDV DAHİL (Excel\'de öyle kabul ediliyordu: fiyat 1,2\'ye bölünüyordu)</label></div>'
      +alan("mhY","Yoğunluk (g/cm³) — HDPE 0,95 · LDPE/LLDPE 0,92 · kalsit 2,0",x.yog)+alan("mhS","Sıra",x.sira)+'</div>',
      async function(){var v={ad:$("mhAd").value.trim(),fiyat:n($("mhF").value),pb:$("mhPb").value,kdvDahil:$("mhK").checked,yog:n($("mhY").value)||0.92,sira:n($("mhS").value),z:TS()};
        if(!v.ad)throw new Error("Ad yazın.");if(!(v.fiyat>0))throw new Error("Fiyat girin.");await yaz("hammadde/"+(id||yeniId("hammadde")),v)},
      id?async function(){var kul=Object.keys(R).filter(function(r){return R[r].b&&+R[r].b[id]>0});if(kul.length)throw new Error("Bu hammadde reçetelerde kullanılıyor: "+kul.map(function(r){return R[r].ad}).join(", "));await yaz("hammadde/"+id,null)}:null)}
  /* ---------- reçete ---------- */
  function recAc(id){var x=id?R[id]:{b:{}},HL=Object.keys(H).sort(function(a,b){return(+H[a].sira||0)-(+H[b].sira||0)});
    if(!HL.length)return toast("Önce hammadde ekleyin.");
    var ciz2=function(){var t=0,inv=0,tl_=0;HL.forEach(function(k){var o=n($("mr_"+k).value);t+=o;if(o>0){inv+=o/100/(+H[k].yog||0.92);tl_+=o/100*hFiyatTL(H[k])}});
      $("mrOz").innerHTML='Toplam <b style="color:'+(Math.abs(t-100)<0.01?"#15803d":"#b91c1c")+'">%'+f2(t,1)+'</b> · yoğunluk '+f2(inv>0?(t/100)/inv:0,3)+' · hammadde '+tl(tl_)+'/kg (KDV hariç)'};
    pencere(id?"Reçete: "+x.ad:"Yeni reçete",'<div class="grid">'+yazi("mrAd","Reçete adı (örn: %50 Kalsitli ABA)",x.ad)+HL.map(function(k){return alan("mr_"+k,esc(H[k].ad)+" %",(x.b||{})[k],' data-mr2="1"')}).join("")+'</div><div class="note" id="mrOz" style="margin-top:8px"></div>',
      async function(){var b={},t=0;HL.forEach(function(k){var o=n($("mr_"+k).value);if(o>0){b[k]=o;t+=o}});var ad_=$("mrAd").value.trim();
        if(!ad_)throw new Error("Ad yazın.");if(Math.abs(t-100)>0.01)throw new Error("Oranların toplamı %100 olmalı (şu an %"+f2(t,1)+").");await yaz("recete/"+(id||yeniId("recete")),{ad:ad_,b:b,z:TS()})},
      id?async function(){var kul=Object.keys(U).filter(function(u){return U[u].recete===id});if(kul.length)throw new Error("Bu reçeteyi kullanan ürünler var: "+kul.map(function(u){return U[u].ad}).join(", "));await yaz("recete/"+id,null)}:null,
      function(){ciz2();$("mdG").addEventListener("input",ciz2)})}
  /* ---------- aylık gider ---------- */
  async function uretimKg(m){ /* o ay depoya giren üretim: iş emirlerindeki «Depoya girişi kaydet» kayıtları */
    try{var s=await db.ref("isEmirleri").once("value"),v=s.val()||{},t=0;Object.keys(v).forEach(function(k){var d=v[k]&&v[k].log&&v[k].log.depo;if(d&&d.zaman&&new Date(+d.zaman).toLocaleDateString("en-CA",{timeZone:"Europe/Istanbul"}).slice(0,7)===m)t+=+d.kg||0});return Math.round(t*100)/100}catch(e){return null}}
  function giderAc(m){var x=m?G[m]:{k:{}},d=new Date(),vm=m||(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"));
    var ciz2=function(){var t=GIDER_K.reduce(function(s,k){return s+n($("mg_"+k[0]).value)},0),kg=n($("mgKe").value)||n($("mgKo").dataset.v);$("mgOz").innerHTML="Toplam <b>"+tl(t,0)+"</b> ÷ "+f2(kg,0)+" kg = <b>"+(kg>0?tl(t/kg):"—")+"/kg</b>"};
    pencere(m?"Giderler: "+ayAd(m):"Yeni ay",'<div class="grid"><div class="full"><label>Ay</label><input id="mgAy" type="month" value="'+esc(vm)+'"'+(m?" disabled":"")+'></div>'+GIDER_K.map(function(k){return alan("mg_"+k[0],k[1]+" (₺, aylık)",(x.k||{})[k[0]])}).join("")
      +'<div class="full"><div class="note" id="mgKo" data-v="'+(+x.kgOto||0)+'">Bu ay depoya giren üretim: <b>'+f2(x.kgOto||0,0)+' kg</b> (iş emirlerinden hesaplanıyor…)</div></div>'+alan("mgKe","Üretim kg'ını elle düzelt (boş = otomatik)",x.kgElle)+'</div><div class="note" id="mgOz" style="margin-top:8px"></div>',
      async function(){var am=$("mgAy").value;if(!/^\d{4}-\d{2}$/.test(am))throw new Error("Ay seçin.");var k={};GIDER_K.forEach(function(g){var v=n($("mg_"+g[0]).value);if(v)k[g[0]]=v});
        await yaz("gider/"+am,{k:k,kgOto:n($("mgKo").dataset.v),kgElle:nb($("mgKe").value),z:TS()})},
      m?async function(){await yaz("gider/"+m,null)}:null,
      async function(){ciz2();$("mdG").addEventListener("input",ciz2);
        var hes=async function(){var am=$("mgAy").value,kg=await uretimKg(am);var b=$("mgKo");if(!b)return;if(kg==null){b.innerHTML="Üretim kg'ı okunamadı, elle girin.";return}b.dataset.v=kg;b.innerHTML="Bu ay ("+esc(ayAd(am))+") depoya giren üretim: <b>"+f2(kg,0)+" kg</b> (iş emirlerindeki depo girişleri)";ciz2()};
        $("mgAy").addEventListener("change",hes);hes()})}
  /* ---------- ürün kartı (canlı hesap) ---------- */
  var UA=[["grup","Grup (fiyat listesinde başlık)","t"],["ad","Ürün adı","t"]];
  function urunAc(id){var x=id?Object.assign({},U[id]):{tur:"adet",kat:2,fire:5,marjF:20,marjX:20,paketAdet:1000};
    var ROpt=Object.keys(R).sort(function(a,b){return String(R[a].ad).localeCompare(String(R[b].ad),"tr")}).map(function(k){return'<option value="'+esc(k)+'"'+(k===x.recete?" selected":"")+'>'+esc(R[k].ad)+'</option>'}).join("");
    var g='<div class="grid">'+yazi("muGr","Grup (fiyat listesinde başlık, örn: ATLET)",x.grup)+yazi("muAd","Ürün adı",x.ad)
      +'<div class="full"><label>Hesap türü</label><select id="muTur">'+TUR.map(function(t){return'<option value="'+t[0]+'"'+(t[0]===x.tur?" selected":"")+'>'+t[1]+'</option>'}).join("")+'</select></div>'
      +'<div class="full"><label>Reçete</label><select id="muRec"><option value="">— seçin —</option>'+ROpt+'</select></div>'
      +'<div class="full mlAd"><div class="shd">📐 ÖLÇÜ (poşet)</div></div>'
      +alan("muEn","En (cm)",x.en,' class="mlAd"')+alan("muBoy","Boy (cm)",x.boy,' class="mlAd"')+alan("muKo","Körük toplamı (cm, 9+9=18)",x.koruk,' class="mlAd"')+alan("muMk","Kalınlık: mikron (tek kat)",x.mikron,' class="mlAd"')
      +'<div class="mlAd"><label>Kat</label><select id="muKat"><option value="2"'+(+x.kat!==1?" selected":"")+'>2 (poşet/torba: ön+arka)</option><option value="1"'+(+x.kat===1?" selected":"")+'>1 (tek kat)</option></select></div>'
      +alan("muDz","Gramaj düzeltmesi % (atlet zımba −10, sap +3)",x.duz,' class="mlAd"')
      +'<div class="full"><div class="shd">📦 PAKET</div></div>'
      +alan("muPa","Paket içi adet (koli içi)",x.paketAdet,' class="mlAd"')+alan("muPk","Paket net kg (rulo/koli)",x.paketKg,' class="mlPk"')
      +alan("muKl","Koli / kutu ₺ (paket başı)",x.koli)+alan("muMs","Masura ₺ (paket başı)",x.masura)+alan("muBc","Bıçak / etiket ₺ (paket başı)",x.bicak)+alan("muPd","Diğer ₺ (paket başı)",x.pDiger)
      +'<div class="full"><div class="shd">🎨 EK MALİYET (kg başı) & GİDER</div></div>'
      +alan("muBy","Boya / masterbatch ₺/kg",x.boya)+alan("muBs","Baskı (mürekkep, solvent) ₺/kg",x.baski)+alan("muEd","Diğer ₺/kg",x.ekDiger)+alan("muFi","Fire %",x.fire)
      +alan("muEl","Elektrik ₺/kg (boş = genel ayar)",x.elektrik)+alan("muGe","Genel gider ₺/kg (boş = genel ayar)",x.genel)
      +'<div class="full"><div class="shd">💰 KÂR</div></div>'+alan("muMf","Kâr % faturalı (+KDV)",x.marjF)+alan("muMx","Kâr % faturasız (X)",x.marjX)
      +'<div class="full"><label>Not</label><input id="muNot" value="'+esc(x.not||"")+'"></div></div>'
      +'<div class="mlSon" id="muSon"></div>'
      +'<div class="note" style="margin-top:8px"><b>🔁 Müşteri fiyatı ile kâr</b><div class="grid" style="margin-top:6px"><div><label>Fiyat</label><input id="muTf" inputmode="decimal" placeholder="örn 2,40"></div><div><label>Birim</label><select id="muTb"><option value="tlkg">₺/kg</option><option value="usdkg">$/kg</option><option value="eurkg">€/kg</option><option value="tlad">₺/adet</option><option value="tlpk">₺/paket</option></select></div><div class="full"><label>Satış türü</label><select id="muTt"><option value="F">Faturalı (+KDV hariç fiyat)</option><option value="X">Faturasız (X)</option></select></div></div><div id="muTs" style="margin-top:6px;font-weight:700"></div></div>';
    var oku=function(){return{grup:$("muGr").value.trim(),ad:$("muAd").value.trim(),tur:$("muTur").value,recete:$("muRec").value,en:nb($("muEn").value),boy:nb($("muBoy").value),koruk:nb($("muKo").value),mikron:nb($("muMk").value),kat:+$("muKat").value,duz:nb($("muDz").value),
      paketAdet:nb($("muPa").value),paketKg:nb($("muPk").value),koli:nb($("muKl").value),masura:nb($("muMs").value),bicak:nb($("muBc").value),pDiger:nb($("muPd").value),boya:nb($("muBy").value),baski:nb($("muBs").value),ekDiger:nb($("muEd").value),fire:nb($("muFi").value),
      elektrik:nb($("muEl").value),genel:nb($("muGe").value),marjF:nb($("muMf").value),marjX:nb($("muMx").value),not:$("muNot").value.trim()}};
    var son=function(){var u=oku(),o=hesap(u),ad_=u.tur==="adet";
      dlg.querySelectorAll(".mlAd").forEach(function(e){(e.closest(".grid > div")||e).classList.toggle("hide",!ad_)});
      dlg.querySelectorAll(".mlPk").forEach(function(e){(e.closest(".grid > div")||e).classList.toggle("hide",ad_)});
      var sat=function(a,b){return'<tr><td>'+a+'</td><td>'+b+'</td></tr>'};
      var t='<table class="mlK">'+sat("Hammadde (yoğunluk "+f2(o.yog,3)+")",tl(o.ham))+sat("Boya / baskı / diğer",tl(o.ek))+sat("Fire",tl(o.fire))+sat("Elektrik",tl(o.elektrik))+sat("Genel gider <small>("+esc(o.giderNot)+")</small>",tl(o.genel))+sat("Paket ("+tl(o.paketTop)+" ÷ "+f2(o.paketKg,2)+" kg)",tl(o.paket))
        +'<tr class="t"><td>MALİYET (KDV hariç) ₺/kg</td><td>'+tl(o.mal)+'</td></tr></table>';
      var cur=function(v){return tl(v)+(o.usd?' · $'+f2(v/o.usd,3):'')+(o.eur?' · €'+f2(v/o.eur,3):'')};
      t+='<div class="mlFy"><div><small>+KDV fiyat (faturalı) /kg</small><b>'+cur(o.fF)+'</b><small>KDV dahil: '+tl(o.fFk)+'</small></div><div><small>X fiyat (faturasız) /kg</small><b>'+cur(o.fX)+'</b></div></div>';
      if(ad_&&o.gramaj>0)t+='<div class="mlFy"><div><small>Gramaj · kg\'dan adet</small><b>'+f2(o.gramaj,3)+' g · '+f2(o.adetKg,1)+' adet/kg</b></div><div><small>Adet fiyatı +KDV / X</small><b>'+f2(o.fF*o.gramaj/1000,4)+' ₺ / '+f2(o.fX*o.gramaj/1000,4)+' ₺</b><small>$'+(o.usd?f2(o.fF*o.gramaj/1000/o.usd,4):"-")+' / $'+(o.usd?f2(o.fX*o.gramaj/1000/o.usd,4):"-")+'</small></div></div>';
      if(o.paketKg>0)t+='<div class="mlFy"><div><small>Paket ('+f2(o.paketKg,2)+' kg) maliyet</small><b>'+tl(o.mal*o.paketKg)+'</b></div><div><small>Paket fiyatı +KDV / X</small><b>'+tl(o.fF*o.paketKg)+' / '+tl(o.fX*o.paketKg)+'</b></div></div>';
      if(o.uyar.length)t+='<div class="err">⚠ '+esc(o.uyar.join(" · "))+'</div>';
      $("muSon").innerHTML=t;
      var p=n($("muTf").value),bi=$("muTb").value,kg=0;
      if(p>0){kg=bi==="tlkg"?p:bi==="usdkg"?p*o.usd:bi==="eurkg"?p*o.eur:bi==="tlad"?(o.gramaj>0?p*1000/o.gramaj:0):(o.paketKg>0?p/o.paketKg:0)}
      if(kg>0&&o.mal>0){var net=$("muTt").value==="X"?kg/(1+ay().kdvYuk/100):kg,k=(net/o.mal-1)*100;$("muTs").innerHTML='= '+tl(kg)+'/kg → kâr <span style="color:'+(k>=0?"#15803d":"#b91c1c")+'">%'+f2(k,1)+'</span> ('+tl(net-o.mal)+'/kg)'}else $("muTs").textContent=""};
    pencere(id?"Ürün: "+(x.ad||""):"Yeni ürün / hızlı hesap",g,
      async function(){var u=oku();if(!u.ad)throw new Error("Ürün adı yazın (yalnız hesaplamak için kaydetmeden «Vazgeç» deyin).");if(!u.recete)throw new Error("Reçete seçin.");
        Object.keys(u).forEach(function(k){if(u[k]==null||u[k]==="")delete u[k]});u.z=TS();await yaz("urun/"+(id||yeniId("urun")),u)},
      id?async function(){await yaz("urun/"+id,null)}:null,
      function(){son();$("mdG").addEventListener("input",son);$("mdG").addEventListener("change",son)})}

  /* ---------- Excel ---------- */
  function xls(){
    if(!window.xlsxYaz)return toast("Excel bileşeni yok.");
    var s=xlsxYaz.sayfa("Fiyat listesi",[38,14,14,14,12,12,11,14,12,15,15],"MAG AMBALAJ — GÜNLÜK FİYAT LİSTESİ","Kur: $ "+f2(kur("USD"),4)+" · € "+f2(kur("EUR"),4)+" · "+(K&&K.tarih||"")+" · hazırlandı "+new Date().toLocaleString("tr-TR"));
    s.baslikSatir(["Ürün","Maliyet ₺/kg","+KDV ₺/kg","X ₺/kg","+KDV $/kg","X $/kg","Adet/kg","+KDV ₺/adet","Paket kg","+KDV ₺/paket","X ₺/paket"]);
    var son="";gruplu().forEach(function(u){var o=hesap(u);if((u.grup||"")!==son){son=u.grup||"";s.bolum(son||"DİĞER")}
      s.satir([u.ad,{v:o.mal,s:"num"},{v:o.fF,s:"num"},{v:o.fX,s:"num"},{v:o.usd?o.fF/o.usd:0,s:"num"},{v:o.usd?o.fX/o.usd:0,s:"num"},{v:o.adetKg||0,s:"int"},{v:o.gramaj?o.fF*o.gramaj/1000:0,s:"num"},{v:o.paketKg||0,s:"num"},{v:o.paketKg?o.fF*o.paketKg:0,s:"num"},{v:o.paketKg?o.fX*o.paketKg:0,s:"num"}])});
    xlsxYaz.indir("fiyat-listesi_"+new Date().toISOString().slice(0,10),[s])}

  /* ---------- Excel'deki değerlerle başlangıç ---------- */
  async function tohum(){
    if(Object.keys(H).length||Object.keys(U).length)return toast("Zaten veri var.");
    if(!confirm("Excel'deki hammadde fiyatları, 7 reçete ve 12 örnek ürün yüklensin mi? Sonra hepsini değiştirebilirsiniz."))return;
    var up={},k=function(p){return db.ref("maliyet/"+p).push().key},hid={};
    [["HDPE",1.85,"USD",true,0.95],["LDPE",2.1,"USD",true,0.92],["LLDPE",1.75,"USD",true,0.92],["Kalsit",0.8,"USD",true,2.0],["Palet streç hammaddesi",1.8,"USD",false,0.92],["Gıda streç hammaddesi",2.4,"USD",false,0.92],["PA/PE",2.4,"EUR",false,1.0],["OPP",2.2,"EUR",false,0.91]]
      .forEach(function(h,i){var id=k("hammadde");hid[h[0]]=id;up["maliyet/hammadde/"+id]={ad:h[0],fiyat:h[1],pb:h[2],kdvDahil:h[3],yog:h[4],sira:i+1}});
    var rid={},rec=function(ad,b){var id=k("recete"),o={};Object.keys(b).forEach(function(x){o[hid[x]]=b[x]});rid[ad]=id;up["maliyet/recete/"+id]={ad:ad,b:o}};
    rec("%50 Kalsitli ABA",{HDPE:20,LLDPE:30,Kalsit:50});rec("%30 Kalsitli HDPE",{HDPE:45,LLDPE:25,Kalsit:30});rec("Orijinal HDPE atlet",{HDPE:70,LLDPE:30});
    rec("Kalsitli HDPE çanta & torba",{HDPE:30,LLDPE:30,Kalsit:40});rec("Orijinal HDPE çanta & torba / rulo",{HDPE:65,LLDPE:35});rec("LDPE torba",{LDPE:65,LLDPE:35});rec("Palet streç",{"Palet streç hammaddesi":100});
    var ur=function(o){up["maliyet/urun/"+k("urun")]=Object.assign({tur:"paket",kat:2,fire:5,marjF:20,marjX:20},o)};
    var bs=17.76; /* Excel: baskı ≈ 0,5$ × kur ÷ 1,4 */
    ur({grup:"ATLET",ad:"KAL. HDPE BASKISIZ ATLET ABA (kg)",recete:rid["%50 Kalsitli ABA"],paketKg:1,elektrik:10,genel:20,fire:4.7});
    ur({grup:"ATLET",ad:"KAL. HDPE BASKILI RENKLİ ATLET ABA (kg)",recete:rid["%50 Kalsitli ABA"],paketKg:1,elektrik:11,genel:20,fire:4.7,baski:bs});
    ur({grup:"ATLET",ad:"KAL. HDPE BASKILI RENKLİ ATLET %30 (kg)",recete:rid["%30 Kalsitli HDPE"],paketKg:1,elektrik:11,genel:20,fire:4,baski:bs});
    ur({grup:"ATLET",ad:"ORJ. HDPE BASKISIZ ŞEFFAF ATLET (kg)",recete:rid["Orijinal HDPE atlet"],paketKg:1,elektrik:10,genel:20,fire:3.3});
    ur({grup:"ATLET",ad:"ORJ. HDPE BASKILI RENKLİ ATLET (kg)",recete:rid["Orijinal HDPE atlet"],paketKg:1,elektrik:11,genel:20,fire:3.3,baski:19.13,marjX:25});
    ur({grup:"ATLET",ad:"ATLET ORJ. 40×40 (adet örneği)",tur:"adet",recete:rid["Orijinal HDPE atlet"],en:40,boy:40,mikron:15,kat:2,duz:-10,paketAdet:1000,elektrik:10,genel:20,fire:3.3});
    ur({grup:"TORBA & ÇANTA",ad:"KAL. HDPE BASKISIZ TORBA&ÇANTA (kg)",recete:rid["Kalsitli HDPE çanta & torba"],paketKg:1,elektrik:10,genel:20,fire:5.2});
    ur({grup:"TORBA & ÇANTA",ad:"ORJ. HDPE BASKILI TORBA&ÇANTA (kg)",recete:rid["Orijinal HDPE çanta & torba / rulo"],paketKg:1,elektrik:11,genel:20,fire:4,baski:16.58,marjX:25});
    ur({grup:"TORBA & ÇANTA",ad:"ORJ. LDPE BASKILI RENKLİ TORBA (kg)",recete:rid["LDPE torba"],paketKg:1,elektrik:11,genel:20,fire:3.7,baski:19.13,marjX:25});
    ur({grup:"RULO",ad:"MAG RULO KÜÇÜK 7KG",recete:rid["Orijinal HDPE çanta & torba / rulo"],paketKg:5.8,koli:25,masura:40,bicak:10,pDiger:85,elektrik:15,genel:0,fire:2.3,marjF:30,marjX:30});
    ur({grup:"RULO",ad:"MAG RULO ORTA 9KG",recete:rid["Orijinal HDPE çanta & torba / rulo"],paketKg:7.6,koli:28,masura:40,bicak:10,pDiger:110,elektrik:15,genel:0,fire:2.4});
    ur({grup:"STREÇ",ad:"PALET STREÇ (17-23 MİC) 2KG",recete:rid["Palet streç"],paketKg:1.6,koli:5,masura:14.4,pDiger:20+2,elektrik:2,genel:0,fire:0});
    try{await db.ref().update(up);toast("✓ Başlangıç verileri yüklendi")}catch(e){toast(errText(e))}}
})();
