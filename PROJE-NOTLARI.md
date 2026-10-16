# PROJE-NOTLARI.md — Fabrika Stok & Sevkiyat (MAG AMBALAJ)

> Bu dosya, sohbet süresi dolup YENİ bir sohbet/e-posta açıldığında Claude'un
> kaldığımız yerden devam edebilmesi için yazıldı. Claude'un sohbetler arası
> hafızası yoktur; hafıza BU DOSYA + zip'teki gerçek kodlardır.
> Her teslimatta güncellenir.

**GÜNCEL SÜRÜM: v62**
Son güncelleme: 2026-10-15 (v53: etiket çalışma şekli netleştirildi, büyük varsayılan 100×80, "Yazıcıya giden sayfa" satırı)

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

## 2. Dosyalar (zip'teki gerçek durum, sürüm v62)

| Dosya | Ne işe yarar | Nereye gider |
|---|---|---|
| `index.html` (~520 satır) | Sadece arayüz iskeleti (giriş, menü, sevkiyat, stok, adres, dosyalar, yönetici pencereleri). Kod yok; script'leri `?v=NN` ile çağırır | GitHub |
| `style.css` | Tüm görünüm | GitHub |
| `app.js` (~2000 satır) | Ana kod: Firebase, giriş, yetki, sevkiyat, stok, sipariş, adres, dosyalar, iş emirleri, yönetici, yedek, WhatsApp | GitHub |
| `raporlar.js` | Raporlar | GitHub |
| `etiket.js` | Etiket tasarımı/basımı | GitHub |
| `qr.js` | QR kod üretimi (kütüphane) | GitHub |
| `talimat.js` | Sevkiyat talimatları (Bölüm 7): yönetici/Depo Görevlisi sevkiyat sorumlusuna iş verir, o "Yaptım" der | GitHub |
| `tahsilat.js` | Tahsilat bölümü (Bölüm 7): WhatsApp "MAG TAHSİLAT" grubunun yerine geçer. Ofis talep açar, sahadaki kişi "Tahsil ettim" der | GitHub |
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
| `sevkTalimat/{id}` | Sevkiyat talimatları: `metin`, `hedefUid` (`*`=tüm sorumlular), `hedefAd`, `atayan`, `atayanUid`, `zaman`, `durum` (`bekliyor`/`yapildi`), `yapan`, `yapanUid`, `yapilmaZaman`, `fotolar` (en fazla 6 küçültülmüş jpeg), `adres`, `haritaUrl`, `adresAd` (isteğe bağlı) |
| `tahsilatlar/{id}` | Tahsilat kayıtları: `cari`, `durum` (`bekliyor`/`alindi`), `not`, `talepUid`, `talepEden`, `zaman`, `talepTur` (`talep`/`dogrudan`); alınınca: `nakit`, `cek` (₺, yalnız >0 olanlar yazılır), `makbuzNo`, `alan`, `alanUid`, `alinmaZaman`, `alanNot`, `fotolar` (en fazla 6 küçültülmüş jpeg). `zaman` üzerinde indeks var, uygulama son 300 kaydı okur. v47: `fotolar` önizleme+`#fotoTam` anahtarı olabilir; düzeltmede `duzenleyen`, `duzenleyenUid`, `duzenlemeZaman`, `duzenlemeNot` |
| `etiketGecmis/{id}/{h}`, `etiketSablon/{m}/{k}` | Etiket basım geçmişi ve şablonlar |
| `ayarlar/etiket` | Etiket ayarı (`w`, `h`, `mag`) |
| `cop/{id}` | Çöp kutusu: silinenlerin yedeği (yönetici geri yükler) |
| `denetim/{id}` | Denetim günlüğü (kim ne yaptı), sadece yönetici okur |

