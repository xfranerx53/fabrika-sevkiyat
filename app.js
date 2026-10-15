window.addEventListener("error",function(e){var b=document.getElementById("boot");if(b&&!b.classList.contains("hide"))b.textContent="Hata: "+e.message+" (satır "+e.lineno+")"});
/* ============ AYAR: Firebase Console > Proje ayarları > Web uygulaması'ndan kopyalayın ============ */
const CFG={
  apiKey:"AIzaSyA_ZyOtWAvaYQvU8KaJnAJZK1s4Qd80FtU",
  authDomain:"sevkiyat-fc22b.firebaseapp.com",
  databaseURL:"https://sevkiyat-fc22b-default-rtdb.firebaseio.com",
  projectId:"sevkiyat-fc22b",
  storageBucket:"sevkiyat-fc22b.firebasestorage.app",
  messagingSenderId:"449531312842",
  appId:"1:449531312842:web:33e750da974679f87f1233"
};
/* ================================================================================================= */
const $=id=>document.getElementById(id);
/* ===== Ortak arama / filtre / tarih aralığı (tüm listeler aynı motoru kullanır) =====
   - Türkçe karakter duyarsız: "izmir" = "İzmir", "sut" = "süt"
   - Çok kelime: hepsi geçmeli ("koli 40" gibi)
   - Tarih aralığı: başlangıç/bitiş dahil, ters girilirse otomatik düzeltilir
   - "Filtreleri temizle" düğmesi + sonuç sayısı */
const trn=s=>String(s==null?"":s).toLocaleLowerCase("tr-TR").replace(/ı/g,"i").replace(/ş/g,"s").replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ö/g,"o").replace(/ü/g,"u").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const TRZ="Europe/Istanbul",_trf=new Intl.DateTimeFormat("en-CA",{timeZone:TRZ,year:"numeric",month:"2-digit",day:"2-digit"});
const trIso=ms=>{const p=_trf.formatToParts(new Date(ms)),g=t=>p.find(x=>x.type===t).value;return g("year")+"-"+g("month")+"-"+g("day")};
const gun=v=>{if(!v)return"";if(typeof v==="string"&&/^\d{4}-\d{2}-\d{2}/.test(v))return v.slice(0,10);const n=+v;return n?trIso(n):""};
const FB={};
function fbKur(q,o){o=o||{};const inp=$(q);if(!inp||FB[q])return;
  const box=inp.closest(".filter");let d1=o.d1,d2=o.d2,r=null;
  if(!d1){r=document.createElement("div");r.className="fbar";
    r.innerHTML=`<div><label>Başlangıç${o.etiket?" · "+o.etiket:""}</label><input type="date" id="${q}D1"></div><div><label>Bitiş</label><input type="date" id="${q}D2"></div>`;
    inp.insertAdjacentElement("afterend",r);d1=q+"D1";d2=q+"D2"}
  const x=document.createElement("div");x.className="fbar2";
  x.innerHTML=`<span id="${q}N"></span><button type="button" class="btn b6 sm hide" id="${q}X" style="width:auto;margin:0">✕ Filtreleri temizle</button>`;
  if(box)box.appendChild(x);else r.insertAdjacentElement("afterend",x);
  FB[q]={d1,d2,sel:o.sel||[],say:!o.nocount};
  const fn=()=>o.fn();
  [q,d1,d2].concat(o.sel||[]).forEach(i=>{const e=$(i);e.addEventListener("input",fn);e.addEventListener("change",fn)});
  $(q+"X").onclick=()=>{inp.value="";$(d1).value="";$(d2).value="";(o.sel||[]).forEach(i=>$(i).value="");fn();inp.focus()}}
function fbDurum(q){const f=FB[q];if(!f)return{w:[],a:"",b:"",aktif:false};
  const w=trn($(q).value).trim().split(/\s+/).filter(Boolean);let a=$(f.d1).value,b=$(f.d2).value;
  if(a&&b&&a>b){const t=a;a=b;b=t}
  return{w,a,b,aktif:!!(w.length||a||b||f.sel.some(i=>$(i).value))}}
function fbEsles(st,alanlar,tarih){
  if(st.w.length){const h=trn(alanlar.join(" "));if(!st.w.every(t=>h.includes(t)))return false}
  if(st.a||st.b){const g=gun(tarih);if(!g||(st.a&&g<st.a)||(st.b&&g>st.b))return false}
  return true}
function fbSay(q,n,top,ad){const f=FB[q];if(!f)return;const st=fbDurum(q);$(q+"X").classList.toggle("hide",!st.aktif);
  if(f.say)$(q+"N").textContent=st.aktif?n+" / "+top+" "+(ad||"kayıt"):top+" "+(ad||"kayıt")}
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=n=>Number(n||0).toLocaleString("tr-TR",{maximumFractionDigits:2});
const trDate=s=>{const p=(s||"").split("-");return p.length===3?`${p[2]}.${p[1]}.${p[0]}`:"-"};
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("on");clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove("on"),2800)}
function safeUrl(s){try{const u=new URL(s);return(u.protocol==="http:"||u.protocol==="https:")?u.href:""}catch(e){return""}}
function errText(e){const m={"auth/email-already-in-use":"Bu kullanıcı adı zaten alınmış.","auth/wrong-password":"Kullanıcı adı veya şifre hatalı.","auth/user-not-found":"Kullanıcı adı veya şifre hatalı.","auth/invalid-credential":"Kullanıcı adı veya şifre hatalı.","auth/weak-password":"Şifre en az 6 karakter olmalı.","auth/too-many-requests":"Çok fazla deneme. Biraz bekleyin.","auth/network-request-failed":"İnternet bağlantısı yok.","PERMISSION_DENIED":"Bu işlem için yetkiniz yok."};const ms=e.message||"";
  if(/EMAIL_EXISTS/.test(ms)||e.code==="auth/email-already-in-use")return "Bu kullanıcı adı zaten alınmış.";
  if(/ADMIN_ONLY_OPERATION|OPERATION_NOT_ALLOWED/.test(ms)||e.code==="auth/operation-not-allowed"||e.code==="auth/admin-restricted-operation")return "Yeni kayıt Firebase tarafında kapalı. Firebase > Authentication > Settings > User actions bölümünde 'Enable create (sign-up)' açık olmalı.";
  if(/WEAK_PASSWORD/.test(ms))return "Şifre en az 6 karakter olmalı.";
  if(/TOO_MANY_ATTEMPTS/.test(ms))return "Çok fazla deneme. Biraz bekleyin.";
  if(/INVALID_EMAIL/.test(ms))return "Kullanıcı adı geçersiz (sadece harf, rakam, . _ - kullanın).";
  if(/API_KEY|API key|referer|blocked/i.test(ms))return "Firebase API anahtarı bu siteye izin vermiyor. Google Cloud > API ve Hizmetler > Kimlik Bilgileri bölümünde anahtarın site kısıtlamasını kontrol edin.";
  if(/INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|EMAIL_NOT_FOUND/.test(ms))return "Kullanıcı adı veya şifre hatalı (ya da bu kullanıcı kayıtlı değil).";return m[e.code]||m[ms.split(":")[0]]||ms}

if(CFG.apiKey.startsWith("BURAYA")){
  document.body.innerHTML='<div style="padding:24px;font-size:19px"><b>Ayar eksik.</b><br><br>Dosyanın içindeki <code>CFG</code> bölümüne Firebase apiKey ve appId değerlerini yazın.</div>';
  throw new Error("Firebase ayarı eksik");
}
window.__st={sdk:typeof firebase!=="undefined",init:0,auth:0,t0:Date.now()};
function bootMsg(m,tani){const b=$("boot");b.classList.remove("hide");
  let h="<b>Uygulama açılamadı</b><br><br>"+esc(m);
  if(tani){const S=window.__st||{};
    h+='<br><br><small style="line-height:1.6">Tanı: Firebase yüklendi: '+(S.sdk?"evet":"HAYIR")+' · başlatıldı: '+(S.init?"evet":"HAYIR")+' · giriş yanıtı: '+(S.auth?"geldi":"GELMEDİ")+' · çevrimiçi: '+(navigator.onLine?"evet":"HAYIR")+'</small><br><br><button class="btn b3" id="bootFix" type="button">🔄 Önbelleği temizle ve yeniden dene</button>'}
  b.innerHTML=h;
  const f=document.getElementById("bootFix");
  if(f)f.onclick=async()=>{try{const r=await navigator.serviceWorker.getRegistrations();await Promise.all(r.map(x=>x.unregister()));const k=await caches.keys();await Promise.all(k.map(x=>caches.delete(x)))}catch(e){}location.href=location.pathname+"?t="+Date.now()}}
window.addEventListener("error",e=>{if(["vLogin","vWait","vMenu","vApp"].every(x=>$(x).classList.contains("hide")))bootMsg(e.message||"Bilinmeyen hata")});
if(typeof firebase==="undefined"){bootMsg("Firebase yüklenemedi. İnternet bağlantısını kontrol edin.");throw new Error("firebase yok")}
if(!/^https?:$/.test(location.protocol))bootMsg("Uygulama dosyadan açılmış ("+location.protocol+"). Giriş sistemi sadece internet adresi (https) üzerinden çalışır.");
setTimeout(()=>{if(!$("boot").classList.contains("hide")&&$("boot").textContent==="Yükleniyor...")bootMsg("Sunucuya bağlanılamadı. İnternet bağlantısını ve Firebase ayarlarını kontrol edin.",true)},10000);
firebase.initializeApp(CFG);window.__st.init=1;
const auth=firebase.auth(),db=firebase.database();
let fbFn=null;
/* Cloud Functions bileşeni yalnızca gerektiğinde (yönetici şifre sıfırlama) yüklenir */
function fnYukle(){if(fbFn)return Promise.resolve(fbFn);
  return new Promise((ok,no)=>{const sc=document.createElement("script");sc.src="https://www.gstatic.com/firebasejs/8.10.1/firebase-functions.js";
    sc.onload=()=>{try{fbFn=firebase.functions();ok(fbFn)}catch(e){no(e)}};sc.onerror=()=>no(new Error("Fonksiyon bileşeni yüklenemedi."));document.head.appendChild(sc)})}

const MODS={
 sevk:{yol:"urunler",baslik:"SEVKİYAT",tab:["HAZIR ÜRÜNLER","SEVK EDİLECEKLER","SEVK EDİLENLER"],rozet:["HAZIR STOK","SEVK EDİLECEK","SEVK EDİLDİ"],ileri:["➡️ Sevk Listesine Al","✓ Teslim Edildi"],geri:["↩️ Hazır Ürünlere Geri Al","↩️ Sevk Edilecek'e Geri Al"],sec:["SEVKİYATA HAZIR","SEVK EDİLECEK"],kayit:"+ STOĞA EKLENENİ KAYDET",teslim:"Teslim eden",mu:"Müşteri"},
 stok:{yol:"stok",baslik:"STOK",tab:["STOKTAKİ ÜRÜNLER","KULLANIMA AYRILANLAR","KULLANILANLAR"],rozet:["STOKTA","KULLANIMA AYRILDI","KULLANILDI"],ileri:["➡️ Kullanıma Ayır","✓ Kullanıldı"],geri:["↩️ Stoka Geri Al","↩️ Kullanıma Ayrılana Geri Al"],sec:["STOKTA","KULLANIMA AYRILDI"],kayit:"+ STOĞA EKLE",teslim:"İşlemi yapan",mu:"Tedarikçi / Firma"}
};
let mod="sevk";const M=()=>MODS[mod];
let user=null,rec=null,recRef=null,uRef=null,started=false,menuOk=false;
let urunler=[],limit=20,tab="hazir",editId="",fotos=[],stream=null,irsHedef=null;
const show=v=>{$("boot").classList.add("hide");["vLogin","vWait","vMenu","vApp"].forEach(x=>$(x).classList.toggle("hide",x!==v))};
const ad=()=>rec?`${rec.ad} (${rec.rol})`:"Bilinmiyor";
const isAdmin=()=>!!(rec&&rec.yonetici===true&&rec.onay===true);
const ARACLAR={isuzu:"Isuzu Kamyon (34 DFV 172)",ford:"Ford Minibüs (34 EOM 772)"};

/* ===================== YETKİ TABLOSU (adım 1) =====================
   Hangi rol hangi bölümü görür, hangi aşamayı ilerletir, hangi işlemi yapar — TEK yerde.
   YETKI_UYGULA=false yapılırsa uygulama eskisi gibi çalışır (herkes her şeyi görür). Adım 3 ile true: bölüm görünürlüğü uygulanır.
   Yönetici (rec.yonetici) her zaman her şeye sahiptir.
   mod   : görebildiği bölümler  (sevk | stok | is | rap)
   asama : ilerletebildiği iş emri aşamaları (etiket | ekstruder | baski | kesim | depo)
   ana   : girişte doğrudan açılacak bölüm (yoksa menü gelir)
   goster: iş emirlerinde görebildiği aşamalar (yoksa hepsi)
   isAc/isDuzenle/geriAl/isSil/fiyat : işlem yetkileri */
const YETKI_UYGULA=true;
const YETKI={
  "Depo Görevlisi":     {mod:["is","uretim","stok","sevk"],asama:["etiket","depo"],          isAc:true, isDuzenle:true, geriAl:false,isSil:false,fiyat:false},
  "Sevkiyat Sorumlusu": {mod:["sevk"],            asama:[],                         isAc:false,isDuzenle:false,geriAl:false,isSil:false,fiyat:false},
  "Ekstruder Operatörü":{mod:["uretim"],              asama:["ekstruder"],ana:"uretim",     isAc:false,isDuzenle:false,geriAl:false,isSil:false,fiyat:false},
  "Matbaa Operatörü":   {mod:["uretim"],              asama:["baski"],    ana:"uretim",     isAc:false,isDuzenle:false,geriAl:false,isSil:false,fiyat:false},
  "Kesim Operatörü":    {mod:["uretim"],              asama:["kesim"],    ana:"uretim",     isAc:false,isDuzenle:false,geriAl:false,isSil:false,fiyat:false},
  "Muhasebe":           {mod:["is","uretim","stok","rap","tah"], asama:["etiket"],                 isAc:true, isDuzenle:true, geriAl:false,isSil:false,fiyat:true}
};
const yRol=()=>(rec&&YETKI[rec.rol])||null;
const yAcik=()=>isAdmin()||!YETKI_UYGULA;                       /* kısıtlama kapalıysa / yöneticiyse serbest */
const iz=k=>{const v=rec&&rec.izin?rec.izin[k]:undefined;return typeof v==="boolean"?v:undefined}; /* adım 4: kişiye özel izin (yoksa rol şablonu geçerli) */
const modGor=m=>yAcik()||(iz(m)!==undefined?iz(m):!!(yRol()&&yRol().mod.includes(m)));     /* bölümü görebilir mi */
/* Tahsilat + Talimatlar: sevkiyat yetkisi olan VEYA ayrı "tah" izni olan (örn. Muhasebe) görür. rules.json ile aynı */
const tahGor=()=>modGor("sevk")||modGor("tah");
const isVeriGor=()=>modGor("is")||modGor("uretim"); /* iş emri verisini okuyabilir mi (İş emirleri veya Üretim) */
const asamaYap=a=>yAcik()||(iz("a_"+a)!==undefined?iz("a_"+a):!!(yRol()&&yRol().asama.includes(a))); /* aşamayı ilerletebilir mi */
const islemYap=k=>yAcik()||(iz(k)!==undefined?iz(k):!!(yRol()&&yRol()[k]));                /* isDuzenle, geriAl, isSil, fiyat */
const asamaGor=a=>yAcik()||iz("a_"+a)===true||(yRol()?(!yRol().goster||yRol().goster.includes(a)):false); /* iş emirlerinde bu aşamayı görebilir mi */
/* Sevkiyat Sorumlusu: kayıt ekleme/düzenleme formunu (kamera, adres, not, ürün adı...) kullanamaz */
const sevForm=()=>yAcik()||!(rec&&rec.rol==="Sevkiyat Sorumlusu");
const anaBolum=()=>(YETKI_UYGULA&&!isAdmin()&&yRol()&&yRol().ana)||null;
/* kayıt ekranındaki rol listesi de aynı tablodan dolar */
try{const rs=$("rr");if(rs)rs.innerHTML=Object.keys(YETKI).map(r=>`<option>${r}</option>`).join("")}catch(e){}
window.yetkiOzet=()=>({rol:rec&&rec.rol,yonetici:isAdmin(),uygula:YETKI_UYGULA,moduller:["sevk","stok","is","uretim","rap","tah"].filter(modGor),asamalar:["etiket","ekstruder","baski","kesim","depo"].filter(asamaYap),islemler:["isAc","isDuzenle","geriAl","isSil","fiyat"].filter(k=>k==="isAc"?canIsAc():islemYap(k))});

/* ---------- Oturum ---------- */
let pendReg=null,kayitDevam=false;const kyTry={};
async function kayitYaz(u){
  if(!u)return;const ad0=(u.email||"").split("@")[0],P=pendReg||{n:ad0,k:ad0,r:"Depo Görevlisi"};
  $("wE").textContent="Kayıt veritabanına yazılıyor...";$("wR").classList.add("hide");
  try{await db.ref("kullanicilar/"+u.uid).set({ad:P.n,kullanici:P.k,rol:P.r,onay:false,yonetici:false});$("wE").textContent=""}
  catch(e){$("wE").textContent="Kayıt veritabanına yazılamadı: "+errText(e);$("wR").classList.remove("hide")}
}
$("wR").onclick=()=>kayitYaz(auth.currentUser);
auth.onAuthStateChanged(u=>{
  window.__st.auth=1;bildDurdur();
  if(recRef){recRef.off();recRef=null} if(uRef){uRef.off();uRef=null} if(window.sRef){sRef.off();sRef=null} if(window.tRef){tRef.off();tRef=null} if(window.oRef){oRef.off();oRef=null} if(window.aRef){aRef.off();aRef=null} if(window.dRef){dRef.off();dRef=null} dosya=[]; if(window.fRef){fRef.off();fRef=null} if(window.iRef){iRef.off();iRef=null} fyat={sevk:{},stok:{},siparis:{}};
  started=false;menuOk=false;urunler=[];rec=null;user=u;
  if(!u){show("vLogin");return}
  recRef=db.ref("kullanicilar/"+u.uid);
  recRef.on("value",s=>{
    rec=s.val();
    if(rec&&rec.onay){
      $("me").textContent=ad();
      $("bAdm").classList.toggle("hide",!isAdmin());$("fSevk").classList.add("hide");fiyatBaglan();
      $("menuAd").textContent=rec.ad||"";menuUygula();
      if(anaBolum()&&!menuOk){menuOk=true;modSec(anaBolum())} /* operatör: menü yerine doğrudan kendi ekranı */
      show(menuOk?"vApp":"vMenu");
      if(!started){started=true;if(modGor("sevk")){yukle();adrYukle()} /* adım 3: sevk verisini sadece sevk bölümünü görebilen roller okur */bildBaslat();if(panel==="stok")stokYukle()}
      listele();qrBasla();sevkSorKaydet();
    }else{show("vWait");if(!rec&&!kayitDevam&&!kyTry[u.uid]){kyTry[u.uid]=1;kayitYaz(u)}}
  },e=>{toast("Hesap okunamadı: "+errText(e));$("wE").textContent="Hesap okunamadı: "+errText(e);show("vWait")});
});
document.querySelectorAll("[data-out]").forEach(b=>b.onclick=()=>auth.signOut());

$("tG").onclick=()=>{$("fG").classList.remove("hide");$("fK").classList.add("hide");$("tG").classList.add("on");$("tK").classList.remove("on")};
$("tK").onclick=()=>{$("fK").classList.remove("hide");$("fG").classList.add("hide");$("tK").classList.add("on");$("tG").classList.remove("on")};
/* Firebase Auth en az 6 karakter şart koşar (kapatılamaz). 6'dan kısa şifreler sabit bir ekle tamamlanıp Firebase'e öyle gönderilir. */
const SF_EK="#magfs",sifreHz=p=>p.length<6?p+SF_EK:p;
const mail=k=>k+"@mag-sevkiyat.com";
$("bG").onclick=async()=>{
  const k=$("lk").value.trim().toLowerCase(),p=$("lp").value;$("eG").textContent="";
  if(!k||!p){$("eG").textContent="Kullanıcı adı ve şifre girin.";return}
  const rem=$("lb").checked;
  try{
    await auth.setPersistence(rem?firebase.auth.Auth.Persistence.LOCAL:firebase.auth.Auth.Persistence.SESSION);
    try{await auth.signInWithEmailAndPassword(mail(k),sifreHz(p))}catch(e1){if(p!==p.trim()&&p.trim())await auth.signInWithEmailAndPassword(mail(k),sifreHz(p.trim()));else throw e1}
    try{if(rem){localStorage.setItem("hatirla_k",k);localStorage.removeItem("hatirla_p");localStorage.setItem("hatirla_on","1")}else{localStorage.removeItem("hatirla_k");localStorage.removeItem("hatirla_p");localStorage.setItem("hatirla_on","0")}}catch(_){}
    if(!rem)$("lp").value=""
  }catch(e){$("eG").textContent=errText(e)}
};
$("fG").addEventListener("submit",e=>{e.preventDefault();$("bG").click()});
try{
  const on=localStorage.getItem("hatirla_on"),k0=localStorage.getItem("hatirla_k");
  if(on==="0")$("lb").checked=false;
  if(k0)$("lk").value=k0;
  localStorage.removeItem("hatirla_p");
}catch(_){}
$("bK").onclick=async()=>{
  const n=$("rn").value.trim(),k=$("rk").value.trim().toLowerCase(),p=$("rp").value,r=$("rr").value;$("eK").textContent="";
  if(!n){$("eK").textContent="Adınızı yazın.";return}
  if(!/^[a-z0-9._-]{3,20}$/.test(k)){$("eK").textContent="Kullanıcı adı 3-20 karakter olmalı (harf, rakam, . _ -).";return}
  if(!p){$("eK").textContent="Şifre yazın.";return}
  $("bK").disabled=true;$("eK").style.color="#475569";$("eK").textContent="Hesap oluşturuluyor...";
  let c=null;pendReg={n,k,r};kayitDevam=true;
  try{c=await auth.createUserWithEmailAndPassword(mail(k),sifreHz(p))}
  catch(e){kayitDevam=false;$("eK").style.color="";$("eK").textContent="1/2 Hesap açılamadı: "+errText(e);$("bK").disabled=false;return}
  try{
    await db.ref("kullanicilar/"+c.user.uid).set({ad:n,kullanici:k,rol:r,onay:false,yonetici:false});
    $("eK").textContent="";$("wE").textContent="";
  }catch(e){$("eK").style.color="";$("eK").textContent="2/2 Hesap açıldı ama kayıt veritabanına yazılamadı: "+errText(e);$("wE").textContent="Kayıt veritabanına yazılamadı: "+errText(e);$("wR").classList.remove("hide")}
  kayitDevam=false;$("bK").disabled=false;
};
$("bAd").onclick=()=>{$("adYeni").value=(rec&&rec.ad)||"";$("dAd").showModal();$("adYeni").focus();$("adYeni").select()};
$("adNo").onclick=()=>$("dAd").close();
const adKaydet=()=>{const n=$("adYeni").value.trim();if(!n){$("dAd").close();return}db.ref("kullanicilar/"+user.uid+"/ad").set(n).then(()=>$("dAd").close()).catch(e=>toast(errText(e)))};
$("adOk").onclick=adKaydet;$("adYeni").addEventListener("keydown",e=>{if(e.key==="Enter")adKaydet()});

/* ---------- Veri ---------- */
function yukle(){
  if(uRef)uRef.off();
  uRef=db.ref(M().yol).orderByChild("eklenmeTarihi").limitToLast(limit);
  uRef.on("value",s=>{
    const v=s.val()||{};
    urunler=Object.keys(v).map(k=>Object.assign({id:k},v[k])).sort((a,b)=>(b.eklenmeTarihi||0)-(a.eklenmeTarihi||0));
    $("bMore").classList.toggle("hide",urunler.length<limit);
    listele();
  },e=>toast("Veri okunamadı: "+errText(e)));
}
$("bMore").onclick=()=>{limit+=20;yukle()};

/* ---------- Fotoğraf ---------- */
function sikistir(src,cb,mx){
  const im=new Image();
  im.onload=()=>{const c=document.createElement("canvas"),M=mx||800;let w=im.width,h=im.height;
    if(w>M){h=Math.round(h*M/w);w=M}c.width=w;c.height=h;c.getContext("2d").drawImage(im,0,0,w,h);cb(c.toDataURL("image/jpeg",.6))};
  im.src=src;
}
const FMAX=6;
function fotoCiz(){
  $("fGrid").innerHTML=fotos.map((s,i)=>`<div class="fth"><img src="${s}" alt="Foto ${i+1}" data-z="${i}"><button type="button" class="fx" data-x="${i}" aria-label="Kaldır">✖</button></div>`).join("");
  $("fSay").textContent=fotos.length?fotos.length+"/"+FMAX+" fotoğraf":"";
}
$("fGrid").onclick=e=>{const x=e.target.closest("[data-x]");if(x){fotos.splice(+x.dataset.x,1);fotoCiz();return}
  const z=e.target.closest("[data-z]");if(z&&window.fvAc)window.fvAc(fotos[+z.dataset.z])};
function foto(d){if(fotos.length>=FMAX){toast("En fazla "+FMAX+" fotoğraf eklenebilir.");return}fotos.push(d);fotoCiz()}
$("gal").onchange=e=>{[...e.target.files].forEach(f=>{const r=new FileReader();r.onload=()=>sikistir(r.result,foto);r.readAsDataURL(f)});e.target.value=""};
$("camO").onclick=async()=>{
  for(const cfg of [{video:{facingMode:{ideal:"environment"}}},{video:true}]){
    try{stream=await navigator.mediaDevices.getUserMedia(cfg);break}catch(e){}
  }
  if(!stream){toast("Kameraya erişilemedi. İzin ayarlarını kontrol edin.");return}
  $("vid").srcObject=stream;$("cam").style.display="flex";
};
function camKapat(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}$("cam").style.display="none";irsHedef=null;$("camT").style.display="none"}
$("camX").onclick=camKapat;
$("snap").onclick=()=>{const v=$("vid"),c=document.createElement("canvas");c.width=v.videoWidth||800;c.height=v.videoHeight||600;c.getContext("2d").drawImage(v,0,0,c.width,c.height);
  const src=c.toDataURL("image/jpeg",.92),h=irsHedef;camKapat();
  if(h)irsKaydet(h,src);else sikistir(src,foto)};
