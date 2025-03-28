ALTER TABLE "balance_log" DROP CONSTRAINT "balance_log_account_users_id_fk";
--> statement-breakpoint
ALTER TABLE "balance_log" ADD COLUMN "walletID" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referralCode" varchar(12) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referredBy" uuid;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "balance" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "balance_log" ADD CONSTRAINT "balance_log_walletID_wallets_id_fk" FOREIGN KEY ("walletID") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referredBy_users_referralCode_fk" FOREIGN KEY ("referredBy") REFERENCES "public"."users"("referralCode") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balance_log" DROP COLUMN "account";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "balance";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referralCode_unique" UNIQUE("referralCode");