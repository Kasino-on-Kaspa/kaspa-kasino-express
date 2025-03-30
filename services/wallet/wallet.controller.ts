import { DB } from "../../database";
import { eq } from "drizzle-orm";
import { WalletBalanceProvider } from "../../utils/wallet/balance";
import { utxos } from "../../schema/utxos.schema";
import { AccountStoreInstance, WalletDBQueueInstance } from "../..";
import { rpcClient } from "../../utils/wallet";
import { Socket } from "socket.io";
import { WithdrawalQueue } from "@utils/withdrawal/withdrawal-queue";

export class WalletController {
  async updateWalletBalance(socket: Socket) {
    const account = AccountStoreInstance.GetUserFromHandshake(socket.id);
    
    if (!account) {
      throw new Error("Account not found in store");
    }

    // Get all UTXOs from the blockchain
    const allUtxos = await WalletBalanceProvider.getUtxos([
      account.Wallet.address,
    ]);

    // Get all UTXOs we've already seen
    const seenUtxos = await DB.select()
      .from(utxos)
      .where(eq(utxos.address, account.Wallet.address));

    const dagInfo = await rpcClient.getBlockDagInfo();

    // Find UTXOs that we haven't seen before
    const unseenUtxos = allUtxos.filter((utxo) => {
      // Check if this UTXO is already in our database
      return !seenUtxos.some(
        (seenUtxo) =>
          seenUtxo.txId === utxo.outpoint?.transactionId &&
          seenUtxo.vout === utxo.outpoint?.index &&
          // Check "confirmation"
          utxo.utxoEntry!.blockDaaScore < dagInfo.virtualDaaScore
      );
    });

    // Calculate the balance change from new UTXOs (in SOMPI)
    let balanceDelta = BigInt(0);

    for (const utxo of unseenUtxos) {
      if (utxo.utxoEntry?.amount) {
        balanceDelta += BigInt(utxo.utxoEntry.amount);
      }
    }

    // Map the unseen UTXOs to our database format
    const utxoMap = unseenUtxos.map((u) => {
      return {
        address: u.address,
        amount: BigInt(u.utxoEntry!.amount),
        txId: u.outpoint!.transactionId,
        vout: u.outpoint!.index,
        scriptPubKey: u.utxoEntry!.scriptPublicKey,
        blockDaaScore: u.utxoEntry!.blockDaaScore,
      };
    });

    // Insert the new UTXOs into the database
    if (utxoMap.length == 0) return;

    await DB.insert(utxos).values(utxoMap);

    if (balanceDelta <= 0) return;

    if (!account.IsDeleted)
      return await account.Wallet.AddBalance(balanceDelta, "DEPOSIT");

    let oldBalance = account.Wallet.balance.GetData();
    let newBalance = oldBalance + balanceDelta;
    WalletDBQueueInstance.AddOrUpdateWalletBalanceTask(
      account.Wallet.id,
      oldBalance,
      newBalance,
      "DEPOSIT"
    );
  }

  GetWalletFromSocket(socket: Socket) {
    const account = AccountStoreInstance.GetUserFromHandshake(socket.id);
    return account?.Wallet;
  }

  async HandleWalletWithdraw(
    socket: Socket,
    user_address: string,
    amount: bigint
  ) {
    const account = AccountStoreInstance.GetUserFromHandshake(socket.id);
    if (!account) return;

    await account.Wallet.RemoveBalance(amount, "WITHDRAWAL");
    WithdrawalQueue.Instance.add(user_address, amount, account!.Id);
  }
}
