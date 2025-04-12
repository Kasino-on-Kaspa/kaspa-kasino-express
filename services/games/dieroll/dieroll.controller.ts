import { DieRollModel } from "./dieroll.model";
import {
  TDieRollGameResult,
  TDierollSessionJSON,
} from "./entities/dieroll.session";
import { Socket, Server } from "socket.io";
import { AccountStoreInstance } from "@/index";
import { DieRollStateFactory } from "./entities/state.factory";
import { DierollSession } from "./entities/dieroll.session";
import { DieRollBetType } from "./dieroll.types";
import { z } from "zod";
import { Account } from "@utils/account";
import { DieRollGameState } from "./states";
import { DieRollServerMessage } from "./dieroll.messages";
import { EventBus } from "@utils/eventbus";

export type TDieRollAck =
  | {
      status: "SUCCESS";
      session: TDierollSessionJSON;
    }
  | {
      status: "ERROR";
      message: string;
    };

export class DieRollController {
  private model: DieRollModel;
  private factory: DieRollStateFactory;
  private io: Server;

  constructor(io: Server) {
    this.model = new DieRollModel();
    this.factory = new DieRollStateFactory();
    this.io = io;
  }

  public async HandleGetSession(
    socket: Socket,
    callback: (
      serverSeedHash: string,
      session_data?: TDierollSessionJSON
    ) => void
  ) {
    let account = AccountStoreInstance.GetUserFromHandshake(socket.id);
    let session = this.model.GetSession(account.Id);

    if (session) {
      callback(session.ServerSeedHash, session.ToData());
      return;
    }

    session = new DierollSession(account);

    this.model.SetSession(account.Id, session);

    callback(session.ServerSeedHash);
  }

  public async HandleRoll(
    socket: Socket,
    betParams: z.infer<typeof DieRollBetType>,
    ack: (ack: TDieRollAck) => void
  ) {
    let account = AccountStoreInstance.GetUserFromHandshake(socket.id);
    let session = this.model.GetSession(account.Id);

    if (!session) {
      ack({
        status: "ERROR",
        message: "Session not found",
      });
      return;
    }

    let {
      data: bet,
      success: ParseSuccess,
      error: ParseError,
    } = DieRollBetType.safeParse(betParams);

    if (!ParseSuccess || !bet) {
      ack({
        status: "ERROR",
        message: "Invalid bet parameters",
      });
      return;
    }

    if (bet.target < 1) {
      ack({
        status: "ERROR",
        message: "Target must be greater than 0",
      });
      return;
    }

    if (bet.target > 99) {
      ack({
        status: "ERROR",
        message: "Target must be less than 100",
      });
      return;
    }

    let betAmount = BigInt(bet.amount)
    
    if (betAmount < 0n) {
      ack({
        status: "ERROR",
        message: "Amount must be greater than 0",
      });
      return;
    }

    if (betAmount > account.Wallet.balance.GetData()) {
      ack({
        status: "ERROR",
        message: "Insufficient balance",
      });
      return;
    }
    let multiplier = this.CalculateMultiplier(bet.condition, bet.target);
    session.SetClientBetData(
      {
        bet: betAmount,
        clientSeed: bet.client_seed,
        multiplier: multiplier,
      },
      {
        condition: bet.condition,
        target: bet.target,
      }
    );

    let stateManager = this.factory.CreateStateManager(
      session,
      DieRollGameState.START
    );
    session.SetStateManager(stateManager);

    ack({
      status: "SUCCESS",
      session: session.ToData(),
    });

    this.AddSessionListeners(session.AssociatedAccount, session);
    session.SessionStartEvent.Raise();
  }

  private AddSessionListeners(account: Account, session: DierollSession) {
    session.SessionResultEvent.RegisterEventListener(
      async (result: TDieRollGameResult) => {
        account.AssociatedSockets.Session.to(session.GetSessionRoomId()).emit(
          DieRollServerMessage.ROLL_RESULT,
          result
        );
      }
    );

    session.SessionCompleteEvent.RegisterEventListener(
      async () => {

        EventBus.Instance.emit("game:completed", {
          account: {username: account.Address,id: account.Id},
          bet: session.ClientBetData!.bet,
          payout: session.Payout!,
        });

        account.AssociatedSockets.Session.to(session.GetSessionRoomId()).emit(
          DieRollServerMessage.GAME_ENDED,
          { serverSeed: session.ServerSeed }
        );

        session.AssociatedAccount.AssociatedSockets.Session.socketsLeave(
          session.GetSessionRoomId()
        );
        this.model.RemoveSession(account.Id);
      }
    );
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
}
