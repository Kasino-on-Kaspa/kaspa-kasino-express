import { BetSessionBaseState } from "../state";
import { BetSessionStateMachine } from "../state-machine";

export class BetSessionFullfilledState extends BetSessionBaseState {
  protected _stateName: TSessionState = "BET_FULLFILLED";

  public EnterState(manager: BetSessionStateMachine): void {
    manager.InvokeOnCompleteListener();
  }

  public ExitState(manager: BetSessionStateMachine): void {
    console.log(`Exited ${this._stateName} State`);
  }
}
