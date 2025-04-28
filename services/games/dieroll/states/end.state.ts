import { TDieRollGameState } from ".";
import { SessionBaseState } from "@utils/session/base.state";
import { DieRollGameState } from ".";
import { DierollStateManager } from "../entities/state.manager";
import { DB } from "@/database";
import { dieroll } from "@schema/games/dieroll.schema";

export class DieRollEndState extends SessionBaseState<DierollStateManager> {
  protected _stateName: TDieRollGameState = DieRollGameState.END;

  public EnterState(manager: DierollStateManager): void {
    this.HandleEnd(manager);
  }

  public async HandleEnd(manager: DierollStateManager): Promise<void> {

    manager.SessionManager.SessionCompleteEvent.Raise({
      account: manager.SessionManager.AssociatedAccount,
      payout: manager.SessionManager.Payout!,
      result: manager.SessionManager.SessionResult!,
      bet: manager.SessionManager.ClientBetData!.bet,
    });
  }

  public ExitState(manager: DierollStateManager): void {
    
  }
  
}