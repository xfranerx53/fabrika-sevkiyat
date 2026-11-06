// Claude yönetim aracı — GitHub'da çalışır, anahtarlar GitHub gizli değişkenlerinden gelir.
// DİKKAT: Depo herkese açık; bu betik ASLA müşteri/kişi bilgisi yazdırmaz, yalnızca sayılar ve ayar adları.
import fs from "node:fs";
import admin from "firebase-admin";
const env = k => (process.env[k] || "").trim();
const islem = env("ISLEM") || "saglik";
const log = (...a) => console.log(...a);
const sirala = o => Array.isArray(o) ? o.map(sirala) : o && typeof o === "object" ? Object.fromEntries(Object.keys(o).sort().map(k => [k, sirala(o[k])])) : o;
let hata = 0;

/* ---------------- Firebase ---------------- */
if (env("SA")) {
  let sa; try { sa = JSON.parse(env("SA")); } catch (e) { log("❌ Firebase anahtarı (JSON) okunamadı — GitHub secret'ına dosyanın TAMAMI yapıştırılmalı"); process.exit(1); }
  const DB = env("DB_URL");
  log(`🔥 Firebase projesi: ${sa.project_id} • hesap: ${String(sa.client_email).replace(/^(.{6}).*(@.*)$/, "$1…$2")}`);
  admin.initializeApp({ credential: admin.credential.cert(sa), databaseURL: DB });
  const tok = (await admin.app().options.credential.getAccessToken()).access_token;
  const sig = async p => { const r = await fetch(DB.replace(/\/$/, "") + "/" + p + ".json?shallow=true", { headers: { Authorization: "Bearer " + tok } }); if (!r.ok) throw new Error("okuma " + r.status); return (await r.json()) || {}; };
  try {
    const kok = env("KOK") ? env("KOK") + "/" : "";
    const ust = Object.keys(await sig(env("KOK") || ""));
    log(`✅ Veritabanına erişim var. Ana bölümler (${ust.length}): ${ust.join(", ")}`);
    if (islem === "saglik") for (const k of ust) { try { const n = Object.keys(await sig(kok + k)).length; log(`   • ${k}: ${n} kayıt`); } catch (e) { log(`   • ${k}: okunamadı`); } }
  } catch (e) { hata++; log("❌ Veritabanı okunamadı:", e.message, "— hizmet hesabının 'Firebase Realtime Database Admin' rolü var mı?"); }

  /* 🔐 ajan hesabının izinlerini en aza indir (yalnız Fabrika Sevkiyat): rol Muhasebe + yalnız "sevk" izni */
  if (islem === "ajan-izin" && env("AJAN_KUL")) {
    const K = (await admin.database().ref("kullanicilar").once("value")).val() || {};
    const e = Object.entries(K).find(([, u]) => u && u.kullanici === env("AJAN_KUL"));
    if (!e) { hata++; log("❌ Ajan hesabı bulunamadı"); }
    else { const [uid, u] = e, once = Object.keys(u.izin || {}).filter(k => u.izin[k]).join(", ") || "-";
      await admin.database().ref("kullanicilar/" + uid + "/izin").set({ sevk: true });
      if (u.rol !== "Muhasebe") await admin.database().ref("kullanicilar/" + uid + "/rol").set("Muhasebe");
      await admin.database().ref("denetim").push({ tur: "izin", baslik: "Ajan hesabı izinleri azaltıldı: " + env("AJAN_KUL"), detay: (once + " → sevk").slice(0, 200), kim: "Claude (yönetim)", uid: "claude", yol: "kullanicilar/" + uid + "/izin", zaman: admin.database.ServerValue.TIMESTAMP }).catch(() => { });
      log(`✅ Ajan hesabı izinleri: ${once} → sevk (rol: Muhasebe)`); }
  }

  /* 🩺 teşhis: tüm veriyi (fotoğraf ve gizli anahtarlar HARİÇ) ./teshis/ klasörüne yazar; iş akışı bunu ÖZEL depoya (mag-yonetim) gönderir.
     Herkese açık kayda (log) yalnız sayılar yazılır. 30 günden eski hata kayıtları silinir. */
  if (islem === "teshis") {
    const kok = env("KOK"), HARIC = new Set(env("HARIC").split(",").map(x => x.trim()).filter(Boolean));
    const temizle = v => { if (typeof v === "string") return /^data:/.test(v) ? "[dosya]" : v.length > 4000 ? v.slice(0, 4000) + "…[kesildi]" : v; if (Array.isArray(v)) return v.map(temizle); if (v && typeof v === "object") { const o = {}; for (const k in v) o[k] = HARIC.has(k) ? "[gizli/hariç]" : temizle(v[k]); return o; } return v; };
    const ust = Object.keys(await sig(kok || "")), cikti = {}, say = {};
    for (const k of ust) { if (HARIC.has(k)) { cikti[k] = "[hariç]"; continue; } try { const v = (await admin.database().ref((kok ? kok + "/" : "") + k).once("value")).val(); cikti[k] = temizle(v); say[k] = v && typeof v === "object" ? Object.keys(v).length : 1; } catch (e) { cikti[k] = "[okunamadı: " + e.message + "]"; } }
    const hy = (kok ? kok + "/" : "") + "hata", H = cikti.hata && typeof cikti.hata === "object" ? cikti.hata : {};
    let silinen = 0; for (const [id, h] of Object.entries(H)) if (h && h.t && Date.now() - h.t > 30 * 864e5) { await admin.database().ref(hy + "/" + id).remove().catch(() => { }); delete H[id]; silinen++; }
    fs.mkdirSync("teshis", { recursive: true });
    fs.writeFileSync("teshis/veri.json", JSON.stringify(sirala(cikti), null, 1));
    const hl = Object.values(H).filter(Boolean).sort((a, b) => b.t - a.t);
    const md = [`# Teşhis — ${sa.project_id} — ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`, "", "## Kayıt sayıları", ...Object.entries(say).map(([k, n]) => `- ${k}: ${n}`), "",
      `## Son hatalar (${hl.length}, 30 günden eskiler silindi: ${silinen})`, ...hl.slice(0, 80).map(h => `- ${new Date(h.t).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })} • ${h.tur || ""}${h.n > 1 ? " ×" + h.n : ""} • ${h.v || ""} • ${h.ekran || ""} • ${h.cihaz || ""} • u:${h.u || ""}\n  ${h.m}${h.s ? "\n  ```\n  " + String(h.s).split("\n").slice(0, 4).join("\n  ") + "\n  ```" : ""}`)];
    fs.writeFileSync("teshis/OZET.md", md.join("\n") + "\n");
    log(`🩺 Teşhis hazır: ${Object.keys(say).length} bölüm, ${hl.length} hata kaydı (${silinen} eski silindi). İçerik yalnız özel depoya gider.`);
  }

  if (/^kural/.test(islem) || islem === "saglik") {
    let hedef = null;
    if (env("KURAL_DOSYA")) hedef = JSON.parse(fs.readFileSync(env("KURAL_DOSYA"), "utf8"));
    else if (env("KURAL_HTML")) { // Mag Pazar: kurallar index.html'deki rulesText() ile üretilir (sahip uid'i ayardan)
      const h = fs.readFileSync(env("KURAL_HTML"), "utf8"), a = h.indexOf("function rulesText("), b = h.indexOf("\nfunction ", a + 10);
      const rulesText = new Function("return " + h.slice(a, b))();
      const own = (await admin.database().ref("mag_pazar/ayar/ownerUid").once("value")).val();
      if (!own) log("⚠ ayar.ownerUid bulunamadı; kural yalnız yönetici rolüne göre üretilecek");
      hedef = JSON.parse(rulesText(own || "yok"));
    }
    try {
      const simdi = await admin.database().getRulesJSON();
      const ayni = JSON.stringify(sirala(simdi)) === JSON.stringify(sirala(hedef));
      log(hedef ? (ayni ? "✅ Yayındaki kurallar depodaki kurallarla AYNI" : "⚠ Yayındaki kurallar depodakinden FARKLI") : "ℹ Karşılaştırılacak kural dosyası yok");
      if (islem === "kural-yayinla" && hedef && !ayni) { await admin.database().setRules(JSON.stringify(hedef, null, 2)); log("✅ Yeni kurallar YAYINLANDI"); }
      else if (islem === "kural-yayinla") log("ℹ Yayınlamaya gerek yok");
    } catch (e) { hata++; log("❌ Kurallara erişilemedi:", e.message, "— hizmet hesabına 'Firebase Realtime Database Admin' rolü verilmeli"); }
  }
}

