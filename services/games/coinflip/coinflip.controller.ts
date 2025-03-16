import { Socket, DefaultEventsMap } from "socket.io";
import { CoinflipModel } from "./coinflip.model";
import crypto from "node:crypto";
import { AccountStoreInstance } from "../../..";
import { AckFunction, BaseBetType } from "../types";
import { CoinflipSessionContext } from "./entities/coinflip.context";
import { SessionManager } from "../../../utils/session/session.manager";
import { CoinFlipFactory } from "./entities/coinflip.factory";
import { Account } from "../../../utils/account";
import { z } from "zod";
import { BetSessionBaseState } from "../../../utils/session/base.state";

export class CoinflipController {
  private model: CoinflipModel = new CoinflipModel();
  private factory = new CoinFlipFactory();

  //#region Coinflip Event Handlers
  public async NewSessionSeeds(
    socket: Socket,
    callback: (serverSeedHash: string, sessionId?: string) => void
  ) {
    let account = AccountStoreInstance.GetUserFromHandshake(socket.id);
    let session = await this.model.GetPreviousSession(account.Id);

    if (!session) {
      const seeds = this.GenerateServerSeed();
      this.model.coinflipSessionSeedStore[account.Id] = seeds;

      return callback(seeds.serverSeedHash);
    }

    let { seed, session: SessionDetails } = session;

    let sessionContext = this.CreateSessionContext({
      ...SessionDetails,
      account,
    });

    let state: BetSessionBaseState | undefined;

    if (SessionDetails.next === "CONTINUE") {
      state = this.factory.GameSettleState();
    } else if (SessionDetails.next === "PENDING") {
      state = this.factory.BetSettleState();
    }

    let sessionManager = await this.CreateSessionManager(sessionContext, state);

    if (this.model.coinflipSessionStore[session.session.id])
      return callback(seed.serverSeedHash, seed.sessionId);

    this.model.coinflipSessionStore[session.session.id] = sessionManager;
    this.model.accountSessionStore[account.Id] =
      sessionManager.SessionContext.SessionId;

    return callback(seed.serverSeedHash, seed.sessionId);
  }

  public async HandleNewBet(
    socket: Socket,
    bet_data: z.infer<typeof BaseBetType>,
    ack: AckFunction,
    onSessionStateChange: (socket: Socket, newState: TSessionState) => void,
    onSessionFullfilled: (
      socket: Socket,
      server_seed: string,
      client_seed: string
    ) => void,
    onSessionGameResult: (
      socket: Socket,
      result: "HEADS" | "TAILS",
      client_won: boolean
    ) => void
  ) {
    let account = AccountStoreInstance.GetUserFromHandshake(socket.id);

    let parsedBet = this.ParseBet(bet_data);

    if (!parsedBet.success) {
      return ack(parsedBet);
    }

    let seeds = this.model.coinflipSessionSeedStore[socket.id];

    if (!seeds) {
      return ack({ success: false, error: "No session seeds found" });
    }
    let insertedSession = await this.model.InsertSession(
      seeds.serverSeed,
      seeds.serverSeedHash,
      parsedBet.data.client_seed,
      parsedBet.data.amount,
      account.Id
    );

    let sessionContext = this.CreateSessionContext({
      account: account,
      id: insertedSession[0].id,
      sSeed: insertedSession[0].serverSeed,
      sSeedHash: insertedSession[0].serverSeedHash,
      cSeed: insertedSession[0].clientSeed,
      bet: insertedSession[0].amount,
      multiplier: 0,
      level: 0,
    });

    let sessionManager = await this.CreateSessionManager(sessionContext);

    this.model.coinflipSessionStore[insertedSession[0].id] = sessionManager;
    this.model.accountSessionStore[account.Id] = insertedSession[0].id;

    this.HandleSessionManagerListeners(sessionManager, socket, account, onSessionStateChange, onSessionFullfilled, onSessionGameResult);

    return ack({ success: true });
  }

  public async HandleBetContinuation(
    socket: Socket,
    session_id: string,
    ack: AckFunction,
    onSessionStateChange: (socket: Socket, newState: TSessionState) => void,
    onSessionFullfilled: (
      socket: Socket,
      server_seed: string,
      client_seed: string
    ) => void,
    onSessionGameResult: (
      socket: Socket,
      result: "HEADS" | "TAILS",
      client_won: boolean
    ) => void
  ) {
    let session = this.model.coinflipSessionStore[session_id];
    let account = AccountStoreInstance.GetUserFromHandshake(socket.id);

    if (!session) {
      return ack({ success: false, error: "Session not found" });
    }

    let sessionManager = session;

    this.HandleSessionManagerListeners(
      sessionManager,
      socket,
      account,
      onSessionStateChange,
      onSessionFullfilled,
      onSessionGameResult
    );

    sessionManager.Start();

    return ack({ success: true });
  }

