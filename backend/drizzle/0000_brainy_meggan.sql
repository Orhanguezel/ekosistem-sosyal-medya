CREATE TABLE `campaign_calendar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`date` date NOT NULL,
	`time_slot` enum('morning','afternoon','evening') NOT NULL DEFAULT 'morning',
	`post_type` enum('haber','etkilesim','ilan','nostalji','tanitim','kampanya') NOT NULL,
	`platform` enum('facebook','instagram','both') NOT NULL DEFAULT 'both',
	`notes` text,
	`template_id` int,
	`post_id` int,
	`status` enum('planned','content_ready','scheduled','published','skipped') DEFAULT 'planned',
	`created_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `campaign_calendar_id` PRIMARY KEY(`id`),
	CONSTRAINT `campaign_calendar_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `uk_date_slot` UNIQUE(`date`,`time_slot`,`platform`)
);
--> statement-breakpoint
CREATE TABLE `content_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`post_type` enum('haber','etkilesim','ilan','nostalji','tanitim','kampanya') NOT NULL,
	`platform` enum('facebook','instagram','both') NOT NULL DEFAULT 'both',
	`caption_template` text NOT NULL,
	`hashtags` varchar(500),
	`image_prompt` varchar(500),
	`variables` json,
	`is_active` tinyint DEFAULT 1,
	`usage_count` int DEFAULT 0,
	`last_used_at` datetime,
	`created_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `content_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_templates_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `hashtag_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`hashtags` text NOT NULL,
	`post_type` enum('haber','etkilesim','ilan','nostalji','tanitim','kampanya','genel') DEFAULT 'genel',
	`is_default` tinyint DEFAULT 0,
	`created_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `hashtag_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platform_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`platform` enum('facebook','instagram','telegram') NOT NULL,
	`account_name` varchar(255) NOT NULL,
	`account_id` varchar(255),
	`access_token` text,
	`token_expires` datetime,
	`refresh_token` text,
	`page_id` varchar(255),
	`page_token` text,
	`is_active` tinyint DEFAULT 1,
	`last_post_at` datetime,
	`error_count` int DEFAULT 0,
	`last_error` varchar(500),
	`meta` json,
	`created_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `platform_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_accounts_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `post_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` int NOT NULL,
	`platform` enum('facebook','instagram') NOT NULL,
	`likes` int DEFAULT 0,
	`comments` int DEFAULT 0,
	`shares` int DEFAULT 0,
	`saves` int DEFAULT 0,
	`reach` int DEFAULT 0,
	`impressions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`engagement_rate` decimal(5,2) DEFAULT '0',
	`fetched_at` datetime(3) NOT NULL,
	CONSTRAINT `post_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`token_hash` varchar(255) NOT NULL,
	`created_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	`expires_at` datetime(3) NOT NULL,
	`revoked_at` datetime(3),
	`replaced_by` char(36),
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`post_type` enum('haber','etkilesim','ilan','nostalji','tanitim','kampanya') NOT NULL,
	`sub_type` varchar(50),
	`title` varchar(255),
	`caption` text NOT NULL,
	`hashtags` varchar(500),
	`image_url` varchar(1000),
	`image_local` varchar(500),
	`link_url` varchar(1000),
	`link_text` varchar(255),
	`platform` enum('facebook','instagram','both') NOT NULL DEFAULT 'both',
	`fb_page_id` varchar(100),
	`ig_account_id` varchar(100),
	`scheduled_at` datetime,
	`posted_at` datetime,
	`status` enum('draft','scheduled','publishing','posted','failed','cancelled') NOT NULL DEFAULT 'draft',
	`error_message` varchar(1000),
	`fb_post_id` varchar(255),
	`ig_media_id` varchar(255),
	`source_type` enum('manual','news','ai','template') NOT NULL DEFAULT 'manual',
	`source_ref` varchar(255),
	`ai_generated` tinyint DEFAULT 0,
	`ai_model` varchar(100),
	`ai_prompt_used` text,
	`created_by` varchar(100) DEFAULT 'system',
	`notes` text,
	`created_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `social_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `social_posts_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` char(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`full_name` varchar(255),
	`phone` varchar(50),
	`ecosystem_id` char(36),
	`role` enum('admin','editor') NOT NULL DEFAULT 'editor',
	`is_active` tinyint DEFAULT 1,
	`email_verified` tinyint NOT NULL DEFAULT 0,
	`reset_token` varchar(255),
	`reset_token_expires` datetime(3),
	`rules_accepted_at` datetime(3),
	`last_sign_in_at` datetime(3),
	`created_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `campaign_calendar` ADD CONSTRAINT `campaign_calendar_template_id_content_templates_id_fk` FOREIGN KEY (`template_id`) REFERENCES `content_templates`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaign_calendar` ADD CONSTRAINT `campaign_calendar_post_id_social_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `social_posts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_analytics` ADD CONSTRAINT `post_analytics_post_id_social_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `social_posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_date` ON `campaign_calendar` (`date`);--> statement-breakpoint
CREATE INDEX `idx_cal_status` ON `campaign_calendar` (`status`);--> statement-breakpoint
CREATE INDEX `idx_type` ON `content_templates` (`post_type`);--> statement-breakpoint
CREATE INDEX `idx_active` ON `content_templates` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_pa_platform` ON `platform_accounts` (`platform`);--> statement-breakpoint
CREATE INDEX `idx_pa_active` ON `platform_accounts` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_post` ON `post_analytics` (`post_id`);--> statement-breakpoint
CREATE INDEX `idx_analytics_platform` ON `post_analytics` (`platform`);--> statement-breakpoint
CREATE INDEX `idx_fetched` ON `post_analytics` (`fetched_at`);--> statement-breakpoint
CREATE INDEX `idx_rt_user` ON `refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_rt_expires` ON `refresh_tokens` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `social_posts` (`status`);--> statement-breakpoint
CREATE INDEX `idx_scheduled` ON `social_posts` (`scheduled_at`);--> statement-breakpoint
CREATE INDEX `idx_platform` ON `social_posts` (`platform`);--> statement-breakpoint
CREATE INDEX `idx_post_type` ON `social_posts` (`post_type`);--> statement-breakpoint
CREATE INDEX `idx_source` ON `social_posts` (`source_type`);--> statement-breakpoint
CREATE INDEX `idx_user_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_user_active` ON `users` (`is_active`);