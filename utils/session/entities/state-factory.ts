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
  public BetSettleState: TSesisonStateProducerFunction = () =>
    new BetSessionSettleState();
  public BetStartState: TSesisonStateProducerFunction = () =>
    new BetSessionStartState();
  public BetFullfilledState: TSesisonStateProducerFunction = () =>
    new BetSessionFullfilledState();
  public ErrorState: TSesisonStateProducerFunction = () =>
    new BetSessionErrorState();
}
