import { Server } from "socket.io";
import { GameLogModel } from "./game-log.model";

export class GameLogController {
    private readonly gameLogModel: GameLogModel;
    private readonly io: Server;

    constructor(io: Server) {
        this.io = io;
        this.gameLogModel = new GameLogModel();
    }

    public handleNewLog(data: {account: {username: string,id: string},result: boolean, bet:number,payout:number}) {
        this.gameLogModel.UpdateOrAddStats({
            account_id: data.account.id,
            bet: BigInt(data.bet),
            payout: BigInt(data.payout),
        });
        
        this.io.emit("log:new", {username: data.account.username, result: data.result, bet: data.bet, payout: data.payout});
    }
}
