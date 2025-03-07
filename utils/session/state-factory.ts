import { BetSessionContext } from "./context";
import { BetSessionBaseState } from "./state";
import {
  BetSessionErrorState,
  BetSessionFullfilledState,
  BetSessionPendingState,
  BetSessionSettleState,
  BetSessionStartState,
} from "./states/";

type TSesisonStateProducerFunction = () => BetSessionBaseState;

export abstract class BetBaseSessionStateFactory {
  public GetStartState(): BetSessionBaseState {
    return this.StartState();
  }

  public abstract GameSettleState: TSesisonStateProducerFunction;
  public BetSettleState = () => new BetSessionSettleState();
  public StartState = () => new BetSessionStartState();
  public PendingState = () => new BetSessionPendingState();
  public ErrorState = () => new BetSessionErrorState();
  public FullfilledState = () => new BetSessionFullfilledState();
}
