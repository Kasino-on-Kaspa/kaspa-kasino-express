import { RpcUtxosByAddressesEntry } from "@kcoin/kaspa-web3.js/dist/rpc/types";
import { buildTransactionGenerator, calculatePriorityFee } from "./tx-builder";
import { Address, PaymentOutput, SignedType } from "@kcoin/kaspa-web3.js";
import { rpcClient } from "../wallet";

export async function createWithdrawalTransaction(
	outputs: PaymentOutput[]
) {
    const rawUtxos = await rpcClient.getUtxosByAddresses([process.env.MASTER_ADDRESS!])
    
    // TODO: Handle coinbase utxos
    const utxos = {error: rawUtxos.error, entries: rawUtxos.entries.filter(e => !e.utxoEntry?.isCoinbase)}

	const generator = buildTransactionGenerator({
		outputs: outputs,
		utxos: utxos.entries,
	});

    let txHash: string | null = null;

    try {
        const tx = generator.generateTransaction();

        if(!tx) {
            throw new Error("Transaction generation failed");
        }

        const signedTx = tx.sign([process.env.MASTER_PRIVATE_KEY!], true)

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
