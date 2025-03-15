import { SessionStore } from "../../../utils/session/session-store";
import { DieRollSessionContext } from "./entities/dieroll.context";
import { DierollSessionStateFactory } from "./entities/dieroll.factory";
import { BetSessionStateMachine } from "../../../utils/session/state-machine";
import { z } from "zod";
import { DieRollBetType } from "./types";
import { sessionsTable } from "../../../schema/session.schema";
import { DB } from "../../../database";
import { dieroll } from "../../../schema/games/dieroll.schema";
import { Account } from "../../../utils/account";

type TDieRollGameCondition = z.infer<typeof DieRollBetType.shape.condition>;
type TDieRollGameTarget = z.infer<typeof DieRollBetType.shape.target>;

export class DieRollModel {
	private dieRollSessionStore = new SessionStore<DieRollSessionContext>();
	private stateFactory = new DierollSessionStateFactory();
	private dieRollSessionSeedStore: {
		[socket_id: string]: { serverSeed: string; serverSeedHash: string };
	} = {};

  private GetSocketServerSeed(socket_id: string) {
		let data = this.dieRollSessionSeedStore[socket_id];
		console.log(data);
		return data;
	}

	public AddNewSocketServerSeed(
		socket_id: string,
		serverSeed: string,
		serverSeedHash: string
	) {
		console.log(socket_id, serverSeed, serverSeedHash);
		return (this.dieRollSessionSeedStore[socket_id] = {
			serverSeed,
			serverSeedHash,
		});
	}

	public async AddSession(
		socket_id: string,
		clientSeed: string,
		amount: bigint,
		condition: TDieRollGameCondition,
		target: TDieRollGameTarget,
		multiplier: number,
		account: Account
	) {
		let { serverSeed, serverSeedHash } =
			this.GetSocketServerSeed(socket_id);

		let data = await DB.insert(sessionsTable)
			.values({
				serverSeed,
				serverSeedHash,
				clientSeed,
				user: account.Id,
				amount: amount,
				gameType: "DICEROLL",
			})
			.returning();

		let session_id = data[0].id;

		let context = new DieRollSessionContext(
			session_id,
			serverSeed,
			serverSeedHash,
			clientSeed,
			account,
			condition,
			target,
			multiplier,
			amount
		);

		let session = new BetSessionStateMachine(this.stateFactory, context);

		session.AddOnStateMachineIdle((server_id: string) =>
			this.OnSessionCompleteCleaner(server_id)
		);

		session.SessionContext.Result.AddListener(async (data) => {
			if (!data) return;
			await DB.insert(dieroll)
				.values({
					condition: session.SessionContext.GameCondition,
					multiplier: session.SessionContext.Multiplier,
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
	}
}
