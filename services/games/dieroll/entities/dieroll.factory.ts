import { BetBaseSessionStateFactory } from "../../../../utils/session/entities/session.factory";
import { DieRollSettleState } from "../states/game-settle.state";

export class DierollStateFactory extends BetBaseSessionStateFactory {
  
  public GameSettleState = () => new DieRollSettleState();
  
}