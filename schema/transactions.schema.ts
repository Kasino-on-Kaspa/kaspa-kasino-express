import * as p from "drizzle-orm/pg-core";
import { users } from "./users.schema";
export const E_TRANSACTION_TYPE = p.pgEnum("TransactionType", [
	"DEPOSIT",
	"WITHDRAWAL",
]);

export const transactions = p.pgTable("transactions", {
	id: p.uuid().primaryKey().defaultRandom(),

	txId: p.varchar().notNull(),

	value: p.bigint({ mode: "bigint" }).notNull(), // Value in Sompi

	type: E_TRANSACTION_TYPE("type").notNull(),

	user: p
		.uuid()
		.references(() => users.id)
		.notNull(),

	createdAt: p.timestamp().notNull().defaultNow(),
});
