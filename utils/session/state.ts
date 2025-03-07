import { BetSessionStateMachine } from "./state-machine";

export abstract class BetSessionBaseState {
  protected abstract _stateName: TSessionState;

  public get StateName() {
    return this._stateName;
  }
  public abstract EnterState(
    manager: BetSessionStateMachine<any>
  ): void;

  public abstract ExitState(
    manager: BetSessionStateMachine<any>
  ): void;

  protected timeout(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
