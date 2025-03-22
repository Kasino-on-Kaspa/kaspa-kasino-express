import { DierollSession } from "./entities/dieroll.session";

export class DieRollModel {
    private sessionStore: Record<string, DierollSession> = {};

    public GetSession(accountId: string) {
        return this.sessionStore[accountId];
    }

    public SetSession(accountId: string, session: DierollSession) {
        this.sessionStore[accountId] = session;
    }

    public RemoveSession(accountId: string) {
        delete this.sessionStore[accountId];
    }
}
