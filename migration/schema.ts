import { pgTable, varchar, integer, uuid, timestamp, foreignKey, numeric, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const dicerollCondition = pgEnum("DicerollCondition", ['OVER', 'UNDER'])
export const gameType = pgEnum("GameType", ['DICEROLL', 'COINFLIP'])


export const utxos = pgTable("utxos", {
	txid: varchar().notNull(),
	vout: integer().notNull(),
	address: varchar().notNull(),
	value: varchar().notNull(),
});

export const wallets = pgTable("wallets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	address: varchar().notNull(),
	index: varchar().notNull(),
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

export const dicerollGames = pgTable("diceroll_games", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid().notNull(),
	target: integer().notNull(),
	condition: dicerollCondition().notNull(),
	result: integer(),
	multiplier: numeric().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	settledAt: timestamp({ mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessions.id],
			name: "diceroll_games_sessionId_sessions_id_fk"
		}),
]);
