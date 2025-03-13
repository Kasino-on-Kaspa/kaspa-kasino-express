import { BetSessionBaseState } from "../../../../utils/session/state";
import { BetSessionStateMachine } from "../../../../utils/session/state-machine";
import { DieRollSessionContext } from "../entities/dieroll.context";

import crypto from "node:crypto";

export class DieRollSettleState extends BetSessionBaseState {

  protected _stateName: TSessionState = "GAME_SETTLE";
  
  public EnterState(
    manager: BetSessionStateMachine<DieRollSessionContext>
  ): void {

    const gameHashSeed = `${manager.SessionContext.ServerSeed}${manager.SessionContext.ClientSeed}`;
    const gameHash = crypto
      .createHash("sha512")
      .update(gameHashSeed)
      .digest("hex");
    const gameHashHmac = crypto
      .createHmac("sha256", gameHash)
      .update(gameHashSeed)
      .digest("hex");

    const resultNumber = parseInt(gameHashHmac.substring(0, 13), 16);

    const result = (resultNumber % 98 ) + 1;

    let condition = manager.SessionContext.GameCondition;
    let target = manager.SessionContext.GameTarget;

    let isWon: boolean;
    
    switch (condition) {
      case "OVER":
        isWon = target < result;
        break;
      case "UNDER":
        isWon = result < target;
        break;
      default:
        isWon = false;
    }

    manager.SessionContext.SetResult(isWon, result);

    if (isWon)
      manager.ChangeCurrentState(manager.SessionStates.BetSettleState());
    else manager.ChangeCurrentState(manager.SessionStates.BetFullfilledState());
  }

  public ExitState(
    manager: BetSessionStateMachine<DieRollSessionContext>
  ): void {
    console.log(`Exited ${this._stateName} State`);
  }
}
