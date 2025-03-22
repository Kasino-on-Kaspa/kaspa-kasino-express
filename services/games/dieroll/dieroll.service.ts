import { DefaultEventsMap, Server, Socket } from "socket.io";
import { Service } from "../../../utils/service/service";
import { DieRollController, TDieRollAck } from "./dieroll.controller";
import { DieRollBetType } from "./dieroll.types";
import { z } from "zod";
import { DieRollClientMessage } from "./dieroll.messages";
import { TDierollSessionJSON } from "./entities/dieroll.session";

const DierollNamespaceName = "/games/dieroll"

class DieRollService extends Service {

  private controller: DieRollController = new DieRollController();

  public override Handler(socket: Socket): void {
    socket.on(
      DieRollClientMessage.PLACE_BET,
      (bet_data: z.infer<typeof DieRollBetType>, ack: (ack: TDieRollAck) => void) => {
        return this.controller.HandleRoll(
          socket,
          bet_data,
          ack
        );
      }
    );

    socket.on(
      DieRollClientMessage.GET_SESSION_SEEDS,      
      (callback: (serverSeedHash: string, session_data?: TDierollSessionJSON) => void) => {
        this.controller.HandleGetSession(socket,callback);
      }
    );
    
  }

  
}

export function InitializeDierollService(io:Server){
  return new DieRollService(io,DierollNamespaceName)
}
