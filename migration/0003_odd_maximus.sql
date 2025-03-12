ALTER TABLE "sessions" ADD COLUMN "user" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "utxos" ADD COLUMN "vout" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;