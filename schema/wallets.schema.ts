import { sql } from "drizzle-orm";
import * as p from "drizzle-orm/pg-core";

// Wallet table to track deposit addresses
export const wallets = p.pgTable("wallets", {
	// Wallet ID
	id: p.uuid().primaryKey().defaultRandom(),

	// Wallet details
	address: p.varchar().notNull(),

	// Private Key
	privateKey: p.varchar().notNull(),

	// xOnly Public Key
	xOnlyPublicKey: p.varchar().notNull(),

	balance: p.bigint({ mode: "bigint" }).notNull().default(sql`0`),
	// Timestamps
	createdAt: p.timestamp().notNull().defaultNow(),
});
