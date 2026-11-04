CREATE TABLE `player_account_links` (
	`platform_user_id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `player_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `player_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`nickname` text NOT NULL,
	`creator_user_id` text NOT NULL,
	`password_salt` text NOT NULL,
	`password_hash` text NOT NULL,
	`best_power` integer DEFAULT 0 NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `player_accounts_username_unique` ON `player_accounts` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `player_accounts_nickname_unique` ON `player_accounts` (`nickname`);--> statement-breakpoint
CREATE UNIQUE INDEX `player_accounts_creator_user_id_unique` ON `player_accounts` (`creator_user_id`);--> statement-breakpoint
CREATE TABLE `player_login_attempts` (
	`platform_user_id` text PRIMARY KEY NOT NULL,
	`failures` integer DEFAULT 0 NOT NULL,
	`locked_until` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
