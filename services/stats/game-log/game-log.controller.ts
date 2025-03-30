import { Server } from "socket.io";
import { GameLogModel } from "./game-log.model";
import { EventBus } from "@utils/eventbus";

export class GameLogController {
    private readonly gameLogModel: GameLogModel;
    private readonly io: Server;

    constructor(io: Server) {
        this.io = io;
        this.gameLogModel = new GameLogModel();
        this.RegisterStatsUpdatedListener();
    }

    public handleNewLog(data: {account: {username: string,id: string},result: "WIN" | "LOSE" | "DRAW", bet:number,payout:number}) {
        this.gameLogModel.UpdateOrAddStats({
            account_id: data.account.id,
            bet: BigInt(data.bet),
            payout: BigInt(data.payout),
        });
        
        if (data.result === "WIN"){
            this.io.emit("log:new", {username: data.account.username, result: data.result, bet: data.bet, payout: data.payout});
        }
    }

    public handleStatsUpdated(){
        EventBus.Instance.emit("stats:updated");
    }

    private RegisterStatsUpdatedListener(){
        this.gameLogModel.OnStatsUpdated.RegisterEventListener(async () => {
            this.handleStatsUpdated();
        });
    }
}
