import { BetSessionBaseState } from "../base.state";
import { SessionManager } from "../session.manager";

export class BetSessionErrorState extends BetSessionBaseState {
  
  protected _stateName: TSessionState = "BET_START";

  public EnterState(manager: SessionManager): void {
    console.log(`Entered ${this._stateName} State`);
  }

  public ExitState(manager: SessionManager): void {
    console.log(`Exited ${this._stateName} State`);
  }
}
