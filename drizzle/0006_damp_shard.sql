CREATE TABLE `instructor_day_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`instructor_id` integer NOT NULL,
	`simulator` text NOT NULL,
	`flight_date` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_instructor_day_simulator_date` ON `instructor_day_assignments` (`simulator`,`flight_date`);--> statement-breakpoint
CREATE INDEX `idx_instructor_day_instructor_date` ON `instructor_day_assignments` (`instructor_id`,`flight_date`);--> statement-breakpoint
CREATE TABLE `instructors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_instructors_email` ON `instructors` (`email`);--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_password_reset_tokens_hash` ON `password_reset_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_password_reset_tokens_user` ON `password_reset_tokens` (`username`,`expires_at`);--> statement-breakpoint
ALTER TABLE `admin_users` ADD `email` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `instructor_id` integer;--> statement-breakpoint
ALTER TABLE `bookings` ADD `instructor_assignment_source` text;