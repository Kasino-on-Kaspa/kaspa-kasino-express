import { SessionBaseState } from "@utils/session/base.state";
import { CoinflipSessionGameState } from ".";
import { CoinflipStateManager } from "../entities/state.manager";

export class CoinflipCashoutState extends SessionBaseState<CoinflipStateManager> {
  protected _stateName: string = CoinflipSessionGameState.CASHOUT;


  public EnterState(manager: CoinflipStateManager): void {
    this.HandleCashout(manager);
  }

  public async HandleCashout(manager: CoinflipStateManager): Promise<void> {
    if (!manager.SessionManager.LastLog || manager.SessionManager.LastLog.result != manager.SessionManager.LastLog.playerChoice) {
      return;
    }
    
    if (!manager.SessionManager.ClientBetData) {
      throw new Error("Client bet data not found");
    }
    let netMultiplier = manager.SessionManager.ClientBetData!.multiplier / (100 * 100);
    console.log("netMultiplier", netMultiplier);
    console.log("level", manager.SessionManager.Level);
    let payout = BigInt(Math.floor(Number(manager.SessionManager.ClientBetData!.bet) * (netMultiplier ** (manager.SessionManager.Level - 1))));
    console.log("payout", payout);
    manager.SessionManager.Payout = payout;
    manager.SessionManager.AssociatedAccount.Wallet.AddBalance(payout, "BET_RETURN");

    manager.ChangeState(CoinflipSessionGameState.END);
    return;
  }

  public ExitState(manager: CoinflipStateManager): void {
  }
}   