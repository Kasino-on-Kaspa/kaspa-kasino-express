import { relations } from "drizzle-orm/relations";
import { sessions, dierollResult, users, transactions } from "./schema";

export const dierollResultRelations = relations(dierollResult, ({one}) => ({
	session: one(sessions, {
		fields: [dierollResult.sessionId],
		references: [sessions.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({many}) => ({
	dierollResults: many(dierollResult),
}));

export const transactionsRelations = relations(transactions, ({one}) => ({
	user: one(users, {
		fields: [transactions.user],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	transactions: many(transactions),
}));