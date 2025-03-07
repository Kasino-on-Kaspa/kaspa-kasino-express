import { Server, Socket } from "socket.io";
import { Service } from "../../../utils/service/service";
import { ServiceRegistry } from "../../../utils/service/handler-registry";
import { DieRollBetType } from "./types";
import { z } from "zod";
import { DieRollModel } from "./model";
import crypto from "node:crypto";

class DieRollService extends Service {
  protected serviceName: string = "DieRoll";
  protected Model: DieRollModel = new DieRollModel();

  public override Handler(io: Server, socket: Socket): void {
    socket.on("dieroll:bet", (bet_data: z.infer<typeof DieRollBetType>) => {
      let parsed_data = this.ParseParams(bet_data, DieRollBetType, socket);

      if (!parsed_data) return;
      let { sSeed, sSeedHash } = this.GenerateServerSeed();
      
      let {session_id} = this.Model.AddSession(sSeed, sSeedHash, bet_data.client_seed);
      this.Model.GetSession(session_id).Start();
    });
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

export function Initialize(Handler: ServiceRegistry) {
  const DieRoll = new DieRollService();
  Handler.RegisterService(DieRoll);
}