/* ---------- İrsaliye (Sevk Edildi) ---------- */
function sikistirIrs(src,cb){
  const im=new Image();
  im.onload=()=>{let M=1400,q=.75,out="";
    for(let i=0;i<8;i++){
      const c=document.createElement("canvas");let w=im.width,h=im.height;
      if(w>M){h=Math.round(h*M/w);w=M}c.width=w;c.height=h;c.getContext("2d").drawImage(im,0,0,w,h);
      out=c.toDataURL("image/jpeg",q);if(out.length<280000)break;
      q=Math.max(.45,q-.1);M=Math.round(M*.85);
    }
    cb(out.length<290000?out:"")};
  im.onerror=()=>cb("");
  im.src=src;
}
async function irsaliyeAc(u){
  irsHedef=u;
  const tm=sevkTur.tur==="diger"?"📝 "+sevkTur.not+" — fotoğrafını çekin":"📄 İmzalı irsaliyenin fotoğrafını çekin (isim ve imza görünsün)";
  $("camT").textContent=tm+" — "+(u.musteri&&u.musteri!=="Etikete Bakınız"?u.musteri:"sevk");
  $("camT").style.display="block";
  let st=null;
  for(const cfg of [{video:{facingMode:{ideal:"environment"}}},{video:true}]){
    try{st=await navigator.mediaDevices.getUserMedia(cfg);break}catch(e){}
  }
  if(!st){ /* kamera açılamazsa telefonun kamera uygulamasına düş */
    $("camT").style.display="none";toast("Canlı kamera açılamadı, telefon kamerası açılıyor.");
    $("irsF").onchange=e=>{const f=e.target.files[0];e.target.value="";const h=irsHedef;irsHedef=null;if(!f||!h)return;
      const r=new FileReader();r.onload=()=>irsKaydet(h,r.result);r.readAsDataURL(f)};
    $("irsF").click();return;
  }
  stream=st;$("vid").srcObject=st;$("cam").style.display="flex";
}
function irsKaydet(u,src){
  const st=Object.assign({},sevkTur);
  toast("Fotoğraf kaydediliyor...");
  sikistirIrs(src,async d=>{
    if(!d){toast("Fotoğraf çok büyük veya okunamadı, tekrar deneyin.");return}
    try{
      const cur=urunler.find(x=>x.id===u.id)||u,TS=firebase.database.ServerValue.TIMESTAMP,
        ref=db.ref(M().yol+"/"+u.id),n=irsListe(cur).length,tur=st.tur||"irsaliye",
        nt=tur==="diger"?(st.not||""):"",
        who=cur.durum==="sevk_edildi"&&cur.teslimEden?cur.teslimEden:ad();
      if(n>=IRSMAX){toast("En fazla "+IRSMAX+" fotoğraf eklenebilir.");return}
      const dd=(await fotoHazirla([d]))[0];
      if(!n)await ref.update({durum:"sevk_edildi",teslimEden:who,irsaliye:dd,irsTur:tur,irsNot:tur==="diger"?nt:null,irsaliyeCeken:ad(),irsaliyeTarihi:TS});
      else await ref.update({durum:"sevk_edildi",teslimEden:who,["irsEkler/"+db.ref().push().key]:{f:dd,tur:tur,not:nt,ceken:ad(),tarih:TS}});
      toast(n?"✓ Fotoğraf eklendi ("+(n+1)+"/"+IRSMAX+").":"✓ Teslim edildi, fotoğraf eklendi.");
    }catch(err){toast(errText(err))}
  });
}
/* ---------- Sevk Edildi: fotoğraf türü (irsaliye / iade / diğer) ---------- */
let sevkTur={tur:"irsaliye",not:""},turU=null;
function turEtiket(u){
  const t=u.irsTur||"irsaliye";
  if(t==="iade")return "↩️ <b>İade</b>";
  if(t==="diger")return "📝 <b>Diğer"+(u.irsNot?": "+esc(u.irsNot):"")+"</b>";
  return "📄 <b>İmzalı irsaliye</b>";
}
function turAc(u){
  turU=u;sevkTur={tur:"irsaliye",not:""};
  $("turH").textContent=u.durum==="sevk_edildi"?"➕ Fotoğraf ekle":"✓ Teslim Edildi";
  $("turNotW").classList.add("hide");$("turOk").classList.add("hide");$("turNot").value="";$("turE").textContent="";
  $("dTur").showModal();
}
function turBaslat(t,n){sevkTur={tur:t,not:n};const u=turU;$("dTur").close();if(u)irsaliyeAc(u)}
$("turBtns").onclick=e=>{
  const b=e.target.closest("button[data-t]");if(!b)return;const t=b.dataset.t;
  if(t==="diger"){$("turNotW").classList.remove("hide");$("turOk").classList.remove("hide");$("turNot").focus();return}
  turBaslat(t,"");
};
$("turOk").onclick=()=>{const n=$("turNot").value.trim();if(!n){$("turE").textContent="Lütfen ne olduğunu yazın.";return}turBaslat("diger",n)};
$("turX").onclick=()=>$("dTur").close();
const safeImg=s=>/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+(#[A-Za-z0-9_-]{20})?$/.test(s||"")?s:"";
/* ---------- Fotoğraf: liste için küçük önizleme + tam boyut ayrı bölümde (fotoTam) ----------
   Kayıttaki alan: "data:image/jpeg;base64,<küçük önizleme>#<fotoTam anahtarı>". Tam boyut büyütünce yüklenir. */
const FRAG=/#[A-Za-z0-9_-]{20}$/;
function kucult(src,mx){return new Promise(ok=>{const im=new Image();
  im.onload=()=>{try{const c=document.createElement("canvas"),M=mx||320;let w=im.width,h=im.height;
    if(w>M||h>M){const k=M/Math.max(w,h);w=Math.max(1,Math.round(w*k));h=Math.max(1,Math.round(h*k))}
    c.width=w;c.height=h;c.getContext("2d").drawImage(im,0,0,w,h);ok(c.toDataURL("image/jpeg",.6))}catch(e){ok("")}};
  im.onerror=()=>ok("");im.src=src})}
async function fotoHazirla(list){
  const out=[];
  for(const s of list){
    if(!s||FRAG.test(s)||!safeImg(s)){out.push(s);continue}
    const th=await kucult(s,320);
    if(!th||th.length>=s.length){out.push(s);continue}
    const key=db.ref("fotoTam").push().key;
    await db.ref("fotoTam/"+key).set(s);
    out.push(th+"#"+key)}
  return out}
window.fotoTamGetir=async function(key){const x=await db.ref("fotoTam/"+key).once("value"),v=x.val();return safeImg(v)&&!FRAG.test(v)?v:""};
const ekFoto=u=>(Array.isArray(u.fotolar)?u.fotolar:Object.values(u.fotolar||{})).map(safeImg).filter(Boolean);
const fotoListe=u=>[safeImg(u.foto)].filter(Boolean).concat(ekFoto(u));
/* ---------- Teslim fotoğrafları (çoklu): ana = irsaliye alanları, ekler = irsEkler/{anahtar} ---------- */
const IRSMAX=6;
function irsListe(u){
  const r=[];
  if(safeImg(u.irsaliye))r.push({k:null,f:u.irsaliye,tur:u.irsTur||"irsaliye",not:u.irsNot||"",ceken:u.irsaliyeCeken||"",tarih:u.irsaliyeTarihi||0});
  const E=u.irsEkler||{};
  (Array.isArray(E)?E.map((x,i)=>[String(i),x]):Object.entries(E)).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0).forEach(([k,x])=>{
    if(x&&safeImg(x.f))r.push({k:k,f:x.f,tur:x.tur||"irsaliye",not:x.not||"",ceken:x.ceken||"",tarih:x.tarih||0})});
  return r;
}
function irsHtml(u){
  const L=irsListe(u),id=esc(u.id),sevk=mod==="sevk",
    zt=t=>t?esc(new Date(t).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})):"";
  let h=L.map(x=>`<div style="display:flex;gap:6px;align-items:stretch"><button type="button" class="dosya" style="flex:1;width:auto;min-width:0" data-a="irs" data-id="${id}" data-k="${esc(x.k||"")}"><img class="th" src="${x.f}" alt=""><div class="dm"><div>${turEtiket({irsTur:x.tur,irsNot:x.not})}</div><div class="dd">${zt(x.tarih)}${x.ceken?" · "+esc(x.ceken):""}</div></div><span class="dz">🔍</span></button>${sevk?`<button type="button" class="btn b5" style="width:46px;margin:8px 0 0;padding:0;font-size:19px" data-a="irsdel" data-id="${id}" data-k="${esc(x.k||"")}" aria-label="Fotoğrafı kaldır">🗑️</button>`:""}</div>`).join("");
  if(sevk&&u.durum==="sevk_edildi"&&L.length<IRSMAX)h+=`<button type="button" class="btn b4" style="margin-top:8px" data-a="irsadd" data-id="${id}">➕ Fotoğraf ekle (${L.length}/${IRSMAX})</button>`;
  return h;
}
async function irsSil(u,k){
  const L=irsListe(u);if(!L.some(y=>(y.k||"")===(k||"")))return;
  if(!confirm("Bu fotoğraf kaldırılsın mı?"))return;
  const p=M().yol+"/"+u.id+"/",up={};
  if(k)up[p+"irsEkler/"+k]=null;
  else{
    const n=L.find(y=>y.k);
    if(n){up[p+"irsaliye"]=n.f;up[p+"irsTur"]=n.tur;up[p+"irsNot"]=n.tur==="diger"?(n.not||""):null;up[p+"irsaliyeCeken"]=n.ceken||null;up[p+"irsaliyeTarihi"]=n.tarih||null;up[p+"irsEkler/"+n.k]=null}
    else["irsaliye","irsTur","irsNot","irsaliyeCeken","irsaliyeTarihi"].forEach(a=>up[p+a]=null);
  }
  await db.ref().update(up);toast("Fotoğraf kaldırıldı.");
}

/* ---------- Kayıt ---------- */
function formTemizle(){
  editId="";fotos=[];{const kb=$("kgBox");if(kb){kb.classList.add("hide");$("kg").value="";$("pk").value=""}}
  ["mu","ur","no","ad","hu","sfi"].forEach(i=>$(i).value="");$("sfe").value="kg";kdvSet("sevk",null);$("tr").valueAsDate=new Date();$("du").value="hazir";
  fotoCiz();$("bSave").textContent=M().kayit;$("bCancel").classList.add("hide");
}
$("bCancel").onclick=formTemizle;
$("bSave").onclick=async()=>{
  if(!editId&&!fotos.length){toast("Önce en az bir fotoğraf ekleyin.");return}
  let adres=$("ad").value.trim(),hu=$("hu").value.trim(),url=safeUrl(hu);
  if(hu&&!url&&!adres)adres=hu;
  const d={musteri:$("mu").value.trim()||"Etikete Bakınız",urun:$("ur").value.trim()||"Etikete Bakınız",tarih:$("tr").value,durum:$("du").value,not:$("no").value.trim(),adres,haritaUrl:url};
  /* Kg / paket sadece iş emrinde «Depoya girişi kaydet» ile girilir; burada yeni kayıtta 0, düzenlemede mevcut değer korunur */
  if(!editId){d.kg=0;d.paket=0}
  else if(!$("kgBox").classList.contains("hide")){ /* yönetici: elle eklenen kaydın kg / paket düzeltmesi */
    const kg2=parseFloat(String($("kg").value).replace(",","."))||0,pk2=parseInt($("pk").value)||0;
    if(kg2<0||pk2<0){toast("Kg ve paket 0 veya daha büyük olmalı.");return}
    d.kg=kg2;d.paket=pk2}
  const b=$("bSave");b.disabled=true;
  try{
    {const fl=await fotoHazirla(fotos);d.foto=fl[0]||null;d.fotolar=fl.length>1?fl.slice(1):null}
    let sid=editId;
    if(editId){d.duzenleyen=ad();await db.ref(M().yol+"/"+editId).update(d)}
    else{d.ekleyen=ad();d.ekleyenUid=user.uid;d.eklenmeTarihi=firebase.database.ServerValue.TIMESTAMP;const nr=db.ref(M().yol).push();sid=nr.key;await nr.set(d)}
    formTemizle();toast("Kaydedildi");
  }catch(e){toast("Kaydedilemedi: "+errText(e))}
  b.disabled=false;
};
function duzenle(u){
  if(!sevForm())return;
  editId=u.id;
  {const km=isAdmin()&&!u.isEmriNo;$("kgBox").classList.toggle("hide",!km);if(km){$("kg").value=u.kg||0;$("pk").value=u.paket||0}}
  $("mu").value=u.musteri==="Etikete Bakınız"?"":u.musteri||"";$("ur").value=u.urun==="Etikete Bakınız"?"":u.urun||"";
  $("tr").value=u.tarih;$("du").value=u.durum==="sevk_edildi"?"sevk_edilecek":u.durum;
  $("no").value=u.not||"";$("ad").value=u.adres||"";$("hu").value=u.haritaUrl||"";{const f=(fyat.sevk||{})[u.id];$("sfi").value=f?f.tutar:"";$("sfe").value=f?f.esas:"kg";kdvSet("sevk",f)}
  fotos=fotoListe(u);fotoCiz();
  $("bSave").textContent="💾 Değişiklikleri Kaydet";$("bCancel").classList.remove("hide");window.scrollTo({top:0,behavior:"smooth"});
}
function haritaAc(url,adres){
  if(url)window.open(url,"_blank","noopener");
  else if(adres)window.open("https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(adres),"_blank","noopener");
  else window.open("https://www.google.com/maps","_blank","noopener");
}
$("hSec").onclick=()=>{const v=$("hu").value.trim(),a=$("ad").value.trim();haritaAc(safeUrl(v),v&&!safeUrl(v)?v:a)};

/* ---------- Liste ---------- */
$("tabs").onclick=e=>{const t=e.target.dataset.t;if(!t)return;tab=t;
  document.querySelectorAll("#tabs button").forEach(b=>b.className=b.dataset.t===t?{hazir:"a1",sevk_edilecek:"a2",sevk_edildi:"a3"}[t]:"");listele()};
fbKur("q",{d1:"d1",d2:"d2",fn:()=>listele(),nocount:true});
function filtreli(){
  const st=fbDurum("q"),R=urunler.filter(u=>u.durum===tab&&fbEsles(st,[u.musteri,u.urun,u.not,u.adres,u.ekleyen,u.isEmriNo],u.tarih));
  fbSay("q",R.length,urunler.filter(u=>u.durum===tab).length);return R;
}
function waGonder(u){
  const t=["🚚 *MAG AMBALAJ - "+(M().baslik||"Sevkiyat")+"*","Tarih: "+trDate(u.tarih),
    u.musteri?"Müşteri: "+u.musteri:"",u.urun?"Ürün/Ebat: "+u.urun:"",
    "Ağırlık: "+fmt(u.kg)+" kg","Adet: "+fmt(u.paket),
    u.arac&&ARACLAR[u.arac]&&u.durum!=="hazir"?"🚚 Araç: "+ARACLAR[u.arac]:"",u.adres?"📍 "+u.adres:"",u.haritaUrl||"",u.not?"📌 Not: "+u.not:""].filter(Boolean).join("\n");
  window.open("https://wa.me/?text="+encodeURIComponent(t),"_blank");
}
function kart(u){
  const R=M().rozet,c={hazir:["hazir-border","badge-hazir",R[0]],sevk_edilecek:["sevk-border","badge-sevk",R[1]],sevk_edildi:["tamam-border","badge-tamam",R[2]]}[u.durum]||["","",""];
  const m=u.musteri&&u.musteri!=="Etikete Bakınız",p=u.urun&&u.urun!=="Etikete Bakınız",id=esc(u.id);
  const bt=(to,t,cl,span)=>`<button class="btn ${cl}" ${span?'style="grid-column:span 2" ':''}data-a="durum" data-to="${to}" data-id="${id}">${t}</button>`;
  const geri=u.durum==="sevk_edilecek"?["hazir",M().geri[0],"b6"]:u.durum==="sevk_edildi"?["sevk_edilecek",M().geri[1],"b2"]:null;
  const ileri=u.durum==="hazir"?((mod==="sevk"&&!sevForm())?null:["sevk_edilecek",M().ileri[0],"b2"]):u.durum==="sevk_edilecek"?["sevk_edildi",M().ileri[1],"b4"]:null;
  const both=geri&&ileri,canDel=sevForm()&&(isAdmin()||(u.ekleyenUid&&u.ekleyenUid===user.uid));
  const nx=(geri?bt(geri[0],geri[1],geri[2],!both):"")+(ileri?bt(ileri[0],ileri[1],ileri[2],!both):"");
  const eb=!sevForm()?"":`<button class="btn b6" ${canDel?"":'style="grid-column:span 2" '}data-a="edit" data-id="${id}">✏️ Düzenle</button>`;
  const db2=canDel?`<button class="btn b5" data-a="del" data-id="${id}">🗑️ Sil</button>`:"";
  const onb=(u.durum==="sevk_edildi"&&mod==="sevk"&&isAdmin())?`<button class="btn b3" style="grid-column:span 2;padding:14px;font-size:18px" data-a="onay" data-id="${id}">✅ ONAYLA (Dosyalara taşı)</button>`:"";
  const K2=Array.isArray(u.kalem)&&u.kalem.length>1?u.kalem:null;
  const mid=K2?`<div class="grid" style="margin-top:8px"><div class="info"><small>Müşteri</small><b>${esc(u.musteri)}</b></div><div class="info"><small>Ürün</small><b>${esc(u.urunAd||u.urun)}</b></div></div>`+K2.map(k=>`<div style="margin:12px 0 4px;font-weight:800;font-size:16px;color:#334155">${esc(k.ad)}</div><div class="grid"><div class="hl"><small>AĞIRLIK</small><b>${esc(fmt(k.kg))} KG</b></div><div class="hl"><small>PAKET / ADET</small><b>${esc(fmt(k.paket))} Adet</b></div></div>`).join(""):`  <div class="grid"><div class="hl"><small>AĞIRLIK</small><b>${esc(fmt(u.kg))} KG</b></div><div class="hl"><small>PAKET / ADET</small><b>${esc(fmt(u.paket))} Adet</b></div></div>
  ${m||p?`<div class="grid" style="margin-top:8px">${m?`<div class="info full"><small>Müşteri</small><b>${esc(u.musteri)}</b></div>`:""}${p?ebatBlok(u.urun):""}</div>`:""}
`;
  return `<div class="item ${c[0]}">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span style="font-size:14px;font-weight:700;color:#64748b">Tarih: ${esc(trDate(u.tarih))}</span><span class="badge ${c[1]}">${c[2]}</span></div>
  ${fotoListe(u).map(s=>`<img loading="lazy" src="${s}" alt="Etiket">`).join("")}
  ${mid}
  ${u.adres?`<div class="addr">📍 <b>Teslimat adresi:</b> ${esc(u.adres)}</div>`:""}
  ${u.haritaUrl||u.adres?`<button class="btn b7" data-a="map" data-id="${id}">🚀 Yol Tarifi Al</button>`:""}
  <button class="btn b3" data-a="wa" data-id="${id}">📲 WhatsApp ile paylaş</button>
  ${u.not?`<div class="note">📌 <b>Not:</b> ${esc(u.not)}</div>`:""}
  <div class="who">Kaydeden: ${esc(u.ekleyen||"Bilinmiyor")}${u.duzenleyen?" · Son düzenleyen: "+esc(u.duzenleyen):""}</div>
  ${mod==="sevk"&&u.durum!=="hazir"&&ARACLAR[u.arac]?`<div class="who" style="color:#0f766e;font-weight:700">🚚 ${esc(ARACLAR[u.arac])}${u.sevkSorumlu?" · Sevk sorumlusu: "+esc(u.sevkSorumlu):""}</div>`:""}
  ${u.teslimEden?`<div class="who" style="color:#2563eb;font-weight:700">${M().teslim}: ${esc(u.teslimEden)}</div>`:""}
  ${irsHtml(u)}
  <div class="acts">${onb}${mod==="sevk"&&u.durum==="sevk_edilecek"&&sevForm()?`<button class="btn b6" style="grid-column:span 2" data-a="arac" data-id="${id}">🚚 Araç / sorumlu değiştir</button>`:""}${u.isEmriNo&&u.durum==="hazir"&&mod==="sevk"&&sevForm()?`<button class="btn b2" style="grid-column:span 2" data-a="isgeri" data-id="${id}">↩️ İş emrine geri al (Biten)</button>`:""}${nx}${eb}${db2}</div></div>`;
}
let aracTab="isuzu";
$("liste").addEventListener("click",e=>{const b=e.target.closest("button[data-arac]");if(!b)return;aracTab=b.dataset.arac;listele()});
function listele(){
  if(!started)return;
  const L=filtreli();
  $("sumT").textContent=`${L.length} kayıt · ${fmt(L.reduce((s,u)=>s+(+u.kg||0),0))} kg · ${fmt(L.reduce((s,u)=>s+(+u.paket||0),0))} adet`;
  if(mod==="sevk"&&tab==="sevk_edilecek"){
    const dg=L.filter(u=>!ARACLAR[u.arac]),K=[["isuzu","🚛 ISUZU KAMYON","34 DFV 172",L.filter(u=>u.arac==="isuzu")],["ford","🚐 FORD MİNİBÜS","34 EOM 772",L.filter(u=>u.arac==="ford")]];
    if(dg.length)K.push(["yok","❔ ARAÇSIZ","atanmamış",dg]);
    if(!K.some(x=>x[0]===aracTab))aracTab="isuzu";
    const sec=K.find(x=>x[0]===aracTab),A=sec[3];
    $("liste").innerHTML=`<div style="display:grid;grid-template-columns:repeat(${K.length},1fr);gap:6px;margin:10px 0">`+K.map(x=>`<button type="button" class="btn ${x[0]===aracTab?"b2":"b6"}" style="margin:0;padding:10px 4px;font-size:14px;line-height:1.25" data-arac="${x[0]}">${x[1]}<br><small>${x[2]} · ${x[3].length} kayıt</small></button>`).join("")+`</div>`
      +`<div style="margin:0 0 8px;font-weight:700;color:#0f766e;font-size:14px">${A.length} kayıt · ${esc(fmt(A.reduce((x,u)=>x+(+u.kg||0),0)))} kg</div>`
      +(A.length?A.map(kart).join(""):'<div class="empty">Bu araca atanmış kayıt yok.</div>');
    return;
  }
  $("liste").innerHTML=L.length?L.map(kart).join(""):'<div class="empty">Kayıt bulunamadı.</div>';
}
$("liste").onclick=async e=>{
  const b=e.target.closest("button[data-a]");if(!b)return;
  const u=urunler.find(x=>x.id===b.dataset.id);if(!u)return;
  try{
    if(b.dataset.a==="edit")duzenle(u);
    else if(b.dataset.a==="irs"){const x=irsListe(u).find(y=>(y.k||"")===(b.dataset.k||""));if(x&&window.fvAc)window.fvAc(x.f)}
    else if(b.dataset.a==="irsdel")await irsSil(u,b.dataset.k||null);
    else if(b.dataset.a==="irsadd")turAc(u);
    else if(b.dataset.a==="onay"){if(isAdmin()&&confirm("Bu sevk onaylansın ve Dosyalar bölümüne taşınsın mı?"))await dosyayaTasi(u)}
    else if(b.dataset.a==="wa")waGonder(u);
    else if(b.dataset.a==="isgeri")await isGeri(u);
    else if(b.dataset.a==="map")haritaAc(u.haritaUrl,u.adres);
    else if(b.dataset.a==="arac"){if(sevForm())aracAc(u)}
    else if(b.dataset.a==="durum"&&mod==="sevk"&&b.dataset.to==="sevk_edilecek"&&u.durum==="hazir"){if(!sevForm()){toast("Sevkiyat sorumluları sevk listesine alamaz.");return}aracAc(u)}
    else if(b.dataset.a==="durum"&&mod==="sevk"&&b.dataset.to==="sevk_edildi"){turAc(u)}
    else if(b.dataset.a==="durum"){const up={durum:b.dataset.to};up.teslimEden=b.dataset.to==="sevk_edildi"?ad():null;if(mod==="sevk"&&b.dataset.to==="hazir"&&sevForm()){up.arac=null;up.sevkSorumlu=null;up.sevkSorumluUid=null}await db.ref(M().yol+"/"+u.id).update(up)}
    else if(b.dataset.a==="del"&&confirm("Bu kayıt silinsin mi?")){await silCop(M().yol,u.id,(u.musteri||"")+" / "+(u.urun||""),isAdmin()?["fiyatlar/sevk/"+u.id]:[]);toast("Silindi (Çöp kutusuna alındı)")}
  }catch(err){toast(errText(err))}
};
/* ---------- Sevk listesine al: sevkiyat sorumlusu + araç seçimi ---------- */
let aracU=null,sorL=[];
async function aracAc(u){
  aracU=u;$("aracE").textContent="";$("aracS").value=ARACLAR[u.arac]?u.arac:"";
  const sel=$("sorS");sel.innerHTML='<option value="">Yükleniyor...</option>';$("dArac").showModal();
  try{
    const sn=await db.ref("sevkSorumlulari").once("value"),v=sn.val()||{};
    sorL=Object.keys(v).map(k=>({uid:k,ad:String((v[k]&&v[k].ad)||"?")})).sort((a,b)=>a.ad.localeCompare(b.ad,"tr"));
    sel.innerHTML='<option value="">Sevkiyat sorumlusu seçin</option>'+sorL.map(x=>`<option value="${esc(x.uid)}"${x.uid===u.sevkSorumluUid?" selected":""}>${esc(x.ad)}</option>`).join("");
    if(!sorL.length)$("aracE").textContent="Sevkiyat sorumlusu listesi boş. Yönetici bir kez giriş yapınca liste dolar.";
  }catch(e){sel.innerHTML='<option value="">Liste okunamadı</option>';$("aracE").textContent=errText(e)}
}
$("aracX").onclick=()=>$("dArac").close();
$("aracOk").onclick=async()=>{
  const u=aracU,x=sorL.find(y=>y.uid===$("sorS").value),ar=$("aracS").value;
  if(!u)return;
  if(!x){$("aracE").textContent="Lütfen sevkiyat sorumlusunu seçin.";return}
  if(!ARACLAR[ar]){$("aracE").textContent="Lütfen aracı seçin.";return}
  const b=$("aracOk");b.disabled=true;
  try{
    await db.ref(M().yol+"/"+u.id).update({durum:"sevk_edilecek",teslimEden:null,arac:ar,sevkSorumlu:x.ad,sevkSorumluUid:x.uid});
    $("dArac").close();toast("✓ Sevk listesine alındı: "+ARACLAR[ar]);
  }catch(err){$("aracE").textContent=errText(err)}
  b.disabled=false;
};
/* Sevkiyat sorumlusu listesi: yönetici girişte kullanıcılardan doldurur, sorumlular da kendilerini ekler */
const sorDone={};
function sevkSorYaz(v){
  if(!isAdmin())return;const o={};
  Object.keys(v||{}).forEach(k=>{const x=v[k];if(x&&x.onay===true&&x.rol==="Sevkiyat Sorumlusu")o[k]={ad:String(x.ad||x.kullanici||"?").slice(0,100)}});
  return db.ref("sevkSorumlulari").set(o).catch(()=>{});
}
async function sevkSorKaydet(){
  if(!user||!rec||!rec.onay||sorDone[user.uid])return;sorDone[user.uid]=1;
  try{
    if(isAdmin()){const sn=await db.ref("kullanicilar").once("value");await sevkSorYaz(sn.val()||{})}
    else if(rec.rol==="Sevkiyat Sorumlusu")await db.ref("sevkSorumlulari/"+user.uid).set({ad:String(rec.ad||"?").slice(0,100)});
  }catch(e){sorDone[user.uid]=0}
}
$("bCsv").onclick=()=>{
  const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"',n=v=>q(String(+v||0).replace(".",","));
  const r=[["Tarih","Müşteri","Ürün","Kg","Adet","Adres","Not","Kaydeden","Araç","Sevk sorumlusu"].map(q).join(";")].concat(filtreli().map(u=>[q(trDate(u.tarih)),q(u.musteri),q(u.urun),n(u.kg),n(u.paket),q(u.adres),q(u.not),q(u.ekleyen),q(u.durum!=="hazir"&&ARACLAR[u.arac]?ARACLAR[u.arac]:""),q(u.durum!=="hazir"?u.sevkSorumlu||"":"")].join(";")));
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+r.join("\r\n")],{type:"text/csv;charset=utf-8"}));a.download=mod+"-"+tab+".csv";a.click();
};

/* ---------- Hazır üründen iş emrine (BİTEN) geri alma ---------- */
async function isGeri(u){
  if(!confirm("Bu ürün iş emrine geri alınsın ve İş Emirleri > BİTEN bölümüne dönsün mü?"))return;
  let e=null;
  if(u.isEmriId){const s=await db.ref("isEmirleri/"+u.isEmriId).once("value");if(s.exists())e=Object.assign({id:u.isEmriId},s.val())}
  if(!e&&u.isEmriNo){const s=await db.ref("isEmirleri").orderByChild("eklenmeTarihi").limitToLast(300).once("value"),v=s.val()||{},k=Object.keys(v).find(x=>v[x].no===u.isEmriNo);if(k)e=Object.assign({id:k},v[k])}
  if(!e){toast("Bağlı iş emri bulunamadı (silinmiş olabilir).");return}
  let keys=e.aktarKeys?Object.keys(e.aktarKeys):[];if(!keys.includes(u.id))keys=[u.id];
  const up={};
  for(const k of keys){
    const [a,d]=await Promise.all([db.ref("urunler/"+k).once("value"),db.ref("dosyalar/"+k).once("value")]);
    if(d.exists()){toast("Bu iş emrinin bir kısmı onaylanıp Dosyalar'a taşınmış, geri alınamaz.");return}
    if(a.exists()){if(a.val().durum!=="hazir"){toast("Bu iş emrinin bir kısmı sevk listesine alınmış. Önce hepsini Hazır Ürünlere geri alın.");return}up["urunler/"+k]=null}
  }
  up["isEmirleri/"+e.id+"/aktarildi"]=null;up["isEmirleri/"+e.id+"/aktarTarih"]=null;up["isEmirleri/"+e.id+"/aktarKeys"]=null;
  await db.ref().update(up);
  toast("✓ "+(e.no||"İş emri")+" BİTEN bölümüne geri alındı");
}

