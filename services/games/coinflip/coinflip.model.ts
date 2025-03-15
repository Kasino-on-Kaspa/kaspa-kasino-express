import { and, eq, or } from "drizzle-orm";
import { DB } from "../../../database";
import { coinflip } from "../../../schema/games/coinflip.schema";
import { SessionManager } from "../../../utils/session/session.manager";
import { sessionsTable } from "../../../schema/session.schema";
import { TCoinflipPreviousGame } from "./coinflip.types";

interface ISocketServerSeedStore {
  [socket_id: string]: { serverSeed: string; serverSeedHash: string };
}
interface ISocketSessionStore {
  [socket_id: string]: SessionManager;
}

export class CoinFlipModel {
  public readonly coinflipSessionSeedStore: ISocketServerSeedStore = {};
  public readonly coinflipSessionStore: ISocketSessionStore = {};

  public async GetSessionFromAccountId(
    accountId: string
  ): Promise<TCoinflipPreviousGame | undefined> {
    if (this.coinflipSessionStore[accountId])
      return {
        serverSeed:
          this.coinflipSessionStore[accountId].SessionContext.ServerSeed,
        sessionId:
          this.coinflipSessionStore[accountId].SessionContext.SessionId,
      };

    let data = await this.FetchSessionFromAccountID(accountId);

    if (data) {
      return {
        serverSeed: data.sessions.serverSeed,
        sessionId: data.sessions.id,
      };
    }

    return;
  }

  private async FetchSessionFromAccountID(accountId: string) {
    let data = await DB.select()
      .from(coinflip)
      .innerJoin(sessionsTable, eq(coinflip.sessionId, sessionsTable.id))
      .where(
        and(
          eq(sessionsTable.user, accountId),
          or(eq(coinflip.status, "PENDING"), eq(coinflip.status, "PROGRESS"))
        )
      );

    return data.length > 0 ? data[0] : undefined;
  }
}
