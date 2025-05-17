import * as p from "drizzle-orm/pg-core";
import { users } from "./users.schema";
import { wallets } from "./wallets.schema";

export const E_BALANCE_LOG_TYPE = p.pgEnum("E_BALANCE_LOG_TYPE", ["DEPOSIT", "WITHDRAWAL", "BET", "BET_RETURN", "REFERRAL_RETURN","WITHDRAWAL_RETURN"])

export const balance_log = p.pgTable("balance_log", {
    id: p.uuid("id").primaryKey().defaultRandom(),
    walletID: p.uuid("walletID").references(() => wallets.id),
    amount: p.bigint({mode: "bigint"}).notNull(),
    type: E_BALANCE_LOG_TYPE().notNull(),
    created_at: p.timestamp("created_at").notNull().defaultNow(),
});