/* ---------- Yönetici paneli ---------- */
const ROLLER=Object.keys(YETKI); /* rol listesi tek yerden: YETKI tablosu */
/* adım 4: kişiye özel izinler — rol şablonu varsayılan, kutucuklar sadece farkı kaydeder (kullanicilar/<uid>/izin/<anahtar>) */
const IZ_GRUP=[["Bölümler",[["sevk","Sevkiyat"],["stok","Stok"],["is","İş emirleri"],["uretim","Üretim"],["rap","Raporlar"],["tah","Tahsilat & talimat"]]],["İş emri aşamasını ilerletme",[["a_etiket","Etiket"],["a_ekstruder","Ekstruder"],["a_baski","Baskı"],["a_kesim","Kesim"],["a_depo","Depo"]]],["İşlemler",[["isAc","Yeni iş emri aç"],["isDuzenle","İş emri düzenle"],["geriAl","Aşama geri al"],["isSil","İş emri sil"],["fiyat","İş emrinde fiyat"]]]];
const izVarsayilan=(rol,k)=>{const y=YETKI[rol];if(!y)return false;if(k.indexOf("a_")===0)return y.asama.includes(k.slice(2));if(["sevk","stok","is","uretim","rap","tah"].includes(k))return y.mod.includes(k);return !!y[k]};
const izEtkin=(k0,k)=>{const v=k0.izin?k0.izin[k]:undefined;return typeof v==="boolean"?v:izVarsayilan(k0.rol,k)};
const izKayit={},izAcik=new Set();
function izOzet(det,k0){const n=Object.keys(k0.izin||{}).length,sp=det&&det.querySelector("[data-izs]");if(sp){sp.textContent=n?"· "+n+" özel ayar":"· rol şablonu";sp.style.color=n?"#b45309":"#64748b"}}
function izHtml(id,k){const n=k.izin?Object.keys(k.izin).length:0,e=esc(id),a=esc(k.ad||"");
  return `<details data-izd="${e}" ${izAcik.has(id)?"open":""} style="padding:6px 0 8px;border-bottom:1px solid #e2e8f0"><summary style="font-size:14px;font-weight:700;cursor:pointer">🔐 Kişiye özel izinler <span data-izs style="color:${n?"#b45309":"#64748b"}">${n?"· "+n+" özel ayar":"· rol şablonu"}</span></summary>`
  +IZ_GRUP.map(([t,L])=>`<div style="margin-top:6px;font-size:13px;font-weight:700;color:#64748b">${t}</div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">${L.map(([key,ad])=>`<label class="chip" style="padding:4px 9px;font-size:14px"><input type="checkbox" data-iz="${key}" data-uz="${e}" data-ad="${a}"${izEtkin(k,key)?" checked":""}> ${ad}</label>`).join("")}</div>`).join("")
  +`<button class="btn sm b6" style="margin-top:8px" data-izreset data-uz="${e}" data-ad="${a}">↩️ Rol şablonuna dön</button></details>`}
async function kullanicilar(){
  try{
    const s=await db.ref("kullanicilar").once("value"),v=s.val()||{};
    Object.keys(izKayit).forEach(x=>delete izKayit[x]);Object.keys(v).forEach(x=>{izKayit[x]=v[x]});
    sevkSorYaz(v);
    $("ulist").innerHTML=Object.keys(v).map(id=>{const k=v[id],self=id===user.uid,da=`data-u="${esc(id)}" data-ad="${esc(k.ad||"")}"`;
      const opts=(ROLLER.includes(k.rol)?ROLLER:[k.rol].concat(ROLLER)).filter(Boolean).map(r=>`<option${r===k.rol?" selected":""}>${esc(r)}</option>`).join("");
      return `<div class="uw"><div class="urow"><div><b>${esc(k.ad)}</b> <span style="color:#64748b">@${esc(k.kullanici)}</span><br><small>${k.onay?"Onaylı":"⏳ Onay bekliyor — rolü kontrol edip onaylayın"}${k.yonetici?" · Yönetici":""}</small><br>${self?`<small>${esc(k.rol||"")}</small>`:`<select ${da} data-f="rol" style="margin-top:4px;font-size:14px;padding:4px">${opts}</select>`}</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">${self?"<small>Siz</small>":
      `<button class="btn sm ${k.onay?"b5":"b3"}" ${da} data-f="onay" data-v="${!k.onay}">${k.onay?"Engelle":"Onayla"}</button>
       <button class="btn sm b6" ${da} data-f="yonetici" data-v="${!k.yonetici}">${k.yonetici?"Yöneticiliği al":"Yönetici yap"}</button>
       <button class="btn sm b4" ${da} data-f="sifre">🔑 Şifre</button>`}</div></div>${self||k.yonetici===true||!k.onay?"":izHtml(id,k)}</div>`}).join("")||"<p>Kullanıcı yok.</p>";
  }catch(e){toast(errText(e))}
}
$("bAdm").onclick=()=>{$("dAdm").showModal();kullanicilar();bkSonGoster()};
$("dClose").onclick=()=>$("dAdm").close();
$("ulist").onclick=async e=>{const b=e.target.closest("button[data-u]");if(!b)return;
  if(b.dataset.f==="sifre"){sfAc(b.dataset.u,b.dataset.ad||"");return}
  try{await db.ref("kullanicilar/"+b.dataset.u+"/"+b.dataset.f).set(b.dataset.v==="true");
    denetimYaz("kullanici",b.dataset.ad||"",b.dataset.f+" = "+(b.dataset.v==="true"?"evet":"hayır"),"kullanicilar",b.dataset.u);kullanicilar()}catch(err){toast(errText(err))}};
$("ulist").onchange=async e=>{const x=e.target.closest("select[data-u]");if(!x)return;
  try{await db.ref("kullanicilar/"+x.dataset.u+"/rol").set(x.value);denetimYaz("kullanici",x.dataset.ad||"","rol = "+x.value,"kullanicilar",x.dataset.u);toast("Rol güncellendi");kullanicilar()}catch(err){toast(errText(err));kullanicilar()}};
$("ulist").addEventListener("toggle",e=>{const d=e.target;if(d&&d.dataset&&d.dataset.izd){if(d.open)izAcik.add(d.dataset.izd);else izAcik.delete(d.dataset.izd)}},true);
$("ulist").addEventListener("change",async e=>{const c=e.target.closest("input[data-iz]");if(!c)return;
  const id=c.dataset.uz,key=c.dataset.iz,k0=izKayit[id];if(!k0)return;const def=izVarsayilan(k0.rol,key),on=c.checked;
  try{await db.ref("kullanicilar/"+id+"/izin/"+key).set(on===def?null:on);
    k0.izin=k0.izin||{};if(on===def)delete k0.izin[key];else k0.izin[key]=on;
    denetimYaz("kullanici",c.dataset.ad||"","izin "+key+" = "+(on?"açık":"kapalı"),"kullanicilar",id);izOzet(c.closest("details"),k0)}
  catch(err){c.checked=!on;toast(errText(err))}});
$("ulist").addEventListener("click",async e=>{const b=e.target.closest("button[data-izreset]");if(!b)return;
  const id=b.dataset.uz,k0=izKayit[id];if(!k0||!confirm("Bu kişinin özel izinleri silinsin, rol şablonuna dönsün mü?"))return;
  try{await db.ref("kullanicilar/"+id+"/izin").set(null);k0.izin=null;const det=b.closest("details");
    det.querySelectorAll("input[data-iz]").forEach(i=>{i.checked=izVarsayilan(k0.rol,i.dataset.iz)});
    denetimYaz("kullanici",b.dataset.ad||"","izinler rol şablonuna döndürüldü","kullanicilar",id);izOzet(det,k0)}catch(err){toast(errText(err))}});


/* ---------- Denetim kaydı + çöp kutusu ---------- */
const kisalt=(s,n)=>String(s==null?"":s).slice(0,n);
const TSV=()=>firebase.database.ServerValue.TIMESTAMP;
function denetimYaz(tur,baslik,detay,yol,id){
  const o={tur:kisalt(tur,20),baslik:kisalt(baslik,120),kim:kisalt(ad(),100),uid:user.uid,zaman:TSV()};
  if(detay)o.detay=kisalt(detay,200);if(yol)o.yol=kisalt(yol,140);if(id)o.id=kisalt(id,100);
  return db.ref("denetim").push().set(o).catch(()=>{})}
/* Kaydı çöp kutusuna kopyalayıp asıl yerinden siler (tek işlemde). ek: birlikte silinecek ilgili yollar */
async function silCop(yol,id,baslik,ek){
  const s=await db.ref(yol+"/"+id).once("value");if(!s.exists())return false;
  const k=db.ref("cop").push().key,up={},ekl=[];
  for(const p of (ek||[])){try{const x=await db.ref(p).once("value");if(x.exists()){ekl.push({p:p,v:x.val()});up[p]=null}}catch(e){}}
  const c={yol:yol,id:id,tur:kisalt(yol.split("/")[0],20),baslik:kisalt(baslik||id,120),veri:s.val(),kim:kisalt(ad(),100),uid:user.uid,zaman:TSV()};
  if(ekl.length)c.ek=ekl;
  up["cop/"+k]=c;up[yol+"/"+id]=null;
  up["denetim/"+db.ref("denetim").push().key]={tur:"sil",baslik:kisalt(baslik||id,120),yol:kisalt(yol,140),id:kisalt(id,100),kim:kisalt(ad(),100),uid:user.uid,zaman:TSV()};
  await db.ref().update(up);return true}
