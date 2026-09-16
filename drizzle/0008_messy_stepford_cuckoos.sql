ALTER TABLE `activation_requests` ADD `is_relocation` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `activation_requests` ADD `is_relayout` integer DEFAULT false NOT NULL;