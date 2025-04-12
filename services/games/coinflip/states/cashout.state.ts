import { SessionBaseState } from "@utils/session/base.state";
import { CoinflipSessionGameState } from ".";
import { CoinflipStateManager } from "../entities/state.manager";
import { CoinflipSession } from "../entities/coinflip.session";
import { EventBus } from "@utils/eventbus";

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
    let payout = BigInt(Math.floor(Number(manager.SessionManager.ClientBetData!.bet) * Math.fround(netMultiplier ** (manager.SessionManager.Level - 1))));

    this.SetSessionPayout(manager.SessionManager, payout);
    
    EventBus.Instance.emit("wallet:update", {id: manager.SessionManager.AssociatedAccount.Wallet.id, delta: payout, reason: "BET_RETURN"});
    
    manager.SessionManager.SetCurrentClientIsWon(true)
    manager.SessionManager.SetCurrentNext("SETTLED");
    manager.ChangeState(CoinflipSessionGameState.NEXT);
    return;
  }

  private SetSessionPayout(sessionManager: CoinflipSession, payout: bigint) {
    sessionManager.Payout = payout;
  }

  public ExitState(manager: CoinflipStateManager): void {
  }
}   