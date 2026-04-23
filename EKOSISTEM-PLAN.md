# Ekosistem Sosyal Medya Merkezi — Ekosistem Entegrasyon Plani

**Durum:** Planlama asamasi  
**Katman:** Yatay servis — Tum katmanlar (icerik gorunurlugu, ticaret, SaaS, topluluk)  
**Faz:** Faz 1 tasarim; uygulama Faz 1-2 ile paralel baslayabilir

---

## Ekosistem Icerisindeki Rol

Bu proje, monorepo icindeki **tum urun klasorlerinin** sosyal medya operasyonunu tek yerden planlamak ve kayit altina almak icin **merkez operasyon reposu**dur. Amaç:

- Proje bazli **icerik takvimi** ve **kampanya planlari**
- **Yayin kayitlari** (ne, nerede, ne zaman, link, sorumlu)
- Gerekirse **performans ozeti** (manuel not veya platform API'lerinden)
- Her projenin **kendi veritabanina** veya proje backend'ine guvenli baglanti ile veri tutarliligi

```
Ekosistem Sosyal Medya Merkezi (BU PROJE)
├── Giris
│   ├── Proje listesi (bereketfide, vistaseed, katalogAI, hal-fiyatlari, ...)
│   ├── Kanal tanimlari (Instagram, LinkedIn, X, YouTube, vb.)
│   └── Yetkili kullanici / rol (ileride ekosistem auth ile)
├── Cikis / Etki
│   ├── Ziraat Haber Portali — haber yayini ile koordineli sosyal duyuru
│   ├── Bereketfide / VistaSeed — urun ve kampanya mesajlari
│   ├── KatalogAI — icerik uretimi ciktisi ile sosyal taslak
│   └── Diger projeler — proje bazli plan satirlari
└── Veri
    ├── Merkezi plan & kayit tablolari (bu projenin DB'si)
    └── Opsiyonel: proje DB'lerinde ozet / referans tablolari (API veya senkron)
```

---

## Coklu Veritabani Stratejisi

Her ekosistem projesinin ayri DB politikasi korunur. Bu merkez icin uc uyumlu model (fazla birini secmek yeterli; karma da mumkun):

| Model | Aciklama | Ne Zaman |
|-------|----------|----------|
| **A — Merkezi DB** | Sadece bu servisin MySQL'i; projelerden veri cekmez, tum plan/kayit burada | En hizli MVP, tek ekip |
| **B — Baglanti profilleri** | Her proje icin `.env` veya vault'ta `DB_*` okuma; raporlama veya ozet senkron | Mevcut DB'lerden urun/haber ile eslestirme gerekiyorsa |
| **C — API-first** | Her proje backend'inde `/api/internal/social/...` veya paylasimli servis | DB sifresini merkezde tutmak istenmiyorsa |

**Oneri:** P0'da **Model A** ile basla; proje bazli **proje_kodu** (`slug`) ile satirlari ayir. P1'de kritik projeler icin **Model B veya C** ile zenginlestir.

Semaya dogrudan `ALTER TABLE` eklemek yerine ekosistem kurali: degisiklikler seed SQL `CREATE TABLE` uzerinden, ardindan `db:seed:*:fresh`.

---

## Veri Modeli (Taslak)

Merkezi veritabani icin mantiksal varliklar (uygulama semasi seed dosyalarinda netlestirilir):

- **social_project** — `slug` (or. `bereketfide`), ad, durum, not
- **social_channel** — proje_id, platform kodu, hesap adi/url, aktif/pasif
- **social_content_plan** — proje_id, donem (hafta/ay), tema, kampanya kodu, sahip
- **social_plan_item** — plan_id, tarih, kanal, taslak metin, medya referansi, durum (taslak/onaylandi/yayinlandi/iptal)
- **social_publish_log** — plan_item veya bagimsiz; yayin zamani, harici link, ekran goruntusu yolu/storage key
- **social_metric_snapshot** — (opsiyonel) tarih, kanal, temel sayilar JSON

Harici sistemlerden gelen id'ler (or. Instagram post id) **metin/JSON** alanlarda saklanir; platform API anahtarlari sadece env.

---

## Teknik Stack (hedef)

```
Frontend : Next.js 16 + TypeScript + Tailwind CSS v4
Backend  : Fastify + Drizzle ORM + MySQL
Auth     : Ekosistem SSO (Faz 2+) veya gecici admin JWT
Deploy   : Docker + Nginx + PM2
```

Port ve URL'ler proje `.env` ve `project.portfolio.json` uzerinden; sabit kod yok.

---

## Ortak Modullerle Iliski

| Ortak modul | Kullanim |
|-------------|----------|
| `notifications` | Yayin hatirlatma, onay bekliyor uyari |
| `emailTemplates` | Haftalik plan ozeti e-posta (opsiyonel) |
| `audit` | Plan degisikligi ve yayin aksiyonlari log |
| `ai` | KatalogAI / icerikten sosyal taslak onerisi (P2) |

---

## Yapilacak Isler

### P0 — MVP

- [ ] Repo iskeleti: `backend/`, `frontend/`, ortak `tsconfig` path'leri
- [ ] Merkezi DB seed: yukaridaki cekirdek tablolar
- [ ] Admin: proje ve kanal CRUD; basit aylik plan gorunumu
- [ ] Yayin kaydi ekleme / listeleme
- [ ] Tum yapilandirma env ve config'den

### P1 — Kisa vade

- [ ] Takvim gorunumu (haftalik)
- [ ] En az bir pilot proje ile Model B veya C baglantisi (urun veya haber basligi cekme)
- [ ] CSV/JSON disa aktarim (ajans veya paylasim icin)

### P2 — Orta vade

- [ ] Secilen platformlar icin OAuth / yayin API (politika ve rate limit’e uyum)
- [ ] KatalogAI ciktisi ile taslak uretim akisi
- [ ] Dashboard: proje bazli basit istatistik ozeti

---

## Riskler ve Kontroller

- **Guvenlik:** DB kimlik bilgisi merkezde toplanacaksa sadece VPN / gizli vault; uretimde minimum yetki.
- **Uyumluluk:** Meta / X / LinkedIn API sartlari; otomatik yayin oncesi hukuk ve marka kontrolu sureci.
- **Veri tekrari:** Plan hem merkezde hem projede tutulmayacak; tek kaynak prensibi netlesmeli.

---

## Basari Olcutleri

- Tum aktif projeler listelenebilir ve her biri icin plan satiri acilabilir.
- Yayinlanan her onemli gonderi `social_publish_log` veya esdegerinde izlenebilir.
- Yeni bir ekosistem projesi eklendiginde sadece yeni `social_project` + env ile devreye alinabilir.
