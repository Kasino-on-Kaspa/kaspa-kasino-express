import { BetSessionBaseState } from "../base.state";
import { SessionManager } from "../session.manager";

export class BetSessionStartState extends BetSessionBaseState {
  protected _stateName: TSessionState = "BET_START";

  public EnterState(manager: SessionManager): void {
    this.HandleSessionStart(manager);
  }

  async HandleSessionStart(manager: SessionManager) {
    let account = manager.SessionContext.ClientAccount;
    let bet_amount = manager.SessionContext.BetAmount;

    // Update in-memory balance only
    await account.RemoveBalance(bet_amount, "BET");

    // Log the bet
    console.log(`User ${account.Id} placed bet of ${bet_amount.toString()}`);

    manager.ChangeCurrentState(manager.SessionStateFactory.GameSettleState());
  }

  public ExitState(manager: SessionManager): void {
    console.log(`Exited ${this._stateName} State`);
  }
}
