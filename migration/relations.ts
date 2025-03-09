import { relations } from "drizzle-orm/relations";
import { sessions, dicerollGames } from "./schema";

export const dicerollGamesRelations = relations(dicerollGames, ({one}) => ({
	session: one(sessions, {
		fields: [dicerollGames.sessionId],
		references: [sessions.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({many}) => ({
	dicerollGames: many(dicerollGames),
}));