import { SessionBaseState } from "@utils/session/base.state";
import { CoinflipSessionGameState } from ".";
import { CoinflipStateManager } from "../entities/state.manager";
import { TCoinflipSessionClientGameData } from "../entities/coinflip.session";

export class CoinflipFlipChoiceState extends SessionBaseState<CoinflipStateManager> {
  protected _stateName: string = CoinflipSessionGameState.FLIP_CHOICE;
  protected listenerIndex?: number;
  private Timeout?: NodeJS.Timeout;

  public EnterState(manager: CoinflipStateManager): void {
    this.listenerIndex =
      manager.SessionManager.GameChoiceEvent.RegisterEventListener(
        async (choice) => {
          this.HandleChoiceSelected(manager, choice);
        }
      );

    this.Timeout = setTimeout(() => {
      this.HandleStateTimeout(manager);
    }, manager.StateTimeoutDelay);
  }
  
  public ExitState(manager: CoinflipStateManager): void {
    this.UnregisterChoiceListener(manager);
  }
  
  private HandleChoiceSelected(
    manager: CoinflipStateManager,
    choice: TCoinflipSessionClientGameData
  ) {
    this.UnregisterChoiceListener(manager);
    manager.SessionManager.AddLog({ playerChoice: choice });
    manager.ChangeState(CoinflipSessionGameState.FLIP);
  }
  
  private HandleStateTimeout(manager: CoinflipStateManager): void {
    this.UnregisterChoiceListener(manager);
    manager.ChangeState(CoinflipSessionGameState.TIMEOUT);
  }
  
  private UnregisterChoiceListener(manager: CoinflipStateManager): void {
    if (this.listenerIndex) {
      manager.SessionManager.GameChoiceEvent.UnRegisterEventListener(this.listenerIndex);
    }
    clearTimeout(this.Timeout);
  }
  
}
