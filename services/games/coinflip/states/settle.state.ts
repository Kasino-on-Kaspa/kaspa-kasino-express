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
    let lastLog = manager.SessionManager.LastLog!;
    let result = lastLog.result;
    let playerChoice = lastLog.playerChoice;

    if (result != playerChoice) {
      manager.SessionManager.UpdateLastLog({ nextSelection: "DEFEATED" });
      manager.SessionManager.Payout = -manager.SessionManager.ClientBetData!.bet;
      await manager.SessionManager.AddLastLogToDB();
      manager.ChangeState(CoinflipSessionGameState.END);
      return;
    }
    let level = manager.SessionManager.Level;
    if (level >= manager.SessionManager.MAX_LEVEL) {
      manager.SessionManager.UpdateLastLog({ nextSelection: "CASHOUT" });
      await manager.SessionManager.AddLastLogToDB();
      manager.ChangeState(CoinflipSessionGameState.CASHOUT);
      return;
    }
    
    manager.ChangeState(CoinflipSessionGameState.NEXT_CHOICE);
    return;
  }

  public ExitState(manager: CoinflipStateManager): void {}
}
