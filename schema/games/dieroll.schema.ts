import * as p from "drizzle-orm/pg-core";
import { sessionsTable } from "../session.schema";

export const E_DICEROLL_CONDITION = p.pgEnum("DicerollCondition", [
	"OVER",
	"UNDER",
]);

export const dieroll = p.pgTable("dieroll_result", {
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
	client_won: p.boolean(),
	// Multiplier for the bet in basis points
	multiplier: p.integer().notNull(),
	// Settled at
	settledAt: p.timestamp(),
});