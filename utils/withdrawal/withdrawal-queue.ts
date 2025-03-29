import { PaymentOutput, Address } from "@kcoin/kaspa-web3.js";
import { createWithdrawalTransaction } from "./withdraw";
import { DB } from "../../database";
import {
  transactions,
  E_TRANSACTION_TYPE,
} from "../../schema/transactions.schema";
import { balance_log, E_BALANCE_LOG_TYPE } from "../../schema/balance.schema";

type WithdrawalQueueItem = {
  address: string;
  amount: bigint;
  createdAt: number;
  retryCount: number;
  userId: string;
  nextRetryTime?: number; // When to retry if failed
  lastError?: string; // Store the last error message
};

export class WithdrawalQueue {
  private static instance: WithdrawalQueue | null = null;
  private queue: WithdrawalQueueItem[] = [];
  private isProcessing: boolean = false;
  private processingTimer: NodeJS.Timeout | null = null;
  private currentProcessingPromise: Promise<void> | null = null;

  // Retry configuration
  private readonly BASE_RETRY_DELAY_MS = 5000; // 5 seconds base delay
  private readonly MAX_RETRY_DELAY_MS = 300000; // 5 minutes maximum delay
  private readonly MAX_RETRIES = 5; // Increased max retries
  private readonly PROCESS_CHECK_INTERVAL = 1000; // Check queue every second
  private readonly ORPHAN_RETRY_FACTOR = 2; // Double the delay for orphan transactions

  private constructor() {
    // Start the processing loop
    this.startProcessingLoop();
  }

  public static get Instance(): WithdrawalQueue {
    if (!WithdrawalQueue.instance) {
      WithdrawalQueue.instance = new WithdrawalQueue();
    }
    return WithdrawalQueue.instance;
  }

  private startProcessingLoop() {
    const checkQueue = async () => {
      if (!this.isProcessing && this.queue.length > 0) {
        // Sort queue by nextRetryTime or createdAt
        this.sortQueue();
        
        const nextItem = this.queue[0];
        const now = Date.now();

        // Skip if the item is waiting for retry
        if (nextItem.nextRetryTime && nextItem.nextRetryTime > now) {
          this.processingTimer = setTimeout(
            checkQueue,
            this.PROCESS_CHECK_INTERVAL
          );
          return;
        }

        // Start processing without waiting for the promise to complete
        this.currentProcessingPromise = this.processNextTransaction();
        this.currentProcessingPromise.catch((error) => {
          console.error("Error in processing promise:", error);
          this.currentProcessingPromise = null;
        });
      }
      this.processingTimer = setTimeout(
        checkQueue,
        this.PROCESS_CHECK_INTERVAL
      );
    };
    checkQueue();
  }

  private sortQueue() {
    // Sort queue by nextRetryTime or createdAt
    this.queue.sort((a, b) => {
      const aTime = a.nextRetryTime || a.createdAt;
      const bTime = b.nextRetryTime || b.createdAt;
      return aTime - bTime;
    });
  }

  // Calculate retry delay using exponential backoff with jitter
  private calculateRetryDelay(retryCount: number, isOrphan: boolean = false): number {
    // Exponential backoff: base * 2^retryCount
    let delay = this.BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
    
    // Apply orphan factor if needed
    if (isOrphan) {
      delay *= this.ORPHAN_RETRY_FACTOR;
    }
    
    // Add jitter (±20%)
    const jitter = delay * 0.2;
    delay += Math.random() * jitter * 2 - jitter;
    
    // Cap at max delay
    return Math.min(delay, this.MAX_RETRY_DELAY_MS);
  }

  public add(address: string, amount: bigint, userId: string) {
    console.log("Adding withdrawal request to queue", address, amount);
    this.queue.push({
      address,
      amount,
      createdAt: Date.now(),
      retryCount: 0,
      userId,
    });
    this.sortQueue();
  }

