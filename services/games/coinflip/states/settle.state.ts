import { SessionBaseState } from "@utils/session/base.state";
import { CoinflipStateManager } from "../entities/state.manager";
import { CoinflipSessionGameState } from ".";
import { CoinflipSession } from "../entities/coinflip.session";
import { DB } from "@/database";
import { coinflip } from "@schema/games/coinflip.schema";

export class CoinflipSettleState extends SessionBaseState<CoinflipStateManager> {
  protected _stateName: string = CoinflipSessionGameState.SETTLE;

  public EnterState(manager: CoinflipStateManager): void {
    this.HandleSettle(manager);
  }

  public async HandleSettle(manager: CoinflipStateManager) {
    console.log("Settle state", {
      result: manager.SessionManager.CurrentResult,
      choice: manager.SessionManager.CurrentChoice,
      isWon: manager.SessionManager.CurrentResult == manager.SessionManager.CurrentChoice,
    });
    
    if (manager.SessionManager.CurrentResult == manager.SessionManager.CurrentChoice) {
      manager.SessionManager.SetCurrentNext("CONTINUE");
    }
    else {
      manager.SessionManager.Payout = -manager.SessionManager.ClientBetData!.bet;
      manager.SessionManager.SetCurrentNext("SETTLED");
    }

    manager.ChangeState(CoinflipSessionGameState.NEXT);
  }

  public ExitState(manager: CoinflipStateManager): void {}
}
