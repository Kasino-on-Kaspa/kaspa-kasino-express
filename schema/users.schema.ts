import * as p from "drizzle-orm/pg-core";
import { wallets } from "./wallets.schema";

export const users = p.pgTable("users", {

	// User ID
	id: p.uuid().primaryKey().defaultRandom(),

	// User auth address
	address: p.varchar().notNull().unique(),

	// User xOnlyPublic key
	xOnlyPublicKey: p.varchar().notNull().unique(),

	// Username
	username: p.varchar(),

	// Deposit address
	wallet: p    
		.uuid()
		.references(() => wallets.id)
		.notNull(),
        
	// User's balance
	balance: p.bigint({ mode: "number" }).notNull().default(0),
	createdAt: p.timestamp().notNull().defaultNow(),
});
