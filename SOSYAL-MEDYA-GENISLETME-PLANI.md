# Ekosistem Sosyal Medya Dashboard Genişletme Planı

## Hedef

`ekosistem-sosyal-medya` projesini merkezi bir platform haline getirerek:

- Tüm hard-coded bağımlılıkları ve marka referanslarını temizlemek.
- Dinamik tenant yapısı ile sınırsız sayıda sosyal medya projesi/markası yönetimi eklemek.
- Facebook, Instagram, LinkedIn, X (Twitter), YouTube gibi kanallar için modüler hesap tanımları yapmak.
- İçerik planı, AI destekli post oluşturma ve gelişmiş zamanlama altyapısını güçlendirmek.
- Dış içerik kaynaklarını (Ecosystem Sources) dinamik ve seçilebilir hale getirmek.
- Bu yetkilendirme ve veri çekme katmanını `packages/shared-backend` altında ortak modül olarak standartlaştırmak.

---

## Mevcut Durum Analizi

- `backend` modüllerinde eski marka referansları ve test hashtag akışları bulunuyor.
- `db/schema.ts` sosyal post, template ve kampanya takvimi altyapısına sahip; ancak:
  - Platform ve kaynak çeşitliliği kod seviyesinde kısıtlı.
  - Proje/Hesap seçim katmanı veritabanı yerine kodda tanımlı olabiliyor.
- Cron işleyişi var ancak çoklu tenant (SaaS) yapısına tam adapte edilmeli.

---

## Faz 1: Hard-code Temizliği ve Dinamik Altyapı

1. `backend/src/modules/*` içindeki tüm sabit marka referanslarını kaldır.
2. Test post metinlerini ve varsayılan içerikleri jenerik (örnek) verilere çevir.
3. Route ve cron isimlerini görev odaklı hale getir:
   - `content-sync` tarafında tenant bazlı dinamik sync mantığına geç.
4. Dokümantasyon ve README dosyalarını marka bağımsız hale getir.

---

## Faz 2: Sosyal Hesap ve İçerik Modelleri (Dinamik)

### 2.1 Hesap Yönetimi

- Genişletilmiş tablolar:
  - `social_accounts`: Platform bazlı API yetkileri ve durum takibi.
  - `social_projects`: Marka/Proje tanımları (SaaS tenant yapısı).
  - `social_project_platform_map`: Hangi projenin hangi platformlarda aktif olduğunun eşleşmesi.

### 2.2 İçerik Giriş ve Yönetim

- Post Editör Alanları:
  - Başlık, açıklama, CTA, dinamik hashtag setleri, medya URL'leri.
  - Dinamik proje seçimi (Veritabanından çekilen aktif projeler).
  - Gelişmiş zamanlama seçenekleri.
- Takvim Görünümü:
  - Çoklu proje desteği ile haftalık/aylık içerik planı.
  - Durum bazlı görselleştirme (Taslak/Planlandı/Yayınlandı/Hata).

---

## Faz 3: Ekosistem Veri Konnektörleri (Dynamic Source Adapters)

Amaç: İçerik üretirken farklı ekosistem projelerinden (haber portalı, e-ticaret, fiyat listesi vb.) **sadece okuma** yaparak veri çekmek.

### 3.1 Konum ve Yapı

- `backend/src/modules/sourceConnectors/`: Tüm dış kaynak bağlantılarını yöneten modül.
- Drizzle/MySQL read-only havuzu üzerinden güvenli bağlantı.

### 3.2 Modül Yapısı

- `registry.ts`: Çalışma zamanında (runtime) konfigüre edilebilir kaynak listesi.
- `adapters/`: Her kaynak türü için (API, RSS, DB) standartlaştırılmış arayüzler.
- `pool.ts`: Verimli bağlantı yönetimi.
- `router.ts`: `/api/sources` üzerinden dinamik veri çekme endpointleri.

### 3.3 Veri Güvenliği

- `ecosystem_sources` tablosu sadece metadata tutar.
- Hassas bilgiler (URL, Key, Credentials) sadece `.env` veya Vault üzerinde saklanır.
- Her bağlantı en düşük yetkili (Read-Only) kullanıcı ile yapılır.

---

## Faz 4: Dashboard UX (Branding-Independent)

- Sol Panel:
  - Dinamik Proje/Marka seçimi.
  - Platform bazlı filtreleme.
- Ana Panel:
  - İçerik takvimi ve yayın kuyruğu.
  - Platform bazlı performans metrikleri.
- Uyarılar:
  - Token süresi dolan hesaplar, yayın hataları ve kaynak bağlantı durumları.

---

## Kabul Kriterleri

- Hiçbir kod dosyasında sabit marka adı (hard-coded) bulunmaz.
- Yeni bir proje/marka eklemek için kod değişikliği gerekmez (Seed/DB üzerinden yapılır).
- Tüm içerik kaynakları dinamik olarak tanımlanabilir ve seçilebilir.
- Dashboard tamamen veri odaklıdır; veritabanında ne varsa onu gösterir.
- Güvenlik protokolleri (Read-only, Secret management) tam uygulanmıştır.

---

## Uygulama Kontrol Listesi

1. Tüm sabit metinleri ve marka isimlerini temizle.
2. Sosyal hesap ve proje modellerini DB tarafında stabilize et.
3. Dinamik `sourceConnectors` modülünü hayata geçir.
4. Dashboard üzerindeki tüm statik alanları API verisine bağla.
5. Cron işlerini tenant-aware hale getir.
6. E2E Test: Yeni tenant ekle -> Kaynak bağla -> İçerik planla -> Yayınla.
7. İleride 2. tüketici çıkınca modülü `packages/shared-backend/modules/ecosystemSources/`'a taşı.
