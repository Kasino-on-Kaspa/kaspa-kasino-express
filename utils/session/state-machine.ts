import { BetSessionContext } from "./entities/session-context";
import { BetSessionBaseState } from "./state";
import { BetBaseSessionStateFactory } from "./entities/state-factory";

export class BetSessionStateMachine<
  TBetContext extends BetSessionContext = BetSessionContext
> {
  
  private _stateFactory: BetBaseSessionStateFactory;
  private _context: TBetContext;

  private _currentState: BetSessionBaseState;

  constructor(stateFactory: BetBaseSessionStateFactory, context: TBetContext) {
    this._context = context;
    this._stateFactory = stateFactory;
    this._currentState = stateFactory.GetStartState();
  }

  public Start() {
    this._currentState.EnterState(this);
  }

  public ChangeCurrentState(nextState: BetSessionBaseState) {
    this._currentState.ExitState(this);

    this._currentState = nextState;

    this._currentState.EnterState(this);
  }

  public get SessionContext() {
    return this._context;
  }

  public get SessionStates() {
    return this._stateFactory;
  }
}
