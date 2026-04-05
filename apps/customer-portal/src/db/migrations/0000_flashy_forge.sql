CREATE TABLE `portal_customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact_name` text,
	`contact_email` text,
	`contact_phone` text,
	`access_token` text NOT NULL,
	`is_active` integer DEFAULT true,
	`last_login_at` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `portal_customers_access_token_unique` ON `portal_customers` (`access_token`);--> statement-breakpoint
CREATE TABLE `portal_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`shipment_id` text,
	`doc_type` text NOT NULL,
	`filename` text NOT NULL,
	`original_name` text NOT NULL,
	`file_path` text NOT NULL,
	`file_size` integer,
	`mime_type` text,
	`is_visible_to_customer` integer DEFAULT true,
	`uploaded_at` text DEFAULT (datetime('now')),
	`notes` text,
	FOREIGN KEY (`shipment_id`) REFERENCES `portal_shipments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `portal_events` (
	`id` text PRIMARY KEY NOT NULL,
	`shipment_id` text,
	`event_type` text NOT NULL,
	`description` text NOT NULL,
	`location_city` text,
	`location_state` text,
	`is_visible_to_customer` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`shipment_id`) REFERENCES `portal_shipments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `portal_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`shipment_id` text,
	`customer_id` text,
	`sender_type` text NOT NULL,
	`message` text NOT NULL,
	`is_read` integer DEFAULT false,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`shipment_id`) REFERENCES `portal_shipments`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`customer_id`) REFERENCES `portal_customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `portal_settings` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`company_name` text DEFAULT 'My Brokerage',
	`support_email` text,
	`support_phone` text,
	`welcome_message` text,
	`footer_text` text,
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `portal_shipments` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text,
	`shipment_number` text NOT NULL,
	`status` text DEFAULT 'booked' NOT NULL,
	`equipment_type` text,
	`commodity` text,
	`weight` integer,
	`pieces` integer,
	`origin_city` text NOT NULL,
	`origin_state` text NOT NULL,
	`origin_zip` text,
	`origin_address` text,
	`origin_contact_name` text,
	`origin_contact_phone` text,
	`dest_city` text NOT NULL,
	`dest_state` text NOT NULL,
	`dest_zip` text,
	`dest_address` text,
	`dest_contact_name` text,
	`dest_contact_phone` text,
	`pickup_date` text,
	`pickup_time_window` text,
	`delivery_date` text,
	`delivery_time_window` text,
	`actual_pickup_at` text,
	`actual_delivery_at` text,
	`customer_rate` real,
	`invoice_ref` text,
	`invoice_status` text DEFAULT 'pending',
	`invoice_amount` real,
	`special_instructions` text,
	`bol_number` text,
	`po_number` text,
	`pro_number` text,
	`current_location_city` text,
	`current_location_state` text,
	`current_eta` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`customer_id`) REFERENCES `portal_customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `portal_shipments_shipment_number_unique` ON `portal_shipments` (`shipment_number`);