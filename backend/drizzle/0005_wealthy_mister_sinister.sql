ALTER TABLE `social_projects` ADD `gtm_container_id` varchar(64);--> statement-breakpoint
ALTER TABLE `social_projects` ADD `ga4_measurement_id` varchar(64);--> statement-breakpoint
ALTER TABLE `social_projects` ADD `google_ads_customer_id` varchar(64);--> statement-breakpoint
ALTER TABLE `social_projects` ADD `google_ads_manager_id` varchar(64);--> statement-breakpoint
ALTER TABLE `social_projects` ADD `search_console_site_url` varchar(500);--> statement-breakpoint
ALTER TABLE `social_projects` ADD `site_settings_api_url` varchar(500);--> statement-breakpoint
ALTER TABLE `social_projects` ADD `marketing_json` json;