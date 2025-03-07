import { Server, Socket } from "socket.io";
import { Service } from "../../../utils/service/service";
import { ServiceRegistry } from "../../../utils/service/handler-registry";
import { DieRollBetType } from "./types";
import { z } from "zod";

class DieRollService extends Service {
  protected serviceName: string = "DieRoll";

  public override Handler(io: Server, socket: Socket): void {
    socket.on("dieroll:bet", (bet_data: z.infer<typeof DieRollBetType>) => {
      let parsed_data = this.ParseParams(bet_data, DieRollBetType, socket);
      if (!parsed_data) return;
      
      console.log("Starting Dieroll Bet", parsed_data);
    });
  }
}

export function Initialize(Handler: ServiceRegistry) {
  const DieRoll = new DieRollService();
  Handler.RegisterService(DieRoll);
}
