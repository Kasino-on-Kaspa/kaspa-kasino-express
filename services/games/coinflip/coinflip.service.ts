import { Server, Socket } from "socket.io";
import { Service } from "../../../utils/service/service";
import { CoinFlipModel } from "./coinflip.model";

import crypto from "node:crypto";
import { z } from "zod";
import { CoinflipBetType } from "./type";

class DieRollService extends Service {
  protected serviceName: string = "DieRoll";

  protected Model: CoinFlipModel = new CoinFlipModel();

  public override Handler(io: Server, socket: Socket): void {
    socket.on(
      "coinflip:predict",
      (cb: (serverSeedHash: string) => Promise<void>) => {
        let result = this.HandleGenerateServerSeed();
        cb(result.sSeedHash);
      }
    );
    socket.on("dieroll:bet", (bet_data: z.infer<typeof CoinflipBetType>) => {
      this.HandleBetCreate(io, socket, bet_data);
    });
  }

  private async HandleBetCreate(
    io: Server,
    socket: Socket,
    bet_data: z.infer<typeof CoinflipBetType>
  ) {}

  private GenerateServerSeed() {
    const sSeed = crypto.randomBytes(32).toString("hex");
    const seedHashRaw = crypto.createHash("sha256").update(sSeed);
    const sSeedHash = seedHashRaw.digest("hex");

    return {
      sSeed,
      sSeedHash,
    };
  }
  public HandleGenerateServerSeed() {
    let data = this.GenerateServerSeed();
    return data;
  }
}
