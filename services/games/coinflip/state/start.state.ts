import { SessionBaseState } from "@utils/session/base.state";
import { CoinflipStateManager } from "../entities/state.manager";
import { CoinflipSessionGameState } from ".";
import { sessionsTable } from "@schema/session.schema";
import { DB } from "@/database";

export class CoinflipStartState extends SessionBaseState<CoinflipStateManager> {
  protected _stateName: string = CoinflipSessionGameState.START;

  public EnterState(manager: CoinflipStateManager): void {
    this.HandleStart(manager);
  }

  public async HandleStart(manager: CoinflipStateManager): Promise<void> {
    if (
      !manager.SessionManager.ClientGameData ||
      !manager.SessionManager.ClientBetData
    ) {
      throw new Error("Client game data or session id is not set");
    }

    let session = await DB.insert(sessionsTable)
      .values({
        amount: manager.SessionManager.ClientBetData.bet,
        user: manager.SessionManager.AssociatedAccount.Id,
        serverSeed: manager.SessionManager.ServerSeed,
        serverSeedHash: manager.SessionManager.ServerSeedHash,
        clientSeed: manager.SessionManager.ClientBetData.clientSeed,
        gameType: "COINFLIP",
      })
      .returning();

    manager.SessionManager.SessionId = session[0].id;
    let roomId = manager.SessionManager.GetSessionRoomId();

    manager.SessionManager.AssociatedAccount.AssociatedSockets.Session.socketsJoin(
      roomId
    );
    await manager.SessionManager.AssociatedAccount.RemoveBalance(
      manager.SessionManager.ClientBetData.bet,
      "BET"
    );

    manager.ChangeState(CoinflipSessionGameState.FLIP_CHOICE);
  }

  public ExitState(manager: CoinflipStateManager): void {}
}
