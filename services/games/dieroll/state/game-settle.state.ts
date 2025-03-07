import { BetSessionBaseState } from "../../../../utils/session/state";
import { BetSessionStateMachine } from "../../../../utils/session/state-machine";
import { DieRollSessionContext } from "../utils/session-context";

export class DieRollSettleState extends BetSessionBaseState {
  protected _stateName: TSessionState = "GAME_SETTLE";

  public EnterState(
    manager: BetSessionStateMachine<DieRollSessionContext>
  ): void {
    
    console.log(`Entered ${this._stateName} State`);
    this.timeout(1000).then(() => {
      manager.ChangeCurrentState(manager.SessionStates.BetSettleState());
    });
    
  }

  public ExitState(
    manager: BetSessionStateMachine<DieRollSessionContext>
  ): void {
    console.log(`Exited ${this._stateName} State`);
  }
}
