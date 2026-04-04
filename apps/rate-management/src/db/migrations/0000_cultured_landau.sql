CREATE TABLE `carrier_rates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lane_id` integer NOT NULL,
	`carrier_id` text,
	`carrier_name` text NOT NULL,
	`rate_amount` real NOT NULL,
	`rate_basis` text NOT NULL,
	`rate_type` text NOT NULL,
	`effective_date` text,
	`expiry_date` text,
	`contact_name` text,
	`contact_email` text,
	`notes` text,
	`source` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`lane_id`) REFERENCES `lanes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customer_tariffs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lane_id` integer NOT NULL,
	`customer_id` text,
	`customer_name` text NOT NULL,
	`rate_amount` real NOT NULL,
	`rate_basis` text NOT NULL,
	`contract_ref` text,
	`effective_date` text,
	`expiry_date` text,
	`status` text DEFAULT 'active' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`lane_id`) REFERENCES `lanes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lanes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`origin_city` text NOT NULL,
	`origin_state` text NOT NULL,
	`origin_zip` text,
	`dest_city` text NOT NULL,
	`dest_state` text NOT NULL,
	`dest_zip` text,
	`equipment_type` text NOT NULL,
	`estimated_miles` integer,
	`tags` text,
	`status` text DEFAULT 'active' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rfq_responses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rfq_id` integer NOT NULL,
	`carrier_id` text,
	`carrier_name` text NOT NULL,
	`rate_amount` real NOT NULL,
	`rate_basis` text NOT NULL,
	`valid_until` text,
	`contact_name` text,
	`contact_email` text,
	`notes` text,
	`is_winner` integer DEFAULT false NOT NULL,
	`responded_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`rfq_id`) REFERENCES `rfqs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rfqs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rfq_number` text NOT NULL,
	`lane_id` integer,
	`equipment_type` text,
	`pickup_date` text,
	`desired_rate` real,
	`notes` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`awarded_carrier` text,
	`awarded_rate` real,
	`awarded_at` text,
	`created_by` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`lane_id`) REFERENCES `lanes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rfqs_rfq_number_unique` ON `rfqs` (`rfq_number`);