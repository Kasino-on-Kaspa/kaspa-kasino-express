import { BetSessionContext } from "./entities/session-context";
import { BetSessionBaseState } from "./state";
import { BetBaseSessionStateFactory } from "./entities/state-factory";
import { ObservableData } from "../observables/data";
import { ObservableEvent } from "../observables/event";

type TOnCompleteListener = (server_id: string) => void;

export class BetSessionStateMachine<
  TBetContext extends BetSessionContext = BetSessionContext
> {
  private _stateFactory: BetBaseSessionStateFactory;
  private _context: TBetContext;
  private _listeners: TOnCompleteListener[] = [];
  private _currentState: BetSessionBaseState;

  private lastStateUpdated: Date = new Date();
  public ChangeStateEvent: ObservableEvent<TSessionState> = new ObservableEvent();

  constructor(stateFactory: BetBaseSessionStateFactory, context: TBetContext) {
    this._context = context;
    this._stateFactory = stateFactory;
    this._currentState = stateFactory.GetStartState();
  }

  public Start() {
    this._currentState.EnterState(this);
  }

  public AddOnCompleteListener(listener: TOnCompleteListener) {
    return this._listeners.push(listener) - 1;
  }
  
  public RemoveOnCompleteListener(index: number) {
    this._listeners.splice(index, 1);
  }

  public InvokeOnCompleteListener() {
    this._listeners.forEach((callback) => callback(this._context.SessionId));
  }

  public ChangeCurrentState(nextState: BetSessionBaseState) {
    this.UpdateLastUpdatedTime(Date.now());

    this._currentState.ExitState(this);

    this._currentState = nextState;

    this._currentState.EnterState(this);
  }

  public AddOnStateMachineIdle(listener: TOnCompleteListener) {
    this._listeners.push(listener);
  }

  public InvokeStateMachineIdleListeners() {
    this._listeners.forEach((callback) => callback(this._context.SessionId));
  }

  UpdateLastUpdatedTime(newTime: number) {
    this.lastStateUpdated = new Date(newTime);
  }

  
  public get SessionContext() {
    return this._context;
  }

  public get SessionStates() {
    return this._stateFactory;
  }
}
