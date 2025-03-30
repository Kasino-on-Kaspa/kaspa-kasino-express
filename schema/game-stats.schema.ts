import { sql } from "drizzle-orm";
import * as p from "drizzle-orm/pg-core"
import { users } from "./users.schema";

export const GameStatsSchema = p.pgTable("game_stats", {
    account_id: p.text("account_id").primaryKey().references(() => users.id),
    total_bet_amount: p.bigint({mode: "bigint"}).default(sql`0::bigint`),
    total_won_amount: p.bigint({mode: "bigint"}).default(sql`0::bigint`),
});