-- Google Ads kampanya degisiklik taslaklari ve uygulama loglari

CREATE TABLE `google_ads_change_sets` (
  `id` int AUTO_INCREMENT NOT NULL,
  `uuid` char(36) NOT NULL,
  `tenant_key` varchar(100) NOT NULL,
  `customer_id` varchar(64) NOT NULL,
  `manager_id` varchar(64),
  `campaign_id` varchar(64),
  `campaign_name` varchar(255),
  `title` varchar(255) NOT NULL,
  `status` enum('draft','validated','validation_failed','applied','failed','cancelled') NOT NULL DEFAULT 'draft',
  `source` varchar(50) NOT NULL DEFAULT 'manual',
  `payload` json NOT NULL,
  `validation_result` json,
  `applied_result` json,
  `created_by` varchar(100) DEFAULT 'system',
  `created_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `google_ads_change_sets_id` PRIMARY KEY(`id`),
  CONSTRAINT `google_ads_change_sets_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint

CREATE INDEX `idx_ads_change_tenant` ON `google_ads_change_sets` (`tenant_key`);
--> statement-breakpoint

CREATE INDEX `idx_ads_change_status` ON `google_ads_change_sets` (`status`);
--> statement-breakpoint

CREATE INDEX `idx_ads_change_campaign` ON `google_ads_change_sets` (`campaign_id`);
