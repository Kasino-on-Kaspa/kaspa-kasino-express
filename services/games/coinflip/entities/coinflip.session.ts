import { Account } from "@utils/account";
import { SessionManager } from "@utils/session/session.manager";
import { CoinflipStateManager } from "./state.manager";
import {
  coinflip,
} from "@schema/games/coinflip.schema";
import { ObservableEvent } from "@utils/observables/event";
import { DB } from "@/database";
export type TCoinflipPlayerChoice = "HEADS" | "TAILS" | "CASHOUT";

export type TCoinflipSessionClientGameData = "HEADS" | "TAILS" | "CASHOUT";

export type TCoinflipSessionGameResult = "HEADS" | "TAILS";

export type TCoinflipSessionLog = {
  playerChoice: TCoinflipPlayerChoice;
  result: TCoinflipSessionGameResult;
  level: number;
  client_won: boolean;
  next: "CONTINUE" | "SETTLED";
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
  
  private _currentChoice?: TCoinflipSessionClientGameData;
  private _currentNext?: "CONTINUE" | "SETTLED";
  private _currentResult?: TCoinflipSessionGameResult;
  private _currentClientIsWon?: boolean;

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
    this.MAX_LEVEL = maxLevel;
  }

  public get Level(): number {
    return this._level;
  }

  public get CurrentChoice() {
    return this._currentChoice;
  }

  public get CurrentNext() {
    return this._currentNext;
  }

  public get CurrentResult() {
    return this._currentResult;
  }

  public get CurrentClientIsWon() {
    return this._currentClientIsWon;
  }

  public IncrementLevel() {
    this._level++;
  }

  public ResetCurrentChoices() {
    this._currentChoice = undefined;
    this._currentNext = undefined;
    this._currentResult = undefined;
  }

  public SetCurrentChoice(choice: TCoinflipSessionClientGameData) {
    if (this._currentChoice) return;
    this._currentChoice = choice;
  }
  
  public SetCurrentResult(result: TCoinflipSessionGameResult) {
    if (this._currentResult) return;
    this._currentResult = result;
  }
  public SetCurrentNext(next: "CONTINUE" | "SETTLED") {
    if (this._currentNext) return;
    this._currentNext = next;
  }
  public SetCurrentClientIsWon(isWon: boolean) {
    this._currentClientIsWon = isWon;
  }
  

  public get LastLog(): TCoinflipSessionLog|undefined {
    if (this.TCoinflipSessionLog.length < 0) 
      return undefined
    
    return this.TCoinflipSessionLog[this.TCoinflipSessionLog.length - 1];
  }

  public async AddLog(log: TCoinflipSessionLog): Promise<boolean> {
    let success = await this.AddLogToDB(log);
    
    if (!success) {
      return false;
    }

    this.TCoinflipSessionLog.push(log);
    return true;
  }

  private async AddLogToDB(log: TCoinflipSessionLog): Promise<boolean> {
    if (!this.SessionId) {
      return false;
    }
    
    await DB.insert(coinflip)
      .values({
        sessionId: this.SessionId,
        playerChoice: log.playerChoice,
        level: this.Level,
        result: log.result,
        multiplier: this.ClientBetData!.multiplier,
        client_won: log.client_won,
        next: log.next,
      })
      .execute();

    return true;
  }

  private GetNextStatus(result: TCoinflipSessionGameResult, playerChoice: TCoinflipPlayerChoice) {
    if (playerChoice == "CASHOUT") {
      return "CASHOUT";
    }

    if (result == playerChoice) {
      return "CONTINUE";
    }

    return "DEFEATED";
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
