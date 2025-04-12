import { DB } from "@/database";
import { balance_log } from "@schema/balance.schema";
import { wallets } from "@schema/wallets.schema";
import { Wallet } from "@utils/account/wallet";
import { ObservableEvent } from "@utils/observables/event";
import { eq, sql } from "drizzle-orm";

const INTERVAL_TIME = 600_000;

export class WalletDBQueueHandler{
    
    private walletTasks: {[walletID: string]: number} = {};
    private walletQueue: {walletID: string, update: {delta: bigint}}[] = [];

    public WalletBalanceUpdatedEvent: ObservableEvent<{id:string, delta: bigint}> = new ObservableEvent();
    
    private timer: NodeJS.Timeout | null = null;

    
    public async AddOrUpdateWalletBalanceTask(walletID: string, delta: bigint, reason: "DEPOSIT"|"WITHDRAWAL"|"BET"|"BET_RETURN" | "REFERRAL_RETURN") {

        this.WalletBalanceUpdatedEvent.Raise({id: walletID, delta: delta});
        

        await this.AddBalanceLog(walletID, delta, reason);

        let index = this.walletTasks[walletID];        
        
        if (!index) {
            let newLength = this.walletQueue.push({walletID: walletID, update: {delta: 0n}});
            this.walletTasks[walletID] = newLength - 1;
        } 
        index = this.walletTasks[walletID];        
        this.walletQueue[index].update.delta += delta;
    }

    private async AddBalanceLog(walletID: string, delta: bigint, reason: "DEPOSIT"|"WITHDRAWAL"|"BET"|"BET_RETURN" | "REFERRAL_RETURN") {
        await DB.insert(balance_log).values({walletID: walletID, amount: delta, type: reason});
    }

    public InstantiateProcessQueueTimer() {
        this.timer = setInterval(() => {
            if (this.walletQueue.length <= 0) return;
            this.ProcessQueue();
        }, INTERVAL_TIME);
    }

    public ClearProcessQueueTimer() {
        if (!this.timer) return;
        
        clearInterval(this.timer);
        this.timer = null;
    }

    private RemoveWalletTask(walletID: string) {
        let index = this.walletTasks[walletID];
        this.walletQueue.splice(index, 1);
        delete this.walletTasks[walletID];
    }


    public async ProcessQueue() {
        let currentQueue = this.walletQueue;

        this.walletQueue = [];
        this.walletTasks = {};
        await DB.transaction(async (tx) => {
            while (currentQueue.length > 0) {
                let task = currentQueue.shift();
                if (!task) return;
                await tx.update(wallets).set({balance: sql`balance + ${task.update.delta}`}).where(eq(wallets.id, task.walletID));
                this.RemoveWalletTask(task.walletID);
            }
        })
    }

    public GetBalanceDeltaFromWalletID(walletID: string) {
        let index = this.walletTasks[walletID];
        if (!index) return 0n;
        return this.walletQueue[index].update.delta;
    }

}