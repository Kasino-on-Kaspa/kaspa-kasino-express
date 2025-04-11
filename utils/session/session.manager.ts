import { Socket } from "socket.io";
import { ObservableEvent } from "../observables/event";
import { SessionStateManager } from "./state.manager";
import crypto from "crypto";
import { Account } from "@utils/account";

export type TBetClientData = {
  clientSeed: string;
  bet: bigint;
  multiplier: number;
};

export abstract class SessionManager<TGameClientData,TGameResult,TStateManager extends SessionStateManager<any,any> = SessionStateManager<any,any>>{

  public StateManager?: TStateManager;

  public ServerSeed: string;
  public ServerSeedHash: string;
  
  private _sessionId?: string;
  public ClientBetData?: TBetClientData;
  public ClientGameData?: TGameClientData;
  public Payout: bigint = BigInt(0);
  //#region Session Events
  public SessionStopEvent: ObservableEvent<void>;
  public SessionStartEvent: ObservableEvent<void>;
  public SessionCompleteEvent: ObservableEvent<{account: Account,payout: bigint,bet: bigint,result:"WIN" | "LOSE" | "DRAW"}>;
  public OnStateTimeoutEvent: ObservableEvent<void>;
  public SessionResultEvent: ObservableEvent<TGameResult>;
  //#endregion
  
  

  constructor(sessionId?: string, serverSeed?: string) {
    this._sessionId = sessionId;
    this.ServerSeed = serverSeed ?? this.GenerateServerSeed();
    this.ServerSeedHash = this.GenerateServerSeedHashFromSeed(this.ServerSeed);

    this.SessionStopEvent = new ObservableEvent<void>();
    this.SessionStartEvent = new ObservableEvent<void>(); 
    this.SessionCompleteEvent = new ObservableEvent();
    this.OnStateTimeoutEvent = new ObservableEvent<void>();
    this.SessionResultEvent = new ObservableEvent<TGameResult>();
  } 
  
  public SetClientBetData(betData: TBetClientData, gameData: TGameClientData): void {
    this.ClientBetData = betData;
    this.ClientGameData = gameData;
  }

  public GetSessionRoomId(){
    return `session_${this.SessionId}`;
  }



  public abstract ToData() : {[key:string]:any};
  //#endregion
  
  //#region Session ID
  public set SessionId(sessionId: string) {
    this._sessionId = sessionId;
  }
  public get SessionId(): string | undefined {
    return this._sessionId;
  }
  //#endregion

  //#region Server Seed
  public GenerateServerSeed() {
    return crypto.randomBytes(32).toString("hex");
  }

  public GenerateServerSeedHashFromSeed(seed: string) {
    return crypto.createHash("sha256").update(seed).digest("hex");
  }
  //#endregion

  

  //#region State Manager
  public GetStateManager() {
    return this.StateManager;
  }
  public SetStateManager(stateManager: TStateManager) {
    this.StateManager = stateManager;
  }
  //#endregion


}