Fotoğraflar `data:image/jpeg;base64,...` metni olarak tutulur (300.000 karakter sınırı).
`rules.json` içinde 21 ana yol vardır ve yukarıdaki listeyle aynıdır.
Yeni bir yol eklenirse: rules'a ekle; yedekleme (`bkIndir`/`bkCalistir`) ve silme/çöp (`silCop`)
akışlarına eklenmesi gerekip gerekmediğini düşün.

## 6. Roller ve izinler

**Roller:** Depo Görevlisi, Sevkiyat Sorumlusu, Ekstruder Operatörü, Matbaa Operatörü,
Kesim Operatörü, Muhasebe. (Bobinoz Ustası rolü v51'de kaldırıldı: Ekstruder Operatörü ile aynı.) Ayrıca `yonetici=true` olan **yönetici**.

**Onay:** Yeni kayıt olan kullanıcı `onay=false` başlar; yönetici onaylayana kadar hiçbir şey
göremez/yapamaz. Kullanıcı kendi kaydında `onay`, `yonetici`, `izin` alanlarını kendi kendine
açamaz (rules engeller).

**İzin anahtarları** (`kullanicilar/{uid}/izin/...`, true = rolden bağımsız ver, false = rol
varsayılanını kapat, yoksa rol varsayılanı geçerli):
`sevk`, `stok`, `is`, `rap`, `tah`, `a_etiket`, `a_ekstruder`, `a_baski`, `a_kesim`, `a_depo`,
`isAc`, `isDuzenle`, `geriAl`, `isSil`, `fiyat`.
(**`tah` = Tahsilat & talimat (v47).** Tahsilat ve Talimatlar Sevkiyat içinde sekmedir; `sevk` yetkisi olan görür. `tah` izni olan ama `sevk`'i olmayan kişi (varsayılan: **Muhasebe**) ana menüde ayrı 💰 TAHSİLAT düğmesi görür; içinde yalnız TAHSİLAT ve TALİMATLAR sekmeleri vardır. Muhasebe tahsilat talebi açabilir, tahsil edildi diyebilir; talimatları yalnız okur. Kodda `tahGor()=modGor("sevk")||modGor("tah")`.)

**Rol varsayılanları tek yerde:** `app.js` içindeki `YETKI` tablosu ("YETKİ TABLOSU" yorumu).
Özet:
- Depo Görevlisi: iş emirleri + stok + sevkiyat; etiket/depo aşaması; iş açar/düzenler.
- Sevkiyat Sorumlusu: sadece sevkiyat; kayıt formunu kullanamaz, başkasının kaydını yazamaz.
- Ekstruder / Matbaa / Kesim Operatörü: Üretim bölümünde TÜM aşamaları görür (birbirlerini izleyebilir) ama sadece kendi aşamasını ilerletir (v51).
- Muhasebe: iş emirleri + stok + raporlar + tahsilat/talimat (`tah`); etiket aşaması; iş açar/düzenler; fiyat görür.
- Silme: kendi eklediğini silebilir (iş emri için `isSil` izni gerekir); yönetici hepsini.
- Yönetici-only: `kullanicilar` listesi, `fiyatlar`, `cop`, `denetim`, `dosyalar` yazma.
- `rules.json` bu yetkileri ayrıca sunucuda zorlar; sadece arayüzde gizlemek yetmez.

## 7. Uygulama ekranları ve iş akışı

- **Giriş Yap / Kayıt Ol** ekranı. Kayıt sonrası yönetici onayı beklenir.
- **Görünümler (index.html):** `vLogin`, `vWait` (onay bekleme), `vMenu`, `vApp` (stok), `vSev`
  (sevkiyat), `vAdr` (adresler), `vDos` (dosyalar).
- **Modüller:** 🚚 SEVKİYAT, 📦 STOK (üstte sekme).
- **Sevkiyat sekmeleri (v45):** 🚚 SEVKİYATLAR · 📋 TALİMATLAR · 💰 TAHSİLAT · 📍 SEVK ADRESLERİ (`vtabs`, `vTabSet`). **📁 DOSYALAR artık İŞ EMİRLERİ bölümünde** (üstte İŞ EMİRLERİ / DOSYALAR sekmesi `isMT`, `isMTSet`; `sevk` veya `rap` yetkisi olan görür, operatörler görmez). Sevkiyat kartındaki "ONAYLA" yine sevkiyatta, onaylananlar Dosyalar'a düşer.
- **Sevkiyat modülü:** SEVKİYATLAR (HAZIR ÜRÜNLER → SEVK EDİLECEKLER → SEVK EDİLENLER; Excel'e
  aktar), SEVK ADRESLERİ, DOSYALAR (yönetici "ONAYLA" ile arşive taşır). Ürün kartında: fotoğraf,
  irsaliye fotoğrafı (tür: irsaliye/iade/diğer), araç/sorumlu, Yol tarifi, WhatsApp ile paylaşma,
  İş emrine geri al.
- **Sevkiyat talimatları:** artık ayrı "📋 TALİMATLAR" sekmesi (`vTal`; sekme adında bekleyen sayısı görünür). İçinde ⏳ BEKLEYENLER / ✓ TAMAMLANANLAR alt sekmeleri var (tahsilat gibi); tamamlananlar son 50 talimat içinden listelenir. Yönetici ve Depo Görevlisi
  "＋ Yeni talimat" ile iş yazar (örn. "A fabrikasından masura alınacak") ve en fazla 6 fotoğraf ekler (✖ ile kaldırılır; kamera/galeri).
  İsteğe bağlı adres: kayıtlı sevk adreslerinde arayıp ekle (`sAdr`) veya "Haritada Seç" (Google Maps linki/adres); kartta "🗺️ Harita / Yol tarifi".
  "Kime" seçimi yok: talimat tüm sevkiyat sorumlularına gider (kayıtta `hedefUid:"*"`; eski kişiye özel kayıtlar hâlâ çalışır).
  Sevkiyat sorumlusu kendine/herkese verilenleri görür, "✓ Yaptım" der (yapan + saat kaydolur), "↩ Geri al" yapabilir.
  Silmeyi yönetici veya talimatı yazan yapar. Kod: `talimat.js` (+ `app.js`'te `bildBaslat/bildDurdur` içinde çağrı). Yeni izin anahtarı yok:
  yazma yetkisi `rules.json`'da rol bazlı (yönetici + Depo Görevlisi). Yedeğe (`BK_DUGUM`) dahil.
- **Tahsilat (v44, v45'te Sevkiyat sekmesi oldu):** Sevkiyat içinde 💰 TAHSİLAT sekmesi (ana menüde ayrı bölüm yok). Kod: `tahsilat.js`, panel `vTah`, pencere `dTah` (index.html). WhatsApp tahsilat grubundaki akışın karşılığı:
  - **＋ Tahsilat talebi:** ofis firma + not yazar ("Çek hazır, sevkiyat uygunluğuna göre alalım", "Kaşe imzalı ekstre ile gidilsin"). Kayıt `bekliyor` olur, ⏳ BEKLEYENLER'de görünür.
  - **✓ Tahsil ettim:** sahadaki kişi bekleyen talepte (veya talep olmadan "✓ Tahsil ettim" düğmesiyle) nakit ve/veya çek tutarı (en az biri), makbuz no, makbuz/çek fotoğrafı (en fazla 6), not girer. Kayıt `alindi` olur, ✓ ALINANLAR'a geçer.
  - ✓ ALINANLAR: dönem seçilir (Bugün / Son 7 gün / Bu ay / Hepsi), üstte nakit + çek + toplam gösterilir. Arama kutusu firma, makbuz no, not, kişi içinde arar.
  - Tutar yazımı: `110.059` = 110059, `11.500,50` = 11500,5 (Türkçe biçim).
  - Silme: kaydı açan veya yönetici. **v47: silinen kayıt `cop`'a taşınır (başlıkta firma + tutar) ve `denetim`'e yazılır**; yönetici Çöp kutusundan geri yükler. Talimat silme hâlâ doğrudan silmedir.
  - Geri al (alındıyı tekrar bekliyora çevirir): tahsil eden veya yönetici. v47: eski hali (tutar + fotoğraf) `cop`'a ve `denetim`'e (`tahsilat-geri`) yazılır.
  - **✏ Düzenle (v47):** alınmış kaydın nakit/çek/makbuz no/notu düzeltilir (fotoğraf düzenlenmez). Yetki: tahsil eden veya yönetici (rules aynısını zorlar). Kayda `duzenleyen`, `duzenleyenUid`, `duzenlemeZaman`, `duzenlemeNot` ("Nakit 1.000 ₺ → 1.500 ₺") yazılır, kartta turuncu "✎ Düzeltildi" satırı çıkar; ayrıca `denetim`'e `tahsilat-duzenle` satırı düşer (tam geçmiş orada).
  - **Saatler sunucudan (v47):** `zaman`, `alinmaZaman`, `yapilmaZaman` artık `ServerValue.TIMESTAMP`; rules `newData.val() === now` ister (yönetici hariç: çöp kutusundan geri yükleme eski saati yazabilsin). "Bugün/Son 7 gün" süzgeci de `.info/serverTimeOffset` ile sunucu saatine göre hesaplanır.
  - **Fotoğraflar (v47):** `fotoHazirla` ile kayıtta küçük önizleme (+`#fotoTam anahtarı`), tam boy `fotoTam`'da; büyütünce yüklenir. Talimat da aynı. Eski kayıtlardaki büyük fotoğraflar için **Yönetici > Fotoğraf hafifletme** artık `tahsilatlar` ve `sevkTalimat`'ı da tarar (JSON yedek alıp bir kez çalıştırın).
  - Rules: `tahsilatlar` okuma/yazma = sevkiyat yetkisi (yönetici | `sevk` izni | rol Depo/Sevkiyat). Alım alanlarını yalnız ilk dolduran veya yönetici değiştirebilir. Yedeğe (`BK_DUGUM`) dahil.
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
- 2026-10-14: v41 — Sevkiyat talimatları eklendi. Dosyalar: talimat.js (yeni), index.html, app.js, sw.js, rules.json, PROJE-NOTLARI.md. Rules DEĞİŞTİ (yeni yol `sevkTalimat`).
- 2026-10-14: v42 — Talimattan "Kime" kaldırıldı, 6 fotoğraf eklendi. Dosyalar: talimat.js, index.html, rules.json (fotolar kuralı), PROJE-NOTLARI.md, sw.js. Rules DEĞİŞTİ.
- 2026-10-14: v43 — Talimata adres eklendi (kayıtlı adresten veya haritadan). Dosyalar: talimat.js, index.html, rules.json, PROJE-NOTLARI.md, sw.js, README.md. Rules DEĞİŞTİ.
- 2026-10-14: v44 — Tahsilat bölümü eklendi (WhatsApp "MAG TAHSİLAT" grubunun karşılığı). Dosyalar: tahsilat.js (yeni), index.html, app.js, sw.js, rules.json, kontrol.js, PROJE-NOTLARI.md, README.md. Rules DEĞİŞTİ (yeni yol `tahsilatlar`).
- 2026-10-14: v45 — Tahsilat ve Talimatlar Sevkiyat içinde sekme oldu (ayrı `tah` bölümü/izni kaldırıldı); Dosyalar sevkiyattan iş emirlerine taşındı. Dosyalar: index.html, app.js, talimat.js, tahsilat.js, sw.js, rules.json, kontrol.js, PROJE-NOTLARI.md, README.md. Rules DEĞİŞTİ (`tahsilatlar` yetkisi sevk'e bağlandı, `tah` izni kalktı).
- 2026-10-14: v46 — Talimatlar sekmesine bekleyenler/tamamlananlar alt sekmeleri eklendi. Dosyalar: index.html, talimat.js, sw.js, PROJE-NOTLARI.md, README.md. Rules değişmedi.
- 2026-10-15: v47 — (1) Tahsilat/talimat fotoğrafları küçük önizleme + fotoTam; hafifletme aracı tahsilat+talimat'ı da tarar. (2) Tahsilat silme → çöp kutusu + denetim; geri al → çöp kutusu + denetim; ✏ Düzenle eklendi. (3) Kayıt saatleri sunucudan. (5) Yeni `tah` izni, Muhasebe varsayılanı, menüde 💰 TAHSİLAT düğmesi. Dosyalar: app.js, index.html, tahsilat.js, talimat.js, rules.json, kontrol.js, sw.js, PROJE-NOTLARI.md, README.md. Rules DEĞİŞTİ.
- (Yeni satırlar buraya: tarih, ne değişti, hangi dosyalar, rules değişti mi, yeni sürüm)
- 2026-10-15: v48 — "Etiket hazırla" penceresi (#lbDlg) "Yeni iş emri" gibi geniş ve büyük yazılı açılır; sütun etiketleri yan yana dizilir (dar ekranda alt alta). İş emri kartındaki "🏷️ Etiket hazırla" düğmesi "Yeni iş emri aç" ile aynı boyda (`big`). Sadece style.css + app.js. Firebase kuralı: değişmedi.
- 2026-10-15: v49 — Yeni **ÜRETİM** bölümü (`uretim`, menüde 🏭). Ekstruder, Baskı, Kesim, Depo, Biten aşamaları İş emirleri'nden buraya taşındı; **İş emirleri'nde sadece Etiket aşaması + Dosyalar** kaldı (arama açıkken İş emirleri tüm aşamaları tarar). Aynı `isEmirleri` verisi ve aynı kart/düğmeler kullanılır (`isListele` panele göre çizer: `iList/iTabs/iq` = İş emirleri, `uList/uTabs/uq` = Üretim; `URA` = üretim aşamaları). Yeni izin anahtarı `uretim` (app.js YETKI/IZ_GRUP + rules.json validate). Rol şablonları: Ekstruder/Matbaa/Kesim/Bobinoz operatörleri artık `mod:["uretim"]`, `ana:"uretim"`; Depo Görevlisi ve Muhasebe `is`+`uretim`. rules.json: `isEmirleri`/`isHareket` okuma/yazma `is` yanına `uretim` de kabul eder. QR okutulunca iş emri `is` yetkisi varsa İş emirleri, yoksa Üretim bölümünde açılır. **Firebase kuralı: DEĞİŞTİ (rules.json yapıştırılacak).**
- 2026-10-15: v50 — Yönetici (`dAdm`), 🔔 Bildirimler (`dBild`), 🔑 Şifre (`dSf`) pencereleri ve yeni İsim penceresi (`dAd`, eski `prompt()` yerine) arka plandaki boş alana dokununca kapanır (diyalog.js). Firebase kuralı: değişmedi.
- 2026-10-15: v51 — (1) **Bobinoz Ustası rolü kaldırıldı** (Ekstruder Operatörü ile aynı): app.js YETKI, kayıt listesi (index.html), rules.json rol doğrulaması ve kesim yazma kuralları. (2) Operatör rollerinden `goster` kaldırıldı: Ekstruder/Matbaa/Kesim operatörleri Üretim'de tüm aşama sekmelerini görür, **sadece kendi aşamasını ilerletir** (`a_*` izni + rules aynı). Üretim açılışında operatörün kendi aşaması seçili gelir. Sevkiyat Sorumlusu Üretim'i göremez (değişmedi). **Firebase kuralı: DEĞİŞTİ (rules.json yapıştırılacak).** Eski Bobinoz Ustası hesabı varsa Yönetici > rolü Ekstruder Operatörü yapın.
- 2026-10-15: v52 — Etiket hazırla: (1) **Küçük etiketin eni/boyu artık değiştirilebilir** (ölçü TEK etiketin eni × boyu, varsayılan 30×50; sayfa = 3×en; yatay yazımdaki döndürme CSS değişkenleri `--cw/--ch` ile ölçüye uyar). Büyük/küçük arasında geçince her birinin yazılan ölçüsü korunur. (2) **"💾 Ölçüyü kaydet" düğmesi hem büyük hem küçük için** her zaman görünür; `ayarlar/etiket` altına yazar (büyük: `w,h,mag`; küçük: `kw,kh`), bir sonraki yazımda kullanılır (eski "ortak ölçü" düğmesinin yerine geçti; kayıt varsa cihaz ayarını ezer). rules.json: `ayarlar/etiket` altına `kw`,`kh` eklendi. **Firebase kuralı: DEĞİŞTİ (rules.json yapıştırılacak).**
- 2026-10-15: v53 — Etiket çalışma şekli (fiziksel): **EN = rulo genişliği yönü, BOY = yazıcıdan çıkış/besleme yönü.** Büyük etiket 100 (en) × 80 (boy) mm, tek etiket. Küçük etiket 30 (en) × 50 (boy) mm, rulo üzerinde **3 tane yan yana**, sayfa = 3×en × boy = 90×50 mm. Ölçüler yine değiştirilebilir. Büyük etiket varsayılan boyu 100'den **80**'e çekildi (cfgGet). Etiket penceresine "🖨️ Yazıcıya giden sayfa: … mm" satırı ve en/boy açıklaması eklendi (yazıcı sürücüsündeki kâğıt boyu bununla aynı olmalı). Değişen: etiket.js, index.html, sw.js, PROJE-NOTLARI.md. Firebase kuralı: değişmedi.
- 2026-10-15: v54 — Ekstruder/Baskı/Kesim aşamasında "Bitti" (ileri) basılınca "Bu aşamada çıkan kg (boş bırakılabilir)" sorusu kaldırıldı; yerine "Onaylıyor musunuz?" onayı geldi. Log/geçmişe kg artık null yazılır. Dosyalar: app.js, index.html, sw.js, PROJE-NOTLARI.md. Rules DEĞİŞMEDİ.
- 2026-10-15: v55 — Ekstruder/Matbaa/Kesim operatörü rollerinde iş emri kartındaki Yazdır, Geçmiş, QR butonları gizlendi (`opRol()`; yönetici ve diğer roller görmeye devam eder). Dosyalar: app.js, index.html, sw.js, PROJE-NOTLARI.md. Rules DEĞİŞMEDİ.
- 2026-10-15: v56 — İş takip formu yazdırma: (1) QR 22 mm → 16 mm küçültüldü. (2) Tablo çizgileri piksel (1.5px) yerine mm cinsine çevrildi (.6mm; iç tablo .5mm), yazıcıda/ölçeklemede incelip silik çıkmasın diye; yazıya hafif kontur (-webkit-text-stroke .25px) ve print-color-adjust:exact eklendi. Dosyalar: style.css, app.js (yorum), index.html, sw.js, PROJE-NOTLARI.md. Rules DEĞİŞMEDİ.
- 2026-10-15: v57 — (1) Form yazdırma: QR sayfanın en üstüne dayanıp yazıcıda kesiliyordu; @page üst kenar boşluğu 6mm→11mm, .prow yüksekliği 196→191mm, ölçüm hedefi 198→193mm, QR'a üstten 1mm boşluk + beyaz zemin. (2) QR okutunca iş emri son kaldığı aşamanın listesine gidiyor (`qrAsamayaGit`: etiket→İş Emirleri/Etiket sekmesi; ekstruder/baskı/kesim/depo/biten→Üretim bölümü ilgili sekme) ve açılan pencerede «📍 Şu an: AŞAMA» şeridi görünüyor. Yetkisi olmayan aşamada eski davranış (pencere). Dosyalar: app.js, style.css, index.html, sw.js, PROJE-NOTLARI.md. Firebase kuralı: değişmedi.
- 2026-10-15: v58 — İş emri kartı (Üretim sekmeleri, İş Emirleri, QR penceresi) artık yazdırılan «Üretim İş Takip Formu»nu birebir gösteriyor (`isForm` kartın içine `.isf` kutusunda basılır; fiyat/F-X satırı yazdırmadaki gibi yetkiye bağlı). Eski özet satırları (müşteri, ölçü, not vb.) kartan kaldırıldı; aşama rozeti, etiket durumu, geçmiş satırları ve tüm butonlar aynı. style.css'te form kuralları `:is(#prn,.isf)` ile hem yazdırmada hem ekranda geçerli. Dosyalar: app.js, style.css, index.html, sw.js, PROJE-NOTLARI.md. Firebase kuralı: değişmedi.
- 2026-10-15: v59 — İş emri formunda F/X seçeneğine «-» (belirsiz/yok) eklendi (X-PEŞİN, F-PEŞİN, -). «-» seçilince KDV kutusu işaretsiz kalır; formda ve yazdırmada «-» görünür. Dosyalar: index.html, app.js, sw.js, PROJE-NOTLARI.md. Firebase kuralı: değişmedi.
- 2026-10-15: v60 — Kartlardaki form telefonda taşıyordu (yana kaydırma gerekiyordu). Form artık sabit 560px genişlikte çizilip `isfSigdir()` ile kutu genişliğine göre küçültülüyor/ölçekleniyor (isListele, qrCiz, qrAc ve ekran yeniden boyutlanınca çalışır). Dosyalar: app.js, style.css, index.html, sw.js, PROJE-NOTLARI.md. Firebase kuralı: değişmedi.
- 2026-10-16: v61 — (1) İş emri QR penceresi (iqDlg) Kapat düğmesi çalışmıyordu: fbKur("iq") arama kutusu için aynı kimlikli iqX/iqN öğeleri üretiyordu (kimlik çakışması). Penceredeki öğeler qkS/qkN/qkP/qkX olarak yeniden adlandırıldı. iqDlg ve qrDlg'de pencere dışına (boşluğa) basınca kapanma eklendi. (2) Yeni iş emri kaydedilince çıkan «WhatsApp ile paylaş önerisi» penceresi kaldırıldı (waOner çağrısı silindi; işlev ve bildirim ayarları duruyor). Dosyalar: index.html, app.js, sw.js, PROJE-NOTLARI.md. Firebase kuralı: değişmedi. NOT: fbKur(q) q+"N"/q+"X" kimliklerini üretir; yeni öğelerde bu önekleri kullanma.
- 2026-10-16: v62 — İş emri listesi 300 kayıt sınırı düzeltildi: son 300 (`iLimit`) kayıt + bitmemiş (etiket/ekstruder/baski/kesim/depo) TÜM iş emirleri ayrı sorgularla (`orderByChild("asama").equalTo`) yüklenip `isBirles()` ile birleştirilir; eski ama hâlâ üretimde olan iş kaybolmaz. Biten sekmesinde/aramada «Daha eski iş emirlerini yükle» düğmesi (+300). **rules.json değişti:** `isEmirleri/.indexOn` = ['eklenmeTarihi','asama'] (kural yayınlanmazsa uygulama yine çalışır ama aşama sorguları tüm veriyi indirir). Dosyalar: app.js, rules.json, index.html, sw.js, PROJE-NOTLARI.md.

## 9. Yapılacaklar / yarım kalan / alınan kararlar

**Yapılacaklar (kullanıcı isteklerini buraya yaz, bitenleri günlüğe taşı):**
- **[İSTENDİ, YAPILMADI] Biten iş emirleri için haftalık/aylık rapor + Excel:** tarih aralığı seç → o aralıkta biten (asama=bitti; bitiş zamanı isHareket'ten) iş emirlerini listele/Excel indir. Kullanıcıya sorulan açık soru: «Biten» = üretimdeki Biten sekmesi mi, Dosyalar'daki onaylı sevkiyatlar mı? (cevap gelmedi). Yedekleme (Yönetici > 💾 Yedekleme) şu an sadece TÜM veriyi JSON/Excel verir, tarih aralığı yok.
- **[ÖNERİLDİ] Termin (teslim) tarihi alanı** iş emrinde yok; eklenirse geciken işler üstte gösterilebilir.
- **[ÖNERİLDİ] Aşamada bekleme süresi raporu** (isHareket zaman damgalarından: ekstruderde/baskıda kaç saat kaldı).
- **[ÖNERİLDİ] Aşama değişince ilgili bölüme bildirim.**
- **[KULLANICIYA SÖYLENDİ] Firebase otomatik günlük yedeği (Realtime Database > Backups, Blaze planı) açılmalı;** açık mı bilinmiyor. Kullanıcıdan adım adım isterse anlat.
- **[TEMİZLİK] GitHub deposunda `fabrika-v44-degisen-dosyalar.zip` ve `fabrika-v45-degisen-dosyalar.zip` gereksiz;** kullanıcı silebilir (siteyi etkilemez).
- Tahsilat için olası eklemeler (kullanıcı istemedi, yapılmadı): Excel'e aktarma, çek vadesi/banka alanı, firmaya göre toplam/cari özeti, bekleyen talep için bildirim, WhatsApp'a özet gönderme. Ayrıca WhatsApp grubundaki eski kayıtlar uygulamaya aktarılmadı (sadece bundan sonrası).
- Talimatlar için olası ek: zil bildirimi / WhatsApp önerisi, talimata fotoğraf veya not ekleme (kullanıcı istemedi, yapılmadı).

**Yarım kalan iş (sohbet kesilirse buraya yaz: ne yapılıyordu, hangi dosyada, neresi kaldı):**
- (yok)

**Alınan kararlar:**
- Kod tabanı ayrı .js dosyalarıdır; satır içi script yazılmaz (CSP).
- Teslimat: tam dosya + (rules değiştiyse) tam rules. Parça/yama verilmez.
- Sürüm numarası her kod değişikliğinde artar (`node kontrol.js --artir`).

**Açık konular / bilinmeyenler:**
- **Veritabanı adresi:** `https://sevkiyat-fc22b-default-rtdb.firebaseio.com/` (Firebase projesi `sevkiyat-fc22b`; app.js içindeki CFG'de de yazar). Claude bu adrese erişemez; kuralları/yedeği kullanıcı Firebase Konsolu'ndan yönetir.
- **Cihazda sınanmadı:** v57–v62 ekran değişiklikleri (yazdırma üst boşluğu, QR yönlendirme, kartta form + ölçekleme, F/X «-», QR penceresi kapatma, 300 kayıt düzeltmesi) Claude tarafından gerçek cihazda denenmedi; kullanıcı geri bildirimi bekleniyor.
- **Kimlik çakışması dersi:** `fbKur(q)` arama kutusu için `q+"N"`, `q+"X"`, `q+"D1"`, `q+"D2"` kimliklerini üretir; yeni öğelere bu önekleri verme (v61'de iqX çakışması düzeltildi).
- **v47 rules, Kural Simülatörü ile SINANMADI** (Claude Firebase'e erişemez). Yayınlamadan önce: Muhasebe hesabıyla tahsilat talebi açma + tahsil etme + düzenleme; Sevkiyat Sorumlusu ile tahsil etme; yönetici ile silme + çöp kutusundan geri yükleme.
- `rules.json` sadeleştirilmiş boyutu ~76 KB (v46: ~67 KB). Firebase "çok büyük" hatası verirse söyleyin; tahsilat alan kurallarını sadeleştiririz.
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
