import { BetSessionContext } from "./entities/session-context";
import { BetSessionStateMachine } from "./state-machine";

export class SessionStore<TBetContext extends BetSessionContext> {
  private _sessions: Record<string, BetSessionStateMachine<TBetContext>> = {};

  public AddSession(id: string, session: BetSessionStateMachine<TBetContext>) {
    this._sessions[id] = session;
  }
  public RemoveSession(id: string) {
    delete this._sessions[id];
  }
  public GetSession(id: string) {
    return this._sessions[id];
  }
}
