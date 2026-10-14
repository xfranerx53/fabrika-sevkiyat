// kontrol.js — Teslimat öncesi otomatik kontrol (SADECE Claude çalıştırır; siteyi etkilemez)
//
//   node kontrol.js            -> tüm kontrolleri yapar, sorun varsa listeler
//   node kontrol.js --artir    -> sürüm numarasını 1 artırır (index.html + sw.js birlikte), sonra kontrol eder
//
// Kontroller:
//  1. Tüm .js dosyalarında yazım (sözdizimi) hatası var mı
//  2. index.html'in çağırdığı dosyalar gerçekten var mı
//  3. ?v=NN numarası index.html ve sw.js içinde aynı mı, CACHE='fabrika-vNN' ile uyuşuyor mu
//  4. sw.js önbellek listesi index.html'deki dosyaları kapsıyor mu
//  5. rules.json ve manifest geçerli JSON mu, ikonlar var mı
//  6. app.js'teki roller ile rules.json'daki roller aynı mı
//  7. app.js'teki izin anahtarları ile rules.json'daki izin anahtarları aynı mı
//  8. PROJE-NOTLARI.md'de yazan sürüm, gerçek sürümle aynı mı

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const KOK = __dirname;
const oku = (f) => fs.readFileSync(path.join(KOK, f), "utf8");
const yaz = (f, t) => fs.writeFileSync(path.join(KOK, f), t, "utf8");
const var_mi = (f) => fs.existsSync(path.join(KOK, f));

const hatalar = [];
const uyarilar = [];
const tamam = [];
const hata = (m) => hatalar.push(m);
const uyari = (m) => uyarilar.push(m);
const iyi = (m) => tamam.push(m);

// ---------- Sürüm artırma ----------
if (process.argv.includes("--artir")) {
  const sw = oku("sw.js");
  const m = sw.match(/const CACHE = 'fabrika-v(\d+)'/);
  if (!m) {
    console.log("HATA: sw.js içinde CACHE satırı bulunamadı.");
    process.exit(1);
  }
  const eski = +m[1], yeni = eski + 1;
  yaz("sw.js", sw.replace(/fabrika-v\d+/, "fabrika-v" + yeni).replace(/const V = '\?v=\d+'/, "const V = '?v=" + yeni + "'"));
  yaz("index.html", oku("index.html").replace(/\?v=\d+/g, "?v=" + yeni));
  // README'deki örnek sürüm ifadelerini de güncelle
  if (var_mi("README.md")) yaz("README.md", oku("README.md").replace(/\?v=\d+/g, "?v=" + yeni).replace(/fabrika-v\d+/g, "fabrika-v" + yeni));
  console.log("Sürüm artırıldı: v" + eski + " -> v" + yeni + "  (PROJE-NOTLARI.md içindeki sürümü de güncellemeyi unutma)");
}

// ---------- 1. Sözdizimi ----------
const jsler = fs.readdirSync(KOK).filter((f) => f.endsWith(".js"));
for (const f of jsler) {
  try {
    execFileSync(process.execPath, ["--check", path.join(KOK, f)], { stdio: "pipe" });
  } catch (e) {
    hata("Yazım hatası: " + f + " -> " + String(e.stderr || e.message).split("\n").slice(0, 4).join(" | "));
  }
}
if (!hatalar.length) iyi("Tüm .js dosyalarında yazım hatası yok (" + jsler.length + " dosya)");

// ---------- 2-3-4. index.html / sw.js ----------
const html = oku("index.html");
const sw = oku("sw.js");
const yerel = [];
for (const m of html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g)) {
  const u = m[1];
  if (/^https?:/.test(u)) continue;
  yerel.push(u);
}
for (const u of yerel) {
  const dosya = u.split("?")[0];
  if (!var_mi(dosya)) hata("index.html'in çağırdığı dosya yok: " + dosya);
}
iyi("index.html'in çağırdığı " + yerel.length + " yerel dosya mevcut mu kontrol edildi");

const vler = new Set();
for (const m of html.matchAll(/\?v=(\d+)/g)) vler.add(m[1]);
const swV = (sw.match(/const V = '\?v=(\d+)'/) || [])[1];
const swC = (sw.match(/const CACHE = 'fabrika-v(\d+)'/) || [])[1];
if (vler.size > 1) hata("index.html içinde farklı ?v= numaraları var: " + [...vler].join(", "));
if (!swV || !swC) hata("sw.js içinde CACHE veya V bulunamadı");
else {
  if (swV !== swC) hata("sw.js içinde CACHE (v" + swC + ") ile V (?v=" + swV + ") farklı");
  if (vler.size === 1 && [...vler][0] !== swV) hata("index.html ?v=" + [...vler][0] + " ama sw.js v" + swV + " — ikisi aynı olmalı (node kontrol.js --artir)");
  if (!hatalar.some((h) => h.includes("?v="))) iyi("Sürüm numarası tutarlı: v" + swV);
}
for (const u of yerel) {
  const dosya = u.split("?")[0];
  if (dosya === "index.html") continue;
  if (!sw.includes(dosya)) uyari("sw.js önbellek listesinde yok (çevrimdışı açılmaz): " + dosya);
}
for (const m of sw.matchAll(/'\.\/([^'?]+)/g)) {
  if (m[1] && !var_mi(m[1])) hata("sw.js önbellek listesindeki dosya yok: " + m[1]);
}

// ---------- 5. JSON dosyaları ----------
let rules = null, manifest = null;
try { rules = JSON.parse(oku("rules.json")); if (!rules.rules) hata("rules.json içinde 'rules' kökü yok"); else iyi("rules.json geçerli JSON (" + Object.keys(rules.rules).length + " ana yol)"); } catch (e) { hata("rules.json geçersiz JSON: " + e.message); }
try { manifest = JSON.parse(oku("manifest.webmanifest")); (manifest.icons || []).forEach((i) => { if (!var_mi(i.src)) hata("manifest ikonu yok: " + i.src); }); iyi("manifest geçerli"); } catch (e) { hata("manifest geçersiz: " + e.message); }

// ---------- 6-7. Roller ve izinler: app.js <-> rules.json ----------
if (rules) {
  const app = oku("app.js");
  const yetkiBlok = (app.match(/const YETKI=\{([\s\S]*?)\n\};/) || [])[1] || "";
  const appRoller = [...yetkiBlok.matchAll(/^\s*"([^"]+)":/gm)].map((m) => m[1]).sort();
  const kRol = JSON.stringify(rules.rules.kullanicilar.$uid.rol[".validate"] || "");
  const rulesRoller = [...kRol.matchAll(/=== '([^']+)'/g)].map((m) => m[1]).sort();
  if (!appRoller.length) uyari("app.js içinde YETKI tablosu okunamadı (yapı değişmiş olabilir)");
  else if (JSON.stringify(appRoller) !== JSON.stringify(rulesRoller)) hata("Roller uyuşmuyor!  app.js: [" + appRoller.join(", ") + "]  rules.json: [" + rulesRoller.join(", ") + "]");
  else iyi("Roller app.js ve rules.json'da aynı (" + appRoller.length + " rol)");

  const kIz = JSON.stringify(rules.rules.kullanicilar.$uid.izin.$k[".validate"] || "");
  const rulesIzin = [...kIz.matchAll(/=== '([^']+)'/g)].map((m) => m[1]).sort();
  const appIzin = new Set();
  for (const m of app.matchAll(/(?:modGor|iz)\(\s*["']([a-z_A-Z]+)["']/g)) appIzin.add(m[1]);
  const yoksa = [...appIzin].filter((k) => !rulesIzin.includes(k) && /^(sevk|stok|is|rap|tah|a_\w+|isAc|isDuzenle|geriAl|isSil|fiyat)$/.test(k));
  if (yoksa.length) hata("app.js'te kullanılan izin rules.json'da tanımsız: " + yoksa.join(", "));
  else iyi("İzin anahtarları rules.json ile uyumlu (" + rulesIzin.length + " anahtar)");
}

// ---------- 8. Notlardaki sürüm ----------
if (var_mi("PROJE-NOTLARI.md") && swC) {
  const n = oku("PROJE-NOTLARI.md");
  const m = n.match(/GÜNCEL SÜRÜM:\s*\*{0,2}\s*v(\d+)/i);
  if (!m) uyari("PROJE-NOTLARI.md içinde 'GÜNCEL SÜRÜM: vNN' satırı bulunamadı");
  else if (m[1] !== swC) hata("PROJE-NOTLARI.md sürümü v" + m[1] + " ama gerçek sürüm v" + swC + " — notları güncelle");
  else iyi("PROJE-NOTLARI.md sürümü gerçek sürümle aynı");
}

// ---------- Rapor ----------
console.log("\n=== KONTROL RAPORU ===");
tamam.forEach((m) => console.log("  OK     " + m));
uyarilar.forEach((m) => console.log("  UYARI  " + m));
hatalar.forEach((m) => console.log("  HATA   " + m));
console.log(hatalar.length ? "\nSONUÇ: " + hatalar.length + " HATA VAR — teslim etme, önce düzelt." : "\nSONUÇ: Sorun yok, teslim edilebilir.");
process.exit(hatalar.length ? 1 : 0);