const COP_YOL=/^(urunler|stokKalem|tedarikciler|siparisler|sevkAdresleri|isEmirleri|dosyalar|tahsilatlar|etiketSablon\/[^\/.$#\[\]]+)$/,
  COP_EK=/^(fiyatlar\/(sevk|stok|siparis)|isHareket|etiketGecmis|dosyaFoto)\/[^\/.$#\[\]]+$/,COP_ID=/^[^\/.$#\[\]]+$/;
const zamanTR=t=>t?new Date(t).toLocaleString("tr-TR",{timeZone:TRZ,day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"";
const TURAD={urunler:"Sevkiyat",stokKalem:"Stok kalemi",tedarikciler:"Tedarikçi",siparisler:"Sipariş",sevkAdresleri:"Sevk adresi",isEmirleri:"İş emri",dosyalar:"Dosya",etiketSablon:"Etiket şablonu",tahsilatlar:"Tahsilat"};
async function copListele(){
  try{
    const s=await db.ref("cop").orderByChild("zaman").limitToLast(50).once("value"),v=s.val()||{},ks=Object.keys(v).sort((a,b)=>(v[b].zaman||0)-(v[a].zaman||0));
    $("copList").innerHTML=ks.map(k=>{const c=v[k];return `<div class="urow"><div><b>${esc(c.baslik||c.id)}</b><br><small>${esc(TURAD[c.tur]||c.tur||"")} · ${esc(c.kim||"")} · ${esc(zamanTR(c.zaman))}</small></div>
      <div style="display:flex;gap:4px"><button class="btn sm b3" data-c="${esc(k)}" data-a="geri">Geri yükle</button><button class="btn sm b5" data-c="${esc(k)}" data-a="sil">Kalıcı sil</button></div></div>`}).join("")||"<p>Çöp kutusu boş.</p>";
  }catch(e){toast(errText(e))}}
async function copGeri(k){
  const s=await db.ref("cop/"+k).once("value");if(!s.exists())return;const c=s.val();
  if(!COP_YOL.test(c.yol||"")||!COP_ID.test(c.id||"")||c.veri==null){toast("Bu kayıt güvenlik nedeniyle geri yüklenemez.");return}
  const mv=await db.ref(c.yol+"/"+c.id).once("value");
  if(mv.exists()&&!confirm("Aynı kimlikli bir kayıt şu an mevcut. Üzerine yazılsın mı?"))return;
  const up={};up[c.yol+"/"+c.id]=c.veri;
  (Array.isArray(c.ek)?c.ek:Object.values(c.ek||{})).forEach(x=>{if(x&&COP_EK.test(x.p||"")&&x.v!=null)up[x.p]=x.v});
  up["cop/"+k]=null;
  up["denetim/"+db.ref("denetim").push().key]={tur:"geri",baslik:kisalt(c.baslik||c.id,120),yol:kisalt(c.yol,140),id:kisalt(c.id,100),kim:kisalt(ad(),100),uid:user.uid,zaman:TSV()};
  await db.ref().update(up);toast("✓ Geri yüklendi")}
$("copAc").onclick=()=>{$("dCop").showModal();copListele()};
$("copKapat").onclick=()=>$("dCop").close();
$("copList").onclick=async e=>{const b=e.target.closest("button[data-c]");if(!b||!isAdmin())return;
  try{
    if(b.dataset.a==="geri")await copGeri(b.dataset.c);
    else if(confirm("Bu kayıt çöp kutusundan da kalıcı olarak silinsin mi? Geri alınamaz.")){await db.ref("cop/"+b.dataset.c).remove();denetimYaz("kalici","Çöp kutusundan kalıcı silindi",null,"cop",b.dataset.c)}
    copListele()}catch(err){toast(errText(err))}};
$("denAc").onclick=async()=>{$("dDen").showModal();$("denList").textContent="Yükleniyor…";
  try{const s=await db.ref("denetim").orderByChild("zaman").limitToLast(100).once("value"),v=s.val()||{},ks=Object.keys(v).sort((a,b)=>(v[b].zaman||0)-(v[a].zaman||0));
    const AD={sil:"🗑️ Silindi",geri:"♻️ Geri yüklendi",kullanici:"👤 Kullanıcı",sifre:"🔑 Şifre",kalici:"❌ Kalıcı silindi",bakim:"🛠️ Bakım","tahsilat-duzenle":"✏️ Tahsilat düzeltildi","tahsilat-geri":"↩️ Tahsilat geri alındı"};
    $("denList").innerHTML=ks.map(k=>{const d=v[k];return `<div class="urow"><div><b>${esc(AD[d.tur]||d.tur)}</b> ${esc(d.baslik||"")}<br><small>${esc(d.detay||"")}${d.detay?" · ":""}${esc(d.kim||"")} · ${esc(zamanTR(d.zaman))}</small></div></div>`}).join("")||"<p>Kayıt yok.</p>"}
  catch(e){$("denList").textContent="";toast(errText(e))}};
$("denKapat").onclick=()=>$("dDen").close();

/* ---------- Şifre değiştir / yönetici şifre sıfırla ---------- */
let sfHedef=null;
function sfAc(uid,adi){sfHedef=uid?{uid:uid,adi:adi}:null;
  $("sfT").textContent=uid?"🔑 Şifre sıfırla: "+adi:"🔑 Şifremi değiştir";$("sfEskiW").classList.toggle("hide",!!uid);
  ["sfEski","sfYeni","sfYeni2"].forEach(i=>$(i).value="");$("sfE").textContent="";$("dSf").showModal()}
function sfHata(er){const m=(er&&er.message)||"",c=(er&&er.code)||"";
  if(/wrong-password|invalid-credential|INVALID_LOGIN|INVALID_PASSWORD/i.test(c+m))return"Mevcut şifre hatalı.";
  if(/functions\/(not-found|internal|unavailable)/.test(c))return"Şifre sıfırlama fonksiyonu kurulu değil (bkz. functions/README.md).";
  if(/permission-denied/.test(c))return"Bu işlem için yönetici olmalısınız.";
  if(/requires-recent-login/.test(c))return"Güvenlik için çıkış yapıp yeniden giriş yapın, sonra tekrar deneyin.";
  return errText(er)}
$("bSf").onclick=()=>sfAc(null,"");
$("sfIptal").onclick=()=>$("dSf").close();
$("sfOk").onclick=async()=>{
  const y=$("sfYeni").value,y2=$("sfYeni2").value,e=$("sfE");e.textContent="";
  if(!y){e.textContent="Yeni şifre yazın.";return}
  if(y!==y2){e.textContent="Yeni şifreler aynı değil.";return}
  $("sfOk").disabled=true;
  try{
    if(sfHedef){
      if(!isAdmin())throw new Error("Bu işlem için yönetici olmalısınız.");
      const fx=await fnYukle();
      await fx.httpsCallable("sifreSifirla")({uid:sfHedef.uid,sifre:sifreHz(y)});
      denetimYaz("sifre",sfHedef.adi,"Yönetici şifreyi sıfırladı","kullanicilar",sfHedef.uid);toast("✓ Şifre sıfırlandı. Kullanıcıya yeni şifreyi iletin.");
    }else{
      const eski=$("sfEski").value;if(!eski){e.textContent="Mevcut şifrenizi yazın.";$("sfOk").disabled=false;return}
      const cu=auth.currentUser;
      await cu.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(cu.email,sifreHz(eski)));
      await cu.updatePassword(sifreHz(y));
      denetimYaz("sifre",(rec&&rec.ad)||"","Kullanıcı şifresini değiştirdi","kullanicilar",user.uid);toast("✓ Şifreniz değiştirildi");
    }
    $("dSf").close();
  }catch(er){e.textContent=sfHata(er)}
  $("sfOk").disabled=false};

/* ---------- Eski (büyük) fotoğrafları hafiflet: önizleme kayıtta kalır, tam boyut fotoTam'a taşınır ---------- */
async function kayitHafiflet(n,id,r){
  const up={};let c=0;
  const dene=async(yol,v)=>{if(!safeImg(v)||FRAG.test(v)||v.length<20000)return;
    const th=await kucult(v,320);if(!th||th.length>=v.length)return;
    const key=db.ref("fotoTam").push().key;up["fotoTam/"+key]=v;up[n+"/"+id+"/"+yol]=th+"#"+key;c++};
  await dene("foto",r.foto);
  if(r.fotolar)for(const [k,v] of Object.entries(r.fotolar))await dene("fotolar/"+k,v);
  await dene("irsaliye",r.irsaliye);
  if(r.irsEkler)for(const [k,x] of Object.entries(r.irsEkler))if(x)await dene("irsEkler/"+k+"/f",x.f);
  if(c)await db.ref().update(up);
  return c}
$("fgBtn").onclick=async()=>{
  if(!isAdmin())return;
  if(!confirm("Eski büyük fotoğraflar küçük önizlemeye çevrilecek, tam boyutları ayrı bölüme taşınacak (hiçbir fotoğraf silinmez). İşlem birkaç dakika sürebilir ve ekranı kapatmamalısınız.\n\nÖnce JSON yedek aldınız mı? Devam edilsin mi?"))return;
  const d=$("bakimDurum");let kayit=0,foto=0,hata=0;$("fgBtn").disabled=true;
  try{
    for(const n of ["urunler","stokKalem","tahsilatlar","sevkTalimat"]){let son="";
      for(;;){
        let q=db.ref(n).orderByKey();q=son?q.startAt(son).limitToFirst(9):q.limitToFirst(8);
        const s=await q.once("value"),v=s.val()||{},ks=Object.keys(v).filter(k=>k!==son).sort();
        if(!ks.length)break;
        for(const k of ks){son=k;d.textContent=n+": "+kayit+" kayıt tarandı, "+foto+" fotoğraf hafifletildi…";
          try{foto+=await kayitHafiflet(n,k,v[k]||{})}catch(e){hata++}kayit++}
      }}
    d.innerHTML='✓ Bitti: '+kayit+' kayıt tarandı, '+foto+' fotoğraf hafifletildi'+(hata?' <b style="color:#e71d36">('+hata+' kayıt atlandı, tekrar çalıştırabilirsiniz)</b>':'')+'.';
    denetimYaz("bakim","Fotoğraf hafifletme",foto+" fotoğraf, "+kayit+" kayıt")
  }catch(e){d.innerHTML='<b style="color:#e71d36">Durdu: '+esc(errText(e))+'</b> Tekrar çalıştırabilirsiniz; tamamlananlar korunur.'}
  $("fgBtn").disabled=false};

/* ---------- Yedekleme: tüm veriyi JSON / Excel olarak indir (sadece yönetici) ---------- */
const BK_DUGUM=[["kullanicilar",1],["urunler",1],["dosyalar",1],["dosyaFoto",1],["stokKalem",1],["stokHareket",1],["tedarikciler",1],["siparisler",1],["sevkAdresleri",1],["sevkTalimat",1],["tahsilatlar",1],["fiyatlar",2],["isEmirleri",1],["isHareket",2],["etiketGecmis",2],["etiketSablon",2],["ayarlar",1],["cop",1],["denetim",1],["fotoTam",1]];
const bkFotoMu=v=>typeof v==="string"&&(v.slice(0,5)==="data:"||v.length>5000);
function bkTemizle(v,yerine){ // fotoğraf (base64) alanlarını çıkar/yer tutucu koy
  if(bkFotoMu(v))return yerine;
  if(Array.isArray(v))return v.map(x=>bkTemizle(x,yerine));
  if(v&&typeof v==="object"){const o={};Object.keys(v).forEach(k=>{const t=bkTemizle(v[k],yerine);if(t!==undefined)o[k]=t});return o}
  return v}
function bkIndir(blob,ad){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=ad;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),20000)}
function bkTarih(){const d=new Date(),z=n=>String(n).padStart(2,"0");return d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate())+"_"+z(d.getHours())+z(d.getMinutes())}
function bkSonGoster(){let t=0;try{t=+localStorage.getItem("sonYedek")||0}catch(e){}
  const el=$("bkSon");if(!t){el.innerHTML='<b style="color:#e71d36">⚠️ Bu cihazdan henüz yedek alınmadı.</b>';return}
  const g=Math.floor((Date.now()-t)/864e5),tx=new Date(t).toLocaleString("tr-TR",{timeZone:TRZ});
  el.innerHTML=g>=7?'<b style="color:#e71d36">⚠️ Son yedek '+g+' gün önce ('+esc(tx)+'). Yeni yedek alın.</b>':'Son yedek: '+esc(tx)+(g?" ("+g+" gün önce)":" (bugün)")}
async function bkOku(excel){ // her düğümü ayrı okur; okunamayanları bildirir
  const veri={},hata=[];
  for(let i=0;i<BK_DUGUM.length;i++){const ad=BK_DUGUM[i][0];if(excel&&ad==="fotoTam")continue;$("bkDurum").textContent="Okunuyor ("+(i+1)+"/"+BK_DUGUM.length+"): "+ad+"…";
    try{const s=await db.ref(ad).once("value");if(s.exists())veri[ad]=s.val()}catch(e){hata.push(ad+" ("+errText(e)+")")}}
  return{veri,hata}}
function bkBitir(hata,ek){try{localStorage.setItem("sonYedek",String(Date.now()))}catch(e){}
  $("bkDurum").innerHTML=hata.length?'<b style="color:#e71d36">⚠️ Şu bölümler okunamadı, yedek eksik: '+esc(hata.join("; "))+'</b>':'✓ Yedek indirildi'+(ek?" · "+esc(ek):"");
  bkSonGoster()}
async function bkCalistir(btn,fn){
  if(!isAdmin()){toast("Bu işlem için yönetici olmalısınız.");return}
  const bt=[$("bkJson"),$("bkXlsx")];bt.forEach(b=>b.disabled=true);
  try{await fn()}catch(e){$("bkDurum").innerHTML='<b style="color:#e71d36">Yedek alınamadı: '+esc(errText(e))+'</b>'}
  bt.forEach(b=>b.disabled=false)}
$("bkJson").onclick=()=>bkCalistir(null,async()=>{
  const r=await bkOku();let v=r.veri;if(!$("bkFoto").checked)v=bkTemizle(v,undefined);
  $("bkDurum").textContent="Dosya hazırlanıyor…";
  const metin=JSON.stringify(v);
  bkIndir(new Blob([metin],{type:"application/json"}),"fabrika-yedek_"+bkTarih()+".json");
  bkBitir(r.hata,(metin.length/1048576).toFixed(1)+" MB")});
let xlsxYuk=null;
function xlsxHazir(){if(window.XLSX)return Promise.resolve();
  if(!xlsxYuk)xlsxYuk=new Promise((ok,no)=>{const sc=document.createElement("script");sc.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";sc.onload=ok;sc.onerror=()=>{xlsxYuk=null;no(new Error("Excel bileşeni yüklenemedi. İnternet bağlantısını kontrol edin."))};document.head.appendChild(sc)});
  return xlsxYuk}
function bkHucre(k,v){
  if(v==null)return"";
  if(typeof v==="number"&&v>1e11&&/(tarih|zaman)/i.test(k))return new Date(v).toLocaleString("tr-TR",{timeZone:TRZ});
  if(typeof v==="object")v=JSON.stringify(v);
  if(typeof v==="string"&&v.length>32000)v=v.slice(0,32000)+"…";
  return v}
function bkSatirlar(veri,derin){ // düğümü satırlara çevir: [{grup?, id, alanlar…}]
  const sat=[];
  const ekle=(grup,id,kayit)=>{const o={};if(derin===2)o.grup=grup;o.id=id;
    if(kayit&&typeof kayit==="object"&&!Array.isArray(kayit))Object.keys(kayit).forEach(k=>o[k]=bkHucre(k,bkTemizle(kayit[k],"[foto]")));
    else o.deger=bkHucre("deger",bkTemizle(kayit,"[foto]"));sat.push(o)};
  Object.keys(veri||{}).forEach(k1=>{const a=veri[k1];
    if(derin===2&&a&&typeof a==="object")Object.keys(a).forEach(k2=>ekle(k1,k2,a[k2]));else ekle("",k1,a)});
  return sat}
$("bkXlsx").onclick=()=>bkCalistir(null,async()=>{
  $("bkDurum").textContent="Excel bileşeni yükleniyor…";await xlsxHazir();
  const r=await bkOku(true);$("bkDurum").textContent="Excel hazırlanıyor…";
  const wb=XLSX.utils.book_new();let toplam=0;
  BK_DUGUM.forEach(([ad,derin])=>{if(ad==="fotoTam")return;const sat=bkSatirlar(r.veri[ad],derin);if(!sat.length)return;toplam+=sat.length;
    const baslik=[];sat.forEach(o=>Object.keys(o).forEach(k=>{if(!baslik.includes(k))baslik.push(k)}));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(sat,{header:baslik}),ad.slice(0,31))});
  if(!wb.SheetNames.length)throw new Error("İndirilecek veri bulunamadı.");
  XLSX.writeFile(wb,"fabrika-yedek_"+bkTarih()+".xlsx");
  bkBitir(r.hata,toplam+" satır")});


function modUyg(){
  const m=M();
  document.querySelectorAll("#tabs button").forEach((b,i)=>b.textContent=m.tab[i]);
  document.querySelectorAll("#mods button").forEach(b=>b.classList.toggle("on",b.dataset.m===mod));
  $("mt").textContent=m.baslik;$("lMu").textContent=m.mu;
  const o=$("du").options;o[0].text=m.sec[0];o[1].text=m.sec[1];
  document.querySelectorAll(".sevkonly").forEach(e=>e.classList.toggle("hide",mod!=="sevk"));
  $("bSave").textContent=editId?"💾 Değişiklikleri Kaydet":m.kayit;
}


/* ================= STOK (satın alınan malzemeler) ================= */
var fRef=null,fyErr=0,fyat={sevk:{},stok:{},siparis:{}},kFB="";
var panel="sevk",sRef=null,sKalem=[],kEdit=null,kFotos=[],hs=null,kSel=new Set(),kVals={};
const UN=[["adet","Adet"],["koli","Koli"],["paket","Paket"],["rulo","Rulo"],["masura","Masura"],["kg","Kg"],["metre","Metre"]],UL=Object.fromEntries(UN);
const norm=k=>{
  if(k.mik&&typeof k.mik==="object")return{mik:k.mik,min:(k.min&&typeof k.min==="object")?k.min:{}};
  const u=(UN.find(x=>x[1]===k.birim)||UN[0])[0];
  return{mik:{[u]:+k.miktar||0},min:{[u]:+k.min||0}};
};
const para=n=>fmt(n)+" ₺";
var kdvAyar={};
const KD={sevk:["skc","skw","skr","skm","skg"],sip:["okc","okw","okr","okm","okg"]};
const kdvHesap=(f,q)=>{const r=+f.kdv||0,h=(f.kdvDahil&&r?f.tutar/(1+r/100):f.tutar)*q,k=h*r/100;return{h,k,t:h+k,r}};
/* Fiyat geçmişi: artık sadece siparişlerdeki birim fiyatlardan gelir */
function fyGecmis(kid,birim,haric){const R=[];
  sSip.forEach(o=>{if(haric&&o.id===haric)return;const pf=(fyat.siparis||{})[o.id];if(!pf||!pf.f)return;
    satirlar(o).forEach((x,i)=>{if(x.kalemId!==kid||x.birim!==birim)return;const p=pf.f[i];if(p==null)return;
      R.push({t:o.eklenmeTarihi||0,q:+x.miktar||0,p:+p,kdv:pf.kdv,dahil:!!pf.kdvDahil,firma:o.firma||"",oid:o.id})})});
  return R.sort((a,b)=>b.t-a.t)}
const sonFy=(kid,u)=>fyGecmis(kid,u)[0]||null;
const stokVal=k=>{const n=norm(k).mik;let a={h:0,k:0,t:0},c=0;
  for(const u in n){const q=+n[u]||0;if(!(q>0))continue;const g=sonFy(k.id,u);if(!g)continue;
    const v=kdvHesap({tutar:g.p,kdv:g.kdv,kdvDahil:g.dahil},q);a.h+=v.h;a.k+=v.k;a.t+=v.t;c++}
  return c?Object.assign(a,{r:a.k>0?1:0}):null};
const sevkTop=u=>{const f=(fyat.sevk||{})[u.id];if(!f)return null;return kdvHesap(f,f.esas==="kg"?(+u.kg||0):f.esas==="adet"?(+u.paket||0):1)};
const kdvTxt=f=>f.kdv!=null?" · KDV %"+esc(fmt(f.kdv))+(f.kdvDahil?" dahil":" hariç"):"";
const topTxt=v=>v.r?`${esc(para(v.h))} + KDV ${esc(para(v.k))} = <b>${esc(para(v.t))}</b>`:`<b>${esc(para(v.t))}</b>`;
const csvN=v=>'"'+String(+v||0).replace(".",",")+'"';
function sumV(list,fn){return list.reduce((a,x)=>{const v=fn(x);return v?{h:a.h+v.h,k:a.k+v.k,t:a.t+v.t}:a},{h:0,k:0,t:0})}
const sumTxt=t=>t.k>0?`${para(t.h)} + KDV ${para(t.k)} = ${para(t.t)}`:para(t.t);
function sFyHtml(u){const f=(fyat.sevk||{})[u.id];if(!f)return"";
  return `<div class="addr" style="background:#fefce8;border-color:#fde68a;color:#854d0e">💰 <b>${esc(para(f.tutar))}${({kg:" / kg",adet:" / adet",toplam:" (toplam)"})[f.esas]||""}</b>${kdvTxt(f)}<br>Toplam: ${topTxt(sevkTop(u))}</div>`}
function kFyHtml(k){const n=norm(k).mik,R=UN.filter(([u])=>u in n).map(([u,l])=>{const g=sonFy(k.id,u);
    return g?`${esc(para(g.p))} / ${esc(l.toLowerCase())} <span class="mut">(${esc(tarih(g.t))}${g.firma?" · "+esc(g.firma):""})</span>${g.kdv!=null?" · KDV %"+esc(fmt(g.kdv))+(g.dahil?" dahil":" hariç"):""}`:""}).filter(Boolean);
  if(!R.length)return"";const v=stokVal(k);
  return `<div class="addr" style="background:#fefce8;border-color:#fde68a;color:#854d0e">💰 Son alış fiyatı:<br>${R.join("<br>")}${v?`<br>Stok değeri: ${topTxt(v)}`:""}</div>`}
const sFyCsv=u=>{const f=(fyat.sevk||{})[u.id];if(!f)return Array(6).fill('""');const v=sevkTop(u);return[csvN(f.tutar),'"'+f.esas+'"',csvN(v.r),csvN(v.h),csvN(v.k),csvN(v.t)]};
const kFyCsv=k=>{const n=norm(k).mik,P=UN.filter(([u])=>u in n).map(([u,l])=>[l,sonFy(k.id,u)]).filter(x=>x[1]);if(!P.length)return Array(6).fill('""');
  const v=stokVal(k)||{h:0,k:0,t:0},q=x=>'"'+x+'"';
  return[q(P.map(x=>String(x[1].p).replace(".",",")).join(" | ")),q(P.map(x=>x[0]).join(" | ")),csvN(P[0][1].kdv||0),csvN(v.h),csvN(v.k),csvN(v.t)]};
/* KDV formu */
function kdvUI(m){const [c,w,r,mo,g]=KD[m].map($);w.classList.toggle("hide",!c.checked);
  g.innerHTML=(Array.isArray(kdvAyar.gecmis)?kdvAyar.gecmis:Object.values(kdvAyar.gecmis||{})).map(x=>`<button type="button" class="btn sm b6" style="margin:0" data-r="${esc(x)}">%${esc(fmt(x))}</button>`).join("")}
function kdvSet(m,f){const [c,w,r,mo]=KD[m].map($),on=!!(f&&f.kdv!=null);c.checked=on;r.value=on?f.kdv:(kdvAyar.son!=null?kdvAyar.son:"");mo.value=f&&f.kdvDahil?"dahil":"haric";kdvUI(m)}
function kdvGet(m){const [c,w,r,mo]=KD[m].map($);if(!c.checked)return{};const v=parseFloat(r.value);if(!(v>=0&&v<=100))return null;return{kdv:v,kdvDahil:mo.value==="dahil"}}
async function kdvKaydet(v){const old=Array.isArray(kdvAyar.gecmis)?kdvAyar.gecmis:Object.values(kdvAyar.gecmis||{});
  await db.ref("fiyatlar/ayar/kdv").set({son:v,gecmis:[v].concat(old.filter(x=>x!==v)).slice(0,6)})}
["sevk","sip"].forEach(m=>{const [c,w,r,mo,g]=KD[m];$(c).onchange=()=>kdvUI(m);$(g).onclick=e=>{const x=e.target.dataset.r;if(x!=null)$(r).value=x}});
function fiyatBaglan(){
  if(isAdmin()){if(!fRef){fRef=db.ref("fiyatlar");fRef.on("value",x=>{const v=x.val()||{};fyat={sevk:v.sevk||{},stok:v.stok||{},siparis:v.siparis||{}};kdvAyar=(v.ayar&&v.ayar.kdv)||{};
    if(!$("skc").checked)kdvSet("sevk",null);if(!$("okc").checked&&!$("dSip").open)kdvSet("sip",null);else kdvUI("sip");kdvUI("sevk");listele();stokListele();if(typeof dosListele==="function")dosListele()},e=>{if(fRef){fRef.off();fRef=null}if(isAdmin()&&!fyErr){fyErr=1;toast("Fiyatlar okunamadı. Veritabanı kurallarının son sürümünün yayınlandığını kontrol edin.")}})}}
  else if(fRef){fRef.off();fRef=null;fyat={sevk:{},stok:{},siparis:{}}}
}
const ust=(v,m)=>v<=0?"no":(m>0&&v<=m)?"lo":"ok";
const dur=k=>{const n=norm(k),ks=Object.keys(n.mik);if(!ks.length||ks.every(u=>!(n.mik[u]>0)))return"no";return ks.some(u=>n.min[u]>0&&n.mik[u]<=n.min[u])?"lo":"ok"};
const fmtQ=(o,z)=>UN.filter(([u])=>o&&u in o&&(z||+o[u]>0)).map(([u,l])=>fmt(o[u])+" "+l).join(", ")||"-";
/* ---- adım 3: rolün göremediği bölümleri gizle ---- */
const BOLUMLER=["sevk","stok","is","uretim","rap","tah"],ilkBolum=()=>BOLUMLER.find(modGor)||null;
function menuUygula(){
  document.querySelectorAll("[data-go]").forEach(b=>b.classList.toggle("hide",!modGor(b.dataset.go)));
  const is=isVeriGor();["mQr","bBell"].forEach(id=>{const el=$(id);if(el)el.classList.toggle("hide",!is)});
  const n=$("menuYok");if(n)n.classList.toggle("hide",!!ilkBolum());
  $("bMenu").classList.toggle("hide",!!anaBolum());
  {const f=$("sevForm");if(f)f.classList.toggle("hide",!sevForm())}
  /* "Tahsilat" menü düğmesi yalnız sevkiyat yetkisi OLMAYANLARA görünür (sevkiyatı olanlar zaten Sevkiyat içindeki sekmeden girer) */
  {const t=document.querySelector('[data-go="tah"]');if(t)t.classList.toggle("hide",!(modGor("tah")&&!modGor("sevk")))}
  {const sv=modGor("sevk"),th=tahGor();document.querySelectorAll("#vtabs button").forEach(b=>{const v=b.dataset.v;b.classList.toggle("hide",(v==="sev"||v==="adr")?!sv:!th)})}
}
function modSec(m){
  if(!modGor(m)){const f=ilkBolum();if(!f){toast("Bu bölüm için yetkiniz yok.");menuOk=false;show("vMenu");return}m=f}
  panel=m;if(m==="tah")vTabSet("tah");
  document.querySelectorAll("#mods button").forEach(b=>b.classList.toggle("on",b.dataset.m===m));
  $("pSevk").classList.toggle("hide",m!=="sevk"&&m!=="tah");$("pStok").classList.toggle("hide",m!=="stok");$("pIs").classList.toggle("hide",m!=="is");$("pUr").classList.toggle("hide",m!=="uretim");$("pRap").classList.toggle("hide",m!=="rap");
  $("mt").textContent=m==="sevk"?"SEVKİYAT":m==="tah"?"TAHSİLAT":m==="is"?"İŞ EMİRLERİ":m==="uretim"?"ÜRETİM":m==="rap"?"RAPORLAR":"STOK";if(m==="rap"&&window.rapAc)window.rapAc();
  if(m==="stok")stokYukle();else stokKapat();if(m==="is"||m==="uretim"){isYukle();if(m==="is")isMTSet("list");else if(!isAdmin()&&yRol()){const o=yRol().asama.find(k=>URA.includes(k));if(o)uTab=o}}else isKapat();$("iAdd").classList.toggle("hide",!canIsAc())}
$("mods").onclick=e=>{const m=e.target.dataset.m;if(!m||m===panel)return;modSec(m)};
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{menuOk=true;modSec(b.dataset.go);show("vApp");window.scrollTo(0,0)});
$("bMenu").onclick=()=>{menuOk=false;show("vMenu");window.scrollTo(0,0)};
function stokKapat(){if(sRef){sRef.off();sRef=null}if(tRef){tRef.off();tRef=null}if(oRef){oRef.off();oRef=null}}
function stokYukle(){stokKapat();sRef=db.ref("stokKalem");
  sRef.on("value",x=>{const v=x.val()||{};sKalem=Object.keys(v).map(k=>Object.assign({id:k},v[k]));stokListele()},e=>toast("Stok okunamadı: "+errText(e)));
  tRef=db.ref("tedarikciler");
  tRef.on("value",x=>{const v=x.val()||{};sTed=Object.keys(v).map(k=>Object.assign({id:k},v[k]));stokListele()},e=>toast("Tedarikçiler okunamadı: "+errText(e)+" (Firebase kurallarını güncellediniz mi?)"));
  oRef=db.ref("siparisler").orderByChild("eklenmeTarihi").limitToLast(300);
  oRef.on("value",x=>{const v=x.val()||{};sSip=Object.keys(v).map(k=>Object.assign({id:k},v[k]));stokListele()},e=>toast("Siparişler okunamadı: "+errText(e)+" (Firebase kurallarını güncellediniz mi?)"))}
fbKur("sq",{sel:["sc","sd"],fn:()=>stokListele(),etiket:"eklenme tarihi"});
document.querySelectorAll("#pStok .hl.fl").forEach(b=>b.onclick=()=>{
  const v=b.dataset.f;$("sd").value=($("sd").value===v)?"":v;$("sq").value="";$("sc").value="";$("sqD1").value="";$("sqD2").value="";stokListele();
  $("sList").scrollIntoView({behavior:"smooth",block:"start"})});
function stokListele(){
  if(panel!=="stok")return;
  const cats=[...new Set(sKalem.map(k=>k.kategori).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"tr")),cur=$("sc").value;
  $("sc").innerHTML='<option value="">Tüm kategoriler</option>'+cats.map(c=>`<option${c===cur?" selected":""}>${esc(c)}</option>`).join("");
  $("dl").innerHTML=cats.map(c=>`<option value="${esc(c)}">`).join("");
  const uniq=f=>[...new Set(sKalem.map(k=>(k[f]||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"tr"));
  $("dlt").innerHTML=[...new Set(uniq("tedarikci").concat(sTed.map(t=>(t.firma||"").trim()).filter(Boolean)))].sort((a,b)=>a.localeCompare(b,"tr")).map(c=>`<option value="${esc(c)}">`).join("");
  $("dle").innerHTML=uniq("ebat").map(c=>`<option value="${esc(c)}">`).join("");
  {const f=$("sd").value;document.querySelectorAll("#pStok .hl.fl").forEach(b=>b.classList.toggle("act",b.dataset.f===f))}
  {const t=isAdmin()?sumV(sKalem,stokVal):{h:0,k:0,t:0};$("sVal").classList.toggle("hide",!isAdmin());$("sVn").textContent=sumTxt(t)}
  $("sK").textContent=sKalem.length;$("sA").textContent=sKalem.filter(k=>dur(k)==="lo").length;$("sT").textContent=sKalem.filter(k=>dur(k)==="no").length;
  {const nl=sKalem.filter(k=>dur(k)!=="ok").length;$("sTas").classList.toggle("hide",!nl);$("sTas").textContent=`🧾 Azalanlardan sipariş oluştur (${nl})`}
  const st=fbDurum("sq"),fc=$("sc").value,fd=$("sd").value;
  const L=sKalem.filter(k=>fbEsles(st,[k.ad,k.kategori,k.ebat,k.tedarikci,k.not,k.ekleyen],k.eklenmeTarihi)&&(!fc||k.kategori===fc)&&(!fd||dur(k)===fd)).sort((a,b)=>(a.ad||"").localeCompare(b.ad||"","tr"));
  fbSay("sq",L.length,sKalem.length,"kalem");
  $("sList").innerHTML=L.length?L.map(kkart).join(""):'<div class="empty">Kalem bulunamadı. "Yeni kalem ekle" ile başlayın.</div>';
  tedListele();sipListele();
}
function kkart(k){
  const d=dur(k),id=esc(k.id),n=norm(k),c={ok:["hazir-border","badge-hazir","YETERLİ"],lo:["sevk-border","badge-sevk","AZALIYOR"],no:["tamam-border","badge-no","TÜKENDİ"]}[d];
  const canDel=isAdmin()||(k.ekleyenUid&&k.ekleyenUid===user.uid),open=kAcik.has(k.id),ph=safeImg(k.foto);
  const bek=sSip.filter(o=>o.durum==="bekliyor").flatMap(o=>satirlar(o).filter(x=>x.kalemId===k.id&&kalanQ(x)>0).map(x=>fmt(kalanQ(x))+" "+(UL[x.birim]||x.birim)+" ("+(o.firma||"")+")"));
  const chips=UN.filter(([u])=>u in n.mik).map(([u,l])=>{const v=+n.mik[u]||0,m=+n.min[u]||0,col={ok:"#0c4a6e",lo:"#b45309",no:"#b91c1c"}[ust(v,m)];return `<span style="color:${col};font-weight:800">${esc(fmt(v))} ${l}</span>`}).join(" · ");
  const kr=UN.filter(([u])=>u in n.mik&&+n.min[u]>0).map(([u,l])=>fmt(n.min[u])+" "+l).join(", ");
  const meta=[k.kategori,k.ebat?"📐 "+k.ebat:"",k.tedarikci].filter(Boolean).map(esc).join(" · ");
  return `<div class="item c ${c[0]}">
  <div class="kh" data-id="${id}" style="display:flex;gap:8px;align-items:center;cursor:pointer">
    ${ph?`<img class="th" loading="lazy" src="${ph}" alt="">`:""}
    <div style="flex:1;min-width:0">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><b class="nm">${esc(k.ad)}</b><span class="badge ${c[1]}">${c[2]}</span></div>
      <div class="sub" style="font-size:16px">${chips||"-"}${bek.length?' <span title="Siparişte">🧾</span>':""}</div>
      ${meta?`<div class="sub" style="font-size:13px">${meta}</div>`:""}
    </div><span class="chev">${open?"▲":"▼"}</span>
  </div>
  <div class="dt${open?"":" hide"}">
    ${(()=>{const L=fotoListe(k);return L.length===1?`<img loading="lazy" src="${L[0]}" alt="" style="max-height:140px">`:L.length?`<div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0">${L.map(x=>`<img loading="lazy" src="${x}" alt="" style="width:calc(50% - 3px);height:110px;margin:0;object-fit:cover">`).join("")}</div>`:""})()}
    ${kr?`<div class="sub">Kritik seviye: ${esc(kr)}</div>`:""}
    ${bek.length?`<div class="addr" style="background:#fff7ed;border-color:#fed7aa;color:#9a3412">🧾 Siparişte: ${esc(bek.join(" · "))}</div>`:""}
    ${isAdmin()?kFyHtml(k):""}
    ${k.not?`<div class="note">📌 ${esc(k.not)}</div>`:""}
    <div class="acts s"><button class="btn b3" data-a="in" data-id="${id}">＋ Giriş</button><button class="btn b2" data-a="out" data-id="${id}">− Çıkış</button>
    <button class="btn b6" data-a="gec" data-id="${id}">📜 Geçmiş</button><button class="btn b6" data-a="yaz" data-id="${id}">🖨️ Yazdır</button><button class="btn b6" data-a="edit" data-id="${id}">✏️ Düzenle</button>
    ${canDel?`<button class="btn b5 i" data-a="del" data-id="${id}">🗑️</button>`:""}</div>
  </div></div>`;
}
$("sList").onclick=async e=>{
  const h=e.target.closest(".kh");
  if(h&&!e.target.closest("button")){const id=h.dataset.id,dt=h.parentElement.querySelector(".dt");
    if(kAcik.has(id))kAcik.delete(id);else kAcik.add(id);
    dt.classList.toggle("hide",!kAcik.has(id));h.querySelector(".chev").textContent=kAcik.has(id)?"▲":"▼";return}
  const b=e.target.closest("button[data-a]");if(!b)return;const k=sKalem.find(x=>x.id===b.dataset.id);if(!k)return;
  const a=b.dataset.a;
  if(a==="in"||a==="out")hAc(k,a==="in"?"giris":"cikis");
  else if(a==="gec")gecAc(k);
  else if(a==="edit")kAc(k);
  else if(a==="del"&&confirm(`"${k.ad}" silinsin mi? (Geçmiş hareket kayıtları saklanır)`)){try{await silCop("stokKalem",k.id,k.ad,isAdmin()?["fiyatlar/stok/"+k.id]:[]);toast("Silindi (Çöp kutusuna alındı)")}catch(err){toast(errText(err))}}
};
/* kalem ekle / düzenle */
function kRead(){document.querySelectorAll("#kur input").forEach(i=>{(kVals[i.dataset.u]=kVals[i.dataset.u]||{})[i.dataset.f]=i.value})}
function kDraw(){
  const old=kEdit?norm(kEdit):{mik:{},min:{}};
  $("ub").innerHTML=UN.map(([u,l])=>`<label class="chip"><input type="checkbox" data-c="${u}"${kSel.has(u)?" checked":""}>${l}</label>`).join("");
  $("kur").innerHTML=UN.filter(([u])=>kSel.has(u)).map(([u,l])=>{const v=kVals[u]||{};
    const m=(kEdit&&u in old.mik)?`<span class="mut">mevcut: ${esc(fmt(old.mik[u]))}</span>`:`<input data-u="${u}" data-f="mik" type="number" inputmode="decimal" min="0" step="any" placeholder="Mevcut" value="${esc(v.mik??"")}">`;
    return `<div class="urow2"><b>${l}</b>${m}<input data-u="${u}" data-f="min" type="number" inputmode="decimal" min="0" step="any" placeholder="Kritik" value="${esc(v.min??"")}"></div>`}).join("")||'<p class="mut">En az bir birim seçin.</p>';
}
$("ub").onchange=e=>{const u=e.target.dataset.c;if(!u)return;kRead();if(e.target.checked)kSel.add(u);else kSel.delete(u);kDraw()};
function kAc(k){
  kEdit=k||null;kFotos=k?fotoListe(k).slice(0,FMAX):[];kVals={};$("kT").textContent=k?"Kalemi düzenle":"Yeni kalem";$("kE").textContent="";
  $("sad").value=k?k.ad:"";$("skat").value=k?k.kategori||"":"";$("seb").value=k?k.ebat||"":"";$("ste").value=k?k.tedarikci||"":"";$("sno").value=k?k.not||"":"";
  if(k){const n=norm(k);kSel=new Set(Object.keys(n.mik).filter(u=>UL[u]));kSel.forEach(u=>{if(+n.min[u]>0)kVals[u]={min:n.min[u]}})}else kSel=new Set(["adet"]);
  kDraw();
  kFotoCiz();
  $("dKalem").showModal();
}
$("sAdd").onclick=()=>kAc(null);
$("kNo").onclick=()=>$("dKalem").close();
function kFotoCiz(){
  $("kGrid").innerHTML=kFotos.map((x,i)=>`<div class="fth"><img src="${x}" alt="Foto ${i+1}" data-z="${i}"><button type="button" class="fx" data-x="${i}" aria-label="Kaldır">✖</button></div>`).join("");
  $("kSay").textContent=kFotos.length?kFotos.length+"/"+FMAX+" fotoğraf":"";
}
$("kGrid").onclick=e=>{const x=e.target.closest("[data-x]");if(x){kFotos.splice(+x.dataset.x,1);kFotoCiz();return}
  const z=e.target.closest("[data-z]");if(z&&window.fvAc)window.fvAc(kFotos[+z.dataset.z])};
function kFotoEkle(files){[...files].forEach(f=>{
  if(kFotos.length>=FMAX){toast("En fazla "+FMAX+" fotoğraf eklenebilir.");return}
  const r=new FileReader();r.onload=()=>sikistir(r.result,d=>{if(kFotos.length>=FMAX)return;kFotos.push(d);kFotoCiz()},500);r.readAsDataURL(f)})}
$("kGalB").onclick=()=>$("kGal").click();$("kCamB").onclick=()=>$("kCam").click();
$("kGal").onchange=e=>{kFotoEkle(e.target.files);e.target.value=""};
$("kCam").onchange=e=>{kFotoEkle(e.target.files);e.target.value=""};
$("kOk").onclick=async()=>{
  kRead();const nm=$("sad").value.trim(),err=m=>{$("kE").textContent=m};
  if(!nm)return err("Kalem adı gerekli.");
  if(!kSel.size)return err("En az bir birim seçin.");
  const old=kEdit?norm(kEdit).mik:{},mik={},min={};
  for(const u of kSel){const v=kVals[u]||{},a=parseFloat(v.mik),b=parseFloat(v.min);
    if(a<0||b<0)return err("Miktarlar 0 veya daha büyük olmalı.");
    if(!(u in old))mik[u]=a>0?a:0;
    if(b>0)min[u]=b}
  const ebN=$("seb").value.trim().toLowerCase();
  if(!kEdit&&sKalem.some(x=>(x.ad||"").toLowerCase()===nm.toLowerCase()&&(x.ebat||"").trim().toLowerCase()===ebN)&&!confirm("Bu isim ve ebatta bir kalem zaten var. Yine de eklensin mi?"))return;
  const lost=Object.keys(old).filter(u=>!kSel.has(u)&&old[u]>0);
  if(lost.length&&!confirm("Kaldırdığınız birimlerin miktarı silinecek ("+fmtQ(Object.fromEntries(lost.map(u=>[u,old[u]])))+"). Devam edilsin mi?"))return;
  const TS=firebase.database.ServerValue.TIMESTAMP,extra={kategori:$("skat").value.trim(),ebat:$("seb").value.trim(),tedarikci:$("ste").value.trim(),not:$("sno").value.trim()};
  $("kOk").disabled=true;let newId="";
  try{
    if(kEdit){
      const up=Object.assign({ad:nm,duzenleyen:ad(),min:Object.keys(min).length?min:null},extra);
      {const fl=await fotoHazirla(kFotos);up.foto=fl[0]||null;up.fotolar=fl.length>1?fl.slice(1):null}
      if(!kEdit.mik){Object.keys(old).forEach(u=>{if(kSel.has(u))up["mik/"+u]=old[u]});up.miktar=null;up.birim=null}
      else Object.keys(old).forEach(u=>{if(!kSel.has(u))up["mik/"+u]=null});
      Object.keys(mik).forEach(u=>{up["mik/"+u]=mik[u]});
      await db.ref("stokKalem/"+kEdit.id).update(up);
    }else{
      const d=Object.assign({ad:nm,mik,ekleyen:ad(),ekleyenUid:user.uid,eklenmeTarihi:TS},extra);
      if(Object.keys(min).length)d.min=min;if(kFotos.length){const fl=await fotoHazirla(kFotos);d.foto=fl[0];if(fl.length>1)d.fotolar=fl.slice(1)}
      const r=db.ref("stokKalem").push();newId=r.key;await r.set(d);
      const pos=Object.fromEntries(Object.entries(mik).filter(([,v])=>v>0));
      if(Object.keys(pos).length)await db.ref("stokHareket").push().set({kalemId:r.key,ad:nm,tip:"giris",mik:pos,kalan:mik,not:"İlk kayıt",kullanici:ad(),uid:user.uid,zaman:TS});
    }
    $("dKalem").close();toast("Kaydedildi");
  }catch(e){err(errText(e))}
  $("kOk").disabled=false;
};
/* giriş / çıkış */
function hAc(k,tip){hs={id:k.id,tip};const n=norm(k);
  $("hT").textContent=`${k.ad}: stok ${tip==="giris"?"girişi":"çıkışı"}`;
  $("hRows").innerHTML=UN.filter(([u])=>u in n.mik).map(([u,l])=>`<div class="urow2" style="grid-template-columns:64px 1fr"><b>${l}</b><input data-u="${u}" type="number" inputmode="decimal" min="0" step="any" placeholder="mevcut ${esc(fmt(n.mik[u]))}"></div>`).join("");
  $("hn").value="";$("hE").textContent="";$("dHar").showModal();const f=$("hRows").querySelector("input");if(f)f.focus()}
$("hNo").onclick=()=>$("dHar").close();
$("hOk").onclick=async()=>{
  const n={};document.querySelectorAll("#hRows input").forEach(i=>{const v=parseFloat(i.value);if(v>0)n[i.dataset.u]=v});
  if(!Object.keys(n).length){$("hE").textContent="En az bir birime miktar yazın.";return}
  const id=hs.id,tip=hs.tip,k=sKalem.find(x=>x.id===id);if(!k)return;const base=norm(k).mik;$("hOk").disabled=true;
  try{
    const r=await db.ref("stokKalem/"+id+"/mik").transaction(cur=>{const y=Object.assign({},cur||base);
      for(const u in n){const t=(+y[u]||0)+(tip==="giris"?n[u]:-n[u]);if(t<0)return;y[u]=Math.round(t*1000)/1000}return y});
    if(!r.committed)$("hE").textContent="Stokta bu kadar yok.";
    else{await db.ref("stokHareket").push().set({kalemId:id,ad:k.ad||"",tip,mik:n,kalan:r.snapshot.val(),not:$("hn").value.trim(),kullanici:ad(),uid:user.uid,zaman:firebase.database.ServerValue.TIMESTAMP});
      $("dHar").close();toast("Stok güncellendi");
      if(tip!=="giris"){const k2=Object.assign({},k,{mik:r.snapshot.val()});if(!(k.min&&typeof k.min==="object"))k2.min=norm(k).min;
        const d0=dur(k),d1=dur(k2);if(d1!=="ok"&&d1!==d0)waOner(d1==="no"?"⚠️ Stok tükendi":"⚠️ Stok azaldı",stokWa([k2]))}}
  }catch(e){$("hE").textContent=errText(e)}
  $("hOk").disabled=false;
};
/* geçmiş */
$("gNo").onclick=()=>$("dGec").close();
async function gecAc(k){
  $("gT").textContent=k.ad+" — hareketler";$("gL").textContent="Yükleniyor...";$("dGec").showModal();
  try{
    const x=await db.ref("stokHareket").orderByChild("kalemId").equalTo(k.id).limitToLast(40).once("value"),v=x.val()||{};
    const L=Object.values(v).sort((a,b)=>b.zaman-a.zaman);
    $("gL").innerHTML=L.length?L.map(h=>{const q=h.mik?fmtQ(h.mik):fmt(h.miktar)+" "+(k.birim||""),kl=(h.kalan&&typeof h.kalan==="object")?fmtQ(h.kalan,true):fmt(h.kalan);
      return `<div class="urow"><div><b style="color:${h.tip==="giris"?"#0f766e":"#c2410c"}">${h.tip==="giris"?"+":"−"} ${esc(q)}</b> <small>(kalan: ${esc(kl)})</small><br><small>${esc(new Date(h.zaman).toLocaleString("tr-TR"))} · ${esc(h.kullanici)}${h.not?" · "+esc(h.not):""}</small></div></div>`}).join(""):"<p>Henüz hareket yok.</p>";
  }catch(e){$("gL").textContent=errText(e)}
}
/* Excel */
$("sCsv").onclick=()=>{
  const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"',st={ok:"Yeterli",lo:"Azalıyor",no:"Tükendi"};
  const r=[["Kalem","Kategori","Ebat"].concat(UN.map(u=>u[1]),["Durum","Tedarikçi","Not"],isAdmin()?["Son alış fiyatı (₺)","Fiyat birimi","KDV %","Stok tutarı (₺)","KDV (₺)","Stok toplamı (₺)"]:[]).map(q).join(";")].concat(sKalem.slice().sort((a,b)=>(a.ad||"").localeCompare(b.ad||"","tr")).map(k=>{const n=norm(k).mik;
    return [q(k.ad),q(k.kategori),q(k.ebat)].concat(UN.map(([u])=>u in n?q(String(+n[u]||0).replace(".",",")):q("")),[q(st[dur(k)]),q(k.tedarikci),q(k.not)],isAdmin()?kFyCsv(k):[]).join(";")}));
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+r.join("\r\n")],{type:"text/csv;charset=utf-8"}));a.download="stok-listesi.csv";a.click();
};

