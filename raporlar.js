/* ===================== RAPORLAR ===================== */
(function(){
  var g=function(i){return document.getElementById(i)},cur=null,all=false,allC=false,tab="ozet";
  var AY=function(k){return new Date(k+"-15T12:00:00Z").toLocaleDateString("tr-TR",{month:"long",year:"numeric",timeZone:"UTC"})};
  var iso=function(d){return new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
  var musKey=function(m){m=String(m==null?"":m).replace(/\s+/g," ").trim();return(!m||m==="Etikete Bakınız")?"(Müşteri belirtilmemiş)":m.toLocaleUpperCase("tr-TR")};
  var arr=function(v){return Array.isArray(v)?v.filter(Boolean):Object.values(v||{})};
  function aralik(){var v=g("rpS").value,n=new Date(),y=n.getFullYear(),m=n.getMonth();
    if(v==="ay")return[iso(new Date(y,m,1)),iso(n)];
    if(v==="gecen")return[iso(new Date(y,m-1,1)),iso(new Date(y,m,0))];
    if(v==="3")return[iso(new Date(y,m-2,1)),iso(n)];
    if(v==="6")return[iso(new Date(y,m-5,1)),iso(n)];
    if(v==="yil")return[y+"-01-01",iso(n)];
    return[g("rpA").value,g("rpB").value]}
  window.rapAc=function(){g("rpC").classList.toggle("hide",g("rpS").value!=="ozel");if(!cur&&!g("rpO").innerHTML)g("rpO").innerHTML='<div class="rbos"><i>📊</i><b>Rapor henüz hazırlanmadı</b><span>Yukarıdan dönemi seçip «Raporu getir» düğmesine basın.</span></div>'};
  g("rpS").onchange=function(){g("rpC").classList.toggle("hide",g("rpS").value!=="ozel")};

  function aylar(f,t){var o=[],p=f.split("-").map(Number),q=t.split("-").map(Number),y=p[0],m=p[1];
    while(y<q[0]||(y===q[0]&&m<=q[1])){o.push(y+"-"+String(m).padStart(2,"0"));m++;if(m>12){m=1;y++}}return o}

  async function getir(){
    var r=aralik(),f=r[0],t=r[1],adm=isAdmin();
    if(!/^\d{4}-\d\d-\d\d$/.test(f)||!/^\d{4}-\d\d-\d\d$/.test(t)||f>t){g("rpE").textContent="Geçerli bir başlangıç ve bitiş tarihi seçin.";return}
    if(aylar(f,t).length>36){g("rpE").textContent="En fazla 36 aylık dönem seçebilirsiniz.";return}
    g("rpE").textContent="";g("rpOk").disabled=true;g("rpO").innerHTML='<div class="empty">Veriler yükleniyor...</div>';
    var fMs=new Date(f+"T00:00:00").getTime(),tMs=new Date(t+"T23:59:59").getTime(),D=0;
    try{
      var rd=function(p){return p.once("value").then(function(s){return s.val()||{}})};
      var X=await Promise.all([
        rd(db.ref("isEmirleri").orderByChild("eklenmeTarihi").startAt(fMs-180*864e5)),
        rd(db.ref("urunler")),
        rd(db.ref("dosyalar").orderByChild("onayTarihi").startAt(fMs-7*864e5)),
        rd(db.ref("stokHareket").orderByChild("zaman").startAt(fMs).endAt(tMs)),
        rd(db.ref("stokKalem")),
        adm?rd(db.ref("siparisler")):Promise.resolve({})]);
      D={is:X[0],urn:X[1],dos:X[2],har:X[3],kal:X[4],sip:X[5]};
    }catch(e){g("rpO").innerHTML='<div class="empty">Okunamadı: '+esc(errText(e))+'</div>';g("rpOk").disabled=false;return}
    cur=hesapla(D,f,t,adm);cur.f=f;cur.t=t;cur.adm=adm;cur.z=Date.now();tab="ozet";all=false;allC=false;ciz();g("rpOk").disabled=false;g("rpCsv").classList.remove("hide");g("rpPdf").classList.remove("hide")}

  function hesapla(D,f,t,adm){
    var inR=function(d){return d>=f&&d<=t},ms=aylar(f,t),A={};
    ms.forEach(function(k){A[k]={ek:0,ba:0,ke:0,de:0,pk:0,n:0,sk:0,sat:0,tuk:0,alim:0}});
    var T={ek:0,ba:0,ke:0,de:0,pk:0,n:0,sk:0,sat:0,tuk:0,alim:0,iade:0,fysiz:0,fyli:0,mfysiz:0};
    /* 1) Üretim: iş emri aşama kayıtları */
    /* v112: «Depoya giren» yalnız GERÇEKTEN var olan işleri sayar. Dosyalar/sevk kayıtları silinince ya da aşama geri alınınca
       iş emrindeki eski depo kaydı kalıyordu ve rapor onu hâlâ topluyordu. Artık: iş emri hâlâ BİTEN'de bekliyorsa VEYA
       aktardığı ürünlerden en az biri Hazır Ürünler/Sevk/Dosyalar'da duruyorsa sayılır. */
    var var_={};
    Object.keys(D.urn).concat(Object.keys(D.dos)).forEach(function(k){var u=D.urn[k]||D.dos[k]||{};
      if(u.isEmriId)var_["i:"+u.isEmriId]=1;if(u.isEmriNo)var_["n:"+u.isEmriNo]=1;var_["k:"+k]=1});
    var gercek=function(id,e){if(e.aktarildi){
        if(e.aktarKeys&&Object.keys(e.aktarKeys).some(function(k){return var_["k:"+k]}))return true;
        return !!(var_["i:"+id]||(e.no&&var_["n:"+e.no]))}
      return e.asama==="bitti"};
    Object.keys(D.is).forEach(function(id){var e=D.is[id],lg=e.log||{};
      [["ekstruder","ek"],["baski","ba"],["kesim","ke"],["depo","de"]].forEach(function(s){var x=lg[s[0]];if(!x||!x.zaman)return;
        var d=dKey(x.zaman);if(!inR(d))return;
        if(s[0]==="depo"&&!gercek(id,e))return;
        var a=A[d.slice(0,7)],kg=+x.kg||0;a[s[1]]+=kg;T[s[1]]+=kg;
        if(s[0]==="depo"){a.pk+=+x.paket||0;T.pk+=+x.paket||0;a.n++;T.n++}})});
    /* 2) Müşteri bazlı sevk (sevk edilmiş + dosyalanmış; iade fişleri ayrı) */
    var S={},seen={};
    Object.keys(D.urn).map(function(k){return Object.assign({id:k},D.urn[k])}).filter(function(u){return u.durum==="sevk_edildi"})
      .concat(Object.keys(D.dos).map(function(k){return Object.assign({id:k},D.dos[k])})).forEach(function(u){
        if(seen[u.id])return;seen[u.id]=1;var d=dTarih(u);if(!d||!inR(d))return;
        if(u.irsTur==="iade"){T.iade++;return}
        var key=musKey(u.musteri),o=S[key]||(S[key]={ad:key,n:0,kg:0,pk:0,h:0,fyli:0}),a=A[d.slice(0,7)],kg=+u.kg||0;
        o.n++;o.kg+=kg;o.pk+=+u.paket||0;a.sk+=kg;T.sk+=kg;
        if(adm){var v=sevkTop(u);if(v){o.h+=v.h;o.fyli++;a.sat+=v.h;T.sat+=v.h;T.fyli++}else T.fysiz++}});
    /* 3) Alış fiyatları (siparişlerden): kalem+birim → [{t,h}] */
    var P={};
    if(adm)Object.keys(D.sip).forEach(function(id){var o=D.sip[id],pf=(fyat.siparis||{})[id];if(!pf||!pf.f)return;
      arr(o.satirlar).forEach(function(x,i){var p=pf.f[i];if(p==null||!x.kalemId)return;var k=x.kalemId+"|"+x.birim;
        (P[k]=P[k]||[]).push({t:o.eklenmeTarihi||0,h:kdvHesap({tutar:+p,kdv:pf.kdv,kdvDahil:pf.kdvDahil},1).h})})});
    Object.keys(P).forEach(function(k){P[k].sort(function(a,b){return a.t-b.t})});
    var fiyatAt=function(kid,u,ts){var L=P[kid+"|"+u];if(!L||!L.length)return null;var r=null;
      for(var i=0;i<L.length;i++){if(L[i].t<=ts)r=L[i];else break}return(r||L[0]).h};
    /* 4) Malzeme tüketimi: stok çıkışları */
    var C={},KT={};
    Object.keys(D.har).forEach(function(id){var h=D.har[id];if(h.tip==="giris")return;var d=dKey(h.zaman);if(!inR(d))return;
      var k=D.kal[h.kalemId],mik=h.mik&&typeof h.mik==="object"?h.mik:null;
      if(!mik&&h.miktar)mik={[(UN.find(function(x){return k&&x[1]===k.birim})||UN[0])[0]]:+h.miktar};if(!mik)return;
      var key=h.kalemId||h.ad,o=C[key]||(C[key]={ad:(k&&k.ad)||h.ad||"?",eb:(k&&k.ebat)||"",kat:(k&&k.kategori)||"Diğer",q:{},n:0,tut:0,fysiz:false,tq:0});
      o.n++;var a=A[d.slice(0,7)];
      Object.keys(mik).forEach(function(u){var q=+mik[u]||0;if(!(q>0))return;o.q[u]=(o.q[u]||0)+q;o.tq+=q;
        if(adm){var p=fiyatAt(h.kalemId,u,h.zaman||0);if(p==null)o.fysiz=true;else{o.tut+=q*p;a.tuk+=q*p;T.tuk+=q*p;KT[o.kat]=(KT[o.kat]||0)+q*p}}})});
    if(adm)Object.keys(C).forEach(function(k){if(C[k].fysiz)T.mfysiz++});
    /* 5) Dönem alımı (teslim alınan) + mevcut stok değeri */
    var SV=0,SVn=0;
    if(adm){Object.keys(D.sip).forEach(function(id){var o=D.sip[id],pf=(fyat.siparis||{})[id];if(!pf||!pf.f)return;
        var d=dKey(o.teslimTarihi||o.eklenmeTarihi||0);if(!inR(d))return;
        arr(o.satirlar).forEach(function(x,i){var p=pf.f[i],q=+x.gelen||0;if(p==null||!(q>0))return;
          var v=kdvHesap({tutar:+p,kdv:pf.kdv,kdvDahil:pf.kdvDahil},q).h;A[d.slice(0,7)].alim+=v;T.alim+=v})});
      Object.keys(D.kal).forEach(function(id){var k=D.kal[id],n=norm(k).mik;Object.keys(n).forEach(function(u){var q=+n[u]||0;if(!(q>0))return;
        var L=P[id+"|"+u];if(L&&L.length){SV+=q*L[L.length-1].h;SVn++}})})}
    return{ms:ms,A:A,T:T,S:Object.keys(S).map(function(k){return S[k]}).sort(function(a,b){return b.kg-a.kg}),
      C:Object.keys(C).map(function(k){return C[k]}).sort(function(a,b){return adm?(b.tut-a.tut)||(b.n-a.n):(b.n-a.n)}),
      KT:Object.keys(KT).map(function(k){return{ad:k,tut:KT[k]}}).sort(function(a,b){return b.tut-a.tut}),SV:SV,SVn:SVn}}
  /* ============ Görünüm (v110): sekmeli, kartlı, okunaklı ============ */
  var qtxt=function(q){return UN.filter(function(u){return u[0] in q}).map(function(u){return fmt(q[u[0]])+" "+u[1].toLowerCase()}).join(" · ")};
  var tl=function(n){return fmt(n)+" ₺"};
  var r2=function(v){return Math.round((+v||0)*100)/100};
  var bar=function(v,m){return'<div class="rb"><i style="width:'+(m>0?Math.max(2,Math.round(v/m*100)):0)+'%"></i></div>'};
  var pay=function(a,b){return b>0?fmt(a/b*100)+"%":"-"};
  var zamanTxt=function(ms){return new Date(ms||Date.now()).toLocaleString("tr-TR",{timeZone:TRZ,day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})};
  var kpi=function(c,ik,et,v,u,alt){return'<div class="rk c'+c+'"><span class="rkl">'+ik+' '+esc(et)+'</span><b>'+v+(u?'<u>'+esc(u)+'</u>':"")+'</b>'+(alt?'<small>'+alt+'</small>':"")+'</div>'};
  var kart=function(bsl,ic){return'<div class="item rcard"><h4 class="rh">'+bsl+'</h4>'+ic+'</div>'};
  var bosK=function(ik,t){return'<div class="rbos"><i>'+ik+'</i><b>'+esc(t)+'</b></div>'};
  var nt=function(t){return'<div class="rn">ⓘ '+t+'</div>'};
  var tbl=function(bas,satir,top,cls){return'<div class="rw"><table class="rt'+(cls?" "+cls:"")+'"><thead><tr>'+bas.map(function(h){return'<th>'+esc(h)+'</th>'}).join("")+'</tr></thead><tbody>'+satir.join("")+(top||"")+'</tbody></table></div>'};
  var topSatir=function(i,ad,alt,deg,bw){return'<div class="rtr"><i class="rrk">'+(i+1)+'</i><div class="rtx"><b>'+esc(ad)+'</b>'+(alt?'<small>'+esc(alt)+'</small>':"")+bw+'</div><span>'+deg+'</span></div>'};
  var gitBtn=function(t,y){return'<button type="button" class="rgit" data-t="'+t+'">'+esc(y)+' →</button>'};

  function tabOzet(R){
    var T=R.T,adm=R.adm,o="",mx=Math.max.apply(null,R.ms.map(function(k){return R.A[k].de}).concat([0]));
    o+=kart("Genel görünüm",'<div class="rg">'
      +kpi(1,"🏭","Depoya giren (üretilen)",esc(fmt(T.de)),"kg",esc(fmt(T.pk))+" paket · "+T.n+" iş emri")
      +kpi(2,"🧪","Ekstruder film",esc(fmt(T.ek)),"kg","Baskı "+esc(fmt(T.ba))+" · Kesim "+esc(fmt(T.ke))+" kg")
      +kpi(3,"🚚","Sevk edilen",esc(fmt(T.sk)),"kg",R.S.length+" müşteri")
      +(adm?kpi(4,"💵","Satış (KDV hariç)",esc(fmt(T.sat)),"₺",T.fysiz?T.fysiz+" sevkte fiyat yok":"Fiyatı girilen sevklerden")
           :kpi(4,"📦","Tüketilen malzeme",String(R.C.length),"kalem","Stok çıkışı olan kalem"))+'</div>');
    if(adm){var fark=T.sat-T.tuk,kg=T.de;
      o+=kart("Mali özet (KDV hariç)",'<div class="rg">'
        +kpi(5,"🧾","Malzeme maliyeti",esc(fmt(T.tuk)),"₺","Tüketilen stok çıkışları")
        +kpi(fark<0?6:4,"📈","Satış − malzeme",esc(fmt(fark)),"₺","Brüt gösterge")
        +kpi(3,"⚖️","Kg başına malzeme",kg>0?esc(fmt(T.tuk/kg)):"-","₺/kg","Üretilen kg'a göre")
        +kpi(2,"🛒","Dönem alımı",esc(fmt(T.alim)),"₺","Teslim alınan siparişler")+'</div>')}
    if(R.ms.length>1)o+=kart("Aylık üretim (kg)",'<div class="rmc">'+R.ms.map(function(k){var a=R.A[k];return'<div class="rmr"><span>'+esc(AY(k))+'</span>'+bar(a.de,mx)+'<b>'+esc(fmt(a.de))+'</b></div>'}).join("")+'</div>');
    var sm=R.S.length?R.S[0].kg:0,cm=R.C.length?(adm?R.C[0].tut:R.C[0].n):0;
    o+=kart("En çok sevk edilen müşteriler",R.S.length?R.S.slice(0,3).map(function(s,i){return topSatir(i,s.ad,s.n+" sevk",'<b>'+esc(fmt(s.kg))+'</b> kg',bar(s.kg,sm))}).join("")+gitBtn("sevk","Tüm müşteriler"):bosK("🚚","Bu dönemde sevk kaydı yok"));
    o+=kart("En çok tüketilen malzemeler",R.C.length?R.C.slice(0,3).map(function(c,i){return topSatir(i,c.ad+(c.eb?" · "+c.eb:""),c.kat,'<b>'+esc(qtxt(c.q))+'</b>',bar(adm?c.tut:c.n,cm))}).join("")+gitBtn("malz","Tüm malzemeler"):bosK("📦","Bu dönemde stok çıkışı yok"));
    return o}

  function tabUretim(R){
    var T=R.T,mx=Math.max.apply(null,R.ms.map(function(k){return R.A[k].de}).concat([0]));
    return kart("Aylık üretim (kg)",tbl(["Ay","Ekstruder","Baskı","Kesim","Depo","Paket","İş emri"],
      R.ms.map(function(k){var a=R.A[k];return'<tr><td>'+esc(AY(k))+bar(a.de,mx)+'</td><td>'+esc(fmt(a.ek))+'</td><td>'+esc(fmt(a.ba))+'</td><td>'+esc(fmt(a.ke))+'</td><td><b>'+esc(fmt(a.de))+'</b></td><td>'+esc(fmt(a.pk))+'</td><td>'+a.n+'</td></tr>'}),
      '<tr class="tp"><td>Toplam</td><td>'+esc(fmt(T.ek))+'</td><td>'+esc(fmt(T.ba))+'</td><td>'+esc(fmt(T.ke))+'</td><td>'+esc(fmt(T.de))+'</td><td>'+esc(fmt(T.pk))+'</td><td>'+T.n+'</td></tr>')
      +nt("Kg değerleri, her aşamada «Bitti» denirken girilen miktarlardır; ilgili ayın tarihine göre toplanır."))}

  function tabSevk(R){
    var T=R.T,adm=R.adm,sm=R.S.length?R.S[0].kg:0,lim=all?R.S.length:15;
    var o='<div class="rg">'+kpi(3,"🚚","Sevk edilen",esc(fmt(T.sk)),"kg",R.S.length+" müşteri")
      +(adm?kpi(4,"💵","Tutar (KDV hariç)",esc(fmt(T.sat)),"₺",T.fysiz?T.fysiz+" sevkte fiyat yok":"Tüm sevklerde fiyat var"):kpi(1,"📦","Paket",esc(fmt(R.S.reduce(function(a,s){return a+s.pk},0))),"","Sevk edilen paket"))+'</div>';
    if(!R.S.length)return o+kart("Müşteri bazlı sevk",bosK("🚚","Bu dönemde sevk kaydı yok"));
    o+=kart("Müşteri bazlı sevk",tbl(["#","Müşteri","Sevk","Kg","Paket","Pay"].concat(adm?["Tutar (KDV hariç)"]:[]),
      R.S.slice(0,lim).map(function(s,i){return'<tr><td class="rno">'+(i+1)+'</td><td>'+esc(s.ad)+bar(s.kg,sm)+'</td><td>'+s.n+'</td><td><b>'+esc(fmt(s.kg))+'</b></td><td>'+esc(fmt(s.pk))+'</td><td>'+esc(pay(s.kg,T.sk))+'</td>'+(adm?'<td>'+(s.fyli?esc(fmt(s.h)):"-")+'</td>':"")+'</tr>'}),
      '<tr class="tp"><td></td><td>Toplam ('+R.S.length+' müşteri)</td><td>'+R.S.reduce(function(a,s){return a+s.n},0)+'</td><td>'+esc(fmt(T.sk))+'</td><td>'+esc(fmt(R.S.reduce(function(a,s){return a+s.pk},0)))+'</td><td>%100</td>'+(adm?'<td>'+esc(fmt(T.sat))+'</td>':"")+'</tr>',"rt2")
      +(R.S.length>15?'<button class="btn b6 sm rall" type="button" id="rpAll">'+(all?"İlk 15'i göster":"Tümünü göster ("+R.S.length+")")+'</button>':"")
      +nt("Sevk tarihi: irsaliye/teslim tarihi. "+(T.iade?T.iade+" iade kaydı toplamlara dahil edilmedi.":"")));
    if(adm&&T.fysiz)o+='<div class="rwarn">'+T.fysiz+' sevk kaydında fiyat girilmemiş; tutar toplamına dahil değil.</div>';
    return o}

  function tabMalz(R){
    var adm=R.adm,lim=allC?R.C.length:15,cl=R.C.slice(0,lim),cm=R.C.length?(adm?R.C[0].tut:R.C[0].n):0;
    if(!R.C.length)return kart("Tüketilen malzemeler",bosK("📦","Bu dönemde stok çıkışı yok"));
    return kart("Tüketilen malzemeler",tbl(["#","Malzeme","Tüketim","Çıkış"].concat(adm?["Tutar (KDV hariç)"]:[]),
      cl.map(function(c,i){return'<tr><td class="rno">'+(i+1)+'</td><td>'+esc(c.ad)+(c.eb?' · '+esc(c.eb):"")+'<div class="rsub">'+esc(c.kat)+'</div>'+bar(adm?c.tut:c.n,cm)+'</td><td>'+esc(qtxt(c.q))+'</td><td>'+c.n+'</td>'+(adm?'<td>'+(c.tut?esc(fmt(c.tut)):"-")+(c.fysiz?" ⚠️":"")+'</td>':"")+'</tr>'}),"","rt2")
      +(R.C.length>15?'<button class="btn b6 sm rall" type="button" id="rpAllC">'+(allC?"İlk 15'i göster":"Tümünü göster ("+R.C.length+")")+'</button>':"")
      +nt((R.C.length>15&&!allC?"İlk 15 malzeme gösteriliyor ("+R.C.length+" kalem tüketildi). ":"")+"Stok çıkışı olarak kaydedilen hareketlerden hesaplanır."+(adm?" ⚠️ = bazı çıkışların fiyatı bulunamadı.":"")))}

  function tabMali(R){
    var T=R.T,kg=T.de,pk=kg>0?T.tuk/kg:0,fark=T.sat-T.tuk;
    var o='<div class="rg">'
      +kpi(5,"🧾","Malzeme maliyeti",esc(fmt(T.tuk)),"₺","Tüketilen malzeme")
      +kpi(fark<0?6:4,"📈","Satış − malzeme",esc(fmt(fark)),"₺","Brüt gösterge")
      +kpi(3,"⚖️","Kg başına malzeme",kg>0?esc(fmt(pk)):"-","₺/kg","Üretilen kg'a göre")
      +kpi(2,"🛒","Dönem alımı",esc(fmt(T.alim)),"₺","Teslim alınan")+'</div>';
    o+=kart("Aylık maliyet ve satış (₺, KDV hariç)",tbl(["Ay","Malzeme","Alım","Satış","Fark"],
      R.ms.map(function(k){var a=R.A[k],f=a.sat-a.tuk;return'<tr><td>'+esc(AY(k))+'</td><td>'+esc(fmt(a.tuk))+'</td><td>'+esc(fmt(a.alim))+'</td><td>'+esc(fmt(a.sat))+'</td><td class="'+(f<0?"rneg":"rpos")+'">'+esc(fmt(f))+'</td></tr>'}),
      '<tr class="tp"><td>Toplam</td><td>'+esc(fmt(T.tuk))+'</td><td>'+esc(fmt(T.alim))+'</td><td>'+esc(fmt(T.sat))+'</td><td class="'+(fark<0?"rneg":"rpos")+'">'+esc(fmt(fark))+'</td></tr>'));
    if(R.KT.length)o+=kart("Kategoriye göre malzeme maliyeti",tbl(["Kategori","Tutar (₺)","Pay"],
      R.KT.map(function(k){return'<tr><td>'+esc(k.ad)+bar(k.tut,R.KT[0].tut)+'</td><td>'+esc(fmt(k.tut))+'</td><td>%'+(T.tuk>0?esc(fmt(k.tut/T.tuk*100)):0)+'</td></tr>'})));
    o+=nt("Mevcut stok değeri (son alış fiyatlarıyla): <b>"+esc(tl(R.SV))+"</b>"+(R.SVn?" ("+R.SVn+" kalem/birim)":""));
    o+='<div class="rwarn">Malzeme maliyeti, tüketim tarihindeki en yakın önceki sipariş fiyatından hesaplanır. İşçilik, enerji ve hammadde dışı giderler dahil değildir; «Satış − malzeme» brüt bir göstergedir.'+(T.mfysiz?" "+T.mfysiz+" malzemede fiyat bulunamadı, maliyete eklenmedi.":"")+'</div>';
    return o}

  function ciz(){
    var R=cur,Ts=[["ozet","📊 Özet"],["uretim","🏭 Üretim"],["sevk","🚚 Sevk"],["malz","📦 Malzeme"]];if(R.adm)Ts.push(["mali","💰 Maliyet"]);
    if(!Ts.some(function(x){return x[0]===tab}))tab="ozet";
    var o='<div class="rhead"><div class="rdon">📅 '+esc(trDate(R.f))+' – '+esc(trDate(R.t))+'</div><div class="rzm">Hazırlanma: '+esc(zamanTxt(R.z))+'</div></div>'
      +'<div class="rtabs" id="rpT">'+Ts.map(function(x){return'<button type="button" data-t="'+x[0]+'"'+(x[0]===tab?' class="on"':"")+'>'+x[1]+'</button>'}).join("")+'</div>';
    o+=tab==="uretim"?tabUretim(R):tab==="sevk"?tabSevk(R):tab==="malz"?tabMalz(R):tab==="mali"?tabMali(R):tabOzet(R);
    g("rpO").innerHTML=o}
  g("rpO").onclick=function(ev){
    var b=ev.target.closest("[data-t]");if(b&&cur){tab=b.dataset.t;ciz();var t=g("rpT");if(t&&t.scrollIntoView)t.scrollIntoView({block:"nearest"});return}
    if(ev.target.closest("#rpAll")){all=!all;ciz();return}
    if(ev.target.closest("#rpAllC")){allC=!allC;ciz()}};

  /* ============ Excel (.xlsx) — biçimli, çok sayfalı ============ */
  function excel(){
    if(!cur)return;var X=window.xlsxYaz;if(!X){toast("Excel bileşeni yüklenemedi. Sayfayı yenileyin.");return}
    try{
      var R=cur,T=R.T,adm=R.adm,alt="Dönem: "+trDate(R.f)+" – "+trDate(R.t)+"  ·  Hazırlanma: "+zamanTxt(R.z),sh=[];
      /* 1) Özet */
      var s=X.sayfa("Özet",[42,22,54],"MAG AMBALAJ — Rapor Özeti",alt);
      var kv=function(a,v,st,ac){s.satir([{v:a,s:"kl"},{v:v,s:st},{v:ac||"",s:"ac"}])};
      s.bolum("ÜRETİM VE SEVK");s.baslikSatir(["Gösterge","Değer","Açıklama"],[0,2]);s.dondur=0;
      kv("Depoya giren (üretilen)",r2(T.de),"kvNum","kg · "+r2(T.pk)+" paket · "+T.n+" iş emri");
      kv("Ekstruder film",r2(T.ek),"kvNum","kg");
      kv("Baskı",r2(T.ba),"kvNum","kg");
      kv("Kesim",r2(T.ke),"kvNum","kg");
      kv("Sevk edilen",r2(T.sk),"kvNum","kg · "+R.S.length+" müşteri");
      kv("Tüketilen malzeme",R.C.length,"kvInt","kalem (stok çıkışı olan)");
      if(adm){s.bos();s.bolum("MALİ ÖZET (KDV HARİÇ)");s.baslikSatir(["Gösterge","Değer","Açıklama"],[0,2]);s.dondur=0;
        kv("Satış",r2(T.sat),"kvTl",T.fysiz?T.fysiz+" sevk kaydında fiyat girilmemiş":"Fiyatı girilen sevklerden");
        kv("Tüketilen malzeme maliyeti",r2(T.tuk),"kvTl","Tüketim tarihindeki en yakın önceki sipariş fiyatı");
        kv("Satış − malzeme",r2(T.sat-T.tuk),"kvTl","Brüt gösterge");
        kv("Üretilen kg başına malzeme",r2(T.de>0?T.tuk/T.de:0),"kvTl","₺ / kg");
        kv("Dönem alımı (teslim alınan)",r2(T.alim),"kvTl","Siparişlerden");
        kv("Mevcut stok değeri",r2(R.SV),"kvTl",R.SVn?R.SVn+" kalem/birim, son alış fiyatıyla":"")}
      s.bos();s.not("Kg değerleri her aşamada «Bitti» denirken girilen miktarlardır. Sevk tarihi irsaliye/teslim tarihidir."+(T.iade?" "+T.iade+" iade kaydı toplamlara dahil edilmedi.":""));
      if(adm)s.not("İşçilik, enerji ve hammadde dışı giderler dahil değildir; «Satış − malzeme» brüt bir göstergedir."+(T.mfysiz?" "+T.mfysiz+" malzemede fiyat bulunamadı, maliyete eklenmedi.":""),"warn");
      sh.push(s);
      /* 2) Aylık üretim */
      var a=X.sayfa("Aylık Üretim",[20,15,15,15,15,13,13,15],"Aylık üretim ve sevk",alt);
      a.baslikSatir(["Ay","Ekstruder (kg)","Baskı (kg)","Kesim (kg)","Depo (kg)","Paket","İş emri","Sevk (kg)"],[0]);
      R.ms.forEach(function(k,i){var x=R.A[k],z=i%2?"Z":"";a.satir([{v:AY(k),s:"txt"+z},{v:r2(x.ek),s:"num"+z},{v:r2(x.ba),s:"num"+z},{v:r2(x.ke),s:"num"+z},{v:r2(x.de),s:"num"+z},{v:r2(x.pk),s:"int"+z},{v:x.n,s:"int"+z},{v:r2(x.sk),s:"num"+z}])});
      a.satir([{v:"Toplam",s:"tot"},{v:r2(T.ek),s:"totNum"},{v:r2(T.ba),s:"totNum"},{v:r2(T.ke),s:"totNum"},{v:r2(T.de),s:"totNum"},{v:r2(T.pk),s:"totInt"},{v:T.n,s:"totInt"},{v:r2(T.sk),s:"totNum"}]);
      sh.push(a);
      /* 3) Müşteri sevk */
      var m=X.sayfa("Müşteri Sevk",adm?[6,44,12,15,12,10,20]:[6,44,12,15,12,10],"Müşteri bazlı sevk",alt);
      m.baslikSatir(["#","Müşteri","Sevk adedi","Kg","Paket","Pay"].concat(adm?["Tutar (KDV hariç, ₺)"]:[]),[1]);var mh=m.rows.length;
      R.S.forEach(function(x,i){var z=i%2?"Z":"";m.satir([{v:i+1,s:"int"+z},{v:x.ad,s:"txt"+z},{v:x.n,s:"int"+z},{v:r2(x.kg),s:"num"+z},{v:r2(x.pk),s:"int"+z},{v:T.sk>0?r2(x.kg/T.sk*100):0,s:"pct"+z}].concat(adm?[{v:x.fyli?r2(x.h):"—",s:"tl"+z}]:[]))});
      if(R.S.length){m.filtreAyarla(mh,mh+R.S.length);
        m.satir([{v:"",s:"tot"},{v:"Toplam ("+R.S.length+" müşteri)",s:"tot"},{v:R.S.reduce(function(q,x){return q+x.n},0),s:"totInt"},{v:r2(T.sk),s:"totNum"},{v:r2(R.S.reduce(function(q,x){return q+x.pk},0)),s:"totInt"},{v:100,s:"totPct"}].concat(adm?[{v:r2(T.sat),s:"totTl"}]:[]))}
      else m.not("Bu dönemde sevk kaydı yok.");
      sh.push(m);
      /* 4) Malzeme tüketimi */
      var c=X.sayfa("Malzeme Tüketimi",adm?[6,40,14,24,36,12,20,18]:[6,40,14,24,36,12],"Malzeme tüketimi (stok çıkışları)",alt);
      c.baslikSatir(["#","Malzeme","Ebat","Kategori","Tüketim","Çıkış sayısı"].concat(adm?["Tutar (KDV hariç, ₺)","Fiyat durumu"]:[]),[1,2,3,4]);var ch=c.rows.length;
      R.C.forEach(function(x,i){var z=i%2?"Z":"";c.satir([{v:i+1,s:"int"+z},{v:x.ad,s:"txt"+z},{v:x.eb||"",s:"txt"+z},{v:x.kat,s:"txt"+z},{v:qtxt(x.q),s:"txt"+z},{v:x.n,s:"int"+z}].concat(adm?[{v:x.tut?r2(x.tut):"—",s:"tl"+z},{v:x.fysiz?"Fiyat eksik":"Tamam",s:"txt"+z}]:[]))});
      if(R.C.length)c.filtreAyarla(ch,ch+R.C.length);else c.not("Bu dönemde stok çıkışı yok.");
      sh.push(c);
      /* 5) Maliyet (yönetici) */
      if(adm){var k=X.sayfa("Maliyet",[26,20,20,20,20],"Maliyet raporu (KDV hariç)",alt);
        k.bolum("AYLIK MALİYET VE SATIŞ (₺)");k.baslikSatir(["Ay","Malzeme","Alım","Satış","Fark"],[0]);k.dondur=0;
        R.ms.forEach(function(q,i){var x=R.A[q],z=i%2?"Z":"";k.satir([{v:AY(q),s:"txt"+z},{v:r2(x.tuk),s:"tl"+z},{v:r2(x.alim),s:"tl"+z},{v:r2(x.sat),s:"tl"+z},{v:r2(x.sat-x.tuk),s:"tl"+z}])});
        k.satir([{v:"Toplam",s:"tot"},{v:r2(T.tuk),s:"totTl"},{v:r2(T.alim),s:"totTl"},{v:r2(T.sat),s:"totTl"},{v:r2(T.sat-T.tuk),s:"totTl"}]);
        if(R.KT.length){k.bos();k.bolum("KATEGORİYE GÖRE MALZEME MALİYETİ");k.baslikSatir(["Kategori","Tutar (₺)","Pay"],[0]);k.dondur=0;
          R.KT.forEach(function(q,i){var z=i%2?"Z":"";k.satir([{v:q.ad,s:"txt"+z},{v:r2(q.tut),s:"tl"+z},{v:T.tuk>0?r2(q.tut/T.tuk*100):0,s:"pct"+z}])});
          k.satir([{v:"Toplam",s:"tot"},{v:r2(T.tuk),s:"totTl"},{v:100,s:"totPct"}])}
        k.bos();k.satir([{v:"Üretilen kg başına malzeme (₺/kg)",s:"kl"},{v:r2(T.de>0?T.tuk/T.de:0),s:"kvTl"}]);
        k.satir([{v:"Mevcut stok değeri (son alış fiyatı)",s:"kl"},{v:r2(R.SV),s:"kvTl"}]);
        sh.push(k)}
      X.indir("MAG-Rapor_"+R.f+"_"+R.t,sh);
      toast("Excel dosyası indirildi")
    }catch(e){toast("Excel hazırlanamadı: "+errText(e))}}

  /* ============ PDF (v111): tüm bölümler tek A4 PDF; Dosyalar'daki html2canvas + jsPDF ile ============ */
  async function pdf(){
    if(!cur)return;var btn=g("rpPdf"),kutu=null,sa=all,sc=allC,st=tab;
    try{
      if(btn)btn.disabled=true;toast("PDF hazırlanıyor…");
      await pdfHazir();
      var R=cur,B=function(t,h){return'<h3 class="rpdh">'+t+'</h3>'+h};
      all=true;allC=true;
      var h='<div class="rpdt"><b>MAG AMBALAJ — Rapor</b><span>'+esc(trDate(R.f))+' – '+esc(trDate(R.t))+' · Hazırlanma: '+esc(zamanTxt(R.z))+'</span></div>'
        +B("Özet",tabOzet(R))+B("Üretim",tabUretim(R))+B("Sevk",tabSevk(R))+B("Malzeme",tabMalz(R))+(R.adm?B("Maliyet",tabMali(R)):"");
      all=sa;allC=sc;tab=st;
      kutu=document.createElement("div");kutu.className="rp rpdf";kutu.innerHTML=h;document.body.appendChild(kutu);
      await new Promise(function(r){setTimeout(r,80)});
      var S=2,c=await html2canvas(kutu,{scale:S,backgroundColor:"#fff",logging:false}),W=c.width,H=c.height,pH=Math.floor(W*297/210);
      var kr=kutu.getBoundingClientRect(),cand=[];
      kutu.querySelectorAll(".rcard,tr,.rtr,.rmr,.rwarn,.rn,.rpdt,.rpdh,.rg").forEach(function(e){cand.push(Math.round((e.getBoundingClientRect().bottom-kr.top)*S))});
      cand.sort(function(a,b){return a-b});
      var kes=[],y=0;
      while(y<H-4){var lim=y+pH,end;
        if(lim>=H)end=H;else{end=0;cand.forEach(function(v){if(v<=lim&&v>y+pH*0.4)end=v});if(!end)end=lim}
        kes.push([y,end]);y=end}
      var doc=new window.jspdf.jsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:true});
      kes.forEach(function(k,i){
        var t=document.createElement("canvas");t.width=W;t.height=k[1]-k[0];
        var x=t.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,t.width,t.height);x.drawImage(c,0,k[0],W,t.height,0,0,W,t.height);
        if(i)doc.addPage();
        doc.addImage(t.toDataURL("image/jpeg",0.92),"JPEG",0,0,210,t.height*210/W);
        doc.setFontSize(8);doc.setTextColor(120);doc.text("MAG AMBALAJ",8,291);doc.text("Sayfa "+(i+1)+" / "+kes.length,202,291,{align:"right"})});
      var a=document.createElement("a");a.href=URL.createObjectURL(doc.output("blob"));a.download="MAG-Rapor_"+R.f+"_"+R.t+".pdf";document.body.appendChild(a);a.click();
      setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},60000);
      toast("✓ PDF indirildi")
    }catch(e){all=sa;allC=sc;tab=st;toast("PDF hazırlanamadı: "+errText(e))}
    finally{if(kutu)kutu.remove();if(btn)btn.disabled=false}}
  g("rpOk").onclick=getir;g("rpCsv").onclick=excel;g("rpPdf").onclick=pdf;
})();
