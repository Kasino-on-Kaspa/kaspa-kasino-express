import { BetSessionContext } from "../entities/session-context";
import { BetSessionBaseState } from "../state";
import { BetSessionStateMachine } from "../state-machine";

export class BetSessionStartState extends BetSessionBaseState {
  protected _stateName: TSessionState = "BET_START";

  public EnterState(manager: BetSessionStateMachine): void {
    this.HandleSessionStart(manager);
  }
  
  async HandleSessionStart(manager: BetSessionStateMachine<BetSessionContext>) {
    let account = manager.SessionContext.ClientAccount;
    let bet_amount = manager.SessionContext.BetAmount;

    await account.RemoveBalance(bet_amount);

    manager.ChangeCurrentState(manager.SessionStates.GameSettleState());
  }

  public ExitState(manager: BetSessionStateMachine): void {
    console.log(`Exited ${this._stateName} State`);
  }
}
