/* Yazı boyutu ayarı (bu cihazda saklanır). <head> içinde yüklenir ki sayfa açılırken yazı boyutu "zıplamasın".
   0 = Normal, 1 = Büyük, 2 = Çok büyük. Görünüm kuralları style.css sonundaki "html.byz1 / html.byz2" bölümündedir. */
(function(){
  var K="yaziBoyut";
  function oku(){try{var v=localStorage.getItem(K);return(v==="1"||v==="2")?v:"0"}catch(e){return"0"}}
  function uygula(v){var h=document.documentElement;h.classList.remove("byz1","byz2");if(v==="1"||v==="2")h.classList.add("byz"+v)}
  window.yaziBoyut={
    oku:oku,
    ayarla:function(v){v=String(v);try{localStorage.setItem(K,v)}catch(e){}uygula(v)}
  };
  uygula(oku());
})();
