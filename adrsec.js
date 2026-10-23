/* ===================== ORTAK ADRES SEÇİCİ (v88) =====================
   Talimat ve Tahsilat pencerelerinde aynı "📍 Adres (isteğe bağlı)" bloğunu kurar:
   kayıtlı sevk adreslerinden ara-seç · Google Maps linki / açık adres yaz · 🗺️ Haritada Seç.
   Kullanım: var A=adrSecKur("kutuId","pre")  ->  A.sifirla() · A.doldur({adres,haritaUrl,adresAd}) · A.oku()
   oku() -> {adres,haritaUrl,adresAd}  (boş olanlar yok). Kayıtlı adresler app.js'teki sAdr'dan gelir. */
(function(){
  window.adrSecKur=function(boxId,p){
    var box=$(boxId);if(!box)return null;
    box.innerHTML=
      '<label style="margin-top:8px;color:#0f766e">📍 Adres (isteğe bağlı)</label>'+
      '<div style="position:relative;margin-bottom:6px">'+
        '<input id="'+p+'AdrQ" placeholder="📒 Kayıtlı adreste ara (firma, il, telefon...)" autocomplete="off">'+
        '<div id="'+p+'AdrRes" class="hide" style="position:absolute;left:0;right:0;top:100%;margin-top:2px;max-height:220px;overflow:auto;background:#fff;border:1.5px solid #2563eb;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.18);z-index:50"></div>'+
      '</div>'+
      '<div style="display:flex;gap:6px;margin-bottom:6px"><input id="'+p+'Hu" placeholder="Google Maps linki veya adres"><button type="button" class="btn b7" style="margin:0;width:auto;white-space:nowrap" id="'+p+'HSec">🗺️ Haritada Seç</button></div>'+
      '<textarea id="'+p+'Ad" rows="2" maxlength="500" placeholder="Açık adres"></textarea>'+
      '<div style="margin-top:4px"><button type="button" class="btn b6 sm" style="width:auto;margin:0" id="'+p+'Tem">✖ Adresi temizle</button></div>';
    var adAd="",q=$(p+"AdrQ"),res=$(p+"AdrRes"),hu=$(p+"Hu"),ad=$(p+"Ad");
    function ara(){
      if(res.classList.contains("hide"))return;
      var A=window.sAdr||[],w=trn(q.value).trim().split(/\s+/).filter(Boolean);
      var R=A.filter(function(a){var h=trn([a.ad,a.yetkili,a.tel,a.tel2,a.sehir,a.adres,a.not].join(" "));return w.every(function(t){return h.indexOf(t)>=0})}).sort(function(a,b){return String(a.ad||"").localeCompare(String(b.ad||""),"tr")});
      res.innerHTML=R.length?R.map(function(a){return '<div data-id="'+esc(a.id)+'" style="padding:9px 11px;border-bottom:1px solid #e2e8f0;cursor:pointer"><b style="font-size:16px">'+esc(a.ad)+'</b>'+(a.sehir?' <span class="mut" style="font-size:13px">· '+esc(a.sehir)+'</span>':"")+(a.adres?'<div class="sub" style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(a.adres)+'</div>':"")+'</div>'}).join(""):'<div style="padding:12px;text-align:center;color:#94a3b8;font-weight:700">'+(A.length?"Aramaya uygun adres yok":"Kayıtlı adres yok")+'</div>';
    }
    function ac(){res.classList.remove("hide");ara()}
    q.addEventListener("focus",ac);q.addEventListener("input",ac);
    res.addEventListener("mousedown",function(e){e.preventDefault()});
    res.onclick=function(e){
      var d=e.target.closest("[data-id]");if(!d)return;
      var a=(window.sAdr||[]).find(function(x){return x.id===d.dataset.id});if(!a)return;
      adAd=a.ad||"";ad.value=a.adres||"";hu.value=a.haritaUrl||"";
      q.value="";res.classList.add("hide");q.blur();toast("Adres eklendi: "+adAd)};
    document.addEventListener("click",function(e){if(!e.target.closest("#"+p+"AdrQ")&&!e.target.closest("#"+p+"AdrRes"))res.classList.add("hide")});
    $(p+"HSec").onclick=function(){var v=hu.value.trim(),a=ad.value.trim();haritaAc(safeUrl(v),v&&!safeUrl(v)?v:a)};
    $(p+"Tem").onclick=function(){adAd="";hu.value="";ad.value="";q.value="";res.classList.add("hide")};
    return {
      sifirla:function(){adAd="";q.value="";hu.value="";ad.value="";res.classList.add("hide")},
      doldur:function(o){o=o||{};adAd=o.adresAd||"";q.value="";hu.value=o.haritaUrl||"";ad.value=o.adres||"";res.classList.add("hide")},
      oku:function(){
        var h=hu.value.trim(),url=safeUrl(h),adr=ad.value.trim(),o={};
        if(h&&!url&&!adr)adr=h;
        if(adr)o.adres=adr.slice(0,500);
        if(url)o.haritaUrl=url.slice(0,500);
        if((adr||url)&&adAd)o.adresAd=adAd.slice(0,100);
        return o}
    };
  };
})();
