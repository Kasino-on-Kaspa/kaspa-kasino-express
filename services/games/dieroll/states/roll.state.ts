import { SessionBaseState } from "@utils/session/base.state";
import { DierollStateManager } from "../entities/state.manager";
import { DieRollGameState } from "../states";
import crypto from "crypto";
export class DieRollRollState extends SessionBaseState<DierollStateManager> {
  protected _stateName: DieRollGameState = DieRollGameState.ROLL;

  public EnterState(manager: DierollStateManager): void {
    this.HandleRoll(manager);
  }

  public HandleRoll(manager: DierollStateManager): void {
    const gameHashSeed = `${manager.SessionManager.ServerSeed}${
      manager.SessionManager.ClientBetData!.clientSeed
    }`;
    const gameHash = crypto.createHash("sha512").update(gameHashSeed).digest("hex");
    const gameHashHmac = crypto.createHmac("sha256", gameHash).update(gameHashSeed).digest("hex");

    const resultNumber = parseInt(gameHashHmac.substring(0, 13), 16);

    const result = (resultNumber % 98) + 1;

    let condition = manager.SessionManager.ClientGameData!.condition;
    let target = manager.SessionManager.ClientGameData!.target;

    if (target == result) {
      this.HandleResult(manager, "DRAW", result);
      return;
    }

    if (condition == "OVER") {
      this.HandleResult(manager, target < result ? "WON" : "LOST", result);
      return;
    }

    if (condition == "UNDER") {
      this.HandleResult(manager, target < result ? "WON" : "LOST", result);
      return;
    }

    throw new Error("Invalid condition");
  }

  public HandleResult(
    manager: DierollStateManager,
    isWon: "DRAW" | "WON" | "LOST",
    result: number
  ): void {
    manager.SessionManager.SetResult(isWon, result);
    manager.SessionManager.SessionResultEvent.Raise(manager.SessionManager.GetResult()!);
    manager.ChangeState(DieRollGameState.SETTLE);
  }

  public ExitState(manager: DierollStateManager): void {}
}
