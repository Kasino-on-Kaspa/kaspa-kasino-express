import { Server, Socket } from "socket.io";
import { Service } from "../../../utils/service/service";
import { DieRollBetType } from "./types";
import { z } from "zod";
import { DieRollModel } from "./model";
import crypto from "node:crypto";
import { DIEROLL_ERROR, DIEROLL_RESULT } from "./messages";

class DieRollService extends Service {
  protected serviceName: string = "DieRoll";

  protected Model: DieRollModel = new DieRollModel();

  public override Handler(io: Server, socket: Socket): void {
    socket.on("dieroll:bet", (bet_data: z.infer<typeof DieRollBetType>) => {
      this.HandleBetCreate(io, socket, bet_data);
    });
  }

  private async HandleBetCreate(
    io: Server,
    socket: Socket,
    bet_data: z.infer<typeof DieRollBetType>
  ) {
    let parse = this.ParseParams(bet_data, DieRollBetType, socket);

    if (!parse.success)
      return socket.emit(DIEROLL_ERROR, {
        message: `Failed to parse arguments`,
        error: parse.error.issues,
      });

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

    let { sSeed, sSeedHash } = this.GenerateServerSeed();
    

    let { session_id } = await this.Model.AddSession(
      sSeed,
      sSeedHash,
      parse.data.client_seed,
      parse.data.amount,
      parse.data.condition,
      parse.data.target
    );

    let session = this.Model.GetSession(session_id);

    let resultListner = session.SessionContext.Result.AddListener(
      async (new_result) => {
        socket.emit(DIEROLL_RESULT, new_result);
      }
    );
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
  
}

  export const DieRollServiceInstance = new DieRollService(); 