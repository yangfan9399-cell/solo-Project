CREATE TABLE IF NOT EXISTS "attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_id" integer NOT NULL,
	"node_id" integer,
	"file_name" varchar(200) NOT NULL,
	"file_type" varchar(200),
	"file_size" integer,
	"file_url" varchar(500) NOT NULL,
	"version" varchar(20) DEFAULT '1.0',
	"uploaded_by" integer,
	"uploader_name" varchar(100),
	"description" text,
	"is_evidence" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "evidence_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_id" integer NOT NULL,
	"node_id" integer,
	"type" varchar(30) NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text,
	"status" varchar(20) DEFAULT 'valid',
	"verified" boolean DEFAULT false,
	"verified_by" integer,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_id" integer NOT NULL,
	"node_type" varchar(30) NOT NULL,
	"node_name" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"operator_id" integer,
	"operator_name" varchar(100),
	"comment" text,
	"field_changes" jsonb DEFAULT '{}'::jsonb,
	"snapshot_before" jsonb DEFAULT '{}'::jsonb,
	"snapshot_after" jsonb DEFAULT '{}'::jsonb,
	"basis" text,
	"sequence" integer NOT NULL,
	"is_re_process" boolean DEFAULT false,
	"parent_node_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "records" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_no" varchar(32) NOT NULL,
	"container_no" varchar(20) NOT NULL,
	"seal_no" varchar(30) NOT NULL,
	"vessel_name" varchar(100) NOT NULL,
	"voyage_no" varchar(30) NOT NULL,
	"bl_no" varchar(50),
	"customer" varchar(200),
	"exception_type" varchar(30) NOT NULL,
	"status" varchar(20) NOT NULL,
	"source" varchar(50) NOT NULL,
	"current_handler_id" integer,
	"applicant_id" integer,
	"reviewer_id" integer,
	"amount" numeric(12, 2),
	"seal_time" timestamp,
	"arrival_time" timestamp,
	"summary" text,
	"conclusion" text,
	"basis" text,
	"block_reason" text,
	"remedy_path" text,
	"diff_fields" jsonb DEFAULT '{}'::jsonb,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp,
	CONSTRAINT "records_record_no_unique" UNIQUE("record_no")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"role" varchar(20) NOT NULL,
	"department" varchar(100),
	"avatar_color" varchar(7) DEFAULT '#3b82f6',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attachments" ADD CONSTRAINT "attachments_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."records"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attachments" ADD CONSTRAINT "attachments_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."records"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nodes" ADD CONSTRAINT "nodes_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."records"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nodes" ADD CONSTRAINT "nodes_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "records" ADD CONSTRAINT "records_current_handler_id_users_id_fk" FOREIGN KEY ("current_handler_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "records" ADD CONSTRAINT "records_applicant_id_users_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "records" ADD CONSTRAINT "records_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
