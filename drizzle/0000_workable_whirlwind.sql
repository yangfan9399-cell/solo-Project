CREATE TABLE "construction_areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(50) NOT NULL,
	"building" text,
	"floor" varchar(20),
	"description" text,
	"capacity" integer DEFAULT 10,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "construction_areas_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "construction_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"company" text NOT NULL,
	"leader_name" text NOT NULL,
	"leader_phone" varchar(20) NOT NULL,
	"license_number" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permit_histories" (
	"id" serial PRIMARY KEY NOT NULL,
	"permit_id" integer NOT NULL,
	"action" varchar(50) NOT NULL,
	"status_from" varchar(50),
	"status_to" varchar(50),
	"operator_id" integer,
	"operator_name" text NOT NULL,
	"operator_role" varchar(50) NOT NULL,
	"remark" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permit_workers" (
	"id" serial PRIMARY KEY NOT NULL,
	"permit_id" integer NOT NULL,
	"worker_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permits" (
	"id" serial PRIMARY KEY NOT NULL,
	"permit_number" varchar(50) NOT NULL,
	"team_id" integer NOT NULL,
	"area_id" integer NOT NULL,
	"construction_type" varchar(50) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"work_content" text NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"security_officer_id" integer,
	"engineering_manager_id" integer,
	"safety_reviewer_id" integer,
	"has_documents" boolean DEFAULT true,
	"document_missing_reason" text,
	"has_area_conflict" boolean DEFAULT false,
	"area_conflict_detail" text,
	"safety_briefing_status" varchar(50) DEFAULT 'PENDING',
	"safety_briefing_evidence" jsonb DEFAULT '[]'::jsonb,
	"safety_reject_reason" text,
	"check_in_time" timestamp,
	"check_out_time" timestamp,
	"actual_check_in" timestamp,
	"actual_check_out" timestamp,
	"anomaly_type" varchar(50),
	"anomaly_reason" text,
	"stay_duration_hours" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permits_permit_number_unique" UNIQUE("permit_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" varchar(50) NOT NULL,
	"avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workers" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"name" text NOT NULL,
	"id_card" varchar(30) NOT NULL,
	"phone" varchar(20),
	"has_safety_cert" boolean DEFAULT false,
	"cert_number" varchar(100),
	"cert_expire_date" date,
	"photo" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "permit_histories" ADD CONSTRAINT "permit_histories_permit_id_permits_id_fk" FOREIGN KEY ("permit_id") REFERENCES "public"."permits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit_histories" ADD CONSTRAINT "permit_histories_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit_workers" ADD CONSTRAINT "permit_workers_permit_id_permits_id_fk" FOREIGN KEY ("permit_id") REFERENCES "public"."permits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permit_workers" ADD CONSTRAINT "permit_workers_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permits" ADD CONSTRAINT "permits_team_id_construction_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."construction_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permits" ADD CONSTRAINT "permits_area_id_construction_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."construction_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permits" ADD CONSTRAINT "permits_security_officer_id_users_id_fk" FOREIGN KEY ("security_officer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permits" ADD CONSTRAINT "permits_engineering_manager_id_users_id_fk" FOREIGN KEY ("engineering_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permits" ADD CONSTRAINT "permits_safety_reviewer_id_users_id_fk" FOREIGN KEY ("safety_reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers" ADD CONSTRAINT "workers_team_id_construction_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."construction_teams"("id") ON DELETE no action ON UPDATE no action;