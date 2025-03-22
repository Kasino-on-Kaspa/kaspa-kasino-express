import * as p from "drizzle-orm/pg-core";
import { users } from "./users.schema";

export const E_BALANCE_LOG_TYPE = p.pgEnum("E_BALANCE_LOG_TYPE", ["DEPOSIT", "WITHDRAWAL", "BET", "BET_RETURN"])

export const balance_log = p.pgTable("balance_log", {
    id: p.uuid("id").primaryKey().defaultRandom(),
    account: p.uuid("account").references(() => users.id),
    amount: p.bigint({mode: "bigint"}).notNull(),
    type: E_BALANCE_LOG_TYPE().notNull(),
    created_at: p.timestamp("created_at").notNull().defaultNow(),
});

