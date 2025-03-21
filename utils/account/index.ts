import { Server } from "socket.io";
import { DB } from "../../database";
import { balance_log, E_BALANCE_LOG_TYPE } from "../../schema/balance.schema";
import { users } from "../../schema/users.schema";
import { ObservableData } from "../observables/data";
import { ObservableEvent } from "../observables/event";
import { AccountSockets } from "./sockets";

export class Account {
  private _id: string;
  private _address: string;
  private _xOnlyPublicKey: string;
  private _username: string | null;
  private _wallet: string;

  private balance: ObservableData<bigint>;

  private isUpdated: boolean = false;

  public readonly AssociatedSockets: AccountSockets;


  constructor(user: typeof users.$inferSelect, io: Server) {
    this._id = user.id;
    this._address = user.address;
    this._xOnlyPublicKey = user.xOnlyPublicKey;
    this._username = user.username;
    this._wallet = user.wallet;
    this.balance = new ObservableData<bigint>(BigInt(user.balance));
    this.AssociatedSockets = new AccountSockets(io, this._id);
  }


  public async AddBalance(
    offset: bigint,
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
    offset: bigint,
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
