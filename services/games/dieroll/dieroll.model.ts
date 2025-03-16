import { DB } from "../../../database";
import { sessionsTable } from "../../../schema/session.schema";
import { SessionManager } from "../../../utils/session/session.manager";
import { DieRollSessionContext } from "./entities/dieroll.context";

interface ISocketServerSeedStore {
  [socket_id: string]: { serverSeed: string; serverSeedHash: string };
}
interface ISocketSessionStore {
  [socket_id: string]: SessionManager<DieRollSessionContext>;
}

export class DieRollModel {
  public readonly dieRollSessionSeedStore: ISocketServerSeedStore = {};
  public readonly dieRollSessionStore: ISocketSessionStore = {};

  public async InsertToSessionTable(
    sessionData: typeof sessionsTable.$inferInsert
  ) {
    return await DB.insert(sessionsTable).values(sessionData).returning();
  }
}
