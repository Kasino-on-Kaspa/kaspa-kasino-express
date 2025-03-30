import { DB } from "@/database";
import { RpcUtxosByAddressesEntry } from "@kcoin/kaspa-web3.js/dist/rpc/types";
import { utxos } from "@schema/utxos.schema";
import { eq } from "drizzle-orm";

type DBUtxoRecord = typeof utxos.$inferSelect

class Accumulator {
    private static instance: Accumulator;
    private utxos: RpcUtxosByAddressesEntry[] = []
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

    }

    public async sync() {
        if (this.isSyncing) return;
        this.isSyncing = true;
        const dbUtxos = await DB.select().from(utxos).where(eq(utxos.spent, false));
        this.utxos = this.dbRecordsToRpcUtxo(dbUtxos);
        this.isSyncing = false;
    }


    private dbRecordsToRpcUtxo(records: DBUtxoRecord[]): RpcUtxosByAddressesEntry[] {
        return records.map(record => ({
            address: record.address,
            outpoint: {
                transactionId: record.txId,
                index: record.vout
            },
            utxoEntry: {
                amount: Number(record.amount),
                scriptPublicKey: record.scriptPubKey,
                blockDaaScore: record.blockDaaScore,
                isCoinbase: false
            }
        }));
    }

}