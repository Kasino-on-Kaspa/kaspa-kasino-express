import { Server, Socket } from "socket.io";
import { users } from "../../schema/users.schema";
import { AccountSockets } from "./sockets";
import { Wallet } from "./wallet";
import { WalletDBQueueHandler } from "@utils/queue-manager/wallet-updater";
export class Account {
  private _id: string;
  private _address: string;
  private _username: string | null;
  private _wallet: Wallet;

  private isDeleted: boolean = false;

  public readonly AssociatedSockets: AccountSockets;

  constructor(user: typeof users.$inferSelect, wallet: Wallet, io: Server) {
    this._id = user.id;
    this._address = user.address;
    this._username = user.username;
    this._wallet = wallet;

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
    walletDBQueue: WalletDBQueueHandler
  ) {
    let wallet = await Wallet.InitWallet(user.wallet, walletDBQueue);
    return new Account(user, wallet, io);
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
