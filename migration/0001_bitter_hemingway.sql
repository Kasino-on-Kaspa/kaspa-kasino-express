ALTER TYPE "public"."E_BALANCE_LOG_TYPE" ADD VALUE 'REFERRAL_RETURN';--> statement-breakpoint
CREATE TABLE "referral_earnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer" varchar NOT NULL,
	"referred" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"gameResult" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "referral_earnings" ADD CONSTRAINT "referral_earnings_referrer_users_referralCode_fk" FOREIGN KEY ("referrer") REFERENCES "public"."users"("referralCode") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_earnings" ADD CONSTRAINT "referral_earnings_referred_users_id_fk" FOREIGN KEY ("referred") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;