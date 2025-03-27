import { SessionManager, TBetClientData } from "@utils/session/session.manager";
import {  DieRollBetType} from "../dieroll.types";
import { Account } from "@utils/account";
import { z } from "zod";
import { DierollStateManager } from "./state.manager";

export type TDierollSessionClientGameData = {
  condition: z.infer<typeof DieRollBetType>["condition"];
  target: z.infer<typeof DieRollBetType>["target"];
};

export type TDieRollGameResult = number;

export type TDierollSessionJSON = {
  sessionId: string;
  serverSeedHash: string;
  clientGameData?: TDierollSessionClientGameData;
  clientBetData?: {bet:string,multiplier:number,clientSeed:string};
  gameResult?: TDieRollGameResult;
  gameResultIsWon?: "DRAW" | "WON" | "LOST";
};

export class DierollSession extends SessionManager<TDierollSessionClientGameData,TDieRollGameResult,DierollStateManager> {
  public readonly AssociatedAccount: Account;
  constructor(associatedAccount: Account) {
    super();
    this.AssociatedAccount = associatedAccount;
  }
  private GameResult?: TDieRollGameResult;
  private GameResultIsWon?: "DRAW" | "WON" | "LOST";

  public SetResult(isWon: "DRAW" | "WON" | "LOST",result: TDieRollGameResult) {
    this.GameResult = result;
    this.GameResultIsWon = isWon;
  }

  public GetResult() {
    return this.GameResult
  }
  
  public GetResultIsWon() {
    return this.GameResultIsWon;
  }

  public ToData(): TDierollSessionJSON {
    return {
      sessionId: this.SessionId!,
      serverSeedHash: this.ServerSeedHash,
      clientGameData: this.ClientGameData,
      clientBetData: this.ClientBetData ? {bet: this.ClientBetData.bet.toString(), multiplier: this.ClientBetData.multiplier , clientSeed: this.ClientBetData.clientSeed} : undefined,
      gameResult: this.GameResult,
      gameResultIsWon: this.GameResultIsWon,
    };
  }

}
