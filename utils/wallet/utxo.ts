import { RpcUtxosByAddressesEntry } from "@kcoin/kaspa-web3.js/dist/rpc/types";
import {
	Address,
	Generator,
	GeneratorSettings,
	NetworkId,
	PaymentOutput,
	RpcClient,
	SendKasParams,
	UtxoEntryReference,
} from "@kcoin/kaspa-web3.js";

interface UtxoStoreParams {
	rpc: RpcClient;
	utxos: RpcUtxosByAddressesEntry[];
	utxosInUse: RpcUtxosByAddressesEntry[];
}

export class UtxoStore {
	utxos: RpcUtxosByAddressesEntry[];
	utxosInUse: RpcUtxosByAddressesEntry[] = [];
	rpc: RpcClient;

	constructor(params: UtxoStoreParams) {
		this.rpc = params.rpc;
		this.utxos = params.utxos;
	}

	public async fetchUtxos(address: string) {
		const rpcUtxos = await this.rpc.getUtxosByAddresses([address]);
		const localUtxos = this.utxos.filter(
			(utxo) => utxo.address === address
		);
		const seenUtxos = new Set();
		const uniqueUtxos = [...rpcUtxos.entries, ...localUtxos].filter(
			(utxo) => {
				if (utxo.outpoint) {
					const key = `${utxo.outpoint.transactionId}-${utxo.outpoint.index}`;
					if (seenUtxos.has(key)) return false;
					seenUtxos.add(key);
				}
				return true;
			}
		);
		return uniqueUtxos;
	}

	public addUtxo(utxo: RpcUtxosByAddressesEntry) {
		if (this.utxos.find((u) => u == utxo)) return;
		this.utxos.push(utxo);
	}

	public markUtxosInUse(utxos: RpcUtxosByAddressesEntry[]) {
		this.utxosInUse.push(...utxos);
	}

	public markUtxosUnused(utxos: RpcUtxosByAddressesEntry[]) {
		this.utxosInUse = this.utxosInUse.filter((u) => !utxos.includes(u));
	}

	public get getUnusedUtxos() {
		return this.utxos.filter((utxo) => !this.utxosInUse.includes(utxo));
	}

	public async generateTransaction(outputs: PaymentOutput[]) {
		const generatorSettings = new GeneratorSettings(
			outputs,
			Address.fromString(this.utxos[0].address),
			this.getUnusedUtxos,
			NetworkId.Testnet10
		);

		const generator = new Generator(generatorSettings);

        const tx = generator.generateTransaction()

		return;
	}
}
