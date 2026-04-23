# Ekosistem Sosyal Medya SaaS - Uygulama Plani

## 1) Amac

Bu proje, birden fazla marka/proje icin tek panelden sosyal medya icerigi uretme, planlama, yayinlama ve olcumleme amaciyla gelistirilen multi-tenant bir SaaS uygulamasidir.

Hedef:
- Her tenant (ornek: `bereketfide`, `vistaseed`) kendi iceriklerini ve sosyal hesaplarini ayrik gorsun.
- Facebook, Instagram, LinkedIn ve X (Twitter) baglantilari tenant bazli yonetilsin.
- Tenant secince sadece o tenantin icerik, kuyruk, template ve hesaplari gorulsun.

## 2) Kapsam

- Multi-tenant icerik yonetimi
- Multi-tenant sosyal hesap baglantisi
- Icerik uretimi (manuel + AI + template)
- Zamanlama ve yayinlama
- Platform bazli analitik toplama
- Rol tabanli panel erisimi (admin/editor)

## 3) Mimari Prensipler

- Hard-coded marka/proje ismi yok.
- Tenant secimi API ve UI seviyesinde zorunlu.
- Ortak kod tekrar etmez; paylasilabilir modul mantigi korunur.
- Tum entegrasyonlar env + DB konfig ile calisir.
- Idempotent seed mantigi korunur.

## 4) Veri Modeli (SaaS)

Ana tablolar:
- `social_projects` (tenant registry)
  - `project_key`, `name`, `website_url`, `is_active`
- `social_posts`
  - `sub_type` tenant key olarak kullanilir (ileride `tenant_id`ye tasinabilir)
- `content_templates`
  - tenant prefix veya tenant kolonu ile filtrelenir
- `platform_accounts`
  - tenant bazli hesap/token kayitlari (genisletilecek)
- `post_analytics`
  - platform + post bazli performans

## 5) API Kontrati (Hedef)

- `GET /api/v1/tenants`
- `GET /api/v1/posts?tenantKey=<key>`
- `POST /api/v1/posts` (body: `tenantKey` zorunlu)
- `GET /api/v1/templates?tenantKey=<key>`
- `POST /api/v1/templates` (tenant baglamli)
- `GET /api/v1/platforms?tenantKey=<key>`
- `POST /api/v1/platforms/:platform/connect` (tenant baglamli)
- `POST /api/v1/platforms/:platform/test` (tenant baglamli)

## 6) Sosyal Platform Entegrasyonlari

### 6.1 Facebook
- Tenant bazli page token saklama
- Page secimi + token dogrulama
- Test post endpointi
- Post publish + hata loglama

### 6.2 Instagram
- Tenant bazli business account baglama
- Token dogrulama + yenileme
- Gorselli post publish
- Publish sonuc kaydi

### 6.3 LinkedIn
- Tenant bazli organization/page baglama
- OAuth token + refresh token saklama
- Text/link post publish
- Rate-limit ve hata yonetimi

### 6.4 X (Twitter)
- Tenant bazli app/user token saklama
- Text/media tweet yayinlama
- API hata kodlarinin normalize edilmesi
- Geri donus ID'lerinin kaydi

## 7) Tenant Bazli Hesap Izolasyonu (Kritik)

Kurallar:
- Her `platform_account` bir tenanta bagli olmalidir.
- Publish sirasinda sadece secili tenantin hesaplari kullanilir.
- Bir tenantin tokeni diger tenant tarafinda gorunmez/kullanilmaz.
- UI'da tenant degistiginde platform kartlari yeniden yuklenir.

## 8) Checklist (Uygulama Sirasi)

### P0 - Tamamlanmasi Zorunlu

- [x] `platform_accounts` tablosuna tenant bagini ekle (`tenant_key` veya `tenant_id`)
- [x] Tum platform route'larina `tenantKey` validasyonu ekle
- [x] `POST /posts` icin `tenantKey` zorunlu hale getir
- [x] Publish pipeline'da tenant disi hesap kullanimini engelle
- [x] Dashboard ustune global tenant switcher ekle (tum sayfalarda ortak)
- [x] Posts/Templates/Queue ekranlarini tenant secimine gore izole et
- [x] Seed dosyalarini tenant bazli hesap + icerik verisi ile guncelle
- [x] Kalan tum domain-spesifik eski metinleri temizle (genel SaaS diline gec)

### P1 - Entegrasyon Genisletme

- [x] LinkedIn API modulu ekle (`connect`, `status`, `publish`, `test`)
- [x] X (Twitter) API modulu ekle (`connect`, `status`, `publish`, `test`)
- [x] Her platform icin token health-check cron'u ekle
- [x] Tenant bazli platform hata gecmisi endpointi ekle
- [x] Tenant bazli analytics ozet endpointi ekle

### P2 - Urunlestirme

- [x] Tenant bazli rol/izin matrisi (tenant-admin, tenant-editor)
- [x] Tenant onboarding sihirbazi (proje + platform baglantisi)
- [x] Webhook/event bus ile publish sonucu asenkron isleme
- [x] Tenant bazli aylik rapor PDF export

## 9) Test Checklist

- [ ] Tenant A tokeni ile Tenant B adina post atilamiyor
- [ ] Tenant degisince posts/templates verisi dogru filtreleniyor
- [ ] Facebook + Instagram publish tenant bazli dogru hesaba gidiyor
- [ ] LinkedIn + X test publish endpointleri calisiyor
- [ ] Seed tekrarinda duplicate/bozuk veri olusmuyor
- [ ] CORS, auth ve refresh token akisi bozulmuyor

## 10) Operasyon ve Env

Ornek env anahtarlari:
- `APP_NAME`
- `NEXT_PUBLIC_APP_NAME`
- `CONTENT_SOURCE_LABEL`
- `FB_APP_ID`, `FB_APP_SECRET`
- `IG_ACCOUNT_ID`, `IG_ACCESS_TOKEN`
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`
- `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`

Notlar:
- `.env` commit edilmez.
- Tenant bazli hassas tokenlar DB'de sifrelenmis saklanmalidir (P1/P2).

## 11) Sonraki Mantikli Adim (Bu Sprint)

1. Tenant bazli platform hesap bagini DB seviyesinde zorunlu yap.
2. Facebook/Instagram mevcut entegrasyonunu tenant'a bagla.
3. LinkedIn ve X icin temel `connect + test + publish` akisini ekle.
4. Dashboard'da tenant secimini layout seviyesine tasiyip tum sayfalara uygula.


google ads kampanmyalarini da burdan yönetebilirsek yönetelim. 
GTA tags vs verilerini burdan girelim. kontrol edelim. cekelim. sitelerin kayirlari var site settings icerisinden ordan cekelim ordan kontrol edelim. burasi tam dinamik olmali. 

analitc google consol search vs burdan kontrol edelim. 

beacklinks mi deniyor. onlari burdan görebilir miyiz? sitemizi nerden takip ediyorlar nerden atifta bulunan var. onlari da görebiliyorsak görelim. 

stmp ayarlarini yapalim. emailleri gelenleri okuyalim ve email gönderelim burdan eger mümkünse... 

tüm sosial hesaplarinin baglanti testlerini yapalim. 