/* ---------------- Cloudflare ---------------- */
if (env("CF_TOKEN")) {
  const H = { Authorization: "Bearer " + env("CF_TOKEN") }, A = env("CF_ACCOUNT");
  const cf = async p => { const r = await fetch("https://api.cloudflare.com/client/v4/" + p, { headers: H }); const j = await r.json().catch(() => ({})); if (!j.success) throw new Error((j.errors && j.errors[0] && j.errors[0].message) || "yanıt " + r.status); return j.result; };
  try {
    const v = await cf("user/tokens/verify"); log(`☁ Cloudflare anahtarı: ${v.status}`);
    if (!A) { hata++; log("❌ CLOUDFLARE_ACCOUNT_ID yok"); }
    else {
      const w = await cf(`accounts/${A}/workers/scripts`); log(`✅ Worker'lar (${w.length}): ${w.map(x => x.id).join(", ") || "-"}`);
      const kv = await cf(`accounts/${A}/storage/kv/namespaces`); log(`✅ KV alanları (${kv.length}): ${kv.map(x => x.title).join(", ") || "-"}`);
      try { const s = await cf(`accounts/${A}/workers/subdomain`); log(`   adres kökü: ${s.subdomain}.workers.dev`); } catch (e) { }
    }
  } catch (e) { hata++; log("❌ Cloudflare:", e.message); }
}
/* ---------------- 🔔 Bildirim sunucusu (mag-bildirim) yayını + Firebase hizmet anahtarı (v134: /sifre için) ----------------
   Yayındaki kodun sürümüne bakar: depodakinden YENİ bir sürüm yayındaysa (biri elle güncellemiş) üzerine YAZMAZ.
   Bağlı KV ve gizli değişkenler korunur (keep_bindings). FB_SA = GitHub'daki FIREBASE_SERVICE_ACCOUNT; log'a yazılmaz. */
