import { Generator, GeneratorSettings, NetworkId } from "@kcoin/kaspa-web3.js";
import type { PaymentOutput } from "@kcoin/kaspa-web3.js";
import { RpcUtxosByAddressesEntry } from "@kcoin/kaspa-web3.js/dist/rpc/types";
import { config } from "dotenv";
config();

function buildTransactionGenerator({
	outputs,
	utxos,
}: {
	outputs: PaymentOutput[];
	utxos: RpcUtxosByAddressesEntry[];
}): Generator {
	const generatorSettings = new GeneratorSettings(
		outputs,
		process.env.MASTER_CHANGE_ADDRESS!,
		utxos,
		process.env.NETWORK === "mainnet"
			? NetworkId.Mainnet
			: NetworkId.Testnet10
	);

	const generator = new Generator(generatorSettings);
    
	return generator;
}
