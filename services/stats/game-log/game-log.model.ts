import { DB } from "@/database";
import { GameStatsSchema } from "../../../schema/game-stats.schema";
import { StatsUpdater } from "@utils/queue-manager/stats-updater";
export class GameLogModel {
    private readonly statsUpdater: StatsUpdater;
    constructor(){
        this.statsUpdater = new StatsUpdater();
        this.statsUpdater.InstantiateProcessQueueTimer();
    }
    public async UpdateOrAddStats(data: {account_id: string, bet:bigint,payout:bigint}) {
        let won_amount = data.payout - data.bet;
        let bet_amount = data.bet;
        this.statsUpdater.AddTask(data.account_id, {
            add_won_amount: won_amount,
            add_bet_amount: bet_amount,
        });
    }
}