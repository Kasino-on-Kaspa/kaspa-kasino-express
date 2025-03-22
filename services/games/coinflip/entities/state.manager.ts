import { SessionStateManager } from "@utils/session/state.manager";
import { CoinflipSession } from "./coinflip.session";

export class CoinflipStateManager extends SessionStateManager<CoinflipSession> {
  public StateTimeoutDelay: number = 30 * 1000;
}