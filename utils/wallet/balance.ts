import { rpcClient } from ".";

export class WalletBalanceProvider {
	public static async getUtxos(addresses: string[]) {
		const utxos = await rpcClient.getUtxosByAddresses(addresses);
		return utxos.entries;
	}
}