if (islem === "bildirim-yayinla") {
  const A = env("CF_ACCOUNT"), CT = env("CF_TOKEN");
  if (!A || !CT || !env("SA")) { log("❌ Cloudflare anahtarları ya da Firebase anahtarı yok"); process.exit(1); }
  const u = `https://api.cloudflare.com/client/v4/accounts/${A}/workers/scripts/mag-bildirim`, H = { Authorization: "Bearer " + CT };
  const yeni = fs.readFileSync("cloudflare/bildirim-worker.js", "utf8"), sv = s => +((String(s).match(/BİLDİRİM SUNUCUSU[^\n]*·\s*v(\d+)/) || [])[1] || 0);
  let r = await fetch(u + "/content/v2", { headers: H }); let eski = r.ok ? await r.text() : "";
  if (!eski) { r = await fetch(u, { headers: H }); eski = r.ok ? await r.text() : ""; }
  const ys = sv(eski), ds = sv(yeni);
  log(`ℹ Yayındaki bildirim sunucusu: ${ys ? "v" + ys : "sürümü okunamadı"} • depodaki: v${ds}`);
  if (ys > ds) { log("❌ Yayındaki sürüm depodakinden yeni — üzerine yazılmadı"); process.exit(1); }
  if (eski && !/KV/.test(eski)) { log("❌ Yayındaki kod beklenen bildirim sunucusuna benzemiyor — üzerine yazılmadı"); process.exit(1); }
  r = await fetch(u + "/settings", { headers: H }); const st = ((await r.json().catch(() => ({}))).result) || {};
  log("ℹ Bağlantılar:", (st.bindings || []).map(b => b.type + ":" + b.name).join(", ") || "-");
  if (!(st.bindings || []).some(b => b.type === "kv_namespace" && b.name === "KV")) { log("❌ KV bağlantısı bulunamadı — yayın durduruldu"); process.exit(1); }
  const fd = new FormData();
  fd.append("metadata", new Blob([JSON.stringify({ main_module: "worker.js", compatibility_date: st.compatibility_date || "2024-09-01", keep_bindings: ["kv_namespace", "secret_text", "plain_text"] })], { type: "application/json" }));
  fd.append("worker.js", new Blob([yeni], { type: "application/javascript+module" }), "worker.js");
  r = await fetch(u, { method: "PUT", headers: H, body: fd }); let j = await r.json().catch(() => ({}));
  if (!j.success) { log("❌ Bildirim sunucusu yüklenemedi:", JSON.stringify(j.errors || r.status).slice(0, 300)); process.exit(1); }
  r = await fetch(u + "/secrets", { method: "PUT", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ name: "FB_SA", text: env("SA"), type: "secret_text" }) }); j = await r.json().catch(() => ({}));
  if (!j.success) { log("❌ Hizmet anahtarı sunucuya konamadı:", JSON.stringify(j.errors || r.status).slice(0, 200)); process.exit(1); }
  r = await fetch(u + "/settings", { headers: H }); const st2 = ((await r.json().catch(() => ({}))).result) || {};
  log("✅ Bildirim sunucusu v" + ds + " yayında • bağlantılar: " + (st2.bindings || []).map(b => b.type + ":" + b.name).join(", "));
  const sd = await fetch(`https://api.cloudflare.com/client/v4/accounts/${A}/workers/subdomain`, { headers: H }).then(x => x.json()).catch(() => ({}));
  if (sd.result && sd.result.subdomain) { const t = await fetch(`https://mag-bildirim.${sd.result.subdomain}.workers.dev/`).then(x => x.text()).catch(e => "ulaşılamadı"); log("ℹ Sunucu cevabı:", String(t).replace(/\d+\)/, "…)").slice(0, 80)); }
}

