import { Server, Socket } from "socket.io";
import { Service } from "../../../utils/service/service";
import { CoinFlipController } from "./coinflip.controller";
import { TCoinflipPreviousGame } from "./coinflip.types";

export class CoinFlipService extends Service {
  protected serviceName: string = "CoinflipService";
  private controller = new CoinFlipController();

  override Handler(io: Server, socket: Socket): void {
    socket.on(
      "coinflip:new",
      (callback: (session: TCoinflipPreviousGame) => void) => {
        this.controller.HandleNewSession(socket,callback);
      }
    );
    
  }
}
