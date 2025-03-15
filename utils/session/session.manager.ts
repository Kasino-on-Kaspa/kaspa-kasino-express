import { ObservableEvent } from "../observables/event";
import { BetSessionContext } from "./entities/session.context";

export class SessionManager<
  TBetContext extends BetSessionContext = BetSessionContext
> {
  public readonly OnStateChangeEvent = new ObservableEvent<void>();
  public readonly OnSessionComplete = new ObservableEvent<string>();

  public readonly SessionStateFactory: any;
  public readonly SessionContext: TBetContext;
  private _currentState: any;

  constructor(stateFactory: any, context: TBetContext) {
    this.SessionContext = context;
    this.SessionStateFactory = stateFactory;
    this._currentState = stateFactory.GetStartState();
  }

  public Start() {
    this._currentState.EnterState(this);
  }


  public ChangeCurrentState(nextState: TSessionState) {

    this._currentState.ExitState(this);

    this._currentState = nextState;

    this._currentState.EnterState(this);
  }
}
