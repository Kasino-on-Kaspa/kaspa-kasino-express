import { BetSessionBaseState } from "../state";
import { BetSessionStateMachine } from "../state-machine";

export class BetSessionSettleState extends BetSessionBaseState {
  protected _stateName: TSessionState = "BET_SETTLE";

  public EnterState(manager: BetSessionStateMachine): void {
    this.HandleBetSettle(manager);
  }

  async HandleBetSettle(manager: BetSessionStateMachine) {
    let account = manager.SessionContext.ClientAccount;
    let bet_amount = manager.SessionContext.BetAmount;
    let multiplier = manager.SessionContext.Multiplier;

    await account.AddBalance(bet_amount * multiplier);

    manager.ChangeCurrentState(manager.SessionStates.BetFullfilledState());
  }

  public ExitState(manager: BetSessionStateMachine): void {
    console.log(`Exited ${this._stateName} State`);
  }
}
