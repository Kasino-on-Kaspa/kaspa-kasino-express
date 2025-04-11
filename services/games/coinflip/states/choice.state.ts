import { SessionBaseState } from "@utils/session/base.state";
import { CoinflipSessionGameState } from ".";
import { CoinflipStateManager } from "../entities/state.manager";
import {
  TCoinflipPlayerChoice,
} from "../entities/coinflip.session";

export class CoinflipChoiceState extends SessionBaseState<CoinflipStateManager> {
  protected _stateName: string = CoinflipSessionGameState.CHOICE;
  protected listenerIndex?: number;
  private allAccountLogoutListener?: number;

  public EnterState(manager: CoinflipStateManager): void {
    this.listenerIndex =
      manager.SessionManager.GameChoiceEvent.RegisterEventListener(
        async (choice) => {
          this.HandleChoiceSelected(manager, choice);
          return;
        }
      );

    this.allAccountLogoutListener =
      manager.SessionManager.AssociatedAccount.AssociatedSockets.OnAllSocketsDisconnect.RegisterEventListener(
        async () => {
          this.HandleStateTimeout(manager);
        }
      );
  }

  public ExitState(manager: CoinflipStateManager): void {
    this.UnregisterChoiceListener(manager);
  }

  private HandleChoiceSelected(
    manager: CoinflipStateManager,
    choice: TCoinflipPlayerChoice
  ) {
    this.UnregisterChoiceListener(manager);
    manager.SessionManager.SetCurrentChoice(choice);
    if (choice == "CASHOUT") {
      if (!manager.SessionManager.LastLog) return;
      manager.ChangeState(CoinflipSessionGameState.CASHOUT);
    } else {
      manager.ChangeState(CoinflipSessionGameState.SETTLE);
    }
  }

  private HandleStateTimeout(manager: CoinflipStateManager): void {
    this.UnregisterChoiceListener(manager);
    manager.ChangeState(CoinflipSessionGameState.TIMEOUT);
  }

  private UnregisterChoiceListener(manager: CoinflipStateManager): void {
    if (this.listenerIndex) {
      manager.SessionManager.GameChoiceEvent.UnRegisterEventListener(
        this.listenerIndex
      );
    }

    if (this.allAccountLogoutListener) {
      manager.SessionManager.AssociatedAccount.AssociatedSockets.OnAllSocketsDisconnect.UnRegisterEventListener(
        this.allAccountLogoutListener
      );
    }

  }
}
