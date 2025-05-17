import { AccountStoreInstance } from "@/index";
import { AccountStore } from "../entities/accounts";
import { DB } from "@/database";
import { users } from "@schema/users.schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { ReferralModel } from "./referral.model";
import { WalletDBQueueHandler } from "@services/wallet/entities/wallet-updater";
import { EventBus } from "@utils/eventbus";
import { referralEarnings } from "@schema/referrel.schema";

export class ReferralController {
  private RefferalModel: ReferralModel = new ReferralModel();

  private WIN_REFERRAL_PAYOUT_PERCENTAGE = 20 * 100 * 100;
  private LOSE_REFERRAL_PAYOUT_PERCENTAGE = 10 * 100 * 100;

  public async handleGameCompleted(data: {
    account: { username: string; id: string };
    result: "WIN" | "LOSE" | "DRAW";
    bet: number;
    payout: number;
  }) {
    if (data.result == "DRAW") return;

    // First get the user's referral code
    const userResult = await DB.select({ referredBy: users.referredBy })
      .from(users)
      .where(eq(users.id, data.account.id))
      .limit(1);

    if (!userResult.length || !userResult[0].referredBy) return;

    const referrer = await AccountStoreInstance.GetAccountByReferralID(userResult[0].referredBy);
    let refferalWallet = await this.RefferalModel.GetRefferalWalletID(
      referrer
    );
    console.log("RefferalWallet :" , refferalWallet)

    if (!refferalWallet) return;

    let payout: number;

    if (data.result == "WIN")
      payout =
        (Number(data.payout) * this.WIN_REFERRAL_PAYOUT_PERCENTAGE) / (100 * 100);
    else
      payout =
        (Math.abs(Number(data.payout)) * this.LOSE_REFERRAL_PAYOUT_PERCENTAGE) /
        (100 * 100);

    // Track referral earnings
    console.log(referrer,data.account.id)
    await DB.insert(referralEarnings).values({
      referrer: referrer,
      referred: data.account.id,
      amount: BigInt(payout),
      gameResult: data.result,
    });

    EventBus.Instance.emit("wallet:update", {
      id: refferalWallet,
      delta: payout,
      reason: "REFERRAL_RETURN",
    });
  }

  public async getReferralStats(referralCode: string) {
    const [totalReferrals, earnings] = await Promise.all([
      DB.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.referredBy, referralCode)),
      DB.select({
        totalEarnings: sql<string>`sum(${referralEarnings.amount})`,
        winEarnings: sql<string>`sum(case when ${referralEarnings.gameResult} = 'WIN' then ${referralEarnings.amount} else 0 end)`,
        loseEarnings: sql<string>`sum(case when ${referralEarnings.gameResult} = 'LOSE' then ${referralEarnings.amount} else 0 end)`,
      })
        .from(referralEarnings)
        .where(eq(referralEarnings.referrer, referralCode)),
    ]);

    return {
      totalReferrals: totalReferrals[0].count || 0,
      totalEarnings: (earnings[0].totalEarnings || 0).toString(),
      winEarnings: (earnings[0].winEarnings || 0).toString(),
      loseEarnings: (earnings[0].loseEarnings || 0).toString(),
    };
  }
}
