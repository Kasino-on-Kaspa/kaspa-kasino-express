import { SessionBaseState } from "@utils/session/base.state";
import { DieRollGameState ,TDieRollGameState} from ".";
import { DierollStateManager } from "../entities/state.manager";

export class DieRollSettleState extends SessionBaseState<DierollStateManager> {
  protected _stateName: TDieRollGameState = DieRollGameState.SETTLE;

  public EnterState(manager: DierollStateManager): void {
    this.HandleSettle(manager);
  }
  
  public HandleSettle(manager: DierollStateManager): void {
    let isWon = manager.SessionManager.GetResultIsWon();
    let payout = manager.SessionManager.ClientBetData!.bet * BigInt(manager.SessionManager.ClientBetData!.multiplier);
    
    if (isWon == "WON") {
      manager.SessionManager.AssociatedAccount.AddBalance(payout, "BET_RETURN");
      
    }
    
    if (isWon == "DRAW") {
      // manager.SessionManager.AssociatedAccount.AddBalance(manager.SessionManager.ClientBetData!.bet, "BET_RETURN");
    }

    manager.ChangeState(DieRollGameState.END);
  }

  public ExitState(manager: DierollStateManager): void {
  }
  
}   