import { BetSessionBaseState } from "../state";
import { BetSessionStateMachine } from "../state-machine";
import { DB } from "../../../database";
import { users } from "../../../schema/users.schema";
import { eq } from "drizzle-orm";

export class BetSessionSettleState extends BetSessionBaseState {
  protected _stateName: TSessionState = "BET_SETTLE";

  public EnterState(manager: BetSessionStateMachine): void {
    this.HandleBetSettle(manager);
  }

  async HandleBetSettle(manager: BetSessionStateMachine) {
    let account = manager.SessionContext.ClientAccount;
    let bet_amount = manager.SessionContext.BetAmount;
    let multiplier = manager.SessionContext.Multiplier;
    
    // Calculate win amount
    const winAmount = bet_amount * (multiplier / 10000); // Mult in basis points
    
    // Update in-memory balance only
    await account.AddBalance(winAmount);
    
    // Sync to database periodically or after significant changes
    // if (winAmount > 1000) {
    //   await account.syncBalanceToDatabase();
    // }
    
    // Log the win
    console.log(`User ${account.Id} won ${winAmount} with multiplier ${multiplier}`);

    manager.ChangeCurrentState(manager.SessionStates.BetFullfilledState());
  }

  public ExitState(manager: BetSessionStateMachine): void {
    console.log(`Exited ${this._stateName} State`);
  }
}
