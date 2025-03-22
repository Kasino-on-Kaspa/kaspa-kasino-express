import { SessionBaseState } from "@utils/session/base.state";
import { SessionStateFactory } from "@utils/session/session.factory";
import { DieRollEndState, DieRollGameState, DieRollRollState, DieRollSettleState, TDieRollGameState } from "../states";
import { DieRollStartState } from "../states/start.state";
import { DierollStateManager } from "./state.manager";
import { DierollSession } from "./dieroll.session";


export class DieRollStateFactory extends SessionStateFactory<DierollStateManager> {

  public CreateStateManager(session: DierollSession, state: DieRollGameState): DierollStateManager {
    return new DierollStateManager(this, state, session);
  }

  public GetState(stateName: TDieRollGameState): SessionBaseState<DierollStateManager> {
    switch (stateName) {
      case DieRollGameState.START:
        return new DieRollStartState();
      case DieRollGameState.ROLL:
        return new DieRollRollState();
      case DieRollGameState.SETTLE:
        return new DieRollSettleState();
      case DieRollGameState.END:
        return new DieRollEndState();
      default:
        throw new Error(`State ${stateName} not found`);
    }
  }
}