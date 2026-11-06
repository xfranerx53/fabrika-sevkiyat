/* musterikrm.js — 📞 MÜŞTERİ İLİŞKİLERİ (v145) — musteri.js'in üstüne kurulur (window.musteriKRM kancası)
   • Müşteri kartında: ☎ Ara (tel:), 💬 WhatsApp (wa.me + hazır mesaj şablonları; mesaj gönderilmeden önce WhatsApp'ta düzenlenebilir).
   • Arama/mesajdan sonra «Görüşme kaydı»: sonuç, not, sonraki arama tarihi → musteriGorusme/{müşteri}/{push}; özet musteriler/{müşteri}/son, /sonraki.
   • Sınıf A/B/C (Mikro hareket hacmine göre, cariler/{kod}/sinif — tutar göstermez) ve «X gündür alım yok» (Mikro son satış faturası + programdaki son iş emri/sevk).
   • «📞 Aranacaklar»: sonraki arama günü gelenler + sessiz kalan A (30+ gün), B (45+), C (90+) müşteriler (son 14 günde görüşülmemişse).
   • Kartta sipariş geçmişi (iş emirleri) ve görüşme geçmişi; yönetici/muhasebe açık hesap, risk limiti aşımı.
   • Yönetici Paneli'nde «📞 Bugün aranacak müşteriler» kartı (window.musteriPanoCiz). */
