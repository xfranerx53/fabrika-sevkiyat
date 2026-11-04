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

process.exit(hata ? 1 : 0);
