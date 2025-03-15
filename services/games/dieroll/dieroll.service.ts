import { DefaultEventsMap, Server, Socket } from "socket.io";
import { Service } from "../../../utils/service/service";
import { DieRollController } from "./dieroll.controller";
import { DieRollBetType, TDierollBetResult } from "./dieroll.types";
import { z } from "zod";
import { AckFunction } from "../types";

class DieRollService extends Service {
  protected serviceName: string = "DierollService";
  private controller: DieRollController = new DieRollController();

  public override Handler(io: Server, socket: Socket): void {
    socket.on(
      "dieroll:generate",
      (callback: (serverSeedHash: string) => void) => {
        let seeds = this.controller.HandleGenerate(socket.id);
        callback(seeds.serverSeedHash);
      }
    );

    socket.on(
      "dieroll:bet",
      (bet_data: z.infer<typeof DieRollBetType>, ack: AckFunction) => {
        
        return this.controller.HandleBet(
          socket,
          bet_data,
          ack,
          this.OnBetFullfilled
        );
      }
    );
  }

  OnBetFullfilled(socket: Socket, result: TDierollBetResult): void {
    socket.emit("dieroll:fullfilled", result);
  }
  
}
