import { ObservableEvent } from "../observables/event";
import { SessionBaseState } from "./base.state";
import { SessionStateFactory } from "./session.factory";
import { SessionManager } from "./session.manager";

export abstract class SessionStateManager<
  TSession extends SessionManager<any, any>,
  TStates extends string = string
> {
  private _currentState: SessionBaseState<this>;
  public abstract StateTimeoutDelay: number;

  public readonly OnStateChangeEvent = new ObservableEvent<TStates>();

  public readonly StateFactory: SessionStateFactory<
    SessionStateManager<TSession, TStates>
  >;
  
  public readonly SessionManager: TSession;

  constructor(
    stateFactory: SessionStateFactory<SessionStateManager<TSession, TStates>>,
    startState: TStates,
    sessionManager: TSession
  ) {
    this.StateFactory = stateFactory;
    this.SessionManager = sessionManager;
    this._currentState = this.StateFactory.GetState(startState);
    this.RegisterSessionEvents();
  }

  public get CurrentState(): SessionBaseState<this> {
    return this._currentState;
  }

  private RegisterSessionEvents() {
    this.SessionManager.SessionStartEvent.RegisterEventListener(async () => {
      this.Start();
    });
  }

  public Start() {
    this.OnStateChangeEvent.Raise(this._currentState.StateName as TStates);
    this._currentState.EnterState(this);
  }

  public ChangeState(nextState: TStates) {
    this._currentState.ExitState(this);
    this._currentState = this.StateFactory.GetState(nextState);
    this.OnStateChangeEvent.Raise(nextState);
    this._currentState.EnterState(this);
  }
}
