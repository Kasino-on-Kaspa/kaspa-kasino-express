import { SessionBaseState } from "@utils/session/base.state";
import { CoinflipSessionGameState } from ".";
import { CoinflipStateManager } from "../entities/state.manager";

export class CoinflipEndState extends SessionBaseState<CoinflipStateManager> {
  protected _stateName: string = CoinflipSessionGameState.END;

  public EnterState(manager: CoinflipStateManager): void {
    manager.SessionManager.SessionCompleteEvent.Raise({
      account: manager.SessionManager.AssociatedAccount,
      payout: manager.SessionManager.Payout!,
      bet: manager.SessionManager.ClientBetData!.bet,
    });
  }

  public ExitState(manager: CoinflipStateManager): void {
  }
}