/* ================= TEDARİKÇİLER & SİPARİŞLER ================= */
var kAcik=new Set(),tRef=null,oRef=null,sTed=[],sSip=[],sTab="kal",tEdit=null,oEdit=null;
const byTr=f=>(a,b)=>(a[f]||"").localeCompare(b[f]||"","tr");
const tarih=ts=>ts?new Date(ts).toLocaleDateString("tr-TR"):"";
function satirlar(o){return Array.isArray(o.satirlar)?o.satirlar.filter(Boolean):Object.values(o.satirlar||{})}
const kalanQ=x=>Math.max(0,(+x.miktar||0)-(+x.gelen||0));
const satirTxt=(x,kapali)=>{const g=+x.gelen||0,m=+x.miktar||0;return `${x.ad||""}${x.ebat?" · "+x.ebat:""}: ${fmt(m)} ${UL[x.birim]||x.birim}`+(g>0?` (gelen ${fmt(g)}${g<m?(kapali?" · eksik ":" · kalan ")+fmt(m-g):g>m?" · fazla "+fmt(g-m):""})`:"")};
function sipTop(o){const f=(fyat.siparis||{})[o.id];if(!f||!f.f)return null;const kapali=o.durum==="geldi";let a={h:0,k:0,t:0,r:+f.kdv||0},n=0;
  satirlar(o).forEach((x,i)=>{const p=f.f[i];if(p==null)return;const q=kapali&&x.gelen!=null?+x.gelen:(+x.miktar||0),v=kdvHesap({tutar:+p,kdv:f.kdv,kdvDahil:f.kdvDahil},q);a.h+=v.h;a.k+=v.k;a.t+=v.t;n++});return n?a:null}
function sTabSet(t){sTab=t;document.querySelectorAll("#stabs button").forEach(b=>b.classList.toggle("on",b.dataset.s===t));
  $("sKal").classList.toggle("hide",t!=="kal");$("sSip").classList.toggle("hide",t!=="sip");$("sTed").classList.toggle("hide",t!=="ted")}
$("stabs").onclick=e=>{const b=e.target.closest("button");if(b&&b.dataset.s)sTabSet(b.dataset.s)};

/* --- Tedarikçiler --- */
fbKur("tq",{fn:()=>tedListele(),etiket:"eklenme tarihi"});
function tedListele(){
  const st=fbDurum("tq");
  const L=sTed.filter(t=>fbEsles(st,[t.firma,t.yetkili,t.tel,t.tel2,t.mail,t.adres,t.not,t.ekleyen],t.eklenmeTarihi)).sort(byTr("firma"));
  fbSay("tq",L.length,sTed.length,"tedarikçi");
  $("tList").innerHTML=L.length?L.map(tkart).join(""):'<div class="empty">Tedarikçi bulunamadı. "Yeni tedarikçi ekle" ile başlayın.</div>';
}
function tkart(t){
  const id=esc(t.id),acik=sSip.filter(o=>o.durum==="bekliyor"&&o.tedId===t.id).length,canDel=isAdmin()||(t.ekleyenUid&&t.ekleyenUid===user.uid);
  const tels=[t.tel,t.tel2].filter(Boolean).map(x=>`<a href="tel:${esc(String(x).replace(/[^\d+]/g,""))}">📞 ${esc(x)}</a>`).join(" · ");
  return `<div class="item c hazir-border">
  <div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><b class="nm">${esc(t.firma)}</b>${acik?`<span class="badge badge-sevk">${acik} SİPARİŞTE</span>`:""}</div>
  ${t.yetkili||tels?`<div class="sub" style="font-size:16px">${t.yetkili?"👤 "+esc(t.yetkili)+" ":""}${tels}</div>`:""}
  ${t.mail?`<div class="sub"><a href="mailto:${esc(t.mail)}">✉️ ${esc(t.mail)}</a></div>`:""}
  ${t.adres?`<div class="sub">📍 ${esc(t.adres)}</div>`:""}
  ${t.not?`<div class="sub">📌 ${esc(t.not)}</div>`:""}
  <div class="acts s"><button class="btn b1" data-a="ord" data-id="${id}">🧾 Sipariş ver</button>
  <button class="btn b6 i" data-a="edit" data-id="${id}">✏️</button>${canDel?`<button class="btn b5 i" data-a="del" data-id="${id}">🗑️</button>`:""}</div></div>`;
}
$("tList").onclick=async e=>{
  const b=e.target.closest("button[data-a]");if(!b)return;const t=sTed.find(x=>x.id===b.dataset.id);if(!t)return;const a=b.dataset.a;
  if(a==="ord")oAc(null,t.id);
  else if(a==="edit")tAc(t);
  else if(a==="del"&&confirm(`"${t.firma}" silinsin mi? (Geçmiş siparişler saklanır)`)){try{await silCop("tedarikciler",t.id,t.firma);toast("Silindi (Çöp kutusuna alındı)")}catch(err){toast(errText(err))}}
};
const TF=[["tfi","firma"],["tyt","yetkili"],["ttl","tel"],["ttl2","tel2"],["tml","mail"],["tad","adres"],["tno","not"]];
function tAc(t){tEdit=t||null;$("tT").textContent=t?"Tedarikçiyi düzenle":"Yeni tedarikçi";$("tE").textContent="";
  TF.forEach(([i,f])=>$(i).value=t?t[f]||"":"");$("dTed").showModal()}
$("tAdd").onclick=()=>tAc(null);
$("tNo").onclick=()=>$("dTed").close();
$("tOk").onclick=async()=>{
  const err=m=>{$("tE").textContent=m},d={};TF.forEach(([i,f])=>d[f]=$(i).value.trim());
  if(!d.firma)return err("Firma adı gerekli.");
  if(d.mail&&!/^\S+@\S+\.\S+$/.test(d.mail))return err("E-posta adresi geçersiz görünüyor.");
  if((!tEdit||tEdit.firma.toLowerCase()!==d.firma.toLowerCase())&&sTed.some(x=>(x.firma||"").toLowerCase()===d.firma.toLowerCase())&&!confirm("Bu isimde bir tedarikçi zaten var. Yine de eklensin mi?"))return;
  $("tOk").disabled=true;
  try{
    if(tEdit)await db.ref("tedarikciler/"+tEdit.id).update(Object.assign(d,{duzenleyen:ad()}));
    else await db.ref("tedarikciler").push().set(Object.assign(d,{ekleyen:ad(),ekleyenUid:user.uid,eklenmeTarihi:firebase.database.ServerValue.TIMESTAMP}));
    $("dTed").close();toast("Kaydedildi");
  }catch(e){err(errText(e))}
  $("tOk").disabled=false;
};

/* --- Siparişler --- */
var oView="kat";
const oWords=()=>fbDurum("oq").w;
function oHay(o,x){const k=sKalem.find(z=>z.id===x.kalemId);
  return trn([x.ad,x.ebat,(k&&k.kategori)||x.kategori,UL[x.birim],o.firma,o.not,o.ekleyen,tarih(o.eklenmeTarihi),tarih(o.teslimTarihi)].join(" "))}
const oEsles=(o,x,w)=>{const h=oHay(o,x);return w.every(t=>h.includes(t))};
fbKur("oq",{fn:()=>sipListele(),etiket:"sipariş tarihi"});
$("oVt").onclick=e=>{const b=e.target.closest("button");if(b&&b.dataset.o){oView=b.dataset.o;sipListele()}};
function sipListele(){
  const st=fbDurum("oq"),w=st.w,all=sSip.filter(o=>fbEsles({w:[],a:st.a,b:st.b},[],o.eklenmeTarihi)&&(!w.length||satirlar(o).some(x=>oEsles(o,x,w)))),
        bekN=sSip.filter(o=>o.durum==="bekliyor").length;
  $("stO").textContent="🧾 SİPARİŞLER"+(bekN?" ("+bekN+")":"");fbSay("oq",all.length,sSip.length,"sipariş");
  document.querySelectorAll("#oVt button").forEach(b=>b.classList.toggle("on",b.dataset.o===oView));
  if(oView==="kat"){$("oList").innerHTML=oKatHtml(all,w);return}
  const B=all.filter(o=>o.durum==="bekliyor").sort((a,b)=>(b.eklenmeTarihi||0)-(a.eklenmeTarihi||0)),
        G0=all.filter(o=>o.durum==="geldi").sort((a,b)=>(b.teslimTarihi||b.eklenmeTarihi||0)-(a.teslimTarihi||a.eklenmeTarihi||0)),G=st.aktif?G0:G0.slice(0,20);
  $("oList").innerHTML=`<div class="shd">SİPARİŞTE BEKLEYENLER (${B.length})</div>`+(B.length?B.map(okart).join(""):`<div class="empty">${st.aktif?"Aramaya uygun bekleyen sipariş yok.":"Bekleyen sipariş yok."}</div>`)
    +(G.length?`<div class="shd" style="margin-top:14px">TESLİM ALINANLAR (${st.aktif?G.length:"son "+G.length})</div>`+G.map(okart).join(""):"");
}
/* Kategori > kalem > alış satırları (tarih, miktar, fiyat) */
function oKatHtml(all,w){
  const adm=isAdmin(),K=new Map();let n=0;
  all.forEach(o=>{const pf=adm?(fyat.siparis||{})[o.id]:null;
    satirlar(o).forEach((x,i)=>{if(w.length&&!oEsles(o,x,w))return;
      const k=sKalem.find(z=>z.id===x.kalemId),kat=((k&&k.kategori)||x.kategori||"").trim()||"Kategorisiz",ad=(k?k.ad:x.ad)||"-",eb=(k?k.ebat:x.ebat)||"",key=x.kalemId||(ad+"|"+eb);
      if(!K.has(kat))K.set(kat,new Map());const M=K.get(kat);if(!M.has(key))M.set(key,{ad,eb,R:[]});
      M.get(key).R.push({o,x,p:pf&&pf.f?pf.f[i]:null,pf});n++})});
  if(!n)return `<div class="empty">${(w.length||fbDurum("oq").aktif)?"Aramaya uygun sipariş bulunamadı.":'Henüz sipariş yok. "Yeni sipariş oluştur" ile başlayın.'}</div>`;
  const cats=[...K.keys()].sort((a,b)=>a==="Kategorisiz"?1:b==="Kategorisiz"?-1:a.localeCompare(b,"tr"));
  return cats.map(kat=>{const items=[...K.get(kat).values()].sort((a,b)=>a.ad.localeCompare(b.ad,"tr")||a.eb.localeCompare(b.eb,"tr")),cnt=items.reduce((s,it)=>s+it.R.length,0);
    return `<div class="shd" style="margin-top:12px">📁 ${esc(kat.toLocaleUpperCase("tr"))} · ${cnt} alış</div>`+items.map(it=>{
      it.R.sort((a,b)=>(b.o.eklenmeTarihi||0)-(a.o.eklenmeTarihi||0));
      const son=it.R.find(r=>r.p!=null);
      return `<div class="item c hazir-border" style="padding:8px 10px">
        <div style="display:flex;justify-content:space-between;gap:6px;align-items:center"><b class="nm">${esc(it.ad)}${it.eb?" · "+esc(it.eb):""}</b>${adm&&son?`<span class="sub" style="margin:0;font-size:13px;flex:none">Son: <b>${esc(para(son.p))}</b> / ${esc((UL[son.x.birim]||son.x.birim).toLowerCase())}</span>`:""}</div>
        ${it.R.map(oSatirHtml).join("")}</div>`}).join("")}).join("")
}
function oSatirHtml(r){
  const {o,x,p,pf}=r,ok=o.durum==="geldi",g=+x.gelen||0,m=+x.miktar||0,u=UL[x.birim]||x.birim,q=ok&&x.gelen!=null?g:m,
    qt=`${fmt(q)} ${u}`+(ok&&g!==m?` <span class="mut">(sipariş ${fmt(m)})</span>`:"")+(!ok&&g>0?` <span class="mut">(gelen ${fmt(g)})</span>`:""),
    id=esc(o.id);let fy="";
  if(p!=null){const v=kdvHesap({tutar:+p,kdv:pf.kdv,kdvDahil:pf.kdvDahil},q);
    fy=`<div class="sub" style="color:#854d0e">💰 <b>${esc(para(p))}</b> / ${esc(u.toLowerCase())}${pf.kdv!=null?" · KDV %"+esc(fmt(pf.kdv))+(pf.kdvDahil?" dahil":" hariç"):""} → ${topTxt(v)}</div>`}
  return `<div style="padding:6px 0;border-top:1px solid #f1f5f9;font-size:15px">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><span><b>${esc(tarih(o.eklenmeTarihi))}</b> · ${qt}</span><span class="badge ${ok?"badge-hazir":"badge-sevk"}" style="font-size:11px;padding:3px 6px">${ok?"STOKTA":"SİPARİŞTE"}</span></div>
    <div class="sub">🏢 ${esc(o.firma||"-")}${ok&&o.teslimTarihi?" · teslim "+esc(tarih(o.teslimTarihi)):""}${o.not?" · 📌 "+esc(o.not):""}</div>${fy}
    ${ok?"":`<div class="acts s" style="margin-top:5px"><button class="btn b3 sm" style="flex:3" data-a="in" data-id="${id}">✅ Geldi — Stokta</button><button class="btn b6 sm i" data-a="edit" data-id="${id}">✏️</button></div>`}</div>`}
function okart(o){
  const id=esc(o.id),ok=o.durum==="geldi",canDel=isAdmin()||(o.ekleyenUid&&o.ekleyenUid===user.uid),t=sTed.find(x=>x.id===o.tedId),L=satirlar(o),
        kismi=!ok&&L.some(x=>+x.gelen>0),pf=isAdmin()?(fyat.siparis||{})[o.id]:null,top=isAdmin()?sipTop(o):null;
  return `<div class="item c ${ok?"hazir-border":"sevk-border"}">
  <div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><b class="nm">${esc(o.firma||"-")}</b><span class="sub" style="margin:0;font-size:13px;flex:none">${esc(tarih(o.eklenmeTarihi))}</span><span class="badge ${ok?"badge-hazir":"badge-sevk"}">${ok?"STOKTA":kismi?"KISMİ GELDİ":"SİPARİŞTE"}</span></div>
  <div style="font-size:15px;color:#0f172a;margin-top:3px;line-height:1.45">${L.map((x,i)=>"• "+esc(satirTxt(x,ok))+(pf&&pf.f&&pf.f[i]!=null?" × "+esc(para(pf.f[i])):"")).join("<br>")}</div>
  ${top?`<div class="addr" style="background:#fefce8;border-color:#fde68a;color:#854d0e">💰 ${topTxt(top)}</div>`:""}
  ${o.not?`<div class="sub">📌 ${esc(o.not)}</div>`:""}
  ${!ok&&t&&t.tel?`<div class="sub">${t.yetkili?"👤 "+esc(t.yetkili)+" ":""}<a href="tel:${esc(String(t.tel).replace(/[^\d+]/g,""))}">📞 ${esc(t.tel)}</a></div>`:""}
  ${ok?`<div class="who" style="margin-top:2px">Stoğa eklendi: ${esc(tarih(o.teslimTarihi))} · ${esc(o.teslimAlan||"")}</div>`:""}
  <div class="acts s">
  ${ok?"":`<button class="btn b3" style="flex:3" data-a="in" data-id="${id}">✅ Geldi — Stokta</button><button class="btn b6 i" data-a="edit" data-id="${id}">✏️</button>`}
  ${canDel?`<button class="btn b5 i" data-a="del" data-id="${id}">🗑️</button>`:""}</div></div>`;
}
$("oList").onclick=async e=>{
  const b=e.target.closest("button[data-a]");if(!b)return;const o=sSip.find(x=>x.id===b.dataset.id);if(!o)return;const a=b.dataset.a;
  if(a==="in")teslimAl(o);
  else if(a==="edit")oAc(o);
  else if(a==="del"&&confirm(o.durum==="geldi"?"Bu teslim kaydı silinsin mi? (Stoktan düşmez)":"Sipariş iptal edilsin mi?")){try{await silCop("siparisler",o.id,"Sipariş: "+String(o.tedAd||o.tedarikci||o.firma||o.no||o.id),isAdmin()?["fiyatlar/siparis/"+o.id]:[]);toast("Silindi (Çöp kutusuna alındı)")}catch(err){toast(errText(err))}}
};
var tesO=null,tesKilit=false;
function teslimAl(o){
  tesO=o;const L=satirlar(o);
  $("teT").textContent=(o.firma||"Sipariş")+" — teslim al";$("teE").textContent="";$("teKapat").checked=false;
  $("teRows").innerHTML=L.map((x,i)=>{const u=esc(UL[x.birim]||x.birim);
    return `<div class="urow2" style="grid-template-columns:1fr 92px;margin-bottom:8px"><div><b style="font-size:16px">${esc(x.ad||"")}${x.ebat?" · "+esc(x.ebat):""}</b><div class="sub" style="font-size:13px">Sipariş ${esc(fmt(x.miktar))} ${u}${+x.gelen>0?" · daha önce gelen "+esc(fmt(x.gelen)):""}</div></div><div><input type="number" data-i="${i}" inputmode="decimal" min="0" step="any" value="${esc(kalanQ(x))}" style="padding:8px"><div class="sub" style="text-align:center;font-size:12px">${u} gelen</div></div></div>`}).join("");
  $("dTes").showModal()}
$("teNo").onclick=()=>$("dTes").close();
$("teOk").onclick=async()=>{
  if(tesKilit||!tesO)return;const o=tesO,err=m=>{$("teE").textContent=m},L=satirlar(o);
  const recv=L.map((x,i)=>{const v=parseFloat(document.querySelector(`#teRows input[data-i="${i}"]`).value);return isNaN(v)?0:v});
  if(recv.some(v=>v<0))return err("Miktarlar 0 veya daha büyük olmalı.");
  if(!recv.some(v=>v>0))return err("En az bir kalemde gelen miktar yazın.");
  const kapat=$("teKapat").checked,seen=L.map(x=>+x.gelen||0),TS=firebase.database.ServerValue.TIMESTAMP;
  tesKilit=true;$("teOk").disabled=true;
  try{
    let r;
    try{r=await db.ref("siparisler/"+o.id).transaction(cur=>{
      if(cur===null)return null;
      if(cur.durum!=="bekliyor")return;
      const Lc=satirlar(cur);
      if(Lc.length!==seen.length||Lc.some((x,i)=>(+x.gelen||0)!==seen[i]))return;
      Lc.forEach((x,i)=>{x.gelen=Math.round(((+x.gelen||0)+recv[i])*1000)/1000});
      cur.satirlar=Lc;
      cur.durum=(kapat||Lc.every(x=>(+x.gelen||0)>=(+x.miktar||0)))?"geldi":"bekliyor";
      return cur})}catch(e){return err(errText(e))}
    if(!r.committed)return err("Bu sipariş başka biri tarafından değiştirilmiş veya kapatılmış. Pencereyi kapatıp tekrar deneyin.");
    if(!r.snapshot.exists()){$("dTes").close();return toast("Sipariş bulunamadı.")}
    const hata=[];let ok=0;
    for(let i=0;i<L.length;i++){
      if(!(recv[i]>0))continue;const x=L[i],k=sKalem.find(z=>z.id===x.kalemId);
      if(!k){hata.push(x.ad+" (kalem silinmiş)");continue}
      try{
        const base=norm(k).mik,q=recv[i];
        const res=await db.ref("stokKalem/"+k.id+"/mik").transaction(cur=>{const y=Object.assign({},cur||base);y[x.birim]=Math.round(((+y[x.birim]||0)+q)*1000)/1000;return y});
        if(!res.committed){hata.push(x.ad);continue}
        await db.ref("stokHareket").push().set({kalemId:k.id,ad:k.ad||"",tip:"giris",mik:{[x.birim]:q},kalan:res.snapshot.val(),not:"Sipariş teslim: "+(o.firma||""),kullanici:ad(),uid:user.uid,zaman:TS});
        ok++;
      }catch(e){hata.push(x.ad+" ("+errText(e)+")")}
    }
    if(!ok){
      await db.ref("siparisler/"+o.id).transaction(cur=>{if(!cur)return cur;const Lc=satirlar(cur);Lc.forEach((x,i)=>{x.gelen=seen[i]||0});cur.satirlar=Lc;cur.durum="bekliyor";return cur}).catch(()=>{});
      $("dTes").close();alert("Stoğa eklenemedi: "+hata.join(", "));return}
    await db.ref("siparisler/"+o.id).update({teslimTarihi:TS,teslimAlan:ad()}).catch(()=>{});
    $("dTes").close();
    if(hata.length)alert("Kısmen stoğa eklendi. Eklenemeyenler: "+hata.join(", ")+"\nBunları Giriş butonuyla elle ekleyin.");
    else toast(r.snapshot.val().durum==="geldi"?"Stoğa eklendi ✓":"Stoğa eklendi ✓ — kalan için sipariş açık");
  }finally{tesKilit=false;$("teOk").disabled=false}
};
function oOpts(sel){return '<option value="">Kalem seç...</option>'+sKalem.slice().sort(byTr("ad")).map(k=>`<option value="${esc(k.id)}"${k.id===sel?" selected":""}>${esc(k.ad+(k.ebat?" · "+k.ebat:""))}</option>`).join("")}
function uOpts(kid,sel){const k=sKalem.find(x=>x.id===kid),us=k?UN.filter(([u])=>u in norm(k).mik):[];
  return us.length?us.map(([u,l])=>`<option value="${u}"${u===sel?" selected":""}>${l}</option>`).join(""):'<option value="">Birim</option>'}
function oRowAdd(s){s=s||{};const d=document.createElement("div");d.className="orow";d.dataset.g=+s.gelen||0;d.style.cssText="border:1.5px solid #e2e8f0;border-radius:8px;padding:8px;margin-bottom:8px";
  d.innerHTML=`<select data-f="k">${oOpts(s.kalemId)}</select><div style="display:grid;grid-template-columns:1fr 1fr 42px;gap:6px;margin-top:6px"><select data-f="u">${uOpts(s.kalemId,s.birim)}</select><input data-f="q" type="number" inputmode="decimal" min="0" step="any" placeholder="Miktar" value="${esc(s.miktar??"")}"><button type="button" class="btn b5" style="margin:0;padding:0" data-x="1">✕</button></div>${isAdmin()?`<input data-f="p" type="number" inputmode="decimal" min="0" step="any" placeholder="Birim fiyat ₺ (isteğe bağlı)" value="${esc(s.fiyat??"")}" style="margin-top:6px">`:""}${isAdmin()?'<div class="ph"></div>':""}`;
  $("oRows").appendChild(d);oFyGec(d)}
/* önceki alışlar: aynı kalem + birim için tarih / miktar / fiyat */
function oFyGec(r){const box=r.querySelector(".ph");if(!box)return;
  const kid=r.querySelector('[data-f="k"]').value,u=r.querySelector('[data-f="u"]').value;
  if(!kid||!u){box.innerHTML="";return}
  const H=fyGecmis(kid,u,oEdit?oEdit.id:"").slice(0,4),ul=(UL[u]||u).toLowerCase();
  box.innerHTML=H.length?`<div class="mut" style="font-size:12px;font-weight:800;margin:6px 0 3px">GEÇMİŞ ALIŞLAR (dokun: fiyatı kullan)</div>`+H.map(h=>`<div data-p="${esc(h.p)}" style="display:flex;justify-content:space-between;gap:6px;background:#fefce8;border:1px solid #fde68a;border-radius:6px;padding:5px 8px;margin-bottom:3px;font-size:14px;color:#854d0e;cursor:pointer"><span>${esc(tarih(h.t))} · ${esc(fmt(h.q))} ${esc(ul)}${h.firma?" · "+esc(h.firma):""}</span><b>${esc(para(h.p))}${h.kdv!=null?'<small style="font-weight:600"> +KDV %'+esc(fmt(h.kdv))+"</small>":""}</b></div>`).join(""):`<div class="mut" style="font-size:13px;margin-top:6px">Bu kalemi daha önce fiyatlı sipariş etmediniz.</div>`}
$("oRows").onchange=e=>{const t=e.target,r=t.closest(".orow");if(!r)return;if(t.dataset.f==="k")r.querySelector('[data-f="u"]').innerHTML=uOpts(t.value);if(t.dataset.f==="k"||t.dataset.f==="u")oFyGec(r)};
$("oRows").onclick=e=>{const ph=e.target.closest("[data-p]");if(ph){const r=ph.closest(".orow");r.querySelector('[data-f="p"]').value=ph.dataset.p;oTopla();return}
  if(!e.target.dataset.x)return;const r=e.target.closest(".orow");if($("oRows").children.length>1)r.remove();else{r.querySelector('[data-f="k"]').value="";r.querySelector('[data-f="u"]').innerHTML=uOpts("");r.querySelector('[data-f="q"]').value="";oFyGec(r)}};
$("oRowAdd").onclick=()=>oRowAdd();
function oAc(o,tid,pre){
  oEdit=o||null;$("oT").textContent=o?"Siparişi düzenle":"Yeni sipariş";$("oE").textContent="";
  let ops='<option value="">Tedarikçi seç...</option>'+sTed.slice().sort(byTr("firma")).map(t=>`<option value="${esc(t.id)}">${esc(t.firma)}</option>`).join("");
  if(o&&o.tedId&&!sTed.some(t=>t.id===o.tedId))ops+=`<option value="${esc(o.tedId)}">${esc(o.firma||"-")}</option>`;
  $("otd").innerHTML=ops;$("otd").value=o?o.tedId||"":(tid||"");
  const pf=o?(fyat.siparis||{})[o.id]:null;
  $("ofi").classList.toggle("hide",!isAdmin());kdvSet("sip",pf||null);
  $("oRows").innerHTML="";const L=o?satirlar(o).map((x,i)=>Object.assign({},x,{fiyat:pf&&pf.f?pf.f[i]:undefined})):(pre||[]);(L.length?L:[{}]).forEach(oRowAdd);
  $("ono").value=o?o.not||"":"";$("dSip").showModal();oTopla();
}
function oTopla(){
  if(!isAdmin())return;const kd=kdvGet("sip"),el=$("otop");
  if(kd===null){el.classList.remove("hide");el.textContent="KDV oranı 0 ile 100 arasında olmalı.";return}
  const a={h:0,k:0,t:0};let n=0;
  document.querySelectorAll("#oRows .orow").forEach(r=>{const pe=r.querySelector('[data-f="p"]'),p=pe?parseFloat(pe.value):NaN,q=parseFloat(r.querySelector('[data-f="q"]').value);
    if(p>=0&&q>0){const v=kdvHesap(Object.assign({tutar:p},kd),q);a.h+=v.h;a.k+=v.k;a.t+=v.t;n++}});
  el.classList.toggle("hide",!n);el.textContent=n?"💰 Toplam: "+sumTxt(a):"";
}
["input","change"].forEach(t=>$("dSip").addEventListener(t,oTopla));
$("dSip").addEventListener("click",()=>setTimeout(oTopla,0));
$("oAdd").onclick=()=>{if(!sTed.length){toast("Önce bir tedarikçi ekleyin.");sTabSet("ted");return}oAc(null)};
$("oNo").onclick=()=>$("dSip").close();
$("oOk").onclick=async()=>{
  const err=m=>{$("oE").textContent=m},tid=$("otd").value,adm=isAdmin();
  if(!tid)return err("Tedarikçi seçin.");
  const kd=adm?kdvGet("sip"):{};
  if(kd===null)return err("KDV oranı 0 ile 100 arasında olmalı.");
  const S=[],P={};
  for(const r of document.querySelectorAll("#oRows .orow")){
    const kid=r.querySelector('[data-f="k"]').value,u=r.querySelector('[data-f="u"]').value,q=parseFloat(r.querySelector('[data-f="q"]').value),
          pe=r.querySelector('[data-f="p"]'),pv=pe&&pe.value!==""?parseFloat(pe.value):NaN;
    if(!kid&&!(q>0))continue;
    if(!kid)return err("Her satırda kalem seçin.");
    if(!(q>0))return err("Miktar 0'dan büyük olmalı.");
    if(!u)return err("Birim seçin.");
    if(pv<0)return err("Fiyat 0 veya daha büyük olmalı.");
    const k=sKalem.find(x=>x.id===kid);if(!k)return err("Kalem bulunamadı.");
    const line={kalemId:kid,ad:k.ad||"",ebat:k.ebat||"",kategori:k.kategori||"",birim:u,miktar:q},g=parseFloat(r.dataset.g)||0;if(g>0)line.gelen=g;
    if(pv>=0)P[S.length]=pv;
    S.push(line);
  }
  if(!S.length)return err("En az bir kalem ekleyin.");
  if(oEdit){const cur=sSip.find(x=>x.id===oEdit.id);if(!cur||cur.durum!=="bekliyor")return err("Bu sipariş artık düzenlenemez (teslim alınmış veya silinmiş).")}
  const base={tedId:tid,firma:$("otd").selectedOptions[0].textContent,satirlar:S,not:$("ono").value.trim()};let id;
  $("oOk").disabled=true;
  try{
    if(oEdit){id=oEdit.id;await db.ref("siparisler/"+id).update(Object.assign(base,{duzenleyen:ad()}))}
    else{const rf=db.ref("siparisler").push();id=rf.key;await rf.set(Object.assign(base,{durum:"bekliyor",ekleyen:ad(),ekleyenUid:user.uid,eklenmeTarihi:firebase.database.ServerValue.TIMESTAMP}))}
  }catch(e){err(errText(e));$("oOk").disabled=false;return}
  $("oOk").disabled=false;$("dSip").close();sTabSet("sip");
  if(adm){try{const has=Object.keys(P).length;await db.ref("fiyatlar/siparis/"+id).set(has?Object.assign({f:P},kd):null);if(has&&kd.kdv!=null)await kdvKaydet(kd.kdv);toast("Sipariş kaydedildi")}catch(e){toast("Sipariş kaydedildi ama fiyat yazılamadı: "+errText(e))}}
  else toast("Sipariş kaydedildi");
};

