CREATE TYPE "public"."CoinflipStatus" AS ENUM('CONTINUE', 'CASHOUT', 'PENDING', 'DEFEATED');--> statement-breakpoint
CREATE TYPE "public"."CoinflipChoice" AS ENUM('HEADS', 'TAILS');--> statement-breakpoint
CREATE TABLE "coinflip_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sessionId" uuid NOT NULL,
	"playerChoice" "CoinflipChoice" NOT NULL,
	"result" "CoinflipChoice",
	"level" integer NOT NULL,
	"multiplier" integer NOT NULL,
	"next" "CoinflipStatus" NOT NULL,
	"client_won" boolean NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "balance" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "coinflip_results" ADD CONSTRAINT "coinflip_results_sessionId_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;