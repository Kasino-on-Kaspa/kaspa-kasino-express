import { SessionBaseState } from "@utils/session/base.state";
import { CoinflipSessionGameState } from ".";
import { CoinflipStateManager } from "../entities/state.manager";

export class CoinflipCashoutState extends SessionBaseState<CoinflipStateManager> {
  protected _stateName: string = CoinflipSessionGameState.CASHOUT;


  public EnterState(manager: CoinflipStateManager): void {
    this.HandleCashout(manager);
  }

  public async HandleCashout(manager: CoinflipStateManager): Promise<void> {
    if (!manager.SessionManager.GameResultIsWon) {
      return;
    }
    
    if (!manager.SessionManager.ClientBetData) {
      throw new Error("Client bet data not found");
    }

    await manager.SessionManager.AssociatedAccount.AddBalance(manager.SessionManager.ClientBetData!.bet * BigInt(manager.SessionManager.ClientBetData!.multiplier ** manager.SessionManager.Level), "BET_RETURN");
    manager.ChangeState(CoinflipSessionGameState.END);
    return;
  }

  public ExitState(manager: CoinflipStateManager): void {
  }
}   