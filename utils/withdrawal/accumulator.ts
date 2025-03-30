import { DB } from "@/database";
import { RpcUtxosByAddressesEntry } from "@kcoin/kaspa-web3.js/dist/rpc/types";
import { utxos } from "@schema/utxos.schema";
import { eq, inArray } from "drizzle-orm";
import { createAccumulationTransaction } from "./accumulate";
import { wallets } from "@schema/wallets.schema";

type DBUtxoRecord = typeof utxos.$inferSelect;

export class Accumulator {
	private static instance: Accumulator;
	private utxos: RpcUtxosByAddressesEntry[] = [];
	private isSyncing: boolean = false;

	public static get Instance() {
		if (!Accumulator.instance) {
			Accumulator.instance = new Accumulator();
		}
		return Accumulator.instance;
	}

	public async addUtxos(utxos: RpcUtxosByAddressesEntry[]) {
		this.utxos = [...this.utxos, ...utxos];
	}

	public async getUtxos() {
		return this.utxos;
	}

	public async accumulate() {
		// Ensure UTXOs are synced
		await this.sync();

		// Filter out dust UTXOs (less than 1 KAS = 100,000,000 sompi)
		// Sort by amount (largest first) and take top 20
		const KAS_TO_SOMPI = 100000000;
		const utxosToAccumulate = this.utxos
			.filter((utxo) => (utxo.utxoEntry?.amount ?? 0) >= KAS_TO_SOMPI)
			.sort(
				(a, b) =>
					(b.utxoEntry?.amount || 0) - (a.utxoEntry?.amount || 0)
			)
			.slice(0, 10);

		// Skip if no UTXOs to accumulate
		if (utxosToAccumulate.length === 0) {
			console.log(
				"No UTXOs available for accumulation (either none exist or all are below 1 KAS)"
			);
			return null;
		}

		// Get private keys for the selected UTXOs
		// This assumes there's a way to retrieve the private keys for these addresses
		// You need to implement or use an existing method to retrieve these
		const addresses = [
			...new Set(utxosToAccumulate.map((utxo) => utxo.address)),
		];
		const privateKeysHex = await this.getPrivateKeysForAddresses(addresses);

		if (!privateKeysHex || privateKeysHex.length === 0) {
			console.error("Failed to retrieve private keys for selected UTXOs");
			return null;
		}

		// Create and broadcast the accumulation transaction
		const txHash = await createAccumulationTransaction(
			utxosToAccumulate,
			privateKeysHex
		);

		if (txHash) {
			console.log(
				`Successfully accumulated ${utxosToAccumulate.length} UTXOs to master wallet. TX: ${txHash}`
			);

			// Mark these UTXOs as spent in the database
			await this.markUtxosAsSpent(utxosToAccumulate);

			// Sync again to refresh the UTXO list
			await this.sync();
		}

		return txHash;
	}

	// Helper method to mark UTXOs as spent in the database
	private async markUtxosAsSpent(spentUtxos: RpcUtxosByAddressesEntry[]) {
		const spentTxIds = spentUtxos.map(
			(utxo) => utxo.outpoint?.transactionId || ""
		);
		const spentVouts = spentUtxos.map((utxo) => utxo.outpoint?.index || 0);

		// For each UTXO, update the database to mark it as spent
		for (let i = 0; i < spentTxIds.length; i++) {
			if (!spentTxIds[i]) continue; // Skip if transactionId is empty

			await DB.update(utxos)
				.set({ spent: true })
				.where(
					eq(utxos.txId, spentTxIds[i]) &&
						eq(utxos.vout, spentVouts[i])
				);
		}
	}

	// This method needs to be implemented based on your wallet implementation
	private async getPrivateKeysForAddresses(
		addresses: string[]
	): Promise<string[]> {
		const dbWallets = await DB.select()
			.from(wallets)
			.where(inArray(wallets.address, addresses));
		return dbWallets.map((wallet) => wallet.privateKey);
	}

	public async sync() {
		if (this.isSyncing) return;
		this.isSyncing = true;
		const dbUtxos = await DB.select()
			.from(utxos)
			.where(eq(utxos.spent, false));
		this.utxos = this.dbRecordsToRpcUtxo(dbUtxos);
		this.isSyncing = false;
	}

	private dbRecordsToRpcUtxo(
		records: DBUtxoRecord[]
	): RpcUtxosByAddressesEntry[] {
		return records.map((record) => ({
			address: record.address,
			outpoint: {
				transactionId: record.txId,
				index: record.vout,
			},
			utxoEntry: {
				amount: Number(record.amount),
				scriptPublicKey: record.scriptPubKey,
				blockDaaScore: record.blockDaaScore,
				isCoinbase: false,
			},
		}));
	}
}
