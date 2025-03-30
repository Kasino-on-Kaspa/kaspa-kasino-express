CREATE TABLE "game_stats" (
	"account_id" text PRIMARY KEY NOT NULL,
	"total_bet_amount" bigint DEFAULT 0::bigint,
	"total_won_amount" bigint DEFAULT 0::bigint
);
--> statement-breakpoint
ALTER TABLE "utxos" ADD PRIMARY KEY ("txId");--> statement-breakpoint
ALTER TABLE "utxos" ADD PRIMARY KEY ("vout");--> statement-breakpoint
ALTER TABLE "game_stats" ADD CONSTRAINT "game_stats_account_id_users_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;