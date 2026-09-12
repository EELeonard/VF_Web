CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reference` text NOT NULL,
	`simulator` text NOT NULL,
	`duration` integer NOT NULL,
	`flight_date` text NOT NULL,
	`flight_time` text NOT NULL,
	`gift` integer DEFAULT false NOT NULL,
	`customer_name` text NOT NULL,
	`customer_email` text NOT NULL,
	`customer_phone` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_bookings_reference` ON `bookings` (`reference`);--> statement-breakpoint
CREATE INDEX `idx_bookings_flight_date` ON `bookings` (`flight_date`);--> statement-breakpoint
CREATE INDEX `idx_bookings_status` ON `bookings` (`status`);