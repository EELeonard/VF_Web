CREATE TABLE `instructor_availability` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`instructor_id` integer NOT NULL,
	`available_date` text NOT NULL,
	`available_time` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_instructor_availability_unique` ON `instructor_availability` (`instructor_id`,`available_date`,`available_time`);--> statement-breakpoint
CREATE INDEX `idx_instructor_availability_month` ON `instructor_availability` (`instructor_id`,`available_date`);--> statement-breakpoint
CREATE TABLE `instructor_capabilities` (
	`instructor_id` integer NOT NULL,
	`simulator` text NOT NULL,
	FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_instructor_capability_unique` ON `instructor_capabilities` (`instructor_id`,`simulator`);--> statement-breakpoint
CREATE INDEX `idx_instructor_capability_simulator` ON `instructor_capabilities` (`simulator`);--> statement-breakpoint
ALTER TABLE `instructors` ADD `username` text;--> statement-breakpoint
ALTER TABLE `instructors` ADD `password_hash` text;--> statement-breakpoint
ALTER TABLE `instructors` ADD `password_salt` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_instructors_username` ON `instructors` (`username`);