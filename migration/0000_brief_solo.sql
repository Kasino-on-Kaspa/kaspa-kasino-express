CREATE TYPE "public"."DicerollCondition" AS ENUM('OVER', 'UNDER');--> statement-breakpoint
CREATE TYPE "public"."GameType" AS ENUM('DICEROLL', 'COINFLIP');--> statement-breakpoint
CREATE TABLE "diceroll_games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sessionId" uuid NOT NULL,
	"target" integer NOT NULL,
	"condition" "DicerollCondition" NOT NULL,
	"result" integer,
	"multiplier" numeric NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"settledAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serverSeed" varchar NOT NULL,
	"serverSeedHash" varchar NOT NULL,
	"clientSeed" varchar NOT NULL,
	"amount" integer NOT NULL,
	"gameType" "GameType" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "utxos" (
	"txid" varchar NOT NULL,
	"vout" integer NOT NULL,
	"address" varchar NOT NULL,
	"value" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" varchar NOT NULL,
	"index" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "diceroll_games" ADD CONSTRAINT "diceroll_games_sessionId_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;