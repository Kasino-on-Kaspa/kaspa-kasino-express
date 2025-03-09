import * as p from "drizzle-orm/pg-core";

export const E_GAME_TYPE = p.pgEnum("GameType", ["DICEROLL", "COINFLIP"]);

export const sessionsTable = p.pgTable("sessions", {
  // Session ID
  id: p.uuid().primaryKey().defaultRandom(),


  // Game data
  serverSeed: p.varchar().notNull(),
  serverSeedHash: p.varchar().notNull(),
  clientSeed: p.varchar().notNull(),

  // Bet amount
  amount: p.integer().notNull(),

  // Game type
  gameType: E_GAME_TYPE().notNull(),

  // Timestamps
  createdAt: p.timestamp().notNull().defaultNow(),
});

sessionsTable.enableRLS();