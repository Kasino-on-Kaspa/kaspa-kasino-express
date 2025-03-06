import * as p from "drizzle-orm/pg-core";

// Wallet table to track deposit addresses
export const wallets = p.pgTable("wallets", {
	// Wallet ID
	id: p.uuid().primaryKey().defaultRandom(),

	// Wallet details
	address: p.varchar().notNull(),

	// HDPath Index "m/111111'/0'/0'/${index}/"
	index: p.varchar().notNull(),

	// Timestamps
	createdAt: p.timestamp().notNull().defaultNow(),
});

export const utxos = p.pgTable("utxos", {
	// Transaction ID
	txid: p.varchar().notNull(),

	// Outpoint
	vout: p.integer().notNull(),

	// Address/wallet
	address: p.varchar().notNull(),

	// Amount
	value: p.varchar().notNull(),
});
