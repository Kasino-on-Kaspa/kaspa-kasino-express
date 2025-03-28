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
};

export class WithdrawalQueue {
	private static instance: WithdrawalQueue | null = null;
	private queue: WithdrawalQueueItem[] = [];
	private isProcessing: boolean = false;
	private processingTimer: NodeJS.Timeout | null = null;
	private currentProcessingPromise: Promise<void> | null = null;

	private readonly RETRY_DELAY_MS = 30000; // 30 seconds between retries
	private readonly MAX_RETRIES = 3;
	private readonly PROCESS_CHECK_INTERVAL = 1000; // Check queue every second
	private readonly ORPHAN_RETRY_DELAY_MS = 2000; // 2 seconds for orphan transactions

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
				const nextItem = this.queue[0];
				const now = Date.now();

				// Skip if the item is waiting for retry
				if (nextItem.nextRetryTime && nextItem.nextRetryTime > now) {
					this.processingTimer = setTimeout(checkQueue, this.PROCESS_CHECK_INTERVAL);
					return;
				}

				// Start processing without waiting for the promise to complete
				this.currentProcessingPromise = this.processNextTransaction();
				this.currentProcessingPromise.catch(error => {
					console.error("Error in processing promise:", error);
					this.currentProcessingPromise = null;
				});
			}
			this.processingTimer = setTimeout(checkQueue, this.PROCESS_CHECK_INTERVAL);
		};
		checkQueue();
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
		// Sort queue by nextRetryTime or createdAt
		this.queue.sort((a, b) => {
			const aTime = a.nextRetryTime || a.createdAt;
			const bTime = b.nextRetryTime || b.createdAt;
			return aTime - bTime;
		});
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
		console.log("Processing withdrawal transaction", nextItem.address, nextItem.amount);

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
				console.log(`Withdrawal processed successfully. Transaction hash: ${txHash}`);
			} else {
				// Handle failed transaction
				if (nextItem.retryCount >= this.MAX_RETRIES) {
					console.error(`Maximum retries reached for withdrawal to ${nextItem.address}`);
					this.queue.shift(); // Remove from queue after max retries
				} else {
					// Schedule retry
					nextItem.retryCount++;
					nextItem.nextRetryTime = now + (this.RETRY_DELAY_MS * nextItem.retryCount);
					console.log(`Withdrawal failed, scheduled retry ${nextItem.retryCount} for ${nextItem.address}`);
				}
			}
		} catch (error: any) {
			console.error("Error processing withdrawal:", error);
			
			// Check if the error indicates the transaction was already accepted
			if (error?.message?.includes("was already accepted by the consensus")) {
				// Extract transaction hash from the error message
				const txHashMatch = error.message.match(/transaction ([a-f0-9]+) was already accepted/);
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
					console.log(`Withdrawal already processed. Transaction hash: ${txHash}`);
					return;
				}
			}

			// Check if the error is an orphan transaction error
			if (error?.message?.includes("is an orphan where orphan is disallowed")) {
				console.log(`Transaction is orphaned, will retry with longer delay for ${nextItem.address}`);
				if (nextItem.retryCount >= this.MAX_RETRIES) {
					console.error(`Maximum retries reached for orphaned withdrawal to ${nextItem.address}`);
					this.queue.shift();
				} else {
					nextItem.retryCount++;
					// Use longer delay for orphan transactions
					nextItem.nextRetryTime = now + (this.ORPHAN_RETRY_DELAY_MS * nextItem.retryCount);
					console.log(`Orphaned withdrawal, scheduled retry ${nextItem.retryCount} for ${nextItem.address}`);
				}
				return;
			}

			// Handle other errors similar to failed transaction
			if (nextItem.retryCount >= this.MAX_RETRIES) {
				console.error(`Maximum retries reached for withdrawal to ${nextItem.address}`);
				this.queue.shift();
			} else {
				nextItem.retryCount++;
				nextItem.nextRetryTime = now + (this.RETRY_DELAY_MS * nextItem.retryCount);
				console.log(`Withdrawal error, scheduled retry ${nextItem.retryCount} for ${nextItem.address}`);
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
