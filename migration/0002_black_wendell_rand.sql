ALTER TABLE "users" DROP CONSTRAINT "users_depositAddress_wallets_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "wallet" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_wallet_wallets_id_fk" FOREIGN KEY ("wallet") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "depositAddress";