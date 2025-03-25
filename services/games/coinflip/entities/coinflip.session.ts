import { Account } from "@utils/account";
import { SessionManager } from "@utils/session/session.manager";
import { CoinflipStateManager } from "./state.manager";
import {
  coinflip,
  E_COINFLIP_NEXT_STATUS,
} from "@schema/games/coinflip.schema";
import { ObservableEvent } from "@utils/observables/event";
import { DB } from "@/database";
export type TCoinflipSessionClientGameData = "HEADS" | "TAILS";

export type TCoinflipSessionGameResult = "HEADS" | "TAILS";

export type TCoinflipSessionLog = {
  playerChoice: TCoinflipSessionClientGameData;
  result?: TCoinflipSessionGameResult;
  nextSelection?: (typeof E_COINFLIP_NEXT_STATUS.enumValues)[number];
};

export type TCoinflipSessionJSON = {
  sessionId: string;
  serverSeedHash: string;
  clientGameData: TCoinflipSessionClientGameData;
  logs: TCoinflipSessionLog[];
  level: number;
  maxLevel: number;
};

export class CoinflipSession extends SessionManager<
  void,
  TCoinflipSessionClientGameData,
  CoinflipStateManager
> {
  public readonly AssociatedAccount: Account;
  public readonly TCoinflipSessionLog: TCoinflipSessionLog[] = [];

  public readonly GameChoiceEvent: ObservableEvent<TCoinflipSessionClientGameData>;
  public readonly GameNextSelectionEvent: ObservableEvent<
    "CASHOUT" | "CONTINUE"
  >;
  private _level: number;
  public readonly MAX_LEVEL: number;

  constructor(
    associatedAccount: Account,
    logs: TCoinflipSessionLog[] = [],
    level: number = 1,
    maxLevel: number = 10
  ) {
    super();
    this._level = level;
    this.AssociatedAccount = associatedAccount;
    this.TCoinflipSessionLog = logs;
    this.GameChoiceEvent =
      new ObservableEvent<TCoinflipSessionClientGameData>();
    this.GameNextSelectionEvent = new ObservableEvent<"CASHOUT" | "CONTINUE">();
    this.MAX_LEVEL = maxLevel;
  }

  public get Level(): number {
    return this._level;
  }

  public IncrementLevel() {
    this._level++;
  }

  public get LastLog(): TCoinflipSessionLog|undefined {
    if (this.TCoinflipSessionLog.length < 0) 
      return undefined
    
    return this.TCoinflipSessionLog[this.TCoinflipSessionLog.length - 1];
  }

  public AddLog(log: TCoinflipSessionLog): void {
    this.TCoinflipSessionLog.push(log);
  }

  public async AddLastLogToDB(): Promise<boolean> {
    if (!this.SessionId) {
      return false;
    }
    
    let log = this.LastLog;
        
    if (!log){
      return false;
    }
    
    
    if (!log.nextSelection || !log.result) {
      return false;
    }
    
    
    await DB.insert(coinflip)
      .values({
        sessionId: this.SessionId,
        playerChoice: log.playerChoice,
        result: log.result,
        level: this.Level,
        multiplier: this.ClientBetData!.multiplier,
        next: log.nextSelection,
        client_won: log.result == log.playerChoice,
      }).onConflictDoUpdate({
        set:{
          next: log.nextSelection,
        },
        target: [coinflip.id],
      })
      .execute();

    return true;
  }

  public UpdateLastLog({
    result,
    nextSelection,
  }: {
    result?: TCoinflipSessionGameResult;
    nextSelection?: "DEFEATED" | "CONTINUE" | "CASHOUT" | "PENDING";
  }): void {

    let oldLog = this.TCoinflipSessionLog[this.TCoinflipSessionLog.length - 1] 
    
    this.TCoinflipSessionLog[this.TCoinflipSessionLog.length - 1] = {
      playerChoice: oldLog.playerChoice,
      result : result??oldLog.result,
      nextSelection: nextSelection??oldLog.nextSelection,
    };
  }

  public ToData(): TCoinflipSessionJSON {
    return {
      sessionId: this.SessionId!,
      serverSeedHash: this.ServerSeedHash,
      clientGameData: this.ClientGameData!,
      logs: this.TCoinflipSessionLog,
      level: this.Level,
      maxLevel: this.MAX_LEVEL,
    };
  }
}
