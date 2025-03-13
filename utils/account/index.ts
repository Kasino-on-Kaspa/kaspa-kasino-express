import { users } from "../../schema/users.schema";
import { ObservableData } from "../observables/data";
export class Account {
  private _id: string;
  private _address: string;
  private _xOnlyPublicKey: string;
  private _username: string | null;
  private _wallet: string;
  private balance: ObservableData<number>;

  constructor(user: typeof users.$inferSelect) {
    this._id = user.id;
    this._address = user.address;
    this._xOnlyPublicKey = user.xOnlyPublicKey;
    this._username = user.username;
    this._wallet = user.wallet;
    this.balance = new ObservableData<number>(user.balance);
  }

  public async AddBalance(offset: number) {
    this.balance.SetData(this.balance.GetData() + offset);
  }

  public async RemoveBalance(offset: number) {
    this.balance.SetData(this.balance.GetData() - offset);
  }

  public get Balance() {
    return this.balance;
  }

  public get Address() {
    return this._address;
  }

  public get Id() {
    return this._id;
  }
}