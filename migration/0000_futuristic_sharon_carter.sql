-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."DicerollCondition" AS ENUM('OVER', 'UNDER');--> statement-breakpoint
CREATE TYPE "public"."GameType" AS ENUM('DICEROLL', 'COINFLIP');--> statement-breakpoint
CREATE TYPE "public"."TransactionType" AS ENUM('DEPOSIT', 'WITHDRAWAL');--> statement-breakpoint
CREATE TABLE "utxos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"txId" varchar NOT NULL,
	"address" varchar NOT NULL,
	"amount" bigint NOT NULL,
	"scriptPubKey" varchar NOT NULL,
	"spent" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" varchar NOT NULL,
	"privateKey" varchar NOT NULL,
	"xOnlyPublicKey" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "dieroll_result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sessionId" uuid NOT NULL,
	"target" integer NOT NULL,
	"condition" "DicerollCondition" NOT NULL,
	"result" integer,
	"client_won" boolean,
	"multiplier" integer NOT NULL,
	"settledAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" varchar NOT NULL,
	"xOnlyPublicKey" varchar NOT NULL,
	"username" varchar,
	"depositAddress" varchar NOT NULL,
	"balance" bigint DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_address_unique" UNIQUE("address"),
	CONSTRAINT "users_xOnlyPublicKey_unique" UNIQUE("xOnlyPublicKey")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"txId" varchar NOT NULL,
	"value" bigint NOT NULL,
	"type" "TransactionType" NOT NULL,
	"user" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dieroll_result" ADD CONSTRAINT "dieroll_result_sessionId_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
*/