import { DB } from "../../database";
import { users } from "../../schema/users.schema";
import { eq } from "drizzle-orm";
import { wallets } from "../../schema/wallets.schema";
import { WalletBalanceProvider } from "../../utils/wallet/balance";
import { utxos } from "../../schema/utxos.schema";

export class WalletService {
  static async getUserWallet(userAddress: string) {
    const user = await DB.select()
      .from(users)
      .where(eq(users.address, userAddress))
      .leftJoin(wallets, eq(users.wallet, wallets.id));

    if (!user[0] || !user[0].wallets) {
      throw new Error("Wallet not found");
    }

    return {
      walletAddress: user[0].wallets.address,
      balance: user[0].users.balance,
      userId: user[0].users.id
    };
  }

  /**
   * Updates the wallet balance by checking for new UTXOs
   * @param userAddress The user's address
   * @returns Object containing the new balance in SOMPI and count of new transactions
   */
  static async updateWalletBalance(userAddress: string) {
    const userWallet = await this.getUserWallet(userAddress);
    
    // Get all UTXOs from the blockchain
    const allUtxos = await WalletBalanceProvider.getUtxos([userWallet.walletAddress]);
    console.log("DEPOSIT ADDRESS", userWallet.walletAddress)
    // Get all UTXOs we've already seen
    const seenUtxos = await DB.select()
      .from(utxos)
      .where(eq(utxos.address, userWallet.walletAddress));

    // Find UTXOs that we haven't seen before
    const unseenUtxos = allUtxos.filter(utxo => {
      // Check if this UTXO is already in our database
      return !seenUtxos.some(seenUtxo => 
        seenUtxo.txId === utxo.outpoint?.transactionId && 
        seenUtxo.vout === utxo.outpoint?.index
      );
    });

    // Calculate the balance change from new UTXOs (in SOMPI)
    let balanceDelta = 0;
    for (const utxo of unseenUtxos) {
      if (utxo.utxoEntry?.amount) {
        balanceDelta += utxo.utxoEntry.amount; // UTXOs are already in SOMPI
      }
    }

    // Map the unseen UTXOs to our database format
    const utxoMap = unseenUtxos.map((u) => {
      return {
        address: u.address,
        amount: u.utxoEntry!.amount,
        txId: u.outpoint!.transactionId,
        vout: u.outpoint!.index,
        scriptPubKey: u.utxoEntry!.scriptPublicKey,
      };
    });

    // Insert the new UTXOs into the database
    if (utxoMap.length > 0) {
      await DB.insert(utxos).values(utxoMap);
    }
    
    const newBalance = userWallet.balance + balanceDelta;

    // Update the user's balance
    await DB.update(users)
      .set({ balance: newBalance })
      .where(eq(users.address, userAddress));

    return {
      balance: newBalance, // Balance in SOMPI
      newTransactions: utxoMap.length
    };
  }
} 