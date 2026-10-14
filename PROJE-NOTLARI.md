# PROJE-NOTLARI.md — Fabrika Stok & Sevkiyat (MAG AMBALAJ)

> Bu dosya, sohbet süresi dolup YENİ bir sohbet/e-posta açıldığında Claude'un
> kaldığımız yerden devam edebilmesi için yazıldı. Claude'un sohbetler arası
> hafızası yoktur; hafıza BU DOSYA + zip'teki gerçek kodlardır.
> Her teslimatta güncellenir.

**GÜNCEL SÜRÜM: v40**
Son güncelleme: 2026-10-14 (notlar zip'teki gerçek duruma göre baştan yazıldı)

---

## 0. CLAUDE İÇİN TALİMAT (ÖNCE BUNU OKU)

**Kullanıcı kod bilmiyor.** Tüm kod yazma/değiştirme işini Claude yapar. Kullanıcı sadece
(1) dosyaları indirip GitHub'a yükler, (2) Firebase'e kural metnini yapıştırır.
Kullanıcıyla Türkçe, sade, teknik terimsiz konuş.

### 0.1 Yeni sohbet açılışında SIRAYLA yap

1. Bu dosyayı baştan sona oku.
2. Zip'i aç. **Zip gerçektir; bu notlar ve hatırladığın her şey ikinci plandadır.**
   Zip yüklenmediyse önce iste: GitHub > Code > Download ZIP.
3. Zip'in içinde `node kontrol.js` çalıştır (Bölüm 3). Çıkan raporu oku.
4. Notlarla zip arasında fark varsa (sürüm, dosya listesi, yapı) kullanıcıya **tek cümleyle**
   söyle ve önce notları düzelt. Kullanıcı son dosyaları yüklemeyi unutmuş olabilir.
5. Kullanıcıya şunu söyle: "Zip'i inceledim, şu an sürüm vNN. Ne yapmamı istersin?"
   Sonra isteği bekle. İstek gelmeden kod değiştirme.

### 0.2 Her teslimatta uyulacak kurallar

1. **Asla "şuraya git, şunu değiştir" diye tarif etme.** Değişen dosyaları Claude düzenler ve
   **tam, hazır dosya** olarak verir (present_files ile indirilebilir). Parça/yama verme.
2. **Önce küçük adım:** İsteği mümkünse kendi başına çalışır küçük teslimatlara böl. Sohbet her an
   kesilebilir; yarım iş yeni sohbete geçmesin. İş büyükse ve bölünemiyorsa kullanıcıya söyle,
   Bölüm 9'a "yarım kalan iş" olarak yaz.
3. **Kod değiştiyse sürümü artır:** `node kontrol.js --artir` (index.html + sw.js'teki
   `?v=NN` ve `fabrika-vNN` birlikte artar). Sonra bu dosyadaki "GÜNCEL SÜRÜM" satırını da güncelle.
   Sadece PROJE-NOTLARI.md / README değiştiyse sürüm artırılmaz.
4. **Teslimden önce her seferinde `node kontrol.js` çalıştır.** "HATA" varsa teslim etme, düzelt.
5. **Yeni .js dosyası eklenirse:** `index.html`'e `<script src="x.js?v=NN">` olarak ekle
   VE `sw.js` içindeki `ASSETS` listesine ekle (yoksa çevrimdışı açılmaz).
6. **Firebase rules değişirse (yeni veri yolu, yeni rol, yeni izin, yeni alan):**
   - `rules.json`'ı güncelle ve **TAMAMINI** hem dosya olarak hem sohbette tek parça kod bloğu olarak ver.
   - Nereye yapıştırılacağını yaz: Firebase Konsolu > Realtime Database > Kurallar > hepsini sil >
     yapıştır > Yayınla.
   - Rules değişmediyse bunu açıkça söyle: "Firebase kuralı: değişmedi".
   - Yeni bir veri yolu yazılıyorsa rules'ta o yol olmak ZORUNDA, yoksa uygulama o yere yazamaz.
7. **Rol/izin eşleşmesi:** `app.js` içindeki `YETKI` tablosu ile `rules.json` aynı şeyi söylemeli.
   Rol veya izin eklenirse ikisi birlikte değişir; `kontrol.js` bunu denetler.
8. **Her teslimatın sonunda şu kısa listeyi ver (aynen bu başlıklarla):**
   - **GitHub'a yüklenecek dosyalar:** (sadece değişenlerin isimleri; PROJE-NOTLARI.md hep dahil)
   - **Firebase'e yapıştırılacak:** rules var / yok
   - **Yeni sürüm:** vNN
   - **Önce yedek al:** gerekiyorsa (veri yapısı değişiyorsa) Yönetici > Yedekleme > JSON indir
9. **Her teslimatta bu dosyayı güncelle** (Bölüm 8 günlüğüne satır, yapı değiştiyse ilgili bölüm,
   Bölüm 9 yapılacaklar) ve teslimata ekle. Güncellemeyi iş bitince değil HER teslimatta yap.
10. **Kullanıcı "yeni sohbete geçiyorum" derse:** son durumu hemen bu dosyaya yaz, güncel dosyaları
    ve notları tam ver, kısa bir "yeni sohbette yapıştır" metni hazırla.
11. **Dürüst ol:** Claude telefonda/Firebase'de deneme yapamaz; sadece kodu okuyup `kontrol.js`
    çalıştırabilir. Riskli bir değişiklikse bunu kullanıcıya söyle ve ilk kullanımda küçük test iste.
12. **Geri dönüş:** GitHub eski sürümleri saklar. Bir şey bozulursa kullanıcı sorunu anlatır, Claude
    düzeltir; gerekirse kullanıcıdan son çalışan zip'i ister.

---

## 1. Proje özeti

- **Ne:** Fabrika için stok, sipariş, iş emri ve sevkiyat takip uygulaması (telefona eklenebilen
  PWA). Firma: MAG AMBALAJ.
- **Adres (GitHub Pages):** https://xfranerx53.github.io/fabrika-sevkiyat/
- **GitHub deposu:** xfranerx53/fabrika-sevkiyat (ana dal: main)
- **Arka uç:** Firebase projesi `sevkiyat-fc22b`, **Realtime Database** (Firestore DEĞİL),
  Firebase Auth (e-posta/şifre). İstemci kütüphanesi: Firebase JS **8.10.1** (gstatic'ten yüklenir).
- **Veritabanı adresi:** https://sevkiyat-fc22b-default-rtdb.firebaseio.com
- **Dil:** Arayüz ve kod yorumları Türkçe.
- Firebase yapılandırması (`CFG`) `app.js` başındadır. Web apiKey'in kodda görünmesi normaldir;
  güvenlik `rules.json` ile sağlanır.
- Kullanıcı e-postalarını değiştirerek yeni sohbet açıyor; Claude hafızası hesaplar arası paylaşılmaz.
  Süreklilik bu dosya + zip ile sağlanır.

## 2. Dosyalar (zip'teki gerçek durum, sürüm v40)

| Dosya | Ne işe yarar | Nereye gider |
|---|---|---|
| `index.html` (~520 satır) | Sadece arayüz iskeleti (giriş, menü, sevkiyat, stok, adres, dosyalar, yönetici pencereleri). Kod yok; script'leri `?v=NN` ile çağırır | GitHub |
| `style.css` | Tüm görünüm | GitHub |
| `app.js` (~2000 satır) | Ana kod: Firebase, giriş, yetki, sevkiyat, stok, sipariş, adres, dosyalar, iş emirleri, yönetici, yedek, WhatsApp | GitHub |
| `raporlar.js` | Raporlar | GitHub |
| `etiket.js` | Etiket tasarımı/basımı | GitHub |
| `qr.js` | QR kod üretimi (kütüphane) | GitHub |
| `arama.js`, `saat.js`, `diyalog.js`, `foto-onizleme.js`, `sw-kayit.js` | Küçük yardımcılar | GitHub |
| `sw.js` | Çevrimdışı önbellek. `CACHE='fabrika-vNN'` ve `V='?v=NN'` | GitHub |
| `manifest.webmanifest`, `icon-*.png`, `apple-touch-icon.png`, `favicon-32.png` | Telefona kurulum ve ikonlar | GitHub |
| `rules.json` | Firebase kuralları metni (yedek kopya; gerçek kurallar Firebase'dedir) | GitHub + Firebase'e yapıştırılır |
| `index.js` + `package.json` | Firebase Cloud Function `sifreSifirla` (yönetici başka kullanıcının şifresini sıfırlar). Siteyle ilgisi yok | Ayrıca Firebase'e deploy edilir |
| `kontrol.js` | Teslim öncesi otomatik kontrol + sürüm artırma. **Sadece Claude çalıştırır**, siteyi etkilemez | GitHub'da durabilir |
| `README.md` | Kısa açıklama | GitHub |
| `PROJE-NOTLARI.md` | Bu dosya | GitHub |

**Önbellek kuralı:** Dosya her değiştiğinde `index.html` ve `sw.js` içindeki sürüm numarası
birlikte artmalı, yoksa telefonlar eski sürümde kalır. Bunu `node kontrol.js --artir` yapar.

## 3. kontrol.js (Claude'un teslim öncesi aracı)

- `node kontrol.js` → kontrol eder, rapor verir.
- `node kontrol.js --artir` → sürümü 1 artırır (index.html, sw.js, README), sonra kontrol eder.
- Denetlediği şeyler: tüm .js dosyalarında yazım hatası, index.html'in çağırdığı dosyaların varlığı,
  `?v` ile `fabrika-vNN` tutarlılığı, sw.js önbellek listesi, rules.json/manifest geçerliliği,
  rol ve izin listesinin app.js ↔ rules.json uyumu, bu dosyadaki "GÜNCEL SÜRÜM" satırı.
- Bilinen zararsız uyarı: `favicon-32.png` sw.js önbelleğinde yok.
- Sonuç "HATA VAR" ise teslim edilmez.

## 4. Güvenlik: CSP (İçerik Güvenlik Politikası)

`index.html` başındaki `Content-Security-Policy` meta etiketi **hash kullanmaz** (eski sistemde
satır içi script hash'i vardı, artık yok; `csp-guncelle.js` kaldırıldı). Script'ler ayrı dosya
olduğu için `script-src 'self'` yeterlidir. İzin verilen dış kaynaklar: gstatic (Firebase),
cdnjs, google, googleapis, firebaseapp. **Yeni bir dış site/kütüphane eklenirse** o alan adı
CSP'deki ilgili listeye eklenmeli, yoksa tarayıcı engeller.
Satır içi `<script>` yazma; kodu `.js` dosyasına koy.

## 5. Veritabanı yapısı (Realtime Database yolları)

| Yol | İçerik |
|---|---|
| `kullanicilar/{uid}` | Kullanıcı: `ad`, `kullanici`, `rol`, `onay`(bool), `yonetici`(bool), `izin{...}` |
| `urunler/{id}` | Sevkiyat ürünleri (`kg`, `paket`, `durum`, `foto`, `fotolar`, `irsaliye`, `irsEkler`, `irsTur`, `irsNot`, `teslimEden`, `irsaliyeCeken`, `irsaliyeTarihi`, `ekleyenUid`) |
| `fotoTam/{k}` | Tam boy fotoğraflar (küçük resim `urunler`de, tam boy burada) |
| `dosyalar/{id}`, `dosyaFoto/{id}` | Onaylanıp arşive taşınan sevkiyatlar ve fotoğrafları |
| `stokKalem/{id}` | Stok kalemleri (`miktar`, `mik/{b}`, `foto`, `fotolar`) |
| `stokHareket/{id}` | Stok giriş/çıkış hareketleri (yalnız eklenir, değiştirilemez) |
| `tedarikciler/{id}` | Tedarikçiler |
| `siparisler/{id}` | Satın alma siparişleri (`satirlar/{i}`: `miktar`, `gelen`) |
| `sevkSorumlulari/{uid}` | Sevkiyat sorumluları (`ad`) |
| `sevkAdresleri/{id}` | Kayıtlı sevk adresleri |
| `fiyatlar/{m}/{id}` | Fiyatlar (`tutar`, `kdv`, `f`); sadece yönetici okur/yazar |
| `isEmirleri/{id}` | İş emirleri (aşama akışı Bölüm 7) |
| `isHareket/{id}/{h}` | İş emri hareket kayıtları (yalnız eklenir) |
| `etiketGecmis/{id}/{h}`, `etiketSablon/{m}/{k}` | Etiket basım geçmişi ve şablonlar |
| `ayarlar/etiket` | Etiket ayarı (`w`, `h`, `mag`) |
| `cop/{id}` | Çöp kutusu: silinenlerin yedeği (yönetici geri yükler) |
| `denetim/{id}` | Denetim günlüğü (kim ne yaptı), sadece yönetici okur |

Fotoğraflar `data:image/jpeg;base64,...` metni olarak tutulur (300.000 karakter sınırı).
`rules.json` içinde 19 ana yol vardır ve yukarıdaki listeyle aynıdır.
Yeni bir yol eklenirse: rules'a ekle; yedekleme (`bkIndir`/`bkCalistir`) ve silme/çöp (`silCop`)
akışlarına eklenmesi gerekip gerekmediğini düşün.

## 6. Roller ve izinler

**Roller:** Depo Görevlisi, Sevkiyat Sorumlusu, Ekstruder Operatörü, Matbaa Operatörü,
Kesim Operatörü, Bobinoz Ustası, Muhasebe. Ayrıca `yonetici=true` olan **yönetici**.

**Onay:** Yeni kayıt olan kullanıcı `onay=false` başlar; yönetici onaylayana kadar hiçbir şey
göremez/yapamaz. Kullanıcı kendi kaydında `onay`, `yonetici`, `izin` alanlarını kendi kendine
açamaz (rules engeller).

**İzin anahtarları** (`kullanicilar/{uid}/izin/...`, true = rolden bağımsız ver, false = rol
varsayılanını kapat, yoksa rol varsayılanı geçerli):
`sevk`, `stok`, `is`, `rap`, `a_etiket`, `a_ekstruder`, `a_baski`, `a_kesim`, `a_depo`,
`isAc`, `isDuzenle`, `geriAl`, `isSil`, `fiyat`.

**Rol varsayılanları tek yerde:** `app.js` içindeki `YETKI` tablosu ("YETKİ TABLOSU" yorumu).
Özet:
- Depo Görevlisi: iş emirleri + stok + sevkiyat; etiket/depo aşaması; iş açar/düzenler.
- Sevkiyat Sorumlusu: sadece sevkiyat; kayıt formunu kullanamaz, başkasının kaydını yazamaz.
- Ekstruder / Matbaa / Kesim Operatörü, Bobinoz Ustası: sadece kendi aşamasını görür ve ilerletir.
- Muhasebe: iş emirleri + stok + raporlar; etiket aşaması; iş açar/düzenler; fiyat görür.
- Silme: kendi eklediğini silebilir (iş emri için `isSil` izni gerekir); yönetici hepsini.
- Yönetici-only: `kullanicilar` listesi, `fiyatlar`, `cop`, `denetim`, `dosyalar` yazma.
- `rules.json` bu yetkileri ayrıca sunucuda zorlar; sadece arayüzde gizlemek yetmez.

## 7. Uygulama ekranları ve iş akışı

- **Giriş Yap / Kayıt Ol** ekranı. Kayıt sonrası yönetici onayı beklenir.
- **Görünümler (index.html):** `vLogin`, `vWait` (onay bekleme), `vMenu`, `vApp` (stok), `vSev`
  (sevkiyat), `vAdr` (adresler), `vDos` (dosyalar).
- **Modüller:** 🚚 SEVKİYAT, 📦 STOK (üstte sekme).
- **Sevkiyat modülü:** SEVKİYATLAR (HAZIR ÜRÜNLER → SEVK EDİLECEKLER → SEVK EDİLENLER; Excel'e
  aktar), SEVK ADRESLERİ, DOSYALAR (yönetici "ONAYLA" ile arşive taşır). Ürün kartında: fotoğraf,
  irsaliye fotoğrafı (tür: irsaliye/iade/diğer), araç/sorumlu, Yol tarifi, WhatsApp ile paylaşma,
  İş emrine geri al.
- **Stok modülü:** KALEMLER (giriş/çıkış, geçmiş, yazdır), SİPARİŞLER (kategoriye göre / liste),
  TEDARİKÇİLER.
- **İş emirleri aşama akışı:** `etiket → ekstruder → (baskı varsa baski) → kesim → depo → bitti`.
  Her aşamayı ilgili rol/izin ilerletir; `geriAl` izni olanlar bir aşama geri alabilir. Biten iş
  "HAZIR ÜRÜNLER"e aktarılabilir (`bekleAktar`, `aktarildi`). İş emri seri no biçimi: `MG-0945`.
  Etiketteki QR okutulunca iş emri açılır (`?is=MG-0945`).
- **Yönetici:** yedekleme (JSON/Excel indirme), çöp kutusu (geri yükle/kalıcı sil), denetim günlüğü,
  kullanıcı yönetimi (onay, rol, izin), fiyatlar, KDV ayarı.
- **Şifre sıfırlama:** Cloud Function `sifreSifirla` (Blaze planı gerekir). Deploy durumu bilinmiyor
  (Bölüm 9).

### Kod haritası (app.js'te aranacak yorum başlıkları)

Satır numaraları kayar; bu başlıkları ara:
`AYAR: Firebase` (CFG) · `Ortak arama / filtre` · `YETKİ TABLOSU` · `Oturum` · `Veri` · `Fotoğraf` ·
`İrsaliye (Sevk Edildi)` · `Kayıt` · `Liste` · `Sevk listesine al` · `Hazır üründen iş emrine` ·
`Yönetici paneli` · `Denetim kaydı + çöp kutusu` · `Şifre değiştir` · `Yedekleme` ·
`STOK` · `TEDARİKÇİLER & SİPARİŞLER` · `SEVK ADRESLERİ` · `DOSYALAR` · `İŞ EMİRLERİ` ·
`QR` · `YAZDIRMA` · `BİLDİRİMLER + WHATSAPP`.

## 8. Değişiklik günlüğü (en yenisi en altta)

- 2026-10-14: İlk PROJE-NOTLARI.md oluşturuldu (eski yapıya göre yazılmıştı).
- 2026-10-14: Notlar zip'teki gerçek duruma göre baştan yazıldı (sürüm v40, ayrı .js dosyaları,
  hash'siz CSP, rules.json mevcut). `kontrol.js` eklendi. Site kodu değişmedi, sürüm v40 kaldı,
  rules değişmedi.
- (Yeni satırlar buraya: tarih, ne değişti, hangi dosyalar, rules değişti mi, yeni sürüm)

## 9. Yapılacaklar / yarım kalan / alınan kararlar

**Yapılacaklar (kullanıcı isteklerini buraya yaz, bitenleri günlüğe taşı):**
- (şimdilik boş)

**Yarım kalan iş (sohbet kesilirse buraya yaz: ne yapılıyordu, hangi dosyada, neresi kaldı):**
- (yok)

**Alınan kararlar:**
- Kod tabanı ayrı .js dosyalarıdır; satır içi script yazılmaz (CSP).
- Teslimat: tam dosya + (rules değiştiyse) tam rules. Parça/yama verilmez.
- Sürüm numarası her kod değişikliğinde artar (`node kontrol.js --artir`).

**Açık konular / bilinmeyenler:**
- `rules.json` zip'te var ama **gerçek kurallar Firebase Konsolu'ndadır**; ikisi farklı olabilir.
  Şüphe olursa kullanıcıdan Firebase'deki güncel metni yapıştırmasını iste ve karşılaştır.
- `index.js` ve `package.json` depo kökünde duruyor (Cloud Functions için normalde `functions/`
  içinde olmalı). Fonksiyonun Firebase'e deploy edilip edilmediği bilinmiyor; şifre sıfırlama
  gerektiğinde kullanıcıya sor.
- Firebase otomatik günlük yedek (Blaze planı) açık mı bilinmiyor.
- `sw.js` önbelleğinde `favicon-32.png` yok (zararsız).
- Önceki sohbetlerin ayrıntılı geçmişi kayıp; bilinen tek şey bu dosya ve zip.

---

## YENİ SOHBET BAŞLANGIÇ METNİ (kullanıcı bunu yeni sohbete yapıştırır, zip'i de ekler)

> Merhaba. Ben kod bilmiyorum, tüm değişiklikleri sen yapıyorsun. Ekteki zip benim
> fabrika-sevkiyat projemin GitHub'daki son hali. Önce zip içindeki PROJE-NOTLARI.md dosyasını
> oku ve Bölüm 0'daki kurallara uy: zip'i incele, kontrol.js'i çalıştır, notlarla zip arasında
> fark varsa söyle. Değişen dosyaları tam hazır ver, Firebase rules değişirse tamamını ver,
> notları güncelle. Sonra ne istediğimi bekle.
>
> Yapmak istediğim şey: ...
