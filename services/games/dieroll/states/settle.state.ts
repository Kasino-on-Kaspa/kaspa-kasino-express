import { SessionBaseState } from "@utils/session/base.state";
import { DieRollGameState ,TDieRollGameState} from ".";
import { DierollStateManager } from "../entities/state.manager";
import { DB } from "@/database";
import { dieroll } from "@schema/games/dieroll.schema";
import { EventBus } from "@utils/eventbus";

export class DieRollSettleState extends SessionBaseState<DierollStateManager> {
  protected _stateName: TDieRollGameState = DieRollGameState.SETTLE;

  public EnterState(manager: DierollStateManager): void {
    this.HandleSettle(manager);
  }
  
  public async HandleSettle(manager: DierollStateManager): Promise<void> {
    let isWon = manager.SessionManager.GetResultIsWon();
    
    
    await DB.insert(dieroll).values({
      sessionId: manager.SessionManager.SessionId!,
      condition: manager.SessionManager.ClientGameData!.condition,
      target: manager.SessionManager.ClientGameData!.target,
      multiplier: manager.SessionManager.ClientBetData!.multiplier,
      result: manager.SessionManager.GetResult()!,
      status: manager.SessionManager.GetResultIsWon()!,
    }).execute();
    
    let payout:bigint;
    
    if (isWon == "WON") {
      payout = BigInt(Math.floor(Number(manager.SessionManager.ClientBetData!.bet) * (manager.SessionManager.ClientBetData!.multiplier / (100 * 100))));
    }
    
    else if (isWon == "DRAW") {
      payout = manager.SessionManager.ClientBetData!.bet;
    }
    else {
      payout = -manager.SessionManager.ClientBetData!.bet;
    }

    manager.SessionManager.Payout = payout;
    
    EventBus.Instance.emit("wallet:update", {id: manager.SessionManager.AssociatedAccount.Wallet.id, delta: payout, reason: "BET_RETURN"});
    
    manager.ChangeState(DieRollGameState.END);
  }

  public ExitState(manager: DierollStateManager): void {
  }
  
}   