import { WalletService } from "./wallet.service";
import { AccountStoreInstance } from "../..";
import { Account } from "../../utils/account";

export class BalanceManagerService {
	private static instance: BalanceManagerService;
	private updateInterval: NodeJS.Timeout | null = null;
	private readonly DEFAULT_UPDATE_INTERVAL_MS = 60000; // Default: check every minute
	private readonly DEFAULT_MIN_UPDATE_THRESHOLD_MS = 300000; // Default: 5 minutes
	private updateIntervalMs: number;
	private minUpdateThresholdMs: number;
	private lastUpdated: Record<string, number> = {};

	private constructor() {
		// Initialize with default values
		this.updateIntervalMs = this.DEFAULT_UPDATE_INTERVAL_MS;
		this.minUpdateThresholdMs = this.DEFAULT_MIN_UPDATE_THRESHOLD_MS;
	}

	public static getInstance(): BalanceManagerService {
		if (!BalanceManagerService.instance) {
			BalanceManagerService.instance = new BalanceManagerService();
		}
		return BalanceManagerService.instance;
	}

	// Configure update intervals
	public configure(options: {
		updateIntervalMs?: number;
		minUpdateThresholdMs?: number;
	}): void {
		if (options.updateIntervalMs !== undefined) {
			this.updateIntervalMs = options.updateIntervalMs;
		}

		if (options.minUpdateThresholdMs !== undefined) {
			this.minUpdateThresholdMs = options.minUpdateThresholdMs;
		}

		// Restart the interval if it's already running
		if (this.updateInterval) {
			this.stopPeriodicUpdates();
			this.startPeriodicUpdates();
		}

		console.log(
			`Balance manager configured: interval=${this.updateIntervalMs}ms, threshold=${this.minUpdateThresholdMs}ms`
		);
	}

	public startPeriodicUpdates(): void {
		if (this.updateInterval) return;

		console.log(
			`Starting periodic balance updates (every ${this.updateIntervalMs}ms)`
		);
		this.updateInterval = setInterval(() => {
			this.updateAllBalances();
		}, this.updateIntervalMs);
	}

	public stopPeriodicUpdates(): void {
		if (this.updateInterval) {
			clearInterval(this.updateInterval);
			this.updateInterval = null;
			console.log("Stopped periodic balance updates");
		}
	}

	private async updateAllBalances(): Promise<void> {
		console.log("Running periodic balance update check");
		const accounts = AccountStoreInstance.GetAllAccounts();

		for (const [socketId, account] of Object.entries(accounts)) {
			try {
				const typedAccount = account as Account;

				// Only update if it's been more than the threshold since last update
				const now = Date.now();
				const lastUpdate = this.lastUpdated[typedAccount.Address] || 0;
				if (now - lastUpdate < this.minUpdateThresholdMs) continue;

				const result = await WalletService.updateWalletBalance(
					typedAccount.Address
				);

				this.lastUpdated[typedAccount.Address] = now;
				console.log(
					`Updated balance for ${typedAccount.Address}: ${result.balance}`
				);
			} catch (error) {
				console.error(`Failed to update balance for account: ${error}`);
			}
		}
	}

	// Method to manually trigger a balance update for a specific user
	public async updateUserBalance(
		address: string,
		socketId: string
	): Promise<number> {
		try {
			const result = await WalletService.updateWalletBalance(address);
			await AccountStoreInstance.UpdateBalanceFromBlockchain(
				socketId,
				result.balance
			);
			this.lastUpdated[address] = Date.now();
			return result.balance;
		} catch (error) {
			console.error(`Failed to update balance for ${address}: ${error}`);
			throw error;
		}
	}
}
