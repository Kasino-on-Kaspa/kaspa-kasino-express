import * as p from "drizzle-orm/pg-core";
import { sessionsTable } from "../session.schema";

export const E_DICEROLL_CONDITION = p.pgEnum("DicerollCondition", [
	"OVER",
	"UNDER",
]);

export const dicerollTable = p.pgTable("diceroll_games", {
	id: p.uuid().primaryKey().defaultRandom(),
	// Reference to the session
	sessionId: p
		.uuid()
		.references(() => sessionsTable.id)
		.notNull(),
	// Player's target number (1-100)
	target: p.integer().notNull(),
	// Player's condition choice (over/under)
	condition: E_DICEROLL_CONDITION().notNull(),
	// Result of the roll (only set when game is settled)
	result: p.integer(),
	// Multiplier for the bet
	multiplier: p.decimal().notNull(),
	// Created at
	createdAt: p.timestamp().notNull().defaultNow(),
	// Settled at
	settledAt: p.timestamp(),
});