  private async processNextTransaction(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    const now = Date.now();
    const nextItem = this.queue[0];
    
    // Skip if the item is waiting for retry
    if (nextItem.nextRetryTime && nextItem.nextRetryTime > now) {
      return;
    }

    this.isProcessing = true;
    console.log(
      "Processing withdrawal transaction",
      nextItem.address,
      nextItem.amount
    );

    try {
      const output: PaymentOutput = {
        address: Address.fromString(nextItem.address),
        amount: nextItem.amount,
      };

      const txHash = await createWithdrawalTransaction([output]);

      if (txHash) {
        // Record successful transaction
        await DB.insert(transactions).values({
          txId: txHash,
          value: nextItem.amount,
          type: "WITHDRAWAL" as const,
          user: nextItem.userId,
          createdAt: new Date(),
        });

        // Remove the processed item from queue
        this.queue.shift();
        console.log(
          `Withdrawal processed successfully. Transaction hash: ${txHash}`
        );
      } else {
        // Should not happen as createWithdrawalTransaction should throw on failure
        throw new Error("Withdrawal function returned null unexpectedly");
      }
    } catch (error: any) {
      console.error("Error processing withdrawal:", error);
      const errorMessage = error?.message || "Unknown error";
      nextItem.lastError = errorMessage;

      // Check if the error indicates the transaction was already accepted
      if (errorMessage.includes("was already accepted by the consensus")) {
        // Extract transaction hash from the error message
        const txHashMatch = errorMessage.match(
          /transaction ([a-f0-9]+) was already accepted/
        );
        if (txHashMatch) {
          const txHash = txHashMatch[1];
          // Record successful transaction
          await DB.insert(transactions).values({
            txId: txHash,
            value: nextItem.amount,
            type: "WITHDRAWAL" as const,
            user: nextItem.userId,
            createdAt: new Date(),
          });
          // Remove the processed item from queue
          this.queue.shift();
          console.log(
            `Withdrawal already processed. Transaction hash: ${txHash}`
          );
          return;
        }
      }

      // Handle all errors by moving the transaction to the next position
      if (nextItem.retryCount >= this.MAX_RETRIES) {
        console.error(
          `Maximum retries reached for withdrawal to ${nextItem.address}. Last error: ${nextItem.lastError}`
        );
        // TODO: Consider adding a failed transactions log or sending notifications
        this.queue.shift();
      } else {
        // Update retry count and move to next position in queue
        nextItem.retryCount++;
        
        // Check for specific error types to determine retry strategy
        const isOrphanError = errorMessage.includes("is an orphan where orphan is disallowed");
        const isNoMatureUtxos = errorMessage.includes("No mature UTXOs available for withdrawal");
        
        // Calculate appropriate retry delay
        const retryDelay = this.calculateRetryDelay(nextItem.retryCount, isOrphanError);
        nextItem.nextRetryTime = now + retryDelay;
        
        // Log appropriate message based on error type
        if (isOrphanError) {
          console.log(
            `Orphaned withdrawal, moved to next position in queue for retry ${nextItem.retryCount} for ${nextItem.address}. Will retry in ${retryDelay}ms`
          );
        } else if (isNoMatureUtxos) {
          console.log(
            `No mature UTXOs available, moved to next position in queue for retry ${nextItem.retryCount} for ${nextItem.address}. Will retry in ${retryDelay}ms`
          );
        } else {
          console.log(
            `Withdrawal error, moved to next position in queue for retry ${nextItem.retryCount} for ${nextItem.address}. Will retry in ${retryDelay}ms. Error: ${errorMessage}`
          );
        }
        
        // Remove from front of queue and add to the next position
        const currentItem = this.queue.shift()!;
        
        // Only insert at position 1 if there are other items in the queue
        if (this.queue.length > 0) {
          // If no mature UTXOs are available, move to the end of the queue
          // as this will likely affect all transactions
          if (isNoMatureUtxos) {
            this.queue.push(currentItem);
            console.log("No mature UTXOs error - moved item to end of queue");
          } else {
            // For other errors, just move to the next position
            this.queue.splice(1, 0, currentItem);
          }
        } else {
          this.queue.push(currentItem);
        }
        
        // Resort the queue after modification
        this.sortQueue();
      }
    } finally {
      this.isProcessing = false;
    }
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public getPendingWithdrawals(): WithdrawalQueueItem[] {
    return [...this.queue];
  }
}
