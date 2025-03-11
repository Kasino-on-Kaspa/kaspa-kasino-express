import { pgTable, uuid, varchar, bigint, boolean, timestamp, integer, foreignKey, unique, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const dicerollCondition = pgEnum("DicerollCondition", ['OVER', 'UNDER'])
export const gameType = pgEnum("GameType", ['DICEROLL', 'COINFLIP'])
export const transactionType = pgEnum("TransactionType", ['DEPOSIT', 'WITHDRAWAL'])


export const utxos = pgTable("utxos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	txId: varchar().notNull(),
	address: varchar().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	amount: bigint({ mode: "number" }).notNull(),
	scriptPubKey: varchar().notNull(),
	spent: boolean().default(false),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const wallets = pgTable("wallets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	address: varchar().notNull(),
	privateKey: varchar().notNull(),
	xOnlyPublicKey: varchar().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	serverSeed: varchar().notNull(),
	serverSeedHash: varchar().notNull(),
	clientSeed: varchar().notNull(),
	amount: integer().notNull(),
	gameType: gameType().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const dierollResult = pgTable("dieroll_result", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid().notNull(),
	target: integer().notNull(),
	condition: dicerollCondition().notNull(),
	result: integer(),
	clientWon: boolean("client_won"),
	multiplier: integer().notNull(),
	settledAt: timestamp({ mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessions.id],
			name: "dieroll_result_sessionId_sessions_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	address: varchar().notNull(),
	xOnlyPublicKey: varchar().notNull(),
	username: varchar(),
	depositAddress: varchar().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	balance: bigint({ mode: "number" }).default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_address_unique").on(table.address),
	unique("users_xOnlyPublicKey_unique").on(table.xOnlyPublicKey),
]);

export const transactions = pgTable("transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	txId: varchar().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	value: bigint({ mode: "number" }).notNull(),
	type: transactionType().notNull(),
	user: uuid().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.user],
			foreignColumns: [users.id],
			name: "transactions_user_users_id_fk"
		}),
]);
