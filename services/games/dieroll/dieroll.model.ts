import { SessionStore } from "../../../utils/session/session-store";
import { DieRollSessionContext } from "./entities/dieroll.context";
import { DierollSessionStateFactory } from "./entities/dieroll.factory";
import { BetSessionStateMachine } from "../../../utils/session/state-machine";
import { z } from "zod";
import { DieRollBetType } from "./types";
import { sessionsTable } from "../../../schema/session.schema";
import { DB } from "../../../database";
import {
	dierollTable,
	E_DICEROLL_CONDITION,
} from "../../../schema/games/dieroll.schema";

type TDieRollGameCondition = z.infer<typeof DieRollBetType.shape.condition>;
type TDieRollGameTarget = z.infer<typeof DieRollBetType.shape.amount>;

export class DieRollModel {
	private dieRollSessionStore = new SessionStore<DieRollSessionContext>();
	private stateFactory = new DierollSessionStateFactory();

	public async AddSession(
		serverSeed: string,
		serverSeedHash: string,
		clientSeed: string,
		amount: number,
		condition: TDieRollGameCondition,
		target: TDieRollGameTarget
	) {
		let data = await DB.insert(sessionsTable)
			.values({
				serverSeed,
				serverSeedHash,
				clientSeed,
				amount,
				gameType: "DICEROLL",
			})
			.returning();

		let session_id = data[0].id;

		let context = new DieRollSessionContext(
			session_id,
			serverSeed,
			serverSeedHash,
			clientSeed,
			condition,
			target
		);

		let session = new BetSessionStateMachine(this.stateFactory, context);

		session.AddOnCompleteListener((server_id: string) =>
			this.OnSessionCompleteCleaner(server_id)
		);

		session.SessionContext.Result.AddListener(async (data) => {
			if (!data) return;
			await DB.insert(dierollTable)
				.values({
					condition: session.SessionContext.GameCondition,
					multiplier: session.SessionContext.GameMultiplier,
					target: session.SessionContext.GameTarget,
					sessionId: session.SessionContext.SessionId,
					result: data.resultRoll,
					client_won: data.isWon,
				})
				.returning();
		});

		this.dieRollSessionStore.AddSession(session_id, session);

		return { session_id };
	}

	public GetSession(session_id: string) {
		return this.dieRollSessionStore.GetSession(session_id);
	}

	private OnSessionCompleteCleaner(server_id: string) {
		this.dieRollSessionStore.RemoveSession(server_id);
		console.log(this.dieRollSessionStore.GetAllSession());
	}
}
