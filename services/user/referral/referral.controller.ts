import { AccountStoreInstance } from "@/index";
import { AccountStore } from "../entities/accounts";
import { DB } from "@/database";
import { users } from "@schema/users.schema";
import { eq } from "drizzle-orm";
import { ReferralModel } from "./referral.model";
import { WalletDBQueueHandler } from "@services/wallet/entities/wallet-updater";
import { EventBus } from "@utils/eventbus";

export class ReferralController {
  private RefferalModel: ReferralModel = new ReferralModel();
  public async handleGameCompleted(data: {
    account: { username: string; id: string };
    result: "WIN" | "LOSE" | "DRAW";
    bet: number;
    payout: number;
  }) {
    if (data.result != "WIN") return;
    let account = AccountStoreInstance.GetUserFromAccountID(data.account.id);
    let refferal: string | null = null;
    if (account) refferal = account.Referral;
    else refferal = await this.RefferalModel.GetRefferalAccountID(data.account.id);

    if (!refferal) return;
    let refferalWallet = await this.RefferalModel.GetRefferalWalletID(refferal);
    EventBus.Instance.emit("wallet:update", {
      walletID: refferalWallet,
      balance: data.payout * 0.05,
      type: "REFFEAL_RETURN",
    });
  }
}
