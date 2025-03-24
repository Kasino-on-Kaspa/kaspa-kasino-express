CREATE TYPE "public"."DicerollStatus" AS ENUM('DRAW', 'WON', 'LOST');--> statement-breakpoint
ALTER TABLE "coinflip_results" ALTER COLUMN "result" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dieroll_result" ADD COLUMN "status" "DicerollStatus" NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referrelCode" varchar(12) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referredBy" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referredBy_users_referrelCode_fk" FOREIGN KEY ("referredBy") REFERENCES "public"."users"("referrelCode") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dieroll_result" DROP COLUMN "client_won";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referrelCode_unique" UNIQUE("referrelCode");--> statement-breakpoint
ALTER TABLE "public"."balance_log" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."E_BALANCE_LOG_TYPE";--> statement-breakpoint
CREATE TYPE "public"."E_BALANCE_LOG_TYPE" AS ENUM('DEPOSIT', 'WITHDRAWAL', 'BET', 'BET_RETURN');--> statement-breakpoint
ALTER TABLE "public"."balance_log" ALTER COLUMN "type" SET DATA TYPE "public"."E_BALANCE_LOG_TYPE" USING "type"::"public"."E_BALANCE_LOG_TYPE";