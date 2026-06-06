CREATE TABLE `operation_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`requisition_id` integer,
	`reagent_id` integer,
	`user_id` integer NOT NULL,
	`action` text NOT NULL,
	`details` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`requisition_id`) REFERENCES `requisitions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reagent_id`) REFERENCES `reagents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reagents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reagent_code` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`hazard_level` text NOT NULL,
	`required_permission_level` integer DEFAULT 1 NOT NULL,
	`total_quantity` real NOT NULL,
	`remaining_quantity` real NOT NULL,
	`unit` text NOT NULL,
	`location` text,
	`manufacturer` text,
	`description` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reagents_reagent_code_unique` ON `reagents` (`reagent_code`);--> statement-breakpoint
CREATE TABLE `requisitions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`requisition_no` text NOT NULL,
	`reagent_id` integer NOT NULL,
	`requester_id` integer NOT NULL,
	`purpose` text NOT NULL,
	`quantity` real NOT NULL,
	`expected_return_date` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`lab_admin_id` integer,
	`lab_admin_comment` text,
	`safety_officer_id` integer,
	`safety_officer_comment` text,
	`escalated_to_id` integer,
	`picked_up_at` integer,
	`returned_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`reagent_id`) REFERENCES `reagents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lab_admin_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`safety_officer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`escalated_to_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `requisitions_requisition_no_unique` ON `requisitions` (`requisition_no`);--> statement-breakpoint
CREATE TABLE `returns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`requisition_id` integer NOT NULL,
	`returned_quantity` real NOT NULL,
	`condition` text NOT NULL,
	`verifier_id` integer NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`requisition_id`) REFERENCES `requisitions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`verifier_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`permission_level` integer DEFAULT 1 NOT NULL,
	`college` text NOT NULL,
	`department` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);