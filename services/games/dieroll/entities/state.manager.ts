import { SessionStateManager } from "@utils/session/state.manager";
import { DierollSession } from "./dieroll.session";
import { DieRollGameState } from "../states";

export class DierollStateManager extends SessionStateManager<DierollSession,DieRollGameState> {
  public StateTimeoutDelay: number = 30 * 1000;
}
