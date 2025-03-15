import * as p from "drizzle-orm/pg-core";
import { sessionsTable } from "../session.schema";

export const E_COINFLIP_OPTION = p.pgEnum("CoinflipChoice", ["HEADS", "TAILS"]);

export const E_COINFLIP_STATUS = p.pgEnum("CoinflipStatus", [
  "PROGRESS",
  "CONTINUE",
  "CASHOUT",
  "PENDING",
  "DEFEATED",
]);

export const coinflip = p.pgTable("coinflip_results", {
  id: p.uuid().primaryKey().defaultRandom(),
  // Reference to the session
  sessionId: p
    .uuid()
    .references(() => sessionsTable.id)
    .notNull(),
  // Player's choice
  playerChoice: E_COINFLIP_OPTION().notNull(),
  // Result of the flip (only set when game is settled)
  result: E_COINFLIP_OPTION().notNull(),
  level: p.integer().notNull(),
  // Multiplier for the bet
  multiplier: p.integer().notNull(),
  status: E_COINFLIP_STATUS().notNull(),
  
  client_won: p.boolean().notNull(),

  // Created at
  createdAt: p.timestamp().notNull().defaultNow(),
});
