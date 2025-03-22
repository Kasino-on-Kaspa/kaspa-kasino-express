import { SessionStateManager } from "./state.manager";

export abstract class SessionBaseState<TStateManager extends SessionStateManager<any,any>> {
  protected abstract _stateName: string;
  
  public get StateName() {
    return this._stateName;
  }

  public abstract EnterState(
    manager: TStateManager,
  ): void;

  public abstract ExitState(
    manager: TStateManager,
  ): void;
}