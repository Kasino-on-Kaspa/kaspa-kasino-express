import * as p from "drizzle-orm/pg-core";
import { wallets } from "./wallets.schema";

export const users = p.pgTable("users", {

	// User ID
	id: p.uuid().primaryKey().defaultRandom(),

	// User auth address
	address: p.varchar().notNull(),

	// User public key
	publicKey: p.varchar().notNull(),

	// Username
	username: p.varchar(),

	// Deposit address
	depositAddress: p    
		.uuid()
		.references(() => wallets.id)
		.notNull(),
        
	// User's balance
	balance: p.bigint({ mode: "number" }).notNull().default(0),
	createdAt: p.timestamp().notNull().defaultNow(),
});
