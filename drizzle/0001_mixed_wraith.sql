ALTER TABLE `bookings` ADD `flight_start_at` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `remark` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `request_email_sent_at` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `confirmation_email_sent_at` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `reminder_email_sent_at` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `email_error` text;--> statement-breakpoint
CREATE INDEX `idx_bookings_reminder_due` ON `bookings` (`status`,`flight_start_at`);