/* ---------------- 🧪 Granül defteri: Excel aktarımı (veri ÖZEL depo mag-yonetim/aktar/'tan okunur, log'a sayıdan başka bir şey yazılmaz) ---------------- */
if (islem === "granul-aktar") {
  const T = env("YONETIM_TOKEN"); if (!T || !env("SA")) { log("❌ YONETIM_TOKEN ya da Firebase anahtarı yok"); process.exit(1); }
  const r = await fetch("https://api.github.com/repos/xfranerx53/mag-yonetim/contents/aktar/granul-zekeriya.json", { headers: { Authorization: "Bearer " + T, Accept: "application/vnd.github.raw", "User-Agent": "mag-yonetim" } });
  if (!r.ok) { log("❌ Aktarım dosyası okunamadı:", r.status); process.exit(1); }
  const A = await r.json(), D = admin.database(), trn = s => String(s || "").toLocaleUpperCase("tr").replace(/\s+/g, "");
  const G = (await D.ref("granulcular").once("value")).val() || {}, gid = Object.keys(G).find(k => trn(G[k].ad) === trn(A.granulcu));
  if (!gid) { log("❌ Granülcü bulunamadı"); process.exit(1); }
  const K = (await D.ref("granulKayit").orderByChild("gid").equalTo(gid).once("value")).val() || {};
  const anah = x => [x.tarih, +x.giden || 0, +x.gelen || 0, +x.satis || 0, +x.fire || 0, +x.fiyat || 0, +x.kdv || 0, +x.odeme || 0, (x.aciklama || "").trim()].join("|");
  const var_ = new Set(Object.values(K).map(anah)), yeni = A.satirlar.filter(x => !var_.has(anah(x)));
  const U = (await D.ref("kullanicilar").once("value")).val() || {}, aj = Object.keys(U).find(k => U[k] && U[k].kullanici === "magajan") || "magajan";
  const up = {};
  for (const x of yeni) { const k = D.ref("granulKayit").push().key, n = { gid, tarih: x.tarih, ekleyen: "🤖 Claude (Excel aktarımı)", ekleyenUid: aj, zaman: admin.database.ServerValue.TIMESTAMP };
    if (x.sn) n.sn = String(x.sn).slice(0, 20); if (x.aciklama) n.aciklama = String(x.aciklama).slice(0, 200);
    for (const a of ["giden", "gelen", "satis", "fire", "fiyat", "kdv", "odeme"]) if (+x[a]) n[a] = +x[a];
    up["granulKayit/" + k] = n; }
  if (yeni.length) { up["denetim/" + D.ref("denetim").push().key] = { tur: "granul-aktar", baslik: A.granulcu, detay: yeni.length + " satır Excel'den alındı", yol: "granulKayit", id: "", kim: "🤖 Claude (Excel aktarımı)", uid: aj, zaman: admin.database.ServerValue.TIMESTAMP }; await D.ref().update(up); }
  const H = Object.values((await D.ref("granulKayit").orderByChild("gid").equalTo(gid).once("value")).val() || {}), S = k => Math.round(H.reduce((a, x) => a + (+x[k] || 0), 0) * 100) / 100;
  const top = H.reduce((a, x) => a + (+x.gelen || 0) * (+x.fiyat || 0), 0), sfy = H.reduce((a, x) => a + (+x.satis || 0) * (+x.fiyat || 0), 0);
  const kalan = Math.round((S("giden") - S("gelen") - S("fire")) * 100) / 100, bakiye = Math.round((top + S("kdv") - sfy - S("odeme")) * 100) / 100;
  log(`✅ Granül aktarımı: ${yeni.length} yeni satır (${A.satirlar.length - yeni.length} zaten vardı) • defterde ${H.length} satır • kalan ${kalan} kg • bakiye ${bakiye} ₺`);
  if (kalan !== A.beklenen.kalan || bakiye !== A.beklenen.bakiye) { hata++; log(`❌ Excel'le uyuşmuyor (beklenen kalan ${A.beklenen.kalan}, bakiye ${A.beklenen.bakiye})`); }
  else log("✅ Excel'deki TOPLAM satırıyla birebir aynı");
}

/* ---------------- 🎯 KOMUT: Claude'un sahibin talimatını doğrudan uygulaması ----------------
   Talimat ÖZEL depo mag-yonetim/komut/<PROJE_AD>.json'dadır: {aciklama, islemler:[{tur:"yaz"|"birlestir"|"sil", yol, deger}]}
   Önce eski değerler komut/yedek/'e yedeklenir (geri alınabilir), sonra tek seferde uygulanır, Fabrika'da denetim kaydına düşülür.
   Herkese açık log'a YALNIZ sayılar yazılır (açıklama, isim, değer yazılmaz). Değerdeki "{SUNUCU_ZAMANI}" sunucu saatine çevrilir. */
if (islem === "komut") {
  const T = env("YONETIM_TOKEN"), PRJ = env("PROJE_AD"), KOKK = env("KOK");
  if (!T || !env("SA") || !PRJ) { log("❌ YONETIM_TOKEN / Firebase anahtarı / PROJE_AD yok"); process.exit(1); }
  const API = "https://api.github.com/repos/xfranerx53/mag-yonetim/contents/komut/", HH = { Authorization: "Bearer " + T, "User-Agent": "mag-yonetim", Accept: "application/vnd.github+json" };
  const r = await fetch(API + PRJ + ".json", { headers: HH });
  if (r.status === 404) log("ℹ Bekleyen komut yok");
  else if (!r.ok) { log("❌ Komut dosyası okunamadı:", r.status); process.exit(1); }
  else {
    const meta = await r.json(), K = JSON.parse(Buffer.from(meta.content, "base64").toString("utf8")), D = admin.database();
    const SZ = v => v === "{SUNUCU_ZAMANI}" ? admin.database.ServerValue.TIMESTAMP : v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).map(([a, b]) => [a, SZ(b)])) : Array.isArray(v) ? v.map(SZ) : v;
    const up = {}, yedek = { t: Date.now(), proje: PRJ, aciklama: K.aciklama || "", once: {} };
    for (const x of K.islemler || []) {
      const p = String(x.yol || "").replace(/^\/+|\/+$/g, "");
      if (!p || /[.#$\[\]]/.test(p) || p.split("/").some(s => !s)) { log("❌ Geçersiz yol, komut uygulanmadı"); process.exit(1); }
      if (KOKK && p !== KOKK && !p.startsWith(KOKK + "/")) { log("❌ Yol programın kök düğümü dışında, komut uygulanmadı"); process.exit(1); }
      yedek.once[p] = (await D.ref(p).once("value")).val();
      if (x.tur === "sil") up[p] = null;
      else if (x.tur === "birlestir") for (const [a, b] of Object.entries(x.deger || {})) up[p + "/" + a] = SZ(b);
      else if (x.tur === "yaz") up[p] = SZ(x.deger);
      else { log("❌ Bilinmeyen işlem türü, komut uygulanmadı"); process.exit(1); }
    }
    const ts = new Date().toISOString().replace(/[:.]/g, "-"), b64 = o => Buffer.from(JSON.stringify(o, null, 1)).toString("base64");
    const yr = await fetch(API + "yedek/" + PRJ + "-" + ts + ".json", { method: "PUT", headers: HH, body: JSON.stringify({ message: "komut yedeği " + PRJ, content: b64(yedek) }) });
    if (!yr.ok) { log("❌ Yedek alınamadı, komut UYGULANMADI:", yr.status); process.exit(1); }
    if (Object.keys(up).length) await D.ref().update(up);
    if (PRJ === "fabrika") await D.ref("denetim").push({ tur: "claude", baslik: String(K.aciklama || "Claude talimatı").slice(0, 120), detay: Object.keys(up).length + " değişiklik (sahibin talimatıyla)", yol: "", id: "", kim: "🤖 Claude (sahibin talimatı)", uid: "claude", zaman: admin.database.ServerValue.TIMESTAMP }).catch(() => { });
    await fetch(API + PRJ + ".json", { method: "DELETE", headers: HH, body: JSON.stringify({ message: "komut uygulandı " + PRJ, sha: meta.sha }) });
    await fetch(API + "sonuc-" + PRJ + ".json", { method: "GET", headers: HH }).then(x => x.ok ? x.json() : null).then(o => fetch(API + "sonuc-" + PRJ + ".json", { method: "PUT", headers: HH, body: JSON.stringify({ message: "komut sonucu", content: b64({ t: Date.now(), degisiklik: Object.keys(up).length, yedek: "yedek/" + PRJ + "-" + ts + ".json" }), ...(o && o.sha ? { sha: o.sha } : {}) }) }));
    log(`✅ Komut uygulandı: ${Object.keys(up).length} değişiklik • eski hali yedeklendi`);
  }
}

