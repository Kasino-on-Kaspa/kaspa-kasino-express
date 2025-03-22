import { PaymentOutput, Address } from "@kcoin/kaspa-web3.js";
import { createWithdrawalTransaction } from "./withdraw";
import { DB } from "../../database";
import { transactions, E_TRANSACTION_TYPE } from "../../schema/transactions.schema";
import { balance_log, E_BALANCE_LOG_TYPE } from "../../schema/balance.schema";

type WithdrawalQueueItem = {
    address: string,
    amount: bigint,
    createdAt: number,
    retryCount: number,
    userId: string,  // User ID for transaction recording
}

export class WithdrawalQueue {
    private static instance: WithdrawalQueue | null = null;
    private queue: WithdrawalQueueItem[] = [];
    private isProcessing: boolean = false;
    private lastProcessedTime: number = 0;
    private processingTimer: NodeJS.Timeout | null = null;
    
    private readonly MAX_BATCH_SIZE = 20;
    private readonly MIN_GAP_MS = 5000; // 5 seconds
    private readonly PROCESS_DELAY_MS = 30000; // 30 seconds
    private readonly MAX_RETRIES = 3;

    private constructor() {}

    public static getInstance(): WithdrawalQueue {
        if (!WithdrawalQueue.instance) {
            WithdrawalQueue.instance = new WithdrawalQueue();
        }
        return WithdrawalQueue.instance;
    }

    public add(address: string, amount: bigint, userId: string) {
        this.queue.push({
            address,
            amount,
            createdAt: Date.now(),
            retryCount: 0,
            userId,
        });

        // Clear existing timer if any
        if (this.processingTimer) {
            clearTimeout(this.processingTimer);
        }

        // Schedule processing
        if (this.queue.length >= this.MAX_BATCH_SIZE) {
            // If we have enough items, process as soon as minimum gap allows
            const timeSinceLastProcess = Date.now() - this.lastProcessedTime;
            const timeToWait = Math.max(0, this.MIN_GAP_MS - timeSinceLastProcess);
            this.processingTimer = setTimeout(() => this.processQueue(), timeToWait);
        } else {
            // Otherwise, schedule for the standard delay
            this.processingTimer = setTimeout(() => this.processQueue(), this.PROCESS_DELAY_MS);
        }
    }

    private async processQueue() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        const timeSinceLastProcess = Date.now() - this.lastProcessedTime;
        if (timeSinceLastProcess < this.MIN_GAP_MS) {
            // If we haven't waited long enough, schedule for later
            this.processingTimer = setTimeout(
                () => this.processQueue(),
                this.MIN_GAP_MS - timeSinceLastProcess
            );
            return;
        }

        this.isProcessing = true;

        try {
            // Take up to MAX_BATCH_SIZE items from the queue
            const itemsToProcess = this.queue.slice(0, this.MAX_BATCH_SIZE);
            
            // Create outputs for all items in this batch
            const outputs: PaymentOutput[] = itemsToProcess.map(item => ({
                address: Address.fromString(item.address),
                amount: item.amount
            }));

            const txHash = await createWithdrawalTransaction(outputs);

            if (txHash) {
                // Record transactions in the database
                const transactionRecords = itemsToProcess.map(item => ({
                    txId: txHash,
                    value: item.amount,
                    type: "WITHDRAWAL" as const,
                    user: item.userId,
                    createdAt: new Date()
                }));

                // Record balance log entries
                const balanceLogRecords = itemsToProcess.map(item => ({
                    account: item.userId,
                    amount: -item.amount, // Negative amount for withdrawals
                    type: "WITHDRAWAL" as const,
                    created_at: new Date()
                }));

                // Insert both transaction and balance log records
                await DB.transaction(async (tx) => {
                    await tx.insert(transactions).values(transactionRecords);
                    await tx.insert(balance_log).values(balanceLogRecords);
                });

                // Remove the processed items from queue only if successful
                this.queue.splice(0, itemsToProcess.length);
                console.log(`Batch withdrawal processed successfully. Transaction hash: ${txHash}`);
            } else {
                // Increment retry count for failed items
                itemsToProcess.forEach((item, index) => {
                    if (this.queue[index].retryCount >= this.MAX_RETRIES) {
                        console.error(`Maximum retries reached for withdrawal to ${item.address}`);
                        // Remove items that have reached max retries
                        this.queue.shift();
                    } else {
                        this.queue[index].retryCount++;
                    }
                });
                console.error(`Failed to process batch withdrawal`);
            }
        } catch (error) {
            console.error('Error processing withdrawal batch:', error);
        } finally {
            this.isProcessing = false;
            this.lastProcessedTime = Date.now();
            
            // If there are more items in the queue, schedule next processing
            if (this.queue.length > 0) {
                this.processingTimer = setTimeout(
                    () => this.processQueue(),
                    Math.min(
                        this.PROCESS_DELAY_MS,
                        this.queue.length >= this.MAX_BATCH_SIZE ? this.MIN_GAP_MS : this.PROCESS_DELAY_MS
                    )
                );
            }
        }
    }

    public getQueueLength(): number {
        return this.queue.length;
    }

    public getPendingWithdrawals(): WithdrawalQueueItem[] {
        return [...this.queue];
    }
}