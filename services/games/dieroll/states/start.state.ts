import { SessionBaseState } from "@utils/session/base.state";
import { DieRollGameState, TDieRollGameState } from "../states";
import { DierollStateManager } from "../entities/state.manager";
import { sessionsTable } from "@schema/session.schema";
import { DB } from "@/database";

export class DieRollStartState extends SessionBaseState<DierollStateManager> {
  protected _stateName: TDieRollGameState = DieRollGameState.START;
  
  public EnterState(manager: DierollStateManager): void {
    this.HandleStart(manager);  
  }

  public async HandleStart(manager: DierollStateManager): Promise<void> {
    if (!manager.SessionManager.ClientGameData || !manager.SessionManager.ClientBetData) {
      throw new Error("Client game data or session id is not set");
    }

    let session = await DB.insert(sessionsTable).values({
      amount: manager.SessionManager.ClientBetData.bet,
      user: manager.SessionManager.AssociatedAccount.Id,
      serverSeed: manager.SessionManager.ServerSeed,
      serverSeedHash: manager.SessionManager.ServerSeedHash,
      clientSeed: manager.SessionManager.ClientBetData.clientSeed,
      gameType: "DICEROLL",
    }).returning();
    
    manager.SessionManager.SessionId = session[0].id;
    let roomId = manager.SessionManager.GetSessionRoomId();

    manager.SessionManager.AssociatedAccount.AssociatedSockets.Session.socketsJoin(roomId);
    await manager.SessionManager.AssociatedAccount.Wallet.RemoveBalance(manager.SessionManager.ClientBetData.bet,"BET");
    
    manager.ChangeState(DieRollGameState.ROLL);
  }

  public ExitState(
    _manager: DierollStateManager
  ): void {
  }
}
