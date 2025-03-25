import { SessionBaseState } from "@utils/session/base.state";
import { CoinflipSessionGameState } from ".";
import { CoinflipStateManager } from "../entities/state.manager";

export class CoinflipTimeoutState extends SessionBaseState<CoinflipStateManager> {
  protected _stateName: string = CoinflipSessionGameState.TIMEOUT;

  public EnterState(manager: CoinflipStateManager): void {
    manager.SessionManager.OnStateTimeoutEvent.Raise();
  }

  public ExitState(manager: CoinflipStateManager): void {
  }
}