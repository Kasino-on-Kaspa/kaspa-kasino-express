import { Server, Socket } from "socket.io";
import { Service } from "../../../utils/service/service";
import { DieRollBetType } from "./types";
import { z } from "zod";
import { DieRollModel } from "./dieroll.model";
import crypto from "node:crypto";
import { DIEROLL_ERROR, DIEROLL_FULLFILLED, DIEROLL_RESULT } from "./dieroll.messages";
import { AccountStoreInstance } from "../../..";

class DieRollService extends Service {
  protected serviceName: string = "DieRoll";

  protected Model: DieRollModel = new DieRollModel();

  public override Handler(io: Server, socket: Socket): void {
    socket.on(
      "dieroll:new",
      (cb: ( serverSeedHash: string) => Promise<void>) => {
        let result = this.HandleGenerateServerSeed(socket.id);
        cb(result.sSeedHash);
      }
    );
    
    socket.on("dieroll:bet", (bet_data: z.infer<typeof DieRollBetType>) => {
      this.HandleBetCreate(io, socket, bet_data);
    });
  }

  private async HandleBetCreate(
    io: Server,
    socket: Socket,
    bet_data: z.infer<typeof DieRollBetType>
  ) {
    let account = AccountStoreInstance.GetUserFromHandshake(socket.id);

    
    let parse = this.ParseParams(bet_data, DieRollBetType, socket);

    if (!parse.success)
      return socket.emit(DIEROLL_ERROR, {
        message: `Failed to parse arguments`,
        error: parse.error.issues,
      });

    const betAmount = BigInt(parse.data.amount);

    if (account.Balance.GetData() < betAmount) {
      socket.emit(DIEROLL_ERROR, {
        message: "Insufficient Balance",
      });
      return;
    }

    if (parse.data.target <= 1) {
      socket.emit(DIEROLL_ERROR, {
        message: "Target must be greater than 1",
      });
      return;
    }

    if (parse.data.target >= 99) {
      socket.emit(DIEROLL_ERROR, {
        message: "Target must be lesser than 99",
      });
      return;
    }

    let { session_id } = await this.Model.AddSession(
      socket.id,
      parse.data.client_seed,
      betAmount, // Pass BigInt
      parse.data.condition,
      parse.data.target,
      this.CalculateMultiplier(parse.data.condition, parse.data.target),
      account
    );

    let session = this.Model.GetSession(session_id);

    let resultListner = session.SessionContext.Result.AddListener(
      async (new_result) => {
        socket.emit(DIEROLL_RESULT, new_result);
      }
    );
    let fullfilledListener = session.AddOnCompleteListener(
      async (server_id) => {
        console.log(server_id)
        socket.emit(DIEROLL_FULLFILLED, {server_seed:session.SessionContext.ServerSeed,server_hash:session.SessionContext.ServerSeedHash});
      }
    );

    socket.once("disconnect",()=> {
      session.SessionContext.Result.RemoveListener(resultListner)
      session.RemoveOnCompleteListener(fullfilledListener)
    })

    session.Start();
  }

  private GenerateServerSeed() {
    const sSeed = crypto.randomBytes(32).toString("hex");
    const seedHashRaw = crypto.createHash("sha256").update(sSeed);
    const sSeedHash = seedHashRaw.digest("hex");

    return {
      sSeed,
      sSeedHash,
    };
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

  public HandleGenerateServerSeed(socket_id:string) {
    let data = this.GenerateServerSeed();
    this.Model.AddNewSocketServerSeed(socket_id,data.sSeed,data.sSeedHash)
    return data;
  }
}

export const DieRollServiceInstance = new DieRollService();
