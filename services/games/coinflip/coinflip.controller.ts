import { Socket } from "socket.io";
import { CoinflipModel } from "./coinflip.model";
import {
  CoinflipSession,
  TCoinflipSessionClientGameData,
  TCoinflipSessionJSON,
  TCoinflipSessionLog,
} from "./entities/coinflip.session";
import { CoinflipStateFactory } from "./entities/state.factory";
import { AccountStoreInstance } from "@/index";
import { coinflip as CoinflipSchema } from "@schema/games/coinflip.schema";
import { sessionsTable } from "@schema/session.schema";
import { Account } from "@utils/account";
import { CoinflipSessionGameState } from "./states";
import { BaseBetType } from "../types";
import { CoinFlipServerMessage } from "./coinflip.messages";
import { z } from "zod";
import { CoinflipStateManager } from "./entities/state.manager";

type TPendingSessionData = typeof sessionsTable.$inferSelect;

export type TCoinflipAck =
  | {
      status: "SUCCESS";
      session: TCoinflipSessionJSON;
    }
  | {
      status: "ERROR";
      message: string;
    };

export class CoinflipController {
  private model: CoinflipModel;
  private factory: CoinflipStateFactory;

  constructor() {
    this.model = new CoinflipModel();
    this.factory = new CoinflipStateFactory();
  }

  public async HandleGetSession(
    socket: Socket,
    callback: (
      serverSeedHash: string,
      session?: {data:TCoinflipSessionJSON,resume_state: CoinflipSessionGameState}
    ) => void
  ) {
    let account = AccountStoreInstance.GetUserFromHandshake(socket.id);
    let session = this.model.GetSession(account.Id);
    
    if (session) {
      callback(session.ServerSeedHash, {data:session.ToData(),resume_state: session.StateManager?.CurrentState.StateName as CoinflipSessionGameState});
      return;
    }
    let pendingSession = await this.model.GetPendingSession(account.Id);
    
    if (pendingSession) {
      let promise = Promise.all([
        this.model.GetSessionDataFromDB(pendingSession.id),
        this.model.GetSessionLogsFromDB(pendingSession.id),
      ]);

      let [pendingSessionData, pendingSessionLogs] = await promise;
      

      let {session,resume_state} = this.GenerateSessionFromPendingSessionData(
        pendingSessionData,
        pendingSessionLogs,
        account
      );
      
      session.SessionStartEvent.Raise();
      callback(pendingSessionData.serverSeedHash, {data:session.ToData() , resume_state: resume_state});
      return;
    }

    session = new CoinflipSession(account);
    this.AddSessionListeners(account, session);
    this.model.SetSession(account.Id, session)
    callback(session.ServerSeedHash);
  }

  public async HandleNewBet(
    socket: Socket,
    bet_data: z.infer<typeof BaseBetType>,
    ack: (ack: TCoinflipAck) => void
  ) {
    let account = AccountStoreInstance.GetUserFromHandshake(socket.id);
    let session = this.model.GetSession(account.Id);
    

    if (!session) {
      ack({ status: "ERROR", message: "No session found" });
      return;
    }
    let betAmount = BigInt(bet_data.amount)
    if (betAmount < 0n) {
      ack({ status: "ERROR", message: "Amount must be greater than 0" });
      return;
    }

    if (betAmount > account.Wallet.balance.GetData()) {
      ack({ status: "ERROR", message: "Insufficient balance" });
      return;
    }
    
    if (session.SessionId){
      ack({ status: "ERROR", message: "An active session already exists" });
      return;
    }

    session.SetClientBetData({
      bet: betAmount,
      clientSeed: bet_data.client_seed,
      multiplier: this.GetMultiplier(),
    });

    let stateManager = this.factory.CreateStateManager(
      session,
      CoinflipSessionGameState.START
    );

    session.SetStateManager(stateManager);
    this.AddSessionListeners(account, session);

    this.model.SetSession(account.Id, session);

    session.SessionStartEvent.Raise();
    
    ack({ status: "SUCCESS", session: session.ToData() });
  }

