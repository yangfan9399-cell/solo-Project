CREATE TYPE "public"."defect_level" AS ENUM('critical', 'major', 'minor', 'general');--> statement-breakpoint
CREATE TYPE "public"."defect_status" AS ENUM('registered', 'assigned', 'processing', 'pending_review', 'awaiting_parts', 'accepted', 'rejected', 'false_positive');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('pv_module', 'inverter', 'combiner_box', 'tracker', 'transformer', 'cable');--> statement-breakpoint
CREATE TYPE "public"."history_action" AS ENUM('register', 'assign', 'start_processing', 'submit_result', 'request_parts', 'parts_arrived', 'accept', 'reject', 'mark_false_positive');--> statement-breakpoint
CREATE TYPE "public"."spare_part_status" AS ENUM('in_stock', 'out_of_stock', 'on_order');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('inspector', 'operation_manager', 'maintenance_worker', 'reviewer');--> statement-breakpoint
CREATE TABLE "defect_histories" (
	"id" serial PRIMARY KEY NOT NULL,
	"defect_id" integer NOT NULL,
	"action" "history_action" NOT NULL,
	"user_id" integer,
	"user_name" varchar(50),
	"description" text,
	"status_before" "defect_status",
	"status_after" "defect_status",
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "defect_spare_parts" (
	"id" serial PRIMARY KEY NOT NULL,
	"defect_id" integer NOT NULL,
	"spare_part_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"status" varchar(20) DEFAULT 'requested',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "defects" (
	"id" serial PRIMARY KEY NOT NULL,
	"defect_no" varchar(30) NOT NULL,
	"station_id" integer NOT NULL,
	"device_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"defect_level" "defect_level" NOT NULL,
	"device_type" "device_type" NOT NULL,
	"status" "defect_status" DEFAULT 'registered' NOT NULL,
	"affected_power" numeric(10, 2),
	"photo_urls" json,
	"location" varchar(100),
	"array" varchar(50),
	"is_false_positive" boolean DEFAULT false,
	"inspector_id" integer,
	"assignee_id" integer,
	"reviewer_id" integer,
	"parts_needed" json,
	"processing_result" text,
	"processing_photos" json,
	"review_comment" text,
	"registered_at" timestamp,
	"assigned_at" timestamp,
	"processing_started_at" timestamp,
	"processing_finished_at" timestamp,
	"reviewed_at" timestamp,
	"closed_at" timestamp,
	"resolution_duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "defects_defect_no_unique" UNIQUE("defect_no")
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"station_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"device_type" "device_type" NOT NULL,
	"model" varchar(100),
	"array" varchar(50),
	"position" varchar(50),
	"rated_power" numeric(10, 2),
	"manufacturer" varchar(100),
	"install_date" timestamp,
	"status" varchar(20) DEFAULT 'normal',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "power_stations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"location" varchar(255),
	"capacity" numeric(10, 2),
	"commission_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spare_parts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"part_number" varchar(50),
	"category" varchar(50),
	"quantity" integer DEFAULT 0,
	"unit" varchar(20),
	"status" "spare_part_status" DEFAULT 'in_stock',
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"name" varchar(50) NOT NULL,
	"role" "user_role" NOT NULL,
	"email" varchar(100),
	"phone" varchar(20),
	"avatar" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "defect_histories" ADD CONSTRAINT "defect_histories_defect_id_defects_id_fk" FOREIGN KEY ("defect_id") REFERENCES "public"."defects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defect_histories" ADD CONSTRAINT "defect_histories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defect_spare_parts" ADD CONSTRAINT "defect_spare_parts_defect_id_defects_id_fk" FOREIGN KEY ("defect_id") REFERENCES "public"."defects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defect_spare_parts" ADD CONSTRAINT "defect_spare_parts_spare_part_id_spare_parts_id_fk" FOREIGN KEY ("spare_part_id") REFERENCES "public"."spare_parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_station_id_power_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."power_stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_inspector_id_users_id_fk" FOREIGN KEY ("inspector_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_station_id_power_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."power_stations"("id") ON DELETE no action ON UPDATE no action;