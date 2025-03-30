import { Service } from "@utils/service/service";
import { Server, Socket } from "socket.io";
import { GameLogController } from "./game-log.controller";
import { Express } from "express";

export class GameLogService extends Service {
    private readonly gameLogController: GameLogController;

    constructor(io: Server, express: Express) {
        super(io, express);
        this.gameLogController = new GameLogController(io);
    }


    public override ServerEventsHandler(){
        this.server.on("gamelog:new", (data: {account: {username: string,id: string},result: "WIN" | "LOSE" | "DRAW", bet:number,payout:number}) => {
            this.handleNewLog(data);
        });
    }
    
    private handleNewLog(data: {account: {username: string,id: string},result: "WIN" | "LOSE" | "DRAW", bet:number , payout:number}) {
        this.gameLogController.handleNewLog(data);
    }

}

export function InitializeGameLogService(io: Server, express: Express) {
    const gameLogService = new GameLogService(io, express);
    return gameLogService;
}