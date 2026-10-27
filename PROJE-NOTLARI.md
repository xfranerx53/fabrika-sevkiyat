# PROJE-NOTLARI.md — Fabrika Stok & Sevkiyat (MAG AMBALAJ)

> Bu dosya, sohbet süresi dolup YENİ bir sohbet/e-posta açıldığında Claude'un
> kaldığımız yerden devam edebilmesi için yazıldı. Claude'un sohbetler arası
> hafızası yoktur; hafıza BU DOSYA + zip'teki gerçek kodlardır.
> Her teslimatta güncellenir.

**GÜNCEL SÜRÜM: v93**
Son güncelleme: 2026-10-27 (v93: stoka «📥 Hazır liste» toplu ekleme düğmesi, stokaktar.js); önceki: 2026-10-26 (yeni sohbette zip + 2 Excel incelendi, «GÜNCEL DURUM» bloğu Bölüm 9'a eklendi; v92: model sırası; v91: fotoğraftan okuma hızlandırıldı; hosting geçişi: web.app yayında; v90: hesapları yönetici açar; 👤 Hesabım menüsü; 44px dokunma alanı + büyük yazı kipi)

---

## 0. CLAUDE İÇİN TALİMAT (ÖNCE BUNU OKU)

**Kullanıcı kod bilmiyor.** Tüm kod yazma/değiştirme işini Claude yapar. Kullanıcı sadece
(1) dosyaları indirip GitHub'a yükler, (2) Firebase'e kural metnini yapıştırır.
Kullanıcıyla Türkçe, sade, teknik terimsiz konuş.

### 0.1 Yeni sohbet açılışında SIRAYLA yap

> Kullanıcı yalnızca zip + isteğini yazmış olabilir (başlangıç metni yapıştırmamış olabilir). Bu durumda da bu dosyayı oku ve aşağıdaki sırayı uygula; kullanıcıdan projeyi anlatmasını İSTEME. Önce `00-ONCE-BUNU-OKU.md` dosyasına bak. «Dersler» (Bölüm 8.5) kısa ve zorunlu okumadır.

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
- **Adres:** v90 öncesi GitHub Pages (https://xfranerx53.github.io/fabrika-sevkiyat/); geçiş sonrası Firebase Hosting (Bölüm 1.1). Eski adres yönlendirme sayfasıdır.
- **GitHub deposu:** xfranerx53/fabrika-sevkiyat (ana dal: main)
- **Arka uç:** Firebase projesi `sevkiyat-fc22b`, **Realtime Database** (Firestore DEĞİL),
  Firebase Auth (e-posta/şifre). İstemci kütüphanesi: Firebase JS **8.10.1** (gstatic'ten yüklenir).
- **Veritabanı adresi:** https://sevkiyat-fc22b-default-rtdb.firebaseio.com
- **Dil:** Arayüz ve kod yorumları Türkçe.
- Firebase yapılandırması (`CFG`) `app.js` başındadır. Web apiKey'in kodda görünmesi normaldir;
  güvenlik `rules.json` ile sağlanır.
- Kullanıcı e-postalarını değiştirerek yeni sohbet açıyor; Claude hafızası hesaplar arası paylaşılmaz.
  Süreklilik bu dosya + zip ile sağlanır.

## 1.1 Yayın (hosting) düzeni — v90 sonrası

- **Amaç:** Kod GitHub'da ÖZEL depoda durur; site Firebase Hosting'de yayınlanır (GitHub Pages ücretsiz planda özel depoyu yayınlayamaz). Veri güvenliği yine giriş + `rules.json` iledir.
- **Yeni adres:** https://sevkiyat-fc22b.web.app/ (alan adı bağlanırsa değişir; o zaman Firebase > Authentication > Settings > Authorized domains'e eklenmeli ve etiket QR'ları yeni adresle basılır — `etiket.js` QR'ı açıldığı sitenin adresinden üretir).
- **Akış:** Dosyalar GitHub'a yüklenir → `yayinla.yml` çalışır → Firebase Hosting güncellenir (GitHub > Actions sekmesinde yeşil ✓ aranır). Eski GitHub Pages gibi anında değil, 1-2 dk sürer.
- **Eski adres:** Depo adı `fabrika-sevkiyat-kod` olarak değiştirilip özel yapılır; `fabrika-sevkiyat` adıyla yeni, GENEL bir depo yalnız `yonlendirme-repo` içeriğini (index.html, 404.html, sw.js) barındırır ve eski QR / ana ekran kısayollarını yeni adrese yönlendirir (`?is=` korunur). Bu depoya ASLA uygulama kodu konmaz.
- **Gizli anahtar:** Firebase hizmet hesabı JSON'u yalnız GitHub Secrets'ta durur; depoya, sohbete veya zip'e konmaz. Yayın "izin yok" hatası verirse hata metnine bakılır (hizmet hesabına Firebase Hosting yetkisi gerekebilir).
- Hosting yapılandırması site davranışını değiştirmediği için sürüm numarası artmadı.
- **Durum (2026-10-26):** web.app yayında ve çalışıyor; depoyu özel yapma + yönlendirme deposu adımları Bölüm 9 «Yarım kalan iş»te.

## 2. Dosyalar (zip'teki gerçek durum, sürüm v93)

| Dosya | Ne işe yarar | Nereye gider |
|---|---|---|
| `index.html` (~520 satır) | Sadece arayüz iskeleti (giriş, menü, sevkiyat, stok, adres, dosyalar, yönetici pencereleri). Kod yok; script'leri `?v=NN` ile çağırır | GitHub |
| `style.css` | Tüm görünüm | GitHub |
| `app.js` (~2000 satır) | Ana kod: Firebase, giriş, yetki, sevkiyat, stok, sipariş, adres, dosyalar, iş emirleri, yönetici, yedek, WhatsApp | GitHub |
| `raporlar.js` | Raporlar | GitHub |
| `israpor.js` | Üretim raporları: biten işler, aşama/operatör süreleri (`isEmirleri` + `isHareket`); yetki: yönetici veya `rap` izni; Excel için `xlsxHazir()` kullanır. (Notlarda eksikti, v92 zip'inde var.) | GitHub |
| `etiket.js` | Etiket tasarımı/basımı | GitHub |
| `qr.js` | QR kod üretimi (kütüphane) | GitHub |
| `adrsec.js` | **(v88)** Talimat ve Tahsilat pencerelerinin ortak «📍 Adres (isteğe bağlı)» bloğu: `adrSecKur(kutuId,önek)` → kayıtlı sevk adreslerinden seç, link/açık adres, haritada seç, temizle; `.oku()/.doldur()/.sifirla()` | GitHub |
| `talimat.js` | Sevkiyat talimatları (Bölüm 7): yönetici/Depo Görevlisi sevkiyat sorumlusuna iş verir, o "Yaptım" der | GitHub |
| `tahsilat.js` | Tahsilat bölümü (Bölüm 7): WhatsApp "MAG TAHSİLAT" grubunun yerine geçer. Ofis talep açar, sahadaki kişi "Tahsil ettim" der | GitHub |
| `granul.js` | **GRANÜL bölümü (v78):** Excel'deki «ZEKERİYA GRANÜL TAKİP» tablosunun karşılığı; birden çok granülcü, her birinin ayrı defteri, toplamlar (KALAN KG, BAKİYE), Excel'e aktar / Excel'den al | GitHub |
| `fotookut.js` | Yeni iş emrinde «📷 Mikro formunun fotoğrafından doldur»: fotoğrafı Google Gemini (ücretsiz API anahtarı) ile okuyup alanları doldurur (v65) | GitHub |
| `pano.js` | **Yönetici panosu (v81):** menüdeki «🛡️ YÖNETİCİ PANELİ» düğmesinin açtığı pencerede (`dPano`) özet: onay bekleyen kullanıcı, geciken iş emri, bugün termini olan, sevk edilecekler, bekleyen tahsilat/talimat, kritik stok, yedek durumu + tek dokunuşla yedek | GitHub |
| `stokaktar.js` | **Hazır stok listesi (v93):** Stok ekranında «＋ Yeni kalem ekle» yanında «📥 Hazır liste» düğmesi; 69 kalemi 19 kategoriyle (Hammadde (Granül), Konsantre (Masterbatch), Mürekkep, Vernik, Çözücü, Palet, Streç Film, PA-PE Vakum Torba…) `stokKalem`e ekler (miktar 0; birim kg/adet/rulo). Aynı isim varsa atlar. Kural değişmedi | GitHub |
| `baglanti.js` | **Bağlantı durumu + kayıt güvenliği (v81):** sol altta ● Çevrimiçi/Bağlantı yok/Gönderiliyor etiketi, kopunca kırmızı şerit, kayıt 8 sn'de gitmezse turuncu şerit, reddedilen kayıtta «⚠ Kaydedilemedi», bekleyen kayıt varken sayfa kapanırsa uyarı. Firebase `set/update/remove/transaction` işlemlerini sarar | GitHub |
| `yazi.js` | **(v90)** Yazı boyutu ayarı (Normal/Büyük/Çok büyük; `localStorage.yaziBoyut`). `<head>`te yüklenir, `<html>`e `byz1`/`byz2` sınıfı koyar; kurallar `style.css` sonundaki «Büyük yazı kipleri» bölümünde | GitHub |
| `hesap.js` | **(v90)** 👤 Hesabım penceresi (`dHes`: isim, şifre, yazı boyutu, çıkış) ve yönetici «＋ Yeni kullanıcı hesabı aç» (`dYeni`, `uYeni`). Hesap, ikinci geçici Firebase uygulamasıyla (`hesapAc`) açılır ki yönetici oturumdan çıkmasın; sonra `kullanicilar/{uid}` `onay:true` yazılır | GitHub |
| `arama.js`, `saat.js`, `diyalog.js`, `foto-onizleme.js`, `sw-kayit.js` | Küçük yardımcılar | GitHub |
| `sw.js` | Çevrimdışı önbellek. `CACHE='fabrika-vNN'` ve `V='?v=NN'` | GitHub |
| `manifest.webmanifest`, `icon-*.png`, `apple-touch-icon.png`, `favicon-32.png` | Telefona kurulum ve ikonlar | GitHub |
| `rules.json` | Firebase kuralları metni (yedek kopya; gerçek kurallar Firebase'dedir) | GitHub + Firebase'e yapıştırılır |
| `index.js` + `package.json` | Firebase Cloud Function `sifreSifirla` (yönetici başka kullanıcının şifresini sıfırlar). Siteyle ilgisi yok | Ayrıca Firebase'e deploy edilir |
| `firebase.json` | **(v90+)** Firebase Hosting ayarı: depo kökü yayınlanır; `*.md`, `rules.json`, `kontrol.js`, `index.js`, `package.json` yayına GİRMEZ; tüm dosyalar `no-cache` (eski sürümde takılmasın). `.github/workflows/yayinla.yml` ile GitHub'a her yükleme otomatik yayınlanır | GitHub |
| `.github/workflows/yayinla.yml` | **(v90+)** `main` dalına yükleme olunca siteyi Firebase Hosting (proje `sevkiyat-fc22b`) üzerinde yayınlar. Gizli anahtar GitHub Secrets > `FIREBASE_SERVICE_ACCOUNT`. Dosya yolu elle yazılarak oluşturulur (gizli klasör) | GitHub |
| `kontrol.js` | Teslim öncesi otomatik kontrol + sürüm artırma. **Sadece Claude çalıştırır**, siteyi etkilemez | GitHub'da durabilir |
| `README.md` | Kısa açıklama | GitHub |
| `PROJE-NOTLARI.md` | Bu dosya | GitHub |
| `00-ONCE-BUNU-OKU.md` | Yeni sohbetteki Claude için kısa giriş (zip'te en üstte görünür; PROJE-NOTLARI.md'ye yönlendirir) | GitHub |
| `ARSIV-GUNLUK.md` | Eski değişiklik günlüğü (v40–v80); gerekmedikçe okunmaz | GitHub |

**Önbellek kuralı:** Dosya her değiştiğinde `index.html` ve `sw.js` içindeki sürüm numarası
birlikte artmalı, yoksa telefonlar eski sürümde kalır. Bunu `node kontrol.js --artir` yapar.

## 3. kontrol.js (Claude'un teslim öncesi aracı)

- `node kontrol.js` → kontrol eder, rapor verir.
- `node kontrol.js --artir` → sürümü 1 artırır (index.html, sw.js, README), sonra kontrol eder.
- Denetlediği şeyler: tüm .js dosyalarında yazım hatası, index.html'in çağırdığı dosyaların varlığı,
  `?v` ile `fabrika-vNN` tutarlılığı, sw.js önbellek listesi, rules.json/manifest geçerliliği,
  rol ve izin listesinin app.js ↔ rules.json uyumu, bu dosyadaki "GÜNCEL SÜRÜM" satırı.
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
| `sevkTalimat/{id}` | Sevkiyat talimatları: `metin`, `hedefUid` (`*`=tüm sorumlular), `hedefAd`, `atayan`, `atayanUid`, `zaman`, `durum` (`bekliyor`/`yapildi`), `yapan`, `yapanUid`, `yapilmaZaman`, `fotolar` (en fazla 6 küçültülmüş jpeg), `adres`, `haritaUrl`, `adresAd` (isteğe bağlı; v88: ✏ Düzenle ile metin+adres değişir) |
| `tahsilatlar/{id}` | Tahsilat kayıtları: `cari`, `durum` (`bekliyor`/`alindi`), `not`, `talepUid`, `talepEden`, `zaman`, `talepTur` (`talep`/`dogrudan`), `adres`, `haritaUrl`, `adresAd` (isteğe bağlı, v88); alınınca: `nakit`, `cek` (₺, yalnız >0 olanlar yazılır), `makbuzNo`, `alan`, `alanUid`, `alinmaZaman`, `alanNot`, `fotolar` (en fazla 6 küçültülmüş jpeg). `zaman` üzerinde indeks var, uygulama son 300 kaydı okur. v47: `fotolar` önizleme+`#fotoTam` anahtarı olabilir; düzeltmede `duzenleyen`, `duzenleyenUid`, `duzenlemeZaman`, `duzenlemeNot` |
| `okumaAyar` | Fotoğraftan okuma ayarı: `anahtar` (Gemini API anahtarı), `model` (isteğe bağlı). Okuma: yönetici + iş açma yetkisi olanlar; yazma: yalnız yönetici. **Yedeğe (`BK_DUGUM`) KOYMA** (anahtar yedek dosyasına sızmasın) |
| `granulcular/{id}` | Granülcüler: `ad`, `zaman`. Okuma/yazma: yönetici, `granul` izni olanlar, varsayılan Muhasebe; granülcü silmeyi yalnız yönetici yapar |
| `granulKayit/{id}` | Granül defter satırları: `gid` (granülcü id), `tarih` (YYYY-MM-DD), `sn`, `giden`, `gelen`, `satis`, `fire` (kg), `fiyat` (₺/kg), `kdv`, `odeme` (₺), `aciklama`, `ekleyen`, `ekleyenUid`, `zaman`; düzeltmede `duzenleyen`, `duzenleyenUid`, `duzenlemeZaman`. `gid` üzerinde indeks var. Toplam fiyat / satış fiyat / kalan kg / bakiye **saklanmaz, hesaplanır** |
| `ayarlar/yedek` | (v81) Son yedek: `zaman` (sunucu saati), `kim`, `boyut`. Yalnız yönetici yazar; JSON yedek başarıyla (eksiksiz) inince `bkBitir` yazar. Pano ve Yedekleme penceresi "son yedek"i buradan gösterir |
| `etiketGecmis/{id}/{h}`, `etiketSablon/{m}/{k}` | Etiket basım geçmişi ve şablonlar |
| `ayarlar/etiket` | Etiket ayarı (`w`, `h`, `mag`) |
| `cop/{id}` | Çöp kutusu: silinenlerin yedeği (yönetici geri yükler) |
| `denetim/{id}` | Denetim günlüğü (kim ne yaptı), sadece yönetici okur |

Fotoğraflar `data:image/jpeg;base64,...` metni olarak tutulur (300.000 karakter sınırı).
`rules.json` içinde 24 ana yol vardır ve yukarıdaki listeyle aynıdır.
Yeni bir yol eklenirse: rules'a ekle; yedekleme (`bkIndir`/`bkCalistir`) ve silme/çöp (`silCop`)
akışlarına eklenmesi gerekip gerekmediğini düşün.

## 6. Roller ve izinler

**Roller:** Depo Görevlisi, Sevkiyat Sorumlusu, Ekstruder Operatörü, Matbaa Operatörü,
Kesim Operatörü, Muhasebe. (Bobinoz Ustası rolü v51'de kaldırıldı: Ekstruder Operatörü ile aynı.) Ayrıca `yonetici=true` olan **yönetici**.

**Hesaplar (v90):** Herkese açık «Kayıt Ol» KALDIRILDI. Hesabı yalnız yönetici açar (Yönetici paneli > Kullanıcılar > «＋ Yeni kullanıcı hesabı aç»: ad, kullanıcı adı, şifre ≥6, rol); hesap `onay=true` doğar. `rules.json`te `kullanicilar/$uid` yazması yalnız onaylı yöneticiye açıktır (kullanıcı kendi kaydını oluşturamaz); kullanıcı yalnız kendi `ad` alanını değiştirebilir. Eski bekleyen (`onay=false`) kayıtlar listede «Onayla» ile hâlâ onaylanabilir. Kaydı olmayan hesap «Bu hesap için kayıt bulunamadı» ekranını görür. **Firebase > Authentication > Settings > User actions > «Enable create (sign-up)» AÇIK kalmalı** (istemci hesap açabilsin diye); veri erişimi rules ile kapalıdır.

**İzin anahtarları** (`kullanicilar/{uid}/izin/...`, true = rolden bağımsız ver, false = rol
varsayılanını kapat, yoksa rol varsayılanı geçerli):
`sevk`, `stok`, `is`, `rap`, `tah`, `granul`, `a_etiket`, `a_ekstruder`, `a_baski`, `a_kesim`, `a_depo`,
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

- **Giriş Yap** ekranı (v90: Kayıt Ol yok; «Hesabınız yoksa yöneticinizden hesap isteyin»). Üst çubukta yalnız Yönetici, 🔔, 🏠 Menü, 👤 Hesabım; isim/şifre/çıkış/yazı boyutu `dHes` penceresinde (`index.html`, `hesap.js`). Ana menüde de «👤 Hesabım» düğmesi var.
- **Görünümler (index.html):** `vLogin`, `vWait` (onay bekleme), `vMenu`, `vApp` (stok), `vSev`
  (sevkiyat), `vAdr` (adresler), `vDos` (dosyalar).
- **Modüller:** 🚚 SEVKİYAT, 📦 STOK (üstte sekme).
- **Sevkiyat sekmeleri (v45):** 🚚 SEVKİYATLAR · 📋 TALİMATLAR · 💰 TAHSİLAT · 📍 SEVK ADRESLERİ (`vtabs`, `vTabSet`). **📁 DOSYALAR (v89) artık ayrı bir ana bölüm** (menüde `data-go="dos"`, panel `pDos`, içinde `vDos`; `modGor("dos")` = `sevk` veya `rap` yetkisi; operatörler görmez; İş Emirleri'ndeki `isMT` sekmesi kaldırıldı). Dosyalar üç türü barındırır: onaylanan sevkler (eskisi gibi), **tamamlanan talimatlar** ve **alınan tahsilatlar** (`dosyalar/{id}` kaydında `kaynak:"talimat"/"tahsilat"`; fotoğraflar `dosyaFoto/{id}/fotolar`). Talimat «✓ TAMAMLANANLAR» ve tahsilat «✓ ALINANLAR» listelerinde yöneticiye **«📁 Dosyalara ekle»** düğmesi çıkar (`kayitDosyala` app.js); kaynak kayıt listeden kalkar. Dosyalar'da yönetici «↩️ Dosyalardan çıkar» ile geri alır (`kayitDosyadanCik`). Tür süzgeci: Talimat / Tahsilat seçenekleri eklendi; Excel çıktısına «Tahsilat (₺)» sütunu eklendi. **Talimat «✓ Yaptım» artık onay penceresi (`dTalOn`) açar**, «Evet, yaptım» denince kaydeder. Sevkiyat kartındaki "ONAYLA" yine sevkiyatta, onaylananlar Dosyalar'a düşer.
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
- **GRANÜL (v78, `granul.js`, panel `pGranul`, menüde ♻️ GRANÜL, izin `granul`; varsayılan: yönetici + Muhasebe):** Üstte granülcü sekmeleri (＋ Granülcü ekle; ad değiştirme; silme yalnız yönetici ve kaydı yoksa). Seçili granülcünün defteri Excel'deki gibi tablo: TARİH, Ş N, GİDEN KİLO, GELEN KİLO, SATIŞ, FİRE, FİYAT, TOPLAM FİYAT, KDV, SATIŞ FİYAT, ÖDEME, AÇIKLAMA. Formüller Excel'den çıkarıldı ve ekranda yazar: TOPLAM FİYAT = gelen × fiyat; SATIŞ FİYAT = satış × fiyat; KALAN KG = Σgiden − Σgelen − Σfire; BAKİYE = Σtoplam fiyat + ΣKDV − Σsatış fiyat − Σödeme (kullanıcının Excel görüntüsüyle birebir tuttu: 7607 kg / 46.607 ₺). KDV ve FİRE elle girilen alanlardır (Excel'de de elle). «Ş N» sütunu = **FİŞ NO** (kullanıcı söyledi; Excel'de daraltılmış olduğundan görünmüyordu); alan adı `sn`, ekranda «FİŞ NO», Excel içe aktarmada «Ş N» veya «FİŞ NO» başlığı kabul edilir. Kayıt silme çöp kutusuna gider (`silCop`), düzeltmeler `denetim`'e düşer. «📥 Excel'den al»: Excel'deki TARİH başlıklı tabloyu okur, aynı satırı ikinci kez eklemez, onay sorar. «📤 Excel'e aktar» aynı düzende .xlsx indirir. Yedeğe (`BK_DUGUM`) dahil.
- **Stok modülü:** KALEMLER (giriş/çıkış, geçmiş, yazdır), SİPARİŞLER (kategoriye göre / liste),
  TEDARİKÇİLER.
- **İş emirleri aşama akışı:** `etiket → ekstruder → (baskı varsa baski) → kesim → depo → bitti`.
  Her aşamayı ilgili rol/izin ilerletir; `geriAl` izni olanlar bir aşama geri alabilir. Biten iş
  "HAZIR ÜRÜNLER"e aktarılabilir (`bekleAktar`, `aktarildi`). İş emri seri no biçimi: `MG-0945`.
  Etiketteki QR okutulunca iş emri açılır (`?is=MG-0945`).
- **Yönetici paneli (v81, `pano.js`):** yalnız yönetici. Menüde «🛡️ YÖNETİCİ PANELİ» düğmesi (`mPano`, altında «N konu dikkatinizi bekliyor» rozeti) `dPano` penceresini açar; pencerede özet kartları + «⚙️ Kullanıcılar · Çöp kutusu · Denetim · Yedekleme» (eski Yönetici penceresi `dAdm`) düğmesi var. Menüde artık özet gösterilmez; ↻ Yenile, 2 dk'da bir otomatik, menüye dönülünce (30 sn'den eskiyse) yenilenir. Kartlar: 👤 onay bekleyen kullanıcı (`kullanicilar` canlı) · ⏰ geciken iş emri (`terminGun>0`) · 📅 bugün termini · 🚚 sevk edilecekler (`urunler` `durum` indeksiyle `sevk_edilecek`; «bugün» için tarih alanı yok, sevk listesinin tamamı) · 💰 bekleyen tahsilat ve 📋 talimat (tahsilat.js/talimat.js'in canlı `L` listesi; `window.tahOzet/talOzet`, her güncellemede `panoYenile`) · ⚠️ kritik stok (`dur(k)!=="ok"`) · 💾 yedek (3 gün sarı, 7 gün kırmızı; «Yedek al» düğmeleri `bkJson` düğmesini tıklar, ilerleme `bkDurum`'dan yansır). Her kartın «git» düğmesi ilgili bölümü açar. Yaşam döngüsü: `bildBaslat → panoBaslat`, `bildDurdur → panoDurdur`.
- **Bağlantı göstergesi (v81, `baglanti.js`):** bkz. Dosyalar. Firebase web SDK'sı bağlantı yokken yazılan kayıtları yalnız telefonun belleğinde tutar; uygulama KAPANIRSA bu kayıtlar kaybolur (kalıcı çevrimdışı kuyruk YOK, yapılmadı). `ayarlar/yedek` yazımı hata toast'ı vermez (sessiz liste `sessiz()`).
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

> Eski kayıtlar (v40–v80) `ARSIV-GUNLUK.md` dosyasına taşındı; gerekmedikçe okuma. Günlük uzayınca (yaklaşık 10 kayıttan fazla) en eskileri oraya taşı.

- 2026-10-23: v81 — (1) `baglanti.js`: bağlantı durumu etiketi + kopma/yavaşlık şeridi + «Kaydedilemedi» uyarısı + kapatma uyarısı. (2) `pano.js`: yönetici panosu (menüde). (3) Yedek: son yedek zamanı artık veritabanında (`ayarlar/yedek`), tüm yönetici cihazlarında ve panoda görünür; 3/7 gün hatırlatma. (4) `tahsilat.js`/`talimat.js`: `tahOzet`/`talOzet` + `panoYenile` çağrısı. (5) `app.js`: `bildBaslat/bildDurdur` pano kancaları, `bMenu` → `panoGoster`, `bkBitir`/`bkSonGoster` DB'li. Dosyalar: baglanti.js (yeni), pano.js (yeni), app.js, index.html, style.css, sw.js, tahsilat.js, talimat.js, rules.json, PROJE-NOTLARI.md, README.md. **Firebase kuralı: DEĞİŞTİ** (`urunler` `.indexOn` + `durum`; yeni `ayarlar/yedek`). Kural yayınlanmazsa pano «sevk edilecekler» kartı tüm ürünleri indirir (yavaş) ve yedek zamanı DB'ye yazılamaz. Mantık sahte veriyle (node) sınandı; gerçek cihazda/Firebase'de SINANMADI.

- 2026-10-23: v82 — Kullanıcı isteği: özet kartları menüde görünmesin. Menüye yalnız yöneticiye görünen «🛡️ YÖNETİCİ PANELİ» düğmesi eklendi; kartlar `dPano` penceresine taşındı (`index.html`, `pano.js`). Pencerede eski Yönetici penceresine (`dAdm`) giden düğme var. Dosyalar: index.html, pano.js, sw.js, PROJE-NOTLARI.md. Firebase kuralı: değişmedi (v81'deki kural yeterli). Cihazda sınanmadı.

- 2026-10-23: v83 — Yönetici paneli penceresi (`dPano`): pencerenin dışındaki boşluğa basınca kapanır (`pano.js`, genel tıklama dinleyicisi; `iqDlg` ile aynı yöntem). Dosyalar: pano.js, sw.js, index.html, PROJE-NOTLARI.md. Firebase kuralı: değişmedi. Cihazda sınanmadı.

- 2026-10-23: v84 — (1) **Etikette ebat sadece rakam:** `etiket.js` `defs()` içindeki `tmz`: iş emrindeki «30CM T.AÇIK» / «22,5 CM» etikete `30 X 22,5` olarak gelir (ilk sayı alınır; «30+5» gibi toplamlar korunur; rakam yoksa KAPALI/T.AÇIK/CM temizlenir). İş emri formu ve yazdırma etkilenmez; daha önce hazırlanmış etiketler kayıtlı ebatla kalır. (2) `favicon-32.png` sw.js önbellek listesine eklendi (kontrol.js uyarısı kalktı). Dosyalar: etiket.js, index.html, sw.js, README.md, PROJE-NOTLARI.md. Firebase kuralı: değişmedi. Cihazda sınanmadı.

- 2026-10-23: v85 — **Bağlantı toparlama (Wi-Fi ↔ mobil veri, internet gidip gelince «Bağlantı yok» takılması):** v73'te yazılan uzun-sorgu/host temizliği zip'te YOKTU (v78-80 arası kaybolmuş); yeniden yazıldı. `baglanti.js`: (1) `online`, `pageshow`, `visibilitychange`, `navigator.connection change` olaylarında `cevir()` = `db.goOffline()`→400 ms→`goOnline()` (ölü soketi bırakıp yeni bağlantı; eski kod sadece `goOnline()` çağırıyordu, o işe yaramaz); (2) 4 sn'lik bekçi: kopukken ve telefon «internet var» derken ilk ~12 sn yeni bağlantı dener, sonra `sunucuVar()` (REST `no-cors` fetch) ile sunucuya ulaşılıyorsa `uzunSorgu()` (`firebase.database.INTERNAL.forceLongPolling()` + `localStorage.fbPoll=1`), sonra 8 sn'de bir dener; (3) kırmızı şeritte «↻ Yeniden dene» güçlendi, «⟳ Sayfayı yenile» düğmesi eklendi (bekleyen kayıt varsa onay ister). `app.js`: her açılışta `localStorage` içindeki `firebase:host:*` silinir; `fbPoll=1` ise açılışta uzun-sorgu kipi açılır. Dosyalar: baglanti.js, app.js, index.html, sw.js, README.md, PROJE-NOTLARI.md. Firebase kuralı: değişmedi. Mantık sahte ortamda (node) sınandı; gerçek telefonda/Firebase'de SINANMADI.

- 2026-10-23: v86 — v85 telefonda işe yaramadı (Wi-Fi'ye geçince «Bağlantı yok» sürdü, «Sayfayı yenile» de düzeltmedi). Sebep henüz bilinmiyor; kırmızı şeride **«🔍 Tanı»** düğmesi eklendi (`baglanti.js` `tani()`): genel internet, veritabanı https, veritabanı WebSocket, giriş sunucusu, gstatic erişimini 6 sn'de sınayıp sonucu pencerede gösterir. Kullanıcıdan ekran görüntüsü istenecek. Dosyalar: baglanti.js, index.html, sw.js, README.md, PROJE-NOTLARI.md. Firebase kuralı: değişmedi.

- 2026-10-23: v87 — **Bağlantı takılmasının asıl sebebi bulundu:** v86 tanısı (telefon mobil veride): internet, https, WebSocket, giriş sunucusu hepsi «tamam» ama «Veritabanı bağlı: HAYIR · uzun-sorgu: açık». v85'in `forceLongPolling()` + `localStorage.fbPoll=1` eklemesi bağlantıyı kalıcı bozmuştu: **index.html CSP'si `script-src`te firebaseio.com'a izin vermez, Firebase uzun-sorgu script yükler → engellenir → hiç bağlanamaz.** DERS: bu sitede uzun-sorgu ASLA kullanılmaz (v73 notundaki uzun-sorgu fikri de geçersiz). Düzeltme: `uzunSorgu()` kaldırıldı; takılmada `forceWebSockets()` + `goOffline/goOnline` (`sokZorla`); `app.js` her açılışta `fbPoll` anahtarını siler ve `forceWebSockets()` çağırır; tanıdan uzun-sorgu satırı kaldırıldı. Dosyalar: baglanti.js, app.js, index.html, sw.js, README.md, PROJE-NOTLARI.md. Firebase kuralı: değişmedi. Telefonda SINANMADI.
- 2026-10-23: v88 — (1) Yeni `adrsec.js`: ortak adres bloğu (talimatın eski satır-içi adres kodu buna taşındı). (2) **Talimat:** ✏ Düzenle (metin + adres; yazan veya yönetici). (3) **Tahsilat:** talep/doğrudan kayıt/«Tahsil ettim» pencerelerinde isteğe bağlı adres (kayıtlı adreslerden seçilebilir), kartta 📍 adres + Harita düğmesi, bekleyen talepte ✏ Düzenle (firma, not, adres; talebi açan veya yönetici), alınmış kayıtta düzenlemede adres de düzeltilir (denetim günlüğüne «Adres değişti»). Dosyalar: adrsec.js (yeni), talimat.js, tahsilat.js, index.html, sw.js, rules.json, PROJE-NOTLARI.md, README.md. **Firebase kuralı: DEĞİŞTİ** (`tahsilatlar` altına `adres`, `haritaUrl`, `adresAd`; yapıştırılmazsa tahsilatta adres kaydı «izin yok» der). Telefonda/Firebase'de SINANMADI.

- 2026-10-24: v89 — (1) **Dosyalar ayrı ana bölüm** (menüde 📁 DOSYALAR; İş Emirleri içindeki sekme kalktı; `app.js` `modGor("dos")`, `modSec`, `index.html` `pDos`). (2) **Talimat:** tamamlananlarda yönetici için «📁 Dosyalara ekle»; «✓ Yaptım» önce onay penceresi (`dTalOn`) gösterir. (3) **Tahsilat:** alınanlarda yönetici için «📁 Dosyalara ekle». (4) Dosyalar listesi talimat/tahsilat kayıtlarını gösterir (satır, detay, fotoğraf, harita, arama, tür süzgeci, Excel, silme, geri çıkarma). Dosyalar: index.html, app.js, talimat.js, tahsilat.js, sw.js, README.md, PROJE-NOTLARI.md. **Firebase kuralı: değişmedi** (`dosyalar` yazma zaten yöneticiye açık, doğrulama yok). Bilinen sınır: Muhasebe (yalnız `rap`, `sevk` yok) Dosyalar'da talimat/tahsilat kaydını görür ama `dosyaFoto` okuma kuralı `sevk` istediği için fotoğrafları açılmaz (sevk dosyalarında da aynıydı). Mantık sahte veriyle (node) sınandı; telefonda/Firebase'de SINANMADI.

- 2026-10-26: v90 — (1) **Hesapları yönetici açar:** Kayıt Ol sekmesi/formu ve `app.js`'teki kayıt kodu (`kayitYaz`, `bK`…) kaldırıldı; yönetici penceresine «＋ Yeni kullanıcı hesabı aç» (`hesap.js`, ikinci Firebase uygulamasıyla, yarım kalan hesabı tamamlayabilir, denetim günlüğüne yazar; şifre ≥6). `rules.json`: `kullanicilar/$uid` kendi kendine kayıt cümlesi silindi. (2) **👤 Hesabım:** üst çubuktaki İsim/Şifre/Çıkış tek pencerede; menüye de eklendi. (3) **Dokunma alanı + yazı:** tüm düğme/giriş/sekmelerde en az 44px, 11-13px yazılar 13-14px'e çıktı (satır içi olanlar `[style*=…]` kuralıyla), Hesabım'dan Normal/Büyük(×1,2)/Çok büyük(×1,4) yazı boyutu (`yazi.js`, cihazda saklanır). (4) İş Emirleri'ndeki «Sürüm: etiket-v33» geliştirme yazısı kaldırıldı. Dosyalar: index.html, app.js, style.css, yazi.js (yeni), hesap.js (yeni), diyalog.js, sw.js, rules.json, README.md, PROJE-NOTLARI.md. **Firebase kuralı: DEĞİŞTİ** (yapıştırılmazsa eski kendi-kendine-kayıt izni sunucuda açık kalır; yönetici hesap açma yine çalışır). Hesap açma mantığı sahte ortamda (node) sınandı; telefonda/Firebase'de ve büyük yazı görünümü gerçek ekranda SINANMADI.
- 2026-10-26: Yayın düzeni (sürüm artmadı, v90) — `firebase.json` ve `.github/workflows/yayinla.yml` eklendi: site Firebase Hosting'de yayınlanır, depo özel yapılabilir; eski adres için ayrı genel `yonlendirme-repo` (index.html, 404.html, sw.js) hazırlandı. Dosyalar: firebase.json (yeni), yayinla.yml (yeni), yonlendirme-repo/* (ayrı depo), PROJE-NOTLARI.md. Firebase kuralı: değişmedi. Yayın hattı (hizmet hesabı izni dahil) SINANMADI; ilk yayında Actions sekmesindeki sonuca bakılacak.
- 2026-10-26: Hosting geçişi (sürüm v90, kod değişmedi) — Firebase Hosting yayını çalıştı (hizmet hesabına Service Usage Consumer + Firebase Hosting Admin eklenince). Yönlendirme dosyaları yanlışlıkla ana depoya yüklenip döngü yarattı, geri alındı. Depo özelleştirme + yönlendirme deposu adımları Bölüm 9'da bekliyor. Firebase kuralı: değişmedi.
- 2026-10-26: v91 — **Fotoğraftan okuma (`fotookut.js`) hızlandırıldı:** kullanıcı okumanın eskiden ≤15 sn iken 50-90 sn sürdüğünü bildirdi (eski ve yeni adreste aynı → hosting değil, Google/Gemini tarafı; seçilen model yavaş/takılıyor olabilir; `gemini-2.5-flash` elle yazılınca da 50 sn). Çözüm: `yarisma()` — modeller sırayla değil **yarışır**: ilk model hemen başlar, 12 sn içinde cevap gelmezse sıradaki de başlar (en çok 3), ilk başarılı cevap kazanır. Hata sınıflandırma/mesajlar aynı kaldı. Node ile sahte fetch'le sınandı (yavaş ilk model → ~15 sn; 503 → hemen sıradaki; hepsi 429 → eski limit mesajı). **Gerçek Gemini ile SINANMADI.** Bedeli: yavaş durumda aynı istek iki modele gider (ücretsiz kota biraz daha çabuk dolabilir). Hâlâ yavaşsa: ekranda «Okunuyor (model)» yazan model adı istenmeli. Firebase kuralı: değişmedi.
- 2026-10-27: v93 — **Stok «📥 Hazır liste» (`stokaktar.js`, yeni dosya; index.html + sw.js'e eklendi):** kullanıcının verdiği 69 kalemlik liste (granül, konsantre, mürekkep, vernik, çözücü, palet, poşet/rulo, shrink, streç, vakum torba, çöp torbası, CPP/OPP…) kategorileriyle toplu eklenir. Birimler varsayılan (kg/adet/rulo), kullanıcı kalem düzenlemeden değiştirebilir. Firebase kuralı değişmedi. Cihazda SINANMADI.
- 2026-10-26: v92 — **Fotoğraftan okuma model sırası değişti (`fotookut.js`):** v91 sonrası kullanıcı hata gördü: Google'ın listesinde artık gemini-3.5…3.8-flash var; `gemini-2.5-flash` **404 (kalkmış)**; 3.7/3.8 günlük limit doldu (ücretsiz günlük limit çok düşük; v91 yarışı + çok deneme kotayı yemiş olabilir); 3.5/3.6 zaman aşımı (yeni modeller yavaş). Eski sıralama en YENİ modeli başa koyuyordu. Yeni sıra: yöneticinin yazdığı model → bu cihazda en son çalışan (`localStorage.okSon`) → **lite (hızlı) modeller (en çok 2)** → normal modeller (en çok 3); en çok 4 aday; günlük limiti dolan model `localStorage.okDolu` ile 3 saat atlanır. Sahte fetch ile sınandı, gerçek Gemini ile SINANMADI. Kullanıcıdan 🔑 penceresindeki model kutusunu BOŞALTMASI istendi (`gemini-2.5-flash` kalkmış). Firebase kuralı: değişmedi.

- 2026-10-26: Yalnız notlar (sürüm v92 kaldı, kod değişmedi) — yeni sohbette zip ve iki Excel incelendi; kontrol.js temiz; Bölüm 9'a «GÜNCEL DURUM» eklendi (404.html zip'te duruyor, israpor.js notlarda yoktu). Firebase kuralı: değişmedi.

## 8.5 DERSLER (aynı hatayı tekrarlama — kısa liste)

1. **Uzun-sorgu (`forceLongPolling`) bu sitede ASLA kullanılmaz.** `index.html` CSP'si `script-src`te firebaseio.com'a izin vermez; Firebase uzun-sorgu script yükler, engellenir, bağlantı kalıcı kopar (v85-v87 yaşandı). Takılmada: `forceWebSockets()` + `db.goOffline()` → `goOnline()`.
2. **Satır içi `<script>` yok; yeni dış alan adı eklenecekse CSP'ye de eklenir.** CSP'yi değiştirmeden önce Firebase'in kullandığı adresleri düşün.
3. **API anahtarı koda yazılmaz** (GitHub «Secret scanning» push'u engeller, anahtar sızar). Gemini anahtarı yalnızca yönetici 🔑 penceresinden girilir.
4. **Zip gerçektir, notlar ikinci plandadır.** Notlarda yazan her şey kodda olmayabilir (v73 düzeltmesi notlarda vardı, kodda yoktu). Önemli bir şeye güvenmeden önce `grep` ile koda bak.
5. **Hangi dosya değişirse sürüm artar** (`node kontrol.js --artir`). v83'te etiket.js değişti, sürüm artmadı → telefonlar eski dosyayı gösterebilirdi.
6. **Claude telefonda/Firebase'de deneyemez.** «Sınanmadı» diye dürüstçe yaz. Sorun bulunamazsa tahmin etme: ölçen bir **tanı** ekle, kullanıcıdan ekran görüntüsü iste (v86 tanısı sorunu 1 turda buldu).
7. **`fbKur(q)` kimlikleri:** `q+"N"`, `q+"X"`, `q+"D1"`, `q+"D2"` kullanılır; yeni öğelere bu önekleri verme (v61 kimlik çakışması).
8. **Etikette ebat sadece rakam** (kullanıcı kararı, v84): iş emrindeki «30CM T.AÇIK» etikette `30`; iş emri formu ve yazdırma olduğu gibi kalır.
9. **Yönetici hesap açarken oturumunu kaybetmemeli:** `createUserWithEmailAndPassword` normalde yeni hesapla giriş yaptırır; bu yüzden hesap ikinci uygulamada (`firebase.initializeApp(CFG,"hesapAc")`, kalıcılık `NONE`) açılır. Ana `auth`/`db` aynen yönetici kalır.
10. **Kullanıcı kod bilmiyor:** tam hazır dosya ver, «şuraya git şunu değiştir» deme; her teslimatta GitHub'a yüklenecek dosyaları, Firebase kuralı durumunu, yeni sürümü yaz.

11. **GitHub web arayüzü ipuçları (kullanıcı kod bilmez):** «Create new file»de dosya adının SONUNA `/` yazılırsa GitHub adı klasör sanır ve «Commit changes» soluk kalır → Backspace ile kaldır / adı bir karakter yazıp sil. `.github/workflows/...` gizli klasör: elle «Create new file» ile oluşturulur, zip/sürükle-bırak ile değil. Yüklenecek dosyaları her seferinde tek tek ADIYLA yaz (kullanıcı klasördeki hepsini yüklemek isteyebilir). Ekran görüntüsü gönderirse üzerinden düğmeyi tarif et.

12. **Yönlendirme dosyaları (index.html, 404.html, sw.js) iki ayrı depodadır; ana depoya YÜKLENMEZ.** 26 Ekim'de ana depoya yüklenince web.app kendi kendine yönlendi (döngü). Kullanıcıya her seferinde hangi dosyanın HANGİ depoya gideceğini adıyla yaz. Ana depoda 404.html olmaz. Hosting izin hatasında çözüm: Google Cloud IAM'de `firebase-adminsdk-fbsvc@...` hesabına Service Usage Consumer + Firebase Hosting Admin.

## 9. Yapılacaklar / yarım kalan / alınan kararlar

**Yapılacaklar (kullanıcı isteklerini buraya yaz, bitenleri günlüğe taşı):**
- **v90 cihazda denenmeli:** yönetici ile yeni kullanıcı aç → o hesapla giriş; Hesabım menüsü (isim, şifre, çıkış); yazı boyutu Büyük/Çok büyük ile ana ekranlar (sevkiyat kartı, iş emri, tahsilat, granül tablosu) taşma yapıyor mu; rules yayınlandı mı.
- **Önerilenlerden kalanlar (kullanıcı sırayla isteyecek):** yeni sürüm uyarısı, operatör «Benim işlerim» ekranı, test Firebase projesi, taslak kaydı, hata günlüğü, Gemini anahtarı kısıtlama, şifre sıfırlama fonksiyonunun deploy testi.
- **v81 cihazda denenmeli:** pano kartları, bağlantı şeridi (uçak modu ile), yedek zamanının panoda görünmesi. Rules yayınlandı mı sorulmalı.
- **[ERTELENDİ] Telefona gerçek bildirim (push, FCM):** FCM ücretsiz ama gönderen sunucu kodu (Cloud Functions) **Blaze planı** (kart bilgisi) ister; kullanıcı «ücretsizse ekle» dedi → eklenmedi. Blaze'e geçilirse: istemci FCM token + `sw.js` push dinleyicisi + `index.js`'e `sevkTalimat`/`tahsilatlar` onCreate ve zamanlanmış geciken-iş fonksiyonları. iPhone'da yalnız ana ekrana eklenmiş PWA (iOS 16.4+) alır.
- Olası ek: Cloud Function ile zamanlanmış otomatik yedek (Blaze), pano kartlarını rol bazlı diğer kullanıcılara açma, bağlantısız kayıtlar için kalıcı kuyruk.
- v63'te eklenenler (rapor, termin, bildirim, hata önleme) cihazda denenmeli; kullanıcı geri bildirimine göre düzeltilecek. Olası ek: termine göre filtre, raporda operatör filtresi, geciken işi zilde gösterme.
- **[KULLANICIYA SÖYLENDİ] Firebase otomatik günlük yedeği (Realtime Database > Backups, Blaze planı) açılmalı;** açık mı bilinmiyor. Kullanıcıdan adım adım isterse anlat.
- **[TEMİZLİK] GitHub deposunda `fabrika-v44-degisen-dosyalar.zip` ve `fabrika-v45-degisen-dosyalar.zip` gereksiz;** kullanıcı silebilir (siteyi etkilemez). v84 temizliğinde zip'te bu dosyalar yoktu; GitHub'da hâlâ duruyorsa silinmeli.
- Tahsilat için olası eklemeler (kullanıcı istemedi, yapılmadı): Excel'e aktarma, çek vadesi/banka alanı, firmaya göre toplam/cari özeti, bekleyen talep için bildirim, WhatsApp'a özet gönderme. Ayrıca WhatsApp grubundaki eski kayıtlar uygulamaya aktarılmadı (sadece bundan sonrası).
- Talimatlar için olası ek: zil bildirimi / WhatsApp önerisi, talimata fotoğraf veya not ekleme (kullanıcı istemedi, yapılmadı).

**Yarım kalan iş (sohbet kesilirse buraya yaz: ne yapılıyordu, hangi dosyada, neresi kaldı):**
- **GÜNCEL DURUM (2026-10-26, yeni sohbet; zip + 2 Excel incelendi):**
  - **Zip = v92.** `node kontrol.js` → «Sorun yok»: 22 .js dosyasında yazım hatası yok, sürüm tutarlı (v92), rules.json geçerli (24 yol), roller ve izinler uyumlu. Bu sohbette kod DEĞİŞMEDİ, sürüm artmadı.
  - **Kalınan yer:** Kod tarafı v92'de duruyor (son iş: fotoğraftan okuma model sırası). Hosting geçişi Bölüm 9 «HOSTING GEÇİŞİ KISMEN BİTTİ» maddesindeki **adım 0'da**: web.app yayında ve çalışıyor; adım 1-5 (depoyu `fabrika-sevkiyat-kod` yapmak, özel yapmak, yönlendirme deposu, eski adresi denemek, telefonlarda kısayolu yenilemek) YAPILDI mı bilinmiyor. Kullanıcıya sorulmalı.
  - **Notla zip arasında FARK 1 — `404.html` zip'te var:** Önceki notta ana depodaki 404.html'in silinmesi gerektiği (Ders 12) ve kullanıcının «oldu» dediği yazıyordu; ama bu zip'in kökünde yönlendirme içerikli `404.html` duruyor (`firebase.json` onu yayından çıkarmıyor). Ya silinmedi ya zip eski. **İlk iş:** GitHub ana deposunda 404.html var mı baksın; varsa sildirilsin (sürüm artmaz). Aksi halde web.app'te olmayan bir adreste yönlendirme sayfası çıkar ve yeniden döngü riski olur.
  - **Fark 2:** `israpor.js` kodda ve `sw.js`'de var, notlarda yoktu → Bölüm 2 tablosuna eklendi.
  - **Bekleyen denemeler (kullanıcı haber verecek):** v92 fotoğraftan okuma (🔑 penceresindeki model kutusu BOŞALTILDI mı; okuma süresi); v90 hesap açma / Hesabım / büyük yazı; v81 pano ve bağlantı şeridi; rules yayınlandı mı.
  - **Yüklenen 2 Excel (proje kodunun parçası DEĞİL, bilgi amaçlı):** `MALİYET_TABLOSU.XLSX` — MAG AMBALAJ güncel fiyat/maliyet hesabı (tarih 26.10.2026, dolar kuru 49,7285): sayfalar GÜNCEL FİYAT (günlük fiyat listesi), RULO MALİYET eko, RULO MALİYET (MAG rulo + baskılı rulo), ÇEŞİT MALİYET (atlet/torba HDPE, kalsitli karışımlar). Hammadde kg fiyatları: HDPE 1,85 · LDPE 2,1 · LLDPE 1,75 · kalsit 0,8 $; her üründe hammadde + baskı + elektrik + kutu + masura + fire + bıçak + genel gider → KDV hariç maliyet → hedef satış fiyatı ve ₺/$/€ karşılıkları hesaplanıyor. `POŞET_ADET_HESAPLAMA.xlsx` — poşet adet maliyeti (en × boy × mikron × özgül ağırlık → gramaj → kg/adet → TL/USD/EUR adet fiyatı; atlet, çanta, CPP bantlı, direk ölçü); **eski**: tarihi 17.05.2023, dolar kuru 19,80, kg fiyatları çoğu satırda boş. Uygulamaya bağlanması konusunda henüz istek yok; istenirse önce hangi hesabın uygulamaya taşınacağı sorulur.
- **HOSTING GEÇİŞİ KISMEN BİTTİ (2026-10-26).** Amaç: kod özel GitHub deposunda dursun, site Firebase Hosting'de yayınlansın (Bölüm 1.1). Kullanıcı GitHub'ı web arayüzünden (Chrome, Windows, İngilizce arayüz) elle yönetir; adım adım, düğme adlarını İngilizce yazarak anlatılmalı. **YAPILDI VE SINANDI:** Firebase Hosting açık; hizmet hesabı `firebase-adminsdk-fbsvc@sevkiyat-fc22b.iam.gserviceaccount.com`'a IAM'de **Service Usage Consumer** + **Firebase Hosting Admin** rolleri verildi (ilk yayın 403 PERMISSION_DENIED vermişti); `yayinla.yml` yeşil ✓; https://sevkiyat-fc22b.web.app açılıyor, giriş ekranı geliyor, veritabanı «Çevrimiçi». **OLAY:** Yönlendirme dosyaları (index.html, 404.html, sw.js) yanlışlıkla ANA depoya yüklendi → web.app yönlendirme sayfasını gösterip döngüye girdi. Gerçek index.html ve sw.js (v90) zip'ten geri yüklendi, ana depodaki 404.html silinecekti; kullanıcı «oldu» dedi. **KALAN (bu sırayla, her adımı bitirince kullanıcı haber verir):** 0) web.app'te giriş + menüler sınanmalı (kullanıcıya söylendi), ana depoda 404.html KALMADIĞI doğrulanmalı; 1) ana depoyu `fabrika-sevkiyat-kod` olarak yeniden adlandır (Settings > Repository name > Rename); 2) Settings > Danger Zone > Change visibility > Make private (GitHub Pages kapanır, eski adres ölür); 3) `fabrika-sevkiyat` adıyla YENİ GENEL depo aç (README'siz), YALNIZ yönlendirme dosyalarını (index.html, 404.html, sw.js) yükle, Settings > Pages > main / root; 4) eski adresin yeni siteye atladığını dene; 5) herkesin telefonunda eski kısayolu silip https://sevkiyat-fc22b.web.app adresini yeniden ekle, yeni adreste herkes bir kez tekrar giriş yapar (localStorage origin'e bağlı). Yönlendirme dosyaları kullanıcının bilgisayarında bulunamadı; Claude yeniden yazdı (index.html: `location.replace('https://sevkiyat-fc22b.web.app/'+search+hash)` + düğme; 404.html aynısı; sw.js: önbellekleri siler, kendini kaldırır). **Bu yeniden yazılan dosyalar gerçek cihazda SINANMADI.** Güvenlik açıklaması kullanıcıya verildi: veriyi koruyan şey giriş + rules.json (değişmedi); deponun özel olması yalnız kodun/ayarların dışarıdan okunmasını engeller; site adresi herkese açık kalır.

**Alınan kararlar:**
- Kod tabanı ayrı .js dosyalarıdır; satır içi script yazılmaz (CSP).
- Teslimat: tam dosya + (rules değiştiyse) tam rules. Parça/yama verilmez.
- Sürüm numarası her kod değişikliğinde artar (`node kontrol.js --artir`).

**Açık konular / bilinmeyenler:**
- **v65 fotoğraftan okuma sınanmadı:** Gemini'nin tarayıcıdan (CORS) çağrılması, model adı, Türkiye'den ücretsiz kullanım ve okuma doğruluğu gerçek cihazda denenmeli. Ücretsiz kullanımda Google gönderilen içeriği ürün geliştirmede kullanabilir (müşteri adları form üzerinde var). Mikro'dan ileride otomatik aktarım (Excel içe aktarma / SQL köprüsü) ayrı konu, kullanıcı şimdilik fotoğrafı seçti.
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
