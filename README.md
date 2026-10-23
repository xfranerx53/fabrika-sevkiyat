# fabrika-sevkiyat
Stok ve Sevkiyat Takip (MAG AMBALAJ) — https://xfranerx53.github.io/fabrika-sevkiyat/

Devam eden çalışma için önce `PROJE-NOTLARI.md` dosyasını okuyun.

## Dosyalar
- `index.html` (sayfa yapısı), `style.css` (görünüm), `*.js` (app, raporlar, etiket, qr, talimat, tahsilat, arama, saat, diyalog, foto-onizleme, sw-kayit), `sw.js`, `manifest.webmanifest`, ikonlar: siteye yüklenen dosyalar (GitHub)
- Dosya değiştirince `index.html` ve `sw.js` içindeki `?v=79` ile `fabrika-v79` sayısı birlikte artırılır (tarayıcı önbelleği için). Bunu `node kontrol.js --artir` yapar.
- `kontrol.js`: teslim öncesi otomatik kontrol aracı (siteyi etkilemez)
- `rules.json`: Firebase **Realtime Database > Kurallar** sekmesine yapıştırılır
- `index.js` + `package.json`: isteğe bağlı şifre sıfırlama Cloud Function'ı (Firebase'e ayrıca deploy edilir)

## Yedek
Yönetici > Yedekleme: JSON / Excel indirme. Ayrıca Firebase > Realtime Database > Backups (Blaze planı) ile günlük otomatik yedek açın.
JSON yedeği Firebase Konsolu > Realtime Database > ⋮ > "JSON'u içe aktar" ile geri yüklenir.
