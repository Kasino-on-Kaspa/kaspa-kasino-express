import { BetBaseSessionStateFactory } from "../../../../utils/session/entities/state-factory";
import { BetSettleState } from "../states/bet-settle.state";
import { CoinFlipSettleState } from "../states/game-settle.state";

export class CoinFlipSessionStateFactory extends BetBaseSessionStateFactory {
  public GameSettleState = () => new CoinFlipSettleState();
  public override BetSettleState = () => new BetSettleState();
}
