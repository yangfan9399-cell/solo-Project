CREATE TYPE "public"."abnormal_type" AS ENUM('none', 'missing_record', 'attachment_version_mismatch', 'reprocessing_needed');--> statement-breakpoint
CREATE TYPE "public"."node_action" AS ENUM('create', 'accept', 'process', 'submit_review', 'review_approve', 'review_return', 'archive', 'reprocess', 'supplement', 'modify_key_field');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('applicant', 'reviewer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('accepted', 'processing', 'reviewing', 'archived', 'returned', 'reprocessing');--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"node_id" uuid,
	"file_name" varchar(256) NOT NULL,
	"file_url" varchar(1024) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"file_type" varchar(64) NOT NULL,
	"uploaded_by" varchar(128) NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"field_changed" varchar(128) NOT NULL,
	"old_value" text,
	"new_value" text,
	"changed_by" varchar(128) NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_key_field" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outage_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_code" varchar(64) NOT NULL,
	"title" varchar(256) NOT NULL,
	"region" varchar(128) NOT NULL,
	"line_name" varchar(256) NOT NULL,
	"outage_type" varchar(64) NOT NULL,
	"planned_start_time" timestamp with time zone NOT NULL,
	"planned_end_time" timestamp with time zone NOT NULL,
	"actual_start_time" timestamp with time zone,
	"actual_end_time" timestamp with time zone,
	"affected_users" integer,
	"responsible_person" varchar(128) NOT NULL,
	"responsible_person_id" varchar(64) NOT NULL,
	"applicant_id" varchar(64) NOT NULL,
	"applicant_name" varchar(128) NOT NULL,
	"reviewer_id" varchar(64),
	"reviewer_name" varchar(128),
	"status" "status" DEFAULT 'accepted' NOT NULL,
	"abnormal_type" "abnormal_type" DEFAULT 'none' NOT NULL,
	"business_record" text,
	"onsite_description" text,
	"evidence_conclusion" text,
	"basis_reference" varchar(512),
	"conclusion_summary" varchar(512),
	"blocking_reason" text,
	"diff_fields" jsonb,
	"remediation_path" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outage_plans_plan_code_unique" UNIQUE("plan_code")
);
--> statement-breakpoint
CREATE TABLE "workflow_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"action" "node_action" NOT NULL,
	"operator_id" varchar(64) NOT NULL,
	"operator_name" varchar(128) NOT NULL,
	"operator_role" "role" NOT NULL,
	"from_status" "status",
	"to_status" "status",
	"comment" text,
	"changed_fields" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_plan_id_outage_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."outage_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_node_id_workflow_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."workflow_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_plan_id_outage_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."outage_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_nodes" ADD CONSTRAINT "workflow_nodes_plan_id_outage_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."outage_plans"("id") ON DELETE cascade ON UPDATE no action;