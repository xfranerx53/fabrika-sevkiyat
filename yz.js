/* yz.js — 🤖 YAPAY ZEKÂ ekranı (v132). Mag Pazar gece ajanı her mesai turunda `ai/` altına yazar:
   üretim kuyrukları (aşama başına, aynı formül/renk art arda), vardiya yükü, geciken işler, sevkiyat günü rotası, stok uyarıları.
   Herkes kendi işini görür: şoför rotayı, operatör kendi aşamasının sırasını, yönetici/depo/muhasebe hepsini. Yalnız okur, hiçbir şey yazmaz. */
(function(){
  var ASAD={etiket:"🏷 Etiket",ekstruder:"🧵 Ekstruder",baski:"🖨 Baskı",kesim:"✂️ Kesim",depo:"📦 Depo"};
  var ROLAS={"Ekstruder Operatörü":["ekstruder"],"Matbaa Operatörü":["baski"],"Kesim Operatörü":["kesim"]};
  function e(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  function ts(t){var d=new Date(t||0);return d.toLocaleDateString("tr-TR")+" "+d.toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}
  function dlg(){var d=document.getElementById("dYz");if(d)return d;d=document.createElement("dialog");d.id="dYz";d.style.cssText="max-width:680px;width:94vw;border:0;border-radius:14px;padding:0";
    d.innerHTML='<div style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5e7eb"><b style="font-size:18px">🤖 Yapay Zekâ — bugünkü iş</b><button type="button" id="yzKap" style="font-size:20px;background:none;border:0">✕</button></div><div id="yzB" style="padding:12px 16px;max-height:75vh;overflow:auto">Yükleniyor…</div>';
    document.body.appendChild(d);d.querySelector("#yzKap").onclick=function(){d.close()};return d}
  function kuyrukHtml(q,a){var l=(q&&q[a])||[];if(!l.length)return'<div style="color:#667085">Sırada iş yok.</div>';
    return'<ol style="margin:4px 0 0 18px;padding:0">'+l.map(function(x){return'<li style="margin:4px 0"><b>'+e(x.no)+'</b> — '+e(x.musteri)+' <span style="color:#667085">'+(x.urun?"• "+e(x.urun):"")+(x.kg?" • "+x.kg+" kg":"")+(x.formul?" • "+e(x.formul):"")+(x.renk?" • "+e(x.renk):"")+(x.gun>10?' • <b style="color:#b42318">'+x.gun+' gündür bekliyor</b>':"")+'</span></li>'}).join("")+'</ol>'}
  async function ac(){var d=dlg();d.showModal();var B=d.querySelector("#yzB");B.textContent="Yükleniyor…";
    try{var s=await firebase.database().ref("ai").once("value"),v=s.val();if(!v){B.innerHTML='Henüz plan yok. Gece ajanı ilk mesai turunda hazırlar.';return}
      var rol=(typeof rec!=="undefined"&&rec&&rec.rol)||"",yon=typeof isAdmin==="function"&&isAdmin(),h='<div style="color:#667085;font-size:13px">Son güncelleme: '+ts(v.t)+'</div>';
      var sofor=rol==="Sevkiyat Sorumlusu",asl=ROLAS[rol];
      if(sofor||yon||rol==="Depo Görevlisi"){var r=v.rota||{},dl=r.duraklar||[];
        h+='<h3 style="margin:14px 0 6px">🚚 Bugünün sevkiyat rotası ('+dl.length+' durak)</h3>'+(dl.length?'<ol style="margin:0 0 0 18px;padding:0">'+dl.map(function(x){return'<li style="margin:4px 0">'+({sevk:"📦",talimat:"📋",tahsilat:"💰"}[x.tur]||"•")+' <b>'+e(x.ad||"-")+'</b> <span style="color:#667085">'+e(x.not||"")+(x.adres?" • "+e(x.adres):"")+'</span></li>'}).join("")+'</ol>'+(r.url?'<a href="'+e(r.url)+'" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;padding:10px 14px;border-radius:10px;background:#16a34a;color:#fff;text-decoration:none;font-weight:700">🗺 Rotayı haritada aç</a>':""):'<div style="color:#667085">Bugün sevkiyat, talimat ya da tahsilat yok.</div>')}
      var gor=asl||(sofor?[]:["etiket","ekstruder","baski","kesim","depo"]);
      if(gor.length){if(!asl&&v.yuk){var y=v.yuk;h+='<h3 style="margin:14px 0 6px">📊 Önümüzdeki iş yükü</h3><div>'+["ekstruder","baski","kesim"].map(function(a){var o=y[a]||{};return ASAD[a]+': <b>'+(o.kg||0)+' kg</b> ≈ '+(o.saat||0)+' saat ('+(o.vardiya||0)+' vardiya)'}).join("<br>")+'</div>'+((v.gecGun||[]).length?'<div style="color:#b42318;margin-top:4px">⏰ 10 günden uzun bekleyen: '+e(v.gecGun.join(", "))+'</div>':"")}
        gor.forEach(function(a){h+='<h3 style="margin:14px 0 6px">'+ASAD[a]+' sırası</h3>'+kuyrukHtml(v.kuyruk,a)});
        if(asl&&asl[0]==="ekstruder")h+='<div style="color:#667085;font-size:13px;margin-top:6px">Sıra, aynı formül ve renkteki işler art arda gelecek şekilde dizildi (daha az geçiş, daha az fire).</div>'}
      if((yon||rol==="Depo Görevlisi"||rol==="Muhasebe")&&(v.stok||[]).length)h+='<h3 style="margin:14px 0 6px">📦 Bitmek üzere olan malzemeler</h3>'+v.stok.map(function(x){return'<div>• <b>'+e(x.ad)+'</b>: '+(x.kalan||0)+' '+e(x.birim)+(x.gun!=null?' — ≈ '+x.gun+' gün yeter':"")+(x.ted?' <span style="color:#667085">('+e(x.ted)+')</span>':"")+'</div>'}).join("");
      if((yon||asl)&&v.fire&&(v.fire.fireKg||v.fire.durusDk)){var fr=v.fire;h+='<h3 style="margin:14px 0 6px">⚠️ Son 7 gün fire / arıza</h3><div>🗑 Fire: <b>'+(fr.fireKg||0)+' kg</b>'+(fr.fireOran!=null?' (üretimin %'+fr.fireOran+"'i)":"")+'<br>🔧 Duruş: <b>'+(fr.durusSaat||0)+' saat</b>'+((fr.enCok||[]).length?'<br><span style="color:#667085">En çok: '+fr.enCok.map(function(x){return e(x.ad)+" ("+e(x.deger)+")"}).join(", ")+'</span>':"")+'</div>'+(fr.oneri?'<div style="margin-top:4px">💡 '+e(fr.oneri)+'</div>':"")}
      B.innerHTML=h}catch(err){B.textContent="Açılamadı: "+(err&&err.message||err)}}
  function dugme(){if(document.getElementById("mYz"))return;var ref=document.querySelector('.menuBtn[data-go="is"]');if(!ref)return;
    var b=document.createElement("button");b.className="menuBtn";b.id="mYz";b.type="button";b.style.background="#4c1d95";b.innerHTML='<span class="ic">🤖</span><div>YAPAY ZEKÂ<small>Bugünkü iş sırası, sevkiyat rotası, stok uyarıları</small></div>';b.onclick=ac;ref.parentNode.insertBefore(b,ref)}
  window.yzAc=ac;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",dugme);else dugme();
})();
