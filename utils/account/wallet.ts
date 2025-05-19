import { DB } from "@/database";
import { eq } from "drizzle-orm";
import { wallets } from "@schema/wallets.schema";
import { ObservableData } from "@utils/observables/data";
import { ObservableEvent } from "@utils/observables/event";
import { EventBus } from "@utils/eventbus";
import { resolve } from "path";
import { bigint } from "drizzle-orm/gel-core";

export class Wallet {
  private _id: string;
  private _address: string;
  private _balance: ObservableData<bigint>;


  public readonly OnUpdate = new ObservableEvent<{balance: string}>();


  constructor(wallet: typeof wallets.$inferSelect) {
    this._id = wallet.id;
    this._address = wallet.address;
    this._balance = new ObservableData<bigint>(BigInt(wallet.balance));
    this.RegisterEventListeners();
  }

  private RegisterEventListeners() {
    EventBus.Instance.on("wallet:updated", async ({id, delta}) => {
      this.HandleWalletUpdated(id, delta);
    });
  }

  private HandleWalletUpdated(id: string, delta: bigint) {
    if (id !== this._id) return;
    this._balance.SetData(BigInt(this._balance.GetData()) + BigInt(delta));
    this.OnUpdate.Raise({balance: this._balance.GetData().toString()});
  }

  public static async InitWallet(wallet_id: string) {
    let result = await DB.select()
      .from(wallets)
      .where(eq(wallets.id, wallet_id))
      .limit(1);
    
    if (result.length <= 0) return null;
    
    let delta = await new Promise<bigint>((resolve) => EventBus.Instance.emit("wallet:get_delta", {id: wallet_id, resolver: (delta: bigint) => {
      resolve(delta);
    }}));

    console.log("before", result[0].balance);
    result[0].balance += delta;
    console.log("after", result[0].balance);

    return new Wallet(result[0]);
  }

  public async AddBalance(amount: bigint) {
    let newBalance = this._balance.GetData() + amount;
    this._balance.SetData(newBalance);
    
    this.OnUpdate.Raise({balance: this._balance.GetData().toString()})
  }
  
  public async RemoveBalance(amount: bigint) {
    let newBalance = this._balance.GetData() - amount;
    this._balance.SetData(newBalance);
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