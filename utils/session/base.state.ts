import { SessionManager } from "./session.manager";

export abstract class BetSessionBaseState {
  protected abstract _stateName: TSessionState;

  public get StateName() {
    return this._stateName;
  }
  
  public abstract EnterState(
    manager: SessionManager<any>
  ): void;

  public abstract ExitState(
    manager: SessionManager<any>
  ): void;

}