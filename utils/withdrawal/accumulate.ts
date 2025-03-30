import { RpcUtxosByAddressesEntry } from "@kcoin/kaspa-web3.js/dist/rpc/types";
import { buildTransactionGenerator, calculatePriorityFee } from "./tx-builder";
import { Address, SignedType } from "@kcoin/kaspa-web3.js";
import { rpcClient } from "../wallet";

export async function createAccumulationTransaction(
	inputs: RpcUtxosByAddressesEntry[],
    privateKeysHex: string[],
) {
	const netUtxoValue = inputs.reduce((acc, curr) => {
		return acc + curr.utxoEntry!.amount;
	}, 0);
	const calculatedFee = calculatePriorityFee(inputs.length, 1);

	const generator = buildTransactionGenerator({
		outputs: [
			{
				address: Address.fromString(process.env.MASTER_ADDRESS!),
				amount: BigInt(netUtxoValue - Number(calculatedFee) * 1.01),
			},
		],
		utxos: inputs,
	});

    let txHash: string | null = null;

    try {
        const tx = generator.generateTransaction();

        if(!tx) {
            throw new Error("Transaction generation failed");
        }

        const signedTx = tx.sign(privateKeysHex, true)

        if(!signedTx) {
            throw new Error("Transaction signing failed");
        }

        if (signedTx.type == SignedType.Partially) {
            throw new Error("Transaction is not fully signed");
        }

        const broadcastedTx = await rpcClient.submitTransaction({
            transaction: signedTx.toSubmittableJsonTx(),
            allowOrphan: false
        });

        txHash = broadcastedTx.transactionId

    } catch (e) {
        console.log(e)
    }

    if(!txHash) {
        console.error("Fatal error: transaction was not broadcasted")
        return null
    }

    return txHash
}
