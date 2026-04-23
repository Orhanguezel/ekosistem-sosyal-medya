# Ekosistem Sosyal Medya

**Canlı:** [sosial.tarvista.com](https://sosial.tarvista.com)

Tarım Dijital Ekosistemi'nin tüm markalarını tek panelden sosyal medyada yöneten merkezi otomasyon platformu. bereketfide, vistaseed, tarimansiklopedisi, tarimdabugun ve diğer ekosistem projelerinin tüm sosyal medyaları buradan yönetilir.

## Kapsam — Ekosistem Sosyal Medyaları

| Marka | Alan | Platformlar |
|-------|------|-------------|
| Bereket Fide | bereketfide.com | Facebook, Instagram, Telegram |
| VistaSeed | vistaseed.com.tr | Facebook, Instagram, LinkedIn |
| Tarım Ansiklopedisi | tarimansiklopedisi.com | X, LinkedIn, Telegram |
| Tarım Bugün | tarimdabugun.com | X, Facebook, Telegram |
| ZiraiBilgim | ziraibilgim.com | YouTube, LinkedIn |
| Ekosistem Genel | tarvista.com | Tüm platformlar |

## Tech Stack

- **Backend:** Fastify v5 · TypeScript · Drizzle ORM · MySQL · Bun (port 8089)
- **Dashboard:** Next.js 16 · React 19 · Shadcn UI · React Query (port 3035 prod / 3004 dev)
- **DB:** `ekosistem_sosyal` (MySQL 8)
- **AI:** Groq LLM · OpenAI · Anthropic
- **Analitik:** Google Analytics 4 API · Google Ads API
- **Otomasyon:** node-cron (yayın, sync, analitik, token kontrolü)

## Mimari

```
ekosistem-sosyal-medya/
├── backend/                    # Fastify API (port 8089)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── posts/          # Gönderi yönetimi
│   │   │   ├── platforms/      # Platform bağlantıları (FB, IG, LI, X, Telegram)
│   │   │   ├── templates/      # İçerik şablonları
│   │   │   ├── calendar/       # Kampanya takvimi
│   │   │   ├── tenants/        # Çoklu marka/proje yönetimi
│   │   │   ├── ai/             # AI içerik üretimi
│   │   │   ├── analytics/      # GA4 + Ads takibi
│   │   │   ├── ekosistem-feed/ # Ekosistem haber akışı sync
│   │   │   └── marketing/      # Kampanya yönetimi
│   │   ├── cron/               # Zamanlanmış görevler
│   │   └── db/                 # Schema, migrations, seed
│   └── scripts/
│       └── fix-build.mjs       # Build sonrası @agro + ESM yol düzeltici
├── dashboard/                  # Next.js yönetim paneli
└── shared/                     # Yerel tip paylaşımı
```

## Cron Görevleri

| Görev | Sıklık | Açıklama |
|-------|--------|----------|
| Publisher | Her 5 dk | Zamanlanmış gönderileri yayınlar |
| Source sync | Her 30 dk | Ekosistem haberlerini çeker |
| AI içerik | Günlük 08:00 | Otomatik içerik üretir |
| Analytics | Her 6 saat | GA4 / Ads verilerini günceller |
| Token health | Günlük 03:00 | Platform token geçerliliği kontrol eder |

## API Yapısı

```
/api/v1/
  /posts          - Gönderi CRUD + zamanlama
  /platforms      - Platform bağlantıları
  /templates      - İçerik şablonları
  /calendar       - Kampanya takvimi
  /tenants        - Marka/proje yönetimi
  /ai             - AI içerik üretimi
  /analytics      - Performans verileri
  /ekosistem      - Ekosistem haber akışı
  /marketing      - Kampanya yönetimi
  /admin/...      - Admin rotaları (JWT + admin rolü gerekli)
  /health         - Servis sağlık kontrolü
```

## Geliştirme

```bash
# Root dizinden (tarim-dijital-ekosistem/)
bun install

# Backend dev
cd projects/ekosistem-sosyal-medya/backend && bun run dev

# Dashboard dev
cd projects/ekosistem-sosyal-medya/dashboard && bun run dev

# İkisini birlikte (proje root'unda)
cd projects/ekosistem-sosyal-medya && npm run dev

# DB işlemleri
npm run db:generate   # Migration üret
npm run db:migrate    # Migration uygula
npm run db:seed       # Seed yükle
```

## Build & Deploy

```bash
# Build (proje root)
cd projects/ekosistem-sosyal-medya
npm run build:backend   # tsc + fix-build.mjs (@agro ve ESM yol çözümleme)
npm run build:dashboard # Next.js production build
```

**VPS (187.124.166.65):**

```
Backend:   PM2 sosyal-backend   → start.sh → bun dist/index.js
Dashboard: PM2 sosyal-dashboard → next start -p 3035
Nginx:     sosial.tarvista.com  → /api/* → :8089 | / → :3035
SSL:       Let's Encrypt (otomatik yenileme)
DB:        ekosistem_sosyal @ MySQL, user: sosyal
```

### Önemli: @vps/shared-backend Bağımlılığı

Backend, `packages/shared-backend` paylaşımlı paketini kullanır. Paket, VPS yapısında proje dizininin iki seviye üstündeki `packages/shared-backend` konumundan `file:../../packages/shared-backend` ile çözülür.

VPS yapısı (mevcut):
```
/var/www/sosyal-medya/backend/
  packages/shared-backend/    ← dist + package.json
  node_modules/@vps/shared-backend → ../../packages/shared-backend  (file dependency)
  start.sh                    ← symlink'i her restart'ta yeniler
```

> VPS monorepo paketleri `/var/www/packages` altında tutulur. Bu proje `/var/www/ekosistem-sosyal-medya` altında deploy edildiğinde `../../packages/shared-backend` yolu doğru konuma denk gelir.

## Ortam Değişkenleri

```bash
# backend/.env.example dosyasına bakın
PORT=8089
DB_NAME=ekosistem_sosyal
CORS_ORIGIN=https://sosial.tarvista.com
JWT_SECRET=...

# Platform API'leri (dashboard'dan ayarlanır)
FB_APP_ID=, FB_APP_SECRET=, FB_PAGE_ACCESS_TOKEN=
IG_ACCOUNT_ID=, IG_ACCESS_TOKEN=
LINKEDIN_CLIENT_ID=, LINKEDIN_CLIENT_SECRET=
X_CLIENT_ID=, X_CLIENT_SECRET=
TELEGRAM_BOT_TOKEN=

# AI
GROQ_API_KEY=, OPENAI_API_KEY=

# Google
GOOGLE_SERVICE_ACCOUNT_JSON=   # GA4 + Search Console servis hesabı
GOOGLE_ADS_DEVELOPER_TOKEN=    # Ads API
```

## Kurallar

- Değişken isimleri İngilizce, içerikler Türkçe olabilir
- Her post UUID ile tanımlanır
- Tarihler UTC saklanır, arayüzde `Europe/Istanbul` gösterilir
- Schema değişikliği → `drizzle/` SQL dosyasına ekle, fresh ile yeniden kur
- `@vps/shared-backend` modülleri VPS `packages/` altından gelir, proje içinde tekrarlanmaz
