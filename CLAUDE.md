# Ekosistem Sosyal Medya - Gelistirici Kilavuzu

## Proje Ozeti
Tarım Ekosistemi (bereketfide.com) icin sosyal medya yonetim sistemi.
Haber, etkilesim, ilan icerikleri uretip Facebook ve Instagram'a yayinlar.

## Tech Stack
- **Backend**: Fastify v5 + TypeScript + Drizzle ORM + MySQL (port 8089)
- **Dashboard**: Next.js 16 + React 19 + Shadcn/UI (port 3004)
- **DB**: MySQL 8.0, schema: `ekosistem_sosyal`
- **AI**: Anthropic Claude / OpenAI / Groq

## Komutlar
```bash
npm run dev:backend    # Backend dev server
npm run dev:dashboard  # Dashboard dev server
npm run dev            # Ikisini birlikte
npm run db:push        # DB semayi uygula
npm run db:seed        # Seed verileri yukle
npm run db:studio      # Drizzle Studio
```

## Modul Yapisi (Backend)
Her modul su dosyalari icerir:
- `schema.ts` - Drizzle tablo tanimi (varsa)
- `validation.ts` - Zod validation semalari
- `repository.ts` - DB islemleri
- `controller.ts` - Request handler'lar
- `routes.ts` - Fastify route kaydi

## API Prefix
Tum endpointler `/api/` altinda:
- `/api/posts` - Post kuyrugu
- `/api/templates` - Icerik sablonlari
- `/api/calendar` - Icerik takvimi
- `/api/platforms` - Platform yonetimi
- `/api/ekosistem` - Kamanilan entegrasyonu
- `/api/ai` - AI icerik uretimi
- `/api/analytics` - Performans verileri

## Kurallar
- Turkce degisken isimleri kullanma, Ingilizce kullan
- Turkce icerikler (caption, hashtag) string olarak tutulur
- Her post'un uuid'si vardir, disariya uuid ile referans ver
- Tarihler UTC olarak saklanir, frontend'de Europe/Berlin'e cevrilir
- Kamanilan API bagimliligini minimumda tut (ayri servis)

## Portfolio Metadata Rule
- Proje kokunde `project.portfolio.json` dosyasi zorunludur.
- Stack, ozet, kategori veya servis bilgisi degisirse once bu metadata dosyasi guncellenir.
- Portfolio seedleri bu dosyadan uretildigi icin metadata guncellenmeden is bitmis sayilmaz.