/* ---------------- 📍 Harita linkinden konum (v137/v138) — fabrika-konum ve adres-konum ortak ---------------- */
const koordBul = s => { s = String(s || ""); try { s = decodeURIComponent(s); } catch (e) { }
  const ok = (a, b) => (isFinite(+a) && isFinite(+b) && Math.abs(+a) <= 90 && Math.abs(+b) <= 180 && (+a || +b)) ? { lat: +a, lon: +b } : null; let m;
  if ((m = s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/))) return ok(m[1], m[2]);
  if ((m = s.match(/[?&](?:q|query|ll|destination|daddr|center|sll)=(?:loc:)?(-?\d{1,2}\.\d+)\s*(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i))) return ok(m[1], m[2]);
  if ((m = s.match(/staticmap\?[^"']*?center=(-?\d{1,2}\.\d+)(?:%2C|,)(-?\d{1,3}\.\d+)/))) return ok(m[1], m[2]);
  if ((m = s.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/))) return ok(m[1], m[2]);
  if ((m = s.match(/^\s*(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})\s*$/))) return ok(m[1], m[2]);
  return null; };
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
function yerYazi(u) { const m = String(u || "").match(/\/maps\/place\/([^\/@?]+)/); if (!m) return ""; try { return decodeURIComponent(m[1].replace(/\+/g, " ")).trim().slice(0, 200); } catch (e) { return ""; } }
function kmF(a, b) { const t = Math.PI / 180, x = Math.pow(Math.sin((b.lat - a.lat) * t / 2), 2) + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.pow(Math.sin((b.lon - a.lon) * t / 2), 2); return 12742 * Math.asin(Math.sqrt(x)); }
async function nominatim(q) { try { const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=3&countrycodes=tr&accept-language=tr&q=" + encodeURIComponent(q), { headers: { "User-Agent": "MAG-Sevkiyat/1.0 (+https://xfranerx53.github.io/fabrika-sevkiyat/)" } }); if (!r.ok) return []; return (await r.json()) || []; } catch (e) { return []; } }
async function yerKonum(sonUrl) {
  const yer = yerYazi(sonUrl), kaba = ftidKonum(decodeURIComponent(sonUrl)); if (!yer && !kaba) return null;
  const P = yer.split(",").map(x => x.trim()).filter(Boolean), Q = [];
  const noSiz = x => x.replace(/\bNo\s*:?\s*[\d\/\-A-Za-z]+/gi, " ").replace(/\s+/g, " ").trim();
  if (P.length > 1) { Q.push(P.slice(1).join(", ")); Q.push(noSiz(P.slice(1).join(", "))); Q.push(P.slice(-2).join(", ")); } if (yer) Q.push(yer);
  for (const q of Q) { const L = await nominatim(q); for (const x of L) { const k = { lat: +x.lat, lon: +x.lon }; if (isFinite(k.lat) && (!kaba || kmF(k, kaba) <= 30)) return { lat: Math.round(k.lat * 1e6) / 1e6, lon: Math.round(k.lon * 1e6) / 1e6, yer, yaklasik: !/\bNo\b|\d+\/|\d+\s*$/i.test(q) }; } await new Promise(r => setTimeout(r, 1100)); }
  return kaba ? { lat: kaba.lat, lon: kaba.lon, yer, yaklasik: true } : null;
}

const IZ = [];
/* Google yer sayfası: APP_INITIALIZATION_STATE=[[[mesafe,boylam,enlem]…  ya da [null,null,enlem,boylam] */
const TR = k => k && k.lat > 35.5 && k.lat < 42.3 && k.lon > 25.5 && k.lon < 45; /* müşterilerin hepsi Türkiye'de: dışı = yanlış (ör. sunucunun ABD'deki varsayılan görünümü) */
const sayfaCift = t => { const re = /\[null,null,(-?\d{1,2}\.\d{4,}),(-?\d{1,3}\.\d{4,})\]/g; let m;
  while ((m = re.exec(t))) { const k = { lat: +m[1], lon: +m[2] }; if (TR(k)) return k; }
  return null; };
async function haritaKonum(link) {
  let cur = String(link || "").trim(), k = koordBul(cur), adim = 0; const iz = { link: cur, yol: [] }; IZ.push(iz);
  if (!/^https?:\/\//i.test(cur)) return k;
  while (!k && cur && adim++ < 8) {
    let r; try { r = await fetch(cur, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36", "Accept-Language": "tr-TR,tr;q=0.9", Cookie: "CONSENT=YES+cb; SOCS=CAI" } }); } catch (e) { return null; }
    const loc = r.headers.get("location"); iz.yol.push(r.status + " " + (loc || "").slice(0, 400));
    if (r.status >= 300 && r.status < 400 && loc) { cur = new URL(loc, cur).href; k = koordBul(cur); if (!k && /consent\./.test(cur)) { const c = new URL(cur).searchParams.get("continue"); k = koordBul(c); } continue; }
    if (r.ok) { k = await yerKonum(cur); if (!k) { const t = (await r.text()).slice(0, 2000000); k = koordBul(t) || sayfaCift(t); } }
    break;
  }
  if (k && !k.yer) { const y = yerYazi(cur); if (y) k.yer = y; }
  return k && TR(k) ? Object.assign({ lat: Math.round(k.lat * 1e6) / 1e6, lon: Math.round(k.lon * 1e6) / 1e6 }, k.yer ? { yer: k.yer } : {}, k.yaklasik ? { yaklasik: true } : {}) : null;
}

/* fabrika-konum: .github/yonetim-istek.txt 2. satırdaki Google Maps linkini çözüp ayarlar/fabrika'ya yazar (firmanın kendi açık adresi; log'a yazılır) */
if (islem === "fabrika-konum") {
  const link = (fs.readFileSync(".github/yonetim-istek.txt", "utf8").split(/\r?\n/)[1] || "").trim(), k = await haritaKonum(link);
  if (!link) { hata++; log("❌ yonetim-istek.txt 2. satırda link yok"); }
  else if (!k) { hata++; log("❌ Linkten konum çıkarılamadı"); }
  else {
    await admin.database().ref("ayarlar/fabrika").set({ lat: k.lat, lon: k.lon, url: link.slice(0, 500), z: admin.database.ServerValue.TIMESTAMP });
    await admin.database().ref("denetim").push({ tur: "claude", baslik: "Fabrika konumu girildi (sevkiyat rotası)", detay: k.lat + ", " + k.lon, yol: "ayarlar/fabrika", id: "", kim: "🤖 Claude (sahibin talimatı)", uid: "claude", zaman: admin.database.ServerValue.TIMESTAMP }).catch(() => { });
    log(`✅ Fabrika konumu kaydedildi: ${k.lat}, ${k.lon}`); }
}

/* adres-konum (v138): kayıtlı sevk adreslerinin harita linklerini (çoğu kısa link) bir kere koordinata çevirir → sevkAdresleri/{id}/konum {lat,lon,u}.
   u = çözülen link; link sonradan değişirse uygulama eski konumu kullanmaz. Adres metnine/adına DOKUNULMAZ. Log'a yalnız sayılar. */
if (islem === "adres-konum") {
  const D = admin.database(), A = (await D.ref("sevkAdresleri").once("value")).val() || {}, up = {};
  let n = 0, bul = 0, yok = 0, yak = 0;
  for (const [id, a] of Object.entries(A)) {
    const u = a && a.haritaUrl; if (!u) continue;
    if (a.konum && a.konum.u === u && isFinite(+a.konum.lat) && TR(a.konum)) continue;
    if (a.konum && !TR(a.konum)) up["sevkAdresleri/" + id + "/konum"] = null; /* v138 düzeltme: Türkiye dışı (yanlış) konumu sil */
    n++; const k = await haritaKonum(u);
    if (k) { bul++; up["sevkAdresleri/" + id + "/konum"] = Object.assign({ lat: k.lat, lon: k.lon, u }, k.yer ? { yer: k.yer } : {}, k.yaklasik ? { yaklasik: true } : {}); if (k.yaklasik) yak++; } else yok++;
    await new Promise(r => setTimeout(r, 400));
  }
  if (Object.keys(up).length) await D.ref().update(up);
  log(`✅ Adres konumları: ${n} link denendi • ${bul} konum bulundu (${yak} yaklaşık) • ${yok} bulunamadı`);
  fs.mkdirSync("teshis", { recursive: true }); fs.writeFileSync("teshis/adres-konum.json", JSON.stringify(IZ.filter(x => x.yol.length), null, 1));
}

/* cari-aktar (v138): ÖZEL depo mag-yonetim/aktar/cariler.json (Mikro: hareketli cariler + adres fihristi + risk) → cariler/ ve cariBakiye/ (tamamı yenilenir).
   Log'a yalnız sayılar yazılır. */
if (islem === "cari-aktar") {
  const T = env("YONETIM_TOKEN"); if (!T || !env("SA")) { log("❌ YONETIM_TOKEN ya da Firebase anahtarı yok"); process.exit(1); }
  const r = await fetch("https://api.github.com/repos/xfranerx53/mag-yonetim/contents/aktar/cariler.json", { headers: { Authorization: "Bearer " + T, Accept: "application/vnd.github.raw", "User-Agent": "mag-yonetim" } });
  if (!r.ok) { log("❌ Aktarım dosyası okunamadı:", r.status); process.exit(1); }
  const J = await r.json(), D = admin.database(), C = J.cariler || {}, B = J.bakiye || {};
  if (Object.keys(C).length < 20) { log("❌ Cari listesi beklenenden kısa, aktarılmadı"); process.exit(1); }
  await D.ref("cariler").set(C); await D.ref("cariBakiye").set(B);
  await D.ref("ayarlar/cariAktar").set({ z: admin.database.ServerValue.TIMESTAMP, n: Object.keys(C).length, kaynak: String(J.kaynak || "").slice(0, 200) });
  await D.ref("denetim").push({ tur: "claude", baslik: "Mikro cari listesi aktarıldı", detay: Object.keys(C).length + " cari, " + Object.keys(B).length + " bakiye", yol: "cariler", id: "", kim: "🤖 Claude (Mikro aktarımı)", uid: "claude", zaman: admin.database.ServerValue.TIMESTAMP }).catch(() => { });
  log(`✅ Cari aktarımı: ${Object.keys(C).length} cari • ${Object.keys(B).length} bakiye`);
}

/* oneri-aktar (v139): ÖZEL depo mag-yonetim/aktar/wp-adresler.json (WhatsApp «Mag Adresler» grubu: ad + harita linki) → adresOneri/{id}.
   Kayıtlı adreslerde aynı link varsa atlanır. Linkten konum çıkarılabiliyorsa (Türkiye içi) eklenir. Adres defterine KAYDETMEZ:
   kullanıcı Adres tamamlama › «WhatsApp'tan» sekmesinde tek tek onaylar. Log'a yalnız sayılar. */
if (islem === "oneri-aktar") {
  const T = env("YONETIM_TOKEN"); if (!T || !env("SA")) { log("❌ YONETIM_TOKEN ya da Firebase anahtarı yok"); process.exit(1); }
  const r = await fetch("https://api.github.com/repos/xfranerx53/mag-yonetim/contents/aktar/wp-adresler.json", { headers: { Authorization: "Bearer " + T, Accept: "application/vnd.github.raw", "User-Agent": "mag-yonetim" } });
  if (!r.ok) { log("❌ Aktarım dosyası okunamadı:", r.status); process.exit(1); }
  const J = await r.json(), D = admin.database(), A = (await D.ref("sevkAdresleri").once("value")).val() || {}, var_ = {}, O = {};
  Object.values(A).forEach(a => { if (a && a.haritaUrl) var_[String(a.haritaUrl).trim()] = 1; });
  let n = 0, kon = 0, atla = 0;
  for (const o of (J.oneri || [])) {
    if (!o || !o.link) continue; if (var_[o.link]) { atla++; continue; }
    const k = await haritaKonum(o.link); if (k) kon++;
    const id = D.ref("adresOneri").push().key;
    O[id] = { ad: String(o.ad || "").slice(0, 100), link: String(o.link).slice(0, 500), z: String(o.z || "").slice(0, 10), kim: String(o.kim || "").slice(0, 30), kaynak: "WhatsApp " + (o.kay === "Sevkiyat" ? "Sevkiyat" : "Adresler") + " grubu" };
    if (k) O[id].konum = { lat: k.lat, lon: k.lon, u: O[id].link };
    n++; if (!k) await new Promise(r => setTimeout(r, 300));
  }
  await D.ref("adresOneri").set(O);
  await D.ref("denetim").push({ tur: "claude", baslik: "WhatsApp adres önerileri aktarıldı", detay: n + " öneri (" + kon + " konumlu), " + atla + " zaten kayıtlı", yol: "adresOneri", id: "", kim: "🤖 Claude (sahibin gönderdiği sohbet)", uid: "claude", zaman: admin.database.ServerValue.TIMESTAMP }).catch(() => { });
  log(`✅ Öneriler: ${n} aktarıldı • ${kon} konumlu • ${atla} zaten kayıtlı`);
}

/* oneri-kaydet (v141): SAHİBİN TALİMATIYLA («WhatsApp'tan tamamını ekle») adresOneri/ → sevkAdresleri/.
   Aynı (çekirdek) ada sahip öneriler tek adres olur (konumlu ve en yeni seçilir); adres defterinde aynı çekirdek ad varsa EKLENMEZ («zaten kayıtlı»).
   Adsız öneriler öneri olarak kalır. Mikro carisinin çekirdek adı birebir aynıysa cariKod bağlanır. Rapor ÖZEL depoya (teshis/oneri-kaydet.json). */
if (islem === "oneri-kaydet") {
  const D = admin.database(), A = (await D.ref("sevkAdresleri").once("value")).val() || {}, O = (await D.ref("adresOneri").once("value")).val() || {}, C = (await D.ref("cariler").once("value")).val() || {};
  const trn = x => String(x == null ? "" : x).toLocaleLowerCase("tr-TR").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ö/g, "o").replace(/ü/g, "u").normalize("NFD").replace(/[̀-ͯ]/g, "");
  const nrm = x => trn(x).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const GN = /\b(ltd|sti|a s|as|tic|san|ve|ins|paz|sanayi|ticaret|limited|sirketi|anonim|ith|ihr|dis|mam|gida|ambalaj|plastik|unlu|mamulleri|insaat|pazarlama|tekstil|ekmek|firin|kuruyemis|matbaacilik|konumu|konum|adresi|adres)\b/g;
  const cek = x => nrm(x).replace(GN, " ").replace(/\b\d+\b/g, " ").replace(/\s+/g, " ").trim();
  const kayitli = {}; Object.values(A).forEach(a => { const k = cek(a && a.ad); if (k && !kayitli[k]) kayitli[k] = a.ad; });
  const cariK = {}; Object.values(C).forEach(c => { if (c && c.tur === "m") { const k = cek(c.ad); if (k && !cariK[k]) cariK[k] = c.kod; } });
  const grup = {}, R = { eklendi: [], zatenKayitli: [], tekrar: [], adsiz: 0 };
  for (const [id, o] of Object.entries(O)) { if (!o || !String(o.ad || "").trim()) { R.adsiz++; continue; } const k = cek(o.ad) || nrm(o.ad); (grup[k] = grup[k] || []).push([id, o]); }
  const up = {}, ts = admin.database.ServerValue.TIMESTAMP;
  for (const [k, L] of Object.entries(grup)) {
    L.sort((x, y) => (!!y[1].konum - !!x[1].konum) || String(y[1].z || "").localeCompare(String(x[1].z || "")));
    if (kayitli[k]) { R.zatenKayitli.push(L[0][1].ad + " → " + kayitli[k]); L.forEach(([id]) => up["adresOneri/" + id] = null); continue; }
    const [, o] = L[0], nid = D.ref("sevkAdresleri").push().key;
    const x = { ad: String(o.ad).trim().slice(0, 100), haritaUrl: String(o.link).slice(0, 500), sehir: "", tel: "", adres: "", yetkili: "", tel2: "",
      not: (o.kaynak || "WhatsApp") + "ndan" + (o.z ? " (" + o.z.split("-").reverse().join(".") + ")" : ""), ekleyen: "🤖 Claude (sahibin talimatı, WhatsApp yedeği)", ekleyenUid: "claude", eklenmeTarihi: ts };
    if (o.konum && isFinite(+o.konum.lat)) x.konum = { lat: +o.konum.lat, lon: +o.konum.lon, u: x.haritaUrl };
    if (cariK[k]) x.cariKod = cariK[k];
    up["sevkAdresleri/" + nid] = x; L.forEach(([id]) => up["adresOneri/" + id] = null); kayitli[k] = x.ad;
    R.eklendi.push({ ad: x.ad, konum: !!x.konum, cari: !!x.cariKod, kaynak: o.kaynak || "" }); if (L.length > 1) R.tekrar.push(x.ad + " (" + L.length + " link)");
  }
  if (Object.keys(up).length) await D.ref().update(up);
  await D.ref("denetim").push({ tur: "claude", baslik: "WhatsApp adresleri adres defterine eklendi", detay: R.eklendi.length + " adres (" + R.eklendi.filter(x => x.konum).length + " konumlu), " + R.zatenKayitli.length + " zaten kayıtlı", yol: "sevkAdresleri", id: "", kim: "🤖 Claude (sahibin talimatı)", uid: "claude", zaman: ts }).catch(() => { });
  fs.mkdirSync("teshis", { recursive: true }); fs.writeFileSync("teshis/oneri-kaydet.json", JSON.stringify(R, null, 1));
  log(`✅ Eklendi: ${R.eklendi.length} adres (${R.eklendi.filter(x => x.konum).length} konumlu, ${R.eklendi.filter(x => x.cari).length} Mikro'ya bağlı) • zaten kayıtlı ${R.zatenKayitli.length} • adsız öneri ${R.adsiz}`);
}

/* link-coz (v143, teşhis): yonetim-istek.txt 2.+ satırlardaki harita linklerinin yönlendirme zinciri, !3d/@ koordinatı ve 1s0x (S2) koordinatı → ÖZEL depo teshis/link-coz.json */
if (islem === "link-coz") {
  const L = fs.readFileSync(".github/yonetim-istek.txt", "utf8").split(/\r?\n/).slice(1).map(x => x.trim()).filter(Boolean), out = [];
  for (const l of L) { let cur = l; const o = { link: l, yol: [] };
    for (let i = 0; i < 8; i++) { const r = await fetch(cur, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36", "Accept-Language": "tr-TR,tr;q=0.9" } });
      const loc = r.headers.get("location"); o.yol.push(r.status + " " + (loc || "")); if (r.status >= 300 && r.status < 400 && loc) { cur = new URL(loc, cur).href; continue; } break; }
    const t = decodeURIComponent(o.yol.join(" ")); o.koord = koordBul(t); o.ftid = ftidKonum(t); o.sonuc = await haritaKonum(l); try { const q = yerYazi(o.yol.join(" ")) || "MAG AMBALAJ A.Ş."; const r = await fetch("https://www.google.com/search?tbm=map&hl=tr&gl=tr&q=" + encodeURIComponent(q), { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36", "Accept-Language": "tr-TR,tr;q=0.9", Cookie: "CONSENT=YES+cb; SOCS=CAI" } }); const t = await r.text(); o.tbm = r.status + " boy " + t.length + " " + (t.match(/\[null,null,4[01]\.\d+,2[6-9]\.\d+\]/g) || []).slice(0, 5).join(" ") + " | " + t.slice(0, 120).replace(/\s+/g, " "); } catch (e) { o.tbm = String(e); } out.push(o); }
  fs.mkdirSync("teshis", { recursive: true }); fs.writeFileSync("teshis/link-coz.json", JSON.stringify(out, null, 1)); log("✅ link-coz: " + out.length + " link");
}

process.exit(hata ? 1 : 0);
