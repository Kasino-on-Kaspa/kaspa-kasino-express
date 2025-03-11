import { rpcClient } from ".";

export class WalletBalanceProvider {
	public async getUtxos(address: string) {
		const utxos = await rpcClient.getUtxosByAddresses([address]);
		return utxos;
	}
}
