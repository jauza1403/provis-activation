ALTER TABLE `activation_requests` ADD `install_switch` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `activation_requests` ADD `switch_brand` text DEFAULT '' NOT NULL;