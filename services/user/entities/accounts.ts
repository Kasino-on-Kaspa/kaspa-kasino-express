import { eq } from "drizzle-orm";
import { DB } from "../../../database";
import { users } from "../../../schema/users.schema";
import { Account } from "../../../utils/account";
import { Socket, Server } from "socket.io";

const MIN_UPDATE_DELAY = 10000;

export class AccountStore {
  private _userHandshake: { [socket_id: string]: string } = {};
  private _userAccounts: { [account_id: string]: Account } = {};
  private updater?: NodeJS.Timeout;
  private readonly io: Server;

  public async AddUserHandshake(socket: Socket, account_id: string) {
    this._userHandshake[socket.id] = account_id;

    // Store account by account_id, not socket_id
    let account = this._userAccounts[account_id];

    if (!account) {
      account = await this.GetAccountFromDB(account_id);
    }
    account.AssociatedSockets.AddSockets(socket);
    
  }

  constructor(io: Server) {
    this.io = io;
  }

  private async GetAccountFromDB(account_id: string) {
    let result = await DB.select()
      .from(users)
      .where(eq(users.id, account_id))
      .limit(1);
    let account = new Account(result[0], this.io);
    this._userAccounts[account_id] = account;
    return account;
  }

  public InstantiateDatabaseTimer(interval: number) {
    this.updater = setInterval(async () => {
      await this.UpdateDatabase();
    }, interval);
  }

  public DestroyDatabaseTimer() {
    if (!this.updater) return;

    clearInterval(this.updater);
    this.updater = undefined;
  }

  public async RemoveUserHandshake(socket: Socket) {
    let account = this._userAccounts[this._userHandshake[socket.id]];
    account.AssociatedSockets.RemoveSocket(socket);

    delete this._userHandshake[socket.id];
  }

  public GetUserHandshake(socket_id: string) {
    return this._userHandshake[socket_id];
  }

  public GetUserFromHandshake(socket_id: string) {
    return this._userAccounts[this._userHandshake[socket_id]];
  }

  public GetUserFromAccountID(account_id: string) {
    return this._userAccounts[account_id];
  }

  public async UpdateDatabaseForAccount(account: Account) {
    await account.UpdateAccountDB();
  }

  private async UpdateDatabase() {
    for (let account of Object.values(this._userAccounts)) {
      account.UpdateAccountDB();
    }
  }
  
}
