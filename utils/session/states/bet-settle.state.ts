import { BetSessionBaseState } from "../state";
import { BetSessionStateMachine } from "../state-machine";

export class BetSessionSettleState extends BetSessionBaseState {
  
  protected _stateName: TSessionState = "BET_SETTLE";

  public EnterState(manager: BetSessionStateMachine): void {
    console.log(`Entered ${this._stateName} State`);
    this.timeout(1000).then(() => {
      manager.ChangeCurrentState(manager.SessionStates.FullfilledState());
    });
  }

  public ExitState(manager: BetSessionStateMachine): void {
    console.log(`Exited ${this._stateName} State`);
  }
}
