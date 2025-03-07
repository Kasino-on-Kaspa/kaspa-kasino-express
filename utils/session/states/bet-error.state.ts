import { BetSessionBaseState } from "../state";
import { BetSessionStateMachine } from "../state-machine";

export class BetSessionErrorState extends BetSessionBaseState {
  
  protected _stateName: TSessionState = "BET_START";

  public EnterState(manager: BetSessionStateMachine): void {
    console.log(`Entered ${this._stateName} State`);
  }

  public ExitState(manager: BetSessionStateMachine): void {
    console.log(`Exited ${this._stateName} State`);
  }
}
