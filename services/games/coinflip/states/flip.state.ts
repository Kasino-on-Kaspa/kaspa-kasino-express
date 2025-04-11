import { SessionBaseState } from "@utils/session/base.state";
import { CoinflipSessionGameState } from ".";
import { CoinflipStateManager } from "../entities/state.manager";
import crypto from "crypto";
export class CoinflipFlipState extends SessionBaseState<CoinflipStateManager> {
  protected _stateName: string = CoinflipSessionGameState.FLIP;

  public EnterState(manager: CoinflipStateManager): void {
    this.HandleFlip(manager);
  }

  public async HandleFlip(manager: CoinflipStateManager): Promise<void> {
    const gameHashSeed = `${manager.SessionManager.ServerSeed}${
      manager.SessionManager.ClientBetData!.clientSeed
    }?level=${manager.SessionManager.Level}`;

    const gameHash = crypto
      .createHash("sha512")
      .update(gameHashSeed)
      .digest("hex");
    const gameHashHmac = crypto
      .createHmac("sha256", gameHash)
      .update(gameHashSeed)
      .digest("hex");

    const resultNumber = parseInt(gameHashHmac.substring(0, 13), 16);

    const result = resultNumber % 2 == 0 ? "HEADS" : "TAILS";

    manager.SessionManager.SetCurrentResult(result);
    manager.ChangeState(CoinflipSessionGameState.CHOICE);
  }

  public ExitState(manager: CoinflipStateManager): void {}
}
