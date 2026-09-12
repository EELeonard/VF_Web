CREATE TABLE `admin_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_admin_users_username` ON `admin_users` (`username`);--> statement-breakpoint
CREATE TABLE `news_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title_de` text NOT NULL,
	`title_en` text NOT NULL,
	`excerpt_de` text NOT NULL,
	`excerpt_en` text NOT NULL,
	`link_url` text DEFAULT '/buchen' NOT NULL,
	`link_label_de` text DEFAULT 'Mehr erfahren' NOT NULL,
	`link_label_en` text DEFAULT 'Learn more' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`starts_at` text,
	`ends_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_news_posts_publication` ON `news_posts` (`status`,`starts_at`,`ends_at`);