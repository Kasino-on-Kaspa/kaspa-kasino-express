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
  clientBetData?: TBetClientData;
  gameResult?: TDieRollGameResult;
  gameResultIsWon?: "DRAW" | "WON" | "LOST";
};

export class DierollSession extends SessionManager<TDierollSessionClientGameData,TDieRollGameResult,DierollStateManager> {
  public readonly AssociatedAccount: Account;
  constructor(associatedAccount: Account) {
    super();
    this.AssociatedAccount = associatedAccount;
  }

  public ToData(): TDierollSessionJSON {
    return {
      sessionId: this.SessionId!,
      serverSeedHash: this.ServerSeedHash,
      clientGameData: this.ClientGameData,
      clientBetData: this.ClientBetData,
      gameResult: this.GameResult,
      gameResultIsWon: this.GameResultIsWon,
    };
  }

}
