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
      manager.SessionManager.OnStateTimeoutEvent.Raise();
    }, 1000);
  }
  
  public HandleChoiceSelected(
    manager: CoinflipStateManager,
    choice: TCoinflipSessionClientGameData
  ) {
    manager.SessionManager.AddLog({ playerChoice: choice });
    manager.ChangeState(CoinflipSessionGameState.FLIP);
  }

  public ExitState(manager: CoinflipStateManager): void {
    if (!this.listenerIndex) return;

    manager.SessionManager.GameChoiceEvent.UnRegisterEventListener(
      this.listenerIndex
    );
    
  }
}
