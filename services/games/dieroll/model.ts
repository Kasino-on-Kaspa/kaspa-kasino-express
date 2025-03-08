import { SessionStore } from "../../../utils/session/session-store";
import { DieRollSessionContext } from "./entities/session-context";
import { DierollSessionStateFactory } from "./entities/state-factory";
import { BetSessionStateMachine } from "../../../utils/session/state-machine";
import { z } from "zod";
import { DieRollBetType } from "./types";

type TDieRollGameCondition = z.infer<typeof DieRollBetType.shape.condition>;
type TDieRollGameTarget = z.infer<typeof DieRollBetType.shape.amount>;

export class DieRollModel {

  private dieRollSessionStore = new SessionStore<DieRollSessionContext>();
  private stateFactory = new DierollSessionStateFactory();

  public AddSession(
    serverSeed: string,
    serverSeedHash: string,
    clientSeed: string,
    condition: TDieRollGameCondition,
    target: TDieRollGameTarget
  ) {
    let session_id = crypto.randomUUID();

    let context = new DieRollSessionContext(
      session_id,
      serverSeed,
      serverSeedHash,
      clientSeed,
      condition,
      target
    );

    let session = new BetSessionStateMachine(this.stateFactory, context);

    this.dieRollSessionStore.AddSession(session_id, session);
    
    return { session_id };
  }

  public GetSession(session_id: string) {
    return this.dieRollSessionStore.GetSession(session_id);
  }
}
