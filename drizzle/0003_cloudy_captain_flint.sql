ALTER TABLE `activation_requests` ADD `cable_length` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `activation_requests` ADD `cable_type` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `activation_requests` ADD `fat_odp_code` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `activation_requests` ADD `end_to_end` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `activation_requests` ADD `attenuation` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `activation_requests` ADD `customer_port` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `activation_requests` ADD `pop_otb_port` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `activation_requests` ADD `bandwidth` text DEFAULT '' NOT NULL;