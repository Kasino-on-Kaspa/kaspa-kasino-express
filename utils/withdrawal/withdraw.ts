import { RpcUtxosByAddressesEntry } from "@kcoin/kaspa-web3.js/dist/rpc/types";
import { buildTransactionGenerator, calculatePriorityFee } from "./tx-builder";
import { Address, PaymentOutput, SignedType, kaspaToSompi } from "@kcoin/kaspa-web3.js";
import { rpcClient } from "../wallet";

const TIMEOUT_MS = 30000; // 30 seconds timeout
const DUST_THRESHOLD = kaspaToSompi("1")

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    return Promise.race([promise, timeout]);
}

export async function createWithdrawalTransaction(
	outputs: PaymentOutput[]
) {
    try {
        const rawUtxos = await withTimeout(rpcClient.getUtxosByAddresses([process.env.MASTER_ADDRESS!]), TIMEOUT_MS);
        const dagInfo = await withTimeout(rpcClient.getBlockDagInfo(), TIMEOUT_MS);

        // Filter and check UTXO maturity
        const utxos = { error: rawUtxos.error, entries: [] as RpcUtxosByAddressesEntry[] };
        
        for (const entry of rawUtxos.entries) {
            if (!entry.utxoEntry) continue;

            const isCoinbase = entry.utxoEntry.isCoinbase;
            const utxoDaaScore = entry.utxoEntry.blockDaaScore;
            const virtualDaaScore = dagInfo.virtualDaaScore;

            // For coinbase UTXOs, check if they are mature (virtualDaaScore - utxoDaaScore >= 1000)
            if (isCoinbase) {
                if (virtualDaaScore - utxoDaaScore < 1000) {
                    continue;
                }
            } else {
                // For regular UTXOs, check if they are mature (utxoDaaScore < virtualDaaScore)
                if (utxoDaaScore >= virtualDaaScore) {  
                    continue;
                }

                if(entry.utxoEntry!.amount < DUST_THRESHOLD) {
                    continue;
                }
            }

            utxos.entries.push(entry);
        }

        if (utxos.entries.length === 0) {
            console.error("No mature UTXOs available for withdrawal");
            throw new Error("No mature UTXOs available for withdrawal");
        }
        console.log("UTXOs found: ", utxos.entries.length)

        const generator = buildTransactionGenerator({
            outputs: outputs,
            utxos: utxos.entries,
        });

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

        const broadcastedTx = await withTimeout(
            rpcClient.submitTransaction({
                transaction: signedTx.toSubmittableJsonTx(),
                allowOrphan: true
            }),
            TIMEOUT_MS
        );

        return broadcastedTx.transactionId;

    } catch (e) {
        console.error("Withdrawal transaction failed:", e);
        throw e; // Re-throw the error to be handled by withdrawal-queue.ts
    }
}