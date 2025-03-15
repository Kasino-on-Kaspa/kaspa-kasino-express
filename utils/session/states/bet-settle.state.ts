import { BetSessionBaseState } from "../base.state";
import { SessionManager } from "../session.manager";

export class BetSessionSettleState extends BetSessionBaseState {
  protected _stateName: TSessionState = "BET_SETTLE";

  public EnterState(manager: SessionManager): void {
    this.HandleBetSettle(manager);
  }

  async HandleBetSettle(manager: SessionManager) {
    let account = manager.SessionContext.ClientAccount;
    let bet_amount = manager.SessionContext.BetAmount;
    let multiplier = manager.SessionContext.Multiplier;

    // Calculate win amount
    const winAmount = (bet_amount * BigInt(multiplier)) / BigInt(10000); // Convert to BigInt calculation

    // Update in-memory balance only
    await account.AddBalance(winAmount, "WIN");

    // Log the win
    console.log(
      `User ${
        account.Id
      } won ${winAmount.toString()} with multiplier ${multiplier}`
    );

    manager.ChangeCurrentState(
      manager.SessionStateFactory.BetFullfilledState()
    );
  }

  public ExitState(manager: SessionManager): void {
    console.log(`Exited ${this._stateName} State`);
  }
}
