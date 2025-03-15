import { DB } from "../../../../database";
import {
  coinflip,
  E_COINFLIP_OPTION,
} from "../../../../schema/games/coinflip.schema";
import { BetSessionBaseState } from "../../../../utils/session/state";
import { BetSessionStateMachine } from "../../../../utils/session/state-machine";
import { CoinFlipSessionContext } from "../entities/coinflip.context";
import crypto from "node:crypto";

export class CoinFlipSettleState extends BetSessionBaseState {
  protected _stateName: TSessionState = "GAME_SETTLE";

  public EnterState(
    manager: BetSessionStateMachine<CoinFlipSessionContext>
  ): void {
    manager.SessionContext.OnClientOptionSelect.RegisterEventListener(
      async (choice) => {
        this.HandleOnGameBet(choice, manager);
      },
      true
    );
  }

  private async HandleOnGameBet(
    choice: "HEADS" | "TAILS",
    manager: BetSessionStateMachine<CoinFlipSessionContext>
  ) {
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

    const result = E_COINFLIP_OPTION.enumValues[resultNumber % 2];

    manager.SessionContext.SetResult(result == choice, result);

    manager.ChangeCurrentState(manager.SessionStates.BetSettleState());
  }

  public ExitState(
    manager: BetSessionStateMachine<CoinFlipSessionContext>
  ): void {}
}
