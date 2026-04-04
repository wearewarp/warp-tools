ALTER TABLE `customers` ADD `address_street` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `address_city` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `address_state` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `address_zip` text;--> statement-breakpoint
ALTER TABLE `customers` DROP COLUMN `address`;