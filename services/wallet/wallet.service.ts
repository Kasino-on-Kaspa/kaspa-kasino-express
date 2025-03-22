import { DB } from "../../database";
import { users } from "../../schema/users.schema";
import { eq } from "drizzle-orm";
import { wallets } from "../../schema/wallets.schema";
import { WalletBalanceProvider } from "../../utils/wallet/balance";
import { utxos } from "../../schema/utxos.schema";
import { AccountStoreInstance } from "../..";
import { rpcClient } from "../../utils/wallet";

export class WalletService {
  static async getDepositWallet(wallet_id: string) {
    try {
      const wallet = await DB.select()
        .from(wallets)
        .where(eq(wallets.id, wallet_id));
      return wallet[0];
    } catch (e) {
      console.error(e);
      throw new Error("Wallet not found");
    }
  }

  static async getUserWallet(userId: string) {
    const user = await DB.select()
      .from(users)
      .where(eq(users.id, userId))
      .leftJoin(wallets, eq(users.wallet, wallets.id));

    if (!user[0] || !user[0].wallets) {
      throw new Error("Wallet not found");
    }

    return {
      walletAddress: user[0].wallets.address,
      balance: user[0].users.balance,
      userId: user[0].users.id,
    };
  }

  /**
   * Updates the wallet balance by checking for new UTXOs
   * @param userId The user's ID
   * @returns Object containing the new balance in SOMPI and count of new transactions
   */
  static async updateWalletBalance(userId: string) {
    const userWallet = await this.getUserWallet(userId);

    // Get account from store to use its balance methods
    const account = AccountStoreInstance.GetUserFromAccountID(
      userId
    );

    if (!account) {
      throw new Error("Account not found in store");
    }

    // Get all UTXOs from the blockchain
    const allUtxos = await WalletBalanceProvider.getUtxos([
      userWallet.walletAddress,
    ]);

    // Get all UTXOs we've already seen
    const seenUtxos = await DB.select()
      .from(utxos)
      .where(eq(utxos.address, userWallet.walletAddress));

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
      };
    });

    // Insert the new UTXOs into the database
    if (utxoMap.length > 0) {
      await DB.insert(utxos).values(utxoMap);

      // Use account method to add balance instead of direct DB update
      if (balanceDelta > 0) {
        await account?.AddBalance(balanceDelta, "DEPOSIT");
        // await account.UpdateAccountDB();
      }
    }
    return {
      balance: account.Balance.GetData().toString(),
      newTransactions: utxoMap.length,
    };
  }
}
