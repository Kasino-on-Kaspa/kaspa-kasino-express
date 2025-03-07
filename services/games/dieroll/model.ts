import { SessionStore } from "../../../utils/session/session-store";
import { DieRollSessionContext } from "./utils/session-context";
import { DierollSessionStateFactory } from "./utils/state-factory";
import { BetSessionStateMachine } from "../../../utils/session/state-machine";

export class DieRollModel {
  private dieRollSessionStore = new SessionStore<DieRollSessionContext>();
  private stateFactory = new DierollSessionStateFactory();

  public AddSession(
    serverSeed: string,
    serverSeedHash: string,
    clientSeed: string
  ) {
    let session_id = crypto.randomUUID();
    let context = new DieRollSessionContext(
      session_id,
      serverSeed,
      serverSeedHash,
      clientSeed
    );

    let session = new BetSessionStateMachine(this.stateFactory, context);

    this.dieRollSessionStore.AddSession(session_id, session);
    return {session_id}
  }

  public GetSession(session_id: string) {
    return this.dieRollSessionStore.GetSession(session_id);
  }
}
