[# Şifre sıfırlama fonksiyonu (isteğe bağlı)

Yönetici panelindeki "🔑 Şifre" düğmesinin çalışması için gerekir. Kurulmazsa düğme
"fonksiyon kurulu değil" uyarısı verir; kullanıcıların kendi "🔑 Şifre" (şifremi değiştir) düğmesi fonksiyonsuz da çalışır.

Gereksinim: Firebase projesi **Blaze** planında olmalı (Cloud Functions için).

1. Bilgisayarınıza Node.js 20 ve Firebase CLI kurun: `npm i -g firebase-tools`, ardından `firebase login`
2. Proje klasöründe `firebase init functions` (JavaScript seçin, mevcut projeyi `sevkiyat-fc22b` seçin,
   önerilen dosyaların üzerine **yazmayın**) — ya da bu klasörü (`functions/`) olduğu gibi kullanın ve
   proje köküne şu `firebase.json` dosyasını koyun: `{ "functions": { "source": "functions" } }`
3. `cd functions && npm install && cd ..`
4. `firebase deploy --only functions`

Fonksiyon, çağıranın veritabanında `yonetici: true` ve `onay: true` olduğunu sunucuda doğrular.
Şifre sıfırlandığında kullanıcının açık oturumları kapatılır.
](https://xfranerx53.github.io/fabrika-sevkiyat/)
