CREATE TABLE `voucher_redemptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`voucher_id` integer NOT NULL,
	`booking_id` integer NOT NULL,
	`customer_email` text NOT NULL,
	`redeemed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_voucher_redemptions_booking` ON `voucher_redemptions` (`booking_id`);--> statement-breakpoint
CREATE INDEX `idx_voucher_redemptions_voucher_email` ON `voucher_redemptions` (`voucher_id`,`customer_email`);--> statement-breakpoint
CREATE TABLE `vouchers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`discount_type` text DEFAULT 'percentage' NOT NULL,
	`discount_value` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`allowed_email` text,
	`max_uses` integer,
	`max_uses_per_email` integer,
	`starts_at` text,
	`ends_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_vouchers_code` ON `vouchers` (`code`);--> statement-breakpoint
CREATE INDEX `idx_vouchers_active_period` ON `vouchers` (`active`,`starts_at`,`ends_at`);--> statement-breakpoint
ALTER TABLE `bookings` ADD `voucher_code` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `original_price_cents` integer;--> statement-breakpoint
ALTER TABLE `bookings` ADD `discount_amount_cents` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `final_price_cents` integer;