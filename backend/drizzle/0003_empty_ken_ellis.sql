ALTER TABLE `platform_accounts` MODIFY COLUMN `platform` enum('facebook','instagram','telegram','linkedin','x') NOT NULL;--> statement-breakpoint
ALTER TABLE `platform_accounts` ADD `tenant_key` varchar(100) DEFAULT 'default' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_pa_tenant` ON `platform_accounts` (`tenant_key`);