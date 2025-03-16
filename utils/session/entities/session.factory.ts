import { BetSessionBaseState } from "../base.state";
import { SessionManager } from "../session.manager";
import {
  BetSessionSettleState,
  BetSessionStartState,
  BetSessionFullfilledState,
  BetSessionErrorState,
} from "../states";
import { BetSessionContext } from "./session.context";

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
