/* ===================== MİKRO MUHASEBE ÖZETİ (v159) =====================
   Veri: mikroOzet (yönetim işlemi cari-aktar yazar; kaynak ÖZEL depo mag-yonetim/aktar/mikro-ozet.json — Mikro Excel dışa aktarımları).
   Raporlar ekranına «🧾 Mikro muhasebe özeti» düğmesi (yönetici + Muhasebe). Müşteri kartındaki Mikro kutusu da buradan (mikroCariHtml).
   Program Mikro'ya HİÇBİR ŞEY yazmaz; yalnız okunan raporların özeti. */
(function(){
  var $=function(i){return document.getElementById(i)},e=function(v){return typeof esc==="function"?esc(v):String(v==null?"":v)};
  var tl=function(v,d){v=+v||0;return v.toLocaleString("tr-TR",{maximumFractionDigits:d==null?0:d})+" ₺"};
  var sy=function(v,d){return(+v||0).toLocaleString("tr-TR",{maximumFractionDigits:d==null?0:d})};
  var trd=function(s){return s?String(s).slice(0,10).split("-").reverse().join("."):"-"};
  var AYL=["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"],ayk=function(m){var p=String(m).split("-");return AYL[+p[1]-1]+" "+String(p[0]).slice(2)};
  var DV={USD:"$",EUR:"€",GBP:"£"},dvz=function(o){return Object.keys(o||{}).map(function(k){return sy(o[k],0)+" "+(DV[k]||k)}).join(" · ")};
  var yetki=function(){return typeof rec!=="undefined"&&rec&&rec.onay===true&&(rec.yonetici===true||rec.rol==="Muhasebe")};
  var O=null,OZ=0;
  async function oku(){if(O&&Date.now()-OZ<300000)return O;O=(await db.ref("mikroOzet").once("value")).val();OZ=Date.now();return O}

  /* ---------- müşteri kartındaki Mikro kutusu ---------- */
  var YAS=[["g0","0–30"],["g30","31–60"],["g60","61–90"],["g90","91–120"],["g120","120+"]];
  window.mikroCariHtml=function(c,b){
    var h="";
    if(c.vade)h+='<br>Vade: <b>'+e(c.vade)+'</b>';
    if(c.temsilci)h+=' • Temsilci: '+e(c.temsilci);
    if(c.yetkili)h+='<br>Yetkili: '+e(c.yetkili);
    if(c.urunler&&c.urunler.length)h+='<br><span style="color:#667085">Aldığı ürünler: '+e(c.urunler.join(", "))+'</span>';
    if(!b)return h;
    var dv=b.dvz&&Object.keys(b.dvz).length;
    h+='<div style="margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:6px">'+
      kut("Açık hesap",(dv?"≈ ":"")+tl(b.acik),+b.acik>0?"#b42318":"#16a34a",dv?'TL '+tl(b.tl!=null?b.tl:0)+' + '+dvz(b.dvz)+' (bugünkü kurla yaklaşık)':(b.adat?'adat vadesi '+trd(b.adat):''))+
      kut("Vadesi geçen",tl(b.gecen),+b.gecen>0?"#b42318":"#334155","")+
      (b.ciro!=null?kut("12 ay satış",tl(b.ciro),"#334155",(b.fat?b.fat+" fatura":"")+(b.kg?" • "+sy(b.kg)+" kg":"")):"")+
      (b.tah!=null?kut("12 ay tahsilat",tl(b.tah),"#334155",b.sonTah?"son: "+trd(b.sonTah.t)+" "+tl(b.sonTah.m)+" ("+e(b.sonTah.sek)+")":""):"")+
      ((+b.cek||+b.ciroCek)?kut("Elimizdeki çekleri",tl(+b.cek),"#334155",+b.ciroCek?"+ ciro ettiğimiz, vadesi gelmemiş "+tl(b.ciroCek):""):"")+
      (b.sip?kut("Açık sipariş",b.sip+" kalem","#334155","Mikro'da açık (son 6 ay)"):"")+'</div>';
    var y=b.yas||{},yt=YAS.filter(function(a){return Math.abs(+y[a[0]]||0)>=1});
    if(yt.length)h+='<div style="font-size:12px;margin-top:6px;color:#475467">Vadesi geçen dağılım: '+yt.map(function(a){return a[1]+' gün <b>'+tl(y[a[0]])+'</b>'}).join(" · ")+(+y.gelecek?' · vadesi gelmemiş '+tl(y.gelecek):'')+'</div>';
    if(b.karsiliksiz)h+='<div style="color:#b42318;font-weight:700;margin-top:4px">⚠ Son 1 yılda karşılıksız/iade çek: '+b.karsiliksiz.n+' adet, '+tl(b.karsiliksiz.tut)+'</div>';
    if(b.ay){var A=Object.keys(b.ay).sort(),mx=Math.max.apply(null,A.map(function(m){return Math.abs(+b.ay[m])||0}).concat([1]));
      h+='<div style="display:flex;gap:2px;align-items:flex-end;height:40px;margin-top:8px" title="Aylık satış">'+A.map(function(m){return'<div title="'+ayk(m)+': '+tl(b.ay[m])+'" style="flex:1;background:#2563eb;min-height:1px;height:'+Math.max(2,Math.round(36*Math.abs(b.ay[m])/mx))+'px;border-radius:2px 2px 0 0"></div>'}).join("")+'</div><div style="display:flex;justify-content:space-between;font-size:10px;color:#667085"><span>'+ayk(A[0])+'</span><span>aylık satış</span><span>'+ayk(A[A.length-1])+'</span></div>'}
    return h};
  function kut(b,v,r,a){return'<div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:5px 7px"><small style="color:#667085">'+e(b)+'</small><div style="font-weight:800;color:'+r+'">'+v+'</div>'+(a?'<small style="color:#667085">'+a+'</small>':'')+'</div>'}

  /* ---------- Raporlar › Mikro özeti ---------- */
  var SEK=[["ozet","📊 Özet"],["mus","👥 Müşteriler"],["yas","⏳ Vadesi geçen"],["cek","🧾 Çekler"],["urun","📦 Ürünler"],["alis","🧪 Alış"],["sip","📋 Siparişler"],["gider","🏭 Giderler"],["dem","🏗 Demirbaş"],["eks","❗ Eksikler"]],sek="ozet";
  function dlg(){var d=$("mzDlg");if(d)return d;d=document.createElement("dialog");d.id="mzDlg";d.style.cssText="width:98vw;max-width:980px;border:0;border-radius:14px;padding:0";document.body.appendChild(d);return d}
  function tablo(bas,sat,sag){return'<div style="overflow:auto"><table class="mzT"><thead><tr>'+bas.map(function(b,i){return'<th'+(sag&&sag.indexOf(i)>=0?' style="text-align:right"':'')+'>'+e(b)+'</th>'}).join("")+'</tr></thead><tbody>'+sat.map(function(r){return'<tr>'+r.map(function(c,i){return'<td'+(sag&&sag.indexOf(i)>=0?' style="text-align:right;white-space:nowrap"':'')+'>'+c+'</td>'}).join("")+'</tr>'}).join("")+'</tbody></table></div>'}
  function bar(L,f,renk){var mx=Math.max.apply(null,L.map(function(x){return Math.abs(f(x))||0}).concat([1]));return function(x){return'<div style="height:8px;background:'+(renk||"#2563eb")+';border-radius:4px;width:'+Math.max(1,Math.round(100*Math.abs(f(x))/mx))+'%"></div>'}}
  function ciz(){var d=dlg(),o=O||{};
    var h='<div style="padding:10px 14px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;gap:8px"><div><b style="font-size:17px">🧾 Mikro muhasebe özeti</b><div style="font-size:12px;color:#667085">'+e(o.kaynak||"")+'</div></div><button type="button" id="mzX" style="font-size:22px;background:none;border:0">✕</button></div>'+
      '<div class="mzSek">'+SEK.map(function(s){return'<button type="button" data-s="'+s[0]+'"'+(s[0]===sek?' class="on"':'')+'>'+s[1]+'</button>'}).join("")+'</div><div style="padding:10px 14px;max-height:72vh;overflow:auto">'+icerik(o)+'</div>';
    d.innerHTML=h;if(!d.open)d.showModal();
    $("mzX").onclick=function(){d.close()};
    d.querySelectorAll(".mzSek button").forEach(function(b){b.onclick=function(){sek=b.dataset.s;ciz()}})}
  function icerik(o){
    if(!o||!o.t)return'<div class="empty">Henüz Mikro özeti aktarılmadı.</div>';
    var z=o.ozet||{};
    if(sek==="ozet"){
      var A=Object.keys(o.satisAy||{}).sort(),b1=bar(A,function(m){return o.satisAy[m].m});
      var T=o.tahAy||{},TS=["nakit","havale","cek","kart"],TA={nakit:"Nakit",havale:"Havale/EFT",cek:"Çek",kart:"Kart (POS)"};
      return'<div class="mzK">'+[["12 ay satış (KDV hariç)",tl(z.satis),"faturasız (X) "+tl(z.x)],["12 ay tahsilat",tl(z.tah),"müşterilerden"],["Satılan",sy(z.kg)+" kg",z.fatura+" fatura · "+z.musteri+" müşteri"],["Elimizdeki müşteri çekleri",tl(z.cek),z.cekN+" çek (portföy + tahsilde)"],["Verdiğimiz açık çekler",tl(z.verilen),"vadesi gelmemiş"],["Müşteri alacağı (≈)",tl(o.yas&&o.yas.m&&o.yas.m.top),"vadesi geçen ≈ "+tl(o.yas&&o.yas.m&&o.yas.m.gecen)]].map(function(k){return'<div><small>'+e(k[0])+'</small><b>'+k[1]+'</b><span>'+e(k[2])+'</span></div>'}).join("")+'</div>'+
        '<h4 style="margin:12px 0 4px">Aylık satış ve tahsilat</h4>'+tablo(["Ay","Satış","","Faturasız","Kg","Tahsilat"].concat(TS.map(function(k){return TA[k]})),A.map(function(m){var s=o.satisAy[m],t=T[m]||{},tt=TS.reduce(function(a,k){return a+(+t[k]||0)},0);return[ayk(m),tl(s.m),b1(m),tl(s.x),sy(s.kg),tl(tt)].concat(TS.map(function(k){return t[k]?tl(t[k]):"-"}))}),[1,3,4,5,6,7,8,9])+
        '<div style="font-size:12px;color:#667085;margin-top:4px">Kg: KG birimli satırlar + kolili rulo poşetler (koli kg\'ı ile); adet satılan streç vb. hariç.</div>'}
    if(sek==="mus"){var L=o.musteri||[],b=bar(L,function(x){return x.ciro});
      return'<div style="font-size:13px;color:#667085;margin-bottom:6px">12 ayda en çok satış yapılan '+L.length+' müşteri. Sınıf: cironun ilk %80\'i A, sonraki %15 B, kalan C.</div>'+tablo(["#","Müşteri","Sınıf","12 ay satış","","Tahsilat","Açık hesap","Vadesi geçen"],L.map(function(x,i){return[i+1,e(x.ad),x.sinif||"",tl(x.ciro),b(x),tl(x.tah),tl(x.acik),+x.gecen>0?'<b style="color:#b42318">'+tl(x.gecen)+'</b>':"-"]}),[3,5,6,7])}
    if(sek==="yas"){var y=o.yas||{},m=y.m||{},s=y.s||{},Y=[["g0","0–30 gün"],["g30","31–60"],["g60","61–90"],["g90","91–120"],["g120","120+ gün"],["gelecek","Vadesi gelmemiş"],["top","TOPLAM"]];
      var G=o.geciken||[],tlG=G.filter(function(x){return!x.dvz||!Object.keys(x.dvz).length}),dvG=G.filter(function(x){return x.dvz&&Object.keys(x.dvz).length});
      return'<div style="font-size:13px;color:#667085;margin-bottom:6px">Mikro cari yaşlandırma (24.11.2026). Dövizli carilerde TL karşılığı bugünkü kurla <b>yaklaşık</b>; eski TL ödemeleri eski kurdan olduğu için bu hesaplarda tutar şişik görünebilir.</div>'+
        tablo(["","Müşteriler (bize borçlu)","Tedarikçiler (bizim borcumuz)"],Y.map(function(a){return['<b>'+a[1]+'</b>',tl(m[a[0]]),tl(-(+s[a[0]]||0))]}),[1,2])+
        '<h4 style="margin:12px 0 4px">Vadesi geçen müşteriler — TL hesaplar ('+tlG.length+')</h4>'+tablo(["Müşteri","Sınıf","Vadesi geçen","Toplam","Adat vadesi","Son satış"],tlG.map(function(x){return[e(x.ad),x.sinif||"",'<b style="color:#b42318">'+tl(x.gecen)+'</b>',tl(x.top),trd(x.adat),trd(x.son)]}),[2,3])+
        (dvG.length?'<h4 style="margin:12px 0 4px">Dövizli hesaplar (yaklaşık, muhasebeyle teyit edin) ('+dvG.length+')</h4>'+tablo(["Müşteri","TL bakiye","Döviz bakiye","≈ TL toplam","Adat vadesi","Son satış"],dvG.map(function(x){return[e(x.ad),tl(x.tl),dvz(x.dvz),tl(x.top),trd(x.adat),trd(x.son)]}),[1,2,3]):"")+
        '<h4 style="margin:12px 0 4px">Tedarikçilere borcumuz (en büyük '+(o.tedBorc||[]).length+')</h4>'+tablo(["Tedarikçi","≈ Borç","TL","Döviz","12 ay alış (TL fatura)"],(o.tedBorc||[]).map(function(x){return[e(x.ad),'<b>'+tl(-x.top)+'</b>',tl(-x.tl),dvz(x.dvz),x.alis?tl(x.alis):"-"]}),[1,2,3,4])}
    if(sek==="cek"){var C=o.cekAcik||[],V=o.verilenCek||[],K=o.karsiliksiz||[];
      return'<h4 style="margin:4px 0">Elimizdeki müşteri çekleri — portföyde / bankada tahsilde ('+C.length+' adet, '+tl(C.reduce(function(a,c){return a+c.tut},0))+')</h4>'+tablo(["Vade","Tutar","Veren müşteri","Borçlu","Durum","Banka","Çek no"],C.map(function(c){var g=c.vade<new Date().toISOString().slice(0,10);return[(g?'<b style="color:#b42318">':'')+trd(c.vade)+(g?'</b>':''),tl(c.tut),e(c.ad),e(c.borclu),e(c.poz),e(c.banka),e(c.cekNo)]}),[1])+
        '<h4 style="margin:12px 0 4px">Verdiğimiz çekler — ödenmemiş ('+V.length+')</h4>'+tablo(["Vade","Tutar","Kime","Durum"],V.map(function(c){return[trd(c.vade),tl(c.tut),e(c.chAd||c.ad),e(c.poz)]}),[1])+
        '<h4 style="margin:12px 0 4px">Son 1 yılda karşılıksız / iade çek</h4>'+(K.length?tablo(["Vade","Tutar","Müşteri","Durum"],K.map(function(c){return[trd(c.vade),tl(c.tut),e(c.ad),e(c.poz)]}),[1]):'<div class="empty">Yok ✓</div>')}
    if(sek==="urun"){var U=o.urun||[],bu=bar(U,function(x){return x.tl});
      return'<div style="font-size:13px;color:#667085;margin-bottom:6px">12 ayın satış kalemleri (fatura + irsaliye), ürün bazında. ₺/kg = KDV hariç ortalama satış fiyatı.</div>'+tablo(["Ürün","Satış (≈ ₺)","","Kg","Ort. ₺/kg","Satır"],U.map(function(x){return[e(x.ad),tl(x.tl),bu(x),x.kg?sy(x.kg):"-",x.kgFiyat?sy(x.kgFiyat,2):"-",x.n]}),[1,3,4,5])}
    if(sek==="alis"){var H=o.ham||{},AL=o.alis||[];
      return'<h4 style="margin:4px 0">Hammadde alış fiyatı — son 3 ay (Ağu–Eki 2026) ağırlıklı ortalama, KDV hariç</h4>'+tablo(["Hammadde","$ / kg","Kg ($)","₺ / kg","Kg (₺)","Son alış"],Object.keys(H).map(function(k){var u=H[k].USD||{},t=H[k].TL||{};return[e(k),u.fiyat?sy(u.fiyat,4)+" $":"-",u.kg?sy(u.kg):"-",t.fiyat?sy(t.fiyat,2)+" ₺":"-",t.kg?sy(t.kg):"-",trd(u.son>t.son||!t.son?u.son:t.son)]}),[1,2,3,4])+
        '<div style="font-size:12px;color:#667085">ADET & MALİYET › Hammadde ekranında bu fiyatı tek dokunuşla uygulayabilirsiniz.</div>'+
        '<h4 style="margin:12px 0 4px">12 ayın alışları (stoklu kalemler)</h4>'+tablo(["Kalem","Kg / miktar","₺ (TL faturalar)","$ (dövizli)","Satır"],AL.map(function(x){return[e(x.ad),sy(x.kg),x.tl?tl(x.tl):"-",x.usd?sy(x.usd)+" $":"-",x.n]}),[1,2,3,4])}
    if(sek==="sip"){var S=o.sip||[],yeni=S.filter(function(x){return x.t>="2026-05-01"}),eski=S.length-yeni.length;
      return'<div style="font-size:13px;color:#667085;margin-bottom:6px">Mikro\'da «açık» görünen alınan siparişler. Son 6 ayın '+yeni.length+' satırı aşağıda; '+eski+' satır daha eski tarihli (büyük olasılıkla teslim edilmiş ama Mikro\'da kapatılmamış — muhasebeye kapattırılabilir).</div>'+
        tablo(["Tarih","No","Müşteri","Ürün","Açıklama","Sipariş","Teslim","Kalan","Teslim tarihi"],yeni.map(function(x){return[trd(x.t),e(x.no),e(x.ad),e(x.stok),e(x.ac),sy(x.mik,1)+" "+e(x.br),sy(x.tam,1),'<b>'+sy(x.kalan,1)+'</b>',trd(x.teslim)]}),[5,6,7])}
    if(sek==="gider"){var GA=Object.keys(o.gider||{}).sort(),GK=[["elektrik","⚡ Elektrik"],["dogalgaz","🔥 Doğalgaz/su"],["personel","👷 Personel"],["kira","🏭 Kira"],["nakliye","🚚 Nakliye/araç"],["bakim","🔧 Bakım/onarım"],["diger","📎 Diğer"]];
      var top=function(m){return GK.reduce(function(a,k){return a+(+o.gider[m][k[0]]||0)},0)};
      return'<div style="font-size:13px;color:#667085;margin-bottom:6px">Aylık detaylı mizanların 730/770/780/689 borçlarından (amortisman, geçici vergi, koli-ambalaj, klişe, fason ve KDV gideri hariç). Bu aylar ADET & MALİYET › Giderler\'e de aktarıldı; kg başı gider için ay seçilebilir.</div>'+
        tablo(["Kalem"].concat(GA.map(ayk)),GK.map(function(k){return['<b>'+k[1]+'</b>'].concat(GA.map(function(m){return o.gider[m][k[0]]?tl(o.gider[m][k[0]]):"-"}))}).concat([['<b>TOPLAM</b>'].concat(GA.map(function(m){return'<b>'+tl(top(m))+'</b>'}))],[['Satılan kg'].concat(GA.map(function(m){return sy((o.satisAy[m]||{}).kg)}))],[['≈ ₺/kg'].concat(GA.map(function(m){var k=(o.satisAy[m]||{}).kg;return k?sy(top(m)/k,2):"-"}))]),GA.map(function(x,i){return i+1}))+
        GA.map(function(m){var D=(o.giderDetay||{})[m]||[];return'<details style="margin-top:6px"><summary>'+ayk(m)+' hesap dökümü ('+D.length+')</summary>'+tablo(["Hesap","Ad","Borç","Kalem"],D.map(function(x){return[e(x.kod),e(x.ad),tl(x.tut),x.haric?'<i>hariç</i>':e(x.k)]}),[2])+'</details>'}).join("")}
    if(sek==="dem"){var DM=o.demirbas||[],AM=o.amortisman||[];
      return'<div style="font-size:13px;color:#667085;margin-bottom:6px">Mikro demirbaş fihristi. Yıllık amortisman = maliyet bedeli × oran (normal amortisman).</div>'+tablo(["Kod","Demirbaş","Alış","Bedel","Oran %","Yıllık amortisman"],DM.map(function(x){return[e(x.kod),e(x.ad),trd(x.t),tl(x.bedel),sy(x.oran),tl(x.yillik)]}),[3,4,5])+
        '<div style="margin-top:6px;font-weight:700">Toplam bedel '+tl(DM.reduce(function(a,x){return a+x.bedel},0))+' · yıllık amortisman ≈ '+tl(DM.reduce(function(a,x){return a+x.yillik},0))+'</div>'+
        (AM.length?'<h4 style="margin:12px 0 4px">2026 amortisman raporu</h4>'+tablo(["Kod","Ad","Ay","Dönem","Birikmiş"],AM.map(function(x){return[e(x.kod),e(x.ad),e(x.ay),tl(x.donem),tl(x.birikmis)]}),[3,4]):"")}
    if(sek==="eks")return'<div style="font-size:14px">Muhasebeden gelen dosyalarda eksik / dikkat edilecekler:</div><ul>'+(o.eksik||[]).map(function(x){return'<li style="margin:6px 0">'+e(x)+'</li>'}).join("")+'</ul>';
    return""}
  window.mikroOzetAc=async function(){if(!yetki()){alert("Bu bölüm yalnız yönetici ve muhasebe içindir.");return}
    try{await oku()}catch(er){alert("Okunamadı: "+(er&&er.message||er));return}ciz()};
  /* Raporlar ekranına düğme */
  function dugme(){var p=$("pRap"),i=$("irAc1");if(!p||!i||$("mzAc"))return;var b=document.createElement("button");b.type="button";b.id="mzAc";b.className="btn b6 rprod";
    b.innerHTML='<span>🧾</span><div><b>Mikro muhasebe özeti</b><small>Satış · tahsilat · çek · vadesi geçen · gider</small></div>';b.onclick=window.mikroOzetAc;i.parentNode.insertBefore(b,i.nextSibling)}
  var ra=window.rapAc;window.rapAc=function(){dugme();var b=$("mzAc");if(b)b.style.display=yetki()?"":"none";return ra&&ra.apply(this,arguments)};
  if(document.readyState!=="loading")dugme();else document.addEventListener("DOMContentLoaded",dugme);
  /* ADET & MALİYET › hammadde: Mikro alış fiyatı önerisi */
  window.mikroHamFiyat=async function(){try{return((await oku())||{}).ham||{}}catch(er){return{}}};
})();
