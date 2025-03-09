CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" varchar NOT NULL,
	"publicKey" varchar NOT NULL,
	"username" varchar,
	"depositAddress" uuid NOT NULL,
	"balance" bigint DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "utxos" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "utxos" CASCADE;--> statement-breakpoint
ALTER TABLE "diceroll_games" RENAME TO "dieroll_result";--> statement-breakpoint
ALTER TABLE "dieroll_result" DROP CONSTRAINT "diceroll_games_sessionId_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "dieroll_result" ALTER COLUMN "multiplier" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "privateKey" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "dieroll_result" ADD COLUMN "client_won" boolean;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_depositAddress_wallets_id_fk" FOREIGN KEY ("depositAddress") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dieroll_result" ADD CONSTRAINT "dieroll_result_sessionId_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dieroll_result" DROP COLUMN "createdAt";