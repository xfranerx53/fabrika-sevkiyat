# PROJE-NOTLARI.md — Fabrika Stok & Sevkiyat (MAG AMBALAJ)

> Bu dosya, sohbet süresi dolup YENİ bir sohbet/e-posta açıldığında Claude'un
> kaldığımız yerden devam edebilmesi için yazıldı. Claude'un bu sohbetler arası
> hafızası yoktur; hafıza BU DOSYADIR. Her değişiklikte güncellenir.

Son güncelleme: 2026-10-14 (ilk sürüm)

---

## 0. CLAUDE İÇİN TALİMAT (ÖNCE BUNU OKU)

**Kullanıcı kod bilmiyor.** Tüm kod yazma/değiştirme işini Claude yapar.
Kullanıcı sadece dosya indirip GitHub'a yükler ve Firebase'e metin yapıştırır.

Kesin kurallar:

1. **Asla "şuraya git, şunu değiştir" diye tarif etme.** Değişen dosyaları
   Claude düzenler ve **tam, hazır dosya** olarak verir (present_files ile indirilebilir).
2. **Firebase rules değişirse TAMAMINI ver** (tek parça, kopyala-yapıştır edilecek
   kod bloğu). Parça parça verme. Nereye yapıştırılacağını yaz:
   Firebase Konsolu > Realtime Database > Kurallar > hepsini sil > yapıştır > Yayınla.
3. **index.html içindeki JavaScript'e dokunulduysa mutlaka şunu çalıştır:**
   `node csp-guncelle.js` (Claude kendi ortamında çalıştırır).
   Çalıştırılmazsa sayfa BOŞ AÇILIR (güvenlik özetleri/CSP uyuşmaz). Kullanıcı
   node çalıştıramaz, bu yüzden bu adım her zaman Claude'a aittir.
4. **index.html değiştiyse `sw.js` içindeki `CACHE = 'fabrika-vXX'` numarasını 1 artır**
   (telefonlar eski sürümde kalmasın diye).
5. Her teslimatın sonunda şu kısa listeyi ver:
   - **GitHub'a yüklenecek dosyalar:** (isimleri)
   - **Firebase'e yapıştırılacak:** rules var mı / yok
   - **PROJE-NOTLARI.md** de değiştiyse bunu da yükle.
6. **Her değişiklikte bu dosyayı güncelle** (Bölüm 7 günlüğüne satır ekle,
   yapı değiştiyse ilgili bölümü düzelt) ve teslimata ekle. Sohbet her an
   yarıda kesilebilir; bu yüzden güncellemeyi iş bitince değil, her teslimatta yap.
7. Kullanıcı zip yüklemediyse önce güncel zip'i iste (GitHub > Code > Download ZIP).
   Eski/hatırladığın koda güvenme; zip'teki dosya gerçektir.
8. Kullanıcıyla Türkçe, sade, teknik terimsiz konuş.
9. Rules'u değiştirirken `rules.json` dosyasını da güncelleyip ver (Bölüm 8'e bak).

---

## 1. Proje özeti

- **Ne:** Fabrika için stok, sipariş, iş emri ve sevkiyat takip uygulaması (telefona
  eklenebilen PWA). Firma: MAG AMBALAJ.
- **Adres (GitHub Pages):** https://xfranerx53.github.io/fabrika-sevkiyat/
- **GitHub deposu:** xfranerx53/fabrika-sevkiyat (ana dal: main)
- **Arka uç:** Firebase projesi `sevkiyat-fc22b`, **Realtime Database** (Firestore DEĞİL),
  Firebase Auth (e-posta/şifre). İstemci kütüphanesi: Firebase JS **8.10.1** (compat).
- **Veritabanı adresi:** https://sevkiyat-fc22b-default-rtdb.firebaseio.com
- **Dil:** Arayüz ve kod yorumları Türkçe.
- Kullanıcı e-postalarını değiştirerek yeni sohbet açıyor; Claude hafızası hesaplar arası
  paylaşılmaz. Süreklilik bu dosya ile sağlanır.

## 2. Dosyalar (zip'in içindeki gerçek durum)

| Dosya | Ne işe yarar | Nereye gider |
|---|---|---|
| `index.html` (~300 KB, ~4000 satır) | Uygulamanın TAMAMI: arayüz + CSS + JavaScript (9 satır içi `<script>` bloğu) | GitHub (siteye yüklenir) |
| `sw.js` | Çevrimdışı önbellek (service worker). `CACHE='fabrika-vXX'` | GitHub |
| `manifest.webmanifest` | Telefona kurulum bilgisi (ad, renk, ikonlar) | GitHub |
| `icon-*.png`, `apple-touch-icon.png`, `favicon-32.png` | İkonlar | GitHub |
| `csp-guncelle.js` | index.html'deki script özetlerini (SHA-256) hesaplayıp güvenlik etiketini (CSP) günceller. **Sadece Claude çalıştırır.** | GitHub'da durabilir, siteyi etkilemez |
| `index.js` + `package.json` | Firebase Cloud Function `sifreSifirla` (yönetici başka kullanıcının şifresini sıfırlar). Normalde `functions/` klasöründe olması gerekir | Firebase'e ayrıca deploy edilir (siteyle ilgisi yok) |
| `README.md` | Eski kısa açıklama (kısmen güncel değil, Bölüm 8) | GitHub |
| `PROJE-NOTLARI.md` | Bu dosya | GitHub |
| `rules.json` | Firebase kuralları metni (Bölüm 8: depoda henüz yok) | GitHub (yedek) + Firebase'e yapıştırılır |

**Not:** Dosyalar "ayrıldı" denmişti ama `index.html` hâlâ hemen her şeyi içeriyor.
Ayrılan kısımlar sw.js, manifest, ikonlar ve functions dosyalarıdır.
CSP nedeniyle JavaScript satır içi kalmalı; ayrı .js dosyasına bölmek `csp-guncelle.js`
ve CSP yapısının yeniden düzenlenmesini gerektirir (şu an yapılmadı).

## 3. Güvenlik: CSP kuralı (kritik)

`index.html` başında `Content-Security-Policy` meta etiketi var. Satır içi her
`<script>...</script>` bloğunun SHA-256 özeti orada listeli. Script içeriği 1 harf bile
değişirse özet tutmaz ve **sayfa boş açılır**. Çözüm: `node csp-guncelle.js` (Claude yapar,
Bölüm 0 madde 3). Yeni dış script kaynağı eklenirse `csp-guncelle.js` içindeki
`script-src` listesine alan adı eklenmelidir.

## 4. Veritabanı yapısı (Realtime Database yolları)

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
| `isEmirleri/{id}` | İş emirleri (aşama akışı Bölüm 6) |
| `isHareket/{id}/{h}` | İş emri hareket kayıtları (yalnız eklenir) |
| `etiketGecmis/{id}/{h}`, `etiketSablon/{m}/{k}` | Etiket basım geçmişi ve şablonlar |
| `ayarlar/etiket` | Etiket ayarı (`w`, `h`, `mag`) |
| `cop/{id}` | Çöp kutusu: silinenlerin yedeği (yönetici geri yükler) |
| `denetim/{id}` | Denetim günlüğü (kim ne yaptı), sadece yönetici okur |

Fotoğraflar `data:image/jpeg;base64,...` metni olarak tutulur (300.000 karakter sınırı).

## 5. Roller ve izinler

**Roller:** Depo Görevlisi, Sevkiyat Sorumlusu, Ekstruder Operatörü, Matbaa Operatörü,
Kesim Operatörü, Bobinoz Ustası, Muhasebe. Ayrıca `yonetici=true` olan **yönetici**.

**Onay:** Yeni kayıt olan kullanıcı `onay=false` başlar; yönetici onaylayana kadar hiçbir
şey göremez/yapamaz. Kullanıcı kendi kaydında `onay`, `yonetici`, `izin` alanlarını
kendi kendine açamaz (rules engeller).

**İzin anahtarları** (`kullanicilar/{uid}/izin/...`, true = rolden bağımsız ver,
false = rol varsayılanını kapat, yoksa rol varsayılanı geçerli):
`sevk`, `stok`, `is`, `rap`, `a_etiket`, `a_ekstruder`, `a_baski`, `a_kesim`, `a_depo`,
`isAc`, `isDuzenle`, `geriAl`, `isSil`, `fiyat`.

Rol varsayılanları (özet):
- **Sevkiyat verisi** (`urunler`, `sevkAdresleri`): Depo Görevlisi, Sevkiyat Sorumlusu (Sevkiyat Sorumlusu başkasının kaydını yazamaz, kendi rolüyle sınırlı), Muhasebe okur (rap).
- **Stok** (`stokKalem`, `stokHareket`, `tedarikciler`, `siparisler`): Depo Görevlisi, Muhasebe.
- **İş emirleri:** Sevkiyat Sorumlusu hariç tüm roller okur. İş emrini açma: yönetici/Depo/Muhasebe. Fiyat: yönetici/Muhasebe.
- **Silme:** kendi eklediğini silebilir (iş emri için `isSil` izni gerekir); yönetici hepsini.
- Yönetici-only: `kullanicilar` listesi, `fiyatlar`, `cop`, `denetim`, `dosyalar` yazma.

## 6. Uygulama ekranları ve iş akışı

- **Giriş Yap / Kayıt Ol** ekranı. Kayıt sonrası yönetici onayı beklenir.
- **Modüller:** 🚚 SEVKİYAT, 📦 STOK (üstte sekme).
- **Sevkiyat modülü:** SEVKİYATLAR (HAZIR ÜRÜNLER → SEVK EDİLECEKLER → SEVK EDİLENLER;
  Excel'e aktar), SEVK ADRESLERİ, DOSYALAR (yönetici "ONAYLA" ile arşive taşır).
  Ürün kartında: fotoğraf, irsaliye fotoğrafı (tür: irsaliye/iade/diğer), araç/sorumlu,
  Yol tarifi, WhatsApp ile paylaşma, İş emrine geri al.
- **Stok modülü:** KALEMLER (giriş/çıkış, geçmiş, yazdır), SİPARİŞLER (kategoriye göre /
  liste), TEDARİKÇİLER.
- **İş emirleri aşama akışı:**
  `etiket → ekstruder → (baskı varsa baski) → kesim → depo → bitti`
  Her aşamayı ilgili rol/izin ilerletir; `geriAl` izni olanlar bir aşama geri alabilir.
  Biten iş "HAZIR ÜRÜNLER"e aktarılabilir (`bekleAktar`, `aktarildi`).
- **Yönetici:** yedekleme (JSON/Excel indirme), çöp kutusu (geri yükle/kalıcı sil),
  denetim günlüğü, kullanıcı yönetimi (onay, rol, izin), fiyatlar, KDV ayarı.
- **Şifre sıfırlama:** Cloud Function `sifreSifirla` (Blaze planı gerekir). Deploy durumu
  kullanıcıya sorulmalı (Bölüm 8).

## 7. Değişiklik günlüğü (en yenisi en altta)

- 2026-10-14: PROJE-NOTLARI.md oluşturuldu. Sistem incelendi, kod değişmedi. SW önbellek: fabrika-v38.
- (Yeni satırlar buraya eklenecek: tarih, ne değişti, hangi dosyalar, rules değişti mi, sw sürümü)

## 8. Açık konular / bilinmeyenler

- **`rules.json` depoda yok.** README bunu söylüyor ama zip'te yok. Gerçek kurallar Firebase
  Konsolu'nda duruyor. Sohbet kesilse bile kaybolmasın diye: Firebase > Realtime Database >
  Kurallar'daki metni kopyalayıp GitHub'da `rules.json` adıyla yeni dosya olarak kaydedin.
  Bundan sonra Claude rules değiştirdiğinde `rules.json`'ı da tam halde verecek.
  Yeni sohbette rules gerekiyorsa ve zip'te yoksa, kullanıcıdan Firebase'deki güncel metni
  yapıştırmasını iste.
- `index.js` ve `package.json` depo kökünde duruyor (Cloud Functions için `functions/` içinde
  olmalı). Fonksiyonun Firebase'e deploy edilip edilmediği bilinmiyor.
- README.md'deki `functions/` ve `rules.json` anlatımı bu zip ile uyuşmuyor.
- Önceki sohbetlerdeki ayrıntılı geçmiş kayıp; bilinen tek şey yukarıdaki yapı.

---

## YENİ SOHBET BAŞLANGIÇ METNİ (kullanıcı bunu yapıştırır)

> Merhaba. Ben kod bilmiyorum, tüm değişiklikleri sen yapıyorsun. Ekteki zip benim
> fabrika-sevkiyat projem. Önce zip içindeki PROJE-NOTLARI.md dosyasını oku ve oradaki
> kurallara uy: değişen dosyaları tam hazır ver, Firebase rules değişirse tamamını ver,
> csp-guncelle.js'i sen çalıştır, notları güncelle. Sonra benden ne istediğimi bekle.
>
> Yapmak istediğim şey: ...
