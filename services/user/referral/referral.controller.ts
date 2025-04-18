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

  private WIN_REFERRAL_PAYOUT_PERCENTAGE = 20 * 100 * 100;
  private LOSE_REFERRAL_PAYOUT_PERCENTAGE = 10 * 100 * 100;
  
  public async handleGameCompleted(data: {
    account: { username: string; id: string };
    result: "WIN" | "LOSE" | "DRAW";
    bet: number;
    payout: number;
  }) {
    if (data.result == "DRAW") return;
    let account = AccountStoreInstance.GetUserFromAccountID(data.account.id);
    let refferal: string | null = null;
    
    if (account) refferal = account.Referral;
    else refferal = await this.RefferalModel.GetRefferalAccountID(data.account.id);
    
    if (!refferal) return;    
    let refferalWallet = await this.RefferalModel.GetRefferalWalletID(refferal);
    let payout:number;

    if (data.result == "WIN") payout = data.payout * this.WIN_REFERRAL_PAYOUT_PERCENTAGE/(100*100);
    else payout = Math.abs(data.payout) * this.LOSE_REFERRAL_PAYOUT_PERCENTAGE / (100*100);
    
    EventBus.Instance.emit("wallet:update", {
      walletID: refferalWallet,
      balance: payout,
      type: "REFFEAL_RETURN",
    });
  }
}
