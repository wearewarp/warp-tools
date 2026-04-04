CREATE TABLE `document_requirements` (
	`id` text PRIMARY KEY NOT NULL,
	`load_ref` text NOT NULL,
	`load_status` text NOT NULL,
	`required_type` text NOT NULL,
	`fulfilled` integer DEFAULT false NOT NULL,
	`document_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`file_path` text NOT NULL,
	`thumbnail_path` text,
	`doc_type` text NOT NULL,
	`load_ref` text,
	`carrier_id` text,
	`carrier_name` text,
	`customer_id` text,
	`customer_name` text,
	`document_date` text,
	`expiry_date` text,
	`notes` text,
	`tags` text DEFAULT '[]',
	`uploaded_by` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
