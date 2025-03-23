import { Server, Socket } from "socket.io";
import { Service } from "../../../utils/service/service";
import { CoinflipController, TCoinflipAck } from "./coinflip.controller";
import { BaseBetType } from "../types";
import { z } from "zod";
import { E_COINFLIP_OPTION } from "../../../schema/games/coinflip.schema";
import {
  CoinFlipClientMessage,
  CoinFlipServerMessage,
} from "./coinflip.messages";
import { Account } from "../../../utils/account";
import { TCoinflipSessionJSON } from "./entities/coinflip.session";

const CoinflipNamespaceName = "/games/coinflip";

class CoinflipService extends Service {
  private coinflipController: CoinflipController = new CoinflipController();

  override Handler(socket: Socket): void {
    socket.on(
      CoinFlipClientMessage.GET_SESSION,
      (
        callback: (
          serverSeedHash: string,
          session_data?: TCoinflipSessionJSON
        ) => void
      ) => {
        this.coinflipController.HandleGetSession(socket, callback);
      }
    );

    socket.on(
      CoinFlipClientMessage.FLIP_COIN,
      (
        choice: (typeof E_COINFLIP_OPTION.enumValues)[number],
        ack: (ack: TCoinflipAck) => void
      ) => {
        this.coinflipController.HandleFlip(socket, choice, ack);
      }
    );

    socket.on(
      CoinFlipClientMessage.SESSION_NEXT,
      (option: "CASHOUT" | "CONTINUE", ack: (ack: TCoinflipAck) => void) => {
        this.coinflipController.HandleNextChoice(socket, option, ack);
      }
    );
  }
}

export function InitializeCointFlip(io: Server) {
  let service = new CoinflipService(io);
  console.log("Service initialized CoinflipService");
  return service;
}
