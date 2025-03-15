import { eq } from "drizzle-orm";
import { AccountStoreInstance } from "../../..";
import { DB } from "../../../database";
import { coinflip } from "../../../schema/games/coinflip.schema";
import { sessionsTable } from "../../../schema/session.schema";
import { Account } from "../../../utils/account";
import { SessionStore } from "../../../utils/session/session-store";
import { BetSessionStateMachine } from "../../../utils/session/state-machine";
import { CoinFlipSessionContext } from "./entities/coinflip.context";
import { CoinFlipSessionStateFactory } from "./entities/coinflip.factory";

export class CoinFlipModel {
  private coinFlipSessionStore = new SessionStore<CoinFlipSessionContext>();

  private stateFactory = new CoinFlipSessionStateFactory();

  private coinFlipSessionSeedStore: {
    [account_id: string]: { serverSeed: string; serverSeedHash: string };
  } = {};

  public async AddNewSocketServerSeed(
    account_id: string,
    serverSeed: string,
    serverSeedHash: string
  ) {
    return (this.coinFlipSessionSeedStore[account_id] = {
      serverSeed,
      serverSeedHash,
    });
  }

  public async GetPendingPreviousSession(account_id: string) {
    let data = await DB.select({
      id: coinflip.id,
      session: sessionsTable,
      result: coinflip.result,
      level: coinflip.level,
      client_won: coinflip.client_won,
      multiplier: coinflip.multiplier,
      account: sessionsTable.user,
      status: coinflip.status,
    })
      .from(coinflip)
      .orderBy(coinflip.createdAt)
      .innerJoin(sessionsTable, eq(sessionsTable.id, coinflip.sessionId))
      .where(eq(sessionsTable.id, account_id));

    let latestData = data[0].status == "PENDING" ? data[0] : undefined;

    if (latestData)
      this.AddSession(
        latestData.account,
        latestData.session.clientSeed,
        latestData.session.amount,
        latestData.multiplier,
        { resultFlip: latestData.result, isWon: latestData.client_won }
      );

    return { result: data, latest: latestData };
  }

  public GetSession(session_id: string) {
    return this.coinFlipSessionStore.GetSession(session_id);
  }

  public async AddSession(
    account_id: string,
    clientSeed: string,
    amount: bigint,
    multiplier: number,
    result?: { resultFlip: "HEADS" | "TAILS"; isWon: boolean },
    session_id?: string
  ) {
    let { serverSeed, serverSeedHash } =
      this.coinFlipSessionSeedStore[account_id];

    if (!session_id) {
      let data = await DB.insert(sessionsTable)
        .values({
          serverSeed,
          serverSeedHash,
          clientSeed,
          user: account_id,
          amount: amount,
          gameType: "COINFLIP",
        })
        .returning();

      session_id = data[0].id;
    }

    let previousSessions = this.coinFlipSessionStore.GetSession(session_id);

    if (previousSessions) {
      return { session_id };
    }

    let account = AccountStoreInstance.GetUserFromAccountID(account_id);

    let context = new CoinFlipSessionContext(
      session_id,
      serverSeed,
      serverSeedHash,
      clientSeed,
      amount,
      multiplier,
      account,
      result
    );

    let session = new BetSessionStateMachine(this.stateFactory, context);

    session.AddOnCompleteListener((session_id: string) =>
      this.OnSessionCompleteCleaner(session_id)
    );

    this.coinFlipSessionStore.AddSession(session_id, session);

    return { session_id };
  }

  public OnSessionAccountDisconnected(session_id: string) {
    this.coinFlipSessionStore.RemoveSession(session_id);
  }

  public OnSessionCompleteCleaner(session_id: string) {
    this.coinFlipSessionStore.RemoveSession(session_id);
  }
}
