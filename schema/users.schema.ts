import * as p from "drizzle-orm/pg-core";
import { wallets } from "./wallets.schema";
import { sql } from "drizzle-orm";
import crypto from "crypto";
import { foreignKey, uuid } from "drizzle-orm/gel-core";
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

  createdAt: p.timestamp().notNull().defaultNow(),

  referralCode: p
    .varchar({
      length: 12,
    })
    .notNull()
    .unique()
    .$defaultFn(() => crypto.randomBytes(6).toString("hex")),

  referredBy: p.uuid().references((): p.AnyPgColumn => users.referralCode),
});
