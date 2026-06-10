CREATE TABLE "batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_number" varchar(50) NOT NULL,
	"part_id" integer NOT NULL,
	"supplier_id" integer NOT NULL,
	"production_date" date,
	"quantity" integer DEFAULT 0,
	"received_date" date,
	"traceable" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "batches_batch_number_unique" UNIQUE("batch_number")
);
--> statement-breakpoint
CREATE TABLE "claim_evidences" (
	"id" serial PRIMARY KEY NOT NULL,
	"claim_id" integer NOT NULL,
	"type" varchar(50),
	"url" text,
	"description" text,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "claim_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"claim_id" integer NOT NULL,
	"status" varchar(50) NOT NULL,
	"comment" text,
	"operator" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" integer NOT NULL,
	"defect_type_id" integer NOT NULL,
	"quantity_defective" integer NOT NULL,
	"claim_amount" varchar(20) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'pending',
	"batch_traceable" boolean DEFAULT true,
	"repair_deadline" date,
	"repair_completed" boolean DEFAULT false,
	"engineer_name" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "defect_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	CONSTRAINT "defect_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "part_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	CONSTRAINT "part_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "parts" (
	"id" serial PRIMARY KEY NOT NULL,
	"part_number" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category_id" integer,
	"unit_price" varchar(20),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "parts_part_number_unique" UNIQUE("part_number")
);
--> statement-breakpoint
CREATE TABLE "supplier_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"claim_id" integer NOT NULL,
	"response_type" varchar(50) NOT NULL,
	"comment" text,
	"evidence_url" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "supplier_responses_claim_id_unique" UNIQUE("claim_id")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact" varchar(100),
	"phone" varchar(20),
	"email" varchar(100),
	"address" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_evidences" ADD CONSTRAINT "claim_evidences_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_history" ADD CONSTRAINT "claim_history_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_defect_type_id_defect_types_id_fk" FOREIGN KEY ("defect_type_id") REFERENCES "public"."defect_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_category_id_part_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."part_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_responses" ADD CONSTRAINT "supplier_responses_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;