import { ObservableEvent } from "../observables/event";
import { BetSessionBaseState } from "./base.state";
import { BetSessionContext } from "./entities/session.context";
import { BetBaseSessionStateFactory } from "./entities/session.factory";
export class SessionManager<
  TBetContext extends BetSessionContext = BetSessionContext
> {
  public readonly OnStateChangeEvent = new ObservableEvent<TSessionState>();
  public readonly OnSessionComplete = new ObservableEvent<string>();
   

  public readonly SessionStateFactory: BetBaseSessionStateFactory;
  public readonly SessionContext: TBetContext;
  private _currentState: BetSessionBaseState;

  public readonly OnAssociatedAccountDisconnect = new ObservableEvent<void>();

  public get CurrentState() {
    return this._currentState;
  }

  constructor(stateFactory: BetBaseSessionStateFactory, context: TBetContext,startState?: BetSessionBaseState) {
    this.SessionContext = context;
    this.SessionStateFactory = stateFactory;
    this._currentState = startState|| this.SessionStateFactory.GetStartState();
  }

  public Start() {
    this._currentState.EnterState(this);
  }


  public ChangeCurrentState(nextState: BetSessionBaseState) {
    this._currentState.ExitState(this);
    
    this._currentState = nextState;
    
    this.OnStateChangeEvent.Raise(nextState.StateName);
    this._currentState.EnterState(this);
  }
}
