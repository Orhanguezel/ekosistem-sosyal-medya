CREATE TABLE `social_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`project_key` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`website_url` varchar(500),
	`is_active` tinyint NOT NULL DEFAULT 1,
	`created_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `social_projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `social_projects_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `social_projects_project_key_unique` UNIQUE(`project_key`)
);
--> statement-breakpoint
CREATE INDEX `idx_social_projects_active` ON `social_projects` (`is_active`);