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

    await DB.insert(dieroll).values({
      sessionId: manager.SessionManager.SessionId!,
      condition: manager.SessionManager.ClientGameData!.condition,
      target: manager.SessionManager.ClientGameData!.target,
      multiplier: manager.SessionManager.ClientBetData!.multiplier,
      result: manager.SessionManager.GameResult,
      status: manager.SessionManager.GameResultIsWon!,
    }).execute();
    manager.SessionManager.SessionCompleteEvent.Raise(manager.SessionManager.GameResult!);
  }

  public ExitState(manager: DierollStateManager): void {
    
  }
  
}