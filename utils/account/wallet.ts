import { DB } from "@/database";
import { eq } from "drizzle-orm";
import { wallets } from "@schema/wallets.schema";
import { ObservableData } from "@utils/observables/data";
import { ObservableEvent } from "@utils/observables/event";
import { WalletDBQueueHandler } from "@utils/queue-manager/wallet-updater";

export class Wallet {
  private _id: string;
  private _address: string;
  private _balance: ObservableData<bigint>;

  private _isUpdated: boolean = false;

  public readonly OnUpdate = new ObservableEvent<{balance: string}>();

  private readonly walletDBQueue: WalletDBQueueHandler;

  constructor(wallet: typeof wallets.$inferSelect, walletDBQueue: WalletDBQueueHandler) {
    this._id = wallet.id;
    this._address = wallet.address;
    this._balance = new ObservableData<bigint>(BigInt(wallet.balance));
    this.walletDBQueue = walletDBQueue;
  }

  public static async InitWallet(wallet_id: string, walletDBQueue: WalletDBQueueHandler) {
    let result = await DB.select()
      .from(wallets)
      .where(eq(wallets.id, wallet_id))
      .limit(1);

    return new Wallet(result[0], walletDBQueue);
  }

  public async AddBalance(amount: bigint, reason: "BET_RETURN"| "BET"|"DEPOSIT"|"WITHDRAWAL" ) {
    let oldBalance = this._balance.GetData();
    let newBalance = this._balance.GetData() + amount;
    this._balance.SetData(newBalance);
    
    await this.walletDBQueue.AddOrUpdateWalletBalanceTask(this._id, oldBalance, newBalance, reason);
    this.OnUpdate.Raise({balance: this._balance.GetData().toString()})
  }
  
  public async RemoveBalance(amount: bigint, reason: "BET_RETURN"| "BET"|"DEPOSIT"|"WITHDRAWAL" ) {
    let oldBalance = this._balance.GetData();
    let newBalance = this._balance.GetData() - amount;
    this._balance.SetData(newBalance);
    await this.walletDBQueue.AddOrUpdateWalletBalanceTask(this._id, oldBalance, newBalance, reason);
    this.OnUpdate.Raise({balance: this._balance.GetData().toString()})
  }


  public get id() {
    return this._id;
  }

  public get address() {
    return this._address;
  }

  public get balance(){
    return this._balance
  }
}