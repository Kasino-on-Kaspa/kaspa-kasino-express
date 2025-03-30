CREATE TYPE "public"."E_BALANCE_LOG_TYPE" AS ENUM('DEPOSIT', 'WITHDRAWAL', 'BET', 'BET_RETURN');--> statement-breakpoint
CREATE TYPE "public"."CoinflipStatus" AS ENUM('CONTINUE', 'CASHOUT', 'PENDING', 'DEFEATED');--> statement-breakpoint
CREATE TYPE "public"."CoinflipChoice" AS ENUM('HEADS', 'TAILS');--> statement-breakpoint
CREATE TYPE "public"."DicerollCondition" AS ENUM('OVER', 'UNDER');--> statement-breakpoint
CREATE TYPE "public"."DicerollStatus" AS ENUM('DRAW', 'WON', 'LOST');--> statement-breakpoint
CREATE TYPE "public"."GameType" AS ENUM('DICEROLL', 'COINFLIP');--> statement-breakpoint
CREATE TYPE "public"."TransactionType" AS ENUM('DEPOSIT', 'WITHDRAWAL');--> statement-breakpoint
CREATE TABLE "balance_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"walletID" uuid,
	"amount" bigint NOT NULL,
	"type" "E_BALANCE_LOG_TYPE" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coinflip_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sessionId" uuid NOT NULL,
	"playerChoice" "CoinflipChoice" NOT NULL,
	"result" "CoinflipChoice" NOT NULL,
	"level" integer NOT NULL,
	"multiplier" integer NOT NULL,
	"next" "CoinflipStatus" NOT NULL,
	"client_won" boolean NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dieroll_result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sessionId" uuid NOT NULL,
	"target" integer NOT NULL,
	"condition" "DicerollCondition" NOT NULL,
	"result" integer,
	"multiplier" integer NOT NULL,
	"status" "DicerollStatus" NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serverSeed" varchar NOT NULL,
	"serverSeedHash" varchar NOT NULL,
	"clientSeed" varchar NOT NULL,
	"amount" bigint NOT NULL,
	"user" uuid NOT NULL,
	"gameType" "GameType" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"txId" varchar NOT NULL,
	"value" bigint NOT NULL,
	"type" "TransactionType" NOT NULL,
	"user" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" varchar NOT NULL,
	"xOnlyPublicKey" varchar NOT NULL,
	"username" varchar,
	"wallet" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"referralCode" varchar(12) NOT NULL,
	"referredBy" varchar,
	CONSTRAINT "users_address_unique" UNIQUE("address"),
	CONSTRAINT "users_xOnlyPublicKey_unique" UNIQUE("xOnlyPublicKey"),
	CONSTRAINT "users_referralCode_unique" UNIQUE("referralCode")
);
--> statement-breakpoint
CREATE TABLE "utxos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"txId" varchar NOT NULL,
	"vout" integer NOT NULL,
	"address" varchar NOT NULL,
	"amount" bigint NOT NULL,
	"scriptPubKey" varchar NOT NULL,
	"blockDaaScore" integer NOT NULL,
	"spent" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" varchar NOT NULL,
	"privateKey" varchar NOT NULL,
	"xOnlyPublicKey" varchar NOT NULL,
	"balance" bigint DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "balance_log" ADD CONSTRAINT "balance_log_walletID_wallets_id_fk" FOREIGN KEY ("walletID") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coinflip_results" ADD CONSTRAINT "coinflip_results_sessionId_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dieroll_result" ADD CONSTRAINT "dieroll_result_sessionId_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_wallet_wallets_id_fk" FOREIGN KEY ("wallet") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referredBy_users_referralCode_fk" FOREIGN KEY ("referredBy") REFERENCES "public"."users"("referralCode") ON DELETE no action ON UPDATE no action;