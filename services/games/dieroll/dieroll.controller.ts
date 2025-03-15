import { Socket } from "socket.io";
import { DieRollModel } from "./dieroll.model";
import crypto from "node:crypto";
import { DieRollBetType, TDierollBetResult } from "./dieroll.types";
import { z } from "zod";
import { AckFunction } from "../types";
import { AccountStoreInstance } from "../../..";
import { Account } from "../../../utils/account";
import { DierollStateFactory } from "./entities/dieroll.factory";
import { DieRollSessionContext } from "./entities/dieroll.context";
import { SessionManager } from "../../../utils/session/session.manager";
import { DB } from "../../../database";
import { dieroll } from "../../../schema/games/dieroll.schema";

export class DieRollController {
  private readonly model: DieRollModel = new DieRollModel();
  private readonly StateFactory = new DierollStateFactory();

  public HandleGenerate(socket_id: string) {
    let serverSeed = this.GenerateServerSeed();
    this.model.dieRollSessionSeedStore[socket_id] = serverSeed;
    return serverSeed;
  }

  public async HandleBet(
    socket: Socket,
    bet_data: z.infer<typeof DieRollBetType>,
    ack: AckFunction,
    on_bet_fullfilled: (socket: Socket, result: TDierollBetResult) => void
  ) {
    let { serverSeed, serverSeedHash } =
      this.model.dieRollSessionSeedStore[socket.id];

    if (!serverSeed)
      return ack({ success: false, error: "Generate a server seed first!" });

    let parse = this.ParseParams(bet_data);

    let account = AccountStoreInstance.GetUserFromHandshake(socket.id);

    if (!parse.success) return ack(parse);

    let betAmount = BigInt(parse.data.amount);
    let balanceVerify = this.CheckBalance(account, betAmount);

    if (!balanceVerify.success) return ack(balanceVerify);

    let { client_seed, condition, target } = parse.data;

    let data = await this.model.InsertToSessionTable({
      amount: betAmount,
      clientSeed: client_seed,
      serverSeed: serverSeed,
      serverSeedHash: serverSeedHash,
      gameType: "DICEROLL",
      user: account.Id,
    });

    let { id } = data[0];

    let context = new DieRollSessionContext(
      id,
      serverSeed,
      serverSeedHash,
      client_seed,
      account,
      condition,
      target,
      this.CalculateMultiplier(condition, target),
      betAmount
    );

    let session = new SessionManager(this.StateFactory, context);

    this.model.dieRollSessionStore[id] = session;
    ack({ success: true });

    session.OnSessionComplete.RegisterEventListener(async (session_id) => {
      let session = this.model.dieRollSessionStore[session_id];
      let result = session.SessionContext.Result.GetData();

      await this.HandleSessionComplete(session, socket.id);

      on_bet_fullfilled(socket, {
        isWon: result!.isWon,
        payout:
          BigInt(session.SessionContext.Multiplier) *
          session.SessionContext.BetAmount,
        resultRoll: result!.resultRoll,
        sessionId: session.SessionContext.SessionId,
        serverSeed: session.SessionContext.ServerSeed,
      });
    });
  }

  private async HandleSessionComplete(
    session: SessionManager<DieRollSessionContext>,
    socketId: string
  ) {
    await this.InsertSessionResult(session);

    delete this.model.dieRollSessionSeedStore[socketId];
    delete this.model.dieRollSessionStore[session.SessionContext.SessionId];
  }

  private async InsertSessionResult(
    session: SessionManager<DieRollSessionContext>
  ) {
    let context = session.SessionContext;
    let data = context.Result.GetData()!;

    await DB.insert(dieroll).values({
      condition: context.GameCondition,
      multiplier: context.Multiplier,
      target: context.GameTarget,
      sessionId: context.SessionId,
      result: data.resultRoll,
      client_won: data.isWon,
    });
  }

  private CalculateMultiplier(
    condition: "OVER" | "UNDER",
    target: number,
    houseEdge: number = 2
  ): number {
    // Validate inputs
    if (target < 1 || target > 99) {
      throw new Error("Target must be between 1 and 99");
    }
    if (houseEdge < 0 || houseEdge > 100) {
      throw new Error("House edge must be between 0 and 100");
    }

    // Calculate win probability
    const winProbability =
      condition === "OVER"
        ? (100 - target) / 100 // Probability of rolling > target
        : target / 100; // Probability of rolling ≤ target

    // Calculate fair multiplier (without house edge)
    const fairMultiplier = 1 / winProbability;

    // Apply house edge
    const multiplierWithEdge = fairMultiplier * (1 - houseEdge / 100);

    // Convert to basis points (1/10000)
    return Math.round(multiplierWithEdge * 10000);
  }

  private ParseParams(
    bet_data: z.infer<typeof DieRollBetType>
  ):
    | { success: true; data: z.infer<typeof DieRollBetType> }
    | { success: false; error: string } {
    let parsedData = DieRollBetType.safeParse(bet_data);
    if (!parsedData.success)
      return { success: false, error: "Bet input failed to parse" };

    if (parsedData.data.target < 2) {
      return { success: false, error: "Target must be higher that 1" };
    }

    if (parsedData.data.target > 98) {
      return {
        success: false,
        error: "Target must be lesser than 99",
      };
    }

    return { success: true, data: parsedData.data };
  }

  private CheckBalance(
    account: Account,
    betAmount: bigint
  ): { success: true } | { success: false; error: string } {
    if (account.Balance.GetData() < betAmount) {
      return { success: false, error: "Insufficient Balance" };
    }
    return { success: true };
  }

  private GenerateServerSeed() {
    const sSeed = crypto.randomBytes(32).toString("hex");
    const seedHashRaw = crypto.createHash("sha256").update(sSeed);
    const sSeedHash = seedHashRaw.digest("hex");

    return {
      serverSeed: sSeed,
      serverSeedHash: sSeedHash,
    };
  }
}
