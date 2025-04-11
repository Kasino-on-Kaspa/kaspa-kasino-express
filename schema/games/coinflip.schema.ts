import * as p from "drizzle-orm/pg-core";
import { sessionsTable } from "../session.schema";

export const E_COINFLIP_PLAYER_CHOICE = p.pgEnum("CoinflipPlayerChoice", ["HEADS", "TAILS", "CASHOUT"]);
export const E_COINFLIP_SESSION_GAME_RESULT = p.pgEnum("CoinflipSessionGameResult", ["HEADS", "TAILS"]);
export const E_COINFLIP_SESSION_NEXT = p.pgEnum("CoinflipSessionNext", ["CONTINUE", "SETTLED"]);

export const coinflip = p.pgTable("coinflip_results", {
  id: p.uuid().primaryKey().defaultRandom(),
  // Reference to the session
  sessionId: p
    .uuid()
    .references(() => sessionsTable.id)
    .notNull(),
  // Player's choice
  playerChoice: E_COINFLIP_PLAYER_CHOICE().notNull(),
  // Result of the flip (only set when game is settled)
  result: E_COINFLIP_SESSION_GAME_RESULT().notNull(),
  level: p.integer().notNull(),
  // Multiplier for the bet
  multiplier: p.integer().notNull(),
  
  client_won: p.boolean().notNull(),
  next: E_COINFLIP_SESSION_NEXT().notNull(),
  // Created at
  createdAt: p.timestamp().notNull().defaultNow(),
});
