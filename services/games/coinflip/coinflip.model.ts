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
    [socket_id: string]: { serverSeed: string; serverSeedHash: string };
  } = {};

  public AddNewSocketServerSeed(
    socket_id: string,
    serverSeed: string,
    serverSeedHash: string
  ) {
    return (this.coinFlipSessionSeedStore[socket_id] = {
      serverSeed,
      serverSeedHash,
    });
  }
  
  public GetSession(session_id: string) {
    return this.coinFlipSessionStore.GetSession(session_id);
  }

  public async AddSession(
    socket_id: string,
    clientSeed: string,
    amount: bigint,
    account: Account,
    multiplier: number
  ) {
    let { serverSeed, serverSeedHash } =
      this.coinFlipSessionSeedStore[socket_id];

    let data = await DB.insert(sessionsTable)
      .values({
        serverSeed,
        serverSeedHash,
        clientSeed,
        user: account.Id,
        amount: amount,
        gameType: "COINFLIP",
      })
      .returning();

    let session_id = data[0].id;

    let context = new CoinFlipSessionContext(
      session_id,
      serverSeed,
      serverSeedHash,
      clientSeed,
      amount,
      multiplier,
      account
    );

    let session = new BetSessionStateMachine(this.stateFactory, context);

    session.AddOnStateMachineIdle((server_id: string) =>
      this.OnSessionCompleteCleaner(server_id)
    );

    this.coinFlipSessionStore.AddSession(session_id, session);

    return { session_id };
  }
  OnSessionCompleteCleaner(server_id: string) {
    throw new Error("Method not implemented.");
  }
}
