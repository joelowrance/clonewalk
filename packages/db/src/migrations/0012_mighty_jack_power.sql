CREATE TYPE "public"."branch_action" AS ENUM('show', 'hide');--> statement-breakpoint
CREATE TABLE "branch_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"survey_id" uuid NOT NULL,
	"trigger_question_id" uuid NOT NULL,
	"trigger_answer_value" text NOT NULL,
	"target_question_id" uuid NOT NULL,
	"action" "branch_action" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "branch_rules" ADD CONSTRAINT "branch_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_rules" ADD CONSTRAINT "branch_rules_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_rules" ADD CONSTRAINT "branch_rules_trigger_question_id_questions_id_fk" FOREIGN KEY ("trigger_question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_rules" ADD CONSTRAINT "branch_rules_target_question_id_questions_id_fk" FOREIGN KEY ("target_question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;