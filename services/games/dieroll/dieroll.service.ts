import { DefaultEventsMap, Server, Socket } from "socket.io";
import { Service } from "../../../utils/service/service";
import { DieRollController } from "./dieroll.controller";
import { DieRollBetType, TDierollBetResult } from "./dieroll.types";
import { z } from "zod";
import { AckFunction } from "../types";
import { DieRollClientMessage, DieRollServerMessage } from "./dieroll.messages";

const DierollNamespaceName = "/games/dieroll"
class DieRollService extends Service {

  private controller: DieRollController = new DieRollController();

  public override Handler(socket: Socket): void {
    socket.on(
      DieRollClientMessage.PLACE_BET,
      (bet_data: z.infer<typeof DieRollBetType>, ack: AckFunction) => {
        return this.controller.HandleBet(
          socket,
          bet_data,
          ack,
          this.OnBetFullfilled
        );
      }
    );

    socket.on(
      DieRollClientMessage.GET_SESSION_SEEDS,      
      (callback: (serverSeedHash: string) => void) => {
        let seeds = this.controller.HandleGenerate(socket.id);
        callback(seeds.serverSeedHash);
      }
    );
  }

  OnBetFullfilled(socket: Socket, result: TDierollBetResult): void {
    let parseableResult = {
      ...result,
      payout: result.payout.toString(),
      betAmount: result.betAmount.toString(),
    }

    console.log("OnBetFullfilled", parseableResult);
    socket.emit(DieRollServerMessage.ROLL_RESULT, parseableResult);
  }
}

export function InitializeDierollService(io:Server){
  return new DieRollService(io,DierollNamespaceName)
}
