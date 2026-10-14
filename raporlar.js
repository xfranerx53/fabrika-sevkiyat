/* ===================== RAPORLAR ===================== */
(function(){
  var g=function(i){return document.getElementById(i)},cur=null,all=false;
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
  window.rapAc=function(){g("rpC").classList.toggle("hide",g("rpS").value!=="ozel");if(!cur&&!g("rpO").innerHTML)g("rpO").innerHTML='<div class="empty">Dönemi seçip «Raporu getir» düğmesine basın.</div>'};
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
    cur=hesapla(D,f,t,adm);cur.f=f;cur.t=t;cur.adm=adm;ciz();g("rpOk").disabled=false;g("rpCsv").classList.remove("hide")}

  function hesapla(D,f,t,adm){
    var inR=function(d){return d>=f&&d<=t},ms=aylar(f,t),A={};
    ms.forEach(function(k){A[k]={ek:0,ba:0,ke:0,de:0,pk:0,n:0,sk:0,sat:0,tuk:0,alim:0}});
    var T={ek:0,ba:0,ke:0,de:0,pk:0,n:0,sk:0,sat:0,tuk:0,alim:0,iade:0,fysiz:0,fyli:0,mfysiz:0};
    /* 1) Üretim: iş emri aşama kayıtları */
    Object.keys(D.is).forEach(function(id){var lg=D.is[id].log||{};
      [["ekstruder","ek"],["baski","ba"],["kesim","ke"],["depo","de"]].forEach(function(s){var x=lg[s[0]];if(!x||!x.zaman)return;
        var d=dKey(x.zaman);if(!inR(d))return;var a=A[d.slice(0,7)],kg=+x.kg||0;a[s[1]]+=kg;T[s[1]]+=kg;
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

  var qtxt=function(q){return UN.filter(function(u){return u[0] in q}).map(function(u){return fmt(q[u[0]])+" "+u[1].toLowerCase()}).join(" · ")};
  var bar=function(v,m){return'<div class="rb"><i style="width:'+(m>0?Math.max(2,Math.round(v/m*100)):0)+'%"></i></div>'};
  var tl=function(n){return fmt(n)+" ₺"};
  function ciz(){
    var R=cur,T=R.T,adm=R.adm,o="";
    o+='<div class="mut" style="font-size:14px;margin-bottom:6px">📅 '+esc(trDate(R.f))+' – '+esc(trDate(R.t))+'</div><div class="rg">'
      +'<div class="rc"><span>Depoya giren (üretilen) kg</span><b>'+esc(fmt(T.de))+'</b></div>'
      +'<div class="rc"><span>Ekstruder film kg</span><b>'+esc(fmt(T.ek))+'</b></div>'
      +'<div class="rc"><span>Sevk edilen kg</span><b>'+esc(fmt(T.sk))+'</b></div>'
      +(adm?'<div class="rc"><span>Satış (KDV hariç)</span><b>'+esc(tl(T.sat))+'</b></div>':'<div class="rc"><span>Biten iş emri</span><b>'+esc(fmt(T.n))+'</b></div>')+'</div>';
    /* Aylık üretim */
    var mx=Math.max.apply(null,R.ms.map(function(k){return R.A[k].de}).concat([0]));
    o+='<div class="item"><h4 style="margin-top:0">🏭 Aylık üretim (kg)</h4><div class="rw"><table class="rt"><tr><th>Ay</th><th>Ekstruder</th><th>Baskı</th><th>Kesim</th><th>Depo</th><th>Paket</th><th>İş emri</th></tr>'
      +R.ms.map(function(k){var a=R.A[k];return'<tr><td>'+esc(AY(k))+bar(a.de,mx)+'</td><td>'+fmt(a.ek)+'</td><td>'+fmt(a.ba)+'</td><td>'+fmt(a.ke)+'</td><td><b>'+fmt(a.de)+'</b></td><td>'+fmt(a.pk)+'</td><td>'+a.n+'</td></tr>'}).join("")
      +'<tr class="tp"><td>Toplam</td><td>'+fmt(T.ek)+'</td><td>'+fmt(T.ba)+'</td><td>'+fmt(T.ke)+'</td><td>'+fmt(T.de)+'</td><td>'+fmt(T.pk)+'</td><td>'+T.n+'</td></tr></table></div>'
      +'<div class="rn">Kg değerleri, her aşamada «Bitti» denirken girilen miktarlardır; ilgili ayın tarihine göre toplanır.</div></div>';
    /* Müşteri bazlı sevk */
    var sm=R.S.length?R.S[0].kg:0,lim=all?R.S.length:15;
    o+='<div class="item"><h4 style="margin-top:0">🚚 Müşteri bazlı sevk</h4>'+(R.S.length?'<div class="rw"><table class="rt"><tr><th>Müşteri</th><th>Sevk</th><th>Kg</th><th>Paket</th>'+(adm?'<th>Tutar (KDV hariç)</th>':'')+'</tr>'
      +R.S.slice(0,lim).map(function(s){return'<tr><td>'+esc(s.ad)+bar(s.kg,sm)+'</td><td>'+s.n+'</td><td><b>'+fmt(s.kg)+'</b></td><td>'+fmt(s.pk)+'</td>'+(adm?'<td>'+(s.fyli?fmt(s.h):"-")+'</td>':'')+'</tr>'}).join("")
      +'<tr class="tp"><td>Toplam ('+R.S.length+' müşteri)</td><td>'+R.S.reduce(function(a,s){return a+s.n},0)+'</td><td>'+fmt(T.sk)+'</td><td>'+fmt(R.S.reduce(function(a,s){return a+s.pk},0))+'</td>'+(adm?'<td>'+fmt(T.sat)+'</td>':'')+'</tr></table></div>'
      +(R.S.length>15?'<button class="btn b6 sm" type="button" id="rpAll" style="width:auto;margin:8px 0 0">'+(all?"İlk 15'i göster":"Tümünü göster ("+R.S.length+")")+'</button>':""):'<div class="empty">Bu dönemde sevk kaydı yok.</div>')
      +'<div class="rn">Sevk tarihi: irsaliye/teslim tarihi. '+(T.iade?T.iade+" iade kaydı toplamlara dahil edilmedi. ":"")+'</div>'
      +(adm&&T.fysiz?'<div class="rwarn">'+T.fysiz+' sevk kaydında fiyat girilmemiş; tutar toplamına dahil değil.</div>':"")+'</div>';
    /* Malzeme tüketimi */
    var cl=R.C.slice(0,15),cm=cl.length?(adm?cl[0].tut:cl[0].n):0;
    o+='<div class="item"><h4 style="margin-top:0">📦 En çok tüketilen malzemeler</h4>'+(cl.length?'<div class="rw"><table class="rt"><tr><th>Malzeme</th><th>Tüketim</th><th>Çıkış</th>'+(adm?'<th>Tutar (KDV hariç)</th>':'')+'</tr>'
      +cl.map(function(c){return'<tr><td>'+esc(c.ad)+(c.eb?' · '+esc(c.eb):"")+'<div class="rn" style="margin:0">'+esc(c.kat)+'</div>'+bar(adm?c.tut:c.n,cm)+'</td><td>'+esc(qtxt(c.q))+'</td><td>'+c.n+'</td>'+(adm?'<td>'+(c.tut?fmt(c.tut):"-")+(c.fysiz?" ⚠️":"")+'</td>':'')+'</tr>'}).join("")+'</table></div>'
      +'<div class="rn">'+(R.C.length>15?"İlk 15 malzeme gösteriliyor ("+R.C.length+" kalem tüketildi). ":"")+'Stok çıkışı olarak kaydedilen hareketlerden hesaplanır.'+(adm?" ⚠️ = bazı çıkışların fiyatı bulunamadı.":"")+'</div>':'<div class="empty">Bu dönemde stok çıkışı yok.</div>')+'</div>';
    /* Maliyet (yönetici) */
    if(adm){
      var kg=T.de,pk=kg>0?T.tuk/kg:0,fark=T.sat-T.tuk,mm=Math.max.apply(null,R.ms.map(function(k){return Math.max(R.A[k].tuk,R.A[k].sat)}).concat([0]));
      o+='<div class="item"><h4 style="margin-top:0">💰 Maliyet raporu (KDV hariç)</h4><div class="rg">'
        +'<div class="rc"><span>Tüketilen malzeme maliyeti</span><b>'+esc(tl(T.tuk))+'</b></div>'
        +'<div class="rc"><span>Üretilen kg başına malzeme</span><b>'+(kg>0?esc(fmt(pk))+' ₺':'-')+'</b></div>'
        +'<div class="rc"><span>Satış − malzeme maliyeti</span><b style="color:'+(fark<0?"#c82333":"#0f766e")+'">'+esc(tl(fark))+'</b></div>'
        +'<div class="rc"><span>Dönem alımı (teslim alınan)</span><b>'+esc(tl(T.alim))+'</b></div></div>'
        +'<div class="rw"><table class="rt"><tr><th>Ay</th><th>Malzeme</th><th>Alım</th><th>Satış</th><th>Fark</th></tr>'
        +R.ms.map(function(k){var a=R.A[k];return'<tr><td>'+esc(AY(k))+'</td><td>'+fmt(a.tuk)+'</td><td>'+fmt(a.alim)+'</td><td>'+fmt(a.sat)+'</td><td>'+fmt(a.sat-a.tuk)+'</td></tr>'}).join("")
        +'<tr class="tp"><td>Toplam</td><td>'+fmt(T.tuk)+'</td><td>'+fmt(T.alim)+'</td><td>'+fmt(T.sat)+'</td><td>'+fmt(fark)+'</td></tr></table></div>'
        +(R.KT.length?'<h4>Kategoriye göre malzeme maliyeti</h4><div class="rw"><table class="rt"><tr><th>Kategori</th><th>Tutar</th><th>Pay</th></tr>'
          +R.KT.map(function(k){return'<tr><td>'+esc(k.ad)+bar(k.tut,R.KT[0].tut)+'</td><td>'+fmt(k.tut)+'</td><td>%'+(T.tuk>0?fmt(k.tut/T.tuk*100):0)+'</td></tr>'}).join("")+'</table></div>':"")
        +'<div class="rn">Mevcut stok değeri (son alış fiyatlarıyla): <b>'+esc(tl(R.SV))+'</b>'+(R.SVn?" ("+R.SVn+" kalem/birim)":"")+'</div>'
        +'<div class="rwarn">Malzeme maliyeti, tüketim tarihindeki en yakın önceki sipariş fiyatından hesaplanır. İşçilik, enerji ve hammadde dışı giderler dahil değildir; «Satış − malzeme» brüt bir göstergedir.'
        +(T.mfysiz?" "+T.mfysiz+" malzemede fiyat bulunamadı, maliyete eklenmedi.":"")+'</div></div>'}
    g("rpO").innerHTML=o;
    var b=g("rpAll");if(b)b.onclick=function(){all=!all;ciz()}}

  /* Excel (CSV) */
  function csv(){if(!cur)return;var R=cur,T=R.T,adm=R.adm,rows=[],q=function(v){return'"'+String(v==null?"":v).replace(/"/g,'""')+'"'},n=function(v){return q(String(Math.round((+v||0)*100)/100).replace(".",","))};
    var add=function(a){rows.push(a.join(";"))};
    add([q("RAPOR"),q(trDate(R.f)+" - "+trDate(R.t))]);add([]);
    add([q("AYLIK ÜRETİM (kg)")]);add(["Ay","Ekstruder","Baskı","Kesim","Depo","Paket","İş emri","Sevk kg"].map(q));
    R.ms.forEach(function(k){var a=R.A[k];add([q(AY(k)),n(a.ek),n(a.ba),n(a.ke),n(a.de),n(a.pk),n(a.n),n(a.sk)])});
    add([q("Toplam"),n(T.ek),n(T.ba),n(T.ke),n(T.de),n(T.pk),n(T.n),n(T.sk)]);add([]);
    add([q("MÜŞTERİ BAZLI SEVK")]);add(["Müşteri","Sevk adedi","Kg","Paket"].concat(adm?["Tutar KDV hariç"]:[]).map(q));
    R.S.forEach(function(s){add([q(s.ad),n(s.n),n(s.kg),n(s.pk)].concat(adm?[n(s.h)]:[]))});add([]);
    add([q("MALZEME TÜKETİMİ")]);add(["Malzeme","Ebat","Kategori","Tüketim","Çıkış sayısı"].concat(adm?["Tutar KDV hariç"]:[]).map(q));
    R.C.forEach(function(c){add([q(c.ad),q(c.eb),q(c.kat),q(qtxt(c.q)),n(c.n)].concat(adm?[n(c.tut)]:[]))});
    if(adm){add([]);add([q("MALİYET (KDV hariç)")]);add(["Ay","Malzeme","Alım","Satış","Fark"].map(q));
      R.ms.forEach(function(k){var a=R.A[k];add([q(AY(k)),n(a.tuk),n(a.alim),n(a.sat),n(a.sat-a.tuk)])});
      add([q("Toplam"),n(T.tuk),n(T.alim),n(T.sat),n(T.sat-T.tuk)]);add([q("Üretilen kg başına malzeme (₺)"),n(T.de>0?T.tuk/T.de:0)])}
    var a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+rows.join("\r\n")],{type:"text/csv;charset=utf-8"}));a.download="rapor-"+R.f+"_"+R.t+".csv";a.click()}
  g("rpOk").onclick=getir;g("rpCsv").onclick=csv;
})();
