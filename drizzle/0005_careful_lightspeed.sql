ALTER TABLE `activation_requests` ADD `request_type` text DEFAULT 'Regular' NOT NULL;--> statement-breakpoint
ALTER TABLE `activation_requests` ADD `approval_status` text DEFAULT 'Not Required' NOT NULL;--> statement-breakpoint
ALTER TABLE `activation_requests` ADD `approval_code` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `activation_requests` ADD `approved_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `activation_requests` ADD `whatsapp_message_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_activation_approval` ON `activation_requests` (`approval_status`,`approval_code`);