import * as p from "drizzle-orm/pg-core";

export const utxos = p.pgTable("utxos", {
	id: p.uuid().primaryKey().defaultRandom(),

	// Transaction ID
	txId: p.varchar().notNull(),

	// Vout
	vout: p.integer().notNull(),
    
	// Utxo owner
	address: p.varchar().notNull(),

	// Amount in Sompi
	amount: p.bigint({ mode: "bigint" }).notNull(),

	// ScriptPubKey
	scriptPubKey: p.varchar().notNull(),

	// Block DaaScore
	blockDaaScore: p.integer().notNull(),

	// Spent
	spent: p.boolean().default(false),

	// Created at
	createdAt: p.timestamp().notNull().defaultNow(),
});