/* --- Azalanlardan sipariş taslağı --- */
function lowUnits(k){const n=norm(k),ks=UN.filter(([u])=>u in n.mik).map(x=>x[0]);let L=ks.filter(u=>n.min[u]>0&&n.mik[u]<=n.min[u]);if(!L.length&&dur(k)==="no")L=ks.slice(0,1);return L.map(u=>({u,mik:+n.mik[u]||0,min:+n.min[u]||0}))}
const gv=g=>g||"__yok";
function tasAday(){
  const bekK=new Set();sSip.filter(o=>o.durum==="bekliyor").forEach(o=>satirlar(o).forEach(x=>{if(kalanQ(x)>0)bekK.add(x.kalemId)}));
  return sKalem.filter(k=>dur(k)!=="ok").sort(byTr("ad")).flatMap(k=>lowUnits(k).map(l=>({k,u:l.u,mik:l.mik,min:l.min,sug:l.min>0?Math.max(1,Math.ceil(l.min*2-l.mik)):"",bek:bekK.has(k.id)})));
}
function tasDraw(){
  const A=tasAday(),gs=[...new Set(A.map(a=>(a.k.tedarikci||"").trim()))].sort((a,b)=>a.localeCompare(b,"tr")),cur=$("tsf").value;
  $("tsf").innerHTML='<option value="*">Tümü</option>'+gs.map(g=>`<option value="${esc(gv(g))}"${gv(g)===cur?" selected":""}>${esc(g||"(Tedarikçi belirtilmemiş)")}</option>`).join("");
  const f=$("tsf").value,R=A.filter(a=>f==="*"||gv((a.k.tedarikci||"").trim())===f);
  $("tRows").innerHTML=R.length?R.map(a=>`<div class="tas-r" data-k="${esc(a.k.id)}" data-u="${a.u}" style="display:grid;grid-template-columns:26px 1fr 84px;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid #e2e8f0">
    <input type="checkbox" data-c${a.bek?"":" checked"} style="width:20px;height:20px;padding:0">
    <div><b style="font-size:16px">${esc(a.k.ad)}${a.k.ebat?" · "+esc(a.k.ebat):""}</b><div class="sub" style="font-size:13px">Mevcut ${esc(fmt(a.mik))} ${esc(UL[a.u])}${a.min>0?" · kritik "+esc(fmt(a.min)):""}${a.bek?" · 🧾 siparişte":""}</div></div>
    <div><input type="number" data-q inputmode="decimal" min="0" step="any" value="${esc(a.sug)}" placeholder="Miktar" style="padding:8px"><div class="sub" style="text-align:center;font-size:12px">${esc(UL[a.u])}</div></div></div>`).join(""):'<div class="empty">Azalan veya biten kalem yok.</div>';
}
function tasAc(){$("tsE").textContent="";$("tsf").innerHTML="";tasDraw();$("dTas").showModal()}
$("tsf").onchange=()=>tasDraw();
$("sTas").onclick=()=>{if(!sTed.length){toast("Önce bir tedarikçi ekleyin.");sTabSet("ted");return}tasAc()};
$("tsNo").onclick=()=>$("dTas").close();
$("tsOk").onclick=()=>{
  const pre=[];let bad=false;
  document.querySelectorAll("#tRows .tas-r").forEach(r=>{
    if(!r.querySelector("[data-c]").checked)return;
    const q=parseFloat(r.querySelector("[data-q]").value),k=sKalem.find(x=>x.id===r.dataset.k);if(!k)return;
    if(!(q>0)){bad=true;return}
    pre.push({kalemId:k.id,ad:k.ad||"",ebat:k.ebat||"",birim:r.dataset.u,miktar:q})});
  if(bad)return void($("tsE").textContent="Seçili kalemlerde miktar yazın.");
  if(!pre.length)return void($("tsE").textContent="En az bir kalem seçin.");
  const f=$("tsf").value,t=sTed.find(x=>(x.firma||"").trim().toLowerCase()===f.trim().toLowerCase());
  $("dTas").close();oAc(null,t?t.id:"",pre);
};
/* ================= SEVK ADRESLERİ ================= */
var aRef=null,sAdr=[],aEdit=null;
function vTabSet(t){document.querySelectorAll("#vtabs button").forEach(b=>b.classList.toggle("on",b.dataset.v===t));
  [["sev","vSev"],["tal","vTal"],["tah","vTah"],["adr","vAdr"]].forEach(([k,id])=>$(id).classList.toggle("hide",t!==k))}
/* İş emirleri bölümü üst sekmesi: İŞ EMİRLERİ / DOSYALAR (onaylanmış sevkler) */
function isMTSet(t){const dos=t==="dos"&&dosGor();
  document.querySelectorAll("#isMT button").forEach(b=>b.classList.toggle("on",b.dataset.im===(dos?"dos":"list")));
  $("iAna").classList.toggle("hide",dos);$("vDos").classList.toggle("hide",!dos);$("isMT").classList.toggle("hide",!dosGor());
  if(dos&&!window.dRef)dosYukle()}
const dosGor=()=>modGor("sevk")||modGor("rap"); /* Dosyalar okuma yetkisi rules.json ile aynı: sevk veya raporlar */
$("isMT").onclick=e=>{const b=e.target.closest("button[data-im]");if(b)isMTSet(b.dataset.im)};
$("vtabs").onclick=e=>{const b=e.target.closest("button");if(b&&b.dataset.v)vTabSet(b.dataset.v)};
function adrYukle(){
  if(aRef){aRef.off();aRef=null}
  aRef=db.ref("sevkAdresleri");
  aRef.on("value",x=>{const v=x.val()||{};sAdr=Object.keys(v).map(k=>Object.assign({id:k},v[k]));adrListele()},e=>toast("Sevk adresleri okunamadı: "+errText(e)+" (Firebase kurallarını güncellediniz mi?)"));
}
fbKur("aq",{sel:["asf"],fn:()=>adrListele(),nocount:true,etiket:"eklenme tarihi"});

function adrListele(){
  const trS=(a,b)=>a.localeCompare(b,"tr"),iller=[...new Set(sAdr.map(a=>(a.sehir||"").trim()).filter(Boolean))].sort(trS),cur=$("asf").value;
  $("asf").innerHTML='<option value="">Tüm iller / ilçeler</option>'+iller.map(c=>`<option${c===cur?" selected":""}>${esc(c)}</option>`).join("");
  $("dls").innerHTML=iller.map(c=>`<option value="${esc(c)}">`).join("");
  const st=fbDurum("aq"),f=$("asf").value,
        L=sAdr.filter(a=>fbEsles(st,[a.ad,a.yetkili,a.tel,a.tel2,a.sehir,a.adres,a.not,a.ekleyen],a.eklenmeTarihi)&&(!f||(a.sehir||"").trim()===f)).sort(byTr("ad"));
  fbSay("aq",L.length,sAdr.length,"adres");
  $("aSay2").textContent=sAdr.length;
  $("aSay").textContent=L.length+" adres"+(L.length!==sAdr.length?" (toplam "+sAdr.length+")":"");
  $("aList").innerHTML=L.length?L.map(akart).join(""):'<div class="empty">'+(sAdr.length?"Aramaya uygun adres bulunamadı.":'Kayıtlı sevk adresi yok. "Yeni adres ekle" ile başlayın.')+'</div>';
  $("vtA").textContent="📍 SEVK ADRESLERİ"+(sAdr.length?" ("+sAdr.length+")":"");
  adrAra();
}
function akart(a){
  const id=esc(a.id),canDel=isAdmin()||(a.ekleyenUid&&a.ekleyenUid===user.uid),
        tels=[a.tel,a.tel2].filter(Boolean).map(x=>`<a href="tel:${esc(String(x).replace(/[^\d+]/g,""))}">📞 ${esc(x)}</a>`).join(" · ");
  return `<div class="item c tamam-border">
  <div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><b class="nm">${esc(a.ad)}</b>${a.sehir?`<span class="badge" style="background:#64748b">${esc(a.sehir)}</span>`:""}</div>
  ${a.yetkili||tels?`<div class="sub" style="font-size:16px">${a.yetkili?"👤 "+esc(a.yetkili)+" ":""}${tels}</div>`:""}
  ${a.adres?`<div class="sub" style="font-size:15px;color:#334155">📍 ${esc(a.adres)}</div>`:""}
  ${a.not?`<div class="sub">📌 ${esc(a.not)}</div>`:""}
  <div class="acts s"><button class="btn b1" data-a="sevk" data-id="${id}">🚚 Sevkiyat oluştur</button><button class="btn b7" data-a="map" data-id="${id}">🗺️ Harita</button>
  <button class="btn b6 i" data-a="edit" data-id="${id}">✏️</button>${canDel?`<button class="btn b5 i" data-a="del" data-id="${id}">🗑️</button>`:""}</div></div>`;
}
$("aList").onclick=async e=>{
  const b=e.target.closest("button[data-a]");if(!b)return;const a=sAdr.find(x=>x.id===b.dataset.id);if(!a)return;const k=b.dataset.a;
  if(k==="map")haritaAc(safeUrl(a.haritaUrl),a.adres||a.ad);
  else if(k==="edit")aAc(a);
  else if(k==="sevk")adrSevk(a);
  else if(k==="del"&&confirm(`"${a.ad}" adresi silinsin mi? (Mevcut sevkiyat kayıtları etkilenmez)`)){try{await silCop("sevkAdresleri",a.id,a.ad);toast("Silindi (Çöp kutusuna alındı)")}catch(err){toast(errText(err))}}
};
/* adresi sevkiyat formuna aktar */
function adrDoldur(a){$("mu").value=a.ad||"";$("ad").value=a.adres||"";$("hu").value=a.haritaUrl||"";$("mu").closest("details").open=true}
function adrSevk(a){if(editId)formTemizle();adrDoldur(a);vTabSet("sev");window.scrollTo({top:0,behavior:"smooth"});toast("Adres forma aktarıldı. Etiket fotoğrafını çekin.")}
/* kayıtlı adreste arayarak seç */
function adrAra(){
  const box=$("adrRes");if(box.classList.contains("hide"))return;
  const w=trn($("adrQ").value).trim().split(/\s+/).filter(Boolean),
    R=sAdr.filter(a=>{const h=trn([a.ad,a.yetkili,a.tel,a.tel2,a.sehir,a.adres,a.not].join(" "));return w.every(t=>h.includes(t))}).sort(byTr("ad"));
  box.innerHTML=R.length?R.map(a=>`<div data-id="${esc(a.id)}" style="padding:9px 11px;border-bottom:1px solid #e2e8f0;cursor:pointer"><b style="font-size:16px">${esc(a.ad)}</b>${a.sehir?` <span class="mut" style="font-size:13px">· ${esc(a.sehir)}</span>`:""}${a.adres?`<div class="sub" style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.adres)}</div>`:""}</div>`).join(""):`<div style="padding:12px;text-align:center;color:#94a3b8;font-weight:700">${sAdr.length?"Aramaya uygun adres yok":"Kayıtlı adres yok"}</div>`}
function adrAc(){$("adrRes").classList.remove("hide");adrAra()}
$("adrQ").addEventListener("focus",adrAc);$("adrQ").addEventListener("input",adrAc);
$("adrRes").addEventListener("mousedown",e=>e.preventDefault());
$("adrRes").onclick=e=>{const d=e.target.closest("[data-id]");if(!d)return;const a=sAdr.find(x=>x.id===d.dataset.id);if(!a)return;
  adrDoldur(a);$("adrQ").value="";$("adrRes").classList.add("hide");$("adrQ").blur();toast("Adres dolduruldu: "+a.ad)};
document.addEventListener("click",e=>{if(!e.target.closest("#adrQ")&&!e.target.closest("#adrRes"))$("adrRes").classList.add("hide")});
$("adrSave").onclick=()=>{
  let ad0=$("ad").value.trim();const hu=$("hu").value.trim();if(hu&&!safeUrl(hu)&&!ad0)ad0=hu;
  const mu=$("mu").value.trim();
  aAc(null,{ad:mu==="Etikete Bakınız"?"":mu,adres:ad0,haritaUrl:safeUrl(hu)});
};
/* ekle / düzenle */
const AF=[["aFi","ad"],["aYt","yetkili"],["aTl","tel"],["aTl2","tel2"],["aSh","sehir"],["aAd","adres"],["aHu","haritaUrl"],["aNt","not"]];
function aAc(a,pre){aEdit=a||null;const v=a||pre||{};$("aT").textContent=a?"Sevk adresini düzenle":"Yeni sevk adresi";$("aE").textContent="";
  AF.forEach(([i,f])=>$(i).value=v[f]||"");$("dAdr").showModal()}
$("aAdd").onclick=()=>aAc(null);
$("aX").onclick=()=>$("dAdr").close();
$("aHs").onclick=()=>{const v=$("aHu").value.trim(),a0=$("aAd").value.trim();haritaAc(safeUrl(v),v&&!safeUrl(v)?v:(a0||$("aFi").value.trim()))};
$("aOk").onclick=async()=>{
  const err=m=>{$("aE").textContent=m},d={};AF.forEach(([i,f])=>d[f]=$(i).value.trim());
  if(!d.ad)return err("Firma / müşteri adı gerekli.");
  if(d.haritaUrl&&!safeUrl(d.haritaUrl))return err("Harita linki geçerli değil. Boş bırakın veya https:// ile başlayan Google Maps bağlantısını yapıştırın.");
  d.haritaUrl=safeUrl(d.haritaUrl);
  if(!d.adres&&!d.haritaUrl)return err("Açık adres veya harita linki girin.");
  if((!aEdit||(aEdit.ad||"").toLowerCase()!==d.ad.toLowerCase())&&sAdr.some(x=>(x.ad||"").toLowerCase()===d.ad.toLowerCase())&&!confirm("Bu isimde bir adres zaten kayıtlı. Yine de eklensin mi?"))return;
  $("aOk").disabled=true;
  try{
    if(aEdit)await db.ref("sevkAdresleri/"+aEdit.id).update(Object.assign(d,{duzenleyen:ad()}));
    else await db.ref("sevkAdresleri").push().set(Object.assign(d,{ekleyen:ad(),ekleyenUid:user.uid,eklenmeTarihi:firebase.database.ServerValue.TIMESTAMP}));
    $("dAdr").close();toast("Adres kaydedildi");
  }catch(e){err(errText(e))}
  $("aOk").disabled=false;
};
/* toplu ekle: her satır "firma adı | harita linki" */
$("aToplu").onclick=()=>{$("tpT").value="";$("tpE").textContent="";$("dTop").showModal()};
$("tpX").onclick=()=>$("dTop").close();
$("tpOk").onclick=async()=>{
  const err=m=>{$("tpE").textContent=m},mevcut=new Set(sAdr.map(x=>(x.ad||"").trim().toLowerCase())),goruldu=new Set(),yeni=[],atla=[],hata=[];
  const kes=t=>t.replace(/^[\s|;,\t\-–:]+|[\s|;,\t\-–:]+$/g,"").trim();
  let bek="";
  const ekle=(ad0,url)=>{const k=ad0.toLowerCase();if(mevcut.has(k)||goruldu.has(k)){atla.push(ad0);return}goruldu.add(k);yeni.push({ad:ad0,url})};
  $("tpT").value.split(/\r?\n/).forEach(h=>{
    h=h.trim();if(!h)return;
    const m=h.match(/https?:\/\/\S+/i);
    if(!m){if(bek)hata.push(bek.slice(0,40));bek=kes(h);return}   /* sadece isim satırı: linki sonraki satırda beklenir */
    const url=safeUrl(m[0]),ad0=kes(h.replace(m[0],""))||bek;bek="";
    if(!ad0||!url){hata.push((ad0||h).slice(0,40));return}
    ekle(ad0,url);
  });
  if(bek)hata.push(bek.slice(0,40));
  if(!yeni.length)return err(hata.length?"Firma adı ve link birlikte olmalı. Okunamayan satır: "+hata[0]:atla.length?"Hepsi zaten kayıtlı.":"Eklenecek satır yok.");
  if(yeni.length>200)return err("Tek seferde en fazla 200 adres eklenebilir.");
  $("tpOk").disabled=true;
  try{
    const up={},TS=firebase.database.ServerValue.TIMESTAMP;
    yeni.forEach(x=>{up[db.ref("sevkAdresleri").push().key]={ad:x.ad,haritaUrl:x.url,ekleyen:ad(),ekleyenUid:user.uid,eklenmeTarihi:TS}});
    await db.ref("sevkAdresleri").update(up);
    $("dTop").close();
    toast("✓ "+yeni.length+" adres eklendi"+(atla.length?", "+atla.length+" zaten kayıtlı olduğu için atlandı":"")+(hata.length?", "+hata.length+" satır okunamadı":"")+".");
  }catch(e){err(errText(e))}
  $("tpOk").disabled=false;
};
$("aCsv").onclick=()=>{
  const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
  const r=[["Firma / Müşteri","Yetkili","Telefon","2. Telefon","İl / İlçe","Adres","Harita linki","Not"].map(q).join(";")].concat(sAdr.slice().sort(byTr("ad")).map(a=>[a.ad,a.yetkili,a.tel,a.tel2,a.sehir,a.adres,a.haritaUrl,a.not].map(q).join(";")));
  const el=document.createElement("a");el.href=URL.createObjectURL(new Blob(["\ufeff"+r.join("\r\n")],{type:"text/csv;charset=utf-8"}));el.download="sevk-adresleri.csv";el.click();
};

/* ================= DOSYALAR (onaylanmış sevkler) ================= */
var dRef=null,dosya=[],dLimit=200,dAcik=new Set(),dFoto={};
const IST="Europe/Istanbul",_df=new Intl.DateTimeFormat("en-GB",{timeZone:IST,year:"numeric",month:"2-digit",day:"2-digit"});
function dKey(t){const p={};_df.formatToParts(new Date(+t)).forEach(x=>p[x.type]=x.value);return p.year+"-"+p.month+"-"+p.day}
const dTarih=d=>+d.irsaliyeTarihi?dKey(d.irsaliyeTarihi):(d.tarih||(+d.onayTarihi?dKey(d.onayTarihi):""));
const dZaman=d=>+d.irsaliyeTarihi||+d.onayTarihi||0;
const dSaat=t=>t?new Date(+t).toLocaleTimeString("tr-TR",{timeZone:IST,hour:"2-digit",minute:"2-digit"}):"";
const dTam=t=>t?new Date(+t).toLocaleString("tr-TR",{timeZone:IST,day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"";
function turAd(d){const t=d.irsTur||"irsaliye";return t==="iade"?"İade":t==="diger"?"Diğer"+(d.irsNot?": "+d.irsNot:""):"İmzalı irsaliye"}
function dGun(k){return /^\d{4}-\d\d-\d\d$/.test(k)?trDate(k)+" · "+new Date(k+"T12:00:00Z").toLocaleDateString("tr-TR",{weekday:"long",timeZone:"UTC"}):"Tarihsiz"}
function dosYukle(){
  if(dRef){dRef.off();dRef=null}
  dRef=db.ref("dosyalar").orderByChild("onayTarihi").limitToLast(dLimit);
  dRef.on("value",s=>{const v=s.val()||{};
    dosya=Object.keys(v).map(k=>Object.assign({id:k},v[k]));
    $("dMore").classList.toggle("hide",dosya.length<dLimit);dosListele()},
    e=>toast("Dosyalar okunamadı: "+errText(e)+" (Firebase kurallarını güncellediniz mi?)"));
}
$("dMore").onclick=()=>{dLimit+=200;dosYukle()};
function dosFiltre(){
  const st=fbDurum("dq"),tp=$("dtp").value;
  const R=dosya.filter(d=>fbEsles(st,[d.musteri,d.urun,d.adres,d.not,d.irsNot,d.ekleyen,d.teslimEden,d.onaylayan,turAd(d)],dTarih(d))&&(!tp||(d.irsTur||"irsaliye")===tp))
    .sort((x,y)=>(dTarih(y)>dTarih(x)?1:dTarih(y)<dTarih(x)?-1:0)||dZaman(y)-dZaman(x));
  fbSay("dq",R.length,dosya.length);return R;
}
function ebatBlok(urun){
  const L=String(urun||"").split("\n").map(x=>x.trim()).filter(Boolean),pr=x=>{const i=x.indexOf(": ");return i>0?[x.slice(0,i),x.slice(i+2)]:null};
  let ad=L[0]||"",rows=[];
  if(L.length>1&&L.slice(1).every(pr))rows=L.slice(1).map(pr);else ad=L.join("\n");
  return `<div class="info full"><small>Ürün / Ebat</small><b class="ebad">${esc(ad)}</b>${rows.map(r=>`<div class="ebr"><span class="eb1">${esc(r[0])}</span><span class="eb2">${esc(r[1])}</span></div>`).join("")}</div>`;
}
function dSatir(d){
  const id=esc(d.id),open=dAcik.has(d.id),t=d.irsTur||"irsaliye",
    m=d.musteri&&d.musteri!=="Etikete Bakınız",p=d.urun&&d.urun!=="Etikete Bakınız",
    pf=p?String(d.urun).split("\n")[0]:"",bas=m&&p?d.musteri+" — "+pf:m?d.musteri:p?pf:"Etikete bakınız",
    cls={irsaliye:"",diger:"dg",iade:"di"}[t]||"",ic={irsaliye:"📄",diger:"📝",iade:"↩️"}[t]||"📄",sa=dSaat(d.irsaliyeTarihi);
  return `<button type="button" class="dfile ${cls}" data-id="${id}"><span class="dz">${ic}</span><div class="dm"><div class="dn">${esc(bas)}</div><div class="dd">${esc(fmt(d.kg))} kg · ${esc(fmt(d.paket))} adet · ${esc(turAd(d))}${sa?" · "+esc(sa):""}</div></div><span class="chev">${open?"▲":"▼"}</span></button>${open?dDetay(d):""}`;
}
function dDetay(d){
  const id=esc(d.id),t=d.irsTur||"irsaliye",ic={irsaliye:"📄",diger:"📝",iade:"↩️"}[t]||"📄",
    m=d.musteri&&d.musteri!=="Etikete Bakınız",p=d.urun&&d.urun!=="Etikete Bakınız",
    tn=t==="iade"?"İade":t==="diger"?"Diğer":"İmzalı irsaliye";
  return `<div class="ddet">
    <div class="grid"><div class="hl"><small>AĞIRLIK</small><b>${esc(fmt(d.kg))} KG</b></div><div class="hl"><small>PAKET / ADET</small><b>${esc(fmt(d.paket))}</b></div></div>
    ${m||p?`<div class="grid" style="margin-top:6px">${m?`<div class="info full"><small>Müşteri</small><b>${esc(d.musteri)}</b></div>`:""}${p?ebatBlok(d.urun):""}</div>`:""}
    ${d.adres?`<div class="addr">📍 <b>Adres:</b> ${esc(d.adres)}</div>`:""}
    ${d.not?`<div class="note">📌 <b>Not:</b> ${esc(d.not)}</div>`:""}
    <div class="who">Sevk tarihi: ${esc(trDate(d.tarih))} · Kaydeden: ${esc(d.ekleyen||"-")}</div>
    ${d.teslimEden?`<div class="who" style="color:#2563eb;font-weight:700">Teslim eden: ${esc(d.teslimEden)}${d.irsaliyeTarihi?" · "+esc(dTam(d.irsaliyeTarihi)):""}</div>`:""}
    <div class="who" style="color:#0f766e;font-weight:700">✅ Onaylayan: ${esc(d.onaylayan||"-")}${d.onayTarihi?" · "+esc(dTam(d.onayTarihi)):""}</div>
    ${isAdmin()?sFyHtml(d):""}
    <div class="acts s">${d.fotoVar?`<button class="btn b6" data-a="dfoto" data-p="foto" data-id="${id}">🏷️ Etiket fotoğrafı</button>`:""}${Array.from({length:+d.fotoSayi||0},(_,i)=>`<button class="btn b6" data-a="dfoto" data-p="fotolar/${i}" data-id="${id}">🏷️ Foto ${i+2}</button>`).join("")}${d.irsVar?`<button class="btn b4" data-a="dfoto" data-p="irsaliye" data-id="${id}">${ic} ${esc(tn)} fotoğrafı</button>`:""}${(Array.isArray(d.irsEk)?d.irsEk:Object.values(d.irsEk||{})).map((m,i)=>`<button class="btn b4" data-a="dfoto" data-p="irsEkler/${i}" data-id="${id}">${{irsaliye:"📄",diger:"📝",iade:"↩️"}[m.tur]||"📄"} ${m.tur==="iade"?"İade":m.tur==="diger"?"Diğer"+(m.not?": "+esc(m.not):""):"İmzalı irsaliye"} fotoğrafı ${i+2}</button>`).join("")}</div>
    ${isAdmin()?`<div class="acts"><button class="btn b6" data-a="dgeri" data-id="${id}">↩️ Onayı kaldır</button><button class="btn b5" data-a="dsil" data-id="${id}">🗑️ Sil</button></div>`:""}
  </div>`;
}
function dosListele(){
  const L=dosFiltre(),G=[];
  L.forEach(d=>{const k=dTarih(d)||"-";let g=G[G.length-1];if(!g||g.k!==k){g={k,items:[]};G.push(g)}g.items.push(d)});
  $("dSumT").textContent=L.length+" dosya · "+fmt(L.reduce((s,d)=>s+(+d.kg||0),0))+" kg";
  $("dList").innerHTML=G.length?G.map(g=>`<div class="shd">📅 ${esc(dGun(g.k))} · ${g.items.length} dosya · ${esc(fmt(g.items.reduce((s,d)=>s+(+d.kg||0),0)))} kg</div>`+g.items.map(dSatir).join("")).join(""):'<div class="empty">Dosya bulunamadı.</div>';
}
fbKur("dq",{d1:"dd1",d2:"dd2",sel:["dtp"],fn:()=>dosListele(),nocount:true});
async function dosFoto(id,p){
  const k=id+"/"+p;
  if(!dFoto[k]){
    toast("Fotoğraf yükleniyor...");
    const s=await db.ref("dosyaFoto/"+id+"/"+p).once("value"),v=safeImg(s.val());
    if(!v){toast("Fotoğraf bulunamadı.");return}
    if(Object.keys(dFoto).length>=6)for(const x in dFoto)delete dFoto[x];
    dFoto[k]=v;
  }
  if(window.fvAc)window.fvAc(dFoto[k]);
}
async function dosyayaTasi(u){
  const L=Object.assign({},u);delete L.id;delete L.foto;delete L.irsaliye;delete L.fotolar;delete L.irsEkler;
  const EK=irsListe(u).slice(1);
  L.irsEk=EK.length?EK.map(x=>({tur:x.tur,not:x.not||"",ceken:x.ceken||"",tarih:x.tarih||0})):null;
  L.fotoVar=!!safeImg(u.foto);L.irsVar=!!safeImg(u.irsaliye);L.fotoSayi=ekFoto(u).length;
  L.onayTarihi=firebase.database.ServerValue.TIMESTAMP;L.onaylayan=ad();
  const up={["dosyalar/"+u.id]:L,["urunler/"+u.id]:null};
  if(L.fotoVar)up["dosyaFoto/"+u.id+"/foto"]=u.foto;
  if(L.irsVar)up["dosyaFoto/"+u.id+"/irsaliye"]=u.irsaliye;
  if(L.fotoSayi)up["dosyaFoto/"+u.id+"/fotolar"]=ekFoto(u);
  if(EK.length)up["dosyaFoto/"+u.id+"/irsEkler"]=EK.map(x=>x.f);
  await db.ref().update(up);
  toast("✓ Onaylandı, Dosyalar bölümüne taşındı");
}
async function dosyaGeri(d){
  const s=await db.ref("dosyaFoto/"+d.id).once("value"),P=s.val()||{},R=Object.assign({},d);
  ["id","onayTarihi","onaylayan","fotoVar","irsVar","fotoSayi","irsEk"].forEach(k=>delete R[k]);
  if(safeImg(P.foto))R.foto=P.foto;if(safeImg(P.irsaliye))R.irsaliye=P.irsaliye;
  {const ek=ekFoto(P);if(ek.length)R.fotolar=ek}
  {const ef=Array.isArray(P.irsEkler)?P.irsEkler:Object.values(P.irsEkler||{}),mt=Array.isArray(d.irsEk)?d.irsEk:Object.values(d.irsEk||{});
    ef.forEach((f,i)=>{if(!safeImg(f))return;const m=mt[i]||{};R.irsEkler=R.irsEkler||{};R.irsEkler[db.ref().push().key]={f:f,tur:m.tur||"irsaliye",not:m.not||"",ceken:m.ceken||"",tarih:m.tarih||0}})}
  await db.ref().update({["urunler/"+d.id]:R,["dosyalar/"+d.id]:null,["dosyaFoto/"+d.id]:null});
  dAcik.delete(d.id);
  toast("Onay kaldırıldı, Sevk Edilenler'e geri alındı");
}
$("dList").onclick=async e=>{
  const b=e.target.closest("button[data-a]");
  if(b){
    const d=dosya.find(x=>x.id===b.dataset.id);if(!d)return;const a=b.dataset.a;
    try{
      if(a==="dfoto")await dosFoto(d.id,b.dataset.p);
      else if(a==="dgeri"&&isAdmin()&&confirm("Onay kaldırılsın ve sevk 'Sevk Edilenler' bölümüne geri alınsın mı?"))await dosyaGeri(d);
      else if(a==="dsil"&&isAdmin()&&confirm("Bu dosya kalıcı olarak silinsin mi?")){
        await silCop("dosyalar",d.id,(d.musteri||"")+" / "+(d.urun||"Dosya"),["dosyaFoto/"+d.id,"fiyatlar/sevk/"+d.id]);
        dAcik.delete(d.id);toast("Silindi");
      }
    }catch(err){toast(errText(err))}
    return;
  }
  const h=e.target.closest(".dfile");
  if(h){const id=h.dataset.id;if(dAcik.has(id))dAcik.delete(id);else dAcik.add(id);dosListele()}
};
$("dCsv").onclick=()=>{
  const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"',n=v=>q(String(+v||0).replace(".",","));
  const r=[["Teslim Tarihi","Tür","Müşteri","Ürün","Kg","Adet","Adres","Not","Kaydeden","Teslim eden","Onaylayan","Onay Tarihi"].concat(isAdmin()?["Fiyat (₺)","Esas","KDV %","Tutar (₺)","KDV (₺)","Toplam (₺)"]:[]).map(q).join(";")]
    .concat(dosFiltre().map(d=>[q(trDate(dTarih(d))),q(turAd(d)),q(d.musteri),q(d.urun),n(d.kg),n(d.paket),q(d.adres),q(d.not),q(d.ekleyen),q(d.teslimEden),q(d.onaylayan),q(dTam(d.onayTarihi))].concat(isAdmin()?sFyCsv(d):[]).join(";")));
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+r.join("\r\n")],{type:"text/csv;charset=utf-8"}));a.download="dosyalar.csv";a.click();
};


