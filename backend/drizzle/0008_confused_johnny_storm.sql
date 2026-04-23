CREATE TABLE `storage_assets` (
	`id` char(36) NOT NULL,
	`user_id` char(36),
	`name` varchar(255) NOT NULL,
	`bucket` varchar(64) NOT NULL,
	`path` varchar(512) NOT NULL,
	`folder` varchar(255),
	`mime` varchar(127) NOT NULL,
	`size` bigint unsigned NOT NULL,
	`width` int unsigned,
	`height` int unsigned,
	`url` text,
	`hash` varchar(64),
	`provider` varchar(16) NOT NULL DEFAULT 'cloudinary',
	`provider_public_id` varchar(255),
	`provider_resource_type` varchar(16),
	`provider_format` varchar(32),
	`provider_version` int unsigned,
	`etag` varchar(64),
	`metadata` json DEFAULT ('null'),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `storage_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_bucket_path` UNIQUE(`bucket`,`path`)
);
--> statement-breakpoint
CREATE INDEX `idx_storage_bucket` ON `storage_assets` (`bucket`);--> statement-breakpoint
CREATE INDEX `idx_storage_folder` ON `storage_assets` (`folder`);--> statement-breakpoint
CREATE INDEX `idx_storage_created` ON `storage_assets` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_provider_pubid` ON `storage_assets` (`provider_public_id`);