import { users } from "../../schema/users.schema";

export class Account {
  private _id: string;
  private _address: string;
  private _xOnlyPublicKey: string;
  private _username: string | null;
  private _wallet: string;
  private balance: number;

  constructor(user: typeof users.$inferSelect) {
    this._id = user.id;
    this._address = user.address;
    this._xOnlyPublicKey = user.xOnlyPublicKey;
    this._username = user.username;
    this._wallet = user.wallet;
    this.balance = user.balance;
  }

  public async AddBalance(offset: number) {
    this.balance += offset;
  }

  public async RemoveBalance(offset: number) {
    this.balance -= offset;
  }

  public get Balance() {
    return this.balance;
  }
  public get Id() {
    return this._id;
  }
}
