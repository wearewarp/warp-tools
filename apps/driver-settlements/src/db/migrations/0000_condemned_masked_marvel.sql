CREATE TABLE `advances` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`driver_id` integer NOT NULL,
	`settlement_id` integer,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`reason` text,
	`status` text DEFAULT 'outstanding' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`settlement_id`) REFERENCES `settlements`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `deduction_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`is_percentage` integer DEFAULT false NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`frequency` text DEFAULT 'per_settlement' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `drivers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text,
	`phone` text,
	`address_street` text,
	`address_city` text,
	`address_state` text,
	`address_zip` text,
	`license_number` text,
	`license_state` text,
	`license_expiry` text,
	`pay_type` text NOT NULL,
	`pay_rate` real NOT NULL,
	`hire_date` text,
	`termination_date` text,
	`emergency_contact_name` text,
	`emergency_contact_phone` text,
	`status` text DEFAULT 'active' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settlement_deductions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`settlement_id` integer NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`deduction_type` text DEFAULT 'one_time' NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	FOREIGN KEY (`settlement_id`) REFERENCES `settlements`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settlement_reimbursements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`settlement_id` integer NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`receipt_ref` text,
	FOREIGN KEY (`settlement_id`) REFERENCES `settlements`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settlements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`settlement_number` text NOT NULL,
	`driver_id` integer NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`gross_earnings` real DEFAULT 0 NOT NULL,
	`total_deductions` real DEFAULT 0 NOT NULL,
	`total_reimbursements` real DEFAULT 0 NOT NULL,
	`total_advances` real DEFAULT 0 NOT NULL,
	`net_pay` real DEFAULT 0 NOT NULL,
	`paid_date` text,
	`payment_method` text,
	`payment_reference` text,
	`approved_by` text,
	`approved_at` text,
	`disputed_reason` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settlements_settlement_number_unique` ON `settlements` (`settlement_number`);--> statement-breakpoint
CREATE TABLE `trips` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`driver_id` integer NOT NULL,
	`settlement_id` integer,
	`load_ref` text,
	`origin_city` text NOT NULL,
	`origin_state` text NOT NULL,
	`dest_city` text NOT NULL,
	`dest_state` text NOT NULL,
	`miles` real,
	`revenue` real,
	`stops` integer,
	`hours` real,
	`trip_date` text NOT NULL,
	`pay_amount` real DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`settlement_id`) REFERENCES `settlements`(`id`) ON UPDATE no action ON DELETE no action
);
