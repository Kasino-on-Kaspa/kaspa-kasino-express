import { DB } from "@/database";
import { balance_log } from "@schema/balance.schema";
import { wallets } from "@schema/wallets.schema";
import { eq } from "drizzle-orm";

export class WalletDBQueueHandler{
    
    private walletTasks: {[walletID: string]: number} = {};
    private walletQueue: {walletID: string, update: {balance: bigint}}[] = [];

    private timer: NodeJS.Timeout | null = null;

    
    public async AddOrUpdateWalletBalanceTask(walletID: string, oldBalance: bigint, newBalance: bigint, reason: "DEPOSIT"|"WITHDRAWAL"|"BET"|"BET_RETURN") {

        let index = this.walletTasks[walletID];

        await this.AddBalanceLog(walletID, oldBalance, newBalance, reason);
        
        if (index) {
            this.walletQueue[index].update.balance = newBalance;
        } else {
            let newLength = this.walletQueue.push({walletID: walletID, update: {balance: newBalance}});
            this.walletTasks[walletID] = newLength - 1;
        }
    }

    private async AddBalanceLog(walletID: string, oldBalance: bigint, newBalance: bigint, reason: "DEPOSIT"|"WITHDRAWAL"|"BET"|"BET_RETURN") {
        await DB.insert(balance_log).values({walletID: walletID, amount: newBalance - oldBalance, type: reason});
    }

    public InstantiateProcessQueueTimer() {
        this.timer = setInterval(() => {
            if (this.walletQueue.length <= 0) return;
            this.ProcessQueue();
        }, 1000);
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
        console.log("Processing queue");
        await DB.transaction(async (tx) => {
            while (currentQueue.length > 0) {
                let task = currentQueue.shift();
                if (!task) return;
                await tx.update(wallets).set({balance: task.update.balance}).where(eq(wallets.id, task.walletID));
                this.RemoveWalletTask(task.walletID);
            }
        })
    }

}