import { Server, Socket } from "socket.io";
import { Service } from "../../../utils/service/service";
import { CoinflipController } from "./coinflip.controller";
import { AckFunction } from "../types";
import { BaseBetType } from "../types";
import { z } from "zod";
import { E_COINFLIP_OPTION } from "../../../schema/games/coinflip.schema";
import { CoinFlipClientMessage, CoinFlipServerMessage } from "./coinflip.messages";

export class CoinflipService extends Service {
    protected serviceName: string = "CoinflipService";
    private coinflipController:CoinflipController = new CoinflipController();
    
    override Handler(io: Server, socket: Socket): void {
        socket.on(CoinFlipClientMessage.GET_SESSION_SEED, (callback: (serverSeedHash:string,sessionId?:string) => void) => {
            this.coinflipController.NewSessionSeeds(socket, callback);
        });

        socket.on(CoinFlipClientMessage.CREATE_BET, (bet_data:z.infer<typeof BaseBetType>, ack: AckFunction) => {
            this.coinflipController.HandleNewBet(socket, bet_data, ack, this.HandleSessionStateChange, this.HandleSessionFullfilled, this.HandleSessionGameResult);
        });

        socket.on(CoinFlipClientMessage.CONTINUE_BET, (session_id:string, ack: AckFunction) => {
            this.coinflipController.HandleBetContinuation(socket, session_id, ack, this.HandleSessionStateChange, this.HandleSessionFullfilled, this.HandleSessionGameResult);
        });

        socket.on(CoinFlipClientMessage.FLIP_COIN, (session_id:string, choice:typeof E_COINFLIP_OPTION.enumValues[number], ack: AckFunction) => {
            this.coinflipController.HandleChoice(socket, session_id, choice, ack);
        });

        socket.on(CoinFlipClientMessage.SESSION_NEXT, (session_id:string, option:"CASHOUT" | "CONTINUE", ack: AckFunction) => {
            this.coinflipController.HandleNext(socket, session_id, option, ack);
        });
    }

    private HandleSessionStateChange(socket: Socket, newState: TSessionState) {
        socket.emit(CoinFlipServerMessage.GAME_CHANGE_STATE, newState);
    }

    private HandleSessionFullfilled(socket: Socket, server_seed: string, client_seed: string) {
        socket.emit(CoinFlipServerMessage.GAME_ENDED,{ server_seed, client_seed});
    }

    private HandleSessionGameResult(socket: Socket, result: "HEADS" | "TAILS", client_won: boolean) {
        socket.emit(CoinFlipServerMessage.FLIP_RESULT,{ result, client_won});
    }
}
