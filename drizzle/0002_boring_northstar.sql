CREATE TABLE `appointment_slots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`simulator` text NOT NULL,
	`flight_date` text NOT NULL,
	`flight_time` text NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_appointment_slots_unique` ON `appointment_slots` (`simulator`,`flight_date`,`flight_time`);--> statement-breakpoint
CREATE INDEX `idx_appointment_slots_month` ON `appointment_slots` (`simulator`,`flight_date`,`enabled`);--> statement-breakpoint
ALTER TABLE `bookings` ADD `language` text DEFAULT 'de' NOT NULL;