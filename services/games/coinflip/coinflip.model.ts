import { DB } from "@/database";
import {
  CoinflipSession,
  TCoinflipSessionLog,
} from "./entities/coinflip.session";
import { desc, eq, or } from "drizzle-orm";
import { coinflip } from "@schema/games/coinflip.schema";
import { and } from "drizzle-orm";
import { sessionsTable } from "@schema/session.schema";

export class CoinflipModel {
  private sessions: Record<string, CoinflipSession> = {};

  public GetSession(accountId: string): CoinflipSession | undefined {
    return this.sessions[accountId];
  }

  public SetSession(accountId: string, session: CoinflipSession) {
    this.sessions[accountId] = session;
  }

  public RemoveSession(accountId: string) {
    delete this.sessions[accountId];
  }

  public async GetPendingSession(accountId: string) {
    
    let pendingSession = await DB.transaction(
      async (tx) => {
        let session = await tx
          .select()
          .from(sessionsTable)
          .where(eq(sessionsTable.user, accountId))
          .orderBy(desc(sessionsTable.createdAt))
          .limit(1);
          if (!session[0]) {
            return undefined;
          }
          
          let pendingBet = await tx
          .select()
          .from(coinflip)
          .where(eq(coinflip.sessionId, session[0].id))
          .limit(1)
          .orderBy(desc(coinflip.createdAt));
          
          if (pendingBet.length == 0) {
            return session[0];
          }

        if (pendingBet[0].next == "CONTINUE") {
          return session[0];
        }
        
        return undefined;
      }
    );
    return pendingSession;
  }

  public async GetSessionLogsFromDB(sessionId: string) {
    let sessionLogs = await DB.select({
      playerChoice: coinflip.playerChoice,
      result: coinflip.result,
      level: coinflip.level,
      multiplier: coinflip.multiplier,
      client_won: coinflip.client_won,
      next: coinflip.next,
    })
      .from(coinflip)
      .where(eq(coinflip.sessionId, sessionId))
      .orderBy(desc(coinflip.createdAt));

    return sessionLogs;
  }

  public async GetSessionDataFromDB(sessionId: string) {
    let sessionData = await DB.select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, sessionId))
      .limit(1);
    return sessionData[0];
  }
}