/* ================= İŞ EMİRLERİ (üretim takip formu) ================= */
var iRef=null,isE=[],iTab="etiket",uTab="ekstruder",iEdit=null;
const URA=["ekstruder","baski","kesim","depo","bitti"]; /* Üretim bölümünde görünen aşamalar; İş emirleri bölümünde sadece etiket */
const AS=[["etiket","🏷️ ETİKET"],["ekstruder","🏭 EKSTRUDER"],["baski","🖨️ BASKI"],["kesim","✂️ KESİM"],["depo","📦 DEPO"],["bitti","✅ BİTEN"]],ASL=Object.fromEntries(AS);
const asOrd=e=>e&&e.baskiVar?["etiket","ekstruder","baski","kesim","depo","bitti"]:["etiket","ekstruder","kesim","depo","bitti"];
const bugun=()=>trIso(Date.now());
const icols=e=>Object.values(e.siparis||{}).filter(Boolean);
/* ---- Hareket geçmişi: isHareket/<isEmriId>/<pushId> (sadece eklenir, değiştirilemez) ---- */
const HT={olustur:"🆕 Oluşturdu",ileri:"✅ İlerletti",geri:"↩️ Geri aldı",etiketsiz:"⚠️ Etiketsiz ilerletti",etiket:"🏷️ Etiket bastı",duzenle:"✏️ Düzenledi",aktar:"📦 Hazır ürünlere aktardı"};
function hrkObj(o){return Object.assign({kim:ad(),uid:user.uid,zaman:firebase.database.ServerValue.TIMESTAMP},o)}
function hrkEk(up,id,o){up["isHareket/"+id+"/"+db.ref("isHareket/"+id).push().key]=hrkObj(o);return up}
function hrkYaz(id,o){return db.ref("isHareket/"+id).push().set(hrkObj(o))}
function isKapat(){if(iRef){iRef.off();iRef=null}}
function isYukle(){isKapat();iRef=db.ref("isEmirleri").orderByChild("eklenmeTarihi").limitToLast(300);
  iRef.on("value",s=>{const v=s.val()||{};isE=Object.keys(v).map(k=>Object.assign({id:k},v[k])).sort((a,b)=>(b.eklenmeTarihi||0)-(a.eklenmeTarihi||0));isListele()},
  e=>toast("İş emirleri okunamadı: "+errText(e)+" (Firebase kurallarını güncellediniz mi?)"))}
fbKur("iq",{fn:()=>isListele(),etiket:"sipariş tarihi"});
fbKur("uq",{fn:()=>isListele(),etiket:"sipariş tarihi"});
$("iTabs").onclick=e=>{const b=e.target.closest("button[data-t]");if(b){iTab=b.dataset.t;isListele()}};
$("uTabs").onclick=e=>{const b=e.target.closest("button[data-t]");if(b){uTab=b.dataset.t;isListele()}};
function isListele(){
  const u=panel==="uretim";if(!u&&panel!=="is")return;
  const q=u?"uq":"iq",st=fbDurum(q),ST=u?URA:["etiket"];
  const AG=AS.filter(([k])=>ST.includes(k)&&asamaGor(k)),EG=isE.filter(e=>ST.includes(e.asama)&&asamaGor(e.asama));
  let T=u?uTab:iTab;if(!AG.some(([k])=>k===T)&&AG.length)T=AG[0][0];if(u)uTab=T;else iTab=T;
  if(u&&yRol()&&yRol().goster&&!isAdmin())$("mt").textContent=yRol().goster.map(k=>ASL[k]).join(" + ");
  $(u?"uTabs":"iTabs").innerHTML=AG.map(([k,l])=>{const n=isE.filter(e=>e.asama===k&&!e.aktarildi).length;return `<button data-t="${k}" style="font-size:12px" class="${k===T?"on":""}">${l}${k!=="bitti"&&n?" ("+n+")":""}</button>`}).join("");
  /* İş emirleri bölümünde arama açıkken tüm aşamalar taranır; Üretim'de sadece üretim aşamaları */
  const EA=st.aktif&&!u?isE.filter(e=>asamaGor(e.asama)):EG;
  const L=st.aktif?EA.filter(e=>fbEsles(st,[e.no,e.musteri,e.stok,e.isAdi,e.fx,e.formul,e.urunAdi,e.renk,e.notU,e.notB,e.ekleyen,ASL[e.asama]],e.spTarih||e.eklenmeTarihi)):EG.filter(e=>e.asama===T&&!e.aktarildi);
  fbSay(q,L.length,EA.length,"iş emri");
  $(u?"uList":"iList").innerHTML=(st.aktif?'<div class="mut" style="font-size:13px;margin:0 0 6px">🔎 Arama/filtre açık: '+(u?"tüm üretim aşamalarında":"tüm aşamalarda")+' gösteriliyor</div>':"")+(L.length?L.map(isKart).join(""):'<div class="empty">'+(st.aktif?"Aramaya uygun iş emri yok.":"Bu aşamada iş emri yok.")+'</div>');
}
function isKart(e){
  const id=esc(e.id),o=asOrd(e),i=o.indexOf(e.asama),nx=o[i+1],canDel=isAdmin()||(islemYap("isSil")&&e.ekleyenUid&&e.ekleyenUid===user.uid);
  const C=icols(e).map(c=>`<div class="info" style="margin-top:4px"><b>${esc(fmt(c.kg))} kg</b> · ${esc(c.en||"-")} · ${esc(c.mikron||"-")}µ · ${esc(c.korona||"-")}${c.boy?" · boy "+esc(c.boy):""}</div>`).join("");
  const lg=Object.entries(e.log||{}).map(([k,v])=>`<div class="who">${esc(ASL[k]||k)}: ${v.kg!=null?esc(fmt(v.kg))+" kg":""}${v.paket?" · "+esc(fmt(v.paket))+" adet":""} — ${esc(v.kim||"")} ${esc(tarih(v.zaman))}${k==="depo"&&Array.isArray(v.kalem)?"<br>"+v.kalem.map((x,i)=>{const c=icols(e)[i]||{};return esc([i+1,c.en,c.boy].filter(v=>v!==undefined&&v!==null&&String(v).trim()!=="").join(" - ")+": "+fmt(x&&x.kg)+" kg · "+fmt(x&&x.paket)+" paket")}).join("<br>"):""}</div>`).join("");
  return `<div class="item sevk-border">
  <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:19px">${esc(e.no)}</b><span class="badge badge-sevk">${esc(ASL[e.asama]||e.asama)}</span></div>
  <div class="sub" style="font-size:16px;color:#0f172a;font-weight:700">${esc(e.musteri)}${e.isAdi?" · "+esc(e.isAdi):""}</div>
  <div class="sub">${esc(e.stok||"")}${e.formul?" · "+esc(e.formul):""}</div>
  <div class="sub">${e.spTarih?"Sipariş: "+esc(trDate(e.spTarih)):""}${e.fx?" · "+esc(e.fx):""}${e.baskiVar?" · 🖨️ baskılı":""}</div>
  ${C}
  ${e.asama==="etiket"?`<div class="note" style="margin-top:6px">🏷️ ${e.etiketYapildi?"Etiket hazır ✅":"Etiket henüz yapılmadı — Ekstruder'e geçmeden önce etiket hazırlayın"}</div>`:(e.etiketsiz?`<div class="who">⚠️ Etiketsiz devam edildi</div>`:"")}
  ${e.notU?`<div class="note">📌 <b>Üretim:</b> ${notHtml(e.notU)}</div>`:""}
  ${e.baskiVar||e.notB?`<div class="addr">🖨️ ${esc(e.urunAdi||"")} ${e.renk?"· "+esc(e.renk):""}${e.notB?"<br>"+notHtml(e.notB):""}</div>`:""}
  ${lg}
  <div class="acts">${e.asama==="etiket"&&asamaYap("etiket")?`<button class="btn b7 big" style="grid-column:span 2" data-a="etik" data-id="${id}">🏷️ Etiket hazırla</button>`:""}${nx&&asamaYap(e.asama)?`<button class="btn b3" style="grid-column:span 2;padding:14px;font-size:18px" data-a="ileri" data-id="${id}">${e.asama==="depo"?"📦 Depoya girişi kaydet → BİTEN":"✓ Bitti → "+esc(ASL[nx])}</button>`:""}
  ${i>0&&islemYap("geriAl")?`<button class="btn b6" data-a="geri" data-id="${id}">↩️ Geri al</button>`:""}<button class="btn b6" data-a="yaz" data-id="${id}">🖨️ Yazdır</button>${e.asama!=="etiket"&&asamaYap("etiket")?`<button class="btn b7" data-a="etik" data-id="${id}">🏷️ Etiket</button>`:""}${islemYap("isDuzenle")?`<button class="btn b6" data-a="edit" data-id="${id}">✏️ Düzenle</button>`:""}<button class="btn b6" data-a="gecmis" data-id="${id}">🕘 Geçmiş</button><button class="btn b6" data-a="qr" data-id="${id}">📱 QR</button>${canDel?`<button class="btn b5" data-a="del" data-id="${id}">🗑️ Sil</button>`:""}</div>
  ${e.asama==="bitti"&&e.bekleAktar&&!e.aktarildi&&modGor("sevk")?`<button class="btn b4" style="width:100%;margin-top:8px;padding:14px;font-size:18px" data-a="aktar" data-id="${id}">📦 Hazır ürünlere aktar</button>`:""}${e.aktarildi?`<div class="note" style="margin-top:8px">✅ Hazır ürünlere aktarıldı</div>`:""}</div>`;
}
const isAksiyon=async ev=>{
  const b=ev.target.closest("button[data-a]");if(!b)return;const e=isBulId(b.dataset.id);if(!e)return;
  const a=b.dataset.a,o=asOrd(e),i=o.indexOf(e.asama),TS=firebase.database.ServerValue.TIMESTAMP;
  try{
    if(a==="yaz")isYazdir(e);
    else if(a==="qr")iqAc(e.no);
    else if(a==="etik"){if(!asamaYap("etiket")){toast("Etiket işlemi için yetkiniz yok.");return}etiketAc(e)}
    else if(a==="aktar"){
      if(!modGor("sevk")){toast("Hazır ürünlere aktarma yetkiniz yok.");return}
      const d=(e.log&&e.log.depo)||{},C=icols(e);
      const P=Array.isArray(d.kalem)?d.kalem.map((x,i)=>({i,kg:+(x&&x.kg)||0,paket:+(x&&x.paket)||0,c:C[i]||{}})).filter(x=>x.kg>0||x.paket>0):[{i:0,kg:+d.kg||0,paket:+d.paket||0,c:C[0]||{}}];
      if(!P.length||P.every(x=>x.kg<=0&&x.paket<=0)){toast("Depo girişi boş.");return}
      if(!confirm(e.no+" hazır ürünlere aktarılsın mı?\n"+P.map(x=>(x.c.en||"-")+": "+x.kg+" kg, "+x.paket+" paket").join("\n")))return;
      const up={},K={},key=db.ref("urunler").push().key;
      const lab=P.map(x=>[x.i+1,x.c.en,x.c.boy].filter(v=>v!==undefined&&v!==null&&String(v).trim()!=="").join(" - "));
      const lines=P.map((x,j)=>lab[j]+": "+[x.kg>0?fmt(x.kg)+" kg":"",x.paket>0?x.paket+" paket":""].filter(Boolean).join(" · "));
      const tkg=Math.round(P.reduce((a,x)=>a+x.kg,0)*1000)/1000,tpk=P.reduce((a,x)=>a+x.paket,0);
      up["urunler/"+key]={musteri:e.musteri||"Etikete Bakınız",urun:((e.stok||"")+(lines.length?"\n"+lines.join("\n"):""))||"Etikete Bakınız",kg:tkg,paket:tpk,tarih:bugun(),durum:"hazir",not:"İş emri "+e.no+(e.fx?" · "+e.fx:""),adres:"",haritaUrl:"",ekleyen:ad(),ekleyenUid:user.uid,eklenmeTarihi:TS,isEmriNo:e.no,isEmriId:e.id,urunAd:e.stok||"",kalem:P.length>1?P.map((x,j)=>({ad:lab[j],kg:x.kg,paket:x.paket})):null};K[key]=true;
      up["isEmirleri/"+e.id+"/aktarildi"]=true;up["isEmirleri/"+e.id+"/aktarTarih"]=TS;up["isEmirleri/"+e.id+"/aktarKeys"]=K;
      hrkEk(up,e.id,{tur:"aktar",kg:tkg,paket:tpk});
      await db.ref().update(up);
      toast("✓ Sevkiyat > Hazır ürünlere aktarıldı");
      waOner("📦 Sevke hazır","📦 *Sevke hazır*\nMüşteri: "+(e.musteri||"-")+"\nİş emri: "+e.no+"\n"+lines.join("\n")+"\nToplam: "+fmt(tkg)+" kg · "+fmt(tpk)+" paket");
    }
    else if(a==="edit"){if(!islemYap("isDuzenle")){toast("İş emrini düzenleme yetkiniz yok.");return}iAc(e)}
    else if(a==="gecmis")hrkAc(e);
    else if(a==="geri"&&i>0){if(!islemYap("geriAl")){toast("Geri alma yetkiniz yok.");return}const up={};up["isEmirleri/"+e.id+"/asama"]=o[i-1];hrkEk(up,e.id,{tur:"geri",kimden:e.asama,kime:o[i-1]});await db.ref().update(up)}
    else if(a==="del"){if(!(isAdmin()||(islemYap("isSil")&&e.ekleyenUid===user.uid))){toast("Silme yetkiniz yok.");return}if(confirm(e.no+" silinsin mi?"))await silCop("isEmirleri",e.id,e.no||"İş emri",isAdmin()?["isHareket/"+e.id,"etiketGecmis/"+e.id]:[])}
    else if(a==="ileri"&&i>=0&&i<o.length-1){
      if(!asamaYap(e.asama)){toast("Bu aşamayı ilerletme yetkiniz yok.");return}
      if(e.asama==="etiket"){etiketIleri(e);return}else if(e.asama==="depo"){depoAc(e);return}else{
        const s=prompt("Bu aşamada çıkan kg (boş bırakılabilir):","");if(s===null)return;
        const kg=parseFloat(s.replace(",","."));
        const up={};up["isEmirleri/"+e.id+"/asama"]=o[i+1];up["isEmirleri/"+e.id+"/log/"+e.asama]={kg:isNaN(kg)?null:kg,kim:ad(),zaman:TS};
        hrkEk(up,e.id,{tur:"ileri",kimden:e.asama,kime:o[i+1],kg:isNaN(kg)?null:kg});await db.ref().update(up);
      }
    }
  }catch(err){toast(errText(err))}
};
$("iList").onclick=isAksiyon;$("uList").onclick=isAksiyon;
/* ===================== QR: etiketteki iş emri QR'ı → iş emrini aç ===================== */
var qrCache={},qrAcikId=null,qrRef=null,qrBekle=(function(){
  var v=null;try{v=new URLSearchParams(location.search).get("is")}catch(e){}
  try{if(v)sessionStorage.setItem("qrIs",v);else v=sessionStorage.getItem("qrIs")}catch(e){}
  try{if(location.search)history.replaceState(null,"",location.pathname+location.hash)}catch(e){}
  return v||null})();
function isBulId(id){return isE.find(x=>x.id===id)||qrCache[id]||null}
/* QR içeriği: tam adres (?is=MG-0945) ya da düz seri no */
function qrNo(t){t=String(t==null?"":t).trim();if(!t)return"";
  try{const u=new URL(t),v=u.searchParams.get("is");if(v)return v.trim().slice(0,60)}catch(e){}
  const m=t.match(/[?&]is=([^&#\s]+)/);if(m){try{return decodeURIComponent(m[1]).trim().slice(0,60)}catch(e){return m[1].slice(0,60)}}
  return t.slice(0,60)}
function qrBasla(){if(!qrBekle)return;const n=qrBekle;qrBekle=null;try{sessionStorage.removeItem("qrIs")}catch(e){}qrIsle(n)}
async function qrIsle(txt){
  if(!isVeriGor()){toast("İş emirlerine erişim yetkiniz yok.");return}
  const no=qrNo(txt);if(!no){toast("QR içinde iş emri numarası bulunamadı.");return}
  menuOk=true;modSec(modGor("is")?"is":"uretim");show("vApp");window.scrollTo(0,0);
  const lo=no.toLowerCase();
  let e=isE.find(x=>String(x.no||"").toLowerCase()===lo||x.id===no);
  if(!e){
    toast("🔎 "+no+" aranıyor...");
    try{
      for(const k of [...new Set([no,no.toUpperCase()])]){
        const s=await db.ref("isEmirleri").orderByChild("no").equalTo(k).limitToFirst(1).once("value"),v=s.val();
        if(v){const id=Object.keys(v)[0];e=Object.assign({id},v[id]);break}
      }
    }catch(err){toast("Arama hatası: "+errText(err));return}
  }
  if(!e){toast("İş emri bulunamadı: "+no);return}
  qrAc(e)}
function qrAc(e){
  qrDurdur();qrAcikId=e.id;qrCache[e.id]=e;
  qrRef=db.ref("isEmirleri/"+e.id);
  qrRef.on("value",s=>{const v=s.val();if(!v){qrCache[e.id]=null;delete qrCache[e.id];$("qrBody").innerHTML='<div class="empty">Bu iş emri silinmiş.</div>';return}
    qrCache[e.id]=Object.assign({id:e.id},v);qrCiz()},er=>toast("İş emri okunamadı: "+errText(er)));
  qrCiz();const d=$("qrDlg");if(!d.open)d.showModal()}
function qrDurdur(){if(qrRef){qrRef.off();qrRef=null}}
$("qrDlg").addEventListener("close",()=>{qrDurdur();qrAcikId=null});
function qrOzet(e){
  const o=asOrd(e),ad_=ASL[e.asama]||e.asama;let t="ok",m="";
  const u=urunler.find(x=>x.isEmriId===e.id);
  if(e.asama==="depo"){m="📦 <b>Depoya giriş bekliyor.</b> Aşağıdaki «Depoya girişi kaydet» ile kg ve paket sayısını girin."}
  else if(e.asama==="bitti"&&e.bekleAktar&&!e.aktarildi){m="✅ <b>Depoya girdi.</b> Sevkiyata hazır ürünlere aktarılması bekleniyor."}
  else if(e.asama==="bitti"||e.aktarildi){
    if(u){const L={hazir:"Sevke hazır",sevk_edilecek:"Sevk edilecekler listesinde",sevk_edildi:"Sevk edildi"+(u.teslimEden?" ("+esc(u.teslimEden)+")":"")}[u.durum]||esc(u.durum);
      m="🚚 <b>"+L+".</b> "+fmt(u.kg)+" kg · "+fmt(u.paket)+" paket"+(modGor("sevk")?`<button class="btn b7" style="margin-top:8px;padding:12px;font-size:17px" type="button" data-qr="sevk">🚚 Sevkiyatta göster</button>`:"")}
    else{t="warn";m="⚠️ Hazır ürünler listesinde bu iş emrine ait kayıt görünmüyor (sevk edilip dosyalanmış olabilir)."}}
  else{t="warn";m="⚠️ <b>Bu iş emri henüz «"+esc(ad_)+"» aşamasında.</b> Depoya giriş / sevk için hazır değil. Yanlış etiket ya da erken gelen ürün olabilir, kontrol edin."}
  const col=t==="ok"?"background:#ecfdf5;border:1.5px solid #6ee7b7;color:#065f46":"background:#fef2f2;border:1.5px solid #fca5a5;color:#991b1b";
  const c=icols(e),top=c.reduce((a,x)=>a+(+x.kg||0),0);
  return `<div style="border:2px solid #0f172a;border-radius:10px;padding:10px;margin-bottom:8px">
    <div style="font-size:29px;font-weight:900;letter-spacing:.5px">${esc(e.no)}</div>
    <div style="font-size:19px;font-weight:800;margin-top:2px">${esc(e.musteri||"-")}${e.isAdi?" · "+esc(e.isAdi):""}</div>
    <div class="sub" style="font-size:16px;color:#0f172a">${esc(e.stok||"")}${top?" · sipariş "+esc(fmt(top))+" kg":""}</div></div>
    <div style="${col};border-radius:10px;padding:10px;margin-bottom:8px;font-size:16px">${m}</div>`}
function qrCiz(){const e=qrCache[qrAcikId];if(!e)return;$("qrBody").innerHTML=qrOzet(e)+isKart(e)}
$("qrBody").onclick=ev=>{
  const q=ev.target.closest("button[data-qr]");
  if(q){const e=qrCache[qrAcikId];if(!e)return;
    if(q.dataset.qr==="sevk"){const u=urunler.find(x=>x.isEmriId===e.id);if(!u)return;
      $("qrDlg").close();modSec("sevk");tab=u.durum;
      document.querySelectorAll("#tabs button").forEach(b=>b.className=b.dataset.t===tab?{hazir:"a1",sevk_edilecek:"a2",sevk_edildi:"a3"}[tab]:"");
      $("q").value=e.no;listele();window.scrollTo({top:0,behavior:"smooth"})}
    return}
  isAksiyon(ev)};
$("qrKapat").onclick=()=>$("qrDlg").close();
$("qrYeni").onclick=()=>{$("qrDlg").close();qrTaraAc()};
/* ---- Kamera ile okutma (BarcodeDetector); desteklenmezse telefonun kendi kamerası / yazarak giriş ---- */
var qrS={stream:null,timer:null,det:null,busy:false};
function qrTaraDur(){clearInterval(qrS.timer);qrS.timer=null;if(qrS.stream){qrS.stream.getTracks().forEach(t=>t.stop());qrS.stream=null}try{$("qtV").srcObject=null}catch(e){}}
async function qrTaraAc(){
  const d=$("qrTara");$("qtE").textContent="";$("qtM").value="";$("qtV").classList.remove("hide");if(!d.open)d.showModal();
  if(!("BarcodeDetector" in window)||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    $("qtV").classList.add("hide");
    $("qtE").textContent="Bu tarayıcı uygulama içinden QR okutmayı desteklemiyor. Telefonun kendi kamerasıyla etiketi okutun (bağlantı doğrudan açılır) ya da seri no yazın.";$("qtM").focus();return}
  try{
    qrS.det=new BarcodeDetector({formats:["qr_code"]});
    qrS.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1920},height:{ideal:1080}},audio:false});
    try{const tr=qrS.stream.getVideoTracks()[0],cp=tr.getCapabilities?tr.getCapabilities():{};if(cp.focusMode&&cp.focusMode.includes("continuous"))await tr.applyConstraints({advanced:[{focusMode:"continuous"}]})}catch(e){}
    const v=$("qtV");v.srcObject=qrS.stream;await v.play();
    qrS.timer=setInterval(async()=>{if(qrS.busy)return;qrS.busy=true;
      try{const r=await qrS.det.detect(v);if(r.length&&r[0].rawValue){const t=r[0].rawValue;qrTaraDur();d.close();if(navigator.vibrate)navigator.vibrate(60);qrIsle(t)}}catch(e){}
      qrS.busy=false},150);
  }catch(err){$("qtV").classList.add("hide");$("qtE").textContent="Kamera açılamadı ("+(err&&err.name==="NotAllowedError"?"izin verilmedi":"kullanılamıyor")+"). Seri no yazarak açabilirsiniz.";$("qtM").focus()}}
