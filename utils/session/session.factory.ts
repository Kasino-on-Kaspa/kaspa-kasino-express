import { SessionBaseState } from "./base.state";
import { SessionManager } from "./session.manager";
import { SessionStateManager } from "./state.manager";

export abstract class SessionStateFactory<TStateManager extends SessionStateManager<any,any>> {
  public abstract GetState(stateName: string): SessionBaseState<TStateManager>;
  public abstract CreateStateManager(session: SessionManager<any,any,TStateManager>,state: string): TStateManager;
}