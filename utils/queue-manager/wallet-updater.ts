import { DB } from "@/database";
import { balance_log } from "@schema/balance.schema";
import { wallets } from "@schema/wallets.schema";
import { eq } from "drizzle-orm";

export class WalletDBQueueHandler{
    
    private walletTasks: {[walletID: string]: number} = {};
    private walletQueue: {walletID: string, update: {balance: bigint}}[] = [];

    private timer: NodeJS.Timeout | null = null;

    private MAX_UPDATE_DELAY = 10000;
    
    public async AddOrUpdateWalletBalanceTask(walletID: string, balanceDelta: bigint,reason: "DEPOSIT"|"WITHDRAWAL"|"BET"|"BET_RETURN") {

        let index = this.walletTasks[walletID];

        await this.AddBalanceLog(walletID, balanceDelta < 0 ? -balanceDelta : balanceDelta, reason);
        
        if (index) {
            this.walletQueue[index].update.balance += balanceDelta;
        } else {
            let newLength = this.walletQueue.push({walletID: walletID, update: {balance: balanceDelta}});
            this.walletTasks[walletID] = newLength - 1;
        }
    }

    private async AddBalanceLog(walletID: string, balanceDelta: bigint, reason: "DEPOSIT"|"WITHDRAWAL"|"BET"|"BET_RETURN") {
        await DB.insert(balance_log).values({walletID: walletID, amount: balanceDelta, type: reason});
    }

    public InstantiateProcessQueueTimer() {
        this.timer = setInterval(() => {
            if (this.walletQueue.length <= 0) return;
            this.ProcessQueue();
        }, this.MAX_UPDATE_DELAY);
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
        
        while (currentQueue.length > 0) {
            let task = currentQueue.shift();
            if (!task) return;
            await this.processTask(task);
            this.RemoveWalletTask(task.walletID);
        }
    }

    private async processTask(task: {walletID: string, update: {balance: bigint}}) {
        let wallet = await DB.update(wallets).set({balance: task.update.balance}).where(eq(wallets.id, task.walletID));
        console.log(`Updated wallet ${task.walletID} balance to ${task.update.balance}`);
        return wallet;
    }
}