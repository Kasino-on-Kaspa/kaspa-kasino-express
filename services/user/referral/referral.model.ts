import { eq } from "drizzle-orm";

import { users } from "@schema/users.schema";
import { DB } from "@/database";
export class ReferralModel {
  public async GetRefferalAccountID(accountID: string) {
    let res = await DB.select({ referral: users.referredBy })
      .from(users)
      .where(eq(users.id, accountID))
      .limit(1);
    if (res.length <= 0) return null;
    return res[0].referral;
  }

  public async GetRefferalWalletID(accountID: string) {
    let res = await DB.select({ wallet: users.wallet })
      .from(users)
      .where(eq(users.id, accountID))
      .limit(1);
    if (res.length <= 0) return null;
    return res[0].wallet;
  }
}