(function(){
  var $=function(i){return document.getElementById(i)};
  function e(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  var GUN=864e5,ESIK={A:30,B:45,C:90},IS=null,ISZ=0;
  function tel(x){var t=String((x.m&&x.m.tel)||(x.c&&x.c.tel)||"").replace(/[^\d+]/g,"");return t}
  function waNo(t){var d=String(t||"").replace(/\D/g,"");if(d.indexOf("90")===0&&d.length===12)d=d.slice(2);if(d.charAt(0)==="0")d=d.slice(1);return/^5\d{9}$/.test(d)?"90"+d:""}
  function benAd(){return String((typeof rec!=="undefined"&&rec&&rec.ad)||"").split(" ")[0]}
  function hitap(x){var y=String((x.m&&x.m.yetkili)||"").trim();return y?y+" Bey/Hanım":"Merhaba"}
  async function isler(){if(IS&&Date.now()-ISZ<120000)return IS;IDX=null;try{var v=(await firebase.database().ref("isEmirleri").orderByChild("eklenmeTarihi").limitToLast(800).once("value")).val()||{};IS=Object.keys(v).map(function(k){return Object.assign({id:k},v[k])});ISZ=Date.now()}catch(er){IS=IS||[]}return IS}
  function tarih(ms){return ms?new Date(ms).toLocaleDateString("tr-TR"):"-"}
  /* son alım: Mikro son hareket satış faturasıysa o tarih; programdaki son iş emri daha yeniyse o */
  /* v146: iş emirlerinden müşteri → son tarih dizini bir kez kurulur (her müşteri için bütün iş emirlerini taramak donduruyordu) */
  var IDX=null,IDXL=null;function dizin(L){if(IDX&&IDXL===L)return IDX;IDX={};IDXL=L;(L||[]).forEach(function(i){if(!i.musteri||!window.musteriBul)return;var x=musteriBul(i.musteri);if(!x)return;var z=+i.eklenmeTarihi||0;if(!IDX[x.key]||z>IDX[x.key])IDX[x.key]=z});return IDX}
  function sonAlim(x,L){var t=0,c=x.c||{};if(c.son&&/sat/i.test(c.sonTur||""))t=Date.parse(c.son)||0;var z=(dizin(L)||{})[x.key]||0;return z>t?z:t}
  function sinif(x){return(x.c&&x.c.sinif)||(x.kod?"C":"")}
  function sessiz(x,L){var s=sonAlim(x,L);return s?Math.floor((Date.now()-s)/GUN):null}
  function aranacak(x,L){var m=x.m||{},g=sessiz(x,L),sn=sinif(x),son=m.son&&m.son.z||0;
    if(m.sonraki&&m.sonraki<=Date.now()+GUN/2)return"📅 Sonraki arama günü: "+tarih(m.sonraki);
    if(g!=null&&sn&&g>=ESIK[sn]&&Date.now()-son>14*GUN)return"⏳ "+g+" gündür alım yok ("+sn+" müşteri)";return""}
  window.musteriAranacak=aranacak;window.musteriSessiz=sessiz;window.musteriSinif=sinif;
  /* ---------- mesaj şablonları ---------- */
  function sablonlar(x){var ad=x.ad,h=hitap(x),b=benAd(),bk=window.musteriBakiye&&musteriBakiye(x.key);
    var o=[["👋 Hal hatır",h+", MAG Ambalaj'dan "+b+". Uzun zamandır görüşemedik, nasılsınız? Ambalaj ihtiyaçlarınızda yardımcı olabileceğimiz bir şey var mı? İyi çalışmalar."],
      ["🤝 Bir süredir sipariş yok",h+", MAG Ambalaj'dan "+b+". Bir süredir sizden sipariş alamadık; memnun kalmadığınız bir konu olduysa öğrenmek ve düzeltmek isteriz. Size nasıl daha iyi hizmet verebiliriz?"],
      ["📦 Sipariş hazır",h+", siparişiniz hazırlandı. Teslimat için uygun olduğunuz gün ve saati yazabilir misiniz? MAG Ambalaj"],
      ["🙏 Teşekkür",h+", siparişiniz için teşekkür ederiz. Ürünlerle ilgili her türlü geri bildiriminiz bizim için değerli. MAG Ambalaj"]];
    if(bk&&+bk.acik>0)o.push(["💰 Ödeme hatırlatma",h+", MAG Ambalaj muhasebeden yazıyoruz. Cari hesabınızda "+Math.round(+bk.acik).toLocaleString("tr-TR")+" ₺ açık bakiye görünüyor. Ödeme planınızı paylaşabilir misiniz? İyi çalışmalar."]);
    return o}
  /* ---------- görüşme kaydı ---------- */
  var SONUC=["✅ Ulaşıldı — sipariş verecek","🙂 Ulaşıldı — şimdilik ihtiyaç yok","⚠️ Ulaşıldı — şikâyet / sorun var","💸 Ulaşıldı — fiyat yüksek buluyor","🔁 Başka firmayla çalışıyor","📵 Ulaşılamadı","💬 Mesaj gönderildi","📝 Diğer"];
  function gDlg(){var d=$("dGor");if(d)return d;d=document.createElement("dialog");d.id="dGor";d.style.cssText="width:94vw;max-width:480px;border:0;border-radius:14px;padding:0";document.body.appendChild(d);return d}
  function gorusmeAc(x,tur,cb){var d=gDlg(),y=new Date(Date.now()+30*GUN).toISOString().slice(0,10);
    d.innerHTML='<div style="padding:12px 14px;border-bottom:1px solid #e5e7eb"><b>📝 Görüşme kaydı — '+e(x.ad)+'</b></div><div style="padding:10px 14px"><label>Nasıl</label><select id="goT"><option value="arama">☎ Telefon</option><option value="whatsapp">💬 WhatsApp</option><option value="ziyaret">🚗 Ziyaret</option></select>'+
      '<label style="margin-top:6px">Sonuç</label><select id="goS">'+SONUC.map(function(s){return'<option>'+e(s)+'</option>'}).join("")+'</select><label style="margin-top:6px">Not</label><textarea id="goN" rows="3" placeholder="Ne konuşuldu, ne istedi…"></textarea>'+
      '<label style="margin-top:6px">Sonraki arama (boş bırakılabilir)</label><input id="goD" type="date" value="'+y+'"><div id="goE" style="color:#b42318;font-size:13px"></div><div style="display:flex;gap:8px;margin-top:10px"><button type="button" class="btn b6" id="goV" style="margin:0">Vazgeç</button><button type="button" class="btn b1" id="goK" style="margin:0">💾 Kaydet</button></div></div>';
    $("goT").value=tur||"arama";if(tur==="whatsapp")$("goS").value="💬 Mesaj gönderildi";d.showModal();$("goV").onclick=function(){d.close()};
    $("goK").onclick=async function(){var sn=$("goD").value?Date.parse($("goD").value+"T09:00:00"):null,o={tur:$("goT").value,sonuc:$("goS").value,not:$("goN").value.trim().slice(0,500),kim:String((rec&&rec.ad)||"?").slice(0,100),kimUid:firebase.auth().currentUser.uid,z:firebase.database.ServerValue.TIMESTAMP};if(sn)o.sonraki=sn;
      try{var db=firebase.database();await db.ref("musteriGorusme/"+x.key).push(o);
        var m=Object.assign({},x.m||{},{ad:String(x.ad).slice(0,100),son:{z:Date.now(),tur:o.tur,sonuc:o.sonuc,kim:o.kim},z:firebase.database.ServerValue.TIMESTAMP,duzenleyen:o.kim});if(x.kod)m.cariKod=x.kod;if(sn)m.sonraki=sn;else delete m.sonraki;
        Object.keys(m).forEach(function(k){if(m[k]===undefined||m[k]===null||m[k]==="")delete m[k]});await db.ref("musteriler/"+x.key).set(m);x.m=m;d.close();toast("✓ Görüşme kaydedildi");if(cb)cb()}
      catch(er){$("goE").textContent="Kaydedilemedi: "+(er&&er.message||er)}}}
  /* ---------- müşteri kartına eklenen bölüm ---------- */
  window.musteriKRM=async function(x,kutu,yenile){var t=tel(x),wn=waNo(t),L=await isler(),g=sessiz(x,L),sn=sinif(x),ar=aranacak(x,L);
    var benim=L.filter(function(i){return i.musteri&&window.musteriBul&&(musteriBul(i.musteri)||{}).key===x.key}).sort(function(a,b){return(+b.eklenmeTarihi||0)-(+a.eklenmeTarihi||0)});
    var h='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:4px 0">'+(sn?'<span class="badge" style="background:'+(sn==="A"?"#16a34a":sn==="B"?"#2563eb":"#64748b")+'">'+sn+' müşteri</span>':'')+(g!=null?'<span class="badge" style="background:'+(g>=ESIK[sn||"C"]?"#dc2626":"#64748b")+'">'+g+' gündür alım yok</span>':'')+(ar?'<span style="color:#b45309;font-size:13px">'+e(ar)+'</span>':'')+'</div>'+
      '<div style="display:flex;gap:6px;margin:6px 0">'+(t?'<a class="btn b3" href="tel:'+e(t)+'" id="krA" style="margin:0;text-align:center">☎ Ara</a>':'<span style="color:#b45309;font-size:13px">Telefon yok — aşağıdan ekleyin</span>')+(wn?'<button type="button" class="btn" id="krW" style="margin:0;background:#16a34a">💬 WhatsApp</button>':'')+'<button type="button" class="btn b6" id="krG" style="margin:0">📝 Görüşme ekle</button></div>'+
      '<div id="krS" style="display:none;border:1px solid #bbf7d0;border-radius:10px;padding:8px;margin-bottom:6px"></div>'+
      '<details style="margin-top:6px"><summary style="cursor:pointer;font-weight:700">📋 Görüşme geçmişi</summary><div id="krH" style="font-size:13px">Yükleniyor…</div></details>'+
      '<details style="margin-top:6px"><summary style="cursor:pointer;font-weight:700">🏭 Sipariş geçmişi (iş emirleri: '+benim.length+')</summary><div style="font-size:13px">'+(benim.length?benim.slice(0,30).map(function(i){return'<div style="padding:3px 0;border-bottom:1px solid #f1f5f9">'+tarih(+i.eklenmeTarihi)+' • <b>'+e(i.no||"")+'</b> '+e(i.isAdi||i.stok||"")+' <span style="color:#667085">'+e(i.asama||"")+'</span></div>'}).join(""):'<span style="color:#667085">Programda iş emri yok.</span>')+'</div></details>';
    kutu.innerHTML=h;
    var a=$("krA");if(a)a.addEventListener("click",function(){setTimeout(function(){gorusmeAc(x,"arama",yenile)},1500)});
    $("krG").onclick=function(){gorusmeAc(x,"arama",yenile)};
    var w=$("krW");if(w)w.onclick=function(){var S=$("krS"),T=sablonlar(x);S.style.display=S.style.display==="none"?"":"none";
      S.innerHTML='<b>Mesaj seçin</b> <span style="color:#667085;font-size:12px">(WhatsApp\'ta göndermeden önce düzenleyebilirsiniz)</span>'+T.map(function(s,i){return'<button type="button" class="btn b6 sm" data-s="'+i+'" style="display:block;width:100%;text-align:left;margin:4px 0">'+e(s[0])+'</button>'}).join("")+'<button type="button" class="btn b6 sm" data-s="-1" style="display:block;width:100%;text-align:left">✏️ Boş mesaj</button>';
      S.querySelectorAll("[data-s]").forEach(function(b){b.onclick=function(){var i=+b.dataset.s,m=i>=0?T[i][1]:"";window.open("https://wa.me/"+wn+(m?"?text="+encodeURIComponent(m):""),"_blank","noopener");setTimeout(function(){gorusmeAc(x,"whatsapp",yenile)},1200)}})};
    try{var v=(await firebase.database().ref("musteriGorusme/"+x.key).orderByChild("z").limitToLast(30).once("value")).val()||{},G=Object.keys(v).map(function(k){return v[k]}).sort(function(a,b){return(+b.z||0)-(+a.z||0)});
      $("krH").innerHTML=G.length?G.map(function(o){return'<div style="padding:4px 0;border-bottom:1px solid #f1f5f9">'+tarih(+o.z)+' • '+(o.tur==="whatsapp"?"💬":o.tur==="ziyaret"?"🚗":"☎")+' <b>'+e(o.sonuc||"")+'</b> — '+e(o.kim||"")+(o.not?'<br>'+e(o.not):'')+(o.sonraki?'<br><span style="color:#2563eb">Sonraki: '+tarih(o.sonraki)+'</span>':'')+'</div>'}).join(""):'<span style="color:#667085">Henüz görüşme kaydı yok.</span>'}catch(er){var hh=$("krH");if(hh)hh.textContent="Okunamadı."}};
  /* ---------- Yönetici Paneli kartı ---------- */
  var PANO=null,PANOZ=0;
  window.musteriPanoCiz=async function(el){if(!el||!window.musteriListe)return;var L=await isler(),M=musteriListe();if(!M.length){el.innerHTML="";return}
    if(!PANO||Date.now()-PANOZ>60000){PANOZ=Date.now();PANO=M.map(function(x){return{x:x,n:aranacak(x,L),s:sinif(x)}}).filter(function(o){return o.n}).sort(function(a,b){return(a.s>b.s?1:a.s<b.s?-1:0)})}
    var A=PANO||M.map(function(x){return{x:x,n:aranacak(x,L),s:sinif(x)}}).filter(function(o){return o.n}).sort(function(a,b){return(a.s>b.s?1:a.s<b.s?-1:0)});
    if(!document.body.contains(el))return;
    el.innerHTML='<div class="pnK" data-r="'+(A.length?"tu":"ye")+'"><div class="pnT"><span>📞 Aranacak müşteriler</span><b class="pnN">'+A.length+'</b></div>'+(A.length?A.slice(0,8).map(function(o){return'<div class="pnR" data-mk="'+e(o.x.key)+'" style="cursor:pointer"><div><b>'+e(o.x.ad)+'</b> <span class="badge" style="background:#64748b">'+e(o.s||"-")+'</span></div><small>'+e(o.n)+'</small></div>'}).join("")+(A.length>8?'<div class="sub">+'+(A.length-8)+' müşteri daha — Müşterilerim › 📞 Aranacaklar</div>':''):'<div class="sub">Bugün aranması gereken müşteri yok 👍</div>')+'</div>';
    el.querySelectorAll("[data-mk]").forEach(function(r){r.onclick=function(ev){ev.stopPropagation();var d=document.getElementById("dPano");if(d&&d.open)d.close();window.musAc();setTimeout(function(){window.musteriDetay(r.dataset.mk)},400)}})};
  window.musteriIsler=isler;
})();