$("qrTara").addEventListener("close",qrTaraDur);
$("qtX").onclick=()=>$("qrTara").close();
const qtGit=()=>{const t=$("qtM").value;if(!qrNo(t)){$("qtE").textContent="Seri no yazın.";return}$("qrTara").close();qrIsle(t)};
$("qtOk").onclick=qtGit;$("qtM").addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();qtGit()}});
$("mQr").onclick=qrTaraAc;
/* ---- Geçmiş penceresi ---- */
async function hrkAc(e){
  $("hkT").textContent="🕘 "+e.no+" — hareket geçmişi";$("hkL").innerHTML='<p class="mut">Yükleniyor...</p>';$("hkDlg").showModal();
  let L=[];
  try{const s=await db.ref("isHareket/"+e.id).once("value"),v=s.val()||{};L=Object.keys(v).map(k=>v[k])}
  catch(er){$("hkL").innerHTML='<p class="err">'+esc(errText(er))+' (Firebase kurallarına isHareket eklendi mi?)</p>';return}
  /* Geçmiş özelliğinden önceki kayıtlar: mevcut verilerden tamamla */
  if(!L.some(x=>x.tur==="olustur")&&e.eklenmeTarihi)L.push({tur:"olustur",kim:e.ekleyen,zaman:e.eklenmeTarihi,kime:"etiket",eski:1});
  if(!L.some(x=>x.tur==="ileri")){const o=asOrd(e);Object.entries(e.log||{}).forEach(([k,v])=>{const j=o.indexOf(k);L.push({tur:"ileri",kimden:k,kime:o[j+1]||"",kg:v.kg,paket:v.paket,kim:v.kim,zaman:v.zaman,eski:1})})}
  if(e.aktarildi&&!L.some(x=>x.tur==="aktar"))L.push({tur:"aktar",zaman:e.aktarTarih,kim:"",eski:1});
  L.sort((a,b)=>(a.zaman||0)-(b.zaman||0));
  $("hkL").innerHTML=L.length?L.map(x=>{
    const gec=x.kimden||x.kime?`<div class="sub">${x.kimden?esc(ASL[x.kimden]||x.kimden):""}${x.kimden&&x.kime?" → ":""}${x.kime?esc(ASL[x.kime]||x.kime):""}</div>`:"";
    const ek=[x.kg!=null?fmt(x.kg)+" kg":"",x.paket?fmt(x.paket)+" paket":"",x.adet?x.adet+" etiket":""].filter(Boolean).join(" · ");
    return `<div class="item" style="padding:8px 10px;margin-bottom:6px"><b style="font-size:16px">${esc(HT[x.tur]||x.tur)}</b>${gec}${ek?`<div class="sub">${esc(ek)}</div>`:""}<div class="who">${esc(x.kim||"—")} · ${x.zaman?esc(new Date(x.zaman).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})):"tarih yok"}${x.eski?" · <i>eski kayıt</i>":""}</div></div>`}).join(""):'<p class="mut">Henüz hareket yok.</p>';
}
$("hkNo").onclick=()=>$("hkDlg").close();
var depoE=null;
function depoAc(e){
  depoE=e;const C=icols(e);$("dpT").textContent=e.no+" — depoya giriş";$("dpE").textContent="";
  $("dpRows").innerHTML=(C.length?C:[{}]).map((c,i)=>`<div style="border:1.5px solid #e2e8f0;border-radius:8px;padding:8px;margin-bottom:8px"><b style="font-size:16px">${esc([i+1,c.en,c.boy].filter(v=>v!==undefined&&v!==null&&String(v).trim()!=="").join(" - "))}${c.kg?" · sipariş "+esc(fmt(c.kg))+" kg":""}</b><div class="grid" style="margin-top:6px"><input data-i="${i}" data-f="kg" type="number" inputmode="decimal" min="0" step="any" placeholder="Kg"><input data-i="${i}" data-f="paket" type="number" inputmode="numeric" min="0" step="1" placeholder="Paket / koli"></div></div>`).join("");
  $("dDepo").showModal();
}
$("dpNo").onclick=()=>$("dDepo").close();
$("dpOk").onclick=async()=>{
  const e=depoE;if(!e)return;const n=Math.max(icols(e).length,1),K=[];let tk=0,tp=0;
  const v=(i,f)=>$("dpRows").querySelector(`[data-i="${i}"][data-f="${f}"]`).value;
  for(let i=0;i<n;i++){const kg=parseFloat(String(v(i,"kg")).replace(",","."))||0,pk=parseInt(v(i,"paket"))||0;
    if(kg<0||pk<0){$("dpE").textContent="Değerler 0 veya daha büyük olmalı.";return}
    K.push({kg,paket:pk});tk+=kg;tp+=pk}
  if(tk<=0&&tp<=0){$("dpE").textContent="En az bir sütuna kg veya paket yazın.";return}
  $("dpOk").disabled=true;
  try{
    const TSd=firebase.database.ServerValue.TIMESTAMP,up={},tkr=Math.round(tk*1000)/1000;
    up["isEmirleri/"+e.id+"/asama"]="bitti";up["isEmirleri/"+e.id+"/bekleAktar"]=true;
    up["isEmirleri/"+e.id+"/log/depo"]={kg:tkr,paket:tp,kalem:K,kim:ad(),zaman:TSd};
    hrkEk(up,e.id,{tur:"ileri",kimden:"depo",kime:"bitti",kg:tkr,paket:tp});
    await db.ref().update(up);
    $("dDepo").close();toast("✓ BİTEN'e alındı. Hazır ürünlere aktarmak için butona bas.");
    waOner("✅ Üretim bitti","✅ *"+e.no+" üretimi bitti — depoya girdi*\nMüşteri: "+(e.musteri||"-")+"\nToplam: "+fmt(tkr)+" kg · "+fmt(tp)+" paket");
  }catch(err){$("dpE").textContent=errText(err)}
  $("dpOk").disabled=false;
};
/* Önceki iş emrinden sonraki seri no: MG-0945 -> MG-0946 */
function iNext(){
  const son=isE[0]&&isE[0].no;const m=son&&String(son).match(/^(.*?)(\d+)$/);if(!m)return"";
  let n=+m[2];const mk=x=>m[1]+String(x).padStart(m[2].length,"0");
  while(isE.some(x=>x.no===mk(n+1)))n++;return mk(n+1);
}
/* Geçmiş girişlerden öneri listeleri (yazdıkça filtrelenir) */
function iDL(){
  const uniq=a=>{const s=new Set(),o=[];a.forEach(v=>{v=String(v==null?"":v).trim();const k=v.toLowerCase();if(v&&!s.has(k)){s.add(k);o.push(v)}});return o};
  const mk=(f,a)=>`<datalist id="dl_${f}">${a.map(v=>`<option value="${esc(v)}">`).join("")}</datalist>`;
  const top=["musteri","isAdi","stok","fx","formul","urunAdi","renk"],col=["en","mikron","korona","boy"];
  $("iDL").innerHTML=top.map(f=>mk(f,uniq(isE.map(e=>e[f])))).concat(col.map(f=>mk(f,uniq(isE.flatMap(e=>icols(e).map(c=>c[f])))))).join("");
  [["iMu","musteri"],["iAdi","isAdi"],["iSt","stok"],["iFx","fx"],["iFo","formul"],["iBU","urunAdi"],["iRenk","renk"]].forEach(([i,f])=>$(i).setAttribute("list","dl_"+f));
}
/* ===== Notlar: madde madde ===== */
const notL=t=>String(t==null?"":t).split("\n").map(x=>x.trim().replace(/^•\s*/,"")).filter(Boolean);
const notHtml=t=>{const a=notL(t);return a.length>1?"<br>"+a.map(x=>"• "+esc(x)).join("<br>"):esc(a[0]||"")};
const notP=t=>{const a=notL(t);return a.length>1?'<div style="text-align:left">'+a.map(x=>"• "+esc(x)).join("<br>")+"</div>":esc(a[0]||"-")};
function notRow(el,val,ph){
  const r=document.createElement("div");r.style.cssText="display:flex;gap:6px;margin-bottom:4px";
  const i=document.createElement("input");i.type="text";i.value=val||"";i.maxLength=200;i.placeholder=ph||"Madde";i.style.cssText="flex:1;min-width:0";
  const x=document.createElement("button");x.type="button";x.textContent="✖";x.setAttribute("aria-label","Maddeyi kaldır");x.style.cssText="width:36px;border:0;border-radius:8px;background:#e71d36;color:#fff;font-weight:900;cursor:pointer";
  x.onclick=()=>{if(el.querySelectorAll("input").length>1)r.remove();else i.value=""};
  i.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();const n=notRow(el,"");n.querySelector("input").focus()}};
  r.append(i,x);el.insertBefore(r,el.querySelector(".nadd"));return r;
}
function notSet(id,txt){
  const el=$(id),a=notL(txt);el.innerHTML="";
  const b=document.createElement("button");b.type="button";b.className="btn b6 nadd";b.textContent="+ Madde ekle";b.style.cssText="padding:6px;margin-bottom:4px";
  b.onclick=()=>notRow(el,"").querySelector("input").focus();el.appendChild(b);
  (a.length?a:[""]).forEach((v,k)=>notRow(el,v,k===0?el.dataset.ph:"Madde"));
}
const notGet=id=>[...$(id).querySelectorAll("input")].map(i=>i.value.trim()).filter(Boolean).join("\n");
/* ===== YAZDIRMA: A4 yatay, yan yana 2 adet üretim iş takip formu ===== */
function isForm(e,fy){
  const C=icols(e),L=e.log||{},bos=n=>{let r="";for(let i=0;i<n;i++)r+="<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>";return r};
  const satir=(k,ad)=>{if(k==="depo"){const R=(C.length?C:[{}]).map((c,i)=>`<tr><th>${esc([i+1,c.en,c.boy].filter(x=>x!==undefined&&x!==null&&String(x).trim()!=="").join(" - "))}</th><td></td><td></td></tr>`).join("");return `<tr><th>DEPO</th><td colspan="3" style="padding:0"><table class="pd"><tr><th>Ebat</th><th>Çıkan Kg</th><th>Paket Sayısı</th></tr>${R}</table></td></tr>`}const g=L[k]||{};return `<tr><th>${ad}</th><td></td><td></td><td></td></tr>`};
  const st=[["ekstruder","EKSTRUDER"]].concat(e.baskiVar?[["baski","BASKI"]]:[]).concat([["kesim","KESİM"],["depo","DEPO"]]);
  const cr=C.map((c,i)=>`<tr><td>${i+1}</td><td><b>${esc(fmt(c.kg))}</b></td><td>${esc(c.en||"")}</td><td>${esc(c.mikron||"")}</td><td>${esc(c.korona||"")}</td><td>${esc(c.boy||"")}</td></tr>`).join("");
  const U=v=>esc(v||"-"),X=i=>C[i]||null,k3=(fn,cl)=>[0,1,2].map(i=>`<td colspan="2" class="v">${fn(X(i),i)}</td>`).join(""),
    pair=(f,u)=>[0,1,2].map(i=>{const c=X(i),v=c&&c[f]?(f==="kg"?fmt(c.kg):c[f]):"";return `<td class="v">${v?esc(v):"-"}</td><td class="u">${u}</td>`}).join(""),
    fyT=fy&&e.fiyat>0?`${esc(e.fiyat.toLocaleString("tr-TR",{maximumFractionDigits:4}))} ${PB[e.paraBirimi]||"₺"} <small>${e.kdvDahil?"KDV DAHİL":"+ KDV"}</small>`:"",
    logo='<svg viewBox="0 0 60 30"><ellipse cx="30" cy="15" rx="28" ry="12" fill="none" stroke="#000" stroke-width="3"/><path d="M10 11L24 24L30 13L36 24L50 11" fill="none" stroke="#000" stroke-width="3.5"/></svg>';
  return `<div class="pf">
  <div class="hdr"><div class="lg">${logo}mag ambalaj</div><div class="snw"><div class="sn"><small>SERİ NO:</small><b>${esc(e.no||"")}</b></div>${e.no?`<div class="pq">${isQrSvg(e.no,1)}</div>`:""}</div></div>
  <div class="tt">ÜRETİM İŞ TAKİP FORMU</div>
  <table class="px top"><colgroup><col style="width:20%"><col style="width:42%"><col style="width:16%"><col style="width:22%"></colgroup>
  <tr><th>MÜŞTERİ :</th><td class="v">${U(e.musteri)}</td><th>SP.<br>TARİHİ:</th><td class="v" style="white-space:nowrap">${esc(trDate(e.spTarih))}</td></tr>
  <tr><th>İŞİN ADI :</th><td class="v">${U(e.isAdi)}</td>${fy?`<th>F/X :</th><td class="v">${U(e.fx)}</td>`:`<th></th><td class="v"></td>`}</tr>
  ${fyT?`<tr><th rowspan="2">STOK ADI :</th><td class="v" rowspan="2">${U(e.stok)}</td><th>FİYAT :</th><td class="v">${fyT}</td></tr><tr><th>KLİŞE :</th><td class="v">-</td></tr>`:`<tr><th>STOK ADI :</th><td class="v">${U(e.stok)}</td><th>SP.<br>NO:</th><td class="v">-</td></tr>`}
  </table>
  <table class="px"><colgroup><col style="width:20%">${'<col style="width:21%"><col style="width:6%">'.repeat(3)}</colgroup>
  <tr><th>SİPARİŞ<br>MİKTARI :</th>${pair("kg","Kg")}</tr>
  <tr><th>ÜRÜN<br>FORMÜLÜ :</th><td class="v" colspan="6" style="font-size:calc(15pt*var(--z)*var(--fk))">${U(e.formul)}</td></tr>
  <tr><th>EN :</th>${k3(c=>c&&c.en?esc(c.en):"-")}</tr>
  <tr><th>MİKRON :</th>${pair("mikron","µ")}</tr>
  <tr><th>KORONA :</th>${k3(c=>c&&c.korona?esc(c.korona):"-")}</tr>
  <tr><th>NOT :</th><td class="v n" colspan="6">${notP(e.notU)}</td></tr>
  <tr><th class="hd" colspan="7">BASKI - KESİM İŞ TAKİP FORMU</th></tr>
  <tr><th>ÜRÜN ADI :</th>${k3(c=>c?U(e.urunAdi):"-")}</tr>
  <tr><th>BOY/KAZAN :</th>${k3(c=>c&&c.boy?esc(c.boy):"-")}</tr>
  <tr><th>BASKI RENGİ :</th>${k3((c,i)=>i===0?U(e.renk):"-")}</tr>
  <tr><th>NOT :</th><td class="v n" colspan="6" style="height:calc(14mm*var(--z))">${notP(e.notB)}</td></tr>
  </table>
  </div>`;
}
function isYazdir(e){
  const h=isForm(e),P=$("prn");
  P.innerHTML=`<div class="prow">${h}<div class="pcut"></div>${isForm(e,islemYap("fiyat"))}</div>`;
  /* Sayfaya sığan en büyük yazı boyutunu bul (ekranda ölç, sonra yazdır) */
  P.classList.add("meas");
  const f=P.querySelector(".pf:last-child"),hedef=198*96/25.4;
  /* Yazı en büyükten küçülterek: hem yükseklik hem genişlik sayfaya sığana kadar (QR sabit 22 mm) */
  const tasar=()=>f.offsetHeight>hedef||[...f.querySelectorAll("td,.hdr")].some(x=>x.scrollWidth>x.clientWidth+1);
  let z=3;P.style.setProperty("--z",z);
  while(tasar()&&z>0.5){z=Math.round((z-0.02)*100)/100;P.style.setProperty("--z",z)}
  /* Kalan dikey boşluğu tablo satırlarına eşit dağıt: form sayfayı tam doldursun */
  const bos=hedef-f.offsetHeight,tr=[...P.querySelectorAll(".pf .px tr")];
  if(bos>4&&tr.length){const ek=bos/tr.length;P.querySelectorAll(".pf").forEach(pf=>{const r=[...pf.querySelectorAll(".px tr")];r.forEach(x=>x.style.height=(x.offsetHeight+ek)+"px")});
    if(f.offsetHeight>hedef)tr.forEach(x=>x.style.height="")}
  P.classList.remove("meas");
  const t=document.title;document.title=(e.no||"is-emri")+" - iş takip formu";
  window.onafterprint=()=>{document.title=t;P.innerHTML=""};
  setTimeout(()=>window.print(),150);
}
const canIsAc=()=>!!rec&&(rec.yonetici===true||islemYap("isAc")); /* adım 1: tablodan okunur, sonuç eskisiyle aynı */
const PB={TRY:"₺",USD:"$",EUR:"€"};
function iAc(e){
  iEdit=e||null;const v=e||{},C=e?icols(e):[];$("iT").textContent=e?"İş emrini düzenle":"Yeni iş emri";$("iGet").style.display=e?"none":"";$("iE").textContent="";
  [["iNo","no"],["iMu","musteri"],["iAdi","isAdi"],["iSt","stok"],["iFx","fx"],["iFo","formul"],["iBU","urunAdi"],["iRenk","renk"]].forEach(([i,f])=>$(i).value=v[f]||"");
  notSet("iNtU",v.notU);notSet("iNtB",v.notB);
  if(!e)$("iNo").value=iNext();iDL();
  $("iTr").value=v.spTarih||bugun();$("iBv").checked=!!v.baskiVar;
  $("iFyW").classList.toggle("hide",!islemYap("fiyat"));$("iFyL").textContent=islemYap("fiyat")?"FİYAT :":"";$("iPb").value=PB[v.paraBirimi]?v.paraBirimi:"TRY";$("iFy").value=v.fiyat!=null?String(v.fiyat).replace(".",","):"";
  {const sx=$("iFx");[...sx.options].forEach(o=>{if(o.dataset.ek)o.remove()});
   if(v.fx&&v.fx!=="X-PEŞİN"&&v.fx!=="F-PEŞİN"){const o=document.createElement("option");o.value=o.textContent=v.fx;o.dataset.ek="1";sx.appendChild(o)}
   sx.value=v.fx||"X-PEŞİN";
   $("iKd").checked=v.fiyat!=null?!v.kdvDahil:sx.value==="F-PEŞİN"}
  document.querySelectorAll("#iCols [data-c]").forEach(i=>{const c=C[+i.dataset.c]||{};i.value=c[i.dataset.f]??""});
  iQrGuncelle();$("iDlg").showModal();
}
$("iAdd").onclick=()=>{if(!canIsAc())return toast("Yeni iş emrini sadece muhasebe, depo görevlisi ve yönetici açabilir.");iAc(null)};
$("iNo2").onclick=()=>$("iDlg").close();
$("iFx").onchange=()=>{$("iKd").checked=$("iFx").value==="F-PEŞİN"};
$("iOk").onclick=async()=>{
  const err=m=>{$("iE").textContent=m},g=id=>$(id).value.trim(),no=g("iNo").toUpperCase();
  if(!no)return err("Seri no gerekli (örn: MG-0945).");
  if(!g("iMu"))return err("Müşteri adı gerekli.");
  const S=[];[0,1,2].forEach(n=>{const c={};document.querySelectorAll(`#iCols [data-c="${n}"]`).forEach(i=>c[i.dataset.f]=i.value.trim());c.kg=parseFloat(c.kg)||0;if(c.kg>0||c.en)S.push(c)});
  if(!S.length)return err("En az bir ebat için kg veya en girin.");
  if((!iEdit||iEdit.no!==no)&&isE.some(x=>x.no===no))return err("Bu seri no zaten kayıtlı.");
  const d={no,musteri:g("iMu"),isAdi:g("iAdi"),stok:g("iSt"),fx:g("iFx"),spTarih:g("iTr"),formul:g("iFo"),notU:notGet("iNtU"),baskiVar:$("iBv").checked,urunAdi:g("iBU"),renk:g("iRenk"),notB:notGet("iNtB"),siparis:S};
  if(islemYap("fiyat")){const fy=parseFloat(g("iFy").replace(",","."));d.fiyat=fy>0?fy:null;d.kdvDahil=!$("iKd").checked;d.paraBirimi=$("iPb").value}
  $("iOk").disabled=true;let woMsg=null;
  try{
    if(iEdit){d.duzenleyen=ad();if(!d.baskiVar&&iEdit.asama==="baski")d.asama="kesim";
      const up={};Object.keys(d).forEach(k=>{up["isEmirleri/"+iEdit.id+"/"+k]=d[k]});
      hrkEk(up,iEdit.id,d.asama?{tur:"duzenle",kimden:iEdit.asama,kime:d.asama}:{tur:"duzenle"});await db.ref().update(up)}
    else{Object.assign(d,{asama:"etiket",ekleyen:ad(),ekleyenUid:user.uid,eklenmeTarihi:firebase.database.ServerValue.TIMESTAMP});
      const nk=db.ref("isEmirleri").push().key,up={};up["isEmirleri/"+nk]=d;hrkEk(up,nk,{tur:"olustur",kime:"etiket"});await db.ref().update(up);
      woMsg=["🆕 Yeni iş emri "+no,"🆕 *Yeni iş emri "+no+"*\nMüşteri: "+d.musteri+(d.isAdi?"\nİş: "+d.isAdi:"")+(d.stok?"\nStok: "+d.stok:"")+"\nMiktar: "+fmt(S.reduce((a,c)=>a+c.kg,0))+" kg"+(d.baskiVar?"\n🖨️ Baskılı":"")]}
    $("iDlg").close();toast("İş emri kaydedildi");if(woMsg)waOner(woMsg[0],woMsg[1]);
  }catch(e){err(errText(e))}
  $("iOk").disabled=false;
};

/* ===== İŞ EMRİ QR: seri no'dan otomatik üretilir (okutunca iş emri açılır) ===== */
function isQrNo(no){return String(no==null?"":no).trim().toUpperCase()}
function isQrUrl(no){return location.href.split(/[?#]/)[0].replace(/index\.html$/,"")+"?is="+encodeURIComponent(isQrNo(no))}
function isQrMat(no){const q=new window.QRLib(-1,0);q.addData(isQrUrl(no));q.make();return q}
function isQrSvg(no,mg){no=isQrNo(no);if(!no)return"";
  const q=isQrMat(no),n=q.getModuleCount(),m=mg||2;let d="";
  for(let r=0;r<n;r++){let c=0;while(c<n){if(q.isDark(r,c)){const b=c;while(c<n&&q.isDark(r,c))c++;d+="M"+(b+m)+" "+(r+m)+"h"+(c-b)+"v1h-"+(c-b)+"z"}else c++}}
  const z=n+2*m;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+z+' '+z+'" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet"><rect width="'+z+'" height="'+z+'" fill="#fff"/><path d="'+d+'" fill="#000"/></svg>'}
function isQrPng(no){no=isQrNo(no);if(!no)return;
  const q=isQrMat(no),n=q.getModuleCount(),m=4,s=Math.max(4,Math.floor(600/(n+2*m))),z=(n+2*m)*s,cv=document.createElement("canvas");
  cv.width=cv.height=z;const cx=cv.getContext("2d");cx.fillStyle="#fff";cx.fillRect(0,0,z,z);cx.fillStyle="#000";
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))cx.fillRect((c+m)*s,(r+m)*s,s,s);
  cv.toBlob(b=>{if(!b)return toast("QR görseli oluşturulamadı.");const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="QR-"+no.replace(/[^A-Z0-9_-]/g,"_")+".png";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)},"image/png")}
function iQrGuncelle(){
  const no=isQrNo($("iNo").value),w=$("iQrW");
  if(!no){w.style.display="none";$("iQrS").innerHTML="";return}
  try{$("iQrS").innerHTML=isQrSvg(no);w.style.display="flex"}catch(e){w.style.display="none"}}
var iqNo="";
function iqAc(no){no=isQrNo(no);if(!no)return toast("Önce seri no yazın.");
  try{$("iqS").innerHTML=isQrSvg(no)}catch(e){return toast("QR oluşturulamadı.")}
  iqNo=no;$("iqN").textContent=no;$("iqDlg").showModal()}
$("iNo").addEventListener("input",iQrGuncelle);
$("iQrBtn").onclick=()=>iqAc($("iNo").value);
$("iqP").onclick=()=>isQrPng(iqNo);
$("iqX").onclick=()=>$("iqDlg").close();

/* ================= BİLDİRİMLER + WHATSAPP ================= */
var bRef=null,bIs=[],bGor={O:[],S:[]},bStok=false,bTm=null;
const bAyar=()=>{try{return{tel:localStorage.bildTel||"",oner:localStorage.bildOner!=="0",son:+localStorage.bildSon||0}}catch(e){return{tel:"",oner:true,son:0}}};
const bYaz=(k,v)=>{try{localStorage[k]=v}catch(e){}};
function waTel(t){let d=String(t||"").replace(/\D/g,"");if(d.startsWith("00"))d=d.slice(2);
  if(d.length===11&&d[0]==="0")d="9"+d;else if(d.length===10&&d[0]==="5")d="90"+d;return d}
const waUrl=m=>"https://wa.me/"+waTel(bAyar().tel)+"?text="+encodeURIComponent(m);
const mevTxt=k=>{const n=norm(k);return UN.filter(([u])=>u in n.mik).map(([u,l])=>fmt(n.mik[u])+" "+l).join(" + ")};
function stokWa(L){return "⚠️ *Stok uyarısı*\n"+L.map(k=>"• "+(k.ad||"-")+(k.ebat?" ("+k.ebat+")":"")+": "+mevTxt(k)+" — "+(dur(k)==="no"?"TÜKENDİ":"azalıyor")).join("\n")}
function bildDurdur(){if(window.etAyarDurdur)window.etAyarDurdur();if(window.talDurdur)window.talDurdur();if(window.tahDurdur)window.tahDurdur();if(bRef){bRef.off();bRef=null}if(bTm){clearInterval(bTm);bTm=null}bIs=[];bStok=false;bRozet()}
function bildBaslat(){bildDurdur();if(window.etAyarBaslat)window.etAyarBaslat();if(window.talBaslat)window.talBaslat();if(window.tahBaslat)window.tahBaslat();if(!bAyar().son)bYaz("bildSon",Date.now());
  bRef=db.ref("isEmirleri").orderByChild("eklenmeTarihi").limitToLast(30);
  bRef.on("value",s=>{const v=s.val()||{};bIs=Object.keys(v).map(k=>Object.assign({id:k},v[k]));bRozet()},()=>{});
  bTm=setInterval(bRozet,20000)}
function bOlaylar(){
  const son=bAyar().son,me=user&&user.uid,adm=ad(),O=[],kgS=e=>{const t=icols(e).reduce((a,c)=>a+(+c.kg||0),0);return t?"\nMiktar: "+fmt(t)+" kg":""};
  bIs.forEach(e=>{
    if(+e.eklenmeTarihi>son&&e.ekleyenUid!==me)O.push({ts:+e.eklenmeTarihi,ik:"🆕",b:"Yeni iş emri "+e.no,d:[e.musteri,e.isAdi].filter(Boolean).join(" · ")+(e.ekleyen?" — "+e.ekleyen:""),wa:"🆕 *Yeni iş emri "+e.no+"*\nMüşteri: "+(e.musteri||"-")+(e.isAdi?"\nİş: "+e.isAdi:"")+kgS(e)});
    Object.entries(e.log||{}).forEach(([k,v])=>{if(!v||!(+v.zaman>son)||v.kim===adm)return;const dp=k==="depo";
      O.push({ts:+v.zaman,ik:dp?"✅":"➡️",b:dp?e.no+" üretimi bitti":e.no+": "+(ASL[k]||k)+" tamamlandı",d:(e.musteri||"")+(v.kim?" — "+v.kim:""),
        wa:(dp?"✅ *"+e.no+" üretimi bitti — depoya girdi*":"➡️ *"+e.no+"*: "+(ASL[k]||k)+" tamamlandı")+"\nMüşteri: "+(e.musteri||"-")+(v.kg!=null?"\nKg: "+fmt(v.kg):"")+(dp&&v.paket?" · "+fmt(v.paket)+" paket":"")})})});
  urunler.forEach(u=>{if(u.durum==="hazir"&&+u.eklenmeTarihi>son&&u.ekleyenUid!==me){const ur=String(u.urun||"").split("\n")[0];
    O.push({ts:+u.eklenmeTarihi,ik:"📦",b:"Hazır ürün eklendi",d:[u.musteri,ur].filter(Boolean).join(" · ")+" — "+fmt(u.kg)+" kg"+(u.ekleyen?" — "+u.ekleyen:""),
      wa:"📦 *Sevke hazır*\nMüşteri: "+(u.musteri||"-")+(ur?"\nÜrün: "+ur:"")+"\nToplam: "+fmt(u.kg)+" kg · "+fmt(u.paket)+" adet"})}});
  return O}
function bRozet(){const b=$("bBellN");if(!b||!user)return;const n=bOlaylar().length;b.textContent=n>9?"9+":n;b.classList.toggle("hide",!n)}
const bZaman=t=>new Date(t).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
async function bAc(){
  $("bdL").innerHTML='<p class="mut">Yükleniyor...</p>';$("dBild").showModal();
  const A=bAyar();$("bdTel").value=A.tel;$("bdOner").checked=A.oner;
  /* Stok sadece Stok bölümü açıldığında yüklenir; burada gerekirse bir kez çekilir */
  if(!sKalem.length&&!bStok){bStok=true;try{const s=await db.ref("stokKalem").once("value"),v=s.val()||{};sKalem=Object.keys(v).map(k=>Object.assign({id:k},v[k]))}catch(e){}}
  const O=bOlaylar().sort((a,b)=>b.ts-a.ts),S=sKalem.filter(k=>dur(k)!=="ok").sort((a,b)=>(a.ad||"").localeCompare(b.ad||"","tr"));
  bGor={O,S};let h="";
  h+=O.length?`<div class="shd">YENİ GELİŞMELER (${O.length})</div>`+O.map((x,i)=>`<div class="item" style="padding:8px 10px;margin-bottom:6px"><b style="font-size:16px">${esc(x.ik+" "+x.b)}</b><div class="sub">${esc(x.d)}</div><div class="who">${esc(bZaman(x.ts))}</div><button class="btn b3 sm" data-w="${i}" style="width:auto;margin-top:4px">📲 WhatsApp</button></div>`).join(""):'<p class="mut" style="margin:4px 0">Son açışınızdan beri yeni bir gelişme yok.</p>';
  h+=S.length?`<div class="shd" style="margin-top:10px">⚠️ STOK DURUMU (${S.length})</div><div class="item" style="padding:8px 10px;margin-bottom:6px">`+S.map(k=>`<div class="sub"><b>${esc(k.ad||"-")}</b>${k.ebat?" · "+esc(k.ebat):""}: ${esc(mevTxt(k))} — ${dur(k)==="no"?"TÜKENDİ":"azalıyor"}</div>`).join("")+`<button class="btn b3 sm" data-w="stok" style="width:auto;margin-top:6px">📲 Stok listesini WhatsApp'a gönder</button></div>`:"";
  $("bdL").innerHTML=h;
  bYaz("bildSon",Math.max.apply(null,[Date.now()].concat(O.map(x=>x.ts))));bRozet();
}
$("bBell").onclick=bAc;
$("bdNo").onclick=()=>$("dBild").close();
$("bdL").onclick=e=>{const b=e.target.closest("button[data-w]");if(!b)return;const w=b.dataset.w;
  window.open(waUrl(w==="stok"?stokWa(bGor.S):bGor.O[+w].wa),"_blank")};
$("bdAll").onclick=()=>{const t=[];if(bGor.O.length)t.push(bGor.O.map(x=>x.ik+" "+x.b+(x.d?" — "+x.d:"")).join("\n"));if(bGor.S.length)t.push(stokWa(bGor.S));
  if(!t.length)return toast("Gönderilecek bildirim yok.");window.open(waUrl("📋 *MAG AMBALAJ — Özet*\n"+t.join("\n\n")),"_blank")};
$("bdTel").oninput=()=>bYaz("bildTel",$("bdTel").value.trim());
$("bdOner").onchange=()=>bYaz("bildOner",$("bdOner").checked?"1":"0");
/* İşlem sonrası tek dokunuşla WhatsApp önerisi (wa.me; mesaj düzenlenebilir) */
function waOner(b,m){if(!bAyar().oner)return;$("woT").textContent=b;$("woM").value=m;$("dWo").showModal()}
$("woGonder").onclick=()=>{window.open(waUrl($("woM").value),"_blank");$("dWo").close()};
$("woGec").onclick=()=>$("dWo").close();

formTemizle();modUyg();
