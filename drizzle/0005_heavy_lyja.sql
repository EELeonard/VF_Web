CREATE TABLE `booking_communications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`booking_id` integer NOT NULL,
	`direction` text NOT NULL,
	`kind` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`from_email` text NOT NULL,
	`to_email` text NOT NULL,
	`delivery_status` text NOT NULL,
	`provider_id` text,
	`sent_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_booking_communications_booking_sent` ON `booking_communications` (`booking_id`,`sent_at`);--> statement-breakpoint
ALTER TABLE `bookings` ADD `internal_notes` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `proposed_date` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `proposed_time` text;