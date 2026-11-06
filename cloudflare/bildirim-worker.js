/* =====================================================================================
   MAG AMBALAJ — TELEFON BİLDİRİM SUNUCUSU (Cloudflare Worker, ücretsiz plan)  · v143
   -------------------------------------------------------------------------------------
   Ne yapar: Uygulama KAPALIYKEN de telefona bildirim gönderir (standart Web Push; Firebase
   Blaze / FCM gerekmez). Bu dosyanın TAMAMI Cloudflare > Worker > «Edit code» ekranına yapıştırılır.
   Gereken tek ayar: Worker'a «KV» adında bir KV namespace bağlamak (Settings > Bindings).
   Gizli anahtar girmeye gerek yok: bildirim imza anahtarları (VAPID) ilk çalışmada kendiliğinden
   üretilip KV'de saklanır.

   Uç noktalar (uygulama bildirim.js çağırır):
     GET  /          -> "çalışıyor" yazısı (kurulumu denemek için tarayıcıda açın)
     GET  /vapid     -> herkese açık imza anahtarı (telefon abone olurken kullanır)
     POST /konum     -> (v137) giriş yapmış kullanıcı; {u:[harita linkleri]} -> {konum:{link:{lat,lon}|null}} — sevkiyat rotası için
     GET  /kur       -> (v129) TCMB günlük kur (USD, EUR; döviz + efektif satış), 1 saat önbellekli — Adet & Maliyet bölümü kullanır
     POST /abone     -> bu telefonu kaydet   {sub, cihaz, kapat:[...]}       (Firebase giriş jetonu gerekir)
     POST /sil       -> bu telefonun kaydını sil {endpoint}                  (Firebase giriş jetonu gerekir)
     POST /gonder    -> bildirimi ilgili telefonlara gönder {kanallar:[...], b, m, ik, git, key, t}
     POST /sina      -> kendi telefonlarıma deneme bildirimi; yönetici {herkes:true} ile TÜM telefonlara
     POST /alindi    -> (giriş gerekmez) telefon bildirimi aldığında haber verir {endpoint, test}; «ulaştı» zamanı tutulur
     POST /liste     -> (yalnız yönetici) kimin kaç telefonu kayıtlı, son bildirim ne zaman ulaştı
     POST /sifre     -> (v134, yalnız yönetici) başka kullanıcının şifresini sıfırlar {uid, sifre}; eski oturumlarını kapatır.
                        Gizli değişken FB_SA = Firebase hizmet hesabı JSON'u (GitHub «Yönetim» → bildirim-yayinla koyar). Ücretli Cloud Functions GEREKMEZ.
   Güvenlik: her istekte Firebase giriş jetonu (ID token) Google'ın açık anahtarlarıyla doğrulanır;
   kişinin hangi kanalları alabileceği SUNUCUDA, kişinin kendi kullanıcı kaydı okunarak hesaplanır
   (uygulamadaki YETKI tablosu ve rules.json ile aynı mantık). Onaysız/engelli hesap gönderemez, alamaz.
   ===================================================================================== */
const PROJE = "sevkiyat-fc22b";
const DB_URL = "https://sevkiyat-fc22b-default-rtdb.firebaseio.com";
const IZINLI_SITELER = ["https://sevkiyat-fc22b.web.app", "https://sevkiyat-fc22b.firebaseapp.com", "https://xfranerx53.github.io"];
const VAPID_SUB = "mailto:xfranerxx@gmail.com";
const ASAMALAR = ["etiket", "ekstruder", "baski", "kesim", "depo"];
/* app.js YETKI tablosunun kopyası — rol/izin değişirse BURASI da güncellenir */
const YETKI = {
  "Depo Görevlisi":      { mod: ["is", "uretim", "stok", "sevk"], asama: ["etiket", "depo"] },
  "Sevkiyat Sorumlusu":  { mod: ["sevk"], asama: [] },
  "Ekstruder Operatörü": { mod: ["uretim"], asama: ["ekstruder"] },
  "Matbaa Operatörü":    { mod: ["uretim"], asama: ["baski"] },
  "Kesim Operatörü":     { mod: ["uretim"], asama: ["kesim"] },
  "Muhasebe":            { mod: ["is", "uretim", "stok", "rap", "tah", "granul"], asama: ["etiket"] }
};

/* ---------------- yardımcılar ---------------- */
const enc = new TextEncoder();
function b64u(buf) { const b = new Uint8Array(buf); let s = ""; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function b64uDec(s) { s = String(s).replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; const t = atob(s), o = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) o[i] = t.charCodeAt(i); return o; }
function birlestir(...p) { const n = p.reduce((a, x) => a + x.length, 0), o = new Uint8Array(n); let i = 0; for (const x of p) { o.set(x, i); i += x.length; } return o; }
async function hmac(anahtar, veri) { const k = await crypto.subtle.importKey("raw", anahtar, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return new Uint8Array(await crypto.subtle.sign("HMAC", k, veri)); }
function cors(origin) {
  const ok = IZINLI_SITELER.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || "");
  return { "Access-Control-Allow-Origin": ok ? origin : IZINLI_SITELER[0], "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Authorization,Content-Type", "Access-Control-Max-Age": "86400", "Vary": "Origin" };
}
function cevap(veri, durum, origin) { return new Response(typeof veri === "string" ? veri : JSON.stringify(veri), { status: durum || 200, headers: Object.assign({ "Content-Type": typeof veri === "string" ? "text/plain; charset=utf-8" : "application/json" }, cors(origin)) }); }

/* ---------------- Firebase giriş jetonu doğrulama ---------------- */
let JWKS = null, JWKS_T = 0;
async function anahtarlar() {
  if (JWKS && Date.now() - JWKS_T < 3600e3) return JWKS;
  const r = await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");
  if (!r.ok) throw new Error("Google anahtarları alınamadı");
  JWKS = (await r.json()).keys || []; JWKS_T = Date.now(); return JWKS;
}
async function jetonDogrula(jeton) {
  const p = String(jeton || "").split(".");
  if (p.length !== 3) throw new Error("jeton yok");
  const bas = JSON.parse(new TextDecoder().decode(b64uDec(p[0]))), yuk = JSON.parse(new TextDecoder().decode(b64uDec(p[1])));
  if (bas.alg !== "RS256") throw new Error("jeton türü");
  const jwk = (await anahtarlar()).find(k => k.kid === bas.kid);
  if (!jwk) { JWKS = null; throw new Error("jeton anahtarı bulunamadı"); }
  const k = await crypto.subtle.importKey("jwk", { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", ext: true }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", k, b64uDec(p[2]), enc.encode(p[0] + "." + p[1]));
  const simdi = Math.floor(Date.now() / 1000);
  if (!ok || yuk.aud !== PROJE || yuk.iss !== "https://securetoken.google.com/" + PROJE || !(yuk.exp > simdi) || yuk.iat > simdi + 300 || !yuk.sub) throw new Error("jeton geçersiz");
  return yuk.sub;
}
/* v134: Firebase hizmet hesabıyla Google erişim jetonu (yalnız /sifre için; 50 dk önbellek) */
let SA_JETON = null, SA_T = 0;
async function saJeton(env) {
  if (SA_JETON && Date.now() - SA_T < 50 * 60e3) return SA_JETON;
  const sa = JSON.parse(env.FB_SA), simdi = Math.floor(Date.now() / 1000);
  const pem = String(sa.private_key).replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const k = await crypto.subtle.importKey("pkcs8", b64uDec(pem.replace(/\+/g, "-").replace(/\//g, "_")), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const bas = b64u(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" }))), yuk = b64u(enc.encode(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/cloud-platform", aud: "https://oauth2.googleapis.com/token", iat: simdi, exp: simdi + 3600 })));
  const imza = b64u(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", k, enc.encode(bas + "." + yuk)));
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + bas + "." + yuk + "." + imza });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error("Google erişim jetonu alınamadı");
  SA_JETON = j.access_token; SA_T = Date.now(); return SA_JETON;
}
/* kişinin kendi kaydı, kendi jetonuyla okunur (rules: kullanicilar/$uid kendisi okuyabilir) */
async function kayitOku(uid, jeton) {
  const r = await fetch(DB_URL + "/kullanicilar/" + encodeURIComponent(uid) + ".json?auth=" + encodeURIComponent(jeton));
  if (!r.ok) throw new Error("kullanıcı kaydı okunamadı");
  return await r.json();
}
/* bildirim.js kanallarim() ve rules.json bildirim okuma kuralıyla AYNI */
function kanallar(uid, k) {
  if (!k || k.onay !== true) return [];
  if (k.yonetici === true) return ["u_" + uid, "genel", "yon", "sevk", "sor", "muh", "stok", "granul"].concat(ASAMALAR.map(a => "as_" + a));
  const y = YETKI[k.rol] || { mod: [], asama: [] }, iz = x => (k.izin && typeof k.izin[x] === "boolean") ? k.izin[x] : undefined;
  const mod = m => iz(m) !== undefined ? iz(m) : y.mod.includes(m);
  const K = ["u_" + uid, "genel"];
  ASAMALAR.forEach(a => { const v = iz("a_" + a); if (v !== undefined ? v : y.asama.includes(a)) K.push("as_" + a); });
  if (mod("sevk")) K.push("sevk");
  if (k.rol === "Sevkiyat Sorumlusu") K.push("sor");
  if (mod("tah")) K.push("muh");
  if (mod("stok")) K.push("stok");
  if (mod("granul")) K.push("granul");
  return K;
}

/* ---------------- VAPID anahtarları (KV'de, ilk seferde üretilir) ---------------- */
let VAPID = null;
async function vapid(env) {
  if (VAPID) return VAPID;
  let v = await env.KV.get("vapid", "json");
  if (!v) {
    const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    const jwk = await crypto.subtle.exportKey("jwk", kp.privateKey), raw = await crypto.subtle.exportKey("raw", kp.publicKey);
    v = { jwk, pub: b64u(raw) };
    await env.KV.put("vapid", JSON.stringify(v));
  }
  VAPID = { pub: v.pub, key: await crypto.subtle.importKey("jwk", v.jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]) };
  return VAPID;
}
async function vapidBaslik(env, endpoint) {
  const V = await vapid(env), u = new URL(endpoint);
  const bas = b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const yuk = b64u(enc.encode(JSON.stringify({ aud: u.protocol + "//" + u.host, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: VAPID_SUB })));
  const imza = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, V.key, enc.encode(bas + "." + yuk));
  return "vapid t=" + bas + "." + yuk + "." + b64u(imza) + ", k=" + V.pub;
}

/* ---------------- Web Push şifreleme (RFC 8291, aes128gcm) ---------------- */
/* sabit: test için (RFC 8291 Ek A örneğiyle doğrulandı); gerçek kullanımda boş -> rastgele */
async function sifrele(sub, metin, sabit) {
  sabit = sabit || {};
  const uaPub = b64uDec(sub.keys.p256dh), auth = b64uDec(sub.keys.auth);
  let asPriv, asPub;
  if (sabit.asPriv) {
    asPub = b64uDec(sabit.asPub);
    asPriv = await crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", d: sabit.asPriv, x: b64u(asPub.slice(1, 33)), y: b64u(asPub.slice(33, 65)), ext: true }, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
  } else {
    const kp = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    asPriv = kp.privateKey; asPub = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
  }
  const uaKey = await crypto.subtle.importKey("raw", uaPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, asPriv, 256));
  const salt = sabit.salt ? b64uDec(sabit.salt) : crypto.getRandomValues(new Uint8Array(16));
  const prkKey = await hmac(auth, ecdh);
  const ikm = await hmac(prkKey, birlestir(enc.encode("WebPush: info\0"), uaPub, asPub, new Uint8Array([1])));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, birlestir(enc.encode("Content-Encoding: aes128gcm\0"), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, birlestir(enc.encode("Content-Encoding: nonce\0"), new Uint8Array([1])))).slice(0, 12);
  const k = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const sif = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, k, birlestir(enc.encode(metin), new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]); /* 4096 */
  return birlestir(salt, rs, new Uint8Array([asPub.length]), asPub, sif);
}
async function pushGonder(env, sub, veri) {
  const govde = await sifrele(sub, JSON.stringify(veri));
  const r = await fetch(sub.endpoint, { method: "POST", body: govde, headers: { "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", "TTL": "86400", "Urgency": "high", "Authorization": await vapidBaslik(env, sub.endpoint) } });
  return r.status;
}

async function kisaAd(e) { const h = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(e))); return Array.from(h.slice(0, 10)).map(x => x.toString(16).padStart(2, "0")).join(""); }
/* ---------------- abone listesi: KV'de tek kayıt «abone» = {endpoint: {uid, sub, kanallar, kapat, cihaz, z}} ---------------- */
async function aboneOku(env) { return (await env.KV.get("abone", "json")) || {}; }
async function aboneYaz(env, A) { await env.KV.put("abone", JSON.stringify(A)); }
const gecerliSub = s => s && typeof s.endpoint === "string" && /^https:\/\//.test(s.endpoint) && s.endpoint.length < 1000 && s.keys && typeof s.keys.p256dh === "string" && typeof s.keys.auth === "string";

async function dagit(env, liste, veri, kok) {
  const A = await aboneOku(env); let silinecek = [], n = 0;
  if (kok) veri = Object.assign({ cb: kok }, veri); /* telefon «aldım» haberini buraya yollar */
  await Promise.all(liste.map(async e => {
    try { const d = await pushGonder(env, A[e].sub, veri); if (d === 404 || d === 410) silinecek.push(e); else if (d < 300) n++; } catch (x) { }
  }));
  if (silinecek.length) { const B = await aboneOku(env); silinecek.forEach(e => delete B[e]); await aboneYaz(env, B); }
  return n;
}

/* ---------------- TCMB kuru (v129) ---------------- */
function tcmbCoz(xml) {
  const t = (xml.match(/Tarih="([^"]+)"/) || [])[1] || "";
  const al = kod => { const m = xml.match(new RegExp('<Currency[^>]*Kod="' + kod + '"[\\s\\S]*?</Currency>')); if (!m) return null;
    const v = ad => { const x = m[0].match(new RegExp("<" + ad + ">([^<]*)</" + ad + ">")); const s = x ? x[1].trim() : ""; return s ? parseFloat(s.replace(",", ".")) : 0; };
    return { doviz: v("ForexSelling"), efektif: v("BanknoteSelling") || v("ForexSelling") }; };
  const USD = al("USD"), EUR = al("EUR");
  if (!USD || !EUR || !USD.doviz || !EUR.doviz) throw new Error("TCMB yanıtı çözülemedi");
  return { ok: true, tarih: t, USD, EUR };
}
async function tcmbKur(env) {
  const c = await env.KV.get("kur", "json");
  if (c && Date.now() - c.z < 3600e3) return c.v;
  try {
    const r = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", { headers: { "User-Agent": "Mozilla/5.0 (MAG AMBALAJ)" }, cf: { cacheTtl: 600 } });
    if (!r.ok) throw new Error("TCMB " + r.status);
    const v = tcmbCoz(await r.text());
    await env.KV.put("kur", JSON.stringify({ z: Date.now(), v }));
    return v;
  } catch (e) {
    if (c) return Object.assign({}, c.v, { eski: true });
    return { ok: false, hata: String(e.message || e) };
  }
}

/* ---------------- v137: 🗺 harita linkinden konum (sevkiyat rotası için) ----------------
   Telefondan paylaşılan kısa Google Maps linklerinde (maps.app.goo.gl/…) koordinat yazmaz. Bu uç nokta linki
   Google'a sorup yönlendirmeyi izler, sayfadaki pin koordinatını bulur. YALNIZ Google harita adresleri açılır.
   Sonuç KV'de 60 gün saklanır (bulunamazsa 1 gün). */
function koordBul(s) {
  s = String(s || "");
  try { s = decodeURIComponent(s); } catch (e) { }
  const ok = (a, b) => { const la = +a, lo = +b; return isFinite(la) && isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180 && (la || lo) ? { lat: la, lon: lo } : null; };
  let m = s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/); if (m) return ok(m[1], m[2]);
  m = s.match(/[?&](?:q|query|ll|destination|daddr|center|sll)=(?:loc:)?(-?\d{1,2}\.\d+)\s*(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i); if (m) return ok(m[1], m[2]);
  m = s.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/); if (m) return ok(m[1], m[2]);
  m = s.match(/\/(-?\d{1,2}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})(?:[\/?#]|$)/); if (m) return ok(m[1], m[2]);
  m = s.match(/^\s*(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})\s*$/); if (m) return ok(m[1], m[2]);
  return null;
}
const TRK = k => k && k.lat > 35.5 && k.lat < 42.3 && k.lon > 25.5 && k.lon < 45;
function sayfaKoord(t) {
  let m = t.match(/staticmap\?[^"']*?center=(-?\d{1,2}\.\d+)(?:%2C|,)(-?\d{1,3}\.\d+)/); if (m) return { lat: +m[1], lon: +m[2] };
  m = t.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/); if (m) return { lat: +m[1], lon: +m[2] };
  /* v138: APP_INITIALIZATION_STATE yalnız haritanın varsayılan görünümü olabiliyor (yanlış); yalnız Türkiye içindeki yer koordinatı alınır */
  const re = /\[null,null,(-?\d{1,2}\.\d{4,}),(-?\d{1,3}\.\d{4,})\]/g; while ((m = re.exec(t))) { const k = { lat: +m[1], lon: +m[2] }; if (TRK(k)) return k; }
  return null;
}
/* Google harita «yer» linklerindeki 1s0x…:0x… kimliğinin ilk yarısı yerin S2 hücre numarasıdır → enlem/boylam (S2 kütüphanesinden uyarlama) */
var S2LK=null;
function s2Tablo(){if(S2LK)return S2LK;var L=new Array(1024),PIJ=[[0,1,3,2],[0,2,3,1],[3,2,0,1],[3,1,0,2]],POR=[1,0,0,3];
  function ini(lv,i,j,oo,pos,or){if(lv===4){L[(pos<<2)+oo]=(((i<<4)+j)<<2)+or;return}lv++;i<<=1;j<<=1;pos<<=2;var r=PIJ[or];for(var x=0;x<4;x++)ini(lv,i+(r[x]>>1),j+(r[x]&1),oo,pos+x,or^POR[x])}
  for(var o=0;o<4;o++)ini(0,0,0,o,0,o);return S2LK=L}
function s2Konum(hex){try{var id=BigInt(hex);if(id<=0n)return null;var L=s2Tablo(),face=Number(id>>61n),bits=face&1,i=0,j=0;
  for(var k=7;k>=0;k--){var nb=k===7?2:4;bits+=Number((id>>BigInt(k*8+1))&BigInt((1<<(2*nb))-1))<<2;bits=L[bits];i+=(bits>>6)<<(k*4);j+=((bits>>2)&15)<<(k*4);bits&=3}
  var lsb=id&-id,d=lsb===1n?1:((i^Number((id>>2n)&0xffffffffn))&1)?2:0,uv=function(s){return s>=0.5?(1/3)*(4*s*s-1):(1/3)*(1-4*(1-s)*(1-s))},u=uv((2*i+d)/2147483648),v=uv((2*j+d)/2147483648),p;
  p=[[1,u,v],[-u,1,v],[-u,-v,1],[-1,-v,-u],[v,-1,-u],[v,u,-1]][face];if(!p)return null;
  return{lat:Math.round(Math.atan2(p[2],Math.sqrt(p[0]*p[0]+p[1]*p[1]))*180/Math.PI*1e6)/1e6,lon:Math.round(Math.atan2(p[1],p[0])*180/Math.PI*1e6)/1e6}}catch(e){return null}}
function ftidKonum(s){var m=String(s||"").match(/(?:!1s|ftid=|\/data=[^ ]*?1s)(0x[0-9a-f]{6,16}):0x[0-9a-f]+/i);return m?s2Konum(m[1]):null}

/* v143 — Google «yer» linki çözümü: kısa link → yönlendirme. URL'de koordinat (!3d/@) varsa kesin. Yoksa (telefondan paylaşılan yer linki):
   /maps/place/<ad, adres>/ yazısı + 1s0x kimliğinin S2 hücresi (≈5-10 km, yalnız bölge doğrulaması için) → OpenStreetMap Nominatim ile adres aranır,
   S2 bölgesine 30 km'den yakınsa kabul; değilse S2 noktası «yaklaşık». «yer» yazısı her zaman döner: navigasyonda Google bu yazıyla firmayı tam bulur. */
function yerYazi(u) { u = String(u || ""); let m = u.match(/\/maps\/place\/([^\/@?#]+)/) || u.match(/[?&]q=([^&#]+)/); if (!m) return ""; try { const y = decodeURIComponent(m[1].replace(/\+/g, " ")).trim().slice(0, 200); return /^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(y) ? "" : y; } catch (e) { return ""; } }
/* v143: Android tarayıcı kimliğine Google «intent://…S.browser_fallback_url=…» döner — gerçek adres o parametrede */
function intentAc(loc) { if (!/^intent:/i.test(loc)) return loc; const m = String(loc).match(/S\.browser_fallback_url=([^;]+)/); if (!m) return ""; try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; } }
function kmF(a, b) { const t = Math.PI / 180, x = Math.pow(Math.sin((b.lat - a.lat) * t / 2), 2) + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.pow(Math.sin((b.lon - a.lon) * t / 2), 2); return 12742 * Math.asin(Math.sqrt(x)); }
async function nominatim(q) { try { const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=3&countrycodes=tr&accept-language=tr&q=" + encodeURIComponent(q), { headers: { "User-Agent": "MAG-Sevkiyat/1.0 (+https://xfranerx53.github.io/fabrika-sevkiyat/)" } }); if (!r.ok) return []; return (await r.json()) || []; } catch (e) { return []; } }
/* v143: Google Haritalar aramasının (tbm=map) cevabında yerin tam koordinatı [null,null,enlem,boylam] olarak gelir — en doğru yol */
async function googleAra(q) { try { const r = await fetch("https://www.google.com/search?tbm=map&hl=tr&gl=tr&q=" + encodeURIComponent(q), { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36", "Accept-Language": "tr-TR,tr;q=0.9", Cookie: "CONSENT=YES+cb; SOCS=CAI" } });
  if (typeof IZW !== "undefined" && IZW) IZW.push("ara " + r.status); if (!r.ok) return null; const t = (await r.text()).slice(0, 400000); if (typeof IZW !== "undefined" && IZW) IZW.push("ara boy " + t.length + " " + t.slice(0, 80)); const re = /\[null,null,(-?\d{1,2}\.\d{3,}),(-?\d{1,3}\.\d{3,})\]/g; let m;
  while ((m = re.exec(t))) { const k = { lat: Math.round(+m[1] * 1e6) / 1e6, lon: Math.round(+m[2] * 1e6) / 1e6 }; if (k.lat > 35.5 && k.lat < 42.3 && k.lon > 25.5 && k.lon < 45) return k; } return null; } catch (e) { return null; } }
async function yerKonum(sonUrl) {
  const yer = yerYazi(sonUrl), kaba = ftidKonum(decodeURIComponent(sonUrl)); if (!yer && !kaba) return null;
  if (yer) { const g = await googleAra(yer); if (g && (!kaba || kmF(g, kaba) <= 40)) return { lat: g.lat, lon: g.lon, yer }; }
  const P = yer.split(",").map(x => x.trim()).filter(Boolean), Q = [];
  const noSiz = x => x.replace(/\bNo\s*:?\s*[\d\/\-A-Za-z]+/gi, " ").replace(/\s+/g, " ").trim();
  if (P.length > 1) { Q.push(P.slice(1).join(", ")); Q.push(noSiz(P.slice(1).join(", "))); Q.push(P.slice(-2).join(", ")); } if (yer) Q.push(yer);
  for (const q of Q) { const L = await nominatim(q); for (const x of L) { const k = { lat: +x.lat, lon: +x.lon }; if (isFinite(k.lat) && (!kaba || kmF(k, kaba) <= 30)) return { lat: Math.round(k.lat * 1e6) / 1e6, lon: Math.round(k.lon * 1e6) / 1e6, yer, yaklasik: !/\bNo\b|\d+\/|\d+\s*$/i.test(q) }; } await new Promise(r => setTimeout(r, 1100)); }
  return kaba ? { lat: kaba.lat, lon: kaba.lon, yer, yaklasik: true } : null;
}

const HARITA_HOST = /^(maps\.app\.goo\.gl|goo\.gl|g\.co|maps\.google\.[a-z.]+|(www\.)?google\.[a-z.]+|consent\.google\.[a-z.]+)$/i;
let IZW = null;
async function konumCoz(u) {
  let cur = String(u || "");
  for (let i = 0; i < 7; i++) {
    let x; try { x = new URL(cur); } catch (e) { return null; }
    if (!/^https?:$/.test(x.protocol) || !HARITA_HOST.test(x.hostname)) return null;
    const k = koordBul(cur); if (k) { const y = yerYazi(cur); if (y) k.yer = y; return k; }
    if (/^consent\./i.test(x.hostname)) return koordBul(x.searchParams.get("continue") || "");
    /* v143: Cloudflare'den google.com/maps ve aramaya Google «sorry/429» veriyor → yer linkinde durulur: S2 bölge noktası (yaklaşık) + yer yazısı.
       Tam konumu GitHub'daki yönetim işi «adres-konum» 10 dakikada bir tamamlar; rota yer yazısıyla zaten tam yere götürür. */
    if (/(^|\.)google\./i.test(x.hostname) && /\/maps\/place\//.test(x.pathname)) { const kb = ftidKonum(decodeURIComponent(cur)), y = yerYazi(cur); return kb ? { lat: kb.lat, lon: kb.lon, yer: y, yaklasik: true } : null; }
    const r = await fetch(cur, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36", "Accept-Language": "tr-TR,tr;q=0.9", "Cookie": "CONSENT=YES+cb; SOCS=CAI" } });
    const loc = intentAc(r.headers.get("location") || ""); if (IZW) IZW.push(r.status + " " + cur.slice(0, 120) + " -> " + loc.slice(0, 160));
    if (r.status >= 300 && r.status < 400 && loc) { cur = new URL(loc, cur).href; continue; }
    if (r.ok) { const y = await yerKonum(cur); if (y) return y; return sayfaKoord((await r.text()).slice(0, 2000000)); }
    return null;
  }
  return null;
}
async function konumlar(env, liste, iz) {
  if (iz) { IZW = []; let v = null; try { v = await konumCoz(String(liste[0])); } catch (e) { IZW.push("hata " + e.message); } const t = IZW; IZW = null; return { ok: true, v, iz: t }; }
  const L = (Array.isArray(liste) ? liste : []).map(String).filter(u => /^https?:\/\//i.test(u) && u.length <= 600).slice(0, 25), o = {};
  for (const u of L) {
    const anahtar = "konum2:" + await kisaAd(u), c = await env.KV.get(anahtar, "json");
    if (c && ((c.v && TRK(c.v)) || (!c.v && Date.now() - c.z < 864e5))) { o[u] = c.v || null; continue; }
    let v = null; try { v = await konumCoz(u); } catch (e) { v = null; } if (v && !TRK(v)) v = null;
    o[u] = v;
    await env.KV.put(anahtar, JSON.stringify({ z: Date.now(), v }), { expirationTtl: v ? 60 * 864e2 : 864e2 });
  }
  return { ok: true, konum: o };
}

export default {
  async fetch(req, env, ctx) {
    const origin = req.headers.get("Origin") || "", url = new URL(req.url), yol = url.pathname.replace(/\/+$/, "") || "/";
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    try {
      if (!env.KV) return cevap("KV bağlı değil: Worker > Settings > Bindings > KV namespace ekleyin, değişken adı: KV", 500, origin);
      if (req.method === "GET" && yol === "/") { const A = await aboneOku(env); return cevap("MAG AMBALAJ bildirim sunucusu çalışıyor ✓ (kayıtlı telefon: " + Object.keys(A).length + ")", 200, origin); }
      if (req.method === "GET" && yol === "/vapid") return cevap({ pub: (await vapid(env)).pub }, 200, origin);
      if (req.method === "GET" && yol === "/kur") return cevap(await tcmbKur(env), 200, origin);
      if (req.method !== "POST") return cevap("bulunamadı", 404, origin);
      if (yol === "/alindi") {
        /* telefonun sw.js'i bildirimi gösterince çağırır. Yalnız kayıtlı aboneliklerin zamanı yazılır; KV yazma sınırı için
           deneme bildiriminde her zaman, diğerlerinde en çok 6 saatte bir yazılır. */
        const g0 = JSON.parse(await req.text().catch(() => "{}") || "{}"), A = await aboneOku(env);
        if (g0 && typeof g0.endpoint === "string" && A[g0.endpoint]) {
          const k = "son:" + await kisaAd(g0.endpoint), eski = +(await env.KV.get(k)) || 0;
          if (g0.test || Date.now() - eski > 6 * 3600e3) await env.KV.put(k, String(Date.now()), { metadata: { t: Date.now() } });
        }
        return cevap({ ok: true }, 200, origin);
      }

      const jeton = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      const uid = await jetonDogrula(jeton);
      const kayit = await kayitOku(uid, jeton);
      if (!kayit || kayit.onay !== true) return cevap({ hata: "hesap onaylı değil" }, 403, origin);
      const g = await req.json().catch(() => ({}));
      if (yol === "/konum") return cevap(await konumlar(env, g.u, g.iz === 1), 200, origin);
      if (yol === "/sifre") {
        if (kayit.yonetici !== true) return cevap({ hata: "Bu işlem için yönetici olmalısınız." }, 403, origin);
        const hedef = String(g.uid || ""), sifre = String(g.sifre || "");
        if (!/^[\w-]{10,128}$/.test(hedef) || sifre.length < 6 || sifre.length > 128) return cevap({ hata: "Geçersiz bilgi (şifre en az 6 karakter)." }, 400, origin);
        if (hedef === uid) return cevap({ hata: "Kendi şifrenizi «Şifremi değiştir» ile değiştirin." }, 400, origin);
        if (!env.FB_SA) return cevap({ hata: "Sunucuda Firebase hizmet anahtarı yok (FB_SA)." }, 501, origin);
        const t = await saJeton(env);
        const r = await fetch("https://identitytoolkit.googleapis.com/v1/projects/" + PROJE + "/accounts:update", { method: "POST", headers: { Authorization: "Bearer " + t, "Content-Type": "application/json" },
          body: JSON.stringify({ localId: hedef, password: sifre, validSince: String(Math.floor(Date.now() / 1000)) }) });
        if (!r.ok) { const m = ((await r.json().catch(() => ({}))).error || {}).message || r.status; return cevap({ hata: /USER_NOT_FOUND/.test(m) ? "Kullanıcı bulunamadı." : /WEAK_PASSWORD/.test(m) ? "Şifre çok zayıf (en az 6 karakter)." : "Şifre değiştirilemedi (" + m + ")" }, 400, origin); }
        return cevap({ ok: true }, 200, origin);
      }

      if (yol === "/abone") {
        if (!gecerliSub(g.sub)) return cevap({ hata: "abonelik bilgisi hatalı" }, 400, origin);
        const A = await aboneOku(env);
        A[g.sub.endpoint] = { uid, sub: { endpoint: g.sub.endpoint, keys: { p256dh: g.sub.keys.p256dh, auth: g.sub.keys.auth } }, kanallar: kanallar(uid, kayit), kapat: Array.isArray(g.kapat) ? g.kapat.slice(0, 20).map(String) : [], cihaz: String(g.cihaz || "").slice(0, 80), z: Date.now() };
        await aboneYaz(env, A);
        return cevap({ ok: true, kanallar: A[g.sub.endpoint].kanallar }, 200, origin);
      }
      if (yol === "/sil") {
        const A = await aboneOku(env);
        if (g.endpoint && A[g.endpoint] && A[g.endpoint].uid === uid) { delete A[g.endpoint]; await aboneYaz(env, A); }
        return cevap({ ok: true }, 200, origin);
      }
      if (yol === "/sina") {
        const herkes = g.herkes === true && kayit.yonetici === true;
        const A = await aboneOku(env), L = Object.keys(A).filter(e => herkes || A[e].uid === uid);
        if (!L.length) return cevap({ ok: false, hata: herkes ? "Hiç kayıtlı telefon yok" : "Bu hesap için kayıtlı telefon yok" }, 200, origin);
        const n = await dagit(env, L, { b: "🔔 Deneme bildirimi", m: herkes ? "Yönetici bildirimleri deniyor. Bu bildirimi gördüyseniz telefonunuz hazır ✓" : "Telefon bildirimleri çalışıyor. Uygulama kapalıyken de gelir.", ik: "🔔", key: "sina-" + Date.now(), git: "", test: 1 }, url.origin);
        return cevap({ ok: n > 0, gonderilen: n, kayitli: L.length }, 200, origin);
      }
      if (yol === "/liste") {
        if (kayit.yonetici !== true) return cevap({ hata: "yalnız yönetici" }, 403, origin);
        const A = await aboneOku(env), S = {};
        let c; do { const r = await env.KV.list({ prefix: "son:", cursor: c }); r.keys.forEach(x => { S[x.name.slice(4)] = (x.metadata && x.metadata.t) || 0; }); c = r.list_complete ? null : r.cursor; } while (c);
        const L = [];
        for (const e of Object.keys(A)) { const a = A[e]; L.push({ uid: a.uid, cihaz: a.cihaz || "", z: a.z || 0, son: S[await kisaAd(e)] || 0, kanallar: a.kanallar || [] }); }
        return cevap({ ok: true, liste: L }, 200, origin);
      }
      if (yol === "/gonder") {
        const K = Array.isArray(g.kanallar) ? g.kanallar.map(String).slice(0, 20) : [];
        if (!K.length || !g.b) return cevap({ hata: "eksik bilgi" }, 400, origin);
        const veri = { b: String(g.b).slice(0, 120), m: String(g.m || "").slice(0, 400), ik: String(g.ik || "").slice(0, 8), git: String(g.git || "").slice(0, 20), r: String(g.r || "").slice(0, 100), key: String(g.key || "").slice(0, 40), t: String(g.t || "").slice(0, 12) };
        const A = await aboneOku(env);
        const L = Object.keys(A).filter(e => { const a = A[e]; return a.uid !== uid && !(a.kapat || []).includes(veri.t) && (a.kanallar || []).some(k => K.includes(k)); });
        if (!L.length) return cevap({ ok: true, gonderilen: 0 }, 200, origin);
        ctx.waitUntil(dagit(env, L, veri, url.origin));
        return cevap({ ok: true, kuyruk: L.length }, 200, origin);
      }
      return cevap("bulunamadı", 404, origin);
    } catch (e) {
      return cevap({ hata: String((e && e.message) || e) }, /jeton|token/i.test(String(e && e.message)) ? 401 : 500, origin);
    }
  }
};
