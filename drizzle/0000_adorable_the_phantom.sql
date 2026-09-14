CREATE TABLE `activation_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`deadline` text NOT NULL,
	`activation_date` text NOT NULL,
	`time_slot` text NOT NULL,
	`area` text NOT NULL,
	`vendor_name` text NOT NULL,
	`access_media` text NOT NULL,
	`site_id` text NOT NULL,
	`subs_id` text NOT NULL,
	`opp_number` text NOT NULL,
	`wo_number` text NOT NULL,
	`device_plan` text NOT NULL,
	`rfa_cores` integer NOT NULL,
	`pop_allocation` text NOT NULL,
	`project_pic` text NOT NULL,
	`vendor_pic` text NOT NULL,
	`provisioning_pic` text NOT NULL,
	`status` text DEFAULT 'Submitted' NOT NULL,
	`notes` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_activation_date_slot` ON `activation_requests` (`activation_date`,`time_slot`);--> statement-breakpoint
CREATE INDEX `idx_activation_status` ON `activation_requests` (`status`);--> statement-breakpoint
CREATE INDEX `idx_activation_pic` ON `activation_requests` (`provisioning_pic`);