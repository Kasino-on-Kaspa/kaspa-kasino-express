import { BetSessionBaseState } from "../base.state";
import { SessionManager } from "../session.manager";

export class BetSessionFullfilledState extends BetSessionBaseState {
  protected _stateName: TSessionState = "BET_FULLFILLED";

  public EnterState(manager: SessionManager): void {
    manager.OnSessionComplete.Raise();
  }

  public ExitState(manager: SessionManager): void {
    console.log(`Exited ${this._stateName} State`);
  }
}
