CREATE TABLE `site_settings` (
	`id` char(36) NOT NULL,
	`key` varchar(100) NOT NULL,
	`locale` varchar(8) NOT NULL,
	`value` text NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_settings_key_locale_uq` UNIQUE(`key`,`locale`)
);
--> statement-breakpoint
CREATE INDEX `site_settings_key_idx` ON `site_settings` (`key`);--> statement-breakpoint
CREATE INDEX `site_settings_locale_idx` ON `site_settings` (`locale`);