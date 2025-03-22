import { DB } from "@/database";
import {
  CoinflipSession,
  TCoinflipSessionLog,
} from "./entities/coinflip.session";
import { desc, eq } from "drizzle-orm";
import { coinflip } from "@schema/games/coinflip.schema";
import { and } from "drizzle-orm";
import { sessionsTable } from "@schema/session.schema";

export class CoinflipModel {
  private sessions: Record<string, CoinflipSession> = {};

  public GetSession(sessionId: string): CoinflipSession | undefined {
    return this.sessions[sessionId];
  }

  public SetSession(sessionId: string, session: CoinflipSession) {
    this.sessions[sessionId] = session;
  }

  public RemoveSession(sessionId: string) {
    delete this.sessions[sessionId];
  }

  public async GetPendingSession(accountId: string) {
    let pendingBet = await DB.select()
      .from(coinflip)
      .where(
        and(eq(coinflip.sessionId, accountId), eq(coinflip.next, "PENDING"))
      )
      .limit(1)
      .orderBy(desc(coinflip.createdAt));
    return pendingBet[0];
  }

  public async GetSessionLogs(sessionId: string) {
    let sessionLogs = await DB.select({
      playerChoice: coinflip.playerChoice,
      result: coinflip.result,
      nextSelection: coinflip.next,
    })
      .from(coinflip)
      .where(eq(coinflip.sessionId, sessionId))
      .orderBy(desc(coinflip.createdAt));

    return sessionLogs;
  }

  public async GetSessionData(sessionId: string) {
    let sessionData = await DB.select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, sessionId))
      .limit(1);
    return sessionData[0];
  }
}
