import { BetBaseSessionStateFactory } from "../../../../utils/session/entities/state-factory";
import { DieRollSettleState } from "../state/game-settle.state";

export class DierollSessionStateFactory extends BetBaseSessionStateFactory {
  
  public GameSettleState = () => new DieRollSettleState();
  
}
