import { Socket } from "socket.io";
import { ObservableEvent } from "../observables/event";
import { SessionStateManager } from "./state.manager";
import crypto from "crypto";

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
  public GameResult?: TGameResult;
  public GameResultIsWon?: "DRAW" | "WON" | "LOST";

  //#region Session Events
  public SessionStopEvent: ObservableEvent<void>;
  public SessionStartEvent: ObservableEvent<void>;
  public SessionCompleteEvent: ObservableEvent<TGameResult>;
  public OnStateTimeoutEvent: ObservableEvent<void>;
  //#endregion
  
    
  constructor(sessionId?: string, serverSeed?: string) {
    this._sessionId = sessionId;
    this.ServerSeed = serverSeed ?? this.GenerateServerSeed();
    this.ServerSeedHash = this.GenerateServerSeedHashFromSeed(this.ServerSeed);

    this.SessionStopEvent = new ObservableEvent<void>();
    this.SessionStartEvent = new ObservableEvent<void>(); 
    this.SessionCompleteEvent = new ObservableEvent<TGameResult>();
    this.OnStateTimeoutEvent = new ObservableEvent<void>();
  } 
  
  public SetClientBetData(betData: TBetClientData, gameData: TGameClientData): void {
    this.ClientBetData = betData;
    this.ClientGameData = gameData;
  }

  public GetSessionRoomId(){
    return `session_${this.SessionId}`;
  }


  //#region Game Result
  public SetResult(isWon: "DRAW" | "WON" | "LOST", result: TGameResult): void {
    this.GameResultIsWon = isWon;
    this.GameResult = result;
  }

  public GetResult(): TGameResult {
    return this.GameResult!;
  }

  public GetResultIsWon() {
    return this.GameResultIsWon!;
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
