import { BetSessionContext } from "./session-context";
import { BetSessionBaseState } from "../state";
import {
  BetSessionErrorState,
  BetSessionFullfilledState,
  BetSessionSettleState,
  BetSessionStartState,
} from "../states";

type TSesisonStateProducerFunction = () => BetSessionBaseState;

export abstract class BetBaseSessionStateFactory {
  public GetStartState(): BetSessionBaseState {
    return this.BetStartState();
  }

  public abstract GameSettleState: TSesisonStateProducerFunction;
  public BetSettleState = () => new BetSessionSettleState();
  public BetStartState = () => new BetSessionStartState();
  public BetFullfilledState = () => new BetSessionFullfilledState();
  public ErrorState = () => new BetSessionErrorState();
}
