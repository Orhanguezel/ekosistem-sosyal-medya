-- SaaS Tenant Isolation Migration
-- Her tabloya tenant_key eklenir, platform enum genisletilir
-- Calistirma: bun run db:migrate  VEYA dogrudan MySQL'e uygulanabilir

-- ─── content_templates ───────────────────────────────────────────
ALTER TABLE `content_templates`
  ADD COLUMN `tenant_key` varchar(100) DEFAULT NULL AFTER `uuid`;
--> statement-breakpoint

-- Mevcut kayitlarda [tenantKey] prefix varsa tenant_key kolonuna tas
UPDATE `content_templates`
  SET `tenant_key` = LOWER(REGEXP_SUBSTR(`name`, '(?<=\\[)[a-zA-Z0-9_-]+(?=\\])'))
  WHERE `name` REGEXP '^\\[[a-zA-Z0-9_-]+\\] ';
--> statement-breakpoint

-- Mevcut kayitlarda prefix temizle
UPDATE `content_templates`
  SET `name` = TRIM(REGEXP_REPLACE(`name`, '^\\[[a-zA-Z0-9_-]+\\] ', ''))
  WHERE `name` REGEXP '^\\[[a-zA-Z0-9_-]+\\] ';
--> statement-breakpoint

CREATE INDEX `idx_tmpl_tenant` ON `content_templates` (`tenant_key`);
--> statement-breakpoint

ALTER TABLE `content_templates`
  MODIFY COLUMN `platform` enum('facebook','instagram','both','linkedin','x','telegram','all') NOT NULL DEFAULT 'both';
--> statement-breakpoint

-- ─── campaign_calendar ───────────────────────────────────────────
ALTER TABLE `campaign_calendar`
  ADD COLUMN `tenant_key` varchar(100) NOT NULL DEFAULT 'default' AFTER `uuid`;
--> statement-breakpoint

-- Mevcut kayitlara bereketfide ata (ilk kurulum = bereketfide tenant)
UPDATE `campaign_calendar` SET `tenant_key` = 'bereketfide' WHERE `tenant_key` = 'default';
--> statement-breakpoint

-- Eski unique constraint kaldir, tenant dahil yenisini ekle
ALTER TABLE `campaign_calendar`
  DROP INDEX `uk_date_slot`;
--> statement-breakpoint

CREATE UNIQUE INDEX `uk_tenant_date_slot`
  ON `campaign_calendar` (`tenant_key`, `date`, `time_slot`, `platform`);
--> statement-breakpoint

CREATE INDEX `idx_cal_tenant` ON `campaign_calendar` (`tenant_key`);
--> statement-breakpoint

ALTER TABLE `campaign_calendar`
  MODIFY COLUMN `platform` enum('facebook','instagram','both','linkedin','x','telegram','all') NOT NULL DEFAULT 'both';
--> statement-breakpoint

-- ─── hashtag_groups ──────────────────────────────────────────────
ALTER TABLE `hashtag_groups`
  ADD COLUMN `tenant_key` varchar(100) DEFAULT NULL AFTER `id`;
--> statement-breakpoint

CREATE INDEX `idx_htag_tenant` ON `hashtag_groups` (`tenant_key`);
--> statement-breakpoint

-- ─── social_posts (platform enum) ────────────────────────────────
ALTER TABLE `social_posts`
  MODIFY COLUMN `platform` enum('facebook','instagram','both','linkedin','x','telegram','all') NOT NULL DEFAULT 'both';
--> statement-breakpoint

-- ─── social_projects (content source) ────────────────────────────
ALTER TABLE `social_projects`
  ADD COLUMN `content_source_url` varchar(500) DEFAULT NULL AFTER `site_settings_api_url`,
  ADD COLUMN `content_source_type` varchar(50) DEFAULT NULL AFTER `content_source_url`;
--> statement-breakpoint

-- Mevcut bereketfide tenant'i icin content_source_url guncelle
UPDATE `social_projects`
  SET `content_source_url` = 'http://127.0.0.1:8080/api',
      `content_source_type` = 'bereketfide'
  WHERE `project_key` = 'bereketfide';
