import { Server, Socket } from "socket.io";
import { users } from "../../schema/users.schema";
import { AccountSockets } from "./sockets";
import { Wallet } from "./wallet";
import { AccountStore } from "@services/user/entities/accounts";
export class Account {
  private _id: string;
  private _address: string;
  private _username: string | null;
  private _wallet: Wallet;
  
  private _referral: string | null;
  private _referral_account: Account | null;
  private isDeleted: boolean = false;

  public readonly AssociatedSockets: AccountSockets;

  constructor(user: typeof users.$inferSelect, wallet: Wallet, referral: string | null,referral_account: Account | null, io: Server) {
    this._id = user.id;
    this._address = user.address;
    this._username = user.username;
    this._wallet = wallet;
    this._referral = referral;
    this._referral_account = referral_account;
    this.AssociatedSockets = new AccountSockets(io, this._id);

    this.AssociatedSockets.OnSocketAdded.RegisterEventListener(
      async (socket) => {
        this.RegisterSocketEvents(socket);
      }
    );
  }

  public static async InitAccount(
    user: typeof users.$inferSelect,
    io: Server,
    accountStore: AccountStore
  ) {
    let refereal_account: Account | null = null;
    
    if (user.referredBy) {
      refereal_account = accountStore.GetUserFromAccountID(user.referredBy);
    }

    let wallet = await Wallet.InitWallet(user.wallet);

    return new Account(user, wallet, user.referredBy, refereal_account, io);
  }

  private RegisterSocketEvents(socket: Socket) {
    socket.emit("account:handshake", {
      address: this._address,
      wallet: this._wallet.address,
      id: this._id,
      username: this._username,
      balance: this._wallet.balance.GetData().toString(),
    });

    socket.on("disconnect", async () => {
      this.AssociatedSockets.RemoveSocket(socket);
    });
  }

  public get Referral() {
    return this._referral;
  }

  public get Address() {
    return this._address;
  }

  public get Id() {
    return this._id;
  }

  public get Wallet() {
    return this._wallet;
  }

  public get IsDeleted() {
    return this.isDeleted;
  }

  public set IsDeleted(value: boolean) {
    if (this.isDeleted) return;
    this.isDeleted = value;
  }
}
