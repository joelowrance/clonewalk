CREATE TABLE "industries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "industries_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tenant_industries" (
	"tenant_id" uuid NOT NULL,
	"industry_id" uuid NOT NULL,
	CONSTRAINT "tenant_industries_tenant_id_industry_id_pk" PRIMARY KEY("tenant_id","industry_id")
);
--> statement-breakpoint
ALTER TABLE "tenant_industries" ADD CONSTRAINT "tenant_industries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_industries" ADD CONSTRAINT "tenant_industries_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON industries TO compliance_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_industries TO compliance_app;--> statement-breakpoint
ALTER TABLE tenant_industries ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_isolation ON tenant_industries
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);--> statement-breakpoint
INSERT INTO industries (name) VALUES
  ('Blood Bank'),
  ('Ambulatory Health Center'),
  ('Food Service'),
  ('Farm')
ON CONFLICT (name) DO NOTHING;