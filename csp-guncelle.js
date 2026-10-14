// index.html içindeki <script>...</script> bloklarının SHA-256 özetlerini hesaplayıp
// Content-Security-Policy etiketini günceller.
// KULLANIM: index.html içindeki JavaScript'i değiştirdikten sonra:  node csp-guncelle.js
// (Çalıştırmayı unutursanız sayfa boş açılır; bu durumda komutu çalıştırıp dosyayı yeniden yükleyin.)
const fs = require("fs"), crypto = require("crypto");
const dosya = process.argv[2] || "index.html";
let html = fs.readFileSync(dosya, "utf8");
const hashler = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(m => "'sha256-" + crypto.createHash("sha256").update(m[1], "utf8").digest("base64") + "'");
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' https://*.gstatic.com https://cdnjs.cloudflare.com https://*.google.com https://*.googleapis.com https://*.firebaseapp.com " + hashler.join(" "),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob: data:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "frame-src https:",
  "worker-src 'self'", "manifest-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"
].join("; ");
const etiket = '<meta http-equiv="Content-Security-Policy" content="' + csp + '">';
if (/<meta http-equiv="Content-Security-Policy"[^>]*>/.test(html))
  html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, () => etiket);
else html = html.replace(/<meta charset="[^"]*">/, m => m + "\n" + etiket);
fs.writeFileSync(dosya, html);
console.log("CSP güncellendi: " + hashler.length + " satır içi betik özeti yazıldı.");