  //#region Internal Event Handlers
  private HandleSessionManagerListeners(
    sessionManager: SessionManager<CoinflipSessionContext>,
    socket: Socket,
    account: Account,
    onSessionStateChange: (socket: Socket, newState: TSessionState) => void,
    onSessionFullfilled: (
      socket: Socket,
      server_seed: string,
      client_seed: string
    ) => void,
    onSessionGameResult: (
      socket: Socket,
      result: "HEADS" | "TAILS",
      client_won: boolean
    ) => void
  ) {

    let stateChangeListenerIndex =
      sessionManager.OnStateChangeEvent.RegisterEventListener(
        async (newState) => {
          onSessionStateChange(socket, newState);
        }
      );

    let sessionGameResultListenerIndex =
      sessionManager.SessionContext.GameResultEvent.RegisterEventListener(
        async (result) => {
          onSessionGameResult(socket, result.result, result.client_won);
        }
      );

    let sessionFullfilledListenerIndex =
      sessionManager.SessionContext.GameFlipChoiceEvent.RegisterEventListener(
        async (choice) => {
          onSessionFullfilled(
            socket,
            sessionManager.SessionContext.ServerSeed,
            sessionManager.SessionContext.ClientSeed
          );
        }
      );

    account.AssociatedSockets.OnAllSocketsDisconnect.RegisterEventListener(
      async () => {
        this.HandleAccountDisconnect(sessionManager.SessionContext.SessionId, account.Id);
      }
    );

    sessionManager.OnSessionComplete.RegisterEventListener(
      async (sessionId) => {
        sessionManager.OnStateChangeEvent.UnRegisterEventListener(
          stateChangeListenerIndex
        );
        sessionManager.SessionContext.GameResultEvent.UnRegisterEventListener(
          sessionGameResultListenerIndex
        );
        sessionManager.SessionContext.GameFlipChoiceEvent.UnRegisterEventListener(
          sessionFullfilledListenerIndex
        );
        delete this.model.coinflipSessionStore[sessionId];
        delete this.model.accountSessionStore[account.Id];
        delete this.model.coinflipSessionSeedStore[socket.id];
      }
    );
  }

  private HandleAccountDisconnect(session_id: string, account_id: string) {
    let session = this.model.coinflipSessionStore[session_id];
    if (!session) return;

    session.OnAssociatedAccountDisconnect.Raise();
    delete this.model.coinflipSessionStore[session_id];
    delete this.model.accountSessionStore[account_id];
    delete this.model.coinflipSessionSeedStore[account_id];
  }

  public HandleChoice(
    socket: Socket,
    session_id: string,
    choice: "HEADS" | "TAILS",
    ack: AckFunction
  ) {
    let account = AccountStoreInstance.GetUserFromHandshake(socket.id);

    let session = this.model.coinflipSessionStore[session_id];

    if (!session) {
      return ack({ success: false, error: "Session not found" });
    }
    session.SessionContext.GameFlipChoiceEvent.Raise(choice);
    return ack({ success: true });
  }

  public HandleNext(
    socket: Socket,
    session_id: string,
    option: "CASHOUT" | "CONTINUE",
    ack: AckFunction
  ) {
    let session = this.model.coinflipSessionStore[session_id];

    if (!session) {
      return ack({ success: false, error: "Session not found" });
    }

    session.SessionContext.GameNextChoiceEvent.Raise(option);

    return ack({ success: true });
  }

  //#endregion

  //#region Private Methods
  private CreateSessionContext(SessionDetails: {
    id: string;
    sSeed: string;
    sSeedHash: string;
    cSeed: string;
    bet: bigint;
    multiplier: number;
    level: number;
    account: Account;
  }) {
    return new CoinflipSessionContext(
      SessionDetails.id,
      SessionDetails.sSeed,
      SessionDetails.sSeedHash,
      SessionDetails.cSeed,
      SessionDetails.bet,
      SessionDetails.multiplier,
      SessionDetails.account,
      SessionDetails.level
    );
  }

  private ParseBet(
    bet_data: z.infer<typeof BaseBetType>
  ):
    | { success: false; error: string }
    | { success: true; data: z.infer<typeof BaseBetType> } {
    let data = BaseBetType.safeParse(bet_data);

    if (!data.success) {
      return {
        success: false,
        error: "Unable to parse bet data",
      };
    }

    let { amount } = data.data;

    if (amount < 0n) {
      return {
        success: false,
        error: "Bet amount must be positive number",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  }

  private async CreateSessionManager(
    session: CoinflipSessionContext,
    state?: BetSessionBaseState
  ) {
    let sessionManager = new SessionManager(this.factory, session, state);
    return sessionManager;
  }

  private GenerateServerSeed() {
    const sSeed = crypto.randomBytes(32).toString("hex");
    const seedHashRaw = crypto.createHash("sha256").update(sSeed);
    const sSeedHash = seedHashRaw.digest("hex");

    return {
      serverSeed: sSeed,
      serverSeedHash: sSeedHash,
    };
  }
  //#endregion
}
