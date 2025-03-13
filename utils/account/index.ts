import { DB } from "../../database";
import { balance_log, E_BALANCE_LOG_TYPE } from "../../schema/balance.schema";
import { users } from "../../schema/users.schema";
import { ObservableData } from "../observables/data";
export class Account {
  private _id: string;
  private _address: string;
  private _xOnlyPublicKey: string;
  private _username: string | null;
  private _wallet: string;
  private balance: ObservableData<number>;

  private isUpdated: boolean = false;

  private connection_sockets: string[] = [];

  constructor(user: typeof users.$inferSelect) {
    this._id = user.id;
    this._address = user.address;
    this._xOnlyPublicKey = user.xOnlyPublicKey;
    this._username = user.username;
    this._wallet = user.wallet;
    this.balance = new ObservableData<number>(user.balance);
  }

  public AddSockets(socket_id: string) {
    this.connection_sockets.push(socket_id);
  }

  public RemoveSocket(socket_id: string) {
    this.connection_sockets.splice(
      this.connection_sockets.indexOf(socket_id),
      1
    );
  }

  public async AddBalance(
    offset: number,
    type: (typeof E_BALANCE_LOG_TYPE.enumValues)[number]
  ) {
    this.balance.SetData(this.balance.GetData() + offset);
    await DB.insert(balance_log).values({
      account: this._id,
      amount: offset,
      type: type,
    });
    this.isUpdated = true;
  }

  public async UpdateAccountDB() {
    if (!this.isUpdated) return;
    await DB.update(users).set({
      balance: this.Balance.GetData(),
    });
    this.isUpdated = false;
  }

  public async RemoveBalance(
    offset: number,
    type: (typeof E_BALANCE_LOG_TYPE.enumValues)[number]
  ) {
    this.balance.SetData(this.balance.GetData() - offset);
    await DB.insert(balance_log).values({
      account: this._id,
      amount: offset,
      type: type,
    });
    this.isUpdated = true;
  }

  public get AssociatedSockets() {
    return this.connection_sockets;
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
