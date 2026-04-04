CREATE TABLE `carrier_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`carrier_id` text,
	`carrier_name` text NOT NULL,
	`load_ref` text,
	`amount` real NOT NULL,
	`pay_type` text DEFAULT 'standard' NOT NULL,
	`quick_pay_discount` real,
	`net_amount` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`scheduled_date` text,
	`paid_date` text,
	`reference_number` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`billing_contact` text,
	`email` text,
	`phone` text,
	`address` text,
	`payment_terms` text DEFAULT 'net_30' NOT NULL,
	`credit_limit` real,
	`notes` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invoice_line_items` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`description` text NOT NULL,
	`quantity` real DEFAULT 1 NOT NULL,
	`unit_price` real NOT NULL,
	`amount` real NOT NULL,
	`line_type` text DEFAULT 'freight' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_number` text NOT NULL,
	`customer_id` text NOT NULL,
	`load_ref` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`invoice_date` text NOT NULL,
	`due_date` text NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`tax_amount` real DEFAULT 0 NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`amount_paid` real DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);--> statement-breakpoint
CREATE TABLE `loads` (
	`id` text PRIMARY KEY NOT NULL,
	`load_ref` text NOT NULL,
	`customer_id` text NOT NULL,
	`carrier_id` text,
	`carrier_name` text,
	`revenue` real DEFAULT 0 NOT NULL,
	`cost` real DEFAULT 0 NOT NULL,
	`invoice_id` text,
	`carrier_payment_id` text,
	`status` text DEFAULT 'booked' NOT NULL,
	`pickup_date` text,
	`delivery_date` text,
	`origin` text,
	`destination` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`carrier_payment_id`) REFERENCES `carrier_payments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `loads_load_ref_unique` ON `loads` (`load_ref`);--> statement-breakpoint
CREATE TABLE `payments_received` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`amount` real NOT NULL,
	`payment_date` text NOT NULL,
	`payment_method` text DEFAULT 'ach' NOT NULL,
	`reference_number` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
