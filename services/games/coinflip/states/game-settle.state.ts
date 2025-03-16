import { BaseBetData } from "../../../../typings";
import { BetSessionBaseState } from "../../../../utils/session/base.state";
import { SessionManager } from "../../../../utils/session/session.manager";
import { CoinflipSessionContext } from "../entities/coinflip.context";
import crypto from "node:crypto";
export class CoinFlipSettleState extends BetSessionBaseState {
  protected _stateName: TSessionState = "GAME_SETTLE";
  private choiceListenerIndex?: number;
  public ExitState(manager: SessionManager<CoinflipSessionContext>): void {
    this.choiceListenerIndex =
      manager.SessionContext.GameFlipChoiceEvent.RegisterEventListener(
        async (choice) => {
          this.HandleChoice(manager, choice);
        }
      );
  }

  HandleChoice(
    manager: SessionManager<CoinflipSessionContext>,
    choice: "HEADS" | "TAILS"
  ) {
    const result = this.GetResult(manager);
    const client_won = choice === result;
    manager.SessionContext.Result = {client_won,player_choice:choice,result};

    manager.SessionContext.GameResultEvent.Raise({client_won,player_choice:choice,result});

    if (client_won) {
      manager.ChangeCurrentState(manager.SessionStateFactory.BetSettleState());
    } else {
      manager.ChangeCurrentState(manager.SessionStateFactory.BetFullfilledState());
    }
  }

  private GetResult(manager: SessionManager<CoinflipSessionContext>) {
    const serverSeed = manager.SessionContext.ServerSeed;
    const clientSeed = manager.SessionContext.ClientSeed;
    let gameHashSeed = `${serverSeed}${clientSeed}`;
    const gameHash = crypto
      .createHash("sha512")
      .update(gameHashSeed)
      .digest("hex");
    const gameHashHmac = crypto
      .createHmac("sha256", gameHash)
      .update(gameHashSeed)
      .digest("hex");

    const resultNumber = parseInt(gameHashHmac.substring(0, 13), 16);
    const result = resultNumber % 2 === 0 ? "HEADS" : "TAILS";
    
    return result;
  }

  public EnterState(manager: SessionManager<CoinflipSessionContext>): void {
    if (!this.choiceListenerIndex) return;
    manager.SessionContext.GameFlipChoiceEvent.UnRegisterEventListener(
      this.choiceListenerIndex
    );
  }
}
