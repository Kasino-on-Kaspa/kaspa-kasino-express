import { DB } from "@/database";
import { GameStatsSchema } from "@schema/game-stats.schema";
import { ObservableEvent } from "@utils/observables/event";
import { sql } from "drizzle-orm";

const INTERVAL_TIME = 60_000;

export class StatsUpdater {
  private accountStats: { [accountID: string]: number } = {};
  private taskQueue: {
    accountID: string;
    update: { add_won_amount: bigint; add_bet_amount: bigint };
  }[] = [];

  private statsUpdatedEvent: ObservableEvent<void> = new ObservableEvent<void>();

  public get StatsUpdatedEvent(){
    return this.statsUpdatedEvent;
  }

  private timer: NodeJS.Timeout | null = null;

  public async AddTask(
    accountID: string,
    update: { add_won_amount?: bigint; add_bet_amount?: bigint }
  ) {
    let index = this.accountStats[accountID];
    if (!index) {
      let newLength = this.taskQueue.push({
        accountID: accountID,
        update: {
          add_won_amount: update.add_won_amount ?? 0n,
          add_bet_amount: update.add_bet_amount ?? 0n,
        },
      });

      this.accountStats[accountID] = newLength - 1;
      return;
    }
    
    this.taskQueue[index].update = {
      add_won_amount:
        this.taskQueue[index].update.add_won_amount +
        (update.add_won_amount ?? 0n),
      add_bet_amount:
        this.taskQueue[index].update.add_bet_amount +
        (update.add_bet_amount ?? 0n),
    };
  }

  public async GetStatByAccountID(accountID: string) {
    return this.accountStats[accountID];
  }

  public async ProcessQueue() {
    if (!this.timer) return;
    let tasks = this.taskQueue;
    this.taskQueue = [];
    this.accountStats = {};
    while (tasks.length > 0) {
      const task = tasks.shift();
      if (!task) return;
      await this.UpdateStats(task);
    }
    this.statsUpdatedEvent.Raise();
  }

  public async UpdateStats(task: {accountID: string, update: {add_won_amount: bigint, add_bet_amount: bigint}}) {
    await DB.insert(GameStatsSchema).values({
      account_id: task.accountID,
      total_won_amount: task.update.add_won_amount,
      total_bet_amount: task.update.add_bet_amount,
    }).onConflictDoUpdate({
      target: [GameStatsSchema.account_id],
      set: {
        total_won_amount: sql`${GameStatsSchema.total_won_amount} + ${task.update.add_won_amount}`,
        total_bet_amount: sql`${GameStatsSchema.total_bet_amount} + ${task.update.add_bet_amount}`,
      },
    });
  }


  public InstantiateProcessQueueTimer() {
    this.timer = setInterval(() => this.ProcessQueue(), INTERVAL_TIME);
  }

  public ClearProcessQueueTimer() {
    if (!this.timer) return;

    clearInterval(this.timer);
    this.timer = null;
  }
}
