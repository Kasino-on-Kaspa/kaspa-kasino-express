import { and, desc, eq, or } from "drizzle-orm";
import { DB } from "../../../database";
import { coinflip } from "../../../schema/games/coinflip.schema";
import { sessionsTable } from "../../../schema/session.schema";
import { SessionManager } from "../../../utils/session/session.manager";
import { CoinflipSessionContext } from "./entities/coinflip.context";

interface ISocketSessionStore {
  [socket_id: string]: SessionManager<CoinflipSessionContext>;
}
interface ISocketSessionSeedStore {
  [socket_id: string]: { serverSeed: string; serverSeedHash: string };
}
interface ISocketAccountSessionStore {
  [account_id: string]: string;
}

type GetPreviousSessionParams = {
  seed: {
    serverSeedHash: string;
    sessionId: string;
  };
  session: {
    id: string;
    sSeed: string;
    sSeedHash: string;
    cSeed: string;
    bet: bigint;
    multiplier: number;
    level: number;
    next?: "CONTINUE" | "PENDING" | "CASHOUT" | "DEFEATED";
  };
};

export class CoinflipModel {
  public readonly coinflipSessionStore: ISocketSessionStore = {};
  public readonly coinflipSessionSeedStore: ISocketSessionSeedStore = {};
  public readonly accountSessionStore: ISocketAccountSessionStore = {};

  public async GetPreviousSession(
    account_id: string
  ): Promise<GetPreviousSessionParams | undefined> {
    let memory_session = this.GetMemorySessionFromAccountId(account_id);

    if (memory_session) {
      return memory_session;
    }

    let stored_session = await this.GetPendingSessionFromDB(account_id);

    if (stored_session.length > 0) {
      return {
        seed: {
          serverSeedHash: stored_session[0].sessions.serverSeedHash,
          sessionId: stored_session[0].sessions.id,
        },
        session: {
          id: stored_session[0].sessions.id,
          sSeed: stored_session[0].sessions.serverSeed,
          sSeedHash: stored_session[0].sessions.serverSeedHash,
          cSeed: stored_session[0].sessions.clientSeed,
          bet: stored_session[0].sessions.amount,
          multiplier: stored_session[0].coinflip_results.multiplier,
          level: stored_session[0].coinflip_results.level,
          next: stored_session[0].coinflip_results.next,
        },
      };
    }

    return;
  }

  public async InsertSession(
    serverSeed: string,
    serverSeedHash: string,
    client_seed: string,
    amount: bigint,
    account_id: string,
   
  ) {
    return await DB.insert(sessionsTable).values({
      
      serverSeed: serverSeed,
      serverSeedHash: serverSeedHash,
      clientSeed: client_seed,
      amount: amount,
      user: account_id,
      gameType: "COINFLIP",
    }).returning();
  }

  
  private async GetPendingSessionFromDB(account_id: string) {
    return await DB.select()
      .from(coinflip)
      .innerJoin(sessionsTable, eq(coinflip.sessionId, sessionsTable.id))
      .where(
        and(
          eq(sessionsTable.user, account_id),
          or(eq(coinflip.next, "PENDING"), eq(coinflip.next, "CONTINUE"))
        )
      )
      .orderBy(desc(coinflip.createdAt))
      .limit(1);
  }

  private GetMemorySessionFromAccountId(
    account_id: string
  ): GetPreviousSessionParams | undefined {
    let session_id = this.accountSessionStore[account_id];

    if (!session_id) {
      return;
    }

    let session = this.coinflipSessionStore[session_id];

    if (!session) {
      return;
    }

    return {
      seed: {
        serverSeedHash: session.SessionContext.ServerSeedHash,
        sessionId: session.SessionContext.SessionId,
      },
      session: {
        id: session.SessionContext.SessionId,
        sSeed: session.SessionContext.ServerSeed,
        sSeedHash: session.SessionContext.ServerSeedHash,
        cSeed: session.SessionContext.ClientSeed,
        bet: session.SessionContext.BetAmount,
        multiplier: session.SessionContext.Multiplier,
        level: session.SessionContext.Level
    },
    };
  }
  

}