  public async HandleFlip(
    socket: Socket,
    choice: TCoinflipSessionClientGameData,
    ack: (ack: TCoinflipAck) => void
  ) {
    let account = AccountStoreInstance.GetUserFromHandshake(socket.id);
    let session = this.model.GetSession(account.Id);

    if (!session) {
      ack({ status: "ERROR", message: "No session found" });
      return;
    }

    if (
      session.StateManager?.CurrentState.StateName !=
      CoinflipSessionGameState.FLIP_CHOICE
    ) {
      ack({ status: "ERROR", message: "Not in flip choice state" });
      return;
    }

    session.GameChoiceEvent.Raise(choice);
    ack({ status: "SUCCESS", session: session.ToData() });
  }

  public async HandleNextChoice(
    socket: Socket,
    choice: "CASHOUT" | "CONTINUE",
    ack: (ack: TCoinflipAck) => void
  ) {
    let account = AccountStoreInstance.GetUserFromHandshake(socket.id);

    if (!account) {
      ack({ status: "ERROR", message: "No account found" });
      return;
      
    }
    
    let session = this.model.GetSession(account.Id);
    if (!session) {
      ack({ status: "ERROR", message: "No session found" });
      return;
    }

    console.log("SESSION_NEXT", choice);
    
    if (
      session.StateManager?.CurrentState.StateName !=
      CoinflipSessionGameState.NEXT_CHOICE
    ) {
      ack({ status: "ERROR", message: "Not in next choice state" });
      return;
    }

    session.GameNextSelectionEvent.Raise(choice);
    ack({ status: "SUCCESS", session: session.ToData() });
  }

  //#region Private Methods
  private GenerateSessionFromPendingSessionData(
    lastPendingSessionData: TPendingSessionData,
    lastPendingSessionLog: TCoinflipSessionLog[],
    account: Account
  ): {session: CoinflipSession,resume_state: CoinflipSessionGameState} {
    let session = new CoinflipSession(account, lastPendingSessionLog);
    session.SessionId = lastPendingSessionData.id;
    session.ServerSeedHash = lastPendingSessionData.serverSeed;

    session.SetClientBetData({
      bet: lastPendingSessionData.amount,
      clientSeed: lastPendingSessionData.clientSeed,
      multiplier: this.GetMultiplier(),
    });
    
    let manager: CoinflipStateManager;
    let resume_state: CoinflipSessionGameState = !session.LastLog || session.LastLog.nextSelection == "CONTINUE" ? CoinflipSessionGameState.FLIP_CHOICE : CoinflipSessionGameState.NEXT_CHOICE;

    manager = this.factory.CreateStateManager(session, resume_state)
    
    session.SetStateManager(manager);
    
    this.AddSessionListeners(account, session);
    this.model.SetSession(account.Id, session);
    
    return {session,resume_state};
  }

  private AddSessionListeners(account: Account, session: CoinflipSession) {
    session
      .GetStateManager()
      ?.OnStateChangeEvent.RegisterEventListener(async (new_state) => {
        account.AssociatedSockets.Session.emit(
          CoinFlipServerMessage.GAME_CHANGE_STATE,
          { session: session.ToData(), new_state: new_state }
        );
      });
    
    session.OnStateTimeoutEvent.RegisterEventListener(async () => {
      this.model.RemoveSession(account.Id);
      account.AssociatedSockets.Session.emit(
        CoinFlipServerMessage.GAME_TIMEOUT,
        { session: session.ToData() }
      );
    });
    
    session.SessionResultEvent.RegisterEventListener(async (result) => {
      account.AssociatedSockets.Session.emit(
        CoinFlipServerMessage.FLIP_RESULT,
        { session: session.ToData(), result: result }
      );
    });

    session.SessionCompleteEvent.RegisterEventListener(async () => {
      this.model.RemoveSession(account.Id);
      account.AssociatedSockets.Session.emit(CoinFlipServerMessage.GAME_ENDED, {
        serverSeed: session.ServerSeed,
      });
    });
    
  }

  private GetMultiplier(houseEdge: number = 2): number {
    const fairMultiplier = 1 / 0.5;

    const multiplierWithEdge = fairMultiplier * (1 - houseEdge / 100);

    return Math.round(multiplierWithEdge * 10000);
  }
  //#endregion
}
