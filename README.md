# fabrika-sevkiyat
Stok ve Sevkiyat Takip — https://xfranerx53.github.io/fabrika-sevkiyat/

## Dosyalar
- `index.html`, `sw.js`, `manifest.webmanifest`, ikonlar: siteye yüklenen dosyalar (GitHub)
- `rules.json`: Firebase **Realtime Database > Kurallar** sekmesine yapıştırılır
- `functions/`: isteğe bağlı şifre sıfırlama fonksiyonu (bkz. `functions/README.md`)

## Yedek
Yönetici > Yedekleme: JSON / Excel indirme. Ayrıca Firebase > Realtime Database > Backups (Blaze planı) ile günlük otomatik yedek açın.
JSON yedeği Firebase Konsolu > Realtime Database > ⋮ > "JSON'u içe aktar" ile geri yüklenir.
