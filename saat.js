(function(){
  try{
    var el=document.getElementById("clk");
    function t(){try{el.textContent="🕒 "+new Date().toLocaleString("tr-TR",{timeZone:"Europe/Istanbul",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"})}catch(e){}}
    t();setInterval(t,1000);
  }catch(err){console.error("saat:",err)}
})();
