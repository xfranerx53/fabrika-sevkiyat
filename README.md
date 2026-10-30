# fabrika-sevkiyat
Stok ve Sevkiyat Takip (MAG AMBALAJ) — https://xfranerx53.github.io/fabrika-sevkiyat/

**CLAUDE / yeni sohbet: önce `00-ONCE-BUNU-OKU.md`, sonra `PROJE-NOTLARI.md` dosyasını okuyun.**

## Dosyalar
- `index.html` (sayfa yapısı), `style.css` (görünüm), `*.js` (app, pano, baglanti, raporlar, etiket, qr, talimat, tahsilat, arama, saat, diyalog, foto-onizleme, sw-kayit, yazi, hesap, bildirim, surum), `sw.js`, `manifest.webmanifest`, ikonlar: siteye yüklenen dosyalar (GitHub)
- Dosya değiştirince `index.html` ve `sw.js` içindeki `?v=126` ile `fabrika-v126` sayısı birlikte artırılır (tarayıcı önbelleği için). Bunu `node kontrol.js --artir` yapar.
- `firebase.json` + `.github/workflows/yayinla.yml`: siteyi Firebase Hosting'de otomatik yayınlar (bkz. PROJE-NOTLARI.md 1.1)
- `kontrol.js`: teslim öncesi otomatik kontrol aracı (siteyi etkilemez)
- `rules.json`: Firebase **Realtime Database > Kurallar** sekmesine yapıştırılır
- `index.js` + `package.json`: isteğe bağlı şifre sıfırlama Cloud Function'ı (Firebase'e ayrıca deploy edilir)

## Yedek
Yönetici > Yedekleme: JSON / Excel indirme. Ayrıca Firebase > Realtime Database > Backups (Blaze planı) ile günlük otomatik yedek açın.
JSON yedeği Firebase Konsolu > Realtime Database > ⋮ > "JSON'u içe aktar" ile geri yüklenir.

## Kapalıyken bildirim (v123)
`cloudflare/bildirim-worker.js` siteye yüklenmez; Cloudflare Workers'a yapıştırılır (kurulum: PROJE-NOTLARI.md Bölüm 9).
