import { SessionBaseState } from "@utils/session/base.state";
import { CoinflipSessionGameState } from ".";
import { CoinflipStateManager } from "../entities/state.manager";

export class CoinflipNextState extends SessionBaseState<CoinflipStateManager> {
  protected _stateName: string = CoinflipSessionGameState.NEXT;

  public EnterState(manager: CoinflipStateManager): void {
    this.HandleNext(manager);
  }

  public async HandleNext(manager: CoinflipStateManager): Promise<void> {
    console.log("HandleNext", manager.SessionManager.CurrentNext);
    await manager.SessionManager.AddLog({
      result: manager.SessionManager.CurrentResult!,
      playerChoice: manager.SessionManager.CurrentChoice!,
      client_won: manager.SessionManager.CurrentResult == manager.SessionManager.CurrentChoice,
      level: manager.SessionManager.Level,
      next: manager.SessionManager.CurrentNext!,
    });
    
    manager.SessionManager.SessionResultEvent.Raise(manager.SessionManager.CurrentResult!);
    
    
    if (manager.SessionManager.CurrentNext == "CONTINUE") {
      manager.SessionManager.IncrementLevel();
      manager.ChangeState(CoinflipSessionGameState.FLIP);
    }
    
    else {
      manager.ChangeState(CoinflipSessionGameState.END);
    }
    
  }
  
  public ExitState(manager: CoinflipStateManager): void {
    manager.SessionManager.ResetCurrentChoices();
  }
}