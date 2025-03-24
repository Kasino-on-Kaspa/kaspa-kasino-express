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
  private allAccountLogoutListener?: number;
  public EnterState(manager: CoinflipStateManager): void {
    manager.SessionManager.IncrementLevel();

    this.nextSelectionListener = manager.SessionManager.GameNextSelectionEvent.RegisterEventListener(async (choice) => {
      this.HandleNextSelection(manager,choice);
    });

    this.allAccountLogoutListener = manager.SessionManager.AssociatedAccount.AssociatedSockets.OnAllSocketsDisconnect.RegisterEventListener(async () => {
      this.HandleStateTimeout(manager);
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
  
  public async HandleNextSelection(manager: CoinflipStateManager,choice: "CASHOUT" | "CONTINUE"): Promise<void> {
    this.UnregisterNextSelectionListener(manager);
    if (choice == "CASHOUT") {
      manager.SessionManager.UpdateLastLog({nextSelection: "CASHOUT"});
      manager.SessionManager.AddLastLogToDB();
      manager.ChangeState(CoinflipSessionGameState.CASHOUT);
      return;
    }
    else{
      manager.SessionManager.UpdateLastLog({nextSelection: "CONTINUE"});
      await manager.SessionManager.AddLastLogToDB();
      manager.ChangeState(CoinflipSessionGameState.FLIP_CHOICE);
    }
  }
  private UnregisterNextSelectionListener(manager: CoinflipStateManager): void {
    if (this.nextSelectionListener) {
      manager.SessionManager.GameNextSelectionEvent.UnRegisterEventListener(this.nextSelectionListener);
    }
    if (this.allAccountLogoutListener){
      manager.SessionManager.AssociatedAccount.AssociatedSockets.OnAllSocketsDisconnect.UnRegisterEventListener(this.allAccountLogoutListener);
    }
    clearTimeout(this.pushToDBTimeout);
  }
  public ExitState(manager: CoinflipStateManager): void { 
    this.UnregisterNextSelectionListener(manager);
  }

  
}

