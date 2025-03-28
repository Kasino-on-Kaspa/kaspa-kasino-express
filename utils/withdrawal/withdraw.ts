import { RpcUtxosByAddressesEntry } from "@kcoin/kaspa-web3.js/dist/rpc/types";
import { buildTransactionGenerator, calculatePriorityFee } from "./tx-builder";
import { Address, PaymentOutput, SignedType, kaspaToSompi } from "@kcoin/kaspa-web3.js";
import { rpcClient } from "../wallet";

const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000; // 30 seconds timeout
const RETRY_DELAY_MS = 2000; // 1 second delay between retries
const DUST_THRESHOLD = kaspaToSompi("1")

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    return Promise.race([promise, timeout]);
}

async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = MAX_RETRIES,
    delayMs: number = RETRY_DELAY_MS
): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            const errorMessage = JSON.stringify(error)
            
            if (attempt === maxRetries) break;
            
            console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms... Error: ${errorMessage}`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    
    throw lastError;
}

export async function createWithdrawalTransaction(
	outputs: PaymentOutput[]
) {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const rawUtxos = await withRetry(async () => 
                withTimeout(rpcClient.getUtxosByAddresses([process.env.MASTER_ADDRESS!]), TIMEOUT_MS)
            );
            const dagInfo = await withRetry(async () => 
                withTimeout(rpcClient.getBlockDagInfo(), TIMEOUT_MS)
            );

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
                        console.log(`Skipping immature coinbase UTXO: ${entry.outpoint?.transactionId || 'unknown'}`);
                        continue;
                    }
                } else {
                    // For regular UTXOs, check if they are mature (utxoDaaScore < virtualDaaScore)
                    if (utxoDaaScore >= virtualDaaScore) {
                        console.log(`Skipping immature UTXO: ${entry.outpoint?.transactionId || 'unknown'}`);
                        continue;
                    }

                    if(entry.utxoEntry!.amount < DUST_THRESHOLD) {
                        console.log(`Skipping dust UTXO: ${entry.outpoint?.transactionId || 'unknown'}`);
                        continue;
                    }
                }

                utxos.entries.push(entry);
            }

            if (utxos.entries.length === 0) {
                console.error("No mature UTXOs available for withdrawal");
                return null;
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

            const broadcastedTx = await withRetry(async () => 
                withTimeout(
                    rpcClient.submitTransaction({
                        transaction: signedTx.toSubmittableJsonTx(),
                        allowOrphan: true
                    }),
                    TIMEOUT_MS
                )
            );

            return broadcastedTx.transactionId;

        } catch (e) {
            lastError = e as Error;
            console.error(`Attempt ${attempt} failed:`, e);
            
            if (attempt === MAX_RETRIES) {
                console.error("All retry attempts failed");
                return null;
            }
            
            console.log(`Retrying entire withdrawal process in ${RETRY_DELAY_MS}ms...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }

    return null;
}