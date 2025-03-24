import { SessionBaseState } from "@utils/session/base.state";
import { CoinflipSessionGameState } from ".";
import { CoinflipStateManager } from "../entities/state.manager";
import { coinflip } from "@schema/games/coinflip.schema";
import { DB } from "@/database";
import { CoinflipSession, TCoinflipSessionLog } from "../entities/coinflip.session";

export class CoinflipNextChoiceState extends SessionBaseState<CoinflipStateManager> {
  protected _stateName: string = CoinflipSessionGameState.NEXT_CHOICE;

  private nextSelectionListener?: number;
  private pushToDBTimeout?: NodeJS.Timeout;
  public EnterState(manager: CoinflipStateManager): void {
    manager.SessionManager.IncrementLevel();

    this.nextSelectionListener = manager.SessionManager.GameNextSelectionEvent.RegisterEventListener(async (choice) => {
      this.HandleNextSelection(manager,choice);
    });

    this.pushToDBTimeout = setTimeout(() => {
      this.HandleStateTimeout(manager);
    }, manager.StateTimeoutDelay);
  }

  private HandleStateTimeout(manager: CoinflipStateManager): void {
    this.UnregisterNextSelectionListener(manager);
    manager.SessionManager.UpdateLastLog({nextSelection: "PENDING"});
    manager.SessionManager.AddLastLogToDB();
    manager.ChangeState(CoinflipSessionGameState.TIMEOUT);
  }
  
  public HandleNextSelection(manager: CoinflipStateManager,choice: "CASHOUT" | "CONTINUE"): void {
    if (choice == "CASHOUT") {
      this.UnregisterNextSelectionListener(manager);
      manager.SessionManager.UpdateLastLog({nextSelection: "CASHOUT"});
      manager.SessionManager.AddLastLogToDB();
      manager.ChangeState(CoinflipSessionGameState.CASHOUT);
      return;
    }
    else{
      this.UnregisterNextSelectionListener(manager);
      manager.SessionManager.UpdateLastLog({nextSelection: "CONTINUE"});
      manager.SessionManager.AddLastLogToDB();
      manager.ChangeState(CoinflipSessionGameState.FLIP_CHOICE);
    }
  }
  private UnregisterNextSelectionListener(manager: CoinflipStateManager): void {
    if (this.nextSelectionListener) {
      manager.SessionManager.GameNextSelectionEvent.UnRegisterEventListener(this.nextSelectionListener);
    }
    clearTimeout(this.pushToDBTimeout);
  }
  public ExitState(manager: CoinflipStateManager): void { 
    this.UnregisterNextSelectionListener(manager);
  }

  
}

