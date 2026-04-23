SQL seed dosyalari (calisma sirasi seed.ts icinde):
  200_social_base_hashtags
  205_social_projects          <- tenant (social_projects) kayitlari
  210 / 220                    <- tenant icerik seed
  230_tenant_platform_accounts
  240_tenant_user_roles        <- ensureAdminUser sonrasi (kullanici gerekir)

Tenant listesi: Repoda tutulur; `bun run db:seed` ile idempotent yuklenir (ON DUPLICATE KEY UPDATE).
Marka (logo/favicon): backend/uploads/brand/ altinda; 205_social_projects.marketing_json.branding path alanlariyla.

Replit / uzak ortam:
  - API anahtarlari, DB sifresi, JWT -> Replit Secrets veya VPS .env (commit edilmez).
  - Hangi tenant'larin acilacagi -> bu SQL veya paneldeki onboarding; ikisini karistirmayin:
    kaynak dogrulugu icin repodaki 205 tek referans olsun, ortama ozel ek tenant varsa
    ayri bir SQL (or. 206_custom_tenants.local.sql) ile yonetip .gitignore edebilirsiniz.

Yeni tenant eklemek:
  1) 205'e satir ekleyin (uuid + project_key benzersiz),
  2) 230/240 ve ilgili icerik seed'lerini tenant_key ile hizalayin,
  3) db:seed calistirin.
