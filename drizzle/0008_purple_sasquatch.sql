CREATE TABLE `instructor_availability_ranges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`instructor_id` integer NOT NULL,
	`available_date` text NOT NULL,
	`available_from` text NOT NULL,
	`available_until` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_instructor_availability_range_unique` ON `instructor_availability_ranges` (`instructor_id`,`available_date`);--> statement-breakpoint
CREATE INDEX `idx_instructor_availability_range_date` ON `instructor_availability_ranges` (`available_date`);