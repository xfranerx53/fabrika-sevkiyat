/* =====================================================================================
   MAG AMBALAJ — TELEFON BİLDİRİM SUNUCUSU (Cloudflare Worker, ücretsiz plan)  · v125
   -------------------------------------------------------------------------------------
   Ne yapar: Uygulama KAPALIYKEN de telefona bildirim gönderir (standart Web Push; Firebase
   Blaze / FCM gerekmez). Bu dosyanın TAMAMI Cloudflare > Worker > «Edit code» ekranına yapıştırılır.
   Gereken tek ayar: Worker'a «KV» adında bir KV namespace bağlamak (Settings > Bindings).
   Gizli anahtar girmeye gerek yok: bildirim imza anahtarları (VAPID) ilk çalışmada kendiliğinden
   üretilip KV'de saklanır.

   Uç noktalar (uygulama bildirim.js çağırır):
     GET  /          -> "çalışıyor" yazısı (kurulumu denemek için tarayıcıda açın)
     GET  /vapid     -> herkese açık imza anahtarı (telefon abone olurken kullanır)
     POST /abone     -> bu telefonu kaydet   {sub, cihaz, kapat:[...]}       (Firebase giriş jetonu gerekir)
     POST /sil       -> bu telefonun kaydını sil {endpoint}                  (Firebase giriş jetonu gerekir)
     POST /gonder    -> bildirimi ilgili telefonlara gönder {kanallar:[...], b, m, ik, git, key, t}
     POST /sina      -> kendi telefonlarıma deneme bildirimi; yönetici {herkes:true} ile TÜM telefonlara
     POST /alindi    -> (giriş gerekmez) telefon bildirimi aldığında haber verir {endpoint, test}; «ulaştı» zamanı tutulur
     POST /liste     -> (yalnız yönetici) kimin kaç telefonu kayıtlı, son bildirim ne zaman ulaştı
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

export default {
  async fetch(req, env, ctx) {
    const origin = req.headers.get("Origin") || "", url = new URL(req.url), yol = url.pathname.replace(/\/+$/, "") || "/";
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    try {
      if (!env.KV) return cevap("KV bağlı değil: Worker > Settings > Bindings > KV namespace ekleyin, değişken adı: KV", 500, origin);
      if (req.method === "GET" && yol === "/") { const A = await aboneOku(env); return cevap("MAG AMBALAJ bildirim sunucusu çalışıyor ✓ (kayıtlı telefon: " + Object.keys(A).length + ")", 200, origin); }
      if (req.method === "GET" && yol === "/vapid") return cevap({ pub: (await vapid(env)).pub }, 200, origin);
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
