import { Server, Socket } from "socket.io";
import { Service } from "../../../utils/service/service";
import { CoinflipController } from "./coinflip.controller";
import { AckFunction } from "../types";
import { BaseBetType } from "../types";
import { CoinflipSessionContext } from "./entities/coinflip.context";
import { z } from "zod";
import { E_COINFLIP_OPTION } from "../../../schema/games/coinflip.schema";
import { CoinFlipClientMessage, CoinFlipServerMessage } from "./coinflip.messages";

export class CoinflipService extends Service {
    protected serviceName: string = "CoinflipService";
    private coinflipController:CoinflipController = new CoinflipController();
    
    override Handler(io: Server, socket: Socket): void {
        socket.on("coinflip:session", (callback: (serverSeedHash:string,sessionId?:string) => void) => {
            this.coinflipController.NewSessionSeeds(socket, callback);
        });

        socket.on(CoinFlipClientMessage.PLACE_BET, (bet_data:z.infer<typeof BaseBetType>, ack: AckFunction) => {
            this.coinflipController.HandleNewBet(socket, bet_data, ack, this.HandleSessionStateChange);
        });

        socket.on("coinflip:continue", (session_id:string, ack: AckFunction) => {
            this.coinflipController.HandleBetContinuation(socket, session_id, ack, this.HandleSessionStateChange);
        });

        socket.on(CoinFlipClientMessage.FLIP_COIN, (session_id:string, choice:typeof E_COINFLIP_OPTION.enumValues[number], ack: AckFunction) => {
            this.coinflipController.HandleChoice(socket, session_id, choice, ack);
        });

        socket.on("coinflip:next", (session_id:string, option:"CASHOUT" | "CONTINUE", ack: AckFunction) => {
            this.coinflipController.HandleNext(socket, session_id, option, ack);
        });
    }

    private HandleSessionStateChange(socket: Socket, newState: TSessionState) {
        socket.emit(CoinFlipServerMessage.GAME_STATE, newState);
    }
}
