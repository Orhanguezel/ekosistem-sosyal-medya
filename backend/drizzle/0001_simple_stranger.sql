CREATE TABLE `profiles` (
	`id` char(36) NOT NULL,
	`full_name` text,
	`phone` varchar(64),
	`avatar_url` text,
	`address_line1` varchar(255),
	`address_line2` varchar(255),
	`city` varchar(128),
	`country` varchar(128),
	`postal_code` varchar(32),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`role` enum('admin','editor','carrier','customer','dealer') NOT NULL DEFAULT 'customer',
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `user_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_roles_user_id_role_unique` UNIQUE(`user_id`,`role`)
);
--> statement-breakpoint
ALTER TABLE `profiles` ADD CONSTRAINT `fk_profiles_id_users_id` FOREIGN KEY (`id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `fk_user_roles_user_id_users_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `user_roles_user_id_idx` ON `user_roles` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_roles_role_idx` ON `user_roles` (`role`);