CREATE TABLE `tenant_user_roles` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`tenant_key` varchar(100) NOT NULL,
	`role` enum('tenant_admin','tenant_editor') NOT NULL DEFAULT 'tenant_editor',
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `tenant_user_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_user_roles_unique` UNIQUE(`user_id`,`tenant_key`)
);
--> statement-breakpoint
CREATE INDEX `tenant_user_roles_user_idx` ON `tenant_user_roles` (`user_id`);--> statement-breakpoint
CREATE INDEX `tenant_user_roles_tenant_idx` ON `tenant_user_roles` (`tenant_key`);