import { Fees, FeeSource, Generator, GeneratorSettings, NetworkId } from "@kcoin/kaspa-web3.js";
import type { PaymentOutput } from "@kcoin/kaspa-web3.js";
import { RpcUtxosByAddressesEntry } from "@kcoin/kaspa-web3.js/dist/rpc/types";
import { config } from "dotenv";
import { kasToSompi } from "../constants";
config();

export function buildTransactionGenerator({
	outputs,
	utxos,
}: {
	outputs: PaymentOutput[];
	utxos: RpcUtxosByAddressesEntry[];
}): Generator {
	const calculatedFee = calculatePriorityFee(utxos.length, outputs.length);
	const generatorSettings = new GeneratorSettings(
		outputs,
		process.env.MASTER_ADDRESS!,
		utxos,
		process.env.NETWORK === "mainnet"
			? NetworkId.Mainnet
			: NetworkId.Testnet10,
		new Fees(calculatedFee, FeeSource.SenderPays),
	);

	const generator = new Generator(generatorSettings);

	return generator;
}

export function calculatePriorityFee(inputs: number, outputs: number) {
	return kasToSompi(((inputs + outputs) * 0.1).toString());
}