import * as p from "drizzle-orm/pg-core";
import { users } from "./users.schema";

export const referralEarnings = p.pgTable("referral_earnings", {
  id: p.uuid().primaryKey().defaultRandom(),

  referrer: p
    .uuid()
    .references(() => users.id)
    .notNull(),

  referred: p
    .uuid()
    .references(() => users.id)
    .notNull(),

  amount: p.bigint({ mode: "bigint" }).notNull(), // Amount in Sompi

  gameResult: p.varchar().notNull(), // WIN or LOSE

  createdAt: p.timestamp().notNull().defaultNow(),
